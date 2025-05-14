import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { LogIn, User, Lock, ArrowRight } from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const API_URL = "https://webrtc-server-c3i0.onrender.com";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);
    buttonScale.value = withSpring(0.95);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await login(data.publicId);
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      console.error("Error:", error);
      Alert.alert(
        "Login Failed",
        "Please check your credentials and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
      buttonScale.value = withSpring(1);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      contentContainerStyle={{ flex: 1 }}
      enabled={Platform.OS === "ios"}
    >
      <StatusBar style={theme.colors.statusBar} />
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.header}
        >
          <View
            style={[
              styles.logoContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Welcome Back
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Sign in to continue your fitness journey
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={[
            styles.formContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <User
              size={20}
              color={theme.colors.placeholder}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Username"
              placeholderTextColor={theme.colors.placeholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Lock
              size={20}
              color={theme.colors.placeholder}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Password"
              placeholderTextColor={theme.colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          style={styles.actionContainer}
        >
          <Animated.View style={[buttonStyle]}>
            <TouchableOpacity
              style={[
                styles.button,
                isLoading && styles.buttonDisabled,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleLogin}
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push("/signup")}
          >
            <Text
              style={[styles.signupText, { color: theme.colors.textSecondary }]}
            >
              Don't have an account?{" "}
              <Text
                style={[styles.signupLink, { color: theme.colors.primary }]}
              >
                Sign up
              </Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Theme Toggle */}
        <Animated.View
          entering={FadeInUp.delay(800).springify()}
          style={styles.themeContainer}
        >
          <TouchableOpacity
            style={[styles.themeToggle, { borderColor: theme.colors.border }]}
            onPress={toggleTheme}
          >
            <Text
              style={[styles.themeText, { color: theme.colors.textSecondary }]}
            >
              Switch to {isDark ? "Light" : "Dark"} Mode
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 0,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  actionContainer: {
    alignItems: "center",
  },
  button: {
    borderRadius: 12,
    height: 56,
    width: SCREEN_WIDTH - 85,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  signupButton: {
    padding: 12,
  },
  signupText: {
    fontSize: 16,
  },
  signupLink: {
    fontWeight: "600",
  },
  themeContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  logo: {
    width: 100,
    height: 100,
  },
  themeToggle: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
