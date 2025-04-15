import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/contexts/authStore'; // Import the auth store

// Remove unused imports related to @react-navigation/native-stack
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../navigation/RootNavigator'; // Adjust path as needed

// Remove navigation prop type definitions
// type AuthLoadingScreenNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   'AuthLoading'
// >;

const AuthLoadingScreen: React.FC = () => {
  // Get state from the store
  const { isLoggedIn, userType } = useAuthStore();

  useEffect(() => {
    // Function to decide where to navigate based on auth state
    const navigateUser = () => {
      if (isLoggedIn) {
        if (userType === 'parent') {
          router.replace('/(parent)' as any);
        } else if (userType === 'child') {
          router.replace('/(child)' as any);
        } else {
          // Handle unexpected state (logged in but no type?)
          console.warn('User is logged in but userType is null/invalid.');
          router.replace('/(auth)/parent-login' as any); // Default to login
        }
      } else {
        // If not logged in, go to Parent Login screen
        router.replace('/(auth)/parent-login' as any);
      }
    };

    // Simulate a small delay (optional, helps visualize loading)
    // You might remove this or keep it depending on UX preference
    // and whether real auth checks take time.
    const timer = setTimeout(() => {
        navigateUser();
    }, 500); // Shorter delay now, just for transition smoothness

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);

    // Old logic without store:
    // const checkAuth = async () => {
    //   const isLoggedIn = false; 
    //   const userType = 'parent';
    //   await new Promise(resolve => setTimeout(resolve, 1500));
    //   ...
    // };
    // checkAuth();

  }, [isLoggedIn, userType]); // Re-run effect if auth state changes

  // Display loading indicator while checking state/navigating
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4a90e2" />
      {/* Optional: Add a loading text if desired */}
      {/* <Text style={styles.text}>Loading...</Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f7', // Match other screen backgrounds
  },
  // text: {
  //   marginTop: 10,
  // },
});

export default AuthLoadingScreen; 