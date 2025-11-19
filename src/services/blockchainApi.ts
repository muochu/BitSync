import axios from 'axios';
import { Transaction, Balance } from '../types';
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

      const balance: Balance = {
        addressId: address, // Will be replaced by syncService with UUID
        confirmedBalance,
        unconfirmedBalance: 0,
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

