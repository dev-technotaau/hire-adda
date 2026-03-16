import request from 'supertest';

// Skip when env vars are not configured (CI without .env)
const hasEnv = !!process.env.DATABASE_URL;

(hasEnv ? describe : describe.skip)('Health Check', () => {
  it('should return 200 OK', async () => {
    const { default: app } = await import('./app');
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
