import { db } from '../../db/client';
import { groups, groupMembers, groupPosts, groupReactions, streaks } from '../../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

const ALLOWED_EMOJI = ['🔥', '💪', '👏', '🎉', '❤️'];

export async function createGroup(userId: string, name: string, visibility: 'private' | 'public') {
  const inviteCode = visibility === 'private' ? randomBytes(4).toString('hex') : null;
  const [group] = await db.insert(groups).values({ name, visibility, createdBy: userId, inviteCode }).returning();
  if (!group) throw new Error('failed to create group');
  await db.insert(groupMembers).values({ groupId: group.id, userId });
  return group;
}

export async function joinGroupByInviteCode(userId: string, inviteCode: string) {
  const [group] = await db.select().from(groups).where(eq(groups.inviteCode, inviteCode));
  if (!group) throw new Error('invalid invite code');
  await db.insert(groupMembers).values({ groupId: group.id, userId }).onConflictDoNothing();
  return group;
}

export async function listPublicGroups() {
  return db.select().from(groups).where(eq(groups.visibility, 'public'));
}

export async function createPost(userId: string, groupId: string, input: { message?: string; photoAnalysisId?: string }) {
  const [membership] = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  if (!membership) throw new Error('not a member of this group');
  const values: {
    groupId: string;
    userId: string;
    message?: string;
    photoAnalysisId?: string;
  } = {
    groupId,
    userId,
    ...(input.message !== undefined ? { message: input.message } : {}),
    ...(input.photoAnalysisId !== undefined ? { photoAnalysisId: input.photoAnalysisId } : {}),
  };
  const [post] = await db.insert(groupPosts).values(values).returning();
  if (!post) throw new Error('failed to create post');
  return post;
}

export async function listFeed(groupId: string) {
  return db.select().from(groupPosts).where(eq(groupPosts.groupId, groupId)).orderBy(desc(groupPosts.createdAt));
}

export async function addReaction(userId: string, postId: string, emoji: string) {
  if (!ALLOWED_EMOJI.includes(emoji)) throw new Error('emoji not allowed');
  const [reaction] = await db.insert(groupReactions).values({ groupPostId: postId, userId, emoji }).returning();
  if (!reaction) throw new Error('failed to add reaction');
  return reaction;
}

// Racha de grupo activa el día que todos los miembros (o el mínimo configurable)
// registraron al menos una comida (sección 8.2).
export async function isGroupStreakActiveToday(groupId: string, minRatio = 1.0) {
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  if (members.length === 0) return false;

  const today = new Date().toISOString().slice(0, 10);
  const memberStreaks = await db.select().from(streaks).where(inArray(streaks.userId, members.map((m) => m.userId)));
  const loggedToday = memberStreaks.filter((s) => s.lastLoggedDate === today).length;

  return loggedToday / members.length >= minRatio;
}
