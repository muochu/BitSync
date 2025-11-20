import axios from 'axios';
import { Transaction, Balance, SATOSHIS_PER_BTC } from '../types';
import logger from '../utils/logger';

interface BlockchainResponse {
  hash160: string;
  address: string;
  n_tx: number;
  n_unredeemed: number;
  total_received: number;
  total_sent: number;
  final_balance: number;
  txs: BlockchainTransaction[];
}

interface BlockchainTransaction {
  hash: string;
  time: number;
  block_height?: number;
  inputs: Array<{ prev_out: { value: number } }>;
  out: Array<{ value: number; addr?: string }>;
}

class BlockchainApiClient {
  private baseUrl = 'https://blockchain.info';
  private cachedBTCPrice: { price: number; timestamp: number } | null = null;
  private BTC_PRICE_CACHE_TTL = 60000; // 1 minute cache

  private async getBTCPrice(): Promise<number> {
    // Check cache first
    if (this.cachedBTCPrice && Date.now() - this.cachedBTCPrice.timestamp < this.BTC_PRICE_CACHE_TTL) {
      return this.cachedBTCPrice.price;
    }

    try {
      const response = await axios.get('https://api.coincap.io/v2/assets/bitcoin', { timeout: 5000 });
      const price = parseFloat(response.data?.data?.priceUsd || '0');
      
      if (price > 0) {
        this.cachedBTCPrice = { price, timestamp: Date.now() };
        return price;
      }
    } catch (error) {
      logger.warn('Failed to fetch BTC price, using cached or default');
    }

    // Return cached price if available, otherwise default to 0
    return this.cachedBTCPrice?.price || 0;
  }

  async getAddressData(address: string): Promise<{
    balance: Balance;
    transactions: Transaction[];
  }> {
    try {
      const response = await axios.get<BlockchainResponse>(
        `${this.baseUrl}/rawaddr/${address}?limit=100`,
        { timeout: 30000 }
      );

      const data = response.data;
      const confirmedBalance = data.final_balance || 0;
      
      // Get BTC price for USD conversion
      const btcPrice = await this.getBTCPrice();
      const confirmedBalanceUSD = btcPrice > 0 && confirmedBalance > 0
        ? (confirmedBalance / SATOSHIS_PER_BTC) * btcPrice 
        : undefined;

      const balance: Balance = {
        addressId: address, // Will be replaced by syncService with UUID
        confirmedBalance,
        unconfirmedBalance: 0,
        confirmedBalanceUSD,
        unconfirmedBalanceUSD: 0,
        lastUpdated: new Date(),
      };

      const transactions: Transaction[] = (data.txs || []).map((tx, index) => {
        const totalInput = tx.inputs.reduce((sum, input) => sum + (input.prev_out?.value || 0), 0);
        const totalOutput = tx.out.reduce((sum, output) => sum + (output.value || 0), 0);
        const isReceived = totalOutput > totalInput;

        return {
          id: `${address}-${tx.hash}-${index}`,
          addressId: address,
          txHash: tx.hash,
          blockHeight: tx.block_height,
          timestamp: new Date(tx.time * 1000),
          amount: Math.abs(totalOutput - totalInput),
          type: isReceived ? 'received' : 'sent',
          confirmations: tx.block_height ? 6 : 0,
        };
      });

      return { balance, transactions };
    } catch (error) {
      logger.error('Error fetching from Blockchain.com:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Blockchain.com API error: ${error.message}`);
      }
      throw error;
    }
  }
}

const blockchainApi = new BlockchainApiClient();

export default blockchainApi;

