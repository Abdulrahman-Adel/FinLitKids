import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView,
    ScrollView, TouchableOpacity, Alert, TextInput,
    ActivityIndicator // Added
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Import correct stores
import { useGoalStore, SavingsGoal } from '../../src/contexts/goalStore';
import { useProfileStore, ChildProfile } from '../../src/contexts/profileStore';
// Remove gesture handler import if not used directly
// import { TextInput } from 'react-native-gesture-handler'; 

// Parent Goal Card Component - Updated for async contribute
const ParentGoalCard = ({ goal, onContribute }: { 
    goal: SavingsGoal, 
    onContribute: (goalId: string, amount: number) => Promise<boolean> // Make async
}) => {
    const [isContributing, setIsContributing] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
    const isComplete = goal.current_amount >= goal.target_amount;
    const [contributionAmount, setContributionAmount] = useState('');

    const handlePressContribute = async () => {
        const amountNum = parseFloat(contributionAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a positive amount to contribute.');
            return;
        }
        // Prevent contributing more than needed (backend also handles this, but good UX check)
        const amountToAddCapped = Math.min(amountNum, goal.target_amount - goal.current_amount);
         if (amountToAddCapped <= 0 && !isComplete) {
             Alert.alert("Goal Reached", "This goal is already fully funded!");
             return;
         }
         if (amountToAddCapped > 0) {
             setIsContributing(true);
            const success = await onContribute(goal.id, amountToAddCapped);
             setIsContributing(false);
            if (success) {
                setContributionAmount(''); // Clear input on success
            } // Error handled by parent
         }
    };

    return (
        <View style={styles.goalItemContainer}>
            <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
            <Text style={[styles.goalAmount, { color: colors.placeholder }]}>
                {goal.current_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} /
                {goal.target_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </Text>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                 <View style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%`, backgroundColor: isComplete ? colors.secondary : colors.primary }]} />
            </View>
             {isComplete ? (
                 <Text style={[styles.completeText, { color: colors.secondary }]}>Reached! 🎉</Text>
             ) : (
                 <View style={styles.contributeContainer}> 
                     <TextInput
                        style={[styles.inputSmall, { backgroundColor: colors.background, color: colors.text, borderColor: colors.placeholder }]}
                        placeholder="Contribute Amt"
                        keyboardType="numeric"
                        value={contributionAmount}
                        onChangeText={setContributionAmount}
                        placeholderTextColor={colors.placeholder}
                        editable={!isContributing}
                     />
                      <TouchableOpacity 
                        style={[styles.buttonSmall, { backgroundColor: isContributing ? colors.placeholder : colors.primary }]} 
                        onPress={handlePressContribute}
                        disabled={isContributing}
                       >
                         {isContributing ? (
                             <ActivityIndicator size="small" color={colors.backgroundStrong} />
                         ) : (
                            <Text style={styles.buttonSmallText}>Add</Text>
                         )} 
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
    const { goals, fetchGoals, parentContributeToGoal, isLoading, error } = useGoalStore();
    const { children, fetchChildren, getChildById } = useProfileStore();

    // Fetch data on mount
    useEffect(() => {
        console.log('Parent savings screen mounted, fetching data...');
        fetchGoals(); // Fetches all goals for parent's children
        if (children.length === 0) {
          fetchChildren(); // Fetch children if needed for names
        }
    }, [fetchGoals, fetchChildren, children.length]);

    // Group goals by child using child_id and child_name from goal data if available
    // Or fallback to profile store lookup
    const goalsByChild = goals.reduce((acc, goal) => {
        const childId = goal.child_id;
        if (!acc[childId]) {
            const childProfile = getChildById(childId);
            acc[childId] = { 
                childName: goal.child_name || childProfile?.name || 'Unknown Child', // Use name from goal if present
                goals: [] 
            };
        }
        acc[childId].goals.push(goal);
        return acc;
    }, {} as Record<string, { childName: string; goals: SavingsGoal[] }>);
    
    const handleParentContribute = async (goalId: string, amount: number): Promise<boolean> => {
        const goal = goals.find(g => g.id === goalId); // Find goal locally first
        if (!goal) return false;

        console.log(`Parent contributing ${amount} to goal ${goalId} (${goal.name})`);
        
        const updatedGoal = await parentContributeToGoal(goalId, { amount });
        
        if (updatedGoal) {
            Alert.alert('Contribution Added', `$${amount.toFixed(2)} added to ${goal.name}.`);
            return true;
        } else {
            Alert.alert("Error", useGoalStore.getState().error || "Could not add contribution.");
            return false;
        }
    };

    // Handle loading state
    if (isLoading && goals.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ title: 'Children Savings Goals' }} />
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

                 {/* Display Error */}
                 {error && !isLoading && (
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                 )}

                 {/* Check if children profiles are loaded before rendering */}
                 {children.length === 0 && !useProfileStore.getState().isLoading && !useProfileStore.getState().error && (
                     <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>
                         No children profiles loaded. Add children first.
                     </Text>
                 )}

                 {Object.keys(goalsByChild).length === 0 && children.length > 0 && !isLoading && (
                     <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 20 }}>
                         No savings goals set up for any child yet.
                     </Text>
                 )}

                 {/* Iterate through children who have goals */}
                 {Object.entries(goalsByChild).map(([childId, { childName, goals: childGoals }]) => (
                    <View key={childId} style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{childName}'s Goals</Text>
                        {childGoals.map(goal => (
                            <ParentGoalCard key={goal.id} goal={goal} onContribute={handleParentContribute} />
                        ))}
                         {/* Removed Add Goal button for parent view */}
                    </View>
                 ))}

                 {/* Show children with NO goals */}
                 {children.filter(c => !goalsByChild[c.id]).map(child => (
                    <View key={child.id} style={[styles.card, { backgroundColor: colors.backgroundStrong }]}>
                         <Text style={[styles.cardTitle, { color: colors.text }]}>{child.name}'s Goals</Text>
                         <Text style={{ color: colors.placeholder, marginTop: 10 }}>No savings goals set up yet.</Text>
                    </View>
                 ))}

            </ScrollView>
        </SafeAreaView>
    );
};

// Styles - Add loadingContainer, errorText
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
    inputSmall: { // Style for the small contribution input
        flex: 1, // Take available space
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginRight: 10,
        fontSize: 15,
    },
    buttonSmall: { // Style for small buttons like contribute
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40, // Match input height
    },
    buttonSmallText: {
        color: Colors.light.backgroundStrong, 
        fontSize: 14,
        fontWeight: '600',
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
        color: Colors.light.error, // Example color
        marginBottom: 10,
    },
});

export default ParentSavingsScreen; 