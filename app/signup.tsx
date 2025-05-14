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
import {
  UserPlus,
  User,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
} from "lucide-react-native";
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

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
}

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { login } = useAuth();
  const { theme } = useTheme();
  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    buttonScale.value = withSpring(0.95);

    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await login(data.publicId);
      router.replace("/questionnaire");
    } catch (error) {
      console.error("Error:", error);
      Alert.alert(
        "Signup Failed",
        error instanceof Error ? error.message : "Please try again later",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
      buttonScale.value = withSpring(1);
    }
  };

  const renderInput = (
    icon: any,
    placeholder: string,
    value: string,
    setValue: (text: string) => void,
    error?: string,
    isPassword: boolean = false,
    isEmail: boolean = false
  ) => (
    <View style={styles.inputWrapper}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: error ? theme.colors.error : theme.colors.border,
          },
        ]}
      >
        {React.cloneElement(icon, { color: theme.colors.placeholder })}
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (error) {
              setErrors((prev) => ({
                ...prev,
                [placeholder.toLowerCase()]: undefined,
              }));
            }
          }}
          secureTextEntry={isPassword}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={isEmail ? "email-address" : "default"}
        />
      </View>
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );

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
            Create Account
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Start your fitness journey today
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={[
            styles.formContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {renderInput(
            <User size={20} style={styles.inputIcon} />,
            "Username",
            username,
            setUsername,
            errors.username
          )}

          {renderInput(
            <Mail size={20} style={styles.inputIcon} />,
            "Email",
            email,
            setEmail,
            errors.email,
            false,
            true
          )}

          {renderInput(
            <Lock size={20} style={styles.inputIcon} />,
            "Password",
            password,
            setPassword,
            errors.password,
            true
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          style={styles.actionContainer}
        >
          <Animated.View style={[buttonStyle]}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Create Account</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.backButtonText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Back to Login
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
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  actionContainer: {
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
});
