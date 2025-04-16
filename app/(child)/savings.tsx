import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView,
    ScrollView, TouchableOpacity, Alert, TextInput,
    ActivityIndicator
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
// Import correct stores
import { useGoalStore, SavingsGoal } from '../../src/contexts/goalStore'; 
import { useAuthStore } from '../../src/contexts/authStore';
import { useDashboardStore } from '../../src/contexts/dashboardStore'; // For refreshing balance

// Goal Card Component - Updated for async actions and local loading
const GoalCard = ({ goal, onAddToGoal, onDeleteGoal }: { 
    goal: SavingsGoal, 
    onAddToGoal: (goalId: string, amount: number) => Promise<boolean>, // Make async
    onDeleteGoal: (goal: SavingsGoal) => Promise<boolean> // Make async
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
    const isComplete = goal.current_amount >= goal.target_amount;
    const [addAmount, setAddAmount] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAddPress = async () => {
        const amountNum = parseFloat(addAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert("Invalid Amount", "Please enter a positive number to add.");
            return;
        }
        setIsAdding(true);
        const success = await onAddToGoal(goal.id, amountNum);
        setIsAdding(false);
        if (success) {
            setAddAmount(''); // Clear input only on success
        } else {
            // Error Alert is handled by the store/parent component
        }
    }
    
    const handleDeletePress = () => {
         // Show confirmation Alert first
         Alert.alert(
            'Delete Goal',
            `Are you sure you want to delete the goal "${goal.name}"? The currently saved amount ($${goal.current_amount.toFixed(2)}) will be returned to your balance.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete & Refund',
                    style: 'destructive',
                    onPress: async () => {
                        if (isDeleting) return;
                        setIsDeleting(true);
                        await onDeleteGoal(goal);
                        setIsDeleting(false); // Reset loading state regardless of success/fail (error handled in store)
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{goal.name}</Text>
            <Text style={[styles.amountText, { color: colors.placeholder }]}>
                {goal.current_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} /
                {goal.target_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </Text>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%`, backgroundColor: isComplete ? colors.secondary : colors.primary }]} />
            </View>
            {isComplete ? (
                <Text style={[styles.completeText, { color: colors.secondary }]}>Goal Reached! 🎉</Text>
            ) : (
                <View style={styles.addContributionArea}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.placeholder }]}
                        placeholder="Add Amount"
                        keyboardType="numeric"
                        value={addAmount}
                        onChangeText={setAddAmount}
                        placeholderTextColor={colors.placeholder}
                        editable={!isAdding}
                    />
                    <TouchableOpacity
                        style={[styles.addButtonSmall, { backgroundColor: isAdding ? colors.placeholder : colors.primary }]}
                        onPress={handleAddPress}
                        disabled={isAdding}
                    >
                       {isAdding ? (
                            <ActivityIndicator size="small" color={colors.backgroundStrong} />
                        ) : (
                            <Text style={styles.addButtonTextSmall}>Add</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
            {/* Delete Button */}
            <TouchableOpacity onPress={handleDeletePress} style={styles.deleteButton} disabled={isDeleting}>
                 {isDeleting ? (
                     <ActivityIndicator size="small" color={colors.placeholder} />
                 ) : (
                    <Ionicons name="trash-outline" size={20} color={colors.placeholder} />
                 )}
            </TouchableOpacity>
        </View>
    );
}

const ChildSavingsScreen: React.FC = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Get state and actions from Goal Store
    const { goals, fetchGoals, childContributeToGoal, deleteGoal, isLoading, error } = useGoalStore();
    
    // For refreshing balance display after action
    const { fetchDashboardData } = useDashboardStore();

    // Fetch goals on mount
    useEffect(() => {
        console.log('Child savings screen mounted, fetching goals...');
        fetchGoals();
    }, [fetchGoals]);

    const handleAddToGoal = async (goalId: string, amount: number): Promise<boolean> => {
        console.log(`Attempting to add ${amount} to goal ${goalId}`);
        const result = await childContributeToGoal(goalId, { amount });
        if (result) {
            Alert.alert("Success", `${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} added!`);
            fetchDashboardData(); // Refresh dashboard balance
            return true;
        } else {
            // Error alert handled by store/global mechanism (or show local alert if preferred)
            // Alert.alert("Error", useGoalStore.getState().error || "Could not add funds.");
            return false;
        }
    };

    const handleAddNewGoal = () => {
        // Navigate to the form screen
        router.push('/(child)/add-savings-goal');
    };

    const handleDeleteGoal = async (goalToDelete: SavingsGoal): Promise<boolean> => {
        console.log(`Attempting to delete goal ${goalToDelete.id}`);
        const result = await deleteGoal(goalToDelete.id);
        if (result) {
            Alert.alert('Goal Deleted', 'Savings goal removed and balance updated.');
            fetchDashboardData(); // Refresh dashboard balance
            return true;
        } else {
             // Error alert handled by store/global mechanism
            return false;
        }
    }
    
    // Initial loading state
    if (isLoading && goals.length === 0) {
         return (
            <SafeAreaView style={styles.safeArea}>
                 <Stack.Screen options={{ title: 'My Savings Goals' }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'My Savings Goals',
                    headerStyle: { backgroundColor: colors.backgroundStrong },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>Save up for things you want!</Text>
                
                {/* Display global error */}
                {error && !isLoading && (
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                )}
                
                <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={handleAddNewGoal}>
                    <Text style={styles.createButtonText}>+ Add New Goal</Text>
                </TouchableOpacity>

                {goals.length === 0 && !isLoading ? (
                    <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>No savings goals set up yet.</Text>
                ) : (
                    goals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onAddToGoal={handleAddToGoal} onDeleteGoal={handleDeleteGoal} />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// --- Styles --- (Keep existing styles, add errorText if needed)
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
     createButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 25,
        alignSelf: 'center',
    },
    createButtonText: {
        color: Colors.light.backgroundStrong, 
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        width: '100%',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        backgroundColor: Colors.light.backgroundStrong // Ensure background color is set for consistency
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        color: Colors.light.text // Ensure text color is set
    },
    amountText: {
        fontSize: 15,
        marginBottom: 10,
        color: Colors.light.placeholder // Ensure text color is set
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.light.background, 
        overflow: 'hidden', 
        marginBottom: 15,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    completeText: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 5,
        color: Colors.light.secondary // Ensure text color is set
    },
    addContributionArea: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    input: {
        flex: 1, // Allow input to grow
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginRight: 10, // Space between input and button
    },
    addButtonSmall: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    addButtonTextSmall: {
        color: Colors.light.backgroundStrong,
        fontWeight: '600',
    },
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
    },
    errorText: {
        padding: 15,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '500',
        color: Colors.light.error, // Example color
        marginBottom: 10,
    },
});

export default ChildSavingsScreen; 