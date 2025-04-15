import React from 'react';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChildAppLayout() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
        screenOptions={{
            // Common header styles for child screens
            headerStyle: { backgroundColor: colors.backgroundStrong }, 
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
        }}
    >
      <Stack.Screen 
        name="index" 
        options={{
           title: 'Dashboard', 
           headerRight: () => (
            <TouchableOpacity onPress={() => router.push({ pathname: '/(child)/profile' as any })} style={{ marginRight: 15 }}>
                <Ionicons name="person-circle-outline" size={28} color={colors.text} />
            </TouchableOpacity>
           ),
        }}
      />
      <Stack.Screen name="profile" options={{ title: 'My Profile' }}/>
      <Stack.Screen name="chores" />
      <Stack.Screen name="spending" />
      <Stack.Screen name="add-spending" />
      <Stack.Screen name="savings" />
      <Stack.Screen name="add-savings-goal" />
      <Stack.Screen name="learning" />
      {/* Add other child screens here later */}
    </Stack>
  );
} 