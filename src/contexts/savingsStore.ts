import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the structure for a savings goal
export interface SavingsGoal {
  id: string; // Unique ID for the goal
  childId: string; // ID of the child this goal belongs to
  name: string; // Name of the goal (e.g., "New Bike")
  targetAmount: number; // The target amount to save
  currentAmount: number; // The amount currently saved towards the goal
}

interface SavingsState {
  goals: SavingsGoal[];
  addGoal: (newGoalData: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  deleteGoal: (goalId: string) => SavingsGoal | undefined;
  updateGoalAmount: (goalId: string, amountToAdd: number) => void; // Adds to currentAmount
  getGoalsByChild: (childId: string) => SavingsGoal[];
  getGoalById: (goalId: string) => SavingsGoal | undefined; // Helper
}

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set, get) => ({
      goals: [],
      addGoal: (newGoalData) => {
        const newGoal: SavingsGoal = {
          id: `g-${Date.now().toString()}`,
          currentAmount: 0, // Start with 0 saved
          ...newGoalData,
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },
      deleteGoal: (goalId) => {
        const deletedGoal = get().goals.find(goal => goal.id === goalId);
        if (deletedGoal) {
          set((state) => ({ goals: state.goals.filter((goal) => goal.id !== goalId) }));
        }
        return deletedGoal;
      },
      updateGoalAmount: (goalId, amountToAdd) => {
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id === goalId) {
              const newAmount = goal.currentAmount + amountToAdd;
              // Prevent saving more than the target
              const cappedAmount = Math.min(newAmount, goal.targetAmount);
              return { ...goal, currentAmount: cappedAmount };
            }
            return goal;
          }),
        }));
        // Note: Balance deduction needs to happen separately when calling this
      },
      getGoalsByChild: (childId) => {
        return get().goals.filter(goal => goal.childId === childId);
      },
      getGoalById: (goalId) => {
          return get().goals.find(goal => goal.id === goalId);
      }
    }),
    {
      name: 'savings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 