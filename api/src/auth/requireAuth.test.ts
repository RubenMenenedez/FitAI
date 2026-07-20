import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth } from './requireAuth';
import * as verifyTokenModule from './verifyToken';
import { db } from '../db/client';

vi.mock('../db/client', () => ({
  db: { insert: vi.fn() },
}));

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

function mockDbInsert() {
  const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn().mockReturnValue({ onConflictDoNothing });
  (db.insert as any).mockReturnValue({ values });
  return { values, onConflictDoNothing };
}

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde 401 si no hay header Authorization', async () => {
    const { req, res, next } = mockReqRes(undefined);
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('adjunta req.userId, aprovisiona la fila de users y llama next() si el token es válido', async () => {
    const { values, onConflictDoNothing } = mockDbInsert();
    vi.spyOn(verifyTokenModule, 'verifyToken').mockResolvedValue({ sub: 'user-123', email: 'user@example.com' } as any);
    const { req, res, next } = mockReqRes('Bearer valid-token');

    await requireAuth(req, res, next);

    expect(db.insert).toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith({ id: 'user-123', email: 'user@example.com' });
    expect(onConflictDoNothing).toHaveBeenCalledWith(expect.objectContaining({ target: expect.anything() }));
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

  it('responde 401 y no aprovisiona nada si el token no incluye el claim email', async () => {
    mockDbInsert();
    vi.spyOn(verifyTokenModule, 'verifyToken').mockResolvedValue({ sub: 'user-456' } as any);
    const { req, res, next } = mockReqRes('Bearer no-email-token');

    await requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
