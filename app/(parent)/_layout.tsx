import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ParentAppLayout() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
        screenOptions={{
             headerStyle: { backgroundColor: colors.primary },
             headerTintColor: colors.backgroundStrong, // White text for headers
             headerTitleStyle: { fontWeight: 'bold' },
         }}
    >
      <Stack.Screen name="index" options={{ title: 'Parent Dashboard' }} />
      <Stack.Screen name="manage-child-profiles" options={{ title: 'Manage Children' }}/>
      <Stack.Screen name="allowance" options={{ title: 'Allowance' }} />
      <Stack.Screen name="chores" options={{ title: 'Chores' }} />
      <Stack.Screen name="create-edit-chore" options={{ title: 'Create/Edit Chore' }}/>
      <Stack.Screen name="spending" options={{ title: 'Spending Controls' }} />
      <Stack.Screen name="savings" options={{ title: 'Savings Goals' }} />
      <Stack.Screen name="learning" options={{ title: 'Learning Modules' }} />
      <Stack.Screen name="transfers" options={{ title: 'Transfers' }} />
      {/* Add other parent-specific screens here */}
    </Stack>
  );
} 