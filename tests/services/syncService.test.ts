import syncService from '../../src/services/syncService';
import store from '../../src/config/store';
import { Address } from '../../src/types';

describe('SyncService', () => {
  beforeEach(() => {
    store.clear();
  });

  test('should return error for non-existent address', async () => {
    const result = await syncService.syncAddress('non-existent-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Address not found');
    expect(result.transactionsAdded).toBe(0);
  });

  test('should sync address successfully', async () => {
    const address: Address = {
      id: 'test-id-1',
      address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
      createdAt: new Date(),
    };

    store.addAddress(address);

    const result = await syncService.syncAddress('test-id-1');

    expect(result.addressId).toBe('test-id-1');
    expect(result.balanceUpdated).toBe(true);
  }, 20000);

  test('should update lastSyncedAt after sync', async () => {
    const address: Address = {
      id: 'test-id-1',
      address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
      createdAt: new Date(),
    };

    store.addAddress(address);
    expect(store.getAddress('test-id-1')?.lastSyncedAt).toBeUndefined();

    await syncService.syncAddress('test-id-1');

    const updated = store.getAddress('test-id-1');
    expect(updated?.lastSyncedAt).toBeDefined();
  }, 20000);

  test('should sync all addresses', async () => {
    const addr1: Address = {
      id: 'test-id-1',
      address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
      createdAt: new Date(),
    };
    const addr2: Address = {
      id: 'test-id-2',
      address: '3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd',
      createdAt: new Date(),
    };

    store.addAddress(addr1);
    store.addAddress(addr2);

    const results = await syncService.syncAllAddresses();

    expect(results).toHaveLength(2);
    expect(results[0].addressId).toBe('test-id-1');
    expect(results[1].addressId).toBe('test-id-2');
  }, 30000);
});

