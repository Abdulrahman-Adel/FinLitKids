import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserType = 'parent' | 'child' | null;

interface AuthState {
  isLoggedIn: boolean;
  userType: UserType;
  loggedInUserId: string | null;
  login: (type: UserType, userId: string) => void;
  logout: () => void;
}

// Define the store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userType: null,
      loggedInUserId: null,
      // Mock Login: In a real app, this would involve API calls, token handling etc.
      login: (type, userId) => set({ 
          isLoggedIn: true, 
          userType: type, 
          loggedInUserId: userId }),
      // Mock Logout
      logout: () => set({ 
          isLoggedIn: false, 
          userType: null, 
          loggedInUserId: null }),
    }),
    {
      name: 'auth-storage', // Unique name for storage
      storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for persistence
    }
  )
); 