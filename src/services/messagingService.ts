import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const requestNotificationPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const instance = await messaging;
      if (instance) {
        const token = await getToken(instance, {
          vapidKey: 'BPaH-R_Z0w5S-xH_B_fG5_xH_B_fG5_xH_B_fG5_xH_B_fG5' // Placeholder, user needs to generate this in console
        });
        
        if (token) {
          // Store token in user document for targeted notifications
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            fcmToken: token,
            notificationsEnabled: true
          });
          return token;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to get messaging token:", error);
    return null;
  }
};

export const onMessageReceived = async (callback: (payload: any) => void) => {
  const instance = await messaging;
  if (instance) {
    return onMessage(instance, (payload) => {
      console.log('Message received: ', payload);
      callback(payload);
    });
  }
};
