// Share History Management Types
// TypeScript interfaces for try-on history tracking and persistence

/**
 * Individual try-on history entry
 */
export interface TryonHistoryEntry {
  /** Unique identifier for this history entry */
  id: string;
  /** Base64 encoded generated try-on result image */
  generatedImage: string;
  /** Base64 encoded original model/user image */
  modelImage: string;
  /** Array of base64 encoded apparel images used */
  apparelImages: string[];
  /** ISO timestamp when the try-on was created */
  timestamp: string;
  /** Processing time in milliseconds */
  processingTime?: number;
  /** Additional metadata from the API response */
  metadata?: TryonHistoryMetadata;
  /** User-provided tags or labels */
  tags?: string[];
  /** Whether this entry is marked as favorite */
  isFavorite?: boolean;
  /** Optional user notes about this try-on */
  notes?: string;
}

/**
 * Metadata associated with a try-on history entry
 */
export interface TryonHistoryMetadata {
  /** API model version used for generation */
  modelVersion?: string;
  /** Processing quality level applied */
  appliedQuality?: string;
  /** Processing configuration used */
  processingConfig?: {
    /** Image processing settings */
    imageProcessing?: {
      targetWidth?: number;
      targetHeight?: number;
      compressionQuality?: number;
      maxSizeKB?: number;
    };
    /** API request options */
    requestOptions?: {
      timeout?: number;
      quality?: string;
    };
  };
  /** Error information if the generation initially failed but was retried */
  errorHistory?: Array<{
    error: string;
    timestamp: string;
    retryAttempt: number;
  }>;
  /** Image processing results */
  imageProcessingResults?: {
    /** Model image processing duration */
    modelImageProcessingTime?: number;
    /** Apparel images processing duration */
    apparelImagesProcessingTime?: number;
    /** Total processing time for all images */
    totalProcessingTime: number;
    /** Final image sizes after processing */
    finalImageSizes?: {
      modelImageSize: number;
      apparelImageSizes: number[];
    };
  };
}

/**
 * Collection of try-on history entries with pagination
 */
export interface TryonHistoryCollection {
  /** Array of history entries */
  entries: TryonHistoryEntry[];
  /** Total number of entries available */
  totalCount: number;
  /** Current page number (0-indexed) */
  currentPage: number;
  /** Number of entries per page */
  pageSize: number;
  /** Whether there are more entries available */
  hasMore: boolean;
  /** Timestamp of last update to this collection */
  lastUpdated: string;
}

/**
 * Options for querying history entries
 */
export interface TryonHistoryQueryOptions {
  /** Page number to retrieve (0-indexed) */
  page?: number;
  /** Number of entries per page */
  pageSize?: number;
  /** Sort order for entries */
  sortBy?: 'timestamp' | 'processingTime' | 'isFavorite';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Filter to only favorites */
  favoritesOnly?: boolean;
  /** Search term to filter by tags or notes */
  searchTerm?: string;
  /** Date range filter */
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Options for creating a new history entry
 */
export interface CreateTryonHistoryEntryOptions {
  /** Base64 encoded generated image (required) */
  generatedImage: string;
  /** Base64 encoded model image (required) */
  modelImage: string;
  /** Array of base64 encoded apparel images (required) */
  apparelImages: string[];
  /** Processing time in milliseconds */
  processingTime?: number;
  /** Additional metadata */
  metadata?: TryonHistoryMetadata;
  /** User-provided tags */
  tags?: string[];
  /** User notes */
  notes?: string;
  /** Mark as favorite immediately */
  isFavorite?: boolean;
}

/**
 * History storage configuration
 */
export interface TryonHistoryStorageConfig {
  /** Storage backend type */
  storageType: 'localStorage' | 'indexedDB' | 'memory';
  /** Maximum number of entries to store */
  maxEntries?: number;
  /** Maximum size per entry in KB */
  maxEntrySizeKB?: number;
  /** Whether to compress stored images */
  compressImages?: boolean;
  /** Compression quality for stored images (0.1-1.0) */
  compressionQuality?: number;
  /** Auto-cleanup older entries when limit is reached */
  autoCleanup?: boolean;
  /** Encryption key for sensitive data (future enhancement) */
  encryptionKey?: string;
}

/**
 * History service interface
 */
export interface TryonHistoryService {
  /** Add a new history entry */
  addEntry(options: CreateTryonHistoryEntryOptions): Promise<TryonHistoryEntry>;
  
  /** Get history entries with optional filtering and pagination */
  getEntries(options?: TryonHistoryQueryOptions): Promise<TryonHistoryCollection>;
  
  /** Get a specific history entry by ID */
  getEntry(id: string): Promise<TryonHistoryEntry | null>;
  
  /** Update an existing history entry */
  updateEntry(id: string, updates: Partial<TryonHistoryEntry>): Promise<TryonHistoryEntry>;
  
  /** Delete a history entry */
  deleteEntry(id: string): Promise<boolean>;
  
  /** Clear all history entries */
  clearAll(): Promise<boolean>;
  
  /** Get storage statistics */
  getStorageStats(): Promise<{
    totalEntries: number;
    totalSizeKB: number;
    oldestEntry?: string;
    newestEntry?: string;
  }>;
  
  /** Export history data */
  exportHistory(): Promise<TryonHistoryEntry[]>;
  
  /** Import history data */
  importHistory(entries: TryonHistoryEntry[]): Promise<number>;
}

/**
 * History hooks return types
 */
export interface UseTryonHistoryReturn {
  /** Current history entries */
  entries: TryonHistoryEntry[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether there are more entries to load */
  hasMore: boolean;
  /** Current page number */
  currentPage: number;
  /** Total number of entries */
  totalCount: number;
  /** Add a new entry */
  addEntry: (options: CreateTryonHistoryEntryOptions) => Promise<TryonHistoryEntry>;
  /** Update an existing entry */
  updateEntry: (id: string, updates: Partial<TryonHistoryEntry>) => Promise<void>;
  /** Delete an entry */
  deleteEntry: (id: string) => Promise<void>;
  /** Load more entries */
  loadMore: () => Promise<void>;
  /** Refresh current entries */
  refresh: () => Promise<void>;
  /** Clear all entries */
  clearAll: () => Promise<void>;
}

/**
 * History context value type
 */
export interface TryonHistoryContextValue {
  /** History service instance */
  historyService: TryonHistoryService;
  /** Current configuration */
  config: TryonHistoryStorageConfig;
  /** Update configuration */
  updateConfig: (config: Partial<TryonHistoryStorageConfig>) => void;
}