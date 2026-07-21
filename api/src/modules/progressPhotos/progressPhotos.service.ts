import { db } from '../../db/client';
import { progressPhotos } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function recordProgressPhoto(userId: string, photoUrl: string, weightAtTimeKg?: number) {
  const [row] = await db.insert(progressPhotos).values({ userId, photoUrl, weightAtTimeKg: weightAtTimeKg ? String(weightAtTimeKg) : null }).returning();
  if (!row) throw new Error('failed to record progress photo');
  return row;
}

export async function listProgressPhotos(userId: string) {
  return db.select().from(progressPhotos).where(eq(progressPhotos.userId, userId)).orderBy(desc(progressPhotos.takenAt));
}

export async function deleteProgressPhoto(userId: string, photoId: string) {
  await db.delete(progressPhotos).where(eq(progressPhotos.id, photoId));
  // Nota: el objeto en R2 no se borra aquí; añadir DeleteObjectCommand si se requiere borrado físico.
}
