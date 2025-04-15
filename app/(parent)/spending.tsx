import React from 'react';
import { 
  View, Text, StyleSheet, Button, Alert, 
  SafeAreaView, ScrollView, TouchableOpacity 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import stores
import { useSpendingStore, SpendingTransaction } from '../../src/contexts/spendingStore';
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore';

// SpendingLimitCard Component (Keep as is for now, might need props update)
const SpendingLimitCard = ({ child, spentThisPeriod }: { child: ChildProfile, spentThisPeriod: number }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const limit = child.spendingLimit ?? 0; // Default to 0 if not set
    const frequency = child.spendingLimitFrequency ?? 'Weekly'; // Default
    const remaining = limit - spentThisPeriod;
    const progress = limit > 0 ? (spentThisPeriod / limit) * 100 : 0;

    return (
        <View style={[styles.limitCard, { backgroundColor: colors.backgroundStrong }]}> // Use limitCard style
            <Text style={[styles.cardTitle, { color: colors.text }]}>{child.name}'s Spending Limit</Text>
            <Text style={[styles.cardBody, { color: colors.text }]}>Limit: ${limit}/{frequency}</Text>
            <Text style={[styles.cardBody, { color: colors.text }]}>Spent ({frequency}): ${spentThisPeriod.toFixed(2)}</Text>
            {/* Basic Progress Bar Placeholder */}
            <View style={styles.progressBarContainer}>
                 <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%`, backgroundColor: progress > 85 ? colors.danger : colors.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.placeholder }]}>${remaining.toFixed(2)} remaining</Text>
            <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => router.push({ pathname: '/(parent)/set-spending-limit' as any, params: { childId: child.id } })} // Navigate to edit
            >
                <Text style={[styles.editButtonText, { color: colors.primary }]}>Set/Edit Limit</Text>
            </TouchableOpacity>
        </View>
    );
}

// Transaction Item Component (Similar to child's view, but maybe less detail needed?)
const ParentTransactionItem = ({ transaction, childName }: { transaction: SpendingTransaction, childName: string }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const formattedDate = new Date(transaction.date).toLocaleDateString();
    const formattedAmount = transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    return (
        <View style={styles.transactionItem}>
            <View>
                <Text style={[styles.transactionDesc, { color: colors.text }]}>{transaction.description}</Text>
                <Text style={[styles.transactionChild, { color: colors.placeholder }]}>By: {childName}</Text>
            </View>
            <View>
                <Text style={[styles.transactionAmount, { color: colors.danger }]}>-{formattedAmount}</Text>
                <Text style={[styles.transactionDate, { color: colors.placeholder }]}>{formattedDate}</Text>
            </View>
            {/* Maybe add approve/dispute later? */}
        </View>
    );
}

const ParentSpendingScreen: React.FC = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Get data from stores
    const children = useProfileStore((state) => state.children);
    const allTransactions = useSpendingStore((state) => state.transactions);
    const getChildById = useProfileStore((state) => state.getChildById); // Helper to get name

    // --- Helper to calculate spending in a period (Simplified: last 7 days) ---
    const getSpentInPeriod = (childId: string, frequency: 'Weekly' | 'Monthly' = 'Weekly'): number => {
        const now = new Date();
        const periodStart = new Date();
        if (frequency === 'Weekly') {
            periodStart.setDate(now.getDate() - 7); // Approx last 7 days
        } else { // Monthly
            periodStart.setMonth(now.getMonth() - 1); // Approx last month
        }

        return allTransactions
            .filter(tx => tx.childId === childId && new Date(tx.date) >= periodStart)
            .reduce((sum, tx) => sum + tx.amount, 0);
    };
    // -----------------------------------------------------------------------

    const getChildName = (childId: string): string => {
        const child = getChildById(childId);
        return child ? child.name : 'Unknown Child';
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Children Spending',
                    headerStyle: { backgroundColor: colors.backgroundStrong },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>
                    Review recent spending activity and set limits.
                </Text>

                {children.length === 0 && (
                     <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>
                         Add children via Manage Profiles to see spending.
                     </Text>
                )}

                {/* Iterate through all children */}
                {children.map(child => {
                    const childTransactions = allTransactions
                        .filter(tx => tx.childId === child.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    const spentThisPeriod = getSpentInPeriod(child.id, child.spendingLimitFrequency);

                    return (
                        <View key={child.id} style={[styles.childSection, { backgroundColor: colors.backgroundStrong }]}>
                            {/* Spending Limit Card for the child */}
                            <SpendingLimitCard child={child} spentThisPeriod={spentThisPeriod} />
                            
                            {/* Transaction List for the child */}
                            <Text style={[styles.transactionListTitle, { color: colors.text }]}>Recent Transactions</Text>
                            {childTransactions.length === 0 ? (
                                <Text style={styles.noTransactionsText}>No spending recorded yet.</Text>
                            ) : (
                                childTransactions.map(tx => (
                                    <ParentTransactionItem 
                                        key={tx.id} 
                                        transaction={tx} 
                                        childName={child.name} // Pass name directly
                                    />
                                ))
                            )}
                        </View>
                    );
                })}
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
  screenSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  childSection: { // Replaces old card style for grouping
    width: '100%',
    padding: 0, // No padding on the outer container
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden', // Clip child cards
  },
  limitCard: { // Style for the limit card within the section
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.background, 
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10, // Adjusted margin
    // Removed border bottom here, applied to limitCard
  },
  cardBody: {
    fontSize: 16,
    marginBottom: 5,
  },
   progressBarContainer: {
    height: 8,
    width: '100%',
    backgroundColor: Colors.light.background, // Use light gray for track
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
      fontSize: 14,
      marginTop: 5,
      alignSelf: 'flex-end',
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    marginTop: 10,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Transaction Item Styles
   transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20, // Add padding for items within section
      borderBottomWidth: 1,
      borderBottomColor: Colors.light.background + '80', // Lighter separator
  },
  transactionDesc: {
      fontSize: 16,
      fontWeight: '500',
  },
  transactionChild: {
      fontSize: 13,
      fontStyle: 'italic',
      marginTop: 3,
  },
  transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'right',
  },
   transactionDate: {
      fontSize: 12,
      textAlign: 'right',
      marginTop: 3,
  },
   transactionListTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 15,
      marginBottom: 5,
      paddingHorizontal: 20, // Align with transaction padding
  },
   noTransactionsText: {
      color: Colors.light.placeholder,
      textAlign: 'center',
      paddingVertical: 20, 
      paddingHorizontal: 20,
  },
});

export default ParentSpendingScreen; 