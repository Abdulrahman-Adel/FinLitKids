import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView,
    ScrollView, TouchableOpacity, Alert, TextInput
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
// Import stores
import { useSavingsStore, SavingsGoal } from '../../src/contexts/savingsStore';
import { useAuthStore } from '../../src/contexts/authStore';
import { useProfileStore } from '../../src/contexts/profileStore';

// Goal Card Component (Updated)
const GoalCard = ({ goal, onAddToGoal, onDeleteGoal }: { 
    goal: SavingsGoal, 
    onAddToGoal: (goalId: string, amount: number) => void,
    onDeleteGoal: (goal: SavingsGoal) => void
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const isComplete = goal.currentAmount >= goal.targetAmount;
    const [addAmount, setAddAmount] = useState(''); // State for input

    const handleAddPress = () => {
        const amountNum = parseFloat(addAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert("Invalid Amount", "Please enter a positive number to add.");
            return;
        }
        onAddToGoal(goal.id, amountNum);
        setAddAmount(''); // Clear input after adding
    }

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{goal.name}</Text>
            <Text style={[styles.amountText, { color: colors.placeholder }]}>
                {goal.currentAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} /
                {goal.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </Text>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isComplete ? colors.secondary : colors.primary }]} />
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
                    />
                    <TouchableOpacity
                        style={[styles.addButtonSmall, { backgroundColor: colors.primary }]}
                        onPress={handleAddPress}
                    >
                        <Text style={styles.addButtonTextSmall}>Add</Text>
                    </TouchableOpacity>
                </View>
            )}
            {/* Delete Button */}
            <TouchableOpacity onPress={() => onDeleteGoal(goal)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color={colors.placeholder} />
            </TouchableOpacity>
        </View>
    );
}

const ChildSavingsScreen: React.FC = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Get state and actions
    const loggedInUserId = useAuthStore((state) => state.loggedInUserId);
    const { getGoalsByChild, updateGoalAmount, addGoal, deleteGoal } = useSavingsStore((state) => ({ 
        getGoalsByChild: state.getGoalsByChild,
        updateGoalAmount: state.updateGoalAmount,
        addGoal: state.addGoal,
        deleteGoal: state.deleteGoal
    }));
     const { getChildById, updateChildBalance } = useProfileStore((state) => ({ 
        getChildById: state.getChildById, 
        updateChildBalance: state.updateChildBalance 
    }));

    // Get child data and goals
    const loggedInChild = loggedInUserId ? getChildById(loggedInUserId) : null;
    const savingsGoals = loggedInUserId ? getGoalsByChild(loggedInUserId) : [];

    const handleAddToGoal = (goalId: string, amount: number) => {
         if (!loggedInUserId || !loggedInChild) return;

        // Check if enough balance
        if (loggedInChild.balance < amount) {
            Alert.alert("Oops!", "Not enough balance to add to this goal.");
            return;
        }
        
        // Check if goal is already complete or adding exceeds target
        const goal = savingsGoals.find(g => g.id === goalId);
        if (!goal || goal.currentAmount >= goal.targetAmount) {
             Alert.alert("Goal Complete", "This goal is already reached!");
             return;
        }
        const amountToAddCapped = Math.min(amount, goal.targetAmount - goal.currentAmount);
        if (amountToAddCapped <= 0) return; 

        try {
            updateChildBalance(loggedInUserId, -amountToAddCapped); 
            updateGoalAmount(goalId, amountToAddCapped); 
            Alert.alert("Success", `${amountToAddCapped.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} added to "${goal.name}"!`);
        } catch (error) {
            console.error("Error adding to goal:", error);
            Alert.alert("Error", "Could not add funds to the goal.");
        }
    };

    const handleAddNewGoal = () => {
        // Navigate to the form screen
        router.push('/(child)/add-savings-goal');
    };

    const handleDeleteGoal = (goalToDelete: SavingsGoal) => {
        Alert.alert(
            'Delete Goal',
            `Are you sure you want to delete the goal "${goalToDelete.name}"? The currently saved amount ($${goalToDelete.currentAmount}) will be returned to your balance.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete & Refund',
                    style: 'destructive',
                    onPress: () => {
                        if (loggedInUserId) {
                            const deleted = deleteGoal(goalToDelete.id);
                            if (deleted) {
                                updateChildBalance(loggedInUserId, deleted.currentAmount); // Add current amount back
                                Alert.alert('Goal Deleted', 'Savings goal removed and balance updated.');
                            }
                        }
                    }
                }
            ]
        );
    }

    if (!loggedInChild) {
        return (
            <SafeAreaView style={styles.safeArea}>
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
                    title: 'My Savings Goals',
                    headerStyle: { backgroundColor: colors.backgroundStrong },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>Save up for things you want!</Text>
                
                <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={handleAddNewGoal}>
                    <Text style={styles.createButtonText}>+ Add New Goal</Text>
                </TouchableOpacity>

                {savingsGoals.length === 0 ? (
                    <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>No savings goals set up yet.</Text>
                ) : (
                    savingsGoals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onAddToGoal={handleAddToGoal} onDeleteGoal={handleDeleteGoal} />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// --- Styles --- 
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
        flex: 1, 
        height: 45,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginRight: 10,
        backgroundColor: Colors.light.background, // Ensure background color is set
        color: Colors.light.text, // Ensure text color is set
        borderColor: Colors.light.placeholder // Ensure border color is set
    },
    addButtonSmall: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        height: 45, 
        justifyContent: 'center',
        backgroundColor: Colors.light.primary // Ensure background color is set
    },
    addButtonTextSmall: {
        color: Colors.light.backgroundStrong,
        fontSize: 14,
        fontWeight: '600',
    },
    // Style for delete button on card
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
    },
});

export default ChildSavingsScreen; 