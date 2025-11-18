import { Address, Transaction, Balance } from '../types';

// In-memory data store
class DataStore {
  private addresses: Map<string, Address>;
  private transactions: Map<string, Transaction>;
  private balances: Map<string, Balance>;
  // Index for faster lookups
  private addressByBitcoinAddress: Map<string, string>; // bitcoinAddress -> addressId

  constructor() {
    this.addresses = new Map();
    this.transactions = new Map();
    this.balances = new Map();
    this.addressByBitcoinAddress = new Map();
  }

  // Address operations
  addAddress(addressData: Address): Address {
    this.addresses.set(addressData.id, addressData);
    this.addressByBitcoinAddress.set(addressData.address, addressData.id);
    return addressData;
  }

  getAddress(id: string): Address | undefined {
    return this.addresses.get(id);
  }

  getAddressByBitcoinAddress(bitcoinAddress: string): Address | undefined {
    const addressId = this.addressByBitcoinAddress.get(bitcoinAddress);
    if (!addressId) return undefined;
    return this.addresses.get(addressId);
  }

  addressExists(bitcoinAddress: string): boolean {
    return this.addressByBitcoinAddress.has(bitcoinAddress);
  }

  getAllAddresses(): Address[] {
    return Array.from(this.addresses.values());
  }

  deleteAddress(id: string): boolean {
    const address = this.addresses.get(id);
    if (!address) return false;

    // Clean up index
    this.addressByBitcoinAddress.delete(address.address);

    // Clean up related transactions
    this.transactions.forEach((tx, txId) => {
      if (tx.addressId === id) {
        this.transactions.delete(txId);
      }
    });

    // Clean up balance
    this.balances.delete(id);
    return this.addresses.delete(id);
  }

  // Transaction operations
  addTransaction(transactionData: Transaction): Transaction {
    this.transactions.set(transactionData.id, transactionData);
    return transactionData;
  }

  // Add multiple transactions, skipping duplicates. Returns count added.
  addTransactions(transactions: Transaction[]): number {
    let added = 0;
    for (const tx of transactions) {
      // Check if transaction already exists (by txHash and addressId)
      const existing = this.findTransactionByHash(tx.addressId, tx.txHash);
      if (!existing) {
        this.addTransaction(tx);
        added++;
      }
    }
    return added;
  }

  getTransaction(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }

  getTransactionsByAddress(addressId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.addressId === addressId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findTransactionByHash(
    addressId: string,
    txHash: string
  ): Transaction | undefined {
    return Array.from(this.transactions.values()).find(
      (tx) => tx.addressId === addressId && tx.txHash === txHash
    );
  }

  getTransactionCount(addressId: string): number {
    return this.getTransactionsByAddress(addressId).length;
  }

  // Balance operations
  updateBalance(balanceData: Balance): Balance {
    this.balances.set(balanceData.addressId, balanceData);
    return balanceData;
  }

  getBalance(addressId: string): Balance | undefined {
    return this.balances.get(addressId);
  }

  // Statistics
  getTotalAddresses(): number {
    return this.addresses.size;
  }

  getTotalTransactions(): number {
    return this.transactions.size;
  }

  // Clear all data
  clear(): void {
    this.addresses.clear();
    this.transactions.clear();
    this.balances.clear();
    this.addressByBitcoinAddress.clear();
  }
}

// Singleton instance
const store = new DataStore();

export default store;
