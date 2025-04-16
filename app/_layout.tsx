import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/src/contexts/authStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter(); // Get router here
  const segments = useSegments(); // Get segments here
  const { isLoggedIn, userType, checkAuthStatus, isLoading: isLoadingAuth } = useAuthStore(); // Get auth state here
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Call checkAuthStatus only once when the layout mounts (or when checkAuthStatus changes, though it shouldn't)
    // Check auth status on initial load
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (!loaded || isLoadingAuth) {
      // Still loading fonts or checking auth, do nothing regarding splash screen or navigation
      return;
    }

    // Fonts loaded and auth check complete, hide splash screen
    console.log('Fonts loaded and auth check done, hiding splash screen.');
    SplashScreen.hideAsync();

    // --- Navigation Logic ---
    const inAuthGroup = segments[0] === '(auth)';
    console.log('Auth state check in RootLayout:', { isLoggedIn, userType, segments });

    if (isLoggedIn && inAuthGroup) {
      // Logged in but in auth group, redirect
      console.log(`Redirecting logged-in user from auth group to /(${userType})`);
      const targetRoute = userType === 'parent' ? '/(parent)' : userType === 'child' ? '/(child)' : '/(auth)'; // Fallback just in case
      router.replace(targetRoute as any);
    } else if (!isLoggedIn && !inAuthGroup) {
      // Not logged in and outside auth group, redirect to auth
      // Make sure we are not already navigating to auth (e.g. initial load)
      if (segments.length > 0) { // Only redirect if not at the root
         console.log('User not logged in and outside auth group, redirecting to /(auth)');
         router.replace('/(auth)');
      }
    } else {
       // Covers:
       // - Logged in and outside auth group (correct place)
       // - Not logged in and inside auth group (correct place)
       console.log('User is in the correct route group based on auth state.');
    }
    // --- End Navigation Logic ---

  // Depend on all relevant states for navigation and splash screen
  }, [loaded, isLoadingAuth, isLoggedIn, userType, segments, router]);


  // Keep showing splash screen (or null) while fonts or auth status are loading
  if (!loaded || isLoadingAuth) {
    return null; // Return null to prevent rendering anything until ready
  }

  // Fonts loaded and initial auth check complete, render the layout
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* AuthNavigator removed, logic is now in RootLayout's useEffect */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(child)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
