import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from './requireAuth';
import * as verifyTokenModule from './verifyToken';

function mockReqRes(authHeader?: string) {
  const req: any = { headers: { authorization: authHeader } };
  const res: any = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('requireAuth', () => {
  it('responde 401 si no hay header Authorization', async () => {
    const { req, res, next } = mockReqRes(undefined);
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('adjunta req.userId y llama next() si el token es válido', async () => {
    vi.spyOn(verifyTokenModule, 'verifyToken').mockResolvedValue({ sub: 'user-123' } as any);
    const { req, res, next } = mockReqRes('Bearer valid-token');
    await requireAuth(req, res, next);
    expect(req.userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });

  it('responde 401 si el token es inválido o expiró', async () => {
    vi.spyOn(verifyTokenModule, 'verifyToken').mockRejectedValue(new Error('expired'));
    const { req, res, next } = mockReqRes('Bearer expired-token');
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
