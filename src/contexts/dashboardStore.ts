import { create } from 'zustand';
import { apiFetch } from '../services/api';
import { useAuthStore } from './authStore'; // To ensure it only runs for child

// Type matching the backend response for /api/child/dashboard
interface DashboardData {
  balance: string; // Backend might return as string
  pendingChoresCount: number;
  activeGoalsCount: number;
  // Add other fields returned by the endpoint later
}

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  data: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null, isLoading: false }),

  fetchDashboardData: async () => {
    // Ensure only a child can fetch this data
    if (useAuthStore.getState().userType !== 'child') {
      console.warn('Attempted to fetch child dashboard data for non-child user.');
      set({ data: null, isLoading: false, error: 'Not authorized for this view.' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const fetchedData = await apiFetch<DashboardData>('/api/child/dashboard');
      // Ensure balance is treated as a number for consistency internally if needed
      // const processedData = {
      //    ...fetchedData,
      //    balance: Number(fetchedData.balance) || 0 
      // };
      set({ data: fetchedData, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      set({ isLoading: false, error: error.message || 'Failed to load dashboard.', data: null });
    }
  },
}));

// Note: No persistence needed for dashboard data, always fetch fresh. 