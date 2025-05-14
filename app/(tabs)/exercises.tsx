import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Dumbbell,
  Plus,
  ChevronRight,
  Check,
  X,
  Clock,
  Search,
  Filter,
  Minus,
  Flame,
  Calendar,
  BarChart,
} from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

interface Exercise {
  Exercise: string;
  Description: string;
  "Target Muscles": string;
  "MET Value": number;
  Category: string;
  duration: number;
  Estimated_Calories: number;
}

interface UserProfile {
  weight: number;
  height: number;
  gender: string;
  age: number;
}

const Header = ({ title, subtitle }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.card,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Text
        style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
      >
        {subtitle}
      </Text>
    </View>
  );
};

const StatsCard = ({ icon: Icon, label, value, unit }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.statsCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.statsIconContainer,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Icon size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.statsContent}>
        <Text style={[styles.statsValue, { color: theme.colors.text }]}>
          {value}
        </Text>
        <Text
          style={[styles.statsLabel, { color: theme.colors.textSecondary }]}
        >
          {label}
        </Text>
        {unit && (
          <Text
            style={[styles.statsUnit, { color: theme.colors.textSecondary }]}
          >
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
};

const CategoryChip = ({ label, selected, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        {
          backgroundColor: selected
            ? theme.colors.primary
            : theme.colors.backgroundSecondary,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.categoryText,
          { color: selected ? "#FFFFFF" : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function ExerciseScreen() {
  const { publicId } = useAuth();
  const { theme } = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [durationInputValue, setDurationInputValue] = useState("30");
  const [weeklyStats, setWeeklyStats] = useState({
    calories: [],
    dates: [],
  });
  const [exerciseDurations, setExerciseDurations] = useState<{
    [key: string]: number;
  }>({});
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const fadeAnim = useSharedValue(0);

  // Fetch functions
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(
        `https://webrtc-server-c3i0.onrender.com/api/profile/${publicId}`
      );
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, [publicId]);

  const fetchAllExercises = useCallback(async () => {
    try {
      const response = await fetch(
        "https://webrtc-server-c3i0.onrender.com/api/available-exercises"
      );
      const data = await response.json();
      setAvailableExercises(data);
    } catch (error) {
      console.error("Error fetching available exercises:", error);
    }
  }, []);

  useEffect(() => {
    if (availableExercises.length > 0) {
      // Get unique categories from the data
      const uniqueCategories = [
        ...new Set(
          availableExercises.map((ex) => ex.Category).filter(Boolean) // Remove null/undefined values
        ),
      ];
      console.log("Available categories in data:", uniqueCategories);
    }
  }, [availableExercises]);

  const fetchExercises = useCallback(async () => {
    try {
      const response = await fetch(
        `https://webrtc-server-c3i0.onrender.com/api/exercises/${publicId}`
      );
      const data = await response.json();

      const exercisesWithDurations = data.exercises.map(
        (exercise: Exercise) => ({
          ...exercise,
          duration: exercise.duration || 30,
        })
      );

      setExercises(exercisesWithDurations);
      setCompletedExercises(data.completed || []);
      setDailyCalories(data.daily_calories || 0);

      const durationsMap = exercisesWithDurations.reduce(
        (acc: any, exercise: Exercise) => {
          acc[exercise.Exercise] = exercise.duration;
          return acc;
        },
        {}
      );
      setExerciseDurations(durationsMap);

      // Animate fade in after data is loaded
      fadeAnim.value = withTiming(1, { duration: 500 });
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  }, [publicId, fadeAnim]);

  const fetchWeeklyStats = useCallback(async () => {
    try {
      const response = await fetch(
        `https://webrtc-server-c3i0.onrender.com/api/weekly-stats/${publicId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();

      const today = new Date();
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });

      const calories = dates.map((date) => {
        const index = data.dates.indexOf(date);
        return index === -1
          ? date === today.toISOString().split("T")[0]
            ? dailyCalories
            : 0
          : data.calories[index];
      });

      setWeeklyStats({
        dates,
        calories,
      });
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      setWeeklyStats({
        dates: [],
        calories: [],
      });
    }
  }, [publicId, dailyCalories]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUserProfile(),
        fetchAllExercises(),
        fetchExercises(),
        fetchWeeklyStats(),
      ]);
    };
    loadData();
  }, [fetchUserProfile, fetchAllExercises, fetchExercises, fetchWeeklyStats]);

  // Utility functions
  const calculateCalories = (
    exercise: Exercise,
    duration: number,
    weight: number
  ) => {
    const MET = exercise["MET Value"] || 3;
    const timeInHours = duration / 60;
    return Math.round(MET * weight * timeInHours);
  };

  const handleDurationChange = useCallback(
    async (exercise: Exercise, newDuration: number) => {
      try {
        setExerciseDurations((prev) => ({
          ...prev,
          [exercise.Exercise]: newDuration,
        }));

        const calories = calculateCalories(
          exercise,
          newDuration,
          userProfile?.weight || 70
        );

        if (completedExercises.includes(exercise.Exercise)) {
          await fetch(
            "https://webrtc-server-c3i0.onrender.com/api/update-exercise-duration",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                publicId,
                exercise: exercise.Exercise,
                duration: newDuration,
                calories,
              }),
            }
          );

          fetchExercises();
        }
      } catch (error) {
        console.error("Error updating duration:", error);
        Alert.alert("Error", "Failed to update exercise duration");
      }
    },
    [publicId, completedExercises, userProfile, fetchExercises]
  );

  const toggleExerciseCompletion = async (exercise: Exercise) => {
    try {
      const isCompleted = completedExercises.includes(exercise.Exercise);
      const endpoint = isCompleted ? "remove-exercise" : "complete-exercise";
      const duration =
        exerciseDurations[exercise.Exercise] || exercise.duration || 30;

      const calories = calculateCalories(
        exercise,
        duration,
        userProfile?.weight || 70
      );

      const response = await fetch(
        `https://webrtc-server-c3i0.onrender.com/api/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicId,
            exercise: exercise.Exercise,
            calories,
            duration,
          }),
        }
      );

      if (response.ok) {
        const newCalories = isCompleted
          ? dailyCalories - calories
          : dailyCalories + calories;

        setDailyCalories(newCalories);
        setCompletedExercises((prev) =>
          isCompleted
            ? prev.filter((e) => e !== exercise.Exercise)
            : [...prev, exercise.Exercise]
        );

        fetchWeeklyStats();
      }
    } catch (error) {
      console.error("Error toggling exercise:", error);
      Alert.alert("Error", "Failed to update exercise status");
    }
  };

  const addExercise = async (exercise: Exercise) => {
    try {
      const exerciseWithDuration = {
        ...exercise,
        duration: selectedDuration,
        Estimated_Calories: calculateCalories(
          exercise,
          selectedDuration,
          userProfile?.weight || 70
        ),
      };

      const response = await fetch(
        "https://webrtc-server-c3i0.onrender.com/api/add-exercise",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicId,
            exercise: exerciseWithDuration,
          }),
        }
      );

      if (response.ok) {
        await fetchExercises();
        setShowExerciseModal(false);
      }
    } catch (error) {
      console.error("Error adding exercise:", error);
      Alert.alert("Error", "Failed to add exercise");
    }
  };

  // Render functions
  const renderAnalytics = () => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    };

    const chartData = {
      labels: weeklyStats.dates.map(formatDate),
      datasets: [
        {
          data: weeklyStats.calories,
          color: (opacity = 1) => `rgba(1, 100, 216, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    const chartConfig = {
      backgroundColor: theme.colors.card,
      backgroundGradientFrom: theme.colors.card,
      backgroundGradientTo: theme.colors.card,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(1, 100, 216, ${opacity})`,
      labelColor: (opacity = 1) =>
        `rgba(${theme.dark ? "231, 231, 231" : "50, 50, 50"}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: theme.colors.primary,
      },
    };

    return (
      <View style={styles.analyticsContainer}>
        <View
          style={[
            styles.chartContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Weekly Progress
          </Text>
          <LineChart
            data={chartData}
            width={width - 34}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>
    );
  };

  // Using Reanimated v2 style for animations
  const fadeStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const renderExerciseCard = (exercise: Exercise) => {
    const duration =
      exerciseDurations[exercise.Exercise] || exercise.duration || 30;
    const calories = calculateCalories(
      exercise,
      duration,
      userProfile?.weight || 70
    );
    const isCompleted = completedExercises.includes(exercise.Exercise);

    return (
      <Animated.View
        entering={FadeIn}
        style={[
          styles.exerciseCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.exerciseContent}
          onPress={() => toggleExerciseCompletion(exercise)}
        >
          <View
            style={[
              styles.exerciseIconContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Dumbbell size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
              {exercise.Exercise}
            </Text>
            <Text
              style={[
                styles.exerciseSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {exercise["Target Muscles"]} • MET {exercise["MET Value"]}
            </Text>
            <View style={styles.exerciseMetrics}>
              <TouchableOpacity
                style={[
                  styles.durationButton,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedExercise(exercise.Exercise);
                  setSelectedDuration(duration);
                  setDurationInputValue(String(duration));
                  setShowDurationModal(true);
                }}
              >
                <Clock size={16} color={theme.colors.textSecondary} />
                <Text
                  style={[styles.durationText, { color: theme.colors.text }]}
                >
                  {duration} min
                </Text>
              </TouchableOpacity>
              <View style={styles.calorieContainer}>
                <Flame size={16} color={theme.colors.primary} />
                <Text
                  style={[styles.calorieText, { color: theme.colors.primary }]}
                >
                  {calories} cal
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.exerciseStatus}>
            {isCompleted ? (
              <View
                style={[
                  styles.completedIcon,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Check size={20} color="#FFFFFF" />
              </View>
            ) : (
              <ChevronRight size={24} color={theme.colors.textSecondary} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDurationModal = () => (
    <Modal
      visible={showDurationModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDurationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Set Duration
            </Text>
            <TouchableOpacity onPress={() => setShowDurationModal(false)}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.durationInputContainer}>
            <TouchableOpacity
              style={[
                styles.durationAdjustButton,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                const newValue = Math.max(5, parseInt(durationInputValue) - 5);
                setDurationInputValue(String(newValue));
                setSelectedDuration(newValue);
              }}
            >
              <Minus size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            <TextInput
              style={[
                styles.durationTextInput,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={durationInputValue}
              keyboardType="number-pad"
              onChangeText={(text) => {
                const number = parseInt(text);
                if (!isNaN(number)) {
                  if (number >= 5 && number <= 120) {
                    setDurationInputValue(text);
                    setSelectedDuration(number);
                  }
                } else if (text === "") {
                  setDurationInputValue("");
                }
              }}
              onBlur={() => {
                if (!durationInputValue || parseInt(durationInputValue) < 5) {
                  setDurationInputValue("5");
                  setSelectedDuration(5);
                }
              }}
            />

            <TouchableOpacity
              style={[
                styles.durationAdjustButton,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                const newValue = Math.min(
                  120,
                  parseInt(durationInputValue) + 5
                );
                setDurationInputValue(String(newValue));
                setSelectedDuration(newValue);
              }}
            >
              <Plus size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            <Text
              style={[
                styles.minutesLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              minutes
            </Text>
          </View>

          <View
            style={[
              styles.modalButtons,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                { backgroundColor: theme.colors.backgroundSecondary },
              ]}
              onPress={() => {
                setShowDurationModal(false);
                setDurationInputValue("30");
              }}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.confirmButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                if (selectedExercise) {
                  const exercise = exercises.find(
                    (e) => e.Exercise === selectedExercise
                  );
                  if (exercise) {
                    handleDurationChange(exercise, selectedDuration);
                  }
                }
                setShowDurationModal(false);
              }}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCategoryChips = () => {
    // Use the categories that exist in your data
    const categories = ["All", "Weight Loss", "Muscle Gain", "Maintenance"];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {categories.map((category) => (
          <CategoryChip
            key={category}
            label={category}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>
    );
  };

  const renderAddExerciseModal = () => (
    <Modal
      visible={showExerciseModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowExerciseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Add Exercise
            </Text>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Search size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search exercises..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Search size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search exercises..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View> */}

          {renderCategoryChips()}

          <View style={styles.durationSetting}>
            <Text style={[styles.durationLabel, { color: theme.colors.text }]}>
              Duration:
            </Text>
            <View
              style={[
                styles.durationControls,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.durationAdjustButton,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() =>
                  setSelectedDuration(Math.max(selectedDuration - 5, 5))
                }
              >
                <Minus size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text
                style={[styles.durationValue, { color: theme.colors.text }]}
              >
                {selectedDuration} min
              </Text>
              <TouchableOpacity
                style={[
                  styles.durationAdjustButton,
                  {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() =>
                  setSelectedDuration(Math.min(selectedDuration + 5, 120))
                }
              >
                <Plus size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={availableExercises.filter((exercise) => {
              // Use the exercise's Category property for filtering
              const matchesCategory =
                selectedCategory === "All" ||
                exercise.Category === selectedCategory;

              const matchesSearch = exercise.Exercise.toLowerCase().includes(
                searchQuery.toLowerCase()
              );

              return matchesCategory && matchesSearch;
            })}
            keyExtractor={(item) => item.Exercise}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.exerciseListItem,
                  { borderBottomColor: theme.colors.border },
                ]}
                onPress={() => addExercise(item)}
              >
                <View style={styles.exerciseListContent}>
                  <Text
                    style={[
                      styles.exerciseListName,
                      { color: theme.colors.text },
                    ]}
                  >
                    {item.Exercise}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseListDetails,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item["Target Muscles"]} • MET {item["MET Value"]}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseListCategory,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Category: {item.Category || "General"}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseListCalories,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {calculateCalories(
                      item,
                      selectedDuration,
                      userProfile?.weight || 70
                    )}{" "}
                    cal / {selectedDuration} min
                  </Text>
                </View>
                <Plus size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.noExercisesContainer}>
                <Text
                  style={[
                    styles.noExercisesText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No exercises found for this category
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <StatusBar style={theme.colors.statusBar} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={theme.colors.statusBar} />
      <Header
        title="Exercise Tracking"
        subtitle="Track your daily workouts and progress"
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.summaryContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              icon={Flame}
              label="Calories"
              value={dailyCalories}
              unit="kcal"
            />
            <StatsCard
              icon={Check}
              label="Completed"
              value={`${completedExercises.length}/${exercises.length}`}
              unit="exercises"
            />
          </View>
        </View>

        {renderAnalytics()}

        <View style={styles.exercisesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Today's Exercises
            </Text>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setShowExerciseModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {exercises.map((exercise) => (
            <View key={exercise.Exercise}>{renderExerciseCard(exercise)}</View>
          ))}
        </View>
      </ScrollView>

      {renderAddExerciseModal()}
      {renderDurationModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statsCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    borderWidth: 1,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
  },
  statsUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  analyticsContainer: {
    padding: 16,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
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
  exercisesContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    marginLeft: 4,
    fontWeight: "600",
  },
  exerciseCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  exerciseContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  exerciseMetrics: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
  },
  durationText: {
    marginLeft: 4,
    fontSize: 14,
  },
  calorieContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  calorieText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  exerciseStatus: {
    marginLeft: 12,
  },
  completedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "80%",
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexGrow: 0,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 38,
    borderWidth: 1,
    minHeight: 40, // Add minimum width
    alignItems: "center", // Center text
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center", // Center text
  },
  durationSetting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  durationLabel: {
    fontSize: 16,
  },
  durationControls: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  durationValue: {
    fontSize: 16,
    marginHorizontal: 12,
  },
  durationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  durationAdjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  durationTextInput: {
    width: 80,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 18,
    marginHorizontal: 16,
  },
  minutesLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: "center",
  },
  cancelButton: {},
  confirmButton: {},
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  exerciseListContent: {
    flex: 1,
    marginRight: 16,
  },
  exerciseListName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  exerciseListDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  exerciseListCalories: {
    fontSize: 14,
  },
  noExercisesContainer: {
    padding: 20,
    alignItems: "center",
  },
  noExercisesText: {
    fontSize: 16,
    textAlign: "center",
  },
});
