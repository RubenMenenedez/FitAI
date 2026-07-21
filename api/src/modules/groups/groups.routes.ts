import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { createGroup, joinGroupByInviteCode, listPublicGroups, createPost, listFeed, addReaction } from './groups.service';

export const groupsRouter = Router();

groupsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = z.object({ name: z.string().min(1), visibility: z.enum(['private', 'public']) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  res.status(201).json(await createGroup(req.userId!, parsed.data.name, parsed.data.visibility));
});

groupsRouter.post('/join', requireAuth, async (req, res) => {
  const parsed = z.object({ inviteCode: z.string() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try { res.json(await joinGroupByInviteCode(req.userId!, parsed.data.inviteCode)); }
  catch (err: unknown) { res.status(404).json({ error: err instanceof Error ? err.message : 'error' }); }
});

groupsRouter.get('/public', requireAuth, async (_req, res) => res.json(await listPublicGroups()));

groupsRouter.post('/:groupId/posts', requireAuth, async (req, res) => {
  const parsed = z.object({ message: z.string().optional(), photoAnalysisId: z.string().uuid().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { message, photoAnalysisId } = parsed.data;
  const postInput: { message?: string; photoAnalysisId?: string } = {
    ...(message !== undefined ? { message } : {}),
    ...(photoAnalysisId !== undefined ? { photoAnalysisId } : {}),
  };
  const groupId = String(req.params['groupId'] ?? '');
  try { res.status(201).json(await createPost(req.userId!, groupId, postInput)); }
  catch (err: unknown) { res.status(403).json({ error: err instanceof Error ? err.message : 'error' }); }
});

groupsRouter.get('/:groupId/posts', requireAuth, async (req, res) => res.json(await listFeed(String(req.params['groupId'] ?? ''))));

groupsRouter.post('/posts/:postId/reactions', requireAuth, async (req, res) => {
  const parsed = z.object({ emoji: z.string() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const postId = String(req.params['postId'] ?? '');
  try { res.status(201).json(await addReaction(req.userId!, postId, parsed.data.emoji)); }
  catch (err: unknown) { res.status(400).json({ error: err instanceof Error ? err.message : 'error' }); }
});
