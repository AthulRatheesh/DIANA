import { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useNotifications } from "./expo-notifications-setup.js";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function NotificationsWrapper({ children }) {
  // This will register for notifications
  const { expoPushToken, notification } = useNotifications();
  
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <AuthProvider>
            {/* Wrap the Stack with the NotificationsWrapper */}
            <NotificationsWrapper>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "none", // Disable animation to prevent flash
                  presentation: "modal",
                  animationDuration: 0,
                }}
              >
                {/* Main authentication screens */}
                <Stack.Screen name="index" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="questionnaire" />
                
                {/* Standalone screens (not in bottom tab bar) */}
                {/* <Stack.Screen name="meal-tracker" /> */}
                
                {/* Tab navigator and its screens */}
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack>
            </NotificationsWrapper>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}