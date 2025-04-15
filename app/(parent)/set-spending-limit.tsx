import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert,
  SafeAreaView, ScrollView, TouchableOpacity, Platform, Button
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore';

// Simple Segmented Control for Frequency
const FrequencySelector = ({ selected, onSelect, colors }: {
  selected: 'Weekly' | 'Monthly';
  onSelect: (value: 'Weekly' | 'Monthly') => void;
  colors: any;
}) => {
  const options: ('Weekly' | 'Monthly')[] = ['Weekly', 'Monthly'];
  return (
    <View style={styles.frequencyContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.frequencyButton,
            selected === option && { backgroundColor: colors.primary },
            { borderColor: colors.primary },
          ]}
          onPress={() => onSelect(option)}
        >
          <Text style={[
            styles.frequencyButtonText,
            selected === option ? { color: colors.backgroundStrong } : { color: colors.primary }
          ]}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const SetSpendingLimitScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ childId: string }>();
  const childId = params.childId;

  const { getChildById, updateChild } = useProfileStore();
  const [child, setChild] = useState<ChildProfile | null>(null);

  // Form State
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [limitFrequency, setLimitFrequency] = useState<'Weekly' | 'Monthly'>('Weekly');

  useEffect(() => {
    if (childId) {
      const foundChild = getChildById(childId);
      if (foundChild) {
        setChild(foundChild);
        setLimitAmount((foundChild.spendingLimit ?? '').toString());
        setLimitFrequency(foundChild.spendingLimitFrequency ?? 'Weekly');
      } else {
        Alert.alert('Error', 'Child profile not found.');
        if (router.canGoBack()) router.back();
      }
    }
  }, [childId, getChildById]);

  const handleSaveLimit = () => {
    if (!child) return;

    const amountValue = parseFloat(limitAmount);
    // Allow 0 to disable limit, but not negative
    if (isNaN(amountValue) || amountValue < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid limit amount (0 or more).');
      return;
    }

    const updatedChild: ChildProfile = {
      ...child,
      spendingLimit: amountValue === 0 ? undefined : amountValue, // Store undefined if 0
      spendingLimitFrequency: limitFrequency,
    };

    try {
      updateChild(updatedChild);
      Alert.alert('Success', `${child.name}'s spending limit updated!`);
      if (router.canGoBack()) {
        router.back();
      }
    } catch (error) {
      console.error("Error saving spending limit:", error);
      Alert.alert('Error', 'Could not save the spending limit. Please try again.');
    }
  };

  if (!child) {
    // Show loading or error state before child data is available
    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
             <Stack.Screen options={{ title: 'Set Limit' }} />
             <View style={styles.loadingContainer}><Text>Loading...</Text></View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Set Limit for ${child.name}`,
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            Platform.OS === 'ios' && router.canGoBack() ? 
             <Button onPress={() => router.back()} title="Cancel" color={colors.primary} /> : null
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Limit Amount ($)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
          placeholder="e.g., 50 (Enter 0 for no limit)"
          value={limitAmount}
          onChangeText={setLimitAmount}
          keyboardType="numeric"
          placeholderTextColor={colors.placeholder}
        />

        <Text style={[styles.label, { color: colors.text }]}>Limit Frequency</Text>
        <FrequencySelector 
            selected={limitFrequency} 
            onSelect={setLimitFrequency} 
            colors={colors} 
        />
        
        <Text style={[styles.infoText, { color: colors.placeholder }]}>
            This is the maximum amount {child.name} can spend per {limitFrequency.toLowerCase()}.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSaveLimit}
        >
          <Text style={styles.buttonText}>Save Limit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles (similar to CreateEditChore)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  scrollContainer: {
    padding: 20,
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
    marginBottom: 10, // Reduced margin
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 17,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 40, // More space before button
  },
  buttonText: {
    color: Colors.light.backgroundStrong,
    fontSize: 18,
    fontWeight: '600',
  },
  // Frequency Selector Styles
  frequencyContainer: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 20,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  frequencyButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  }
});

export default SetSpendingLimitScreen; 