import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import stores
import { useChoreStore, Chore, ChoreStatus } from '../../src/contexts/choreStore';
import { useAuthStore, ChildUser } from '../../src/contexts/authStore';

// Updated ChoreItem to show description and handle local loading
const ChoreItem = ({ chore, onMarkDone }: { chore: Chore, onMarkDone: (choreId: string) => Promise<void> }) => {
    const [isCompleting, setIsCompleting] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const statusInfo = {
        Pending: { text: 'Do this! ✅', color: colors.accent },
        Completed: { text: 'Waiting for review 👀', color: colors.primary },
        Approved: { text: 'Done! 🎉', color: colors.secondary },
    };

    const handlePress = async () => {
        if (isCompleting) return;
        setIsCompleting(true);
        try {
            await onMarkDone(chore.id);
            // Alert moved to parent component or handled via global notifications
        } catch (error) {
            // Error is handled by the store, maybe show local feedback if needed
            console.error('Error marking chore complete in item:', error);
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
             <View style={styles.cardHeader}>
                 <Text style={[styles.cardTitle, { color: colors.text }]}>{chore.title}</Text>
                 <Text style={[styles.pointsText, { color: colors.secondary }]}>+{chore.points} pts</Text>
             </View>
             {/* Show description if it exists */}
             {chore.description && (
                <Text style={[styles.descriptionText, { color: colors.placeholder }]}>{chore.description}</Text>
             )}
            <Text style={[styles.statusText, { color: statusInfo[chore.status]?.color || colors.text }]}>{statusInfo[chore.status]?.text || chore.status}</Text>
            {chore.status === 'Pending' && (
                 <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: isCompleting ? colors.placeholder : colors.secondary }]} 
                    onPress={handlePress}
                    disabled={isCompleting}
                  >
                    {isCompleting ? (
                        <ActivityIndicator size="small" color={colors.backgroundStrong} />
                    ) : (
                        <Text style={styles.actionButtonText}>Mark as Done</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const ChildChoresScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get actions/state from chore store
  const { chores, fetchChores, markChoreComplete, isLoading, error } = useChoreStore();
  
  // Get logged-in child name from auth store
  const currentUser = useAuthStore((state) => state.currentUser) as ChildUser | null;
  const loggedInChildName = currentUser?.name;

  // Fetch chores on mount
  useEffect(() => {
    console.log('Child chores screen mounted, fetching chores...');
    // Fetch all chores assigned to this child (backend filters by logged-in user)
    fetchChores(); 
  }, [fetchChores]);

  // Use the markChoreComplete action from the store
  const handleMarkDone = async (choreId: string) => {
      console.log(`Attempting to mark chore ${choreId} as completed via API`);
      const updatedChore = await markChoreComplete(choreId);
      if (updatedChore) {
          Alert.alert('Chore Done!', 'Submitted for parent review.');
      } else {
          // Error is displayed via the global error state in the store
          // Alert.alert('Error', 'Could not mark chore as done. Please try again.');
      }
      // No need to manually update status here, store handles it
  }

  // Render loading state
  if (isLoading && chores.length === 0) { // Show loading only on initial load
       return (
           <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'My Chores' }} />
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
          title: `${loggedInChildName ? loggedInChildName + "'s" : "My"} Chores`,
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>Complete chores to earn points!</Text>
        
        {/* Display global error if any */}
        {error && !isLoading && (
             <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {chores.length === 0 && !isLoading ? (
             <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>No chores assigned right now.</Text>
        ) : (
            chores.map(chore => (
                <ChoreItem 
                    key={chore.id} 
                    chore={chore}
                    onMarkDone={handleMarkDone}
                />
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
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
      marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pointsText: {
      fontSize: 16,
      fontWeight: 'bold',
  },
  statusText: {
    fontSize: 15,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  actionButtonText: {
      color: Colors.light.backgroundStrong, 
      fontSize: 14,
      fontWeight: '500',
  },
  descriptionText: {
      fontSize: 14,
      marginBottom: 10,
      fontStyle: 'italic',
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
  },
});

export default ChildChoresScreen; 