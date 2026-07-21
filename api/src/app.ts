import express from 'express';
import cors from 'cors';
import { usersRouter } from './modules/users/users.routes';
import { weighInsRouter } from './modules/weighIns/weighIns.routes';
import { mealPlansRouter } from './modules/mealPlans/mealPlans.routes';
import { goalsRouter } from './modules/goals/goals.routes';
import { streaksRouter } from './modules/streaks/streaks.routes';
import { groupsRouter } from './modules/groups/groups.routes';
import { progressPhotosRouter } from './modules/progressPhotos/progressPhotos.routes';
import { healthSyncRouter } from './modules/healthSync/healthSync.routes';

export const app = express();
app.use(cors());
app.use(express.json());
app.use('/users', usersRouter);
app.use('/weigh-ins', weighInsRouter);
app.use('/meal-plans', mealPlansRouter);
app.use('/goals', goalsRouter);
app.use('/streaks', streaksRouter);
app.use('/groups', groupsRouter);
app.use('/progress-photos', progressPhotosRouter);
app.use('/health-sync', healthSyncRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});
