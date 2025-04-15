import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Button, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import stores
import { useChoreStore, Chore } from '../../src/contexts/choreStore';
import { useProfileStore } from '../../src/contexts/profileStore';

// Updated ChoreCard to accept full Chore object and getChildById function
const ChoreCard = ({ chore, getChildNameById, onApprove, onEdit, onDelete }: 
    { 
        chore: Chore, 
        getChildNameById: (id: string | null) => string, 
        onApprove: (choreId: string) => void
        onEdit: () => void,
        onDelete: () => void
    }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const statusColors = {
        Pending: colors.accent,
        Completed: colors.primary,
        Approved: colors.secondary,
    }
    const assignedName = getChildNameById(chore.assignedChildId);
    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{chore.title}</Text>
            <Text style={[styles.cardBody, { color: colors.placeholder }]}>Assigned to: {assignedName}</Text>
             <Text style={[styles.cardBody, { color: colors.placeholder }]}>Points: {chore.points}</Text>
            <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: colors.text }]}>Status: </Text>
                <Text style={[styles.statusValue, { color: statusColors[chore.status] }]}>{chore.status}</Text>
            </View>

            <View style={styles.cardActions}> // Wrapper for actions
                 {/* Approve Button Logic */}
                {chore.status === 'Completed' && (
                    <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: colors.primary }]} 
                        onPress={() => onApprove(chore.id)}
                    >
                        <Text style={styles.actionButtonText}>Approve (+{chore.points} pts)</Text>
                    </TouchableOpacity>
                )}

                 {/* Edit Button */}
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.accent, marginLeft: chore.status === 'Completed' ? 10 : 0 }]} 
                    onPress={onEdit}
                >
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                 {/* Delete Button */}
                 <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.danger, marginLeft: 10 }]} 
                    onPress={onDelete}
                >
                    <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity> 
            </View>
        </View>
    );
}

const ChoresScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get state and actions from stores
  const chores = useChoreStore((state) => state.chores);
  const getChoreById = useChoreStore((state) => state.getChoreById);
  const updateChoreStatus = useChoreStore((state) => state.updateChoreStatus);
  const deleteChore = useChoreStore((state) => state.deleteChore);
  const getChildById = useProfileStore((state) => state.getChildById);
  const updateChildBalance = useProfileStore((state) => state.updateChildBalance);

  // Helper to get child name
  const getChildNameById = (childId: string | null): string => {
      if (!childId) return 'Unassigned';
      const child = getChildById(childId);
      return child ? child.name : 'Unknown Child';
  }

  const handleApproveChore = (choreId: string) => {
      const chore = getChoreById(choreId);
      if (!chore) {
           Alert.alert('Error', 'Could not find chore to approve.');
           return;
      }
      if (!chore.assignedChildId) {
           Alert.alert('Error', 'Cannot approve an unassigned chore.');
           return;
      }

      console.log(`Approving chore: ${choreId} for child ${chore.assignedChildId}`);
      updateChoreStatus(choreId, 'Approved');
      updateChildBalance(chore.assignedChildId, chore.points); 
      
      Alert.alert('Chore Approved!', `${chore.points} points added to ${getChildNameById(chore.assignedChildId)}'s balance.`);
  }

  const handleCreateChore = () => {
      router.push('/(parent)/create-edit-chore');
  }

  const handleEditChore = (choreId: string) => {
      router.push({ pathname: '/(parent)/create-edit-chore', params: { choreId } });
  }

  const confirmDeleteChore = (chore: Chore) => {
      Alert.alert('Delete Chore', `Are you sure you want to delete "${chore.title}"? This cannot be undone.`, [
          { text: 'Cancel', style: 'cancel' },
          {
               text: 'Delete', 
               style: 'destructive', 
               onPress: () => {
                   console.log('Deleting Chore: ', chore.id);
                   deleteChore(chore.id);
                   Alert.alert('Deleted', `"${chore.title}" has been removed.`);
               } 
           },
      ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Manage Chores',
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>Assign, view, and approve chores.</Text>

         <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={handleCreateChore}>
           <Text style={styles.createButtonText}>+ Create New Chore</Text>
         </TouchableOpacity>

        {chores.length === 0 ? (
             <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>No chores created yet.</Text>
         ) : (
             chores.map(chore => (
                 <ChoreCard 
                    key={chore.id} 
                    chore={chore}
                    getChildNameById={getChildNameById}
                    onApprove={handleApproveChore}
                    onEdit={() => handleEditChore(chore.id)} 
                    onDelete={() => confirmDeleteChore(chore)}
                 />
             ))
         )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles remain largely the same, minor adjustments possible
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40, // Ensure space at bottom
  },
  screenSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15, 
  },
   createButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
    alignSelf: 'center',
  },
  createButtonText: {
    color: Colors.light.backgroundStrong, 
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  cardBody: {
    fontSize: 15,
    marginBottom: 5, // Reduced margin
  },
  statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 5, // Adjusted vertical margin
  },
  statusText: {
      fontSize: 15,
  },
  statusValue: {
      fontSize: 15,
      fontWeight: 'bold',
      marginLeft: 5,
  },
  cardActions: {
      flexDirection: 'row',
      marginTop: 10, // Space above actions
      flexWrap: 'wrap', // Allow buttons to wrap if needed
  },
   actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'flex-start', // Keep buttons aligned left
    marginRight: 10, // Add space between buttons
    marginBottom: 5, // Space if wrapping
  },
  actionButtonText: {
      color: Colors.light.backgroundStrong, 
      fontSize: 14,
      fontWeight: '500',
  },
});

export default ChoresScreen; 