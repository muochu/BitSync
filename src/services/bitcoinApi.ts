import axios, { AxiosInstance } from 'axios';
import { Transaction, Balance } from '../types';
import logger from '../utils/logger';

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

  constructor() {
    this.baseUrl = process.env.BLOCKCHAIR_API_URL || 'https://api.blockchair.com/bitcoin';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent': 'BitSync/1.0',
      },
    });
  }

  async getAddressBalance(address: string): Promise<Balance> {
    try {
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
        addressId: address,
        confirmedBalance,
        unconfirmedBalance,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Error fetching balance:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`API error: ${error.message}`);
      }
      throw error;
    }
  }

  async getAddressTransactions(address: string): Promise<BlockchairTransaction[]> {
    try {
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

      const txHashesStr = txHashes.join(',');
      const txResponse = await this.client.get<BlockchairTransactionResponse>(
        `/dashboards/transactions/${txHashesStr}`
      );

      return Object.values(txResponse.data.data || {});
    } catch (error) {
      logger.error('Error fetching transactions:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`API error: ${error.message}`);
      }
      throw error;
    }
  }

  async syncAddress(address: string, addressId: string): Promise<{
    balance: Balance;
    transactions: Transaction[];
  }> {
    try {
      const [balance, blockchairTxs] = await Promise.all([
        this.getAddressBalance(address),
        this.getAddressTransactions(address),
      ]);

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
    } catch (error) {
      logger.error('Error syncing address:', error);
      throw error;
    }
  }
}

const bitcoinApi = new BitcoinApiClient();

export default bitcoinApi;

