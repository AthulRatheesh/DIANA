import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Coffee, 
  Utensils, 
  Moon, 
  Plus, 
  X, 
  Search, 
  Trash2, 
  Save,
  ArrowLeft,
  Info,
  PieChart,
  Calculator
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  quantity?: number;
  unit?: string;
}

interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: FoodItem[];
  totalCalories: number;
}

interface CalorieStats {
  consumed: number;
  burned: number;
  net: number;
  goal: number;
  remaining: number;
}

export default function MealTracker() {
  const { publicId } = useAuth();
  const { theme } = useTheme();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMeal, setAddingMeal] = useState(false);
  const [currentMealType, setCurrentMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodSearch, setFoodSearch] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [calorieStats, setCalorieStats] = useState<CalorieStats>({
    consumed: 0,
    burned: 0,
    net: 0,
    goal: 2000, // Default value
    remaining: 2000
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchMealsForDate(selectedDate);
    }
  }, [userProfile, selectedDate]);

  useEffect(() => {
    // Start both fetches in parallel
    const loadAllData = async () => {
      setLoading(true);
      await fetchUserProfile();
      if (selectedDate) {
        await fetchMealsForDate(selectedDate);
      }
      setLoading(false);
    };
    
    loadAllData();
  }, [publicId, selectedDate]);

  useEffect(() => {
    if (meals.length > 0) {
      // Calculate total calories consumed
      const totalConsumed = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
      
      // Set calorie stats with full recalculation
      setCalorieStats(prev => {
        const newNet = totalConsumed - prev.burned;
        const newRemaining = prev.goal - newNet;
        
        return {
          ...prev,
          consumed: totalConsumed,
          net: newNet,
          remaining: newRemaining
        };
      });
      
      // Auto-save meals whenever they change
      const autoSaveMeals = async () => {
        try {
          const storageKey = `meals_${publicId}_${selectedDate}`;
          await AsyncStorage.setItem(storageKey, JSON.stringify(meals));
        } catch (error) {
          console.error('Error auto-saving meals:', error);
        }
      };
      
      autoSaveMeals();
    }
  }, [meals]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://webrtc-server-c3i0.onrender.com/api/profile/${publicId}`);
      const data = await response.json();
      setUserProfile(data);
      
      // Calculate calorie goal based on user profile
      const goal = calculateCalorieGoal(data);
      
      // Get burned calories
      const exerciseResponse = await fetch(`https://webrtc-server-c3i0.onrender.com/api/exercises/${publicId}`);
      const exerciseData = await exerciseResponse.json();
      const caloriesBurned = exerciseData.daily_calories || 0;
      
      // Don't update consumed calories here, just update the other values
      // This is the key fix - we'll let the meals useEffect handle the consumed value
      setCalorieStats(prev => ({
        ...prev,
        burned: caloriesBurned,
        goal: goal,
        // Don't recalculate net and remaining here since we're keeping the existing consumed value
        // The useEffect that watches meals will handle this calculation correctly
      }));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load user profile');
    }
  };

  const calculateCalorieGoal = (profile: any) => {
    // Use the Harris-Benedict equation to calculate BMR
    let bmr = 0;
    const weight = profile.weight || 70; // kg
    const height = profile.height || 170; // cm
    const age = profile.age || 30;
    const isMale = profile.gender === 'Male';
    
    if (isMale) {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    // Activity multiplier
    let activityMultiplier = 1.2; // Default: Sedentary
    
    switch (profile.activityLevel) {
      case 'Sedentary':
        activityMultiplier = 1.2;
        break;
      case 'Light':
        activityMultiplier = 1.375;
        break;
      case 'Moderate':
        activityMultiplier = 1.55;
        break;
      case 'Active':
        activityMultiplier = 1.725;
        break;
      case 'Very Active':
        activityMultiplier = 1.9;
        break;
    }
    
    const tdee = Math.round(bmr * activityMultiplier);
    
    // Adjust based on goal
    let goalCalories = tdee;
    
    switch (profile.primaryGoal) {
      case 'Weight Loss':
        goalCalories = Math.round(tdee * 0.8); // 20% deficit
        break;
      case 'Weight Gain':
        goalCalories = Math.round(tdee * 1.15); // 15% surplus
        break;
      case 'Maintain':
        goalCalories = tdee;
        break;
    }
    
    return goalCalories;
  };

  const fetchMealsForDate = async (date: string) => {
    try {
      setLoading(true);
      
      // Create the storage key for this user and date
      const storageKey = `meals_${publicId}_${date}`;
      
      // Try to get saved meals from AsyncStorage
      const savedMeals = await AsyncStorage.getItem(storageKey);
      
      if (savedMeals) {
        // If we have saved meals, parse and use them
        const parsedMeals = JSON.parse(savedMeals);
        
        // Ensure totalCalories is calculated correctly for each meal
        const mealsWithCalculatedCalories = parsedMeals.map(meal => {
          // Recalculate the total calories for each meal based on its items
          const totalCalories = meal.items.reduce((sum, item) => sum + (item.calories * (item.quantity || 1)), 0);
          return {
            ...meal,
            totalCalories: totalCalories
          };
        });
        
        setMeals(mealsWithCalculatedCalories);
      } else {
        // Otherwise, initialize with empty meals
        setMeals([
          {
            id: 'breakfast-' + Date.now(),
            type: 'breakfast',
            items: [],
            totalCalories: 0
          },
          {
            id: 'lunch-' + Date.now(),
            type: 'lunch',
            items: [],
            totalCalories: 0
          },
          {
            id: 'dinner-' + Date.now(),
            type: 'dinner',
            items: [],
            totalCalories: 0
          },
          {
            id: 'snack-' + Date.now(),
            type: 'snack',
            items: [],
            totalCalories: 0
          }
        ]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meals:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load meal data');
    }
  };

  const saveMeals = async () => {
    try {
      // Create a storage key that is unique to the user and date
      const storageKey = `meals_${publicId}_${selectedDate}`;
      
      // Save the meals to AsyncStorage
      await AsyncStorage.setItem(storageKey, JSON.stringify(meals));
      
      // Also save to backend API if you have one
      // await fetch(`https://webrtc-server-c3i0.onrender.com/api/meals/${publicId}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     date: selectedDate,
      //     meals: meals
      //   }),
      // });
      
      Alert.alert('Success', 'Your meals have been saved');
    } catch (error) {
      console.error('Error saving meals:', error);
      Alert.alert('Error', 'Failed to save meal data');
    }
  };

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    
    try {
      // Use OpenAI to get food info with calories
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a nutrition database API. For the given food item query, return a JSON array of 5 matching foods with nutrition information.
              Each item should have: name, calories (kcal per 100g/ml or per standard serving), protein (g), carbs (g), fat (g).
              Estimate the values if you're not certain, but make them realistic.
              Format MUST be valid parseable JSON array like this:
              [
                {"name": "Apple", "calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2},
                ...more items
              ]`
            },
            {
              role: 'user',
              content: `Food query: ${query}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`
          }
        }
      );
      
      const content = response.data.choices[0].message.content;
      
      // Extract JSON array from response
      let foodItems: any[] = [];
      try {
        // Look for JSON array pattern in the response
        const match = content.match(/\[\s*\{.*\}\s*\]/s);
        if (match) {
          foodItems = JSON.parse(match[0]);
        } else {
          // Fallback if no JSON pattern found
          foodItems = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('Error parsing food data:', parseError);
        // Fallback with sample data
        foodItems = [
          { name: query, calories: 100, protein: 2, carbs: 15, fat: 1 }
        ];
      }
      
      // Convert to proper FoodItem objects
      const results: FoodItem[] = foodItems.map((item, index) => ({
        id: `search-${Date.now()}-${index}`,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        quantity: 1,
        unit: 'serving'
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching foods:', error);
      // Fallback with sample results
      setSearchResults([
        {
          id: `search-${Date.now()}-1`,
          name: query,
          calories: 100,
          protein: 2,
          carbs: 15,
          fat: 1,
          quantity: 1,
          unit: 'serving'
        }
      ]);
    } finally {
      setSearching(false);
    }
  };

  const addFoodToMeal = (food: FoodItem) => {
    const quantity = food.quantity || 1;
    const foodWithCalculatedCalories = {
      ...food,
      // Ensure calories represents the total for the quantity
      calories: food.calories * quantity
    };
    
    setMeals(prevMeals => {
      return prevMeals.map(meal => {
        if (meal.type === currentMealType) {
          // Add food to this meal
          const newItems = [...meal.items, foodWithCalculatedCalories];
          const newTotalCalories = newItems.reduce((sum, item) => sum + item.calories, 0);
          
          return {
            ...meal,
            items: newItems,
            totalCalories: newTotalCalories
          };
        }
        return meal;
      });
    });
    
    // Close modal after adding
    setAddingMeal(false);
    setSearchResults([]);
    setFoodSearch('');
  };
  

  const removeFoodFromMeal = (mealType: string, foodId: string) => {
    setMeals(prevMeals => {
      return prevMeals.map(meal => {
        if (meal.type === mealType) {
          const newItems = meal.items.filter(item => item.id !== foodId);
          const newTotalCalories = newItems.reduce((sum, item) => sum + item.calories, 0);
          
          return {
            ...meal,
            items: newItems,
            totalCalories: newTotalCalories
          };
        }
        return meal;
      });
    });
  };

  const renderMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast':
        return <Coffee size={24} color={theme.colors.primary} />;
      case 'lunch':
        return <Utensils size={24} color={theme.colors.primary} />;
      case 'dinner':
        return <Moon size={24} color={theme.colors.primary} />;
      case 'snack':
        return <Coffee size={24} color={theme.colors.primary} />;
      default:
        return <Utensils size={24} color={theme.colors.primary} />;
    }
  };

  const getMealTitle = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderMealSection = (meal: Meal) => {
    return (
      <View
        key={meal.id}
        style={[styles.mealSection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            {renderMealIcon(meal.type)}
            <Text style={[styles.mealTitle, { color: theme.colors.text }]}>
              {getMealTitle(meal.type)}
            </Text>
          </View>
          
          <View style={styles.mealHeaderRight}>
            <Text style={[styles.mealCalories, { color: theme.colors.primary }]}>
              {meal.totalCalories} kcal
            </Text>
            <TouchableOpacity
              style={[styles.addFoodButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setCurrentMealType(meal.type as any);
                setAddingMeal(true);
              }}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {meal.items.length > 0 ? (
          <View style={styles.foodItemsContainer}>
            {meal.items.map((food) => (
              <View key={food.id} style={styles.foodItem}>
                <View style={styles.foodItemInfo}>
                  <Text style={[styles.foodName, { color: theme.colors.text }]}>{food.name}</Text>
                  <Text style={[styles.foodCalories, { color: theme.colors.textSecondary }]}>
                    {food.calories} kcal
                    {food.protein && food.carbs && food.fat && (
                      ` • P: ${food.protein}g • C: ${food.carbs}g • F: ${food.fat}g`
                    )}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeFoodFromMeal(meal.type, food.id)}
                >
                  <Trash2 size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyMealContainer}>
            <Text style={[styles.emptyMealText, { color: theme.colors.textSecondary }]}>
              No items added yet. Tap + to add food.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAddFoodModal = () => {
    return (
      <Modal
        visible={addingMeal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddingMeal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Add Food to {getMealTitle(currentMealType)}
              </Text>
              <TouchableOpacity onPress={() => {
                setAddingMeal(false);
                setSearchResults([]);
                setFoodSearch('');
              }}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.searchContainer, { 
              backgroundColor: theme.colors.backgroundSecondary,
              borderColor: theme.colors.border
            }]}>
              <Search size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search foods..."
                placeholderTextColor={theme.colors.textSecondary}
                value={foodSearch}
                onChangeText={(text) => {
                  setFoodSearch(text);
                  if (text.length > 2) {
                    searchFoods(text);
                  } else if (text.length === 0) {
                    setSearchResults([]);
                  }
                }}
                returnKeyType="search"
                onSubmitEditing={() => searchFoods(foodSearch)}
              />
              {foodSearch.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setFoodSearch('');
                  setSearchResults([]);
                }}>
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            {searching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Searching foods...
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.searchResultItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => addFoodToMeal(item)}
                  >
                    <View style={styles.searchResultInfo}>
                      <Text style={[styles.searchResultName, { color: theme.colors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.searchResultCalories, { color: theme.colors.textSecondary }]}>
                        {item.calories} kcal
                        {item.protein && item.carbs && item.fat && (
                          ` • P: ${item.protein}g • C: ${item.carbs}g • F: ${item.fat}g`
                        )}
                      </Text>
                    </View>
                    <Plus size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptySearchContainer}>
                    {foodSearch.length > 0 ? (
                      <Text style={[styles.emptySearchText, { color: theme.colors.textSecondary }]}>
                        No results found. Try different keywords.
                      </Text>
                    ) : (
                      <Text style={[styles.emptySearchText, { color: theme.colors.textSecondary }]}>
                        Start typing to search for foods.
                      </Text>
                    )}
                  </View>
                }
              />
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.colors.statusBar} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading meal data...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.colors.statusBar} />
      
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => window.history.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Meal Tracker</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={saveMeals}
        >
          <Save size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Calorie Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.summaryHeader}>
              <PieChart size={24} color={theme.colors.primary} />
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Daily Calorie Summary</Text>
            </View>
            
            <View style={styles.calorieStats}>
              <View style={styles.calorieStat}>
                <Text style={[styles.calorieValue, { color: theme.colors.text }]}>{calorieStats.consumed}</Text>
                <Text style={[styles.calorieLabel, { color: theme.colors.textSecondary }]}>Consumed</Text>
              </View>
              
              <View style={styles.calorieStatDivider} />
              
              <View style={styles.calorieStat}>
                <Text style={[styles.calorieValue, { color: theme.colors.text }]}>{calorieStats.burned}</Text>
                <Text style={[styles.calorieLabel, { color: theme.colors.textSecondary }]}>Burned</Text>
              </View>
              
              <View style={styles.calorieStatDivider} />
              
              <View style={styles.calorieStat}>
                <Text style={[
                  styles.calorieValue, 
                  { 
                    color: calorieStats.net > 0 
                      ? (userProfile?.primaryGoal === 'Weight Gain' ? theme.colors.success : theme.colors.warning) 
                      : (userProfile?.primaryGoal === 'Weight Loss' ? theme.colors.success : theme.colors.warning)
                  }
                ]}>
                  {calorieStats.net > 0 ? '+' : ''}{calorieStats.net}
                </Text>
                <Text style={[styles.calorieLabel, { color: theme.colors.textSecondary }]}>Net</Text>
              </View>
            </View>
            
            <View style={[styles.goalContainer, { borderTopColor: theme.colors.border }]}>
              <View style={styles.goalTextContainer}>
                <Text style={[styles.goalText, { color: theme.colors.textSecondary }]}>
                  Daily Goal: {calorieStats.goal} kcal
                </Text>
                <Text style={[styles.remainingText, { 
                  color: calorieStats.remaining > 0 ? theme.colors.success : theme.colors.error 
                }]}>
                  {calorieStats.remaining > 0 
                    ? `${calorieStats.remaining} kcal remaining` 
                    : `${Math.abs(calorieStats.remaining)} kcal over limit`}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => Alert.alert(
                  'Calorie Goal Info',
                  `Your calorie goal is calculated based on your profile information and goal to ${userProfile?.primaryGoal.toLowerCase() || 'maintain weight'}.`
                )}
              >
                <Info size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Meals Sections */}
          {meals.map(meal => renderMealSection(meal))}
          
          
        </View>
      </ScrollView>
      
      {renderAddFoodModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  calorieStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  calorieStat: {
    alignItems: 'center',
  },
  calorieStatDivider: {
    height: 40,
    width: 1,
    backgroundColor: '#333333',
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calorieLabel: {
    fontSize: 14,
  },
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalText: {
    fontSize: 14,
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoButton: {
    padding: 8,
  },
  mealSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  addFoodButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItemsContainer: {
    marginTop: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  foodItemInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    marginBottom: 4,
  },
  foodCalories: {
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  emptyMealContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyMealText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderWidth: 1,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    marginBottom: 4,
  },
  searchResultCalories: {
    fontSize: 14,
  },
  emptySearchContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 16,
    textAlign: 'center',
  },
  calorieCalculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 40,
    borderWidth: 1,
  },
  calorieCalculatorText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});