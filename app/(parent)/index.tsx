import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, // Import ScrollView
  SafeAreaView, // Import SafeAreaView
  Button, // Import Button
  Alert, // Import Alert
  Image, // Import Image
} from 'react-native';
import { router } from 'expo-router'; // Import router
import { useAuthStore } from '../../src/contexts/authStore'; // Import store
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore'; // Import profile store and type

// Remove @react-navigation imports
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../navigation/RootNavigator';

// Remove navigation prop types
// type ParentAppScreenNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   'ParentApp'
// >;

// Child Summary Card Component
const ChildSummaryCard = ({ child }: { child: ChildProfile }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const formattedBalance = child.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  
  const handlePress = () => {
      // Later: Navigate to a detailed child view, e.g., router.push(`/(parent)/child/${child.id}`)
      Alert.alert('View Child', `Selected ${child.name} (detail view not implemented)`);
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.childCard}>
      <View style={styles.childInfo}>
          {/* Use avatar or placeholder */}
          {child.avatarUrl ? (
              <Image source={{ uri: child.avatarUrl }} style={styles.childAvatar} />
          ) : (
              <View style={[styles.childAvatarPlaceholder, {backgroundColor: colors.secondary}]}>
                <Ionicons name="person-outline" size={24} color={colors.backgroundStrong} />
              </View>
          )}
          <Text style={[styles.childName, { color: colors.text }]}>{child.name}</Text>
      </View>
      <Text style={[styles.childBalance, { color: colors.secondary }]}>{formattedBalance}</Text>
    </TouchableOpacity>
  );
};

const ParentAppScreen: React.FC = () => {
  // Remove useNavigation hook
  // const navigation = useNavigation<ParentAppScreenNavigationProp>();

  const logout = useAuthStore((state) => state.logout); // Get logout action
  const { children } = useProfileStore(); // Get children from profile store
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogout = () => {
    console.log("Logging out parent...");
    logout();
    // Navigation back to auth flow will happen via the effect in AuthLoadingScreen
    // router.replace('/(auth)' as any); // Remove direct navigation
  };

  // Navigation handlers - Updated
  const navigateTo = (path: string) => {
      // Use router.push to navigate to the actual screens
      // The paths match the filenames in app/(parent)/...
      router.push(path as any); 
      console.log(`Navigate to: ${path}`);
      // Remove the alert now that we have placeholder screens
      // alert('Feature not implemented yet.'); 
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Parent Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>Overview & Quick Actions</Text>

        {/* Children Overview - Updated */}
        <View style={[styles.section, { backgroundColor: colors.backgroundStrong }]}>
          <View style={styles.sectionHeader}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Children</Text>
            <TouchableOpacity 
                style={[styles.buttonSmall, { backgroundColor: colors.primary }]} 
                onPress={() => navigateTo('/(parent)/manage-child-profiles')}
            >
                <Text style={styles.buttonSmallText}>Manage Profiles</Text>
            </TouchableOpacity>
          </View>
          {children.length === 0 ? (
            <Text style={{ color: colors.placeholder, marginTop: 10 }}>No children added yet. Go to "Manage Profiles" to add one.</Text>
          ) : (
            children.map(child => <ChildSummaryCard key={child.id} child={child} />)
          )}
        </View>

        {/* Quick Actions Grid - Updated onPress handlers */}
        <View style={styles.gridContainer}>
          {/* Allowance */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(parent)/allowance')}>
            <Ionicons name="cash-outline" size={50} color={colors.accent} />
            <Text style={[styles.gridText, { color: colors.text }]}>Allowance</Text>
          </TouchableOpacity>

          {/* Chores */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(parent)/chores')}>
            <Ionicons name="checkmark-circle-outline" size={50} color={colors.secondary} />
            <Text style={[styles.gridText, { color: colors.text }]}>Chores</Text>
          </TouchableOpacity>

          {/* Spending */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(parent)/spending')}>
            <Ionicons name="cart-outline" size={50} color={colors.danger}/>
            <Text style={[styles.gridText, { color: colors.text }]}>Spending</Text>
          </TouchableOpacity>

          {/* Savings */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(parent)/savings')}>
            <Ionicons name="wallet-outline" size={50} color={colors.primary}/>
            <Text style={[styles.gridText, { color: colors.text }]}>Savings</Text>
          </TouchableOpacity>
          
           {/* Learning */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(parent)/learning')}>
            <Ionicons name="book-outline" size={50} color={'#9b59b6'}/>
            <Text style={[styles.gridText, { color: colors.text }]}>Learning</Text>
          </TouchableOpacity>
          
           {/* Transfers */}
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.backgroundStrong }]} onPress={() => navigateTo('/(parent)/transfers')}>
            <Ionicons name="swap-horizontal-outline" size={50} color={'#e67e22'}/>
            <Text style={[styles.gridText, { color: colors.text }]}>Transfers</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button - moved to bottom */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.danger }]} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
    padding: 20, // Padding for scroll content
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  section: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%', // Roughly two columns with space
    aspectRatio: 1, // Make items square
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
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonSmallText: {
      color: Colors.light.backgroundStrong, // White
      fontSize: 14,
      fontWeight: '500',
  },
  logoutButton: {
      width: '80%',
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20, // Add space above logout
  },
  logoutButtonText: {
    color: Colors.light.backgroundStrong, // White
    fontSize: 18,
    fontWeight: '600',
  },
  // Styles for Child Summary Card
  childCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.background, // Light separator
  },
  childInfo: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  childAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 15,
  },
   childAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 15,
      justifyContent: 'center',
      alignItems: 'center',
   },
  childName: {
      fontSize: 18,
      fontWeight: '500',
  },
  childBalance: {
      fontSize: 18,
      fontWeight: 'bold',
  },
  // Adjusted section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default ParentAppScreen; 