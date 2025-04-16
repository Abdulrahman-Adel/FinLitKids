import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/api'; // Import apiFetch

// Type based on backend `children` table/API response (excluding password_hash)
export interface ChildProfile {
  id: string; 
  name: string; 
  balance: number; // Stored as numeric/decimal, use number here
  avatar_url?: string | null; 
  allowance_enabled?: boolean;
  allowance_amount?: number | null;
  allowance_frequency?: 'Weekly' | 'Bi-Weekly' | 'Monthly' | null;
  spending_limit?: number | null;
  spending_limit_frequency?: 'Weekly' | 'Monthly' | null;
  created_at?: string;
  updated_at?: string;
  parent_id?: string; // From backend
}

// Define the shape of the backend response for balance adjustment
interface AdjustBalanceResponse {
    message: string;
    newBalance: string; // Backend returns balance as string
    transactionId: string;
    transactionDate: string;
}

interface ProfileState {
  // parentName: string | null; // Maybe get this from authStore.currentUser?
  children: ChildProfile[];
  isLoading: boolean;
  error: string | null;
  // Actions using backend API
  fetchChildren: () => Promise<void>;
  addChild: (newChildData: { name: string; password: string }) => Promise<ChildProfile | null>; // Password required for creation
  updateChild: (childId: string, updates: Partial<Omit<ChildProfile, 'id' | 'balance' | 'parent_id' | 'created_at' | 'updated_at'>> & { password?: string }) => Promise<ChildProfile | null>;
  deleteChild: (childId: string) => Promise<boolean>;
  adjustChildBalance: (childId: string, adjustment: { amount: number; description: string }) => Promise<boolean>;
  clearError: () => void;
  getChildById: (childId: string) => ChildProfile | undefined; // Keep local helper
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      children: [],
      isLoading: false,
      error: null,

      clearError: () => set({ error: null, isLoading: false }),

      fetchChildren: async () => {
        set({ isLoading: true, error: null });
        try {
          const fetchedChildren = await apiFetch<ChildProfile[]>('/api/parent/children');
          // Convert balance from string/numeric to number if needed
          const childrenWithNumberBalance = fetchedChildren.map(child => ({
              ...child,
              balance: Number(child.balance) || 0 // Ensure balance is a number
          }));
          set({ children: childrenWithNumberBalance, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch children:', error);
          set({ isLoading: false, error: error.message || 'Failed to load children profiles.' });
        }
      },

      // Requires name and initial password
      addChild: async (newChildData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiFetch<{ message: string; child: ChildProfile }>('/api/parent/children', {
            method: 'POST',
            body: newChildData, 
          });
          const newChild = { ...result.child, balance: Number(result.child.balance) || 0 };
          set((state) => ({ children: [...state.children, newChild], isLoading: false }));
          return newChild;
        } catch (error: any) {
          console.error('Failed to add child:', error);
          set({ isLoading: false, error: error.message || 'Failed to create child profile.' });
          return null;
        }
      },

      // Takes ID and update object (can include password)
      updateChild: async (childId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiFetch<{ message: string; child: ChildProfile }>(
              `/api/parent/children/${childId}`,
              {
                  method: 'PUT',
                  body: updates,
              }
          );
          const updatedChild = { ...result.child, balance: Number(result.child.balance) || 0 };
          set((state) => ({
            children: state.children.map((child) =>
              child.id === updatedChild.id ? updatedChild : child
            ),
            isLoading: false,
          }));
          return updatedChild;
        } catch (error: any) {
          console.error('Failed to update child:', error);
          set({ isLoading: false, error: error.message || 'Failed to update child profile.' });
          return null;
        }
      },

      deleteChild: async (childId) => {
        set({ isLoading: true, error: null });
        try {
          await apiFetch(`/api/parent/children/${childId}`, { method: 'DELETE' });
          set((state) => ({
            children: state.children.filter((child) => child.id !== childId),
            isLoading: false,
          }));
          return true;
        } catch (error: any) {
          console.error('Failed to delete child:', error);
          set({ isLoading: false, error: error.message || 'Failed to delete child profile.' });
          return false;
        }
      },
      
      adjustChildBalance: async (childId, adjustment) => {
          set({isLoading: true, error: null});
          try {
              // Call the backend endpoint
             const response = await apiFetch<AdjustBalanceResponse>(`/api/parent/children/${childId}/balance`, {
                 method: 'POST',
                 body: adjustment, // { amount: number, description: string }
             });
            
             // Update the specific child's balance in the local state
              set(state => ({
                 children: state.children.map(child => 
                     child.id === childId ? { ...child, balance: Number(response.newBalance) } : child
                 ),
                 isLoading: false,
              }));
             return true;
          } catch (error: any) {
             console.error('Failed to adjust child balance:', error);
             set({isLoading: false, error: error.message || 'Failed to adjust balance.'});
             return false;
          }
      },

      // Keep local getter for convenience
      getChildById: (childId) => {
        return get().children.find((child) => child.id === childId);
      },

    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist children array? Or maybe nothing and rely on fetch?
      // Persisting might lead to stale data. Let's not persist for now and rely on fetch.
      partialize: (state) => ({}), 
       // Optional: Trigger fetchChildren after rehydration or login
       onRehydrateStorage: () => {
         return (state, error) => {
            // Could potentially trigger fetchChildren here if needed,
            // but better to trigger it from UI after login or on relevant screen mount.
           console.log('Profile store rehydrated (persistence disabled by partialize)');
         }
       },
    }
  )
); 