// Simple test to understand React Query error handling
const { renderHook, act, waitFor } = require('@testing-library/react');
const { QueryClient, QueryClientProvider, useMutation } = require('@tanstack/react-query');
const React = require('react');

// Mock fetch globally
global.fetch = jest.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }) => React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// Simple mutation that should fail
function useTestMutation() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/test');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API Error');
      }
      return response.json();
    }
  });
}

async function runTest() {
  // Mock fetch to return error
  global.fetch.mockResolvedValue({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ error: 'Test error' })
  });

  const { result } = renderHook(() => useTestMutation(), {
    wrapper: createWrapper()
  });

  console.log('Initial state:', {
    isError: result.current.isError,
    isIdle: result.current.isIdle,
    isLoading: result.current.isLoading
  });

  await act(async () => {
    result.current.mutate({});
  });

  console.log('After mutate call:', {
    isError: result.current.isError,
    isIdle: result.current.isIdle,
    isLoading: result.current.isLoading
  });

  await waitFor(() => {
    console.log('In waitFor:', {
      isError: result.current.isError,
      isIdle: result.current.isIdle,
      isLoading: result.current.isLoading,
      error: result.current.error
    });
    return result.current.isError || result.current.isLoading === false;
  });

  console.log('Final state:', {
    isError: result.current.isError,
    isIdle: result.current.isIdle,
    isLoading: result.current.isLoading,
    error: result.current.error?.message
  });
}

runTest().catch(console.error);
