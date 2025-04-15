import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a more detailed structure for a child profile
export interface ChildProfile {
  id: string; // Unique ID for the child
  name: string; // Child's display name or username
  // IMPORTANT: Storing passwords directly like this is highly insecure!
  // In a real app, never store plain text passwords.
  // This is purely for demonstrating local state management without a backend.
  // A real implementation would involve secure backend authentication.
  password_mock: string; // Temporary mock password/PIN for local demo
  balance: number; // Add balance field
  avatarUrl?: string; // Optional URL for the child's avatar image
  
  // Allowance fields
  allowanceEnabled?: boolean;
  allowanceAmount?: number;
  allowanceFrequency?: 'Weekly' | 'Bi-Weekly' | 'Monthly'; // Example frequencies

  // Spending Limit fields
  spendingLimit?: number; // e.g., limit per week/month
  spendingLimitFrequency?: 'Weekly' | 'Monthly'; // How often the limit resets

  // Add other child-specific data later (e.g., avatar, balanceId)
}

interface ProfileState {
  parentName: string | null; // Example parent data field
  children: ChildProfile[];
  setParentName: (name: string) => void;
  addChild: (newChildData: Omit<ChildProfile, 'id' | 'balance' | 'avatarUrl' | 'allowanceEnabled' | 'allowanceAmount' | 'allowanceFrequency' | 'spendingLimit' | 'spendingLimitFrequency'>) => void;
  updateChild: (updatedChild: ChildProfile) => void; // Action to update a child
  deleteChild: (childId: string) => void; // Action to delete a child
  getChildById: (childId: string) => ChildProfile | undefined; // Helper to get a specific child
  updateChildBalance: (childId: string, amount: number) => void; // Add balance update action
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      parentName: '', // Assuming a single parent context for simplicity
      children: [],

      setParentName: (name) => set({ parentName: name }),

      addChild: (newChildData) => {
        const newChild: ChildProfile = {
          id: `child-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Simple unique ID
          ...newChildData,
          balance: 0, // Initialize balance
        };
        set((state) => ({ children: [...state.children, newChild] }));
      },

      updateChild: (updatedChild) => {
        set((state) => ({
          children: state.children.map((child) =>
            child.id === updatedChild.id ? updatedChild : child
          ),
        }));
      },

      deleteChild: (childId) => {
        set((state) => ({
          children: state.children.filter((child) => child.id !== childId),
        }));
      },

      getChildById: (childId) => {
        return get().children.find((child) => child.id === childId);
      },

      updateChildBalance: (childId, amount) => {
        set((state) => ({
          children: state.children.map((child) =>
            child.id === childId
              ? { ...child, balance: Math.max(0, child.balance + amount) } // Ensure balance doesn't go negative
              : child
          ),
        }));
      },
    }),
    {
      name: 'profile-storage', // Unique name for this store's storage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 