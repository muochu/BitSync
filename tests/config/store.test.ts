import store from '../../src/config/store';
import { Address, Transaction, Balance } from '../../src/types';

describe('DataStore', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('Address operations', () => {
    test('should add and retrieve address', () => {
      const address: Address = {
        id: 'test-id-1',
        address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
        createdAt: new Date(),
      };

      store.addAddress(address);
      const retrieved = store.getAddress('test-id-1');

      expect(retrieved).toEqual(address);
    });

    test('should find address by Bitcoin address', () => {
      const address: Address = {
        id: 'test-id-1',
        address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
        createdAt: new Date(),
      };

      store.addAddress(address);
      const found = store.getAddressByBitcoinAddress(
        'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5'
      );

      expect(found).toEqual(address);
    });

    test('should check if address exists', () => {
      const address: Address = {
        id: 'test-id-1',
        address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
        createdAt: new Date(),
      };

      store.addAddress(address);

      expect(
        store.addressExists('bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5')
      ).toBe(true);
      expect(store.addressExists('invalid')).toBe(false);
    });

    test('should get all addresses', () => {
      const address1: Address = {
        id: 'test-id-1',
        address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
        createdAt: new Date(),
      };
      const address2: Address = {
        id: 'test-id-2',
        address: '3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd',
        createdAt: new Date(),
      };

      store.addAddress(address1);
      store.addAddress(address2);

      const all = store.getAllAddresses();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(address1);
      expect(all).toContainEqual(address2);
    });

    test('should delete address and clean up related data', () => {
      const address: Address = {
        id: 'test-id-1',
        address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
        createdAt: new Date(),
      };

      const transaction: Transaction = {
        id: 'tx-1',
        addressId: 'test-id-1',
        txHash: 'abc123',
        timestamp: new Date(),
        amount: 1000,
        type: 'received',
      };

      const balance: Balance = {
        addressId: 'test-id-1',
        confirmedBalance: 5000,
        unconfirmedBalance: 0,
        lastUpdated: new Date(),
      };

      store.addAddress(address);
      store.addTransaction(transaction);
      store.updateBalance(balance);

      const deleted = store.deleteAddress('test-id-1');

      expect(deleted).toBe(true);
      expect(store.getAddress('test-id-1')).toBeUndefined();
      expect(store.getTransactionsByAddress('test-id-1')).toHaveLength(0);
      expect(store.getBalance('test-id-1')).toBeUndefined();
    });
  });

  describe('Transaction operations', () => {
    test('should add and retrieve transaction', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        addressId: 'test-id-1',
        txHash: 'abc123',
        timestamp: new Date(),
        amount: 1000,
        type: 'received',
      };

      store.addTransaction(transaction);
      const retrieved = store.getTransaction('tx-1');

      expect(retrieved).toEqual(transaction);
    });

    test('should get transactions by address', () => {
      const tx1: Transaction = {
        id: 'tx-1',
        addressId: 'test-id-1',
        txHash: 'abc123',
        timestamp: new Date('2024-01-01'),
        amount: 1000,
        type: 'received',
      };
      const tx2: Transaction = {
        id: 'tx-2',
        addressId: 'test-id-1',
        txHash: 'def456',
        timestamp: new Date('2024-01-02'),
        amount: 2000,
        type: 'sent',
      };
      const tx3: Transaction = {
        id: 'tx-3',
        addressId: 'test-id-2',
        txHash: 'ghi789',
        timestamp: new Date('2024-01-03'),
        amount: 3000,
        type: 'received',
      };

      store.addTransaction(tx1);
      store.addTransaction(tx2);
      store.addTransaction(tx3);

      const transactions = store.getTransactionsByAddress('test-id-1');
      expect(transactions).toHaveLength(2);
      expect(transactions[0].id).toBe('tx-2'); // Newest first
      expect(transactions[1].id).toBe('tx-1');
    });

    test('should find transaction by hash', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        addressId: 'test-id-1',
        txHash: 'abc123',
        timestamp: new Date(),
        amount: 1000,
        type: 'received',
      };

      store.addTransaction(transaction);
      const found = store.findTransactionByHash('test-id-1', 'abc123');

      expect(found).toEqual(transaction);
    });

    test('should add multiple transactions and skip duplicates', () => {
      const tx1: Transaction = {
        id: 'tx-1',
        addressId: 'test-id-1',
        txHash: 'abc123',
        timestamp: new Date(),
        amount: 1000,
        type: 'received',
      };
      const tx2: Transaction = {
        id: 'tx-2',
        addressId: 'test-id-1',
        txHash: 'abc123', // Duplicate hash
        timestamp: new Date(),
        amount: 2000,
        type: 'sent',
      };
      const tx3: Transaction = {
        id: 'tx-3',
        addressId: 'test-id-1',
        txHash: 'def456',
        timestamp: new Date(),
        amount: 3000,
        type: 'received',
      };

      store.addTransaction(tx1);
      const added = store.addTransactions([tx2, tx3]);

      expect(added).toBe(1); // Only tx3 added (tx2 is duplicate)
      expect(store.getTransactionCount('test-id-1')).toBe(2);
    });
  });

  describe('Balance operations', () => {
    test('should update and retrieve balance', () => {
      const balance: Balance = {
        addressId: 'test-id-1',
        confirmedBalance: 5000,
        unconfirmedBalance: 1000,
        lastUpdated: new Date(),
      };

      store.updateBalance(balance);
      const retrieved = store.getBalance('test-id-1');

      expect(retrieved).toEqual(balance);
    });
  });

  describe('Statistics', () => {
    test('should return correct counts', () => {
      const address: Address = {
        id: 'test-id-1',
        address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
        createdAt: new Date(),
      };
      const transaction: Transaction = {
        id: 'tx-1',
        addressId: 'test-id-1',
        txHash: 'abc123',
        timestamp: new Date(),
        amount: 1000,
        type: 'received',
      };

      store.addAddress(address);
      store.addTransaction(transaction);

      expect(store.getTotalAddresses()).toBe(1);
      expect(store.getTotalTransactions()).toBe(1);
    });
  });
});
