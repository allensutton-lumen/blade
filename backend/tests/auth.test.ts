import request from 'supertest';
import app from '../src/app';

describe('auth middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSkipAuth = process.env.SKIP_AUTH;
  const originalLambda = process.env.IS_LAMBDA;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.SKIP_AUTH = originalSkipAuth;
    process.env.IS_LAMBDA = originalLambda;
  });

  it('rejects missing Bearer tokens', async () => {
    process.env.NODE_ENV = 'test';
    process.env.SKIP_AUTH = 'false';
    const response = await request(app).get('/api/auth-status');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('supports local dev auth bypass when enabled', async () => {
    process.env.NODE_ENV = 'development';
    process.env.SKIP_AUTH = 'true';
    process.env.IS_LAMBDA = 'false';
    const response = await request(app).get('/api/auth-status');
    expect(response.status).toBe(200);
    expect(response.body.authenticated).toBe(true);
    expect(response.body.user.email).toBe('dev@lumen.com');
    expect(response.body.user.isAdmin).toBe(true);
  });
});
