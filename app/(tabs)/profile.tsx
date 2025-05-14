import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  Dimensions,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { 
  User, 
  ChevronRight, 
  Scale, 
  Target, 
  Activity,
  Heart,
  X
} from "lucide-react-native";
import ThemeToggle from "../../components/ThemeToggle";

const API_URL = "https://webrtc-server-c3i0.onrender.com";
const { width } = Dimensions.get('window');

// Input Modal Component
const InputModal = ({ 
  visible, 
  onClose, 
  title, 
  value, 
  onSubmit,
  placeholder,
  keyboardType = 'default',
  multiline = false
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (visible) {
      setInputValue(value);
    }
  }, [visible, value]);

  const handleClose = () => {
    setInputValue(''); // Reset input value
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(inputValue);
    setInputValue(''); // Reset input value
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border
        }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                },
                multiline && { height: 100, textAlignVertical: 'top' }
              ]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.placeholder}
              keyboardType={keyboardType}
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: theme.colors.backgroundSecondary }]}
              onPress={handleClose}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Selector Modal Component
const SelectorModal = ({ 
  visible, 
  onClose, 
  title, 
  options, 
  selected, 
  onSelect 
}) => {
  const { theme } = useTheme();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border
        }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  { borderBottomColor: theme.colors.border },
                  selected === option && [styles.modalOptionSelected, { backgroundColor: theme.colors.backgroundSecondary }]
                ]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  { color: theme.colors.text },
                  selected === option && [styles.modalOptionTextSelected, { color: theme.colors.primary }]
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Card Component
const Card = ({ title, children, icon: Icon }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.card, { 
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border
    }]}>
      <View style={styles.cardHeader}>
        <Icon size={20} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

// Info Row Component
const InfoRow = ({ label, value, onPress, editable = true }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!editable}
    >
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View style={styles.infoValueContainer}>
        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{value}</Text>
        {editable && <ChevronRight size={16} color={theme.colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );
};

export default function Profile() {
  const { publicId } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Prefer not to say",
    height: "",
    weight: "",
    activityLevel: "Sedentary",
    dietType: "Non-vegetarian",
    primaryGoal: "Weight Loss",
    targetWeight: "",
    workoutFrequency: "",
    workoutDuration: "",
    conditions: "",
    medications: "",
  });

  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: null,
    field: null,
    title: "",
    keyboardType: "default",
    multiline: false
  });

  const buttonScale = new Animated.Value(1);

  const modalOptions = {
    gender: ["Male", "Female", "Other", "Prefer not to say"],
    activityLevel: ["Sedentary", "Light", "Moderate", "Active", "Very Active"],
    dietType: ["Non-vegetarian", "Vegetarian", "Vegan"],
    primaryGoal: ["Weight Loss", "Weight Gain", "Maintain"],
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile/${publicId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setFormData({
        ...formData,
        ...data,
        age: data.age?.toString() || "",
        height: data.height?.toString() || "",
        weight: data.weight?.toString() || "",
        targetWeight: data.target_weight?.toString() || "",
        workoutFrequency: data.workout_frequency?.toString() || "",
        workoutDuration: data.workout_duration?.toString() || "",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load profile data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const response = await fetch(`${API_URL}/api/profile/${publicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          activityLevel: formData.activityLevel || "Sedentary",
          dietType: formData.dietType || "Non-vegetarian",
          primaryGoal: formData.primaryGoal || "Weight Loss",
          gender: formData.gender || "Not Specified",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const openInputModal = (field, title, keyboardType = 'default', multiline = false) => {
    setModalConfig({
      visible: true,
      type: 'input',
      field,
      title,
      keyboardType,
      multiline
    });
  };

  const openSelectorModal = (field, title) => {
    setModalConfig({
      visible: true,
      type: 'selector',
      field,
      title
    });
  };

  const handleInputSubmit = (value) => {
    setFormData(prev => ({
      ...prev,
      [modalConfig.field]: value
    }));
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.avatar, { 
              backgroundColor: theme.colors.backgroundSecondary,
              borderColor: theme.colors.border
            }]}>
              <User size={40} color={theme.colors.text} />
            </View>
            <Text style={[styles.name, { color: theme.colors.text }]}>{formData.name || "User"}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Profile Information</Text>
          </View>

          {/* Theme Toggle */}
          <ThemeToggle />

          <Card title="Basic Information" icon={User}>
            <InfoRow 
              label="Name" 
              value={formData.name || "Not set"}
              onPress={() => openInputModal('name', 'Enter Name')}
            />
            <InfoRow 
              label="Age" 
              value={`${formData.age || "Not set"} years`}
              onPress={() => openInputModal('age', 'Enter Age', 'numeric')}
            />
            <InfoRow 
              label="Gender" 
              value={formData.gender}
              onPress={() => openSelectorModal('gender', 'Select Gender')}
            />
          </Card>

          <Card title="Body Metrics" icon={Scale}>
            <InfoRow 
              label="Height" 
              value={`${formData.height || "Not set"} cm`}
              onPress={() => openInputModal('height', 'Enter Height (cm)', 'numeric')}
            />
            <InfoRow 
              label="Weight" 
              value={`${formData.weight || "Not set"} kg`}
              onPress={() => openInputModal('weight', 'Enter Weight (kg)', 'numeric')}
            />
          </Card>

          <Card title="Goals" icon={Target}>
            <InfoRow 
              label="Primary Goal" 
              value={formData.primaryGoal}
              onPress={() => openSelectorModal('primaryGoal', 'Select Goal')}
            />
            <InfoRow 
              label="Target Weight" 
              value={`${formData.targetWeight || "Not set"} kg`}
              onPress={() => openInputModal('targetWeight', 'Enter Target Weight (kg)', 'numeric')}
            />
          </Card>

          <Card title="Activity" icon={Activity}>
            <InfoRow 
              label="Activity Level" 
              value={formData.activityLevel}
              onPress={() => openSelectorModal('activityLevel', 'Select Activity Level')}
            />
            <InfoRow 
              label="Weekly Workouts" 
              value={`${formData.workoutFrequency || "0"} times`}
              onPress={() => openInputModal('workoutFrequency', 'Enter Weekly Workouts', 'numeric')}
            />
            <InfoRow 
              label="Workout Duration" 
              value={`${formData.workoutDuration || "0"} minutes`}
              onPress={() => openInputModal('workoutDuration', 'Enter Workout Duration', 'numeric')}
            />
          </Card>

          <Card title="Diet & Health" icon={Heart}>
            <InfoRow 
              label="Diet Type" 
              value={formData.dietType}
              onPress={() => openSelectorModal('dietType', 'Select Diet Type')}
            />
            <InfoRow 
              label="Medical Conditions" 
              value={formData.conditions || "None"}
              onPress={() => openInputModal('conditions', 'Enter Medical Conditions', 'default', true)}
            />
            <InfoRow 
              label="Current Medications" 
              value={formData.medications || "None"}
              onPress={() => openInputModal('medications', 'Enter Current Medications', 'default', true)}
            />
          </Card>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.updateButton,
                { backgroundColor: theme.colors.primary },
                updating && styles.updatingButton
              ]}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      {modalConfig.type === 'selector' && (
        <SelectorModal
          visible={modalConfig.visible}
          onClose={() => setModalConfig({ ...modalConfig, visible: false })}
          title={modalConfig.title}
          options={modalOptions[modalConfig.field] || []}
          selected={formData[modalConfig.field]}
          onSelect={(value) => setFormData({ ...formData, [modalConfig.field]: value })}
        />
      )}

      {modalConfig.type === 'input' && (
        <InputModal
          visible={modalConfig.visible}
          onClose={() => setModalConfig({ ...modalConfig, visible: false })}
          title={modalConfig.title}
          value={formData[modalConfig.field]?.toString() || ''}
          onSubmit={handleInputSubmit}
          placeholder={`Enter ${modalConfig.field}`}
          keyboardType={modalConfig.keyboardType}
          multiline={modalConfig.multiline}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoValue: {
    fontSize: 16,
    marginRight: 8,
  },
  updateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  updatingButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderWidth: 1,
    maxHeight: "80%",
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
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalOptionSelected: {
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalOptionTextSelected: {
    fontWeight: "600",
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textInputFocused: {
    borderColor: "#0164D8",
  },
  modalButtons: {
    flexDirection: "row",
    padding: 20,
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  modalButtonPrimary: {
  },
  modalButtonSecondary: {
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});