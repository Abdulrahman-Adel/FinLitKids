import React from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity 
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import stores
import { useChoreStore, Chore, ChoreStatus } from '../../src/contexts/choreStore';
import { useProfileStore } from '../../src/contexts/profileStore';
import { useAuthStore } from '../../src/contexts/authStore'; // Import auth store

// Updated ChoreItem to show description
const ChoreItem = ({ chore, onMarkDone }: { chore: Chore, onMarkDone: (choreId: string) => void }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const statusInfo = {
        Pending: { text: 'Do this! ✅', color: colors.accent },
        Completed: { text: 'Waiting for review 👀', color: colors.primary },
        Approved: { text: 'Done! 🎉', color: colors.secondary },
    }
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
            <Text style={[styles.statusText, { color: statusInfo[chore.status].color }]}>{statusInfo[chore.status].text}</Text>
            {chore.status === 'Pending' && (
                 <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.secondary }]} 
                    onPress={() => onMarkDone(chore.id)}
                  >
                    <Text style={styles.actionButtonText}>Mark as Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const ChildChoresScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get actions/state from stores
  const getChoresByChild = useChoreStore((state) => state.getChoresByChild);
  const updateChoreStatus = useChoreStore((state) => state.updateChoreStatus);
  const loggedInUserId = useAuthStore((state) => state.loggedInUserId);
  const getChildById = useProfileStore((state) => state.getChildById);

  // Get the logged-in child's profile (if available)
  const loggedInChild = loggedInUserId ? getChildById(loggedInUserId) : null;
  const loggedInChildName = loggedInChild?.name;

  // Filter chores for the logged-in child
  const myChores = loggedInUserId ? getChoresByChild(loggedInUserId) : [];

  const handleMarkDone = (choreId: string) => {
      if (!loggedInUserId) {
          Alert.alert('Error', 'Cannot mark chore complete: User not identified.');
          return;
      }
      console.log(`Marking chore ${choreId} as completed by child ${loggedInUserId}`);
      updateChoreStatus(choreId, 'Completed');
      Alert.alert('Chore Done!', 'Submitted for review.');
  }

  // Handle case where child isn't found (shouldn't happen if logged in)
  if (!loggedInChild) {
       return (
           <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
               <View style={styles.errorContainer}>
                   <Text style={{ color: colors.danger }}>Error: Could not identify logged-in child.</Text>
                   {/* Optionally add a logout button here */}
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

        {myChores.length === 0 ? (
             <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>No chores assigned right now.</Text>
        ) : (
            myChores.map(chore => (
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
});

export default ChildChoresScreen; 