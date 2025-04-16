import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

const ParentLearningScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
            headerShown: true, 
            title: 'Learning Modules',
            headerStyle: { backgroundColor: colors.backgroundStrong },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <View style={styles.container}>
         <Ionicons name="library-outline" size={60} color={colors.placeholder} style={{ marginBottom: 20 }} />
        <Text style={[styles.placeholderText, { color: colors.text }]}>Learning Module Management</Text>
        <Text style={[styles.comingSoonText, { color: colors.placeholder }]}>Coming Soon!</Text>
        <Text style={[styles.descriptionText, { color: colors.placeholder }]}>Assign lessons and track progress.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ParentLearningScreen; 