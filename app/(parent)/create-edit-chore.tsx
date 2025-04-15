import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Button, Alert,
  SafeAreaView, ScrollView, TouchableOpacity, Platform
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useChoreStore } from '../../src/contexts/choreStore';
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore';
// Consider using a Picker component if available or build a custom one
// import { Picker } from '@react-native-picker/picker'; // Example import

const CreateEditChoreScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ choreId?: string }>(); // Get choreId if editing
  const isEditing = !!params.choreId;

  // Chore Store Actions
  const addChore = useChoreStore((state) => state.addChore);
  const updateChore = useChoreStore((state) => state.updateChore);
  const getChoreById = useChoreStore((state) => state.getChoreById);

  // Profile Store State
  const children = useProfileStore((state) => state.children);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(''); // Store as string initially
  const [assignedChildId, setAssignedChildId] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && params.choreId) {
      const existingChore = getChoreById(params.choreId);
      if (existingChore) {
        setTitle(existingChore.title);
        setDescription(existingChore.description || '');
        setPoints(existingChore.points.toString());
        setAssignedChildId(existingChore.assignedChildId);
      }
    }
  }, [isEditing, params.choreId, getChoreById]);

  const handleSaveChore = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the chore.');
      return;
    }
    const pointsValue = parseInt(points, 10);
    if (isNaN(pointsValue) || pointsValue <= 0) {
      Alert.alert('Error', 'Please enter a valid positive number for points.');
      return;
    }
    // Optionally validate child assignment
    // if (!assignedChildId) {
    //   Alert.alert('Error', 'Please assign the chore to a child.');
    //   return;
    // }

    const choreData = {
      title: title.trim(),
      description: description.trim() || undefined,
      points: pointsValue,
      assignedChildId: assignedChildId,
    };

    try {
        if (isEditing && params.choreId) {
            // Update existing chore
            const existingChore = getChoreById(params.choreId);
            if (existingChore) {
                 updateChore({ ...existingChore, ...choreData });
                 Alert.alert('Success', 'Chore updated successfully!');
            } else {
                 Alert.alert('Error', 'Could not find the chore to update.');
                 return; // Stop if chore not found
            }
        } else {
            // Add new chore (status will be set to Pending in the store)
            addChore(choreData);
            Alert.alert('Success', 'Chore added successfully!');
        }
        // Navigate back to the main chores list
        if (router.canGoBack()) {
          router.back();
        }
    } catch (error) {
        console.error("Error saving chore:", error);
        Alert.alert('Error', 'Could not save the chore. Please try again.');
    }
  };

  // Simple Child Picker Implementation (Replace with a better UI component later)
   const renderChildPicker = () => {
    return (
      <View style={styles.pickerContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Assign To:</Text>
         {/* Basic Touchable Opacity buttons for selection */} 
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerOptions}>
           <TouchableOpacity
             key="unassigned"
             style={[
               styles.pickerButton,
               !assignedChildId && styles.pickerButtonSelected,
               { borderColor: colors.primary }
             ]}
             onPress={() => setAssignedChildId(null)}
           >
             <Text style={[styles.pickerButtonText, {color: !assignedChildId ? colors.primary : colors.placeholder}]}>Unassigned</Text>
           </TouchableOpacity>
           {children.map((child) => (
             <TouchableOpacity
               key={child.id}
               style={[
                 styles.pickerButton,
                 assignedChildId === child.id && styles.pickerButtonSelected,
                 { borderColor: colors.primary }
               ]}
               onPress={() => setAssignedChildId(child.id)}
             >
               <Text style={[styles.pickerButtonText, {color: assignedChildId === child.id ? colors.primary : colors.placeholder}]}>{child.name}</Text>
             </TouchableOpacity>
           ))}
         </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditing ? 'Edit Chore' : 'Create Chore',
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
        <Text style={[styles.label, { color: colors.text }]}>Chore Title *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
          placeholder="e.g., Clean your room"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.placeholder}
        />

        <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
          placeholder="Any extra details?"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor={colors.placeholder}
        />

        <Text style={[styles.label, { color: colors.text }]}>Points *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
          placeholder="e.g., 10"
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
          placeholderTextColor={colors.placeholder}
        />

        {renderChildPicker()} 

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSaveChore}
        >
          <Text style={styles.buttonText}>{isEditing ? 'Update Chore' : 'Add Chore'}</Text>
        </TouchableOpacity>
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 15, // Add spacing above labels
  },
  input: {
    width: '100%',
    minHeight: 55,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 17,
  },
  textArea: {
      minHeight: 100, // Taller for description
      textAlignVertical: 'top', // Align text top for multiline
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
  // Basic Picker Styles
  pickerContainer: {
    marginTop: 15,
  },
  pickerOptions: {
    paddingVertical: 10,
  },
  pickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pickerButtonSelected: {
    // Add visual indication for selected, e.g., background color or bolder border
    // backgroundColor: Colors.light.primary + '30', // Example: light primary background
    borderWidth: 2.5,
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default CreateEditChoreScreen; 