import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Button, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity, Switch, TextInput
} from 'react-native';
import { Stack, router } from 'expo-router'; // Import Stack for header options
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore';
// TODO: Potentially create an allowanceStore later if logic gets complex

// Placeholder components for demonstration
const ChildAllowanceCard = ({ name, amount, frequency }: { name: string, amount: number, frequency: string }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.cardBody, { color: colors.text }]}>Allowance: ${amount} / {frequency}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Edit Allowance', `Edit ${name}'s allowance (Not implemented).`)}>
                <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
        </View>
    );
}

const AllowanceScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { children, updateChild, updateChildBalance } = useProfileStore();

  // State to track which child's settings are being edited
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');
  const [editingFrequency, setEditingFrequency] = useState<'Weekly' | 'Bi-Weekly' | 'Monthly'>('Weekly');

  const handleToggleEdit = (child: ChildProfile) => {
    if (editingChildId === child.id) {
      // If already editing this child, cancel editing
      setEditingChildId(null);
      setEditingAmount('');
      setEditingFrequency('Weekly');
    } else {
      // Start editing this child, pre-fill with current settings
      setEditingChildId(child.id);
      setEditingAmount((child.allowanceAmount || 0).toString());
      setEditingFrequency(child.allowanceFrequency || 'Weekly');
    }
  };

  const handleSaveSettings = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (!child) return;

    const amount = parseFloat(editingAmount);
    if (isNaN(amount) || amount < 0) { // Allow 0 amount
      Alert.alert('Invalid Amount', 'Please enter a valid allowance amount (0 or more).');
      return;
    }
    // Basic validation for frequency (more robust needed for real app)
    const validFrequencies = ['Weekly', 'Bi-Weekly', 'Monthly'];
    if (!validFrequencies.includes(editingFrequency)) {
        Alert.alert('Invalid Frequency', 'Please enter Weekly, Bi-Weekly, or Monthly.');
        return;
    }
    
    const updatedChild: ChildProfile = {
      ...child,
      allowanceAmount: amount,
      allowanceFrequency: editingFrequency,
      allowanceEnabled: child.allowanceEnabled ?? false // Keep existing enabled status
    };
    updateChild(updatedChild);
    setEditingChildId(null); // Exit editing mode
    Alert.alert('Settings Saved', `${child.name}'s allowance settings updated.`);
  };

 const handleToggleEnabled = (child: ChildProfile) => {
     const updatedChild: ChildProfile = {
         ...child,
         allowanceEnabled: !(child.allowanceEnabled ?? false),
         // Ensure defaults are set if enabling for the first time
         allowanceAmount: child.allowanceAmount ?? 5, // Default to 5 if undefined
         allowanceFrequency: child.allowanceFrequency ?? 'Weekly' // Default to Weekly if undefined
     };
     updateChild(updatedChild);
     // If disabling, exit edit mode for this child
     if (!updatedChild.allowanceEnabled && editingChildId === child.id) {
         setEditingChildId(null);
     }
 };

  const handleDistributeAllowance = (child: ChildProfile) => {
    const amount = child.allowanceAmount;
    if (!(child.allowanceEnabled ?? false)) {
      Alert.alert("Not Enabled", "Allowance is not enabled for this child.");
      return;
    }
    if (amount === undefined || amount <= 0) {
      Alert.alert("Invalid Amount", "Please set a valid positive allowance amount first.");
      return;
    }

    try {
      updateChildBalance(child.id, amount);
      Alert.alert("Allowance Sent", `$${amount.toFixed(2)} sent to ${child.name}.`);
    } catch (error) {
      Alert.alert("Error", "Could not send allowance.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
       {/* Use Stack.Screen to configure header */}
      <Stack.Screen 
        options={{
          headerShown: true, // Show header for this screen
          title: 'Manage Allowance',
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          // Add a headerRight button if needed later
          // headerRight: () => (<Button onPress={() => alert('Help!')} title="Help" color={colors.primary} />),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>
          Set up recurring payments for your children.
        </Text>
        
        {children.length === 0 ? (
          <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>
            Add children in 'Manage Children' to set up allowances.
          </Text>
        ) : (
          children.map((child) => {
            const isEditing = editingChildId === child.id;
            const isEnabled = child.allowanceEnabled ?? false;
            const displayAmount = child.allowanceAmount ?? 0;
            const displayFrequency = child.allowanceFrequency || 'Weekly';
            return (
              <View key={child.id} style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{child.name}</Text>
                  <Switch
                    trackColor={{ false: colors.placeholder, true: colors.primary + '80' }}
                    thumbColor={isEnabled ? colors.primary : colors.background}
                    ios_backgroundColor={colors.placeholder}
                    onValueChange={() => handleToggleEnabled(child)}
                    value={isEnabled}
                  />
                </View>
                {isEnabled && (
                  <View style={styles.settingsContainer}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Amount:</Text>
                    <Text style={[styles.settingValue, { color: colors.text }]}>${displayAmount.toFixed(2)}</Text>
                    <Text style={[styles.settingLabel, { color: colors.text, marginLeft: 20 }]}>Frequency:</Text>
                    <Text style={[styles.settingValue, { color: colors.text }]}>{displayFrequency}</Text>
                    {!isEditing && (
                      <TouchableOpacity 
                        style={[styles.distributeButton, { backgroundColor: colors.secondary }]} 
                        onPress={() => handleDistributeAllowance(child)}
                        disabled={displayAmount <= 0}
                      >
                        <Text style={styles.distributeButtonText}>Send Now (Mock)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Add button for setting up new allowance rules if needed */}
        {/* <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
             <Text style={styles.addButtonText}>Set Up New Allowance</Text>
           </TouchableOpacity> */}

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
    paddingBottom: 40,
  },
  screenSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  card: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15, // Add space below header if settings are shown
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping
    alignItems: 'center',
    marginTop: 10,
    borderTopColor: Colors.light.background, // Separator line
    borderTopWidth: 1,
    paddingTop: 15,
  },
  settingLabel: {
    fontSize: 16,
    marginRight: 5,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  distributeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 'auto', // Push to the right
    marginTop: 10, // Space if wrapped
  },
  distributeButtonText: {
    color: Colors.light.backgroundStrong,
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    padding: 5,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsDisplayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
    borderTopColor: Colors.light.background,
    borderTopWidth: 1,
    paddingTop: 15,
  },
  // addButton: {
  //   paddingVertical: 15,
  //   borderRadius: 10,
  //   alignItems: 'center',
  //   marginTop: 20,
  // },
  // addButtonText: {
  //   color: Colors.light.backgroundStrong, // White
  //   fontSize: 18,
  //   fontWeight: '600',
  // },
});

export default AllowanceScreen; 