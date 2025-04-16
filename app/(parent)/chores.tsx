import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Button, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator // Add ActivityIndicator
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import stores
import { useChoreStore, Chore } from '../../src/contexts/choreStore';
import { useProfileStore } from '../../src/contexts/profileStore';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for edit/delete

// Updated ChoreCard for async actions and loading states
const ChoreCard = ({ chore, getChildNameById, onApprove, onEdit, onDelete }: 
    { 
        chore: Chore, 
        getChildNameById: (id: string | null) => string, 
        onApprove: (choreId: string) => Promise<void>, // Make async
        onEdit: (choreId: string) => void, // Pass choreId
        onDelete: (chore: Chore) => Promise<void> // Make async
    }) => {
    const [isApproving, setIsApproving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const statusColors = {
        Pending: colors.accent,
        Completed: colors.primary,
        Approved: colors.secondary,
    };
    const assignedName = getChildNameById(chore.assigned_child_id);

    const handleApprovePress = async () => {
        if (isApproving) return;
        setIsApproving(true);
        await onApprove(chore.id);
        setIsApproving(false); // Reset loading state (error handled in store/parent)
    };

    const handleDeletePress = async () => {
        if (isDeleting) return;
        // Confirmation is handled in parent component now
        setIsDeleting(true);
        await onDelete(chore);
        setIsDeleting(false); // Reset loading state
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{chore.title}</Text>
            <Text style={[styles.cardBody, { color: colors.placeholder }]}>Assigned to: {assignedName}</Text>
             <Text style={[styles.cardBody, { color: colors.placeholder }]}>Points: {chore.points}</Text>
            <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: colors.text }]}>Status: </Text>
                <Text style={[styles.statusValue, { color: statusColors[chore.status] || colors.text }]}>{chore.status}</Text>
            </View>

            <View style={styles.cardActions}>
                {/* Approve Button */}
                {chore.status === 'Completed' && (
                    <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: isApproving ? colors.placeholder : colors.primary }]} 
                        onPress={handleApprovePress}
                        disabled={isApproving}
                    >
                        {isApproving ? (
                            <ActivityIndicator size="small" color={colors.backgroundStrong} />
                        ) : (
                            <Text style={styles.actionButtonText}>Approve (+{chore.points} pts)</Text>
                        )}
                    </TouchableOpacity>
                )}

                {/* Edit Button */}
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.accent, marginLeft: chore.status === 'Completed' ? 10 : 0 }]} 
                    onPress={() => onEdit(chore.id)} // Pass ID
                    disabled={isApproving || isDeleting} // Disable if other action in progress
                >
                    <Ionicons name="pencil-outline" size={16} color={colors.backgroundStrong} style={{ marginRight: 5 }} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                 {/* Delete Button */}
                 <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: isDeleting ? colors.placeholder : colors.danger, marginLeft: 10 }]} 
                    onPress={handleDeletePress}
                    disabled={isApproving || isDeleting}
                >
                     {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.backgroundStrong} />
                     ) : (
                        <Ionicons name="trash-outline" size={16} color={colors.backgroundStrong} style={{ marginRight: 5 }} />
                     )}
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
  const { chores, fetchChores, approveChore, deleteChore, isLoading, error } = useChoreStore();
  const { getChildById, children: profileChildren, fetchChildren, adjustChildBalance } = useProfileStore();

  // Fetch data on mount
  useEffect(() => {
      console.log('Parent chores screen mounted, fetching data...');
      fetchChores(); // Fetch all parent chores
      if (profileChildren.length === 0) {
        fetchChildren(); // Fetch children if not already loaded (for name lookup)
      }
  }, [fetchChores, fetchChildren, profileChildren.length]); // Re-fetch if fetch function changes

  // Helper to get child name from potentially loaded profile store
  const getChildNameById = (childId: string | null): string => {
      if (!childId) return 'Unassigned';
      const child = getChildById(childId);
      return child ? child.name : 'Loading...'; // Indicate loading if child profile isn't ready
  }

  const handleApproveChore = async (choreId: string) => {
      const chore = chores.find(c => c.id === choreId); // Find chore in local state
      if (!chore || !chore.assigned_child_id) {
          Alert.alert('Error', 'Cannot approve: Chore not found or not assigned.');
          return;
      }
      console.log(`Approving chore: ${choreId} for child ${chore.assigned_child_id}`);
      
      const result = await approveChore(choreId);
      
      if (result) {
          // Update child balance in profile store
          // This relies on the child profile already being loaded
          const successBalanceUpdate = await adjustChildBalance(chore.assigned_child_id, { 
              amount: chore.points * 0.01, // Assuming 1 point = $0.01 - make configurable? 
              description: `Reward for chore: ${chore.title}` 
          }); 
          
          if(successBalanceUpdate) {
              Alert.alert('Chore Approved!', `${chore.points} points awarded.`);
          } else {
               Alert.alert('Approval Issue', 'Chore status updated, but failed to update child balance. Please adjust manually.');
          }
      } else {
          // Error handled by store
          Alert.alert('Error', useChoreStore.getState().error || 'Could not approve chore.');
      }
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
               onPress: async () => { // Make async
                   console.log('Deleting Chore: ', chore.id);
                   const success = await deleteChore(chore.id);
                   if (success) {
                     Alert.alert('Deleted', `"${chore.title}" has been removed.`);
                   } else {
                       Alert.alert('Error', useChoreStore.getState().error || 'Could not delete chore.');
                   }
               } 
           },
      ]);
  }

   // Render loading state
   if (isLoading && chores.length === 0) { // Show loading only on initial load
       return (
           <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Manage Chores' }} />
               <View style={styles.loadingContainer}>
                   <ActivityIndicator size="large" color={colors.primary} />
               </View>
            </SafeAreaView>
        );
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
        
        {/* Display global error */}
        {error && !isLoading && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

         <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={handleCreateChore}>
           <Text style={styles.createButtonText}>+ Create New Chore</Text>
         </TouchableOpacity>

        {chores.length === 0 && !isLoading ? (
             <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>No chores created yet.</Text>
         ) : (
             chores.map(chore => (
                 <ChoreCard 
                    key={chore.id} 
                    chore={chore}
                    getChildNameById={getChildNameById}
                    onApprove={handleApproveChore}
                    onEdit={handleEditChore} 
                    onDelete={() => confirmDeleteChore(chore)} // Keep confirmation here
                 />
             ))
         )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles adjusted for action button icons etc.
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
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  errorText: {
      padding: 15,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '500',
      marginBottom: 10,
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
    flexDirection: 'row', // Align icon and text
    paddingVertical: 8,
    paddingHorizontal: 12, // Adjust padding
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'flex-start', 
    marginRight: 10, 
    marginBottom: 5, 
    minWidth: 80, // Ensure minimum width for consistency
    justifyContent: 'center', // Center content (icon + text)
  },
  actionButtonText: {
      color: Colors.light.backgroundStrong, 
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 5, // Space between icon and text
  },
});

export default ChoresScreen; 