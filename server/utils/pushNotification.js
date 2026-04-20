import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@live-canvas.com';

const pushEnabled = Boolean(vapidPublicKey && vapidPrivateKey);

if (pushEnabled) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('VAPID keys not set. Push notifications disabled.');
}

export const sendPushNotification = async (subscription, payload) => {
  if (!pushEnabled) return { success: false, error: 'PUSH_DISABLED' };

  try {
    const stringifiedPayload = JSON.stringify(payload);
    await webpush.sendNotification(subscription, stringifiedPayload);
    return { success: true };
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { success: false, error: 'GONE', statusCode: error.statusCode };
    }
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

export { pushEnabled };
