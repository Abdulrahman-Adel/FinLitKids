import { getAuthToken, useAuthStore } from '@/src/contexts/authStore';

const API_BASE_URL = 'http://localhost:3001'; // Match the one in authStore or use a shared config

interface ApiOptions extends RequestInit {
  // No custom options needed for now, but could add things like `useAuth` boolean
}

/**
 * A wrapper around the fetch API to automatically handle:
 * - Adding the Authorization header with JWT
 * - Prepending the API base URL
 * - Setting Content-Type for JSON bodies
 * - Basic JSON parsing and error handling
 * - Automatic logout on 401 Unauthorized errors
 */
export const apiFetch = async <T = any>( // Generic type for response data
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> => {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  // Add authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type for relevant methods if body is present and not FormData
  if (options.body && !(options.body instanceof FormData) && ('POST,PUT,PATCH').includes(options.method?.toUpperCase() || 'GET')) {
     if (!headers.has('Content-Type')) { // Don't override if explicitly set
        headers.set('Content-Type', 'application/json');
     }
  }

  // Ensure body is stringified if it's a JSON request
  let body = options.body;
  if (headers.get('Content-Type') === 'application/json' && typeof body === 'object' && body !== null && !(body instanceof FormData)) {
      body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  console.log(`[API Fetch] ${options.method || 'GET'} ${url}`); // Log API calls

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // Handle 401 Unauthorized - Trigger logout
    if (response.status === 401) {
      console.warn('[API Fetch] Received 401 Unauthorized. Logging out.');
      // Use the logout function from the store
      // Need to access store outside of React component - use getState()
      useAuthStore.getState().logout(); 
      // Throw an error to stop further processing in the calling function
      throw new Error('Unauthorized'); 
    }

    // Attempt to parse JSON, handle cases with no content
    let responseData: T;
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
      // Handle No Content or non-JSON responses
      // If status is OK but no content, return null or handle as appropriate
      responseData = response.ok ? (null as T) : await response.text() as T; // Or throw error for non-ok text responses
    } else {
       responseData = await response.json();
    }

    if (!response.ok) {
      // Attempt to extract error message from JSON body, otherwise use status text
      const errorMessage = (typeof responseData === 'object' && responseData !== null && 'message' in responseData)
          ? (responseData as any).message
          : `HTTP error! Status: ${response.status} ${response.statusText}`;
      console.error(`[API Fetch Error] ${options.method || 'GET'} ${url}:`, errorMessage, responseData);
      throw new Error(errorMessage);
    }

    return responseData;

  } catch (error: any) {
    console.error(`[API Fetch Failed] ${options.method || 'GET'} ${url}:`, error);
    // Re-throw the error so the calling function can handle it (e.g., show UI message)
    // If it wasn't manually thrown (like 401 or !response.ok), add a generic message
    if (error.message === 'Unauthorized') {
        throw error; // Keep the specific Unauthorized error
    }
    throw new Error(error.message || 'Network request failed or an unexpected error occurred.');
  }
};

// Example Usage (in another store or component):
/*
import { apiFetch } from './api';

async function fetchChores() {
  try {
    const chores = await apiFetch<ChoreType[]>('/api/child/chores');
    // Update state with chores
  } catch (error) {
    console.error('Failed to fetch chores:', error.message);
    // Update state with error
  }
}

async function updateChore(choreId: string, updates: Partial<ChoreType>) {
   try {
     const updatedChore = await apiFetch<ChoreType>(
        `/api/parent/chores/${choreId}`,
        {
          method: 'PUT',
          body: updates,
        }
      );
      // Update state
   } catch (error) {
      console.error('Failed to update chore:', error.message);
      // Update state
   }
}
*/ 