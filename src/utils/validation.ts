/**
 * Bitcoin address validation
 * Supports legacy (P2PKH, P2SH) and modern (Bech32) formats
 */
const BITCOIN_ADDRESS_REGEX = {
  legacy: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2PKH (1...) and P2SH (3...)
  bech32: /^bc1[a-z0-9]{39,59}$/i, // Bech32 (bc1...)
};

export function isValidBitcoinAddress(address: string | null | undefined): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmed = address.trim();
  return (
    BITCOIN_ADDRESS_REGEX.legacy.test(trimmed) ||
    BITCOIN_ADDRESS_REGEX.bech32.test(trimmed)
  );
}

