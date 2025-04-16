import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Button, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Stack, router } from 'expo-router'; 
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import the profile store and types
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore'; 
import { Ionicons } from '@expo/vector-icons'; // Added for icons

// Helper function to get initials (similar to ParentAppScreen)
const getInitials = (name: string): string => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

// Component for displaying a single child profile row with actions
const ProfileItem = ({ child, onEdit, onDelete }: { 
    child: ChildProfile, 
    onEdit: (childId: string) => void, 
    onDelete: (childId: string) => Promise<boolean> // Return success status
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleDeletePress = async () => {
        // Confirmation happens in parent
        setIsDeleting(true);
        const success = await onDelete(child.id);
        // Only reset loading state here, feedback handled by parent
        if (!success) {
             // If deletion failed, stop showing loading spinner immediately
             setIsDeleting(false);
        } 
        // If success, the item will likely disappear from the list, so spinner state doesn't matter as much.
    };

    return (
        <View style={styles.childRow}>
             {/* Use initials-based avatar */} 
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
                 <Text style={styles.initialsText}>{getInitials(child.name)}</Text>
            </View>
            <Text style={[styles.childName, { color: colors.text }]}>{child.name}</Text>
            <View style={styles.childActions}>
                <TouchableOpacity onPress={() => onEdit(child.id)} style={styles.actionButton} disabled={isDeleting}> 
                    <Ionicons name="pencil-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeletePress} style={styles.actionButton} disabled={isDeleting}> 
                    {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                        <Ionicons name="trash-outline" size={22} color={colors.danger} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const ManageChildProfilesScreen: React.FC = () => {
  // Get state and actions from the store
  const { children, fetchChildren, deleteChild, isLoading, error, clearError } = useProfileStore();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Fetch children on mount and clear previous errors
  useEffect(() => {
    console.log('Manage profiles screen mounted, fetching children...');
    clearError(); // Clear errors from previous screens/actions
    fetchChildren();
  }, [fetchChildren, clearError]);

  // Navigate to Add/Edit screen (without ID for adding)
  const handleAddChild = () => {
      clearError(); // Clear error before navigating
      router.push('/(parent)/add-edit-child');
  };

  // Navigate to Add/Edit screen with ID for editing
  const handleEditChild = (childId: string) => {
       clearError(); // Clear error before navigating
      router.push({ pathname: '/(parent)/add-edit-child', params: { childId } });
  }

  // Confirm and call delete action from the store
  const confirmDeleteChild = (child: ChildProfile) => {
       Alert.alert(
           'Delete Child',
           `Are you sure you want to delete ${child.name}? This will remove their account and data permanently.`, 
           [
               { text: 'Cancel', style: 'cancel' },
               { text: 'Delete Permanently', style: 'destructive', onPress: () => handleDelete(child.id) }
           ]
       );
  }
  
  // Async handler for the actual delete action
  const handleDelete = async (childId: string): Promise<boolean> => {
       clearError(); // Clear previous errors before attempting delete
       console.log(`Attempting to delete child: ${childId}`);
       const success = await deleteChild(childId);
       if (success) {
           Alert.alert('Deleted', `Child profile removed.`);
       } else {
            // Error state is now set in the store, it will be displayed in the UI
            // Optionally add a small Alert here too, but UI display is better
             // Alert.alert('Error', useProfileStore.getState().error || 'Could not delete child profile.');
       }
       return success; // Return success status to ProfileItem
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
       <Stack.Screen 
            options={{
                headerShown: true,
                title: 'Manage Children',
                headerStyle: { backgroundColor: colors.backgroundStrong },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
                 headerRight: () => (
                    <TouchableOpacity onPress={handleAddChild} style={{ marginRight: 15 }}>
                        <Ionicons name="person-add-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                ),
            }}
        />
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Existing Children List */}
        <View style={[styles.section, { backgroundColor: colors.backgroundStrong }]}>
           
            {/* Loading State */}
            {isLoading && children.length === 0 && (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
            )}

            {/* Error State Display */} 
            {error && (
                 <View style={styles.errorContainer}> 
                    <Text style={styles.errorText}>{error}</Text>
                     {/* Optionally add a retry button for fetch errors */} 
                     <TouchableOpacity onPress={fetchChildren} style={[styles.retryButton, {borderColor: colors.primary}]}>
                        <Text style={[styles.retryButtonText, {color: colors.primary}]}>Retry</Text>
                     </TouchableOpacity>
                 </View>
            )}

            {/* Empty State (only show if not loading and no error) */}
            {!isLoading && !error && children.length === 0 && (
              <Text style={styles.placeholderText}>No children added yet. Tap the + icon in the header to add one.</Text>
            )}

            {/* Children List (only show if not loading and no children yet, or if children exist) */} 
            {!isLoading && children.length > 0 && (
                children.map((child) => (
                    <ProfileItem 
                        key={child.id} 
                        child={child} 
                        onEdit={handleEditChild} 
                        onDelete={handleDelete} 
                    />
                ))
            )}
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
    padding: 15, 
    paddingBottom: 30, // Ensure space at bottom
  },
  section: {
    width: '100%',
    paddingHorizontal: 15, // Padding inside the card
    paddingVertical: 5, // Reduced vertical padding for list items
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  childRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12, 
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.background, 
  },
   avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      // backgroundColor set dynamically
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
  },
  initialsText: { // Style for the initials (from ParentAppScreen)
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.light.backgroundStrong, // White text on colored background
  },
  childName: {
      flex: 1, 
      fontSize: 17, 
      fontWeight: '500',
  },
  childActions: {
      flexDirection: 'row',
  },
  actionButton: {
      marginLeft: 20, 
      padding: 8, 
  },
   placeholderText: {
      textAlign: 'center',
      paddingVertical: 30,
      fontSize: 16,
      color: Colors.light.placeholder,
  },
   errorContainer: { // Container for error message + retry button
      alignItems: 'center',
      paddingVertical: 20,
  },
  errorText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '500',
      color: Colors.light.error, // Use error color
      marginBottom: 15, // Space before retry button
  },
  retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderWidth: 1,
      borderRadius: 8,
  },
  retryButtonText: {
      fontSize: 16,
      fontWeight: '500',
  },
});

export default ManageChildProfilesScreen;