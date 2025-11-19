import axios, { AxiosInstance } from 'axios';
import { Transaction, Balance } from '../types';
import logger from '../utils/logger';
import blockchainApi from './blockchainApi';

interface BlockchairAddressData {
  address: {
    balance: number;
    balance_usd: number;
    received: number;
    spent: number;
    tx_count: number;
  };
  transactions: number[];
}

interface BlockchairTransaction {
  hash: string;
  time: string;
  block_id: number;
  balance_change: number;
  fee: number;
}

interface BlockchairResponse {
  data: {
    [address: string]: BlockchairAddressData;
  };
}

interface BlockchairTransactionResponse {
  data: {
    [txHash: string]: BlockchairTransaction;
  };
}

class BitcoinApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private lastRequestTime: number = 0;
  private minDelayBetweenRequests: number = 5000; // 5 seconds minimum to respect rate limits

  constructor() {
    this.baseUrl = process.env.BLOCKCHAIR_API_URL || 'https://api.blockchair.com/bitcoin';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'BitSync/1.0',
      },
    });
  }

  private async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minDelayBetweenRequests) {
      const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 10000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 430) {
          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt);
            logger.warn(`Rate limited. Retrying in ${delay / 1000} seconds... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  async getAddressBalance(address: string): Promise<Balance> {
    return this.retryWithBackoff(async () => {
      await this.waitIfNeeded();
      
      const response = await this.client.get<BlockchairResponse>(
        `/dashboards/address/${address}?limit=0`
      );

      const addressData = response.data.data[address];
      if (!addressData) {
        throw new Error(`Address ${address} not found`);
      }

      const confirmedBalance = addressData.address.balance || 0;
      const unconfirmedBalance = 0;

      return {
        addressId: address, // This will be replaced by syncService
        confirmedBalance,
        unconfirmedBalance,
        lastUpdated: new Date(),
      };
    });
  }

  async getAddressTransactions(address: string): Promise<BlockchairTransaction[]> {
    return this.retryWithBackoff(async () => {
      await this.waitIfNeeded();
      
      const response = await this.client.get<BlockchairResponse>(
        `/dashboards/address/${address}?limit=100&offset=0`
      );

      const addressData = response.data.data[address];
      if (!addressData || !addressData.transactions || addressData.transactions.length === 0) {
        return [];
      }

      const txHashes = addressData.transactions.slice(0, 100);
      if (txHashes.length === 0) {
        return [];
      }

      await this.waitIfNeeded();

      const txHashesStr = txHashes.join(',');
      const txResponse = await this.client.get<BlockchairTransactionResponse>(
        `/dashboards/transactions/${txHashesStr}`
      );

      return Object.values(txResponse.data.data || {});
    });
  }

  async syncAddress(address: string, addressId: string): Promise<{
    balance: Balance;
    transactions: Transaction[];
  }> {
    try {
      // Try Blockchair first
      try {
        const balance = await this.getAddressBalance(address);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const blockchairTxs = await this.getAddressTransactions(address);

        const transactions: Transaction[] = blockchairTxs.map((tx) => {
          const isReceived = tx.balance_change > 0;
          return {
            id: `${addressId}-${tx.hash}`,
            addressId,
            txHash: tx.hash,
            blockHeight: tx.block_id,
            timestamp: new Date(tx.time),
            amount: Math.abs(tx.balance_change),
            type: isReceived ? 'received' : 'sent',
            confirmations: tx.block_id > 0 ? 6 : 0,
            fee: tx.fee || 0,
          };
        });

        return { balance, transactions };
      } catch (blockchairError) {
        // If Blockchair fails with rate limit, try Blockchain.com as fallback
        if (axios.isAxiosError(blockchairError) && blockchairError.response?.status === 430) {
          logger.warn('Blockchair rate limited, trying Blockchain.com as fallback...');
          const result = await blockchainApi.getAddressData(address);
          return {
            balance: {
              ...result.balance,
              addressId: addressId, // Use UUID, not Bitcoin address
            },
            transactions: result.transactions.map(tx => ({
              ...tx,
              id: `${addressId}-${tx.txHash}`,
              addressId: addressId, // Fix: Use UUID instead of Bitcoin address
            })),
          };
        }
        throw blockchairError;
      }
    } catch (error) {
      logger.error('Error syncing address:', error);
      throw error;
    }
  }
}

const bitcoinApi = new BitcoinApiClient();

export default bitcoinApi;

