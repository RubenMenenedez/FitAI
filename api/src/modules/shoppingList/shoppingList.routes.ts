import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth';
import { generateShoppingList } from './shoppingList.service';

export const shoppingListRouter = Router();

shoppingListRouter.get('/:mealPlanId', requireAuth, async (req, res) => {
  try {
    res.json(await generateShoppingList(req.userId!, String(req.params['mealPlanId'] ?? '')));
  } catch (err: unknown) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'error' });
  }
});
