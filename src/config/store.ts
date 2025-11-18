import { Address, Transaction, Balance } from '../types';

/**
 * Simple in-memory data store
 * For MVP - can be replaced with database later if needed
 * Keeps solution lightweight and avoids over-engineering
 */
class DataStore {
  private addresses: Map<string, Address>;
  private transactions: Map<string, Transaction>;
  private balances: Map<string, Balance>;

  constructor() {
    this.addresses = new Map();
    this.transactions = new Map();
    this.balances = new Map();
  }

  // Address operations
  addAddress(addressData: Address): Address {
    this.addresses.set(addressData.id, addressData);
    return addressData;
  }

  getAddress(id: string): Address | undefined {
    return this.addresses.get(id);
  }

  getAllAddresses(): Address[] {
    return Array.from(this.addresses.values());
  }

  deleteAddress(id: string): boolean {
    // Also clean up related transactions and balances
    this.transactions.forEach((tx, txId) => {
      if (tx.addressId === id) {
        this.transactions.delete(txId);
      }
    });
    this.balances.delete(id);
    return this.addresses.delete(id);
  }

  // Transaction operations
  addTransaction(transactionData: Transaction): Transaction {
    this.transactions.set(transactionData.id, transactionData);
    return transactionData;
  }

  getTransactionsByAddress(addressId: string): Transaction[] {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.addressId === addressId
    );
  }

  // Balance operations
  updateBalance(balanceData: Balance): Balance {
    this.balances.set(balanceData.addressId, balanceData);
    return balanceData;
  }

  getBalance(addressId: string): Balance | undefined {
    return this.balances.get(addressId);
  }
}

// Singleton instance
const store = new DataStore();

export default store;

