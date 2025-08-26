// Try-On History Storage Service
// Implements persistent storage for try-on history using localStorage with compression

import { 
  compressBase64, 
  getBase64Size, 
  CompressionFailedError 
} from '../utils/imageProcessing';
import type {
  TryonHistoryEntry,
  TryonHistoryCollection,
  TryonHistoryQueryOptions,
  CreateTryonHistoryEntryOptions,
  TryonHistoryService,
  TryonHistoryStorageConfig
} from '../types/history.types';

/**
 * Default configuration for history storage
 */
const DEFAULT_CONFIG: Required<TryonHistoryStorageConfig> = {
  storageType: 'localStorage',
  maxEntries: 50,
  maxEntrySizeKB: 2048, // 2MB per entry
  compressImages: true,
  compressionQuality: 0.8,
  autoCleanup: true,
  encryptionKey: ''
};

/**
 * Storage keys for localStorage
 */
const STORAGE_KEYS = {
  ENTRIES: 'susfit_tryon_history_entries',
  CONFIG: 'susfit_tryon_history_config',
  METADATA: 'susfit_tryon_history_metadata'
} as const;

/**
 * Generate a unique ID for history entries
 */
function generateHistoryId(): string {
  return `tryon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate the size of a history entry in KB
 */
function calculateEntrySize(entry: TryonHistoryEntry): number {
  const json = JSON.stringify(entry);
  return new Blob([json]).size / 1024;
}

/**
 * Compress images in a history entry
 */
async function compressHistoryEntry(
  entry: TryonHistoryEntry, 
  config: TryonHistoryStorageConfig
): Promise<TryonHistoryEntry> {
  if (!config.compressImages) {
    return entry;
  }

  try {
    const maxSizeKB = config.maxEntrySizeKB! / (2 + entry.apparelImages.length);
    const quality = config.compressionQuality!;

    // Compress generated image
    const compressedGenerated = await compressBase64(
      entry.generatedImage, 
      maxSizeKB
    );

    // Compress model image
    const compressedModel = await compressBase64(
      entry.modelImage, 
      maxSizeKB
    );

    // Compress apparel images
    const compressedApparel = await Promise.all(
      entry.apparelImages.map(img => compressBase64(img, maxSizeKB))
    );

    return {
      ...entry,
      generatedImage: compressedGenerated,
      modelImage: compressedModel,
      apparelImages: compressedApparel,
      metadata: {
        ...entry.metadata,
        imageProcessingResults: {
          ...entry.metadata?.imageProcessingResults,
          totalProcessingTime: entry.metadata?.imageProcessingResults?.totalProcessingTime || 0,
          finalImageSizes: {
            modelImageSize: getBase64Size(compressedModel),
            apparelImageSizes: compressedApparel.map(img => getBase64Size(img))
          }
        }
      }
    };
  } catch (error) {
    if (error instanceof CompressionFailedError) {
      console.warn('Failed to compress history entry images, using original', error);
      return entry;
    }
    throw error;
  }
}

/**
 * localStorage-based Try-On History Service implementation
 */
export class LocalStorageTryonHistoryService implements TryonHistoryService {
  private config: Required<TryonHistoryStorageConfig>;
  private isInitialized = false;

  constructor(config: Partial<TryonHistoryStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Don't initialize immediately - defer until first use
  }

  /**
   * Initialize localStorage storage (called lazily on first use)
   */
  private initializeStorage(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === 'undefined' || !window.localStorage) {
        throw new Error('localStorage is not available');
      }

      // Initialize config if not exists
      if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
      }

      // Initialize entries array if not exists
      if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
      }

      // Initialize metadata if not exists
      if (!localStorage.getItem(STORAGE_KEYS.METADATA)) {
        const metadata = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize history storage:', error);
      throw new Error('History storage initialization failed');
    }
  }

  /**
   * Ensure storage is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      this.initializeStorage();
    }
  }

  /**
   * Get all stored entries from localStorage
   */
  private getStoredEntries(): TryonHistoryEntry[] {
    this.ensureInitialized();
    try {
      const entriesJson = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      return entriesJson ? JSON.parse(entriesJson) : [];
    } catch (error) {
      console.error('Failed to parse stored entries:', error);
      return [];
    }
  }

  /**
   * Save entries to localStorage
   */
  private saveEntries(entries: TryonHistoryEntry[]): void {
    this.ensureInitialized();
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      // Update metadata
      const metadata = JSON.parse(localStorage.getItem(STORAGE_KEYS.METADATA) || '{}');
      metadata.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to save entries to localStorage:', error);
      throw new Error('Failed to save history entries');
    }
  }

  /**
   * Perform cleanup if needed
   */
  private performCleanupIfNeeded(entries: TryonHistoryEntry[]): TryonHistoryEntry[] {
    if (!this.config.autoCleanup || entries.length <= this.config.maxEntries) {
      return entries;
    }

    // Sort by timestamp and keep only the most recent entries
    const sorted = [...entries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sorted.slice(0, this.config.maxEntries);
  }

  /**
   * Filter and sort entries based on query options
   */
  private filterAndSortEntries(
    entries: TryonHistoryEntry[], 
    options: TryonHistoryQueryOptions = {}
  ): TryonHistoryEntry[] {
    let filtered = [...entries];

    // Apply favorites filter
    if (options.favoritesOnly) {
      filtered = filtered.filter(entry => entry.isFavorite);
    }

    // Apply date range filter
    if (options.dateRange) {
      const startDate = new Date(options.dateRange.startDate);
      const endDate = new Date(options.dateRange.endDate);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    // Apply search term filter
    if (options.searchTerm) {
      const searchTerm = options.searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        entry.notes?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    const sortBy = options.sortBy || 'timestamp';
    const sortDirection = options.sortDirection || 'desc';
    
    filtered.sort((a, b) => {
      let aValue: Date | number, bValue: Date | number;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'processingTime':
          aValue = a.processingTime || 0;
          bValue = b.processingTime || 0;
          break;
        case 'isFavorite':
          aValue = a.isFavorite ? 1 : 0;
          bValue = b.isFavorite ? 1 : 0;
          break;
        default:
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }

  /**
   * Add a new history entry
   */
  async addEntry(options: CreateTryonHistoryEntryOptions): Promise<TryonHistoryEntry> {
    const entry: TryonHistoryEntry = {
      id: generateHistoryId(),
      timestamp: new Date().toISOString(),
      generatedImage: options.generatedImage,
      modelImage: options.modelImage,
      apparelImages: options.apparelImages,
      processingTime: options.processingTime,
      metadata: options.metadata,
      tags: options.tags || [],
      isFavorite: options.isFavorite || false,
      notes: options.notes || ''
    };

    // Compress entry if enabled
    const compressedEntry = await compressHistoryEntry(entry, this.config);

    // Check entry size
    const entrySize = calculateEntrySize(compressedEntry);
    if (entrySize > this.config.maxEntrySizeKB) {
      throw new Error(
        `History entry too large: ${entrySize.toFixed(2)}KB exceeds limit of ${this.config.maxEntrySizeKB}KB`
      );
    }

    // Get current entries and add the new one
    let entries = this.getStoredEntries();
    entries.push(compressedEntry);

    // Perform cleanup if needed
    entries = this.performCleanupIfNeeded(entries);

    // Save updated entries
    this.saveEntries(entries);

    return compressedEntry;
  }

  /**
   * Get history entries with filtering and pagination
   */
  async getEntries(options: TryonHistoryQueryOptions = {}): Promise<TryonHistoryCollection> {
    const allEntries = this.getStoredEntries();
    const filteredEntries = this.filterAndSortEntries(allEntries, options);

    // Apply pagination
    const page = options.page || 0;
    const pageSize = options.pageSize || 20;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    return {
      entries: paginatedEntries,
      totalCount: filteredEntries.length,
      currentPage: page,
      pageSize,
      hasMore: endIndex < filteredEntries.length,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get a specific history entry by ID
   */
  async getEntry(id: string): Promise<TryonHistoryEntry | null> {
    const entries = this.getStoredEntries();
    return entries.find(entry => entry.id === id) || null;
  }

  /**
   * Update an existing history entry
   */
  async updateEntry(id: string, updates: Partial<TryonHistoryEntry>): Promise<TryonHistoryEntry> {
    const entries = this.getStoredEntries();
    const entryIndex = entries.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      throw new Error(`History entry with ID ${id} not found`);
    }

    // Apply updates
    const updatedEntry = { 
      ...entries[entryIndex], 
      ...updates,
      // Preserve ID and timestamp, update only if explicitly provided
      id: entries[entryIndex].id,
      timestamp: updates.timestamp || entries[entryIndex].timestamp
    };

    entries[entryIndex] = updatedEntry;
    this.saveEntries(entries);

    return updatedEntry;
  }

  /**
   * Delete a history entry
   */
  async deleteEntry(id: string): Promise<boolean> {
    const entries = this.getStoredEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    
    if (filteredEntries.length === entries.length) {
      return false; // Entry not found
    }

    this.saveEntries(filteredEntries);
    return true;
  }

  /**
   * Clear all history entries
   */
  async clearAll(): Promise<boolean> {
    this.ensureInitialized();
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalEntries: number;
    totalSizeKB: number;
    oldestEntry?: string;
    newestEntry?: string;
  }> {
    const entries = this.getStoredEntries();
    
    let totalSizeKB = 0;
    entries.forEach(entry => {
      totalSizeKB += calculateEntrySize(entry);
    });

    const timestamps = entries.map(entry => entry.timestamp).sort();
    
    return {
      totalEntries: entries.length,
      totalSizeKB,
      oldestEntry: timestamps[0],
      newestEntry: timestamps[timestamps.length - 1]
    };
  }

  /**
   * Export history data
   */
  async exportHistory(): Promise<TryonHistoryEntry[]> {
    return this.getStoredEntries();
  }

  /**
   * Import history data
   */
  async importHistory(entries: TryonHistoryEntry[]): Promise<number> {
    try {
      // Validate entries
      const validEntries = entries.filter(entry => 
        entry.id && entry.generatedImage && entry.modelImage && entry.apparelImages
      );

      // Get existing entries and merge with imports
      const existingEntries = this.getStoredEntries();
      const existingIds = new Set(existingEntries.map(entry => entry.id));
      
      // Only import entries that don't already exist
      const newEntries = validEntries.filter(entry => !existingIds.has(entry.id));
      
      if (newEntries.length === 0) {
        return 0;
      }

      // Merge and save
      const mergedEntries = [...existingEntries, ...newEntries];
      const cleanedEntries = this.performCleanupIfNeeded(mergedEntries);
      
      this.saveEntries(cleanedEntries);
      return newEntries.length;
    } catch (error) {
      console.error('Failed to import history:', error);
      throw new Error('History import failed');
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<TryonHistoryStorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.ensureInitialized();
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TryonHistoryStorageConfig {
    return { ...this.config };
  }
}

/**
 * Default history service instance
 */
export const defaultHistoryService = new LocalStorageTryonHistoryService();