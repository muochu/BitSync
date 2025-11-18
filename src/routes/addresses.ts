import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import store from '../config/store';
import { isValidBitcoinAddress } from '../utils/validation';
import { CreateAddressRequest, CreateAddressResponse, AddressResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import syncService from '../services/syncService';

const router = Router();

// POST /api/addresses - Add a new Bitcoin address
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { address }: CreateAddressRequest = req.body;

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
      createdAt: new Date(),
    };

    store.addAddress(newAddress);

    // Trigger initial sync in background (don't wait for it)
    syncService.syncAddress(addressId).catch((err) => {
      console.error(`Background sync failed for ${addressId}:`, err);
    });

    const response: CreateAddressResponse = {
      id: newAddress.id,
      address: newAddress.address,
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
        createdAt: addr.createdAt.toISOString(),
        lastSyncedAt: addr.lastSyncedAt?.toISOString(),
        balance: balance
          ? {
              confirmed: balance.confirmedBalance,
              unconfirmed: balance.unconfirmedBalance,
              lastUpdated: balance.lastUpdated.toISOString(),
            }
          : undefined,
      };
    });

    res.json(response);
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
      createdAt: address.createdAt.toISOString(),
      lastSyncedAt: address.lastSyncedAt?.toISOString(),
      balance: balance
        ? {
            confirmed: balance.confirmedBalance,
            unconfirmed: balance.unconfirmedBalance,
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

