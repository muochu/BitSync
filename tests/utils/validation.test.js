const { isValidBitcoinAddress } = require('../../src/utils/validation');

describe('Bitcoin Address Validation', () => {
  test('validates legacy P2PKH address (starts with 1)', () => {
    expect(isValidBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(
      true
    );
  });

  test('validates legacy P2SH address (starts with 3)', () => {
    expect(
      isValidBitcoinAddress('3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd')
    ).toBe(true);
  });

  test('validates Bech32 address (starts with bc1)', () => {
    expect(
      isValidBitcoinAddress('bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5')
    ).toBe(true);
  });

  test('rejects invalid addresses', () => {
    expect(isValidBitcoinAddress('invalid')).toBe(false);
    expect(isValidBitcoinAddress('')).toBe(false);
    expect(isValidBitcoinAddress(null)).toBe(false);
    expect(isValidBitcoinAddress(undefined)).toBe(false);
  });

  test('handles whitespace', () => {
    expect(
      isValidBitcoinAddress('  bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5  ')
    ).toBe(true);
  });
});

