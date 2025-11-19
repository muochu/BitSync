import request from 'supertest';
import app from '../../src/index';
import store from '../../src/config/store';
import { Address, Balance, Transaction } from '../../src/types';

describe('Balance and Transaction Endpoints', () => {
  let addressId: string;

  beforeEach(() => {
    store.clear();

    const address: Address = {
      id: 'test-id-1',
      address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
      createdAt: new Date(),
    };

    store.addAddress(address);
    addressId = address.id;

    const balance: Balance = {
      addressId: address.id,
      confirmedBalance: 1000000,
      unconfirmedBalance: 50000,
      lastUpdated: new Date(),
    };

    store.updateBalance(balance);

    const tx1: Transaction = {
      id: 'tx-1',
      addressId: address.id,
      txHash: 'abc123',
      blockHeight: 800000,
      timestamp: new Date('2024-01-01'),
      amount: 100000,
      type: 'received',
      confirmations: 6,
      fee: 1000,
    };

    const tx2: Transaction = {
      id: 'tx-2',
      addressId: address.id,
      txHash: 'def456',
      blockHeight: 800001,
      timestamp: new Date('2024-01-02'),
      amount: 50000,
      type: 'sent',
      confirmations: 6,
      fee: 2000,
    };

    store.addTransaction(tx1);
    store.addTransaction(tx2);
  });

  describe('GET /api/addresses/:id/balance', () => {
    test('should return balance for address', async () => {
      const response = await request(app)
        .get(`/api/addresses/${addressId}/balance`)
        .expect(200);

      expect(response.body.addressId).toBe(addressId);
      expect(response.body.confirmedBalance).toBe(1000000);
      expect(response.body.unconfirmedBalance).toBe(50000);
      expect(response.body).toHaveProperty('lastUpdated');
    });

    test('should return 404 for non-existent address', async () => {
      await request(app)
        .get('/api/addresses/non-existent-id/balance')
        .expect(404);
    });

    test('should return 404 when balance not found', async () => {
      const newAddress: Address = {
        id: 'test-id-2',
        address: '3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd',
        createdAt: new Date(),
      };

      store.addAddress(newAddress);

      await request(app)
        .get(`/api/addresses/${newAddress.id}/balance`)
        .expect(404);
    });
  });

  describe('GET /api/addresses/:id/transactions', () => {
    test('should return transactions for address', async () => {
      const response = await request(app)
        .get(`/api/addresses/${addressId}/transactions`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    test('should support pagination with limit', async () => {
      const response = await request(app)
        .get(`/api/addresses/${addressId}/transactions?limit=1`)
        .expect(200);

      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.total).toBe(2);
    });

    test('should support pagination with offset', async () => {
      const response = await request(app)
        .get(`/api/addresses/${addressId}/transactions?limit=1&offset=1`)
        .expect(200);

      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.offset).toBe(1);
      expect(response.body.total).toBe(2);
    });

    test('should return transactions sorted by newest first', async () => {
      const response = await request(app)
        .get(`/api/addresses/${addressId}/transactions`)
        .expect(200);

      const transactions = response.body.transactions;
      expect(transactions[0].txHash).toBe('def456');
      expect(transactions[1].txHash).toBe('abc123');
    });

    test('should return 404 for non-existent address', async () => {
      await request(app)
        .get('/api/addresses/non-existent-id/transactions')
        .expect(404);
    });

    test('should return empty array when no transactions', async () => {
      const newAddress: Address = {
        id: 'test-id-2',
        address: '3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd',
        createdAt: new Date(),
      };

      store.addAddress(newAddress);

      const response = await request(app)
        .get(`/api/addresses/${newAddress.id}/transactions`)
        .expect(200);

      expect(response.body.transactions).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });
});

