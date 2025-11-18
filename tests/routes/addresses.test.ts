import request from 'supertest';
import app from '../../src/index';
import store from '../../src/config/store';

describe('Address API Endpoints', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('POST /api/addresses', () => {
    test('should create a new address', async () => {
      const response = await request(app)
        .post('/api/addresses')
        .send({ address: 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.address).toBe('bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5');
      expect(response.body).toHaveProperty('createdAt');
    });

    test('should reject invalid address format', async () => {
      const response = await request(app)
        .post('/api/addresses')
        .send({ address: 'invalid-address' })
        .expect(400);

      expect(response.body.error.message).toBe('Invalid Bitcoin address format');
    });

    test('should reject missing address', async () => {
      const response = await request(app)
        .post('/api/addresses')
        .send({})
        .expect(400);

      expect(response.body.error.message).toBe('Address is required');
    });

    test('should reject duplicate address', async () => {
      const address = 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5';

      await request(app).post('/api/addresses').send({ address }).expect(201);

      const response = await request(app)
        .post('/api/addresses')
        .send({ address })
        .expect(409);

      expect(response.body.error.message).toBe('Address already exists');
    });
  });

  describe('GET /api/addresses', () => {
    test('should return empty array when no addresses', async () => {
      const response = await request(app).get('/api/addresses').expect(200);

      expect(response.body).toEqual([]);
    });

    test('should return all addresses', async () => {
      const addr1 = 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5';
      const addr2 = '3E8ociqZa9mZUSwGdSmAEMAoAxBK3FNDcd';

      await request(app).post('/api/addresses').send({ address: addr1 });
      await request(app).post('/api/addresses').send({ address: addr2 });

      const response = await request(app).get('/api/addresses').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('address');
    });
  });

  describe('GET /api/addresses/:id', () => {
    test('should return address by ID', async () => {
      const address = 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5';
      const createResponse = await request(app)
        .post('/api/addresses')
        .send({ address })
        .expect(201);

      const addressId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/addresses/${addressId}`)
        .expect(200);

      expect(response.body.id).toBe(addressId);
      expect(response.body.address).toBe(address);
    });

    test('should return 404 for non-existent address', async () => {
      await request(app).get('/api/addresses/non-existent-id').expect(404);
    });
  });

  describe('DELETE /api/addresses/:id', () => {
    test('should delete address', async () => {
      const address = 'bc1q0sg9rdst255gtldsmcf8rk0764avqy2h2ksqs5';
      const createResponse = await request(app)
        .post('/api/addresses')
        .send({ address })
        .expect(201);

      const addressId = createResponse.body.id;

      await request(app).delete(`/api/addresses/${addressId}`).expect(204);

      await request(app).get(`/api/addresses/${addressId}`).expect(404);
    });

    test('should return 404 when deleting non-existent address', async () => {
      await request(app).delete('/api/addresses/non-existent-id').expect(404);
    });
  });
});

