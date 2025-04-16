import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  SafeAreaView, Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore, ChildUser } from '../../src/contexts/authStore';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDashboardStore } from '../../src/contexts/dashboardStore';
import { Ionicons } from '@expo/vector-icons';

// Placeholder for an icon component (replace with actual icon library later)
/* const IconPlaceholder = ({ name, style }: { name: string, style?: any }) => (
  <View style={[styles.iconPlaceholder, style]}><Text style={styles.iconText}>{name.substring(0,1)}</Text></View>
); */

const ChildAppScreen: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useAuthStore((state) => state.currentUser) as ChildUser | null;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Use the dashboard store
  const { data: dashboardData, isLoading, error, fetchDashboardData } = useDashboardStore();

  // Fetch dashboard data on mount
  useEffect(() => {
    console.log('Child dashboard mounted, fetching data...');
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    console.log("Logging out child...");
    logout();
  };

  const navigateTo = (path: string) => {
      router.push(path as any); 
      console.log(`Navigate to: ${path}`);
  };

  // Handle loading state from dashboard store
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  // Handle error state
   if (error || !dashboardData) {
     return (
       <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
         <View style={styles.loadingContainer}> 
           <Text style={[styles.errorText, { color: colors.error }]}>
              {error || 'Could not load dashboard data.'}
           </Text>
           {/* Maybe add a retry button? */}
         </View>
       </SafeAreaView>
     );
   }

  // Data is loaded, format balance
  const formattedBalance = Number(dashboardData.balance).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD' // Adjust currency code as needed
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Use name from currentUser */}
        <Text style={[styles.title, { color: colors.text }]}>Hi, {currentUser?.name || 'Kiddo'}!</Text>
        
        {/* Use data from dashboardStore */}
        <View style={[styles.balanceCard, { backgroundColor: colors.secondary }]}>
             <Text style={styles.balanceLabel}>My Balance</Text>
             <Text style={styles.balanceAmount}>{formattedBalance}</Text>
        </View>

        {/* Quick Actions Grid - Use data from dashboardStore */}
        <View style={styles.gridContainer}>
          {/* Chores */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/chores')}>
            <Ionicons name="list-circle-outline" size={50} color={colors.secondary} />
            <Text style={[styles.gridText, { color: colors.text }]}>My Chores</Text>
             <Text style={[styles.gridSubtitle, { color: colors.placeholder }]}>
                {dashboardData.pendingChoresCount > 0 ? `${dashboardData.pendingChoresCount} pending` : 'All done! 🎉'}
             </Text>
          </TouchableOpacity>

           {/* Savings Goals */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/savings')}>
            <Ionicons name="rocket-outline" size={50} color={colors.primary} />
            <Text style={[styles.gridText, { color: colors.text }]}>My Goals</Text>
            <Text style={[styles.gridSubtitle, { color: colors.placeholder }]}>
                {dashboardData.activeGoalsCount > 0 ? `${dashboardData.activeGoalsCount} active` : 'No goals set'}
            </Text>
          </TouchableOpacity>

           {/* Spending History */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/spending')}>
            <Ionicons name="wallet-outline" size={50} color={colors.danger} />
            <Text style={[styles.gridText, { color: colors.text }]}>My Spending</Text>
            <Text style={[styles.gridSubtitle, { color: colors.placeholder }]}>View History</Text>
          </TouchableOpacity>

           {/* Learning */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(child)/learning')}>
            <Ionicons name="school-outline" size={50} color={'#9b59b6'} />
            <Text style={[styles.gridText, { color: colors.text }]}>Learn</Text>
             <Text style={[styles.gridSubtitle, { color: colors.placeholder }]}>New Module!</Text>
          </TouchableOpacity>
          
          {/* Optional sections removed for brevity */}
           
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
  errorText: { // Add if missing
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
});

export default ChildAppScreen; 