import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store'; // Import SecureStore

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3001'; // Backend API URL
const TOKEN_KEY = 'authToken'; // Key for storing token in SecureStore

// --- Types ---
type UserType = 'parent' | 'child' | null;
// Define more specific types for user objects based on backend response
type ParentUser = { id: string; email: string; name?: string; /* add other fields */ };
type ChildUser = { id: string; name: string; parentId: string; balance?: number; avatar_url?: string; /* add other fields */ };
type CurrentUser = ParentUser | ChildUser | null;

export interface AuthState { // Export the interface
  isLoggedIn: boolean;
  userType: UserType;
  currentUser: CurrentUser; // Store the logged-in user object
  token: string | null; // Keep token in state? Maybe not necessary if always read from SecureStore
  isLoading: boolean; // To indicate loading state during API calls
  error: string | null; // To store authentication errors

  // Actions
  parentSignup: (credentials: { email: string; password: string; name?: string }) => Promise<boolean>;
  parentLogin: (credentials: { email: string; password: string }) => Promise<boolean>;
  childLogin: (credentials: { parentId?: string; username: string; password: string }) => Promise<boolean>; // parentId might be needed
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>; // Check token validity on app start
  clearError: () => void;
  // Internal helper (optional, could be put outside store)
  // _setToken: (token: string | null) => void; 
}

// --- Helper Functions for SecureStore ---
async function saveToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token', error);
  }
}

async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token', error);
    return null;
  }
}

async function deleteToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error deleting auth token', error);
  }
}


// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userType: null,
      currentUser: null,
      token: null, // Initial state, will be loaded by checkAuthStatus
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      parentSignup: async ({ email, password, name }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/parent/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
          }

          console.log('Parent signup successful:', data); // Contains { message, parent }
          set({ isLoading: false });
          return true; // Indicate success, but don't log in automatically

        } catch (error: any) {
          console.error('Parent Signup Error:', error);
          set({ isLoading: false, error: error.message || 'An error occurred during signup.' });
          return false;
        }
      },

      parentLogin: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/parent/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          if (data.token && data.parent) {
            await saveToken(data.token);
            set({
              isLoggedIn: true,
              userType: 'parent',
              currentUser: data.parent,
              token: data.token, // Store token in state as well?
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            throw new Error('Login response missing token or user data.');
          }
        } catch (error: any) {
          console.error('Parent Login Error:', error);
          await deleteToken(); // Clear token if login fails
          set({ 
              isLoading: false, 
              error: error.message || 'An error occurred during login.', 
              isLoggedIn: false, 
              userType: null, 
              currentUser: null, 
              token: null 
            });
          return false;
        }
      },

      childLogin: async ({ parentId, username, password }) => {
        set({ isLoading: true, error: null });
        try {
          // Note: Backend expects parentId, username, password
          const response = await fetch(`${API_BASE_URL}/auth/child/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId, username, password }), // Make sure parentId is provided from UI
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          if (data.token && data.child) {
            await saveToken(data.token);
            set({
              isLoggedIn: true,
              userType: 'child',
              currentUser: data.child,
              token: data.token,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            throw new Error('Login response missing token or user data.');
          }
        } catch (error: any) {
          console.error('Child Login Error:', error);
           await deleteToken(); // Clear token if login fails
          set({ 
              isLoading: false, 
              error: error.message || 'An error occurred during login.', 
              isLoggedIn: false, 
              userType: null, 
              currentUser: null, 
              token: null 
            });
          return false;
        }
      },

      logout: async () => {
        console.log('Logging out...');
        await deleteToken();
        set({
          isLoggedIn: false,
          userType: null,
          currentUser: null,
          token: null,
          isLoading: false,
          error: null,
        });
         // Optionally call a backend logout endpoint if it exists/is needed
         // Example: await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${get().token}` } });
      },

      checkAuthStatus: async () => {
        set({ isLoading: true });
        const storedToken = await getToken();
        if (storedToken) {
          try {
            // Verify token with the backend /auth/me endpoint
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            });
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Session expired or invalid');
            }

            if (data.user && (data.user.email || data.user.parentId)) { // Check if user data is present
              const userType = data.user.email ? 'parent' : 'child';
              set({
                isLoggedIn: true,
                userType: userType,
                currentUser: data.user,
                token: storedToken,
                isLoading: false,
                error: null,
              });
              console.log('User authenticated via stored token:', userType);
            } else {
                 throw new Error('/me endpoint did not return valid user data');
            }

          } catch (error: any) {
            console.warn('Token validation failed or session expired:', error.message);
            await deleteToken(); // Clear invalid token
            set({ isLoggedIn: false, userType: null, currentUser: null, token: null, isLoading: false });
          }
        } else {
            // No token found
           set({ isLoading: false });
        }
      },

    }),
    {
      name: 'auth-storage', // Unique name for storage
      // We only persist basic info, token is handled by SecureStore
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Selectively persist non-sensitive data if needed, or persist nothing
        // isLoggedIn: state.isLoggedIn, 
        // userType: state.userType,
        // currentUser: state.currentUser, // Be careful persisting user data
      }),
      // Custom hydration logic could load token from SecureStore on startup
      // but calling checkAuthStatus on app load is generally better
       onRehydrateStorage: () => {
         return (state, error) => {
           if (error) {
             console.error('Failed to rehydrate auth state from AsyncStorage', error)
           } else {
             // Don't automatically set isLoggedIn to true based on AsyncStorage
             // Call checkAuthStatus on app init instead to verify token with backend
             state?.checkAuthStatus(); 
           }
         }
       },
    }
  )
);

// Function to get the current token for API calls outside of Zustand actions/components
export const getAuthToken = async () => {
    return await getToken();
};
