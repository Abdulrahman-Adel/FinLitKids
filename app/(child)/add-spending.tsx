import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert,
  SafeAreaView, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSpendingStore } from '../../src/contexts/spendingStore';
import { useAuthStore } from '../../src/contexts/authStore';
import { useProfileStore } from '../../src/contexts/profileStore';

const AddSpendingScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Stores
  const loggedInUserId = useAuthStore((state) => state.loggedInUserId);
  const { addTransaction } = useSpendingStore();
  const { getChildById, updateChildBalance } = useProfileStore();

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSaveTransaction = () => {
    if (!loggedInUserId) {
        Alert.alert('Error', 'Cannot save transaction: User not identified.');
        return;
    }

    // Validation
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for your spending.');
      return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount.');
      return;
    }

    // Check balance
    const loggedInChild = getChildById(loggedInUserId);
    if (!loggedInChild) { // Should not happen if loggedInUserId is valid
        Alert.alert('Error', 'Could not verify user balance.');
        return;
    }
    if (loggedInChild.balance < amountValue) {
        Alert.alert("Not Enough Funds", `You only have ${loggedInChild.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`);
        return;
    }

    // Prepare data
    const newTxData = {
      childId: loggedInUserId,
      description: description.trim(),
      amount: amountValue,
      date: new Date().toISOString(),
    };

    // Save and update balance
    try {
        addTransaction(newTxData);
        updateChildBalance(loggedInUserId, -amountValue); // Deduct balance
        Alert.alert('Success', 'Spending recorded!');
        // Navigate back
        if (router.canGoBack()) {
            router.back();
        }
    } catch (error) {
        console.error("Error saving transaction:", error);
        Alert.alert('Error', 'Could not record your spending. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Record Spending',
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
          <Text style={[styles.label, { color: colors.text }]}>What did you buy? *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="e.g., Ice cream, Movie ticket"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.text }]}>How much did it cost? *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="e.g., 3.50"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor={colors.placeholder}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSaveTransaction}
          >
            <Text style={styles.buttonText}>Record Purchase</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Use similar styles as create-edit-chore
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
      flex: 1,
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1, // Ensure scrollview content can grow
    justifyContent: 'center', // Center vertically in KAV
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
    marginBottom: 20, // Increase spacing
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

export default AddSpendingScreen; 