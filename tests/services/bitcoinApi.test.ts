import bitcoinApi from '../../src/services/bitcoinApi';

describe('BitcoinApiClient', () => {
  const testAddress = 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5';

  test('should fetch balance for valid address', async () => {
    const balance = await bitcoinApi.getAddressBalance(testAddress);

    expect(balance).toBeDefined();
    expect(balance.addressId).toBe(testAddress);
    expect(typeof balance.confirmedBalance).toBe('number');
    expect(balance.lastUpdated).toBeInstanceOf(Date);
  }, 15000);

  test('should fetch transactions for valid address', async () => {
    const transactions = await bitcoinApi.getAddressTransactions(testAddress);

    expect(Array.isArray(transactions)).toBe(true);
    if (transactions.length > 0) {
      expect(transactions[0]).toHaveProperty('hash');
      expect(transactions[0]).toHaveProperty('time');
    }
  }, 15000);

  test('should sync address and return balance and transactions', async () => {
    const result = await bitcoinApi.syncAddress(testAddress, 'test-id-1');

    expect(result.balance).toBeDefined();
    expect(result.transactions).toBeDefined();
    expect(Array.isArray(result.transactions)).toBe(true);
  }, 20000);

  test('should throw error for invalid address', async () => {
    await expect(bitcoinApi.getAddressBalance('invalid-address')).rejects.toThrow();
  }, 10000);
});

