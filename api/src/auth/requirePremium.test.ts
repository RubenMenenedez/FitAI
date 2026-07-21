import { describe, it, expect, vi } from 'vitest';
import { requirePremium } from './requirePremium';
import { db } from '../db/client';

vi.mock('../db/client', () => ({ db: { select: vi.fn() } }));

function mockReqRes(userId: string) {
  const req: any = { userId };
  const res: any = { statusCode: 200, status(c: number) { this.statusCode = c; return this; }, json(b: any) { this.body = b; return this; } };
  const next = vi.fn();
  return { req, res, next };
}

describe('requirePremium', () => {
  it('llama next() si subscription_status != free', async () => {
    (db.select as any).mockReturnValue({ from: () => ({ where: () => Promise.resolve([{ subscriptionStatus: 'monthly' }]) }) });
    const { req, res, next } = mockReqRes('u1');
    await requirePremium(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  it('responde 402 si el usuario es free', async () => {
    (db.select as any).mockReturnValue({ from: () => ({ where: () => Promise.resolve([{ subscriptionStatus: 'free' }]) }) });
    const { req, res, next } = mockReqRes('u1');
    await requirePremium(req, res, next);
    expect(res.statusCode).toBe(402);
    expect(next).not.toHaveBeenCalled();
  });
});
