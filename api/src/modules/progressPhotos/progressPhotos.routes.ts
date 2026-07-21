import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { createUploadUrl } from './r2Storage';
import { recordProgressPhoto, listProgressPhotos, deleteProgressPhoto } from './progressPhotos.service';

export const progressPhotosRouter = Router();

progressPhotosRouter.post('/upload-url', requireAuth, async (req, res) => {
  res.json(await createUploadUrl(req.userId!));
});

progressPhotosRouter.post('/', requireAuth, async (req, res) => {
  const parsed = z.object({ photoUrl: z.string().url(), weightAtTimeKg: z.number().positive().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  res.status(201).json(await recordProgressPhoto(req.userId!, parsed.data.photoUrl, parsed.data.weightAtTimeKg));
});

progressPhotosRouter.get('/', requireAuth, async (req, res) => res.json(await listProgressPhotos(req.userId!)));

progressPhotosRouter.delete('/:id', requireAuth, async (req, res) => {
  await deleteProgressPhoto(req.userId!, String(req.params['id'] ?? ''));
  res.status(204).send();
});
