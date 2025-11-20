import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import store from '../config/store';
import { isValidBitcoinAddress, sanitizeLabel } from '../utils/validation';
import {
  CreateAddressRequest,
  CreateAddressResponse,
  AddressResponse,
  BalanceResponse,
  TransactionResponse,
} from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import syncService from '../services/syncService';
import logger from '../utils/logger';

const router = Router();

// POST /api/addresses - Add a new Bitcoin address
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { address, label }: CreateAddressRequest = req.body;

    if (!address || typeof address !== 'string') {
      res.status(400).json({
        error: { message: 'Address is required' },
      });
      return;
    }

    if (!isValidBitcoinAddress(address)) {
      res.status(400).json({
        error: { message: 'Invalid Bitcoin address format' },
      });
      return;
    }

    if (store.addressExists(address)) {
      res.status(409).json({
        error: { message: 'Address already exists' },
      });
      return;
    }

    const addressId = randomUUID();
    const newAddress = {
      id: addressId,
      address: address.trim(),
      label: sanitizeLabel(label),
      createdAt: new Date(),
    };

    store.addAddress(newAddress);

    // Trigger initial sync in background (don't wait for it)
    syncService.syncAddress(addressId).catch((err) => {
      logger.error(`Background sync failed for ${addressId}:`, err);
    });

    const response: CreateAddressResponse = {
      id: newAddress.id,
      address: newAddress.address,
      label: newAddress.label,
      createdAt: newAddress.createdAt.toISOString(),
    };

    res.status(201).json(response);
  })
);

// GET /api/addresses - List all addresses
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const addresses = store.getAllAddresses();

    const response: AddressResponse[] = addresses.map((addr) => {
      const balance = store.getBalance(addr.id);
      return {
        id: addr.id,
        address: addr.address,
        label: addr.label,
        createdAt: addr.createdAt.toISOString(),
        lastSyncedAt: addr.lastSyncedAt?.toISOString(),
        balance: balance
          ? {
              confirmed: balance.confirmedBalance,
              unconfirmed: balance.unconfirmedBalance,
              confirmedUSD: balance.confirmedBalanceUSD,
              unconfirmedUSD: balance.unconfirmedBalanceUSD,
              lastUpdated: balance.lastUpdated.toISOString(),
            }
          : undefined,
      };
    });

    res.json(response);
  })
);

// GET /api/addresses/:id/balance - Get balance for address
router.get(
  '/:id/balance',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const address = store.getAddress(id);

    if (!address) {
      res.status(404).json({
        error: { message: 'Address not found' },
      });
      return;
    }

    const balance = store.getBalance(id);

    if (!balance) {
      res.status(404).json({
        error: { message: 'Balance not found. Sync the address first.' },
      });
      return;
    }

    const response: BalanceResponse = {
      addressId: id,
      confirmedBalance: balance.confirmedBalance,
      unconfirmedBalance: balance.unconfirmedBalance,
      confirmedBalanceUSD: balance.confirmedBalanceUSD,
      unconfirmedBalanceUSD: balance.unconfirmedBalanceUSD,
      lastUpdated: balance.lastUpdated.toISOString(),
    };

    res.json(response);
  })
);

// GET /api/addresses/:id/transactions - Get transactions for address
router.get(
  '/:id/transactions',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const address = store.getAddress(id);

    if (!address) {
      res.status(404).json({
        error: { message: 'Address not found' },
      });
      return;
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 100, 1), 1000);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const allTransactions = store.getTransactionsByAddress(id);
    const total = allTransactions.length;
    const transactions = allTransactions.slice(offset, offset + limit);

    const response: TransactionResponse[] = transactions.map((tx) => ({
      id: tx.id,
      txHash: tx.txHash,
      blockHeight: tx.blockHeight,
      timestamp: tx.timestamp.toISOString(),
      amount: tx.amount,
      type: tx.type,
      confirmations: tx.confirmations,
      fee: tx.fee,
    }));

    res.json({
      transactions: response,
      total,
      limit,
      offset,
    });
  })
);

// GET /api/addresses/:id - Get address by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const address = store.getAddress(id);

    if (!address) {
      res.status(404).json({
        error: { message: 'Address not found' },
      });
      return;
    }

    const balance = store.getBalance(id);
    const response: AddressResponse = {
      id: address.id,
      address: address.address,
      label: address.label,
      createdAt: address.createdAt.toISOString(),
      lastSyncedAt: address.lastSyncedAt?.toISOString(),
      balance: balance
        ? {
            confirmed: balance.confirmedBalance,
            unconfirmed: balance.unconfirmedBalance,
            confirmedUSD: balance.confirmedBalanceUSD,
            unconfirmedUSD: balance.unconfirmedBalanceUSD,
            lastUpdated: balance.lastUpdated.toISOString(),
          }
        : undefined,
    };

    res.json(response);
  })
);

// POST /api/addresses/:id/sync - Manually sync address
router.post(
  '/:id/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const address = store.getAddress(id);

    if (!address) {
      res.status(404).json({
        error: { message: 'Address not found' },
      });
      return;
    }

    const result = await syncService.syncAddress(id);

    if (!result.success) {
      res.status(500).json({
        error: { message: result.error || 'Sync failed' },
      });
      return;
    }

    res.json({
      success: true,
      addressId: result.addressId,
      transactionsAdded: result.transactionsAdded,
      balanceUpdated: result.balanceUpdated,
    });
  })
);

// PATCH /api/addresses/:id - Update address label
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { label } = req.body;

    const address = store.getAddress(id);
    if (!address) {
      res.status(404).json({
        error: { message: 'Address not found' },
      });
      return;
    }

    const updatedAddress = {
      ...address,
      label: sanitizeLabel(label),
    };

    store.addAddress(updatedAddress);

    const response: AddressResponse = {
      id: updatedAddress.id,
      address: updatedAddress.address,
      label: updatedAddress.label,
      createdAt: updatedAddress.createdAt.toISOString(),
      lastSyncedAt: updatedAddress.lastSyncedAt?.toISOString(),
    };

    res.json(response);
  })
);

// POST /api/addresses/sync-all - Sync all addresses
router.post(
  '/sync-all',
  asyncHandler(async (_req: Request, res: Response) => {
    const results = await syncService.syncAllAddresses();
    res.json(results);
  })
);

// DELETE /api/addresses/:id - Remove address
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const address = store.getAddress(id);

    if (!address) {
      res.status(404).json({
        error: { message: 'Address not found' },
      });
      return;
    }

    store.deleteAddress(id);
    res.status(204).send();
  })
);

export default router;

