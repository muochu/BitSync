/**
 * Type definitions for BitSync
 */

export interface Address {
  id: string;
  address: string;
  createdAt: Date;
  lastSyncedAt?: Date;
}

export interface Transaction {
  id: string;
  addressId: string;
  txHash: string;
  blockHeight?: number;
  timestamp: Date;
  amount: number;
  type: 'sent' | 'received';
}

export interface Balance {
  addressId: string;
  confirmedBalance: number;
  unconfirmedBalance: number;
  lastUpdated: Date;
}

export interface ApiError {
  message: string;
  stack?: string;
}

