import { create } from 'zustand';
import { apiFetch } from '../services/api';
import { useAuthStore } from './authStore';
import { useDashboardStore } from './dashboardStore'; // To refresh balance

// Transaction Type (adjust fields based on actual API response)
export interface Transaction {
  id: string;
  description: string;
  amount: number; // Negative for spending, positive for earnings/allowance
  date: string; // ISO 8601 date string
  type: 'spending' | 'chore_reward' | 'allowance' | 'goal_contribution' | 'goal_refund' | 'manual_adjustment' | 'initial_balance'; // Example types
  child_id?: string; // Present in parent view
  child_name?: string; // Present in parent view
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  recordSpending: (data: { description: string; amount: number }) => Promise<Transaction | null>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null, isLoading: false }),

  fetchTransactions: async () => {
    const userType = useAuthStore.getState().userType;
    const endpoint = userType === 'parent' ? '/api/transactions' : '/api/child/transactions';

    if (!userType) {
        set({ isLoading: false, error: 'User type not identified.', transactions: [] });
        return;
    }

    set({ isLoading: true, error: null });
    try {
      console.log(`Fetching transactions from ${endpoint}`);
      const fetchedTransactions = await apiFetch<Transaction[]>(endpoint);
      // Sort by date descending (newest first)
      fetchedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ transactions: fetchedTransactions, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      set({ isLoading: false, error: error.message || 'Failed to load transaction history.', transactions: [] });
    }
  },

  recordSpending: async (data: { description: string; amount: number }): Promise<Transaction | null> => {
    if (useAuthStore.getState().userType !== 'child') {
        set({ error: 'Only children can record spending.' });
        console.error('Attempted to record spending for non-child user.');
        return null;
    }
    // Ensure amount is positive, backend will make it negative
    if (data.amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a positive amount for spending.');
        return null;
    }

    // No global loading state for this, handle locally in component if needed
    set({ error: null }); 
    try {
      console.log('Recording spending:', data);
      const newTransaction = await apiFetch<Transaction>('/api/child/spending', {
        method: 'POST',
        body: JSON.stringify({ description: data.description, amount: data.amount }),
      });

      // Add to the start of the local state and refresh dashboard
      set((state) => ({ 
          transactions: [newTransaction, ...state.transactions], 
          error: null 
      }));
      useDashboardStore.getState().fetchDashboardData(); // Refresh balance on dashboard
      return newTransaction;

    } catch (error: any) {
      console.error('Failed to record spending:', error);
      set({ error: error.message || 'Failed to record spending.' });
      // Optionally, show Alert here too
      Alert.alert('Spending Error', error.message || 'Could not record spending. Check your balance.');
      return null;
    }
  }

}));

// Note: No persistence needed. Always fetch fresh. 