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

// This component handles navigation based on auth state
function AuthNavigator() {
  const { isLoggedIn, userType } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const isLoadingAuth = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    console.log('Auth state changed:', { isLoggedIn, userType, segments });

    // Add a check to prevent navigation loops if still loading auth status
    if (isLoadingAuth) {
      console.log('Auth status is loading, delaying navigation check.');
      return; 
    }

    if (isLoggedIn && !inAuthGroup) {
      // Already logged in and outside auth group
      console.log('User is logged in and outside auth group, no redirect needed from root.');
    } else if (isLoggedIn && inAuthGroup) {
      // Logged in but still in auth group, redirect
      console.log(`Redirecting logged-in user from auth group to /(${userType})`);
      const targetRoute = userType === 'parent' ? '/(parent)' : userType === 'child' ? '/(child)' : '/(auth)';
      router.replace(targetRoute as any);
    } else if (!isLoggedIn && !inAuthGroup) {
      // Not logged in and outside auth group, redirect to auth
      console.log('User not logged in and outside auth group, redirecting to /(auth)');
      router.replace('/(auth)');
    } else if (!isLoggedIn && inAuthGroup) {
      // Not logged in and in auth group, stay put
      console.log('User not logged in and in auth group, no redirect needed.');
    }

  // Depend on isLoading as well to re-run check after loading finishes
  }, [isLoggedIn, userType, segments, router, isLoadingAuth]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Call checkAuthStatus only once when the layout mounts
    console.log('RootLayout mounted, checking auth status...');
    checkAuthStatus();
  }, [checkAuthStatus]); // Dependency array ensures it runs once

  useEffect(() => {
    // Hide splash screen only when fonts are loaded AND auth check is done
    if (loaded && !isLoadingAuth) {
       console.log('Fonts loaded and auth check done, hiding splash screen.');
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoadingAuth]);

  // Keep showing splash screen (or null) while fonts or auth status are loading
  if (!loaded || isLoadingAuth) {
    return null;
  }

  // Fonts loaded and initial auth check complete, render the layout
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthNavigator />
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
