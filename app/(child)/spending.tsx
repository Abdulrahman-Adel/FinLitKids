import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTransactionStore, Transaction } from '../../src/contexts/transactionStore';
import { Ionicons } from '@expo/vector-icons';

// Transaction Item Component - Simplified (no delete)
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const formattedDate = new Date(transaction.date).toLocaleDateString();
    const formattedAmount = transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    // Determine color based on amount (positive or negative)
    const amountColor = transaction.amount < 0 ? colors.danger : colors.secondary;

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{transaction.description}</Text>
                 <Text style={[styles.amountText, { color: amountColor }]}>
                    {transaction.amount < 0 ? '-' : '+'}{formattedAmount.replace('-','')} 
                 </Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={[styles.dateText, { color: colors.placeholder }]}>{formattedDate}</Text>
                {/* Display transaction type (optional) */}
                <Text style={[styles.typeText, { color: colors.placeholder }]}>Type: {transaction.type.replace('_', ' ')}</Text> 
            </View>
        </View>
    );
}

const ChildSpendingScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get state and actions from Transaction Store
  const { transactions, fetchTransactions, recordSpending, isLoading, error } = useTransactionStore();

  // State for the modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch transactions on mount
  useEffect(() => {
    console.log('Child spending screen mounted, fetching transactions...');
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenModal = () => {
    setDescription('');
    setAmount('');
    setIsSubmitting(false);
    setIsModalVisible(true);
  }

  const handleRecordSpending = async () => {
    const amountNum = parseFloat(amount);
    if (!description.trim()) {
        Alert.alert('Missing Description', 'Please describe what you spent money on.');
        return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a positive amount.');
        return;
    }

    setIsSubmitting(true);
    const newTransaction = await recordSpending({ description: description.trim(), amount: amountNum });
    setIsSubmitting(false);

    if (newTransaction) {
        Alert.alert('Success', 'Spending recorded!');
        setIsModalVisible(false); // Close modal on success
        // Transaction list updates automatically via store state
    } else {
        // Error alert is handled within the store action, but keep modal open
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'My Transactions',
          headerStyle: { backgroundColor: colors.backgroundStrong },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
              <TouchableOpacity onPress={handleOpenModal} style={{ marginRight: 15 }}>
                  <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
              </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>
            View your earnings and spending history.
        </Text>
        
         {/* Display global error */} 
         {error && !isLoading && (
             <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
         )}

        {/* Loading State */} 
        {isLoading && transactions.length === 0 && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        )}

        {/* Empty State */} 
        {!isLoading && !error && transactions.length === 0 && (
            <Text style={styles.placeholderText}>No transactions recorded yet.</Text>
        )}

        {/* Transaction List */} 
        {!isLoading && transactions.length > 0 && (
            transactions.map(tx => (
                <TransactionItem key={tx.id} transaction={tx} />
            ))
        )}
      </ScrollView>

      {/* Record Spending Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          if (!isSubmitting) {
             setIsModalVisible(!isModalVisible);
          }
        }}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.backgroundStrong }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Record Spending</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.placeholder }]}
              placeholder="Description (e.g., Comic book)"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={colors.placeholder}
              editable={!isSubmitting}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.placeholder }]}
              placeholder="Amount (e.g., 4.99)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor={colors.placeholder}
              editable={!isSubmitting}
            />

             {/* Submit Button */} 
            <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: isSubmitting ? colors.placeholder : colors.primary }]} 
                onPress={handleRecordSpending}
                disabled={isSubmitting}
            > 
                {isSubmitting ? (
                    <ActivityIndicator color={colors.backgroundStrong} />
                 ) : (
                    <Text style={styles.modalButtonText}>Record</Text>
                 )} 
            </TouchableOpacity>

            {/* Cancel Button */} 
             <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.background, marginTop: 10 }]} 
                onPress={() => setIsModalVisible(false)}
                disabled={isSubmitting}
            > 
                 <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
             </TouchableOpacity>

          </View>
        </View>
      </Modal>

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
  errorText: {
       padding: 15,
       textAlign: 'center',
       fontSize: 15,
       fontWeight: '500',
       color: Colors.light.error,
       marginBottom: 10,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  typeText: {
      fontSize: 13,
      fontStyle: 'italic',
      textTransform: 'capitalize',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 25,
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15, 
    paddingHorizontal: 20,
    fontSize: 17,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: Colors.light.backgroundStrong,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ChildSpendingScreen; 