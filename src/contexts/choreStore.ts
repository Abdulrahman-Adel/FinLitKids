import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/api';
import { useAuthStore } from './authStore'; // To check user type
import { ChildProfile } from './profileStore'; // Import ChildProfile for approveChore response

export type ChoreStatus = 'Pending' | 'Completed' | 'Approved';

// Matches backend response (added assigned_child_name)
export interface Chore {
  id: string;
  title: string;
  description?: string | null;
  assigned_child_id: string | null;
  assigned_child_name?: string | null; // Added from parent GET endpoint
  points: number;
  status: ChoreStatus;
  created_at?: string;
  updated_at?: string;
  parent_id?: string; // From backend
}

// Type for the response when approving a chore
interface ApproveChoreResponse {
    message: string;
    chore: Chore;
    newChildBalance: string;
}

// Type for the response when marking a chore complete
interface MarkCompleteResponse {
    message: string;
    chore: Chore;
}

interface ChoreState {
  chores: Chore[];
  isLoading: boolean;
  error: string | null;
  fetchChores: (filters?: { assignedChildId?: string; status?: ChoreStatus }) => Promise<void>;
  // Parent Actions
  addChore: (newChoreData: { title: string; points: number; assignedChildId?: string | null; description?: string | null }) => Promise<Chore | null>;
  updateChore: (choreId: string, updates: Partial<Omit<Chore, 'id' | 'parent_id' | 'created_at' | 'updated_at' | 'assigned_child_name'>>) => Promise<Chore | null>;
  deleteChore: (choreId: string) => Promise<boolean>;
  approveChore: (choreId: string) => Promise<{ chore: Chore, newChildBalance: number } | null>; // Return updated chore and balance
  // Child Actions
  markChoreComplete: (choreId: string) => Promise<Chore | null>;
  clearError: () => void;
  getChoresByChild: (childId: string) => Chore[]; // Keep local helpers
  getChoreById: (choreId: string) => Chore | undefined;
}

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      chores: [],
      isLoading: false,
      error: null,

      clearError: () => set({ error: null, isLoading: false }),

      fetchChores: async (filters = {}) => {
        set({ isLoading: true, error: null });
        const userType = useAuthStore.getState().userType;
        if (!userType) {
             set({ isLoading: false, error: 'User type unknown, cannot fetch chores.'});
             return;
        }

        const endpoint = userType === 'parent' ? '/api/parent/chores' : '/api/child/chores';
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filters.assignedChildId) queryParams.append('assignedChildId', filters.assignedChildId);
        if (filters.status) queryParams.append('status', filters.status);
        const queryString = queryParams.toString();
        const finalEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

        try {
          const fetchedChores = await apiFetch<Chore[]>(finalEndpoint);
          set({ chores: fetchedChores, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch chores:', error);
          set({ isLoading: false, error: error.message || 'Failed to load chores.' });
        }
      },

      // --- Parent Actions ---
      addChore: async (newChoreData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiFetch<{ message: string; chore: Chore }>('/api/parent/chores', {
            method: 'POST',
            body: newChoreData,
          });
          const newChore = result.chore;
          set((state) => ({ chores: [...state.chores, newChore], isLoading: false }));
          return newChore;
        } catch (error: any) {
          console.error('Failed to add chore:', error);
          set({ isLoading: false, error: error.message || 'Failed to add chore.' });
          return null;
        }
      },

      updateChore: async (choreId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiFetch<{ message: string; chore: Chore }>(
            `/api/parent/chores/${choreId}`,
            {
              method: 'PUT',
              body: updates,
            }
          );
          const updatedChore = result.chore;
          set((state) => ({
            chores: state.chores.map((c) => (c.id === choreId ? updatedChore : c)),
            isLoading: false,
          }));
          return updatedChore;
        } catch (error: any) {
          console.error('Failed to update chore:', error);
          set({ isLoading: false, error: error.message || 'Failed to update chore.' });
          return null;
        }
      },

      deleteChore: async (choreId) => {
        set({ isLoading: true, error: null });
        try {
          await apiFetch(`/api/parent/chores/${choreId}`, { method: 'DELETE' });
          set((state) => ({
            chores: state.chores.filter((c) => c.id !== choreId),
            isLoading: false,
          }));
          return true;
        } catch (error: any) {
          console.error('Failed to delete chore:', error);
          set({ isLoading: false, error: error.message || 'Failed to delete chore.' });
          return false;
        }
      },

      approveChore: async (choreId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiFetch<ApproveChoreResponse>(
            `/api/parent/chores/${choreId}/approve`,
            { method: 'PATCH' }
          );
          const updatedChore = response.chore;
          const newBalance = Number(response.newChildBalance);

          // Update chore state
          set((state) => ({
            chores: state.chores.map((c) => (c.id === choreId ? updatedChore : c)),
            isLoading: false,
          }));

          // Also update the child's balance in the profile store
          // Need to import and use profileStore here - might be better handled by UI/effects
          // For simplicity, let's just return the data and let the caller handle profile update
          // Example: useProfileStore.getState().updateChildBalance(updatedChore.assigned_child_id, ...)
          
          return { chore: updatedChore, newChildBalance: newBalance };
        } catch (error: any) {
          console.error('Failed to approve chore:', error);
          set({ isLoading: false, error: error.message || 'Failed to approve chore.' });
          return null;
        }
      },

      // --- Child Actions ---
      markChoreComplete: async (choreId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiFetch<MarkCompleteResponse>(
            `/api/child/chores/${choreId}/complete`,
            { method: 'PATCH' }
          );
           const updatedChore = response.chore;
           set((state) => ({
            chores: state.chores.map((c) => (c.id === choreId ? updatedChore : c)),
            isLoading: false,
          }));
          return updatedChore;
        } catch (error: any) {
          console.error('Failed to mark chore complete:', error);
          set({ isLoading: false, error: error.message || 'Failed to mark chore complete.' });
          return null;
        }
      },
      
      // --- Local Getters ---
      getChoresByChild: (childId) => {
        return get().chores.filter(chore => chore.assigned_child_id === childId);
      },
       getChoreById: (choreId) => {
          return get().chores.find(chore => chore.id === choreId);
      }
    }),
    {
      name: 'chore-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Disable persistence, rely on fetch
      partialize: (state) => ({}),
       onRehydrateStorage: () => {
         return (state, error) => {
           console.log('Chore store rehydrated (persistence disabled by partialize)');
         }
       },
    }
  )
); 