import { create } from 'zustand';
import { apiFetch } from '../services/api';
import { useAuthStore } from './authStore'; 

// Type based on backend savings_goals table/API response
export interface SavingsGoal {
  id: string;
  child_id: string;
  name: string;
  target_amount: number; // Use number, convert from string if necessary
  current_amount: number; // Use number, convert from string if necessary
  created_at?: string;
  updated_at?: string;
  child_name?: string; // Included in parent fetch
}

// Type for Add Goal response
interface AddGoalResponse {
    message: string;
    goal: SavingsGoal;
}

// Type for Delete Goal response
interface DeleteGoalResponse {
    message: string;
    newBalance: string; // Backend returns balance as string
}

// Type for Child Contribute response
interface ChildContributeResponse {
    message: string;
    goal: SavingsGoal;
    newBalance: string;
}

// Type for Parent Contribute response
interface ParentContributeResponse {
    message: string;
    goal: SavingsGoal;
}

interface GoalState {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: (childId?: string) => Promise<void>; // Optional childId filter for parent view
  // Parent Actions
  parentContributeToGoal: (goalId: string, contribution: { amount: number; description?: string }) => Promise<SavingsGoal | null>;
  // Child Actions
  addGoal: (goalData: { name: string; targetAmount: number }) => Promise<SavingsGoal | null>;
  childContributeToGoal: (goalId: string, contribution: { amount: number }) => Promise<{ goal: SavingsGoal, newBalance: number } | null>;
  deleteGoal: (goalId: string) => Promise<{ deleted: boolean, newBalance: number } | null>;
  clearError: () => void;
  getGoalById: (goalId: string) => SavingsGoal | undefined; // Local helper
}

const parseGoalAmounts = (goal: SavingsGoal): SavingsGoal => ({
    ...goal,
    target_amount: Number(goal.target_amount) || 0,
    current_amount: Number(goal.current_amount) || 0,
});

export const useGoalStore = create<GoalState>()((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null, isLoading: false }),

  fetchGoals: async (childIdFilter?: string) => {
    set({ isLoading: true, error: null });
    const userType = useAuthStore.getState().userType;
    if (!userType) {
        set({ isLoading: false, error: 'User type unknown, cannot fetch goals.'});
        return;
    }
    
    let endpoint = userType === 'parent' ? '/api/parent/savings-goals' : '/api/child/savings-goals';
    
    // Add childId filter for parent if provided
    if (userType === 'parent' && childIdFilter) {
        endpoint += `?childId=${encodeURIComponent(childIdFilter)}`;
    }

    try {
      const fetchedGoals = await apiFetch<SavingsGoal[]>(endpoint);
      const goalsWithNumbers = fetchedGoals.map(parseGoalAmounts);
      set({ goals: goalsWithNumbers, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch goals:', error);
      set({ isLoading: false, error: error.message || 'Failed to load savings goals.' });
    }
  },

  // --- Parent Actions ---
  parentContributeToGoal: async (goalId, contribution) => {
      set({isLoading: true, error: null});
      try {
          const response = await apiFetch<ParentContributeResponse>(
              `/api/parent/savings-goals/${goalId}/contribute`,
              { method: 'POST', body: contribution }
          );
          const updatedGoal = parseGoalAmounts(response.goal);
          set((state) => ({
            goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
            isLoading: false,
          }));
          return updatedGoal;
      } catch (error: any) {
         console.error('Failed to contribute to goal (parent):', error);
         set({isLoading: false, error: error.message || 'Failed to contribute.'});
         return null;
      }
  },

  // --- Child Actions ---
  addGoal: async (goalData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiFetch<AddGoalResponse>('/api/child/savings-goals', {
        method: 'POST',
        body: goalData,
      });
      const newGoal = parseGoalAmounts(response.goal);
      set((state) => ({ goals: [...state.goals, newGoal], isLoading: false }));
      return newGoal;
    } catch (error: any) {
      console.error('Failed to add goal:', error);
      set({ isLoading: false, error: error.message || 'Failed to create goal.' });
      return null;
    }
  },

  childContributeToGoal: async (goalId, contribution) => {
      set({isLoading: true, error: null});
      try {
           const response = await apiFetch<ChildContributeResponse>(
               `/api/child/savings-goals/${goalId}/contribute`,
               { method: 'POST', body: contribution }
           );
           const updatedGoal = parseGoalAmounts(response.goal);
           const newBalance = Number(response.newBalance);
            // Update goal in state
           set((state) => ({
                goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
                isLoading: false,
           }));
           // Note: Also need to update child balance in profileStore - handle in UI/effect
           return { goal: updatedGoal, newBalance };
      } catch (error: any) {
           console.error('Failed to contribute to goal (child):', error);
           set({isLoading: false, error: error.message || 'Failed to contribute.'});
           return null;
      }
  },

  deleteGoal: async (goalId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiFetch<DeleteGoalResponse>(`/api/child/savings-goals/${goalId}`, {
        method: 'DELETE',
      });
      const newBalance = Number(response.newBalance);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
        isLoading: false,
      }));
      // Note: Also need to update child balance in profileStore - handle in UI/effect
      return { deleted: true, newBalance };
    } catch (error: any) {
      console.error('Failed to delete goal:', error);
      set({ isLoading: false, error: error.message || 'Failed to delete goal.' });
      return null;
    }
  },

  // --- Local Getters ---
  getGoalById: (goalId) => {
    return get().goals.find((goal) => goal.id === goalId);
  },
}));

// Note: Persistence is disabled for this store as data is fetched. 