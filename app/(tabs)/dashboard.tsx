import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { router } from "expo-router";
import {
  Activity,
  Scale,
  Dumbbell,
  Utensils,
  TrendingUp,
  Target,
  Award,
  ChevronRight,
  HeartPulse,
  Bot,
  Timer,
  Flame,
  Newspaper
} from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_URL = "https://webrtc-server-c3i0.onrender.com";

interface WeightHistory {
  date: string;
  weight: number;
}

interface UserProfile {
  name: string;
  weight: number;
  targetWeight: number;
  primaryGoal: string;
  activityLevel: string;
  workoutFrequency: number;
  workoutDuration: number;
  dietType: string;
}

interface WeeklyStats {
  dates: string[];
  calories: number[];
  completion: number[];
}

interface TodayStats {
  calories: number;
  completion: number;
}

const WelcomeCard = ({ name, primaryGoal }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.welcomeCard, { 
      backgroundColor: theme.colors.card, 
      borderColor: theme.colors.border
    }]}>
      <View style={styles.welcomeContent}>
        <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>Welcome back,</Text>
        <Text style={[styles.nameText, { color: theme.colors.text }]}>{name || "User"}</Text>
        <Text style={[styles.goalText, { color: theme.colors.primary }]}>Goal: {primaryGoal || "Stay Healthy"}</Text>
      </View>
      <Award size={48} color={theme.colors.primary} style={styles.welcomeIcon} />
    </View>
  );
};

const StatCard = ({ icon: Icon, label, value, unit, onPress }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.statCard, { 
        backgroundColor: theme.colors.card, 
        borderColor: theme.colors.border
      }]} 
      onPress={onPress}
    >
      <View style={[styles.statIconContainer, { 
        backgroundColor: theme.colors.backgroundSecondary, 
        borderColor: theme.colors.border
      }]}>
        <Icon size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        {unit && <Text style={[styles.statUnit, { color: theme.colors.textSecondary }]}>{unit}</Text>}
      </View>
      <ChevronRight size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
};

const QuickActionButton = ({ icon: Icon, label, onPress }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.quickActionButton, { 
        backgroundColor: theme.colors.card, 
        borderColor: theme.colors.border
      }]} 
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { 
        backgroundColor: theme.colors.backgroundSecondary, 
        borderColor: theme.colors.border
      }]}>
        <Icon size={24} color={theme.colors.primary} />
      </View>
      <Text style={[styles.quickActionLabel, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function Dashboard() {
  const { publicId } = useAuth();
  const { theme } = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    dates: [],
    calories: [],
    completion: [],
  });
  const [todayStats, setTodayStats] = useState<TodayStats>({
    calories: 0,
    completion: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);
  const isMounted = useRef(true);

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(scrollY.value > 50 ? -50 : 0),
        },
      ],
    };
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile/${publicId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setUserProfile({
        name: data.name || "",
        weight: parseFloat(data.weight) || 0,
        targetWeight: parseFloat(data.target_weight) || 0,
        primaryGoal: data.primary_goal || "Stay Healthy",
        activityLevel: data.activity_level || "Sedentary",
        workoutFrequency: parseInt(data.workout_frequency) || 0,
        workoutDuration: parseInt(data.workout_duration) || 0,
        dietType: data.diet_type || "Non-vegetarian",
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    }
  }, [publicId]);

  const fetchTodayStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/exercises/${publicId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exercise data");
      }
      const data = await response.json();

      // Calculate completion percentage
      const totalExercises = data.exercises.length;
      const completedExercises = data.completed.length;
      const completionRate =
        totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

      setTodayStats({
        calories: data.daily_calories || 0,
        completion: Math.round(completionRate),
      });
    } catch (error) {
      console.error("Error fetching today stats:", error);
    }
  }, [publicId]);

  const fetchWeeklyStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/weekly-stats/${publicId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();

      setWeeklyStats({
        dates: data.dates || [],
        calories: data.calories || [],
        completion: data.completion || [],
      });
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      setWeeklyStats({
        dates: [],
        calories: [],
        completion: [],
      });
    }
  }, [publicId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchTodayStats(),
        fetchWeeklyStats(),
      ]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchUserProfile, fetchTodayStats, fetchWeeklyStats]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    
    return () => {
      clearInterval(interval);
      isMounted.current = false;
    };
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateProgress = () => {
    if (!userProfile?.weight || !userProfile?.targetWeight) return 0;

    const currentWeight = userProfile.weight;
    const targetWeight = userProfile.targetWeight;

    if (currentWeight === targetWeight) return 100;

    // Determine if goal is to lose or gain weight
    const isWeightLoss = currentWeight > targetWeight;

    // Calculate total distance to goal
    const totalDistance = Math.abs(currentWeight - targetWeight);

    // Calculate current progress based on goal direction
    if (isWeightLoss) {
      // For weight loss, higher weight means less progress
      return (
        ((totalDistance - Math.abs(currentWeight - targetWeight)) /
          totalDistance) *
        100
      );
    } else {
      // For weight gain, lower weight means less progress
      return (
        ((totalDistance - Math.abs(currentWeight - targetWeight)) /
          totalDistance) *
        100
      );
    }
  };

  const renderChart = () => {
    if (!weeklyStats || weeklyStats.dates.length === 0) {
      return null;
    }

    const chartConfig = {
      backgroundColor: theme.colors.card,
      backgroundGradientFrom: theme.colors.card,
      backgroundGradientTo: theme.colors.card,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(1, 100, 216, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${theme.dark ? '231, 231, 231' : '50, 50, 50'}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: theme.colors.primary,
      },
    };

    const chartData = {
      labels: weeklyStats.dates.map((date) => {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", { weekday: "short" });
      }),
      datasets: [
        {
          data: weeklyStats.calories,
          color: (opacity = 1) => `rgba(1, 100, 216, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={[styles.chartContainer, { 
        backgroundColor: theme.colors.card, 
        borderColor: theme.colors.border
      }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Weekly Activity</Text>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 34}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.colors.statusBar} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.colors.statusBar} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <WelcomeCard
            name={userProfile?.name}
            primaryGoal={userProfile?.primaryGoal}
          />

          <View style={styles.statsContainer}>
            <StatCard
              icon={Activity}
              label="Daily Progress"
              value={`${todayStats.completion}%`}
              onPress={() => router.push("/(tabs)/exercises")}
            />
            <StatCard
              icon={Flame}
              label="Calories Burned"
              value={todayStats.calories}
              unit="kcal"
              onPress={() => router.push("/(tabs)/exercises")}
            />
          </View>

          <View style={styles.quickActionsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton
                icon={Dumbbell}
                label="Start Workout"
                onPress={() => router.push("/(tabs)/exercises")}
              />
              <QuickActionButton
                icon={Utensils}
                label="Find Recipe"
                onPress={() => router.push("/(tabs)/recipes")}
              />
              <QuickActionButton
                icon={Newspaper}
                label="Health News"
                onPress={() => router.push("/(tabs)/health-news")}
              />
              <QuickActionButton
                icon={Bot}
                label="Ask DIANA"
                onPress={() => router.push("/(tabs)/chat")}
              />
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Progress</Text>
            <View style={[styles.progressCard, { 
              backgroundColor: theme.colors.card, 
              borderColor: theme.colors.border
            }]}>
              <View style={styles.progressHeader}>
                <HeartPulse size={24} color={theme.colors.primary} />
                <Text style={[styles.progressTitle, { color: theme.colors.text }]}>Weight Goal Progress</Text>
              </View>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                  Current: {userProfile?.weight?.toFixed(1) || "0"} kg
                </Text>
                <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                  Target: {userProfile?.targetWeight?.toFixed(1) || "0"} kg
                </Text>
              </View>
              <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(
                        Math.max(calculateProgress(), 0),
                        100
                      )}%`,
                      backgroundColor: theme.colors.primary
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {renderChart()}

          <View style={styles.insightsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly Insights</Text>
            <View style={[styles.insightCard, { 
              backgroundColor: theme.colors.card, 
              borderColor: theme.colors.border
            }]}>
              <View style={[styles.insightRow, { borderBottomColor: theme.colors.border }]}>
                <Timer size={20} color={theme.colors.primary} />
                <Text style={[styles.insightText, { color: theme.colors.text }]}>
                  Completed {userProfile?.workoutFrequency || 0} workouts this
                  week
                </Text>
              </View>
              <View style={[styles.insightRow, { borderBottomColor: theme.colors.border }]}>
                <TrendingUp size={20} color={theme.colors.primary} />
                <Text style={[styles.insightText, { color: theme.colors.text }]}>
                  Burned {weeklyStats.calories.reduce((a, b) => a + b, 0)}{" "}
                  calories
                </Text>
              </View>
              <View style={[styles.insightRow, { borderBottomColor: theme.colors.border }]}>
                <Target size={20} color={theme.colors.primary} />
                <Text style={[styles.insightText, { color: theme.colors.text }]}>
                  Average completion rate:{" "}
                  {Math.round(
                    weeklyStats.completion.reduce((a, b) => a + b, 0) /
                      (weeklyStats.completion.length || 1)
                  )}
                  %
                </Text>
              </View>
            </View>
          </View>
          
          {/* Health News Banner */}
          <TouchableOpacity 
            style={[styles.newsBanner, { 
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.border
            }]}
            onPress={() => router.push("/(tabs)/health-news")}
          >
            <View style={styles.newsTextContainer}>
              <Text style={styles.newsBannerTitle}>Latest Health News</Text>
              <Text style={styles.newsBannerSubtitle}>
                Stay updated with health trends in India
              </Text>
            </View>
            <Newspaper size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },
  goalText: {
    fontSize: 14,
    fontWeight: "500",
  },
  welcomeIcon: {
    marginLeft: 16,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressSection: {
    marginBottom: 24,
  },
  progressCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: -16,
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  newsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  newsTextContainer: {
    flex: 1,
  },
  newsBannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});