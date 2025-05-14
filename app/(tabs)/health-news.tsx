import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Clock, ExternalLink, Search, Filter, ArrowRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';

// API Key will be accessed from environment variables
const API_KEY = process.env.EXPO_PUBLIC_GNEWS_API_KEY;

interface Article {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

const NewsCard = ({ article, index }: { article: Article; index: number }) => {
  const { theme } = useTheme();
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handlePress = () => {
    Linking.openURL(article.url).catch((err) => 
      Alert.alert('Error', 'Cannot open article link'));
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      style={[styles.card, { 
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border
      }]}
    >
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={handlePress}
        style={styles.cardContent}
      >
        {article.image ? (
          <Image 
            source={{ uri: article.image }} 
            style={styles.image} 
            resizeMode="cover" 
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
              No Image
            </Text>
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <Text style={[styles.source, { color: theme.colors.primary }]}>
            {article.source.name}
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {article.description}
          </Text>
          
          <View style={styles.footer}>
            <View style={styles.dateContainer}>
              <Clock size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                {formattedDate}
              </Text>
            </View>
            
            <View style={styles.readMore}>
              <Text style={[styles.readMoreText, { color: theme.colors.primary }]}>
                Read More
              </Text>
              <ExternalLink size={14} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HealthNews() {
  const { theme } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchNews = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      // GNews API to fetch health news in India
      const response = await fetch(
        `https://gnews.io/api/v4/search?q=health&country=in&lang=en&max=10&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      
      if (data.articles && Array.isArray(data.articles)) {
        setArticles(data.articles);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Unable to load health news. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);
  
  const handleRefresh = () => {
    fetchNews(true);
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {error ? (
        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
          {error}
        </Text>
      ) : (
        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
          No health news available
        </Text>
      )}
      
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => fetchNews()}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.colors.statusBar} />
      
      <View style={[styles.header, { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderBottomColor: theme.colors.border,
      }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Health News
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Latest updates on health and wellness in India
        </Text>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading health news...
          </Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item, index) => `${item.url}-${index}`}
          renderItem={({ item, index }) => 
            <NewsCard article={item} index={index} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'column',
  },
  image: {
    height: 180,
    width: '100%',
  },
  imagePlaceholder: {
    height: 180,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
  },
  contentContainer: {
    padding: 16,
  },
  source: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    marginLeft: 4,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});