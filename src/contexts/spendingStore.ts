import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the structure for a spending transaction
export interface SpendingTransaction {
  id: string; // Unique ID for the transaction
  childId: string; // ID of the child who made the transaction
  description: string;
  amount: number; // Positive number representing the amount spent
  date: string; // ISO date string (e.g., new Date().toISOString())
}

interface SpendingState {
  transactions: SpendingTransaction[];
  addTransaction: (newTxData: Omit<SpendingTransaction, 'id'>) => void;
  deleteTransaction: (transactionId: string) => SpendingTransaction | undefined;
  getTransactionsByChild: (childId: string) => SpendingTransaction[];
}

export const useSpendingStore = create<SpendingState>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (newTxData) => {
        const newTransaction: SpendingTransaction = {
          id: `t-${Date.now().toString()}`, // Simple unique ID
          ...newTxData,
        };
        set((state) => ({ transactions: [...state.transactions, newTransaction] }));
        // Note: We'll handle balance deduction separately when calling this action
      },
      deleteTransaction: (transactionId) => {
        const deletedTx = get().transactions.find(tx => tx.id === transactionId);
        if (deletedTx) {
          set((state) => ({
            transactions: state.transactions.filter((tx) => tx.id !== transactionId),
          }));
        }
        return deletedTx;
      },
      getTransactionsByChild: (childId) => {
        // Sort by date descending
        return get().transactions
            .filter(tx => tx.childId === childId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
    }),
    {
      name: 'spending-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 