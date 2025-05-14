import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Send, Bot, User, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  FadeIn,
} from 'react-native-reanimated';

// Wait to import OpenAI until we're sure it's needed
// This prevents the "Cannot read property 'prototype' of undefined" error
// that happens when OpenAI tries to use things that aren't available in React Native
let OpenAI;
try {
  // Import dynamically only when needed
  OpenAI = require('openai');
} catch (error) {
  console.error('Error importing OpenAI:', error);
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  displayContent?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const FormattedText = ({ text, style }) => {
  // Helper function to parse text and formatting
  const parseText = (text) => {
    const parts = [];
    let currentIndex = 0;
    let boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push({
          text: text.slice(currentIndex, match.index),
          type: 'normal'
        });
      }

      // Add the bold text
      parts.push({
        text: match[1], // The text between **
        type: 'bold'
      });

      currentIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (currentIndex < text.length) {
      parts.push({
        text: text.slice(currentIndex),
        type: 'normal'
      });
    }

    return parts;
  };

  const textParts = parseText(text);

  return (
    <Text style={style}>
      {textParts.map((part, index) => (
        <Text
          key={index}
          style={{
            fontWeight: part.type === 'bold' ? 'bold' : 'normal',
          }}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

// Typing animation component
const TypingAnimation = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.typingContainer, {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border
    }]}>
      <Bot size={20} color={theme.colors.textSecondary} style={styles.messageIcon} />
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, {backgroundColor: theme.colors.textSecondary}]} />
        <View style={[styles.dot, {backgroundColor: theme.colors.textSecondary}]} />
        <View style={[styles.dot, {backgroundColor: theme.colors.textSecondary}]} />
      </View>
    </View>
  );
};

// Empty state component
const EmptyState = () => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.emptyStateContainer}>
      <MessageCircle size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>Start a Conversation</Text>
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        Ask DIANA about nutrition, fitness, or health advice. I'm here to help you achieve your wellness goals!
      </Text>
    </View>
  );
};

export default function DianaChat() {
  const { publicId } = useAuth();
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [openAIInitialized, setOpenAIInitialized] = useState(false);
  const [client, setClient] = useState(null);

  // Initialize OpenAI client safely
  useEffect(() => {
    const initializeOpenAI = async () => {
      try {
        // Check if OpenAI was imported successfully
        if (!OpenAI) {
          console.error('OpenAI module not available');
          return;
        }
        
        // Check if API key exists
        const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
          console.error('OpenAI API key not found');
          return;
        }
        
        // Initialize the client
        const openAIClient = new OpenAI.OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true
        });
        
        setClient(openAIClient);
        setOpenAIInitialized(true);
      } catch (error) {
        console.error('Error initializing OpenAI client:', error);
      }
    };
    
    initializeOpenAI();
  }, []);

  useEffect(() => {
    fetchUserProfile();
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`https://webrtc-server-c3i0.onrender.com/api/profile/${publicId}`);
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const streamResponse = (message: ChatMessage) => {
    const words = message.content.split(' ');
    let currentWordIndex = 0;
    const streamingSpeed = 15;

    const updateMessageContent = (newContent: string) => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === message.id 
            ? { ...msg, displayContent: newContent, isStreaming: true }
            : msg
        )
      );
    };

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    streamingIntervalRef.current = setInterval(() => {
      if (currentWordIndex <= words.length) {
        const displayWords = words.slice(0, currentWordIndex).join(' ');
        updateMessageContent(displayWords);
        currentWordIndex++;
        scrollViewRef.current?.scrollToEnd({ animated: false });
      } else {
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
        }
        updateMessageContent(message.content);
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === message.id 
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }
    }, streamingSpeed);
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      displayContent: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setQuery('');

    try {
      // Check if OpenAI client is initialized
      if (!openAIInitialized || !client) {
        throw new Error("OpenAI client is not initialized");
      }

      // Create system message with user profile
      const systemMessage = `You are DIANA (Digital Intelligent Assistant for Nutrition Advice), 
        an AI assistant specializing in personalized health, nutrition, and fitness advice. 
        ${userProfile ? `Consider this user's information:
        Weight: ${userProfile.weight}kg
        Target Weight: ${userProfile.target_weight}kg
        Activity Level: ${userProfile.activityLevel}
        Diet Type: ${userProfile.dietType}
        Primary Goal: ${userProfile.primaryGoal}` : ''} while giving response also use minimal emojies so that the conversion looks better.`;

      // Call OpenAI API
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini", // or any other available model
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;

      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: response || "I apologize, but I couldn't generate a response.",
        displayContent: '',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, botMessage]);
      streamResponse(botMessage);

    } catch (error) {
      console.error('Error generating response:', error);
      
      // Handle missing OpenAI client
      let errorMessage: string;
      if (!openAIInitialized || !client) {
        errorMessage = "I'm having trouble connecting to my AI service. Please check your API key configuration.";
      } else {
        errorMessage = "I apologize, but I'm having trouble generating a response right now. Please try again.";
      }
      
      const botErrorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: errorMessage,
        displayContent: errorMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botErrorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message) => {
    return (
      <Animated.View
        key={message.id}
        entering={FadeIn.duration(300)}
        style={[
          styles.messageWrapper,
          message.type === 'user' ? [
            styles.userMessage, 
            { backgroundColor: theme.colors.primary, borderColor: theme.colors.border }
          ] : [
            styles.botMessage, 
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
          ]
        ]}
      >
        <View style={styles.messageContentWrapper}>
          {message.type === 'bot' ? (
            <Bot size={20} color={theme.colors.textSecondary} style={styles.messageIcon} />
          ) : (
            <User size={20} color="#fff" style={styles.messageIcon} />
          )}
          <FormattedText
            text={message.displayContent || message.content}
            style={[
              styles.messageText,
              message.type === 'user' ? styles.userMessageText : { color: theme.colors.text },
            ]}
          />
          {message.isStreaming && (
            <Text style={[styles.cursorBlink, { color: theme.colors.textSecondary }]}>|</Text>
          )}
        </View>
      </Animated.View>
    );
  };  

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
            {messages.map(renderMessage)}
            {loading && !messages.find(m => m.isStreaming) && <TypingAnimation />}
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
          placeholder="Ask DIANA..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSend}
          placeholderTextColor={theme.colors.placeholder}
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            query.trim() ? { backgroundColor: theme.colors.primary } : [styles.sendButtonDisabled, {
              backgroundColor: theme.colors.backgroundSecondary,
              borderColor: theme.colors.border
            }]
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
  messageContentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#E7E7E7',
  },
  cursorBlink: {
    opacity: 0.7,
    fontWeight: 'bold',
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
    gap: 4,
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
});