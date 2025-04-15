import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, Button, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity // Add imports
} from 'react-native';
import { router } from 'expo-router'; // Import router for potential back navigation
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import the profile store and types
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore'; 

const ManageChildProfilesScreen: React.FC = () => {
  const [childName, setChildName] = useState('');
  const [childPassword, setChildPassword] = useState('');
  
  // Get state and actions from the store
  const children = useProfileStore((state) => state.children);
  const addChild = useProfileStore((state) => state.addChild);
  const deleteChild = useProfileStore((state) => state.deleteChild);
  // const updateChild = useProfileStore((state) => state.updateChild); // For editing later

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleAddChild = () => {
    // Basic Validation
    if (!childName.trim()) {
      Alert.alert('Error', 'Please enter a name for the child.');
      return;
    }
    if (!childPassword) {
      Alert.alert('Error', 'Please set an initial password for the child.');
      return;
    }
    if (childPassword.length < 4) {
      // Simple PIN-like password for kids might be shorter
      Alert.alert('Error', 'Password must be at least 4 characters long.');
      return;
    }
    
    // Prepare data for the store action (excluding id)
    const newChildData = {
        name: childName.trim(),
        password_mock: childPassword, // Storing mock password
    };

    // Call the store action to add the child
    addChild(newChildData);

    // Confirmation and reset fields
    Alert.alert('Success', `${childName.trim()} added successfully!`);
    setChildName('');
    setChildPassword('');
  };

  const confirmDeleteChild = (child: ChildProfile) => {
       Alert.alert(
           'Delete Child',
           `Are you sure you want to delete ${child.name}? This cannot be undone.`,
           [
               { text: 'Cancel', style: 'cancel' },
               {
                   text: 'Delete', 
                   style: 'destructive', 
                   onPress: () => {
                       console.log(`Deleting child: ${child.id}`);
                       // Call the store action to delete
                       deleteChild(child.id);
                       Alert.alert('Deleted', `${child.name} has been removed.`);
                   }
               }
           ]
       );
  }

  // Placeholder for edit navigation/modal
  const handleEditChild = (child: ChildProfile) => {
      Alert.alert('Edit Child', `Editing ${child.name} (Not implemented yet)`);
      // TODO: Navigate to an edit screen or show a modal, passing child.id
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Manage Children</Text>

        {/* Existing Children List - Reads from store */}
        <View style={[styles.section, { backgroundColor: colors.backgroundStrong }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Existing Profiles</Text>
          {children.length === 0 ? (
              <Text style={{ color: colors.placeholder }}>No children added yet.</Text>
          ) : (
            // Use children from the store
            children.map((child) => (
              <View key={child.id} style={styles.childRow}>
                <Text style={[styles.childName, { color: colors.text }]}>{child.name}</Text>
                <View style={styles.childActions}>
                    <TouchableOpacity onPress={() => handleEditChild(child)} style={styles.actionButton}> 
                       <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                     {/* Use confirmDeleteChild for the delete action */}
                    <TouchableOpacity onPress={() => confirmDeleteChild(child)} style={styles.actionButton}> 
                       <Text style={[styles.actionButtonText, { color: colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add New Child Form - Uses store action */}
        <View style={[styles.section, { backgroundColor: colors.backgroundStrong }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add a New Child</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="Child's Name or Username"
            value={childName}
            onChangeText={setChildName}
            autoCapitalize="words"
            placeholderTextColor={colors.placeholder}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="Set Initial Password/PIN (min 4 chars)"
            value={childPassword}
            onChangeText={setChildPassword}
            secureTextEntry
             placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={handleAddChild} // Calls handler which uses store action
           >
             <Text style={styles.buttonText}>Add Child</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15, // Reduced margin between inputs
    paddingHorizontal: 20,
    fontSize: 17,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10, // Added margin top
  },
  buttonText: {
    color: Colors.light.backgroundStrong, // White
    fontSize: 18,
    fontWeight: '600',
  },
  // Styles for Existing Children List
  childRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.background, // Use light gray for border
  },
  childName: {
      fontSize: 18,
  },
  childActions: {
      flexDirection: 'row',
  },
  actionButton: {
      marginLeft: 15, // Space between action buttons
      padding: 5,
  },
  actionButtonText: {
      fontSize: 16,
      fontWeight: '500',
  },
});

export default ManageChildProfilesScreen;