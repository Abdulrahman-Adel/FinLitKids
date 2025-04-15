import React from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity, Image // Import Image
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Placeholder component for a Learning Module Card
const ModuleCard = ({ title, description, imagePlaceholder }: { title: string, description: string, imagePlaceholder: string }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    return (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.backgroundStrong }]} 
            onPress={() => Alert.alert('View Module', `Viewing ${title} (Not implemented)`)}
        >
            {/* Placeholder for an image */}
            <View style={styles.imagePlaceholder}>
                 <Text style={{fontSize: 30}}>{imagePlaceholder}</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.cardBody, { color: colors.placeholder }]}>{description}</Text>
        </TouchableOpacity>
    );
}

const LearningScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Mock data
  const modules = [
      { id: 'l1', title: 'What is Money?', description: 'Learn the basics of currency.', imagePlaceholder: '💰' },
      { id: 'l2', title: 'Saving vs Spending', description: 'Understand the difference and importance.', imagePlaceholder: '🏦' },
      { id: 'l3', title: 'Needs vs Wants', description: 'Making smart choices with money.', imagePlaceholder: '🤔' },
  ];

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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>Browse educational content for kids.</Text>
        
        <View style={styles.gridContainer}> 
            {modules.map(module => (
                <ModuleCard 
                    key={module.id} 
                    title={module.title}
                    description={module.description}
                    imagePlaceholder={module.imagePlaceholder}
                />
            ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 15, // Adjust padding
  },
  screenSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20, // Adjust margin
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%', // Two columns
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden', // Ensure image corners are rounded if using Image
  },
  imagePlaceholder: {
      height: 100,
      backgroundColor: Colors.light.background, // Light gray background
      justifyContent: 'center',
      alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginHorizontal: 10,
  },
  cardBody: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 10,
     marginHorizontal: 10,
  },
});

export default LearningScreen; 