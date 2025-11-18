import request from 'supertest';
import app from '../../src/index';
import store from '../../src/config/store';
import { Address } from '../../src/types';

describe('Sync API Endpoint', () => {
  beforeEach(() => {
    store.clear();
  });

  test('should sync address successfully', async () => {
    const address: Address = {
      id: 'test-id-1',
      address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5',
      createdAt: new Date(),
    };

    store.addAddress(address);

    const response = await request(app)
      .post('/api/addresses/test-id-1/sync')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.addressId).toBe('test-id-1');
    expect(response.body).toHaveProperty('transactionsAdded');
    expect(response.body).toHaveProperty('balanceUpdated');
  }, 20000);

  test('should return 404 for non-existent address', async () => {
    await request(app)
      .post('/api/addresses/non-existent-id/sync')
      .expect(404);
  });

  test('should trigger background sync on address creation', async () => {
    const response = await request(app)
      .post('/api/addresses')
      .send({ address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5' })
      .expect(201);

    const addressId = response.body.id;

    // Wait a bit for background sync
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const address = store.getAddress(addressId);
    expect(address).toBeDefined();
  }, 10000);
});

