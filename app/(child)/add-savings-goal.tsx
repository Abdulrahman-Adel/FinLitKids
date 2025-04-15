import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert,
  SafeAreaView, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSavingsStore } from '../../src/contexts/savingsStore';
import { useAuthStore } from '../../src/contexts/authStore';

const AddSavingsGoalScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Stores
  const loggedInUserId = useAuthStore((state) => state.loggedInUserId);
  const { addGoal } = useSavingsStore();

  // Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const handleSaveGoal = () => {
    if (!loggedInUserId) {
        Alert.alert('Error', 'Cannot save goal: User not identified.');
        return;
    }

    // Validation
    if (!goalName.trim()) {
      Alert.alert('Error', 'Please enter a name for your goal.');
      return;
    }
    const amountValue = parseFloat(targetAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid positive target amount.');
      return;
    }

    // Prepare data
    const newGoalData = {
      childId: loggedInUserId,
      name: goalName.trim(),
      targetAmount: amountValue,
      // currentAmount will be initialized to 0 in the store
    };

    // Save 
    try {
        addGoal(newGoalData);
        Alert.alert('Success', 'New savings goal created!');
        // Navigate back
        if (router.canGoBack()) {
            router.back();
        }
    } catch (error) {
        console.error("Error saving goal:", error);
        Alert.alert('Error', 'Could not create the savings goal. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Savings Goal',
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
       <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={[styles.label, { color: colors.text }]}>What are you saving for? *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="e.g., New bike, Video game"
            value={goalName}
            onChangeText={setGoalName}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.text }]}>How much do you need to save? *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="e.g., 150"
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="numeric"
            placeholderTextColor={colors.placeholder}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSaveGoal}
          >
            <Text style={styles.buttonText}>Create Goal</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Reusing styles from AddSpendingScreen
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
      flex: 1,
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    width: '100%',
    minHeight: 55,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 17,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: Colors.light.backgroundStrong,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddSavingsGoalScreen; 