import React from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity 
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Re-use TransactionItem component structure (could be moved to shared components later)
const TransactionItem = ({ description, amount, date }: { description: string, amount: number, date: string }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    return (
        <View style={styles.transactionItem}>
             <Text style={[styles.transactionDesc, { color: colors.text }]}>{description}</Text>
             <View>
                <Text style={[styles.transactionAmount, { color: amount < 0 ? colors.danger : colors.secondary }]}>
                   {amount < 0 ? '-' : '+'}${Math.abs(amount).toFixed(2)} 
                </Text>
                 <Text style={[styles.transactionDate, { color: colors.placeholder }]}>{date}</Text>
             </View>
        </View>
    )
}

const TransfersScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Mock data
  const recentTransfers = [
      { id: 'tr1', desc: 'Transfer to Alex', amount: 10.00, date: 'Today' },
      { id: 'tr2', desc: 'Transfer to Jamie', amount: 15.00, date: 'Yesterday' },
      { id: 'tr3', desc: 'Allowance Top-up - Alex', amount: 5.00, date: '3 days ago' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Transfers & History',
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>Initiate transfers and view history.</Text>

        <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={() => Alert.alert('New Transfer', 'Navigate to new transfer screen (Not implemented)')}
        >
           <Text style={styles.buttonText}>Initiate New Transfer</Text>
         </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>Recent Transfers</Text>
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong, paddingVertical: 10 }]}>
            {recentTransfers.map(tx => (
                <TransactionItem 
                    key={tx.id} 
                    description={tx.desc}
                    amount={tx.amount}
                    date={tx.date}
                />
            ))}
             {/* Add button to view full history if needed */}
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
    padding: 20,
  },
   screenSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
   button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: Colors.light.backgroundStrong, // White
    fontSize: 18,
    fontWeight: '600',
  },
   sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  card: {
    width: '100%',
    paddingHorizontal: 20, // Horizontal padding only for list container
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
   // Transaction Item Styles (Copied from SpendingScreen)
   transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.background,
  },
  transactionDesc: {
      fontSize: 16,
  },
  transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'right',
  },
   transactionDate: {
      fontSize: 12,
      textAlign: 'right',
  },
});

export default TransfersScreen; 