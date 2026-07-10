import request from 'supertest';
import app from '../src/app';

describe('health handler', () => {
  it('returns service health without authentication', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBeDefined();
  });
});
