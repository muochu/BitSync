import bitcoinApi from './bitcoinApi';
import store from '../config/store';
import { Address, Balance } from '../types';
import logger from '../utils/logger';

export interface SyncResult {
  success: boolean;
  addressId: string;
  transactionsAdded: number;
  balanceUpdated: boolean;
  error?: string;
}

class SyncService {
  async syncAddress(addressId: string): Promise<SyncResult> {
    const address = store.getAddress(addressId);
    if (!address) {
      return {
        success: false,
        addressId,
        transactionsAdded: 0,
        balanceUpdated: false,
        error: 'Address not found',
      };
    }

    try {
      const { balance, transactions } = await bitcoinApi.syncAddress(
        address.address,
        addressId
      );

      const added = store.addTransactions(transactions);
      
      // Fix balance addressId to use UUID instead of Bitcoin address
      const balanceWithCorrectId: Balance = {
        ...balance,
        addressId: addressId,
      };
      store.updateBalance(balanceWithCorrectId);
      
      // Debug: Verify balance was stored
      const storedBalance = store.getBalance(addressId);
      if (!storedBalance) {
        logger.error(`Balance not stored correctly for addressId: ${addressId}`);
      } else {
        logger.info(`Balance stored: ${storedBalance.confirmedBalance} satoshis for ${addressId}`);
      }

      const updatedAddress: Address = {
        ...address,
        lastSyncedAt: new Date(),
      };
      store.addAddress(updatedAddress);

      logger.info(
        `Synced address ${address.address}: ${added} new transactions, balance updated`
      );

      return {
        success: true,
        addressId,
        transactionsAdded: added,
        balanceUpdated: true,
      };
    } catch (error) {
      logger.error(`Error syncing address ${addressId}:`, error);
      return {
        success: false,
        addressId,
        transactionsAdded: 0,
        balanceUpdated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async syncAllAddresses(): Promise<SyncResult[]> {
    const addresses = store.getAllAddresses();
    const results: SyncResult[] = [];

    for (const address of addresses) {
      const result = await this.syncAddress(address.id);
      results.push(result);
    }

    return results;
  }
}

const syncService = new SyncService();

export default syncService;

