import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChoreStatus = 'Pending' | 'Completed' | 'Approved';

// Define the structure for a chore
export interface Chore {
  id: string; // Unique ID for the chore
  title: string;
  description?: string; // Optional longer description
  assignedChildId: string | null; // ID of the child it's assigned to, or null if unassigned
  points: number; // How many points completing the chore is worth
  status: ChoreStatus;
  // Potential future fields: dueDate, recurring (e.g., 'daily', 'weekly')
}

interface ChoreState {
  chores: Chore[];
  addChore: (newChoreData: Omit<Chore, 'id' | 'status'>) => void;
  updateChoreStatus: (choreId: string, newStatus: ChoreStatus) => void;
  updateChore: (updatedChore: Chore) => void; // For editing title, points etc.
  deleteChore: (choreId: string) => void;
  getChoresByChild: (childId: string) => Chore[];
  getChoreById: (choreId: string) => Chore | undefined;
}

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      // Initial State
      chores: [],
      addChore: (newChoreData) => {
        const newChore: Chore = {
          id: `c-${Date.now().toString()}`, // Simple unique ID
          status: 'Pending',
          ...newChoreData,
        };
        set((state) => ({ chores: [...state.chores, newChore] }));
      },
      updateChoreStatus: (choreId, newStatus) => {
        set((state) => ({
          chores: state.chores.map((chore) =>
            chore.id === choreId ? { ...chore, status: newStatus } : chore
          ),
        }));
      },
       updateChore: (updatedChore) => {
          set((state) => ({
              chores: state.chores.map((chore) =>
                  chore.id === updatedChore.id ? updatedChore : chore
              ),
          }));
      },
      deleteChore: (choreId) => {
        set((state) => ({
          chores: state.chores.filter((chore) => chore.id !== choreId),
        }));
      },
      getChoresByChild: (childId) => {
        return get().chores.filter(chore => chore.assignedChildId === childId);
      },
       getChoreById: (choreId) => {
          return get().chores.find(chore => chore.id === choreId);
      }
    }),
    {
      name: 'chore-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 