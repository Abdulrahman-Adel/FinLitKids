import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, Button, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import correct stores
import { useTransactionStore, Transaction } from '../../src/contexts/transactionStore';
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore';

// Transaction Item Component (Reusing/Adapting Child Version)
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const formattedDate = new Date(transaction.date).toLocaleDateString();
    const formattedAmount = transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const amountColor = transaction.amount < 0 ? colors.danger : colors.secondary;

    return (
        <View style={styles.transactionItem}>
            <View style={styles.transactionDetails}> 
                <Text style={[styles.transactionDesc, { color: colors.text }]}>{transaction.description}</Text>
                 {/* Show child name if available (parent view) */} 
                 {transaction.child_name && ( 
                     <Text style={[styles.transactionChild, { color: colors.placeholder }]}>Child: {transaction.child_name}</Text>
                 )}
                 <Text style={[styles.transactionDate, { color: colors.placeholder }]}>{formattedDate}</Text>
            </View>
            <View style={styles.transactionAmountContainer}>
                 <Text style={[styles.transactionAmount, { color: amountColor }]}>
                    {transaction.amount < 0 ? '-' : '+'}{formattedAmount.replace('-','')} 
                 </Text>
                  {/* Optional: Show type */} 
                 <Text style={[styles.transactionType, { color: colors.placeholder }]}>({transaction.type.replace('_', ' ')})</Text>
            </View>
        </View>
    );
}

const ParentSpendingScreen: React.FC = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Get data from stores
    const { transactions, fetchTransactions, isLoading, error } = useTransactionStore();
    const { children, fetchChildren } = useProfileStore(); // Only need children list if grouping or showing empty states

    // Fetch data on mount
     useEffect(() => {
        console.log('Parent transactions screen mounted, fetching data...');
        fetchTransactions(); // Fetches all transactions for the parent
        if (children.length === 0) {
            fetchChildren(); // Fetch children only if needed (e.g., for displaying empty states)
        }
    }, [fetchTransactions, fetchChildren, children.length]);

     // Group transactions by child using data from transactions
     const transactionsByChild = transactions.reduce((acc, tx) => {
         const childId = tx.child_id || 'unknown'; // Group unknown/unassigned if needed
         if (!acc[childId]) {
             acc[childId] = { 
                 childName: tx.child_name || 'Unknown Child', // Use name from transaction
                 transactions: [] 
             };
         }
         acc[childId].transactions.push(tx);
         return acc;
     }, {} as Record<string, { childName: string; transactions: Transaction[] }>);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'All Transactions',
                    headerStyle: { backgroundColor: colors.backgroundStrong },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                 <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>
                     Review recent transaction activity for all children.
                 </Text>

                {/* Loading State */} 
                {isLoading && transactions.length === 0 && (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                )}

                {/* Error State */} 
                {error && !isLoading && (
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                )}

                {/* Empty State */} 
                {!isLoading && !error && transactions.length === 0 && (
                    <Text style={styles.placeholderText}>No transactions recorded yet for any child.</Text>
                )}

                 {/* Iterate through children who have transactions */}
                 {Object.entries(transactionsByChild).map(([childId, { childName, transactions: childTransactions }]) => (
                    <View key={childId} style={[styles.childSection, { backgroundColor: colors.backgroundStrong }]}>
                         <Text style={[styles.sectionTitle, { color: colors.text }]}>{childName}</Text> 
                        {childTransactions.map(tx => (
                            <TransactionItem key={tx.id} transaction={tx} />
                        ))}
                    </View>
                ))}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 40,
  },
   loadingContainer: { 
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
   },
   errorText: {
       paddingVertical: 30,
       textAlign: 'center',
       fontSize: 16,
       fontWeight: '500',
       color: Colors.light.error,
   },
   placeholderText: {
       textAlign: 'center',
       paddingVertical: 50,
       fontSize: 16,
       color: Colors.light.placeholder,
   },
  screenSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  childSection: { 
    width: '100%',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: Colors.light.backgroundStrong,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden', 
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.background, 
  },
  transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 15, 
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.background + '80',
  },
   transactionDetails: {
       flex: 1,
       marginRight: 10,
   },
   transactionAmountContainer: {
       alignItems: 'flex-end',
   },
  transactionDesc: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 3,
  },
  transactionChild: {
      fontSize: 13,
      fontStyle: 'italic',
      marginBottom: 4,
  },
  transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
  },
   transactionDate: {
      fontSize: 12,
      color: Colors.light.placeholder,
  },
   transactionType: {
      fontSize: 12,
      color: Colors.light.placeholder,
      fontStyle: 'italic',
      marginTop: 2,
      textTransform: 'capitalize',
  },
});

export default ParentSpendingScreen; 