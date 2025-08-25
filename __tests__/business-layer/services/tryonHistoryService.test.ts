/**
 * @jest-environment jsdom
 */

import { LocalStorageTryonHistoryService } from '../../../src/business-layer/services/tryonHistoryService';
import type {
  CreateTryonHistoryEntryOptions,
  TryonHistoryQueryOptions,
  TryonHistoryStorageConfig
} from '../../../src/business-layer/types/history.types';

// Mock localStorage with complete interface
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

// Ensure localStorage is properly available for the service's existence check
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
  enumerable: true
});

// Also set on global for extra compatibility
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
  enumerable: true
});

// Mock compression utilities
jest.mock('../../../src/business-layer/utils/imageProcessing', () => ({
  compressBase64: jest.fn((base64: string) => Promise.resolve(base64)),
  getBase64Size: jest.fn(() => 1024),
  CompressionFailedError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CompressionFailedError';
    }
  }
}));

describe('LocalStorageTryonHistoryService', () => {
  let historyService: LocalStorageTryonHistoryService;

  const sampleHistoryEntry: CreateTryonHistoryEntryOptions = {
    generatedImage: 'data:image/jpeg;base64,generated-image-data',
    modelImage: 'data:image/jpeg;base64,model-image-data',
    apparelImages: ['data:image/jpeg;base64,apparel-image-data'],
    processingTime: 5000,
    metadata: {
      modelVersion: '1.0.0',
      appliedQuality: 'high'
    },
    tags: ['test', 'sample'],
    notes: 'Test history entry'
  };

  beforeEach(() => {
    // Clear localStorage
    mockLocalStorage.clear();
    jest.clearAllMocks();
    
    // Create new service instance
    historyService = new LocalStorageTryonHistoryService();
  });

  describe('Initialization', () => {
    it('should initialize localStorage with default values', async () => {
      // Force initialization by calling a method
      await historyService.getEntries();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'susfit_tryon_history_config',
        expect.stringContaining('localStorage')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'susfit_tryon_history_entries',
        '[]'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'susfit_tryon_history_metadata',
        expect.stringContaining('version')
      );
    });

    it('should use custom configuration when provided', () => {
      const customConfig: Partial<TryonHistoryStorageConfig> = {
        maxEntries: 100,
        compressImages: false
      };
      
      const customService = new LocalStorageTryonHistoryService(customConfig);
      expect(customService.getConfig().maxEntries).toBe(100);
      expect(customService.getConfig().compressImages).toBe(false);
    });

    it('should handle localStorage unavailability gracefully', async () => {
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true
      });

      const testService = new LocalStorageTryonHistoryService();
      await expect(testService.getEntries()).rejects.toThrow('History storage initialization failed');

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        configurable: true
      });
    });
  });

  describe('Adding History Entries', () => {
    it('should add a new history entry successfully', async () => {
      const entry = await historyService.addEntry(sampleHistoryEntry);

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.generatedImage).toBe(sampleHistoryEntry.generatedImage);
      expect(entry.modelImage).toBe(sampleHistoryEntry.modelImage);
      expect(entry.apparelImages).toEqual(sampleHistoryEntry.apparelImages);
      expect(entry.processingTime).toBe(sampleHistoryEntry.processingTime);
      expect(entry.tags).toEqual(sampleHistoryEntry.tags);
      expect(entry.notes).toBe(sampleHistoryEntry.notes);

      // Verify localStorage was updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'susfit_tryon_history_entries',
        expect.stringContaining(entry.id)
      );
    });

    it('should generate unique IDs for entries', async () => {
      const entry1 = await historyService.addEntry(sampleHistoryEntry);
      const entry2 = await historyService.addEntry(sampleHistoryEntry);

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should apply default values for optional fields', async () => {
      const minimalEntry: CreateTryonHistoryEntryOptions = {
        generatedImage: 'generated',
        modelImage: 'model',
        apparelImages: ['apparel']
      };

      const entry = await historyService.addEntry(minimalEntry);

      expect(entry.tags).toEqual([]);
      expect(entry.isFavorite).toBe(false);
      expect(entry.notes).toBe('');
    });

    it('should handle compression when enabled', async () => {
      const compressEnabledService = new LocalStorageTryonHistoryService({
        compressImages: true,
        compressionQuality: 0.8
      });

      const entry = await compressEnabledService.addEntry(sampleHistoryEntry);

      expect(entry.id).toBeDefined();
      // Compression mock should have been called - access via jest.mocked
      const imageUtils = jest.mocked(require('../../../src/business-layer/utils/imageProcessing'));
      expect(imageUtils.compressBase64).toHaveBeenCalled();
    });
  });

  describe('Retrieving History Entries', () => {
    beforeEach(async () => {
      // Add some test entries
      await historyService.addEntry({
        ...sampleHistoryEntry,
        tags: ['tag1'],
        notes: 'First entry'
      });
      await historyService.addEntry({
        ...sampleHistoryEntry,
        tags: ['tag2'],
        notes: 'Second entry',
        isFavorite: true
      });
      await historyService.addEntry({
        ...sampleHistoryEntry,
        tags: ['tag1', 'tag2'],
        notes: 'Third entry'
      });
    });

    it('should retrieve all entries without options', async () => {
      const result = await historyService.getEntries();

      expect(result.entries).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.currentPage).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should apply pagination correctly', async () => {
      const options: TryonHistoryQueryOptions = {
        page: 0,
        pageSize: 2
      };

      const result = await historyService.getEntries(options);

      expect(result.entries).toHaveLength(2);
      expect(result.totalCount).toBe(3);
      expect(result.currentPage).toBe(0);
      expect(result.pageSize).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should filter by favorites only', async () => {
      const options: TryonHistoryQueryOptions = {
        favoritesOnly: true
      };

      const result = await historyService.getEntries(options);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].isFavorite).toBe(true);
    });

    it('should filter by search term', async () => {
      const options: TryonHistoryQueryOptions = {
        searchTerm: 'Second'
      };

      const result = await historyService.getEntries(options);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].notes).toContain('Second');
    });

    it('should sort entries correctly', async () => {
      const options: TryonHistoryQueryOptions = {
        sortBy: 'timestamp',
        sortDirection: 'asc'
      };

      const result = await historyService.getEntries(options);

      expect(result.entries).toHaveLength(3);
      // Should be in ascending order
      const timestamps = result.entries.map(e => new Date(e.timestamp).getTime());
      expect(timestamps[0]).toBeLessThanOrEqual(timestamps[1]);
      expect(timestamps[1]).toBeLessThanOrEqual(timestamps[2]);
    });
  });

  describe('Single Entry Operations', () => {
    let entryId: string;

    beforeEach(async () => {
      const entry = await historyService.addEntry(sampleHistoryEntry);
      entryId = entry.id;
    });

    it('should retrieve a specific entry by ID', async () => {
      const entry = await historyService.getEntry(entryId);

      expect(entry).not.toBeNull();
      expect(entry!.id).toBe(entryId);
      expect(entry!.generatedImage).toBe(sampleHistoryEntry.generatedImage);
    });

    it('should return null for non-existent entry', async () => {
      const entry = await historyService.getEntry('non-existent-id');

      expect(entry).toBeNull();
    });

    it('should update an existing entry', async () => {
      const updates = {
        notes: 'Updated notes',
        isFavorite: true,
        tags: ['updated', 'tags']
      };

      const updatedEntry = await historyService.updateEntry(entryId, updates);

      expect(updatedEntry.id).toBe(entryId);
      expect(updatedEntry.notes).toBe('Updated notes');
      expect(updatedEntry.isFavorite).toBe(true);
      expect(updatedEntry.tags).toEqual(['updated', 'tags']);
      // Original data should be preserved
      expect(updatedEntry.generatedImage).toBe(sampleHistoryEntry.generatedImage);
    });

    it('should throw error when updating non-existent entry', async () => {
      await expect(
        historyService.updateEntry('non-existent-id', { notes: 'test' })
      ).rejects.toThrow('History entry with ID non-existent-id not found');
    });

    it('should delete an entry successfully', async () => {
      const deleted = await historyService.deleteEntry(entryId);

      expect(deleted).toBe(true);

      // Entry should no longer exist
      const entry = await historyService.getEntry(entryId);
      expect(entry).toBeNull();
    });

    it('should return false when deleting non-existent entry', async () => {
      const deleted = await historyService.deleteEntry('non-existent-id');

      expect(deleted).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      // Add multiple test entries
      for (let i = 0; i < 5; i++) {
        await historyService.addEntry({
          ...sampleHistoryEntry,
          notes: `Entry ${i}`
        });
      }
    });

    it('should clear all entries', async () => {
      const cleared = await historyService.clearAll();

      expect(cleared).toBe(true);

      const result = await historyService.getEntries();
      expect(result.entries).toHaveLength(0);
    });

    it('should export all history data', async () => {
      const exported = await historyService.exportHistory();

      expect(exported).toHaveLength(5);
      expect(exported[0].notes).toContain('Entry');
    });

    it('should import history data', async () => {
      // Clear existing entries
      await historyService.clearAll();

      // Create import data
      const importData = [
        {
          id: 'import-1',
          timestamp: new Date().toISOString(),
          generatedImage: 'imported-generated',
          modelImage: 'imported-model',
          apparelImages: ['imported-apparel'],
          tags: ['imported'],
          notes: 'Imported entry',
          isFavorite: false
        }
      ];

      const importedCount = await historyService.importHistory(importData);

      expect(importedCount).toBe(1);

      const result = await historyService.getEntries();
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('import-1');
    });

    it('should not import duplicate entries', async () => {
      const existingEntries = await historyService.exportHistory();
      const duplicateImport = existingEntries.slice(0, 2); // Try to import first 2 existing entries

      const importedCount = await historyService.importHistory(duplicateImport);

      expect(importedCount).toBe(0); // No new entries should be imported
    });
  });

  describe('Storage Statistics', () => {
    beforeEach(async () => {
      // Add test entries with different timestamps
      await historyService.addEntry({
        ...sampleHistoryEntry,
        notes: 'First entry'
      });
      
      // Add slight delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await historyService.addEntry({
        ...sampleHistoryEntry,
        notes: 'Last entry'
      });
    });

    it('should return accurate storage statistics', async () => {
      const stats = await historyService.getStorageStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.totalSizeKB).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
      expect(new Date(stats.oldestEntry!).getTime()).toBeLessThanOrEqual(
        new Date(stats.newestEntry!).getTime()
      );
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        maxEntries: 200,
        compressImages: false
      };

      historyService.updateConfig(newConfig);

      const config = historyService.getConfig();
      expect(config.maxEntries).toBe(200);
      expect(config.compressImages).toBe(false);
    });

    it('should perform cleanup when maxEntries is exceeded', async () => {
      // Set low max entries limit
      historyService.updateConfig({ maxEntries: 2 });

      // Add more entries than the limit with small delays to ensure different timestamps
      await historyService.addEntry({ ...sampleHistoryEntry, notes: 'Entry 1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await historyService.addEntry({ ...sampleHistoryEntry, notes: 'Entry 2' });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await historyService.addEntry({ ...sampleHistoryEntry, notes: 'Entry 3' });

      const result = await historyService.getEntries();

      // Should only keep the most recent entries (sorted by timestamp desc)
      expect(result.entries).toHaveLength(2);
      
      // The most recent entries should be kept (Entry 2 and Entry 3)
      // Entry 1 should be removed as it's the oldest
      const entryNotes = result.entries.map(e => e.notes);
      expect(entryNotes).toContain('Entry 2');
      expect(entryNotes).toContain('Entry 3');
      expect(entryNotes).not.toContain('Entry 1');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage write errors gracefully', async () => {
      // Mock localStorage.setItem to throw an error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage full');
      });

      await expect(
        historyService.addEntry(sampleHistoryEntry)
      ).rejects.toThrow('History storage initialization failed');
    });

    it('should handle corrupted localStorage data', () => {
      // Set corrupted data in localStorage
      mockLocalStorage.getItem.mockReturnValueOnce('invalid-json');

      // Should return empty array instead of throwing
      const entries = (historyService as any).getStoredEntries();
      expect(entries).toEqual([]);
    });
  });
});