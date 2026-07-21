import { Router } from 'express';
import { mapRevenueCatEventToStatus, verifyWebhookAuth } from './revenueCatWebhook';
import { updateSubscriptionStatus } from './subscriptions.service';

export const subscriptionsRouter = Router();

subscriptionsRouter.post('/revenuecat-webhook', async (req, res) => {
  if (!verifyWebhookAuth(req.headers.authorization, process.env['REVENUECAT_WEBHOOK_SECRET'] ?? '')) {
    res.status(401).json({ error: 'invalid webhook auth' });
    return;
  }
  const event = req.body?.event;
  if (!event?.type || !event?.product_id || !event?.app_user_id) {
    res.status(400).json({ error: 'malformed event' });
    return;
  }
  const status = mapRevenueCatEventToStatus(event);
  await updateSubscriptionStatus(event.app_user_id, status);
  res.status(200).json({ received: true });
});
