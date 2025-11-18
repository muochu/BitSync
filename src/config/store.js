/**
 * Simple in-memory data store
 * For MVP - can be replaced with database later if needed
 * Keeps solution lightweight and avoids over-engineering
 */
class DataStore {
  constructor() {
    this.addresses = new Map(); // addressId -> { id, address, createdAt, lastSyncedAt }
    this.transactions = new Map(); // transactionId -> { id, addressId, txHash, ... }
    this.balances = new Map(); // addressId -> { addressId, confirmedBalance, unconfirmedBalance, lastUpdated }
  }

  // Address operations
  addAddress(addressData) {
    this.addresses.set(addressData.id, addressData);
    return addressData;
  }

  getAddress(id) {
    return this.addresses.get(id);
  }

  getAllAddresses() {
    return Array.from(this.addresses.values());
  }

  deleteAddress(id) {
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
  addTransaction(transactionData) {
    this.transactions.set(transactionData.id, transactionData);
    return transactionData;
  }

  getTransactionsByAddress(addressId) {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.addressId === addressId
    );
  }

  // Balance operations
  updateBalance(balanceData) {
    this.balances.set(balanceData.addressId, balanceData);
    return balanceData;
  }

  getBalance(addressId) {
    return this.balances.get(addressId);
  }
}

// Singleton instance
const store = new DataStore();

module.exports = store;

