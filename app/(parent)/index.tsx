import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, // Import ScrollView
  SafeAreaView, // Import SafeAreaView
  Button, // Import Button
  Alert, // Import Alert
  Image, // Import Image
  Animated, // Import Animated
  ActivityIndicator // Add ActivityIndicator
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

// Child Summary Card Component - Updated with Animation & Initials Placeholder
const ChildSummaryCard = ({ child }: { child: ChildProfile }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const formattedBalance = child.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const pressAnim = React.useRef(new Animated.Value(1)).current; // Animation value

  // Helper function to get initials
  const getInitials = (name: string): string => {
      if (!name) return '?';
      const names = name.trim().split(' ');
      if (names.length === 1) return names[0][0].toUpperCase();
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  const handlePress = () => {
      // Later: Navigate to a detailed child view, e.g., router.push(`/(parent)/child/${child.id}`)
      Alert.alert('View Child', `Selected ${child.name} (detail view not implemented)`);
  }

  const onPressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.98, // Scale down slightly
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1, // Scale back to normal
      friction: 5, // Add some friction for bounce
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    // Use Animated.TouchableOpacity
    <Animated.TouchableOpacity 
        onPress={handlePress} 
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
            styles.childCard, 
            { 
                transform: [{ scale: pressAnim }] // Apply scale animation
            }
        ]}
    >
      <View style={styles.childInfo}>
          {/* Use avatar or placeholder */}
          {child.avatarUrl ? (
              <Image source={{ uri: child.avatarUrl }} style={styles.childAvatar} />
          ) : (
              // Use initials placeholder
              <View style={[styles.childAvatarPlaceholder, {backgroundColor: colors.secondary}]}>
                {/* <Ionicons name="person-outline" size={24} color={colors.backgroundStrong} /> */}
                <Text style={styles.initialsText}>{getInitials(child.name)}</Text>
              </View>
          )}
          <Text style={[styles.childName, { color: colors.text }]}>{child.name}</Text>
      </View>
      <Text style={[styles.childBalance, { color: colors.secondary }]}>{formattedBalance}</Text>
    </Animated.TouchableOpacity>
  );
};

const ParentAppScreen: React.FC = () => {
  // Remove useNavigation hook
  // const navigation = useNavigation<ParentAppScreenNavigationProp>();

  const logout = useAuthStore((state) => state.logout); // Get logout action
  // Get children, fetch action, loading state, and error from profile store
  const { children, fetchChildren, isLoading, error } = useProfileStore((state) => ({
      children: state.children,
      fetchChildren: state.fetchChildren,
      isLoading: state.isLoading,
      error: state.error,
  }));
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Fetch children when the component mounts
  useEffect(() => {
      console.log('Parent dashboard mounted, fetching children...');
      fetchChildren();
  }, [fetchChildren]); // Dependency array ensures it runs once on mount

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

  // Helper to render children list or loading/error state
  const renderChildrenList = () => {
      if (isLoading) {
          return <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />;
      }
      if (error) {
          return <Text style={[styles.errorText, { color: colors.error }]}>Error loading children: {error}</Text>;
      }
      if (children.length === 0) {
          return <Text style={{ color: colors.placeholder, marginTop: 10 }}>No children added yet. Go to "Manage Profiles" to add one.</Text>;
      }
      return children.map(child => <ChildSummaryCard key={child.id} child={child} />);
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
          {/* Render children list using helper */}
          {renderChildrenList()}
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
  initialsText: { // Style for the initials
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.light.backgroundStrong, // White text on colored background
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
  loadingIndicator: {
      marginTop: 20,
      marginBottom: 10,
  },
  errorText: {
      marginTop: 15,
      marginBottom: 10,
      fontSize: 15,
      textAlign: 'center',
      fontWeight: '500',
  },
});

export default ParentAppScreen; 