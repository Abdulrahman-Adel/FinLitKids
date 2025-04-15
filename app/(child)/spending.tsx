import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSpendingStore, SpendingTransaction } from '../../src/contexts/spendingStore';
import { useAuthStore } from '../../src/contexts/authStore';
import { useProfileStore } from '../../src/contexts/profileStore';
import { Ionicons } from '@expo/vector-icons';

// Transaction Item Component (Updated to use SpendingTransaction)
const TransactionItem = ({ transaction, onDelete }: { transaction: SpendingTransaction, onDelete: (tx: SpendingTransaction) => void }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const formattedDate = new Date(transaction.date).toLocaleDateString();
    const formattedAmount = transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{transaction.description}</Text>
                <Text style={[styles.amountText, { color: colors.danger }]}>-{formattedAmount}</Text>
            </View>
            <View style={styles.cardFooter}> 
                <Text style={[styles.dateText, { color: colors.placeholder }]}>{formattedDate}</Text>
                <TouchableOpacity onPress={() => onDelete(transaction)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color={colors.placeholder} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const ChildSpendingScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get state and actions
  const loggedInUserId = useAuthStore((state) => state.loggedInUserId);
  const { getTransactionsByChild, addTransaction, deleteTransaction } = useSpendingStore((state) => ({ 
    getTransactionsByChild: state.getTransactionsByChild, 
    addTransaction: state.addTransaction,
    deleteTransaction: state.deleteTransaction
  }));
  const { getChildById, updateChildBalance } = useProfileStore((state) => ({ 
    getChildById: state.getChildById, 
    updateChildBalance: state.updateChildBalance 
  }));

  // Get child data and transactions
  const loggedInChild = loggedInUserId ? getChildById(loggedInUserId) : null;
  const transactions = loggedInUserId ? getTransactionsByChild(loggedInUserId) : [];

  const handleAddTransaction = () => {
    // Navigate to the form screen
    router.push('/(child)/add-spending'); 
  }

  const handleDeleteTransaction = (txToDelete: SpendingTransaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete the spending for "${txToDelete.description}" ($${txToDelete.amount})? This will refund the amount to your balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete & Refund',
          style: 'destructive',
          onPress: () => {
            if (loggedInUserId) {
              const deleted = deleteTransaction(txToDelete.id);
              if (deleted) {
                updateChildBalance(loggedInUserId, deleted.amount); // Add amount back
                Alert.alert('Deleted', 'Transaction removed and balance updated.');
              }
            }
          }
        }
      ]
    );
  }

  if (!loggedInChild) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'My Spending',
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>Keep track of where your money goes.</Text>
        
        {/* Button to add new transaction - Navigates to form */}
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddTransaction}>
          <Text style={styles.addButtonText}>+ Record New Spending</Text>
        </TouchableOpacity>

        {transactions.length === 0 ? (
          <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>No spending recorded yet.</Text>
        ) : (
          transactions.map(tx => (
            <TransactionItem key={tx.id} transaction={tx} onDelete={handleDeleteTransaction} />
          ))
        )}
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
    paddingBottom: 40,
  },
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
    alignSelf: 'center',
  },
  addButtonText: {
    color: Colors.light.backgroundStrong, 
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1, // Allow title to take available space
    marginRight: 10, // Space before amount
  },
  amountText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    marginTop: 5,
  },
  // Styles for footer and delete button
  cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10, // Add some space above footer
  },
  deleteButton: {
      padding: 5, // Make it easier to press
  },
});

export default ChildSpendingScreen; 