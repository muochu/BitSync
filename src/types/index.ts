export interface Address {
  id: string;
  address: string;
  label?: string;
  createdAt: Date;
  lastSyncedAt?: Date;
}

export interface Transaction {
  id: string;
  addressId: string;
  txHash: string;
  blockHeight?: number;
  timestamp: Date;
  amount: number; // in satoshis
  type: 'sent' | 'received';
  confirmations?: number;
  fee?: number; // in satoshis
}

export interface Balance {
  addressId: string;
  confirmedBalance: number; // in satoshis
  unconfirmedBalance: number; // in satoshis
  confirmedBalanceUSD?: number; // USD value of confirmed balance
  unconfirmedBalanceUSD?: number; // USD value of unconfirmed balance
  lastUpdated: Date;
}

// API Request/Response types
export interface CreateAddressRequest {
  address: string;
  label?: string;
}

export interface CreateAddressResponse {
  id: string;
  address: string;
  label?: string;
  createdAt: string;
}

export interface AddressResponse {
  id: string;
  address: string;
  label?: string;
  createdAt: string;
  lastSyncedAt?: string;
  balance?: {
    confirmed: number;
    unconfirmed: number;
    confirmedUSD?: number;
    unconfirmedUSD?: number;
    lastUpdated: string;
  };
}

export interface TransactionResponse {
  id: string;
  txHash: string;
  blockHeight?: number;
  timestamp: string;
  amount: number;
  type: 'sent' | 'received';
  confirmations?: number;
  fee?: number;
}

export interface BalanceResponse {
  addressId: string;
  confirmedBalance: number;
  unconfirmedBalance: number;
  confirmedBalanceUSD?: number;
  unconfirmedBalanceUSD?: number;
  lastUpdated: string;
}

export interface ApiError {
  error: {
    message: string;
    stack?: string;
  };
}

// Utility types
export type Satoshis = number;
export type BTC = number;

// Constants
export const SATOSHIS_PER_BTC = 100_000_000;

