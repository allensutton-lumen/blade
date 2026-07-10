import request from 'supertest';
import app from '../src/app';

describe('validation middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSkipAuth = process.env.SKIP_AUTH;
  const originalLambda = process.env.IS_LAMBDA;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.SKIP_AUTH = 'true';
    process.env.IS_LAMBDA = 'false';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.SKIP_AUTH = originalSkipAuth;
    process.env.IS_LAMBDA = originalLambda;
  });

  it('returns 422 for invalid payloads', async () => {
    const response = await request(app).post('/api/example').send({ name: '' });
    expect(response.status).toBe(422);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors[0].field).toBe('name');
  });

  it('accepts valid payloads', async () => {
    const response = await request(app).post('/api/example').send({ name: 'BLADE' });
    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('BLADE');
  });
});
