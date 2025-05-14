import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { ChefHat, Send, Clock, Users, Star, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

interface Recipe {
  name: string;
  ingredients: string;
  directions: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  servings: number;
  rating: number;
}

interface Message {
  type: 'user' | 'bot';
  content: string | Recipe[];
  timestamp: Date;
  id: string;
  displayContent?: string;
  isStreaming?: boolean;
}

// Typing animation component
const TypingAnimation = () => {
  const { theme } = useTheme();
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.timing(dot, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
    };

    Animated.loop(
      Animated.parallel([
        animateDot(dot1, 0),
        animateDot(dot2, 200),
        animateDot(dot3, 400),
      ])
    ).start();
  }, []);

  const dotStyle = (animation: Animated.Value) => ({
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View style={[styles.typingContainer, { 
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border
    }]}>
      <ChefHat size={20} color={theme.colors.textSecondary} style={styles.messageIcon} />
      <View style={styles.dotsContainer}>
        {[dot1, dot2, dot3].map((dot, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.dot, 
              { backgroundColor: theme.colors.textSecondary },
              dotStyle(dot)
            ]} 
          />
        ))}
      </View>
    </View>
  );
};

// Empty state component
const EmptyState = () => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.emptyStateContainer}>
      <ChefHat size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>Find Your Next Recipe</Text>
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        Ask about any recipe or dish you'd like to make. Get detailed instructions, ingredients, and cooking tips!
      </Text>
    </View>
  );
};

export default function RecipeChat() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const getMessageAnimation = (messageId: string) => {
    if (!messageAnimations[messageId]) {
      messageAnimations[messageId] = new Animated.Value(0);
      Animated.timing(messageAnimations[messageId], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    return messageAnimations[messageId];
  };

  const parseIngredients = (ingredients: string): string[] => {
    return ingredients.split(',').map(item => item.trim());
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: query,
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('https://diana-models.onrender.com/api/v1/recipes/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          num_results: 3,
        }),
      });

      const recipes = await response.json();
      
      const botMessage: Message = {
        type: 'bot',
        content: recipes,
        timestamp: new Date(),
        id: Date.now().toString(),
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  const renderIngredientGrid = (ingredients: string) => {
    const ingredientList = parseIngredients(ingredients);
    return (
      <View style={styles.ingredientsGrid}>
        {ingredientList.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <Text style={[styles.bulletPoint, { color: theme.colors.primary }]}>•</Text>
            <Text style={[styles.ingredientText, { color: theme.colors.text }]}>{ingredient}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderRecipeCard = (recipe: Recipe) => (
    <View style={[styles.recipeCard, { 
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border
    }]}>
      <View style={styles.recipeHeader}>
        <ChefHat size={24} color={theme.colors.primary} />
        <Text style={[styles.recipeName, { color: theme.colors.text }]}>{recipe.name}</Text>
      </View>

      <View style={styles.recipeStats}>
        <View style={styles.statItem}>
          <Clock size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{recipe.total_time}</Text>
        </View>
        <View style={styles.statItem}>
          <Users size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>Serves {recipe.servings}</Text>
        </View>
        <View style={styles.statItem}>
          <Star size={16} color={theme.colors.warning} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{recipe.rating.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ingredients</Text>
      {renderIngredientGrid(recipe.ingredients)}

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Directions</Text>
      {recipe.directions.split('\n').filter(step => step.trim()).map((step, index) => (
        <View key={index} style={styles.directionItem}>
          <Text style={[styles.directionNumber, { backgroundColor: theme.colors.primary }]}>{index + 1}</Text>
          <Text style={[styles.directionText, { color: theme.colors.text }]}>{step.trim()}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={theme.colors.statusBar} />
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageContainer}
        contentContainerStyle={[
          styles.messageContent,
          messages.length === 0 && styles.emptyMessageContent
        ]}
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <Animated.View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.type === 'user' ? [
                    styles.userMessage, 
                    { backgroundColor: theme.colors.primary, borderColor: theme.colors.border }
                  ] : [
                    styles.botMessage, 
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                  ],
                  {
                    opacity: getMessageAnimation(message.id),
                    transform: [{
                      translateY: getMessageAnimation(message.id).interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }]
                  }
                ]}
              >
                {message.type === 'user' ? (
                  <Text style={styles.messageText}>{message.content as string}</Text>
                ) : (
                  <View style={styles.recipesContainer}>
                    {(message.content as Recipe[]).map((recipe, idx) => (
                      <View key={idx}>
                        {renderRecipeCard(recipe)}
                      </View>
                    ))}
                  </View>
                )}
              </Animated.View>
            ))}
            {loading && <TypingAnimation />}
          </>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { 
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.border
      }]}>
        <TextInput
          style={[styles.input, {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }]}
          placeholder="Search for recipes..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSend}
          placeholderTextColor={theme.colors.placeholder}
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            query.trim() ? { backgroundColor: theme.colors.primary } : [
              styles.sendButtonDisabled, 
              { 
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border
              }
            ]
          ]}
          onPress={handleSend}
          disabled={!query.trim() || loading}
        >
          <Send size={24} color={query.trim() ? "#fff" : theme.colors.placeholder} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    padding: 16,
  },
  messageContent: {
    paddingBottom: 80,
    flexGrow: 1,
  },
  emptyMessageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageWrapper: {
    maxWidth: '85%',
    marginVertical: 8,
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  messageText: {
    color: '#E7E7E7',
    fontSize: 16,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 0,
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    borderWidth: 1,
  },
  recipesContainer: {
    width: '100%',
  },
  recipeCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  ingredientsGrid: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  directionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  directionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    color: '#E7E7E7',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '600',
  },
  directionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  messageIcon: {
    marginRight: 8,
    marginTop: 2,
  },
});