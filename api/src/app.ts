import express from 'express';
import cors from 'cors';
import { usersRouter } from './modules/users/users.routes';

export const app = express();
app.use(cors());
app.use(express.json());
app.use('/users', usersRouter);
