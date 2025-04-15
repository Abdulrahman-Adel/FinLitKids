import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView,
    ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import stores
import { useSavingsStore, SavingsGoal } from '../../src/contexts/savingsStore';
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore';
import { TextInput } from 'react-native-gesture-handler'; // Import TextInput

// Parent Goal Card Component 
const ParentGoalCard = ({ goal, onContribute }: { goal: SavingsGoal, onContribute: (goalId: string, amount: number) => void }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const isComplete = goal.currentAmount >= goal.targetAmount;
    const [contributionAmount, setContributionAmount] = useState('');

    const handlePressContribute = () => {
        const amountNum = parseFloat(contributionAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a positive amount to contribute.');
            return;
        }
        // Prevent contributing more than needed
        const amountToAddCapped = Math.min(amountNum, goal.targetAmount - goal.currentAmount);
         if (amountToAddCapped <= 0 && !isComplete) {
             Alert.alert("Goal Reached", "This goal is already fully funded!");
             return;
         }
         if (amountToAddCapped > 0) {
            onContribute(goal.id, amountToAddCapped);
            setContributionAmount(''); // Clear input
         }
    };

    return (
        <View style={styles.goalItemContainer}>
            <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
            <Text style={[styles.goalAmount, { color: colors.placeholder }]}>
                {goal.currentAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} /
                {goal.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </Text>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isComplete ? colors.secondary : colors.primary }]} />
            </View>
             {isComplete ? (
                 <Text style={[styles.completeText, { color: colors.secondary }]}>Reached! 🎉</Text>
             ) : (
                 <View style={styles.contributeContainer}> 
                     <TextInput
                        style={[styles.inputSmall, { backgroundColor: colors.background, color: colors.text }]}
                        placeholder="Add Amount"
                        keyboardType="numeric"
                        value={contributionAmount}
                        onChangeText={setContributionAmount}
                        placeholderTextColor={colors.placeholder}
                     />
                      <TouchableOpacity 
                        style={[styles.buttonSmall, { backgroundColor: colors.primary }]} 
                        onPress={handlePressContribute}
                       >
                         <Text style={styles.buttonSmallText}>Contribute</Text>
                     </TouchableOpacity>
                 </View>
             )}
        </View>
    );
}

const ParentSavingsScreen: React.FC = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Get data from stores
    const children = useProfileStore((state) => state.children);
    const allGoals = useSavingsStore((state) => state.goals);
    const getChildById = useProfileStore((state) => state.getChildById);
    const { updateGoalAmount } = useSavingsStore(); // Get necessary action

    // Group goals by child
    const goalsByChild = allGoals.reduce((acc, goal) => {
        if (!acc[goal.childId]) {
            acc[goal.childId] = [];
        }
        acc[goal.childId].push(goal);
        return acc;
    }, {} as Record<string, SavingsGoal[]>);

    // Helper function to get child name
    const getChildName = (childId: string): string => {
        const child = getChildById(childId);
        return child ? child.name : 'Unknown Child';
    }
    
    const handleParentContribute = (goalId: string, amount: number) => {
        const goal = allGoals.find(g => g.id === goalId);
        if (!goal) return;

        console.log(`Parent contributing ${amount} to goal ${goalId} (${goal.name})`);
        // MOCK: In a real app, deduct from parent account/wallet
        try {
            updateGoalAmount(goalId, amount);
            Alert.alert('Contribution Added', `$${amount.toFixed(2)} added to ${goal.name}.`);
        } catch (error) {
            console.error("Error contributing to goal:", error);
            Alert.alert("Error", "Could not add contribution.");
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Children Savings Goals',
                    headerStyle: { backgroundColor: colors.backgroundStrong },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                 <Text style={[styles.screenSubtitle, { color: colors.placeholder }]}>
                     Monitor your children's savings progress.
                 </Text>

                 {children.length === 0 && (
                     <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>
                         No children found.
                     </Text>
                )} 

                 {Object.keys(goalsByChild).length === 0 && children.length > 0 && (
                     <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>
                         No savings goals set up yet.
                     </Text>
                )}

                 {/* Iterate through children who have goals */}
                 {Object.entries(goalsByChild).map(([childId, childGoals]) => (
                    <View key={childId} style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{getChildName(childId)}'s Goals</Text>
                        {childGoals.map(goal => (
                            <ParentGoalCard key={goal.id} goal={goal} onContribute={handleParentContribute} />
                        ))}
                         {/* Optionally Add button to create goal FOR child? */}
                         {/* <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('New Goal', `Add goal for ${getChildName(childId)} (Not implemented).`)}>
                             <Text style={[styles.editButtonText, { color: colors.primary }]}>+ Add Goal</Text>
                         </TouchableOpacity> */} 
                    </View>
                ))}

                 {/* Optionally show children with NO goals */} 
                 {children.filter(c => !goalsByChild[c.id]).map(child => (
                    <View key={child.id} style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
                         <Text style={[styles.cardTitle, { color: colors.text }]}>{child.name}'s Goals</Text>
                         <Text style={{ color: colors.placeholder, marginTop: 10 }}>No savings goals set up yet.</Text>
                           {/* <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('New Goal', `Add goal for ${child.name} (Not implemented).`)}>
                               <Text style={[styles.editButtonText, { color: colors.primary }]}>+ Add Goal</Text>
                           </TouchableOpacity> */} 
                    </View>
                ))} 

            </ScrollView>
        </SafeAreaView>
    );
};

// Styles
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
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.background,
        paddingBottom: 10,
    },
    goalItemContainer: {
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.background + '80', // Lighter separator for items
    },
    goalName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    goalAmount: {
        fontSize: 14,
        marginBottom: 8,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.light.background, 
        overflow: 'hidden',
        marginBottom: 5,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    completeText: {
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 4,
        fontStyle: 'italic',
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
    // Styles for contribution section
    contributeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    inputSmall: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginRight: 10,
        fontSize: 14,
        borderColor: Colors.light.placeholder, 
    },
    buttonSmall: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        height: 40,
        justifyContent: 'center',
    },
    buttonSmallText: {
        color: Colors.light.backgroundStrong,
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ParentSavingsScreen; 