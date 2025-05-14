import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera, Upload, ImageIcon, Info, X, CheckCircle2, Coffee, Utensils, Leaf } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  FadeOut,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import foodData from './foodData.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PredictionResult {
  class: string;
  confidence: number;
}

interface NutritionalInfo {
  calories?: string;
  carbohydrates?: string;
  protein?: string;
  fiber?: string;
  sugar?: string;
  vitaminC?: string;
  vitaminA?: string;
  iron?: string;
  [key: string]: string | undefined;
}

interface FoodData {
  name: string;
  origin: string;
  family: string;
  scientificName: string;
  taste: string;
  nutritionalInfo: NutritionalInfo;
}

interface FoodDataDatabase {
  [key: string]: FoodData;
}

const EmptyState = () => {
  const { theme } = useTheme();
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(300)} 
      style={styles.emptyStateContainer}
    >
      <ImageIcon size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>Scan Food Items</Text>
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        Take a picture or upload an image to identify food items and get nutritional information
      </Text>
    </Animated.View>
  );
};

const LoadingOverlay = () => {
  const { theme } = useTheme();
  
  return (
    <Animated.View 
      entering={FadeInUp}
      exiting={FadeOut}
      style={styles.loadingOverlay}
    >
      <View style={[styles.loadingContent, {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border
      }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Analyzing image...</Text>
      </View>
    </Animated.View>
  );
};

const NutritionalFacts = ({ foodDetails }: { foodDetails: FoodData | null }) => {
  const { theme } = useTheme();
  
  if (!foodDetails) return null;
  
  return (
    <Animated.View 
      entering={FadeInUp.delay(400)} 
      style={[styles.nutritionalContainer, { 
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border
      }]}
    >
      <View style={styles.nutritionHeader}>
        <Leaf size={24} color={theme.colors.primary} />
        <Text style={[styles.nutritionTitle, { color: theme.colors.text }]}>
          Nutritional Information
        </Text>
      </View>
      
      <View style={styles.nutritionDetails}>
        <View style={[styles.factRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.factLabel, { color: theme.colors.textSecondary }]}>Origin:</Text>
          <Text style={[styles.factValue, { color: theme.colors.text }]}>
            {foodDetails.origin}
          </Text>
        </View>
        
        <View style={[styles.factRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.factLabel, { color: theme.colors.textSecondary }]}>Family:</Text>
          <Text style={[styles.factValue, { color: theme.colors.text }]}>
            {foodDetails.family}
          </Text>
        </View>
        
        <View style={[styles.factRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.factLabel, { color: theme.colors.textSecondary }]}>Scientific Name:</Text>
          <Text style={[styles.factValue, { color: theme.colors.text }]}>
            {foodDetails.scientificName}
          </Text>
        </View>
        
        <View style={[styles.factRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.factLabel, { color: theme.colors.textSecondary }]}>Taste:</Text>
          <Text style={[styles.factValue, { color: theme.colors.text }]}>
            {foodDetails.taste}
          </Text>
        </View>
      </View>
      
      <View style={styles.nutritionHeader}>
        <Utensils size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.nutritionSubtitle, { color: theme.colors.text }]}>
          Nutritional Facts (per 100g)
        </Text>
      </View>
      
      <View style={[styles.nutrientsCard, { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderColor: theme.colors.border
      }]}>
        {Object.entries(foodDetails.nutritionalInfo).map(([key, value], index) => (
          <View key={key} style={[
            styles.nutrientRow, 
            index !== Object.keys(foodDetails.nutritionalInfo).length - 1 && 
              { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }
          ]}>
            <Text style={[styles.nutrientName, { color: theme.colors.text }]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <Text style={[styles.nutrientValue, { color: theme.colors.primary }]}>
              {value}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

export default function ScanScreen() {
  const { theme } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [foodDetails, setFoodDetails] = useState<FoodData | null>(null);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (prediction) {
      findFoodDetails(prediction.class);
    } else {
      setFoodDetails(null);
    }
  }, [prediction]);

  const findFoodDetails = (foodName: string) => {
    // Convert food data to the correct type
    const typedFoodData = foodData as FoodDataDatabase;
    
    // Convert food name to lowercase and remove spaces for matching
    const normalizedFoodName = foodName.toLowerCase().trim();
    
    // Check if the food exists directly in the data
    if (typedFoodData[normalizedFoodName]) {
      setFoodDetails(typedFoodData[normalizedFoodName]);
      return;
    }
    
    // Look for partial matches
    for (const [key, value] of Object.entries(typedFoodData)) {
      if (normalizedFoodName.includes(key) || key.includes(normalizedFoodName)) {
        setFoodDetails(value);
        return;
      }
    }

    // Check if the food name exists in any of the "name" fields (case-insensitive)
    for (const [key, value] of Object.entries(typedFoodData)) {
      if (value.name.toLowerCase() === normalizedFoodName || 
          value.name.toLowerCase().includes(normalizedFoodName) || 
          normalizedFoodName.includes(value.name.toLowerCase())) {
        setFoodDetails(value);
        return;
      }
    }
    
    // If no match, set to null
    setFoodDetails(null);
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const [libraryStatus, cameraStatus] = await Promise.all([
        ImagePicker.requestMediaLibraryPermissionsAsync(),
        ImagePicker.requestCameraPermissionsAsync()
      ]);

      if (libraryStatus.status !== 'granted' && cameraStatus.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to use this feature.',
          [
            { text: 'OK', onPress: () => {} }
          ]
        );
      }
    }
  };

  const animateButton = () => {
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  const pickImage = async () => {
    try {
      animateButton();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        analyzeFoodImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to pick image. Please try again.'
      );
    }
  };

  const takePicture = async () => {
    try {
      animateButton();
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        analyzeFoodImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(
        'Error',
        'Failed to take picture. Please try again.'
      );
    }
  };

  const analyzeFoodImage = async (imageUri: string) => {
    setLoading(true);
    setPrediction(null);
    setFoodDetails(null);

    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image';

      formData.append('file', {
        uri: imageUri,
        name: filename || 'photo.jpg',
        type,
      } as any);

      const response = await fetch('https://diana-models.onrender.com/api/v1/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Error',
        'Failed to analyze image. Please try again.'
      );
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPrediction(null);
    setFoodDetails(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return theme.colors.success;
    if (confidence > 0.4) return theme.colors.warning;
    return theme.colors.error;
  };

  const renderImageSection = () => (
    <Animated.View 
      entering={FadeInDown} 
      style={styles.imageSection}
    >
      <View style={[styles.imageContainer, { borderColor: theme.colors.border }]}>
        <Image source={{ uri: image! }} style={styles.image} />
        <TouchableOpacity 
          style={[styles.clearButton, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={clearImage}
        >
          <X size={24} color="#E7E7E7" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderPrediction = () => (
    <Animated.View 
      entering={FadeInUp.delay(300)} 
      style={[styles.predictionContainer, { 
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border
      }]}
    >
      <View style={styles.resultHeader}>
        <CheckCircle2 size={24} color={theme.colors.success} />
        <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>Analysis Complete</Text>
      </View>

      <View style={[styles.resultCard, { 
        backgroundColor: theme.colors.backgroundSecondary,
        borderColor: theme.colors.border
      }]}>
        <Text style={[styles.detectedText, { color: theme.colors.textSecondary }]}>
          Detected Food:
        </Text>
        <Text style={[styles.foodName, { color: theme.colors.text }]}>
          {prediction?.class}
        </Text>
        <View style={[styles.confidenceBar, { backgroundColor: theme.colors.border }]}>
          <View 
            style={[
              styles.confidenceProgress, 
              { 
                width: `${(prediction?.confidence || 0) * 100}%`,
                backgroundColor: getConfidenceColor(prediction?.confidence || 0)
              }
            ]} 
          />
        </View>
        <Text style={[styles.confidenceText, { color: theme.colors.textSecondary }]}>
          Confidence: {((prediction?.confidence || 0) * 100).toFixed(1)}%
        </Text>
      </View>

      {!foodDetails && (
        <View style={[styles.infoContainer, { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border
        }]}>
          <Info size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            No nutritional data available for this food item
          </Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.colors.statusBar} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          !image && styles.centerContent
        ]}
      >
        {!image ? (
          <EmptyState />
        ) : (
          <>
            {renderImageSection()}
            {prediction && renderPrediction()}
            {foodDetails && <NutritionalFacts foodDetails={foodDetails} />}
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { 
        backgroundColor: theme.colors.background, 
        borderTopColor: theme.colors.border
      }]}>
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cameraButton, { backgroundColor: theme.colors.primary }]} 
            onPress={takePicture}
          >
            <Camera size={24} color="#E7E7E7" />
            <Text style={styles.buttonText}>Take Picture</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.uploadButton, { 
              backgroundColor: theme.colors.backgroundSecondary,
              borderColor: theme.colors.border
            }]} 
            onPress={pickImage}
          >
            <Upload size={24} color={theme.colors.text} />
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Upload Image</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {loading && <LoadingOverlay />}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
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
    lineHeight: 24,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: SCREEN_WIDTH * 0.75, // 4:3 aspect ratio
    resizeMode: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 20,
    padding: 8,
  },
  predictionContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  predictionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  resultCard: {
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
  },
  detectedText: {
    fontSize: 14,
    marginBottom: 5,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  confidenceProgress: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 14,
    textAlign: 'right',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 150,
    justifyContent: 'center',
  },
  cameraButton: {
  },
  uploadButton: {
    borderWidth: 1,
  },
  buttonText: {
    color: '#E7E7E7',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
  // New styles for nutritional facts
  nutritionalContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  nutritionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  nutritionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionDetails: {
    marginBottom: 20,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  factLabel: {
    fontSize: 14,
    flex: 1,
  },
  factValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
  },
  nutrientsCard: {
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    marginTop: 10,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  nutrientName: {
    fontSize: 16,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});