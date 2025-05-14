import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Hook for registering for push notifications
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { publicId } = useAuth();

  useEffect(() => {
    // Only proceed if we have a valid publicId
    if (!publicId) return;

    registerForPushNotifications().then((token) => {
      setExpoPushToken(token);
      sendTokenToServer(token, publicId);
    });

    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        // You can handle notification interactions here
      });

    // Clean up
    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [publicId]);

  return {
    expoPushToken,
    notification,
  };
}

// Register for push notifications
async function registerForPushNotifications() {
  let token;

  // Only proceed if the app is running on a physical device
  if (Constants.isDevice) {
    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If no existing permission, request permission
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Exit if permission not granted
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    // Get Expo push token
    token = (
      await Notifications.getExpoPushTokenAsync({
        experienceId: "@elegant_coder/DIANA",
      })
    ).data;
    console.log("Expo push token:", token);
  } else {
    console.log("Must use physical device for push notifications");
  }

  // Configure notification channel for Android
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0164D8",
    });
  }

  return token;
}

// Send token to server
async function sendTokenToServer(token, publicId) {
  try {
    const response = await fetch(
      `https://webrtc-server-c3i0.onrender.com/api/register-push-token/${publicId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to register push token");
    }

    console.log("Push token registered successfully");
  } catch (error) {
    console.error("Error registering push token:", error);
  }
}