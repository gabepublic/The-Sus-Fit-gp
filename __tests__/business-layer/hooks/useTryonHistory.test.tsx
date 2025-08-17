/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTryonHistory, useTryonHistoryEntry, useTryonHistoryStats } from '../../../src/business-layer/hooks/useTryonHistory';
import type { 
  TryonHistoryService, 
  TryonHistoryEntry, 
  TryonHistoryCollection,
  CreateTryonHistoryEntryOptions 
} from '../../../src/business-layer/types/history.types';

// Mock history service
const mockHistoryService: TryonHistoryService = {
  addEntry: jest.fn(),
  getEntries: jest.fn(),
  getEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  clearAll: jest.fn(),
  getStorageStats: jest.fn(),
  exportHistory: jest.fn(),
  importHistory: jest.fn()
};

// Test data
const sampleHistoryEntry: TryonHistoryEntry = {
  id: 'test-entry-1',
  timestamp: '2023-01-01T00:00:00Z',
  generatedImage: 'data:image/jpeg;base64,generated',
  modelImage: 'data:image/jpeg;base64,model',
  apparelImages: ['data:image/jpeg;base64,apparel'],
  processingTime: 5000,
  tags: ['test'],
  notes: 'Test entry',
  isFavorite: false
};

const sampleHistoryCollection: TryonHistoryCollection = {
  entries: [sampleHistoryEntry],
  totalCount: 1,
  currentPage: 0,
  pageSize: 20,
  hasMore: false,
  lastUpdated: '2023-01-01T00:00:00Z'
};

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTryonHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (mockHistoryService.getEntries as jest.Mock).mockResolvedValue(sampleHistoryCollection);
    (mockHistoryService.addEntry as jest.Mock).mockResolvedValue(sampleHistoryEntry);
    (mockHistoryService.updateEntry as jest.Mock).mockResolvedValue(sampleHistoryEntry);
    (mockHistoryService.deleteEntry as jest.Mock).mockResolvedValue(true);
    (mockHistoryService.clearAll as jest.Mock).mockResolvedValue(true);
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }), 
        { wrapper }
      );

      expect(result.current.entries).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalCount).toBe(0);

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toEqual([sampleHistoryEntry]);
      expect(result.current.totalCount).toBe(1);
    });

    it('should call getEntries with correct options', async () => {
      const wrapper = createWrapper();
      const queryOptions = {
        page: 0,
        pageSize: 10,
        sortBy: 'timestamp' as const,
        sortDirection: 'desc' as const
      };

      renderHook(() => 
        useTryonHistory(queryOptions, { historyService: mockHistoryService }),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockHistoryService.getEntries).toHaveBeenCalledWith({
          page: 0,
          pageSize: 10,
          sortBy: 'timestamp',
          sortDirection: 'desc'
        });
      });
    });

    it('should handle loading states correctly', async () => {
      const wrapper = createWrapper();
      
      // Make getEntries return a pending promise
      let resolveGetEntries: (value: TryonHistoryCollection) => void;
      const pendingPromise = new Promise<TryonHistoryCollection>((resolve) => {
        resolveGetEntries = resolve;
      });
      (mockHistoryService.getEntries as jest.Mock).mockReturnValue(pendingPromise);

      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      act(() => {
        resolveGetEntries!(sampleHistoryCollection);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.entries).toEqual([sampleHistoryEntry]);
    });
  });

  describe('Adding Entries', () => {
    it('should add new entry successfully', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newEntryOptions: CreateTryonHistoryEntryOptions = {
        generatedImage: 'new-generated',
        modelImage: 'new-model',
        apparelImages: ['new-apparel'],
        notes: 'New entry'
      };

      await act(async () => {
        await result.current.addEntry(newEntryOptions);
      });

      expect(mockHistoryService.addEntry).toHaveBeenCalledWith(newEntryOptions);
    });

    it('should handle add entry errors', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      const error = new Error('Failed to add entry');
      (mockHistoryService.addEntry as jest.Mock).mockRejectedValue(error);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newEntryOptions: CreateTryonHistoryEntryOptions = {
        generatedImage: 'new-generated',
        modelImage: 'new-model',
        apparelImages: ['new-apparel']
      };

      await expect(
        act(async () => {
          await result.current.addEntry(newEntryOptions);
        })
      ).rejects.toThrow('Failed to add entry');
    });
  });

  describe('Updating Entries', () => {
    it('should update entry successfully', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updates = { notes: 'Updated notes', isFavorite: true };

      await act(async () => {
        await result.current.updateEntry('test-entry-1', updates);
      });

      expect(mockHistoryService.updateEntry).toHaveBeenCalledWith('test-entry-1', updates);
    });
  });

  describe('Deleting Entries', () => {
    it('should delete entry successfully', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteEntry('test-entry-1');
      });

      expect(mockHistoryService.deleteEntry).toHaveBeenCalledWith('test-entry-1');
    });
  });

  describe('Load More Functionality', () => {
    it('should load more entries when hasMore is true', async () => {
      const wrapper = createWrapper();
      const collectionWithMore: TryonHistoryCollection = {
        ...sampleHistoryCollection,
        hasMore: true
      };
      
      (mockHistoryService.getEntries as jest.Mock).mockResolvedValue(collectionWithMore);

      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);

      // Setup next page response
      const nextPageCollection: TryonHistoryCollection = {
        entries: [{ ...sampleHistoryEntry, id: 'test-entry-2' }],
        totalCount: 2,
        currentPage: 1,
        pageSize: 20,
        hasMore: false,
        lastUpdated: '2023-01-01T00:00:00Z'
      };
      
      (mockHistoryService.getEntries as jest.Mock).mockResolvedValueOnce(nextPageCollection);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockHistoryService.getEntries).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      );
    });

    it('should not load more when hasMore is false', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);

      // Should not make additional calls
      const initialCallCount = (mockHistoryService.getEntries as jest.Mock).mock.calls.length;

      await act(async () => {
        await result.current.loadMore();
      });

      expect((mockHistoryService.getEntries as jest.Mock).mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh entries', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      // Should trigger a refetch
      expect(mockHistoryService.getEntries).toHaveBeenCalledTimes(2);
    });
  });

  describe('Clear All Functionality', () => {
    it('should clear all entries', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useTryonHistory({}, { historyService: mockHistoryService }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.clearAll();
      });

      expect(mockHistoryService.clearAll).toHaveBeenCalled();
    });
  });
});

describe('useTryonHistoryEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockHistoryService.getEntry as jest.Mock).mockResolvedValue(sampleHistoryEntry);
  });

  it('should fetch single entry by ID', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => 
      useTryonHistoryEntry('test-entry-1', { historyService: mockHistoryService }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockHistoryService.getEntry).toHaveBeenCalledWith('test-entry-1');
    expect(result.current.data).toEqual(sampleHistoryEntry);
  });

  it('should not fetch when ID is empty', async () => {
    const wrapper = createWrapper();
    renderHook(() => 
      useTryonHistoryEntry('', { historyService: mockHistoryService }),
      { wrapper }
    );

    // Should not make any calls when ID is empty
    expect(mockHistoryService.getEntry).not.toHaveBeenCalled();
  });

  it('should handle entry not found', async () => {
    const wrapper = createWrapper();
    (mockHistoryService.getEntry as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => 
      useTryonHistoryEntry('non-existent-id', { historyService: mockHistoryService }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(null);
  });
});

describe('useTryonHistoryStats', () => {
  const mockStats = {
    totalEntries: 10,
    totalSizeKB: 1024,
    oldestEntry: '2023-01-01T00:00:00Z',
    newestEntry: '2023-01-02T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockHistoryService.getStorageStats as jest.Mock).mockResolvedValue(mockStats);
  });

  it('should fetch storage statistics', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => 
      useTryonHistoryStats({ historyService: mockHistoryService }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockHistoryService.getStorageStats).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockStats);
  });

  it('should handle stats loading error', async () => {
    const wrapper = createWrapper();
    const error = new Error('Failed to get stats');
    (mockHistoryService.getStorageStats as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => 
      useTryonHistoryStats({ historyService: mockHistoryService }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});