const admin = require("firebase-admin");

// Load the service account key JSON file
const serviceAccount = require("./servicekey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Send a push notification using Firebase Admin SDK
 * @param {string} fcmToken - The recipient device's FCM token
 * @param {string} callerName - Name of the caller
 * @param {string} channelId - Unique call ID
 */
async function sendCallNotification(fcmToken, callerName, calleeName) {
  const message = {
    token: fcmToken,
    
    data: {
      type: "incoming_call",
      caller_name: callerName,
      channel_id: "NENACALL_CALLING_CHANNEL",
    },
    android: {
      notification: {
        sound: "default",
        priority: "high",
        channel_id: "NENACALL_CALLING_CHANNEL",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Push Notification Sent to:",calleeName, response);
  } catch (error) {
    console.error("❌ Error Sending Notification:", error);
  }
}



module.exports = {sendCallNotification}