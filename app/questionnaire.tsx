import React, { useState } from "react";
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
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  User,
  Scale,
  Target,
  Activity,
  Heart,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

const API_URL = "https://webrtc-server-c3i0.onrender.com";

interface FormSection {
  title: string;
  icon: any;
  fields: FormField[];
}

interface FormField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  multiline?: boolean;
}

const StepIndicator = ({ currentStep, totalSteps }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.stepIndicatorContainer}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            { backgroundColor: theme.colors.border },
            i === currentStep && [
              styles.currentStepDot,
              { backgroundColor: theme.colors.primary },
            ],
            i < currentStep && [
              styles.completedStepDot,
              { backgroundColor: theme.colors.primary, opacity: 0.5 },
            ],
          ]}
        />
      ))}
    </View>
  );
};

export default function Questionnaire() {
  const { publicId } = useAuth();
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Prefer not to say",
    height: "",
    weight: "",
    activityLevel: "Sedentary",
    dietType: "Non-vegetarian",
    allergies: "",
    intolerances: "",
    primaryGoal: "Weight Loss",
    targetWeight: "",
    workoutFrequency: "",
    workoutDuration: "",
    conditions: "",
    medications: "",
  });

  const buttonScale = new Animated.Value(1);

  const formSections: FormSection[] = [
    {
      title: "Basic Information",
      icon: User,
      fields: [
        {
          key: "name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your name",
          required: true,
        },
        {
          key: "age",
          label: "Age",
          type: "number",
          placeholder: "Enter your age",
          required: true,
        },
        {
          key: "gender",
          label: "Gender",
          type: "select",
          options: ["Male", "Female", "Other", "Prefer not to say"],
          required: true,
        },
      ],
    },
    {
      title: "Body Metrics",
      icon: Scale,
      fields: [
        {
          key: "height",
          label: "Height (cm)",
          type: "number",
          placeholder: "Enter your height",
          required: true,
        },
        {
          key: "weight",
          label: "Weight (kg)",
          type: "number",
          placeholder: "Enter your weight",
          required: true,
        },
      ],
    },
    {
      title: "Goals & Activity",
      icon: Target,
      fields: [
        {
          key: "primaryGoal",
          label: "Primary Goal",
          type: "select",
          options: ["Weight Loss", "Weight Gain", "Maintain"],
          required: true,
        },
        {
          key: "targetWeight",
          label: "Target Weight (kg)",
          type: "number",
          placeholder: "Enter target weight",
          required: true,
        },
        {
          key: "activityLevel",
          label: "Activity Level",
          type: "select",
          options: ["Sedentary", "Light", "Moderate", "Active", "Very Active"],
          required: true,
        },
      ],
    },
    {
      title: "Workout Details",
      icon: Activity,
      fields: [
        {
          key: "workoutFrequency",
          label: "Workouts per Week",
          type: "number",
          placeholder: "Enter number of workouts",
          required: true,
        },
        {
          key: "workoutDuration",
          label: "Workout Duration (minutes)",
          type: "number",
          placeholder: "Enter workout duration",
          required: true,
        },
      ],
    },
    {
      title: "Diet & Health",
      icon: Heart,
      fields: [
        {
          key: "dietType",
          label: "Diet Type",
          type: "select",
          options: ["Non-vegetarian", "Vegetarian", "Vegan"],
          required: true,
        },
        {
          key: "conditions",
          label: "Medical Conditions",
          type: "text",
          placeholder: "Enter medical conditions or 'None'",
          multiline: true,
        },
        {
          key: "medications",
          label: "Current Medications",
          type: "text",
          placeholder: "Enter current medications or 'None'",
          multiline: true,
        },
      ],
    },
  ];

  const validateCurrentStep = () => {
    const currentFields = formSections[step].fields;
    const invalidFields = currentFields.filter((field) => {
      if (!field.required) return false;
      const value = formData[field.key];
      return !value || (field.type === "number" && isNaN(Number(value)));
    });

    if (invalidFields.length > 0) {
      Alert.alert(
        "Required Fields",
        `Please fill in all required fields before continuing.`,
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) return;

    if (step < formSections.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/questionnaire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit questionnaire");
      }

      router.replace("/(tabs)/dashboard");
    } catch (error) {
      console.error("Error:", error);
      Alert.alert(
        "Error",
        "Failed to submit questionnaire. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "select":
        return (
          <TouchableOpacity
            key={field.key}
            style={[
              styles.selectField,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => {
              Alert.alert(field.label, "Select an option", [
                ...field.options!.map((option) => ({
                  text: option,
                  onPress: () =>
                    setFormData({ ...formData, [field.key]: option }),
                })),
                { text: "Cancel", style: "cancel" },
              ]);
            }}
          >
            <Text
              style={[styles.selectFieldLabel, { color: theme.colors.text }]}
            >
              {formData[field.key]}
            </Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        );

      default:
        return (
          <TextInput
            key={field.key}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
              field.multiline && styles.multilineInput,
            ]}
            placeholder={field.placeholder}
            placeholderTextColor={theme.colors.placeholder}
            value={formData[field.key]}
            onChangeText={(text) =>
              setFormData({ ...formData, [field.key]: text })
            }
            keyboardType={field.type === "number" ? "numeric" : "default"}
            multiline={field.multiline}
          />
        );
    }
  };

  const currentSection = formSections[step];
  const Icon = currentSection.icon;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      contentContainerStyle={{ flex: 1 }}
      enabled={Platform.OS === "ios"}
    >
      <StatusBar style={theme.colors.statusBar} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {currentSection.title}
            </Text>
            <StepIndicator
              currentStep={step}
              totalSteps={formSections.length}
            />
          </View>

          <View
            style={[
              styles.formContainer,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {currentSection.fields.map((field) => (
              <View key={field.key} style={styles.fieldContainer}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {field.label}
                  {field.required && (
                    <Text
                      style={[
                        styles.requiredStar,
                        { color: theme.colors.primary },
                      ]}
                    >
                      *
                    </Text>
                  )}
                </Text>
                {renderField(field)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.buttonContainer,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        {step > 0 && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={handlePreviousStep}
          >
            <ArrowLeft size={20} color={theme.colors.text} />
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              Previous
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            { backgroundColor: theme.colors.primary },
            loading && styles.loadingButton,
          ]}
          onPress={handleNextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>
                {step === formSections.length - 1 ? "Complete" : "Next"}
              </Text>
              {step === formSections.length - 1 ? (
                <Check size={20} color="#E7E7E7" />
              ) : (
                <ArrowRight size={20} color="#E7E7E7" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  currentStepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  completedStepDot: {},
  formContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  requiredStar: {
    marginLeft: 4,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  selectField: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectFieldLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  primaryButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
  loadingButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#E7E7E7",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
  },
});
