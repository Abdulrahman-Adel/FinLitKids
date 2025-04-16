import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert,
  SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProfileStore } from '../../src/contexts/profileStore';

const AddEditChildScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Get params and store actions
  const params = useLocalSearchParams<{ childId?: string }>();
  const { addChild, updateChild, getChildById, isLoading: isStoreLoading, error: storeError } = useProfileStore();

  // Determine if editing based on param
  const isEditing = !!params.childId;
  const childId = params.childId;

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Only for adding
  const [initialBalance, setInitialBalance] = useState('0'); // Only for adding
  const [isSubmitting, setIsSubmitting] = useState(false); // Local submitting state

  // Fetch child data if editing
  useEffect(() => {
    if (isEditing && childId) {
      console.log(`Editing child ID: ${childId}`);
      const existingChild = getChildById(childId);
      if (existingChild) {
        setName(existingChild.name);
        setUsername(existingChild.username);
        // Don't pre-fill password or initial balance for editing
      } else {
        Alert.alert("Error", "Could not find child profile to edit.");
        router.back(); // Go back if child not found
      }
    }
  }, [isEditing, childId, getChildById]);

  const handleSubmit = async () => {
    // Basic Validation
    if (!name.trim() || !username.trim()) {
      Alert.alert('Missing Information', 'Please enter both a name and a username.');
      return;
    }
    if (!isEditing && !password) {
      Alert.alert('Missing Information', 'Please set an initial password for the new child.');
      return;
    }
    if (!isEditing && password.length < 4) {
      Alert.alert('Password Too Short', 'Password must be at least 4 characters long.');
      return;
    }
    const balanceNum = parseFloat(initialBalance);
    if (!isEditing && (isNaN(balanceNum) || balanceNum < 0)) {
      Alert.alert('Invalid Balance', 'Please enter a valid non-negative initial balance (e.g., 0 or 10.50).');
      return;
    }

    setIsSubmitting(true);

    let success = false;
    try {
      if (isEditing && childId) {
        // Update existing child
        console.log(`Updating child ${childId} with name: ${name}, username: ${username}`);
        const updatedProfile = await updateChild(childId, { name: name.trim(), username: username.trim().toLowerCase() });
        success = !!updatedProfile;
        if(success) Alert.alert('Success', 'Child profile updated!');

      } else {
        // Add new child
        console.log(`Adding child: ${name}, username: ${username}, balance: ${balanceNum}`);
        const newProfile = await addChild({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password,
          initialBalance: balanceNum,
        });
        success = !!newProfile;
        if(success) Alert.alert('Success', 'Child added successfully!');
      }

      if (success) {
        router.back(); // Go back to manage profiles on success
      }
    } catch (err: any) {
      // Error should be caught and set in the store, but have a fallback
      Alert.alert('Operation Failed', storeError || err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: isEditing ? 'Edit Child Profile' : 'Add New Child',
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Child's Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="e.g., Alex Johnson"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor={colors.placeholder}
            editable={!isSubmitting}
          />

          <Text style={[styles.label, { color: colors.text }]}>Username (for login)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="e.g., alexj (no spaces)"
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase().replace(/s/g, ''))} // Force lowercase, no spaces
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={colors.placeholder}
            editable={!isSubmitting}
          />

          {!isEditing && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>Set Initial Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
                placeholder="Min 4 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={colors.placeholder}
                editable={!isSubmitting}
              />

              <Text style={[styles.label, { color: colors.text }]}>Initial Balance</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
                placeholder="e.g., 5.00"
                value={initialBalance}
                onChangeText={setInitialBalance}
                keyboardType="numeric"
                placeholderTextColor={colors.placeholder}
                editable={!isSubmitting}
              />
            </>
          )}
          
          {/* Display store error if any */}
          {storeError && (
            <Text style={styles.errorText}>{storeError}</Text>
          )}

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: isSubmitting ? colors.placeholder : colors.primary }]} 
            onPress={handleSubmit} 
            disabled={isSubmitting || isStoreLoading}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.backgroundStrong} />
            ) : (
              <Text style={styles.buttonText}>{isEditing ? 'Save Changes' : 'Add Child'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  formContainer: {
    // Container for form elements
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 5, // Slight indent
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20, 
    paddingHorizontal: 20,
    fontSize: 17,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: Colors.light.backgroundStrong, // White
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.light.error,
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default AddEditChildScreen; 