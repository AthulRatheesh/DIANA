import React, { useState, useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import {
  Home,
  User,
  Calendar,
  LogOut,
  Utensils,
  Bot,
  Camera,
  Dumbbell,
  Lightbulb,
  Newspaper,
  Coffee,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { router } from "expo-router";
import { View, TouchableOpacity, StyleSheet, Image, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue,
  runOnJS,
  FadeIn,
  FadeOut 
} from "react-native-reanimated";

// Sample fitness facts
const fitnessFacts = [
  "Walking just 30 minutes a day can reduce your risk of heart disease by 19%.",
  "Staying hydrated can increase your exercise performance by up to 25%.",
  "Strength training helps prevent the loss of 3-5% of muscle mass each decade.",
  "Regular exercise can improve your memory and brain function by up to 30%.",
  "A good night's sleep improves athletic performance by up to 10%.",
  "Consistent exercise can reduce symptoms of anxiety by up to 20%.",
  "Eating protein after a workout helps muscle recovery by up to 33%.",
  "Just 5 minutes of outdoor exercise can improve your mental health significantly.",
  "Maintaining good posture can increase oxygen intake by up to 30%.",
  "Regular stretching can improve your flexibility by up to 28% in just four weeks."
];

// Welcome Fact Component
const WelcomeFact = ({ fact, onComplete }) => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    // Smooth fade in with slight bounce effect
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withTiming(1.05, { duration: 600 }, () => {
      scale.value = withTiming(1, { duration: 300 });
    });
    translateY.value = withTiming(0, { duration: 600 });
    
    // Fade out after 4 seconds (giving users more time to read)
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 800 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      });
      scale.value = withTiming(0.95, { duration: 800 });
      translateY.value = withTiming(10, { duration: 800 });
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ]
    };
  });
  
  return (
    <Animated.View style={[styles.factOverlay, animatedStyle]}>
      <View style={[styles.factContainer, { 
        backgroundColor: theme.colors.card, 
        borderColor: theme.colors.border 
      }]}>
        <View style={[styles.factIconContainer, { 
          backgroundColor: theme.colors.backgroundSecondary, 
          borderColor: theme.colors.border 
        }]}>
          <Lightbulb size={28} color={theme.colors.primary} />
        </View>
        <Text style={[styles.factText, { color: theme.colors.text }]}>{fact}</Text>
      </View>
    </Animated.View>
  );
};

const Header = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.header, { 
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.border 
    }]}>
      <View style={styles.headerContent}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <User size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function TabsLayout() {
  const { logout, publicId } = useAuth();
  const { theme, isDark } = useTheme();
  const [showWelcomeFact, setShowWelcomeFact] = useState(false);
  const [welcomeFact, setWelcomeFact] = useState("");
  const isMounted = useRef(true);

  // Show fact when component mounts (once per session)
  useEffect(() => {
    // We'll use a session-based approach instead of AsyncStorage
    // This ensures the fact shows once per login session
    if (publicId && isMounted.current) {
      // Slight delay to ensure smooth transition after navigation
      const timer = setTimeout(() => {
        // Select a random fact
        const randomFact = fitnessFacts[Math.floor(Math.random() * fitnessFacts.length)];
        setWelcomeFact(randomFact);
        setShowWelcomeFact(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleWelcomeFactComplete = () => {
    if (isMounted.current) {
      setShowWelcomeFact(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.colors.statusBar} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <Header />
      </SafeAreaView>
      <Tabs
        screenOptions={{
          header: () => null,
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          tabBarStyle: {
            borderTopWidth: 1,
            borderColor: theme.colors.border,
            paddingVertical: 10,
            backgroundColor: theme.colors.background,
            height: 60,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: 4,
          },
          tabBarItemStyle: {
            padding: 4,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: "Schedule",
            tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: "Exercise",
            tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} />,
          }}
        />
        <Tabs.Screen
  name="meal-tracker"
  options={{
    title: "Meals",
    tabBarIcon: ({ color }) => <Utensils size={24} color={color} />,
  }}
/>
<Tabs.Screen
  name="recipes"
  options={{
    title: "Recipes",
    // Change the recipes icon to something different (e.g., Coffee)
    tabBarIcon: ({ color }) => <Coffee size={24} color={color} />,
  }}
/>
        <Tabs.Screen
          name="scan"
          options={{
            title: "Scan",
            tabBarIcon: ({ color }) => <Camera size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="health-news"
          options={{
            title: "News",
            tabBarIcon: ({ color }) => <Newspaper size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="logout"
          options={{
            title: "Logout",
            tabBarIcon: ({ color }) => <LogOut size={24} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handleLogout();
            },
          }}
        />
        
        {/* Hidden screens that still exist but not in tab bar */}
        <Tabs.Screen
          name="profile"
          options={{
            href: null, // This hides it from the tab bar
          }}
        />
        
        {/* Keep chat accessible but not in the tab bar */}
        <Tabs.Screen
          name="chat"
          options={{
            href: null, // This hides it from the tab bar
          }}
        />
      </Tabs>

      {/* Welcome Fact Overlay - now at the layout level to cover entire screen */}
      {showWelcomeFact && (
        <WelcomeFact fact={welcomeFact} onComplete={handleWelcomeFactComplete} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    // Using theme.colors.background from props
  },
  header: {
    // Using theme colors from props
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Welcome Fact styles
  factOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  factContainer: {
    borderRadius: 16,
    padding: 24,
    width: "85%",
    alignItems: "center",
    borderWidth: 1,
  },
  factIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  factText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});