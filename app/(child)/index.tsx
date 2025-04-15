import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  SafeAreaView, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/contexts/authStore';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProfileStore } from '../../src/contexts/profileStore';
import { Ionicons } from '@expo/vector-icons';

// Placeholder for an icon component (replace with actual icon library later)
/* const IconPlaceholder = ({ name, style }: { name: string, style?: any }) => (
  <View style={[styles.iconPlaceholder, style]}><Text style={styles.iconText}>{name.substring(0,1)}</Text></View>
); */

const ChildAppScreen: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const loggedInUserId = useAuthStore((state) => state.loggedInUserId);
  const getChildById = useProfileStore((state) => state.getChildById);

  // Get logged-in child data
  const loggedInChild = loggedInUserId ? getChildById(loggedInUserId) : null;

  const handleLogout = () => {
    console.log("Logging out child...");
    logout();
  };

  // Navigation handlers - Updated
  const navigateTo = (path: string) => {
      router.push(path as any); 
      console.log(`Navigate to: ${path}`);
  };

  // Mock data for dashboard
  const balance = 25.50;
  const nextChore = "Feed the fish";
  const nextGoal = "Save for Toy Robot";

  // Handle loading or error state if child data isn't available yet
  if (!loggedInChild) {
    // Optional: Show a loading indicator or error message
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format balance
  const formattedBalance = loggedInChild.balance.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD' // Adjust currency code as needed
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>My Dashboard</Text>
        {/* Balance Overview */}
        <View style={[styles.balanceCard, { backgroundColor: colors.secondary }]}>
             <Text style={styles.balanceLabel}>My Balance</Text>
             <Text style={styles.balanceAmount}>{formattedBalance}</Text>
        </View>

        {/* Quick Actions Grid - Updated onPress */}
        <View style={styles.gridContainer}>
          {/* Chores */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/chores')}>
            {/* <IconPlaceholder name="Chores" style={{backgroundColor: colors.secondary}} /> */}
            <Ionicons name="list-circle-outline" size={50} color={colors.secondary} />
            <Text style={[styles.gridText, { color: colors.text }]}>My Chores</Text>
             <Text style={[styles.gridSubtitle, { color: colors.placeholder }]}>Next: {nextChore}</Text>
          </TouchableOpacity>

           {/* Savings Goals */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/savings')}>
            {/* <IconPlaceholder name="Savings" style={{backgroundColor: colors.primary}}/> */}
            <Ionicons name="rocket-outline" size={50} color={colors.primary} />
            <Text style={[styles.gridText, { color: colors.text }]}>My Goals</Text>
            <Text style={[styles.gridSubtitle, { color: colors.placeholder }]}>Next: {nextGoal}</Text>
          </TouchableOpacity>

           {/* Spending History */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/spending')}>
            {/* <IconPlaceholder name="Spending" style={{backgroundColor: colors.danger}}/> */}
            <Ionicons name="wallet-outline" size={50} color={colors.danger} />
            <Text style={[styles.gridText, { color: colors.text }]}>My Spending</Text>
            <Text style={[styles.gridSubtitle, { color: colors.placeholder }]}>View History</Text>
          </TouchableOpacity>

           {/* Learning */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/learning')}>
            {/* <IconPlaceholder name="Learning" style={{backgroundColor: '#9b59b6'}}/> */}
            <Ionicons name="school-outline" size={50} color={'#9b59b6'} />
            <Text style={[styles.gridText, { color: colors.text }]}>Learn</Text>
             <Text style={[styles.gridSubtitle, { color: colors.placeholder }]}>New Module!</Text>
          </TouchableOpacity>
          
          {/* Optional: Giving */}
          {/* <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/giving')}>
            <IconPlaceholder name="Giving" style={{backgroundColor: colors.accent}}/>
            <Text style={[styles.gridText, { color: colors.text }]}>Give</Text>
          </TouchableOpacity> */}
          
          {/* Optional: Communication */}
           {/* <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/messages')}>
            <IconPlaceholder name="Messages" style={{backgroundColor: '#e67e22'}}/>
            <Text style={[styles.gridText, { color: colors.text }]}>Messages</Text>
          </TouchableOpacity> */} 
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.danger }]} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// Using similar styling structure as Parent Dashboard
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20, 
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  balanceCard: {
      width: '90%',
      paddingVertical: 25,
      paddingHorizontal: 20,
      borderRadius: 15,
      marginBottom: 30,
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
  },
  balanceLabel: {
      fontSize: 16,
      color: Colors.light.backgroundStrong, // White text on colored bg
      marginBottom: 5,
  },
  balanceAmount: {
      fontSize: 36,
      fontWeight: 'bold',
      color: Colors.light.backgroundStrong,
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%', 
    aspectRatio: 1, 
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  gridText: {
    marginTop: 8, // Adjust spacing
    fontSize: 16,
    fontWeight: '600', // Slightly bolder
    textAlign: 'center',
  },
   gridSubtitle: {
      fontSize: 12,
      marginTop: 3,
      fontWeight: 'bold',
  },
  logoutButton: {
      width: '80%',
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20, 
  },
  logoutButtonText: {
    color: Colors.light.backgroundStrong, 
    fontSize: 18,
    fontWeight: '600',
  },
  iconPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5,
  },
  iconText: {
      color: Colors.light.backgroundStrong,
      fontSize: 20,
      fontWeight: 'bold',
  },
  loadingContainer: { // Added for loading state
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChildAppScreen; 