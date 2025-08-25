/**
 * @jest-environment jsdom
 */

import { 
  createHistoryIntegratedCallbacks,
  createHistoryEntryFromMutation,
  createShareableHistoryEntry
} from '../../../src/business-layer/utils/historyIntegration';
import type {
  TryonMutationResponse,
  TryonMutationVariables,
  TryonMutationContext,
  UseTryonMutationConfig
} from '../../../src/business-layer/types/tryon.types';
import type { TryonHistoryService } from '../../../src/business-layer/types/history.types';

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
const mockMutationResponse: TryonMutationResponse = {
  img_generated: 'data:image/jpeg;base64,generated-image',
  metadata: {
    modelVersion: '1.0.0',
    appliedQuality: 'high',
    processingTime: 3000
  }
};

const mockMutationVariables: TryonMutationVariables = {
  modelImage: 'data:image/jpeg;base64,model-image',
  apparelImages: ['data:image/jpeg;base64,apparel-image'],
  options: {
    quality: 'high',
    timeout: 30000,
    imageProcessing: {
      targetWidth: 1024,
      targetHeight: 1536,
      compressionQuality: 0.9
    }
  }
};

const mockMutationContext: TryonMutationContext = {
  variables: mockMutationVariables,
  startTime: Date.now() - 5000,
  retryCount: 0,
  imageProcessingResults: {
    totalProcessingTime: 2000,
    modelImageResult: {
      originalSize: 2048,
      finalSize: 1024,
      processedImage: 'processed-model',
      originalDimensions: { width: 1920, height: 1080 },
      finalDimensions: { width: 1024, height: 1536 },
      metadata: {
        wasResized: true,
        wasCompressed: true,
        compressionRatio: 0.5,
        processingTime: 1000
      }
    },
    apparelImageResults: [{
      originalSize: 1536,
      finalSize: 768,
      processedImage: 'processed-apparel',
      originalDimensions: { width: 1920, height: 1080 },
      finalDimensions: { width: 1024, height: 1536 },
      metadata: {
        wasResized: true,
        wasCompressed: true,
        compressionRatio: 0.5,
        processingTime: 1000
      }
    }]
  }
};

const mockHistoryEntry = {
  id: 'test-entry-1',
  timestamp: '2023-01-01T00:00:00Z',
  generatedImage: mockMutationResponse.img_generated,
  modelImage: mockMutationVariables.modelImage,
  apparelImages: mockMutationVariables.apparelImages,
  processingTime: 5000,
  tags: ['test'],
  notes: 'Test entry',
  isFavorite: false,
  metadata: {
    modelVersion: '1.0.0',
    appliedQuality: 'high'
  }
};

describe('createHistoryIntegratedCallbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockHistoryService.addEntry as jest.Mock).mockResolvedValue(mockHistoryEntry);
    
    // Mock console.log and console.error
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onSuccess callback', () => {
    it('should auto-save to history when enabled', async () => {
      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService,
        autoSave: true
      });

      await callbacks.onSuccess!(mockMutationResponse, mockMutationVariables, mockMutationContext);

      expect(mockHistoryService.addEntry).toHaveBeenCalledWith({
        generatedImage: mockMutationResponse.img_generated,
        modelImage: mockMutationVariables.modelImage,
        apparelImages: mockMutationVariables.apparelImages,
        processingTime: expect.any(Number),
        metadata: {
          modelVersion: mockMutationResponse.metadata?.modelVersion,
          appliedQuality: mockMutationResponse.metadata?.appliedQuality,
          processingConfig: {
            imageProcessing: mockMutationVariables.options?.imageProcessing,
            requestOptions: {
              timeout: mockMutationVariables.options?.timeout,
              quality: mockMutationVariables.options?.quality
            }
          },
          imageProcessingResults: mockMutationContext.imageProcessingResults
        },
        tags: [],
        isFavorite: false
      });

      expect(console.log).toHaveBeenCalledWith('Successfully saved try-on result to history');
    });

    it('should not save to history when autoSave is disabled', async () => {
      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService,
        autoSave: false
      });

      await callbacks.onSuccess!(mockMutationResponse, mockMutationVariables, mockMutationContext);

      expect(mockHistoryService.addEntry).not.toHaveBeenCalled();
    });

    it('should apply default tags', async () => {
      const defaultTags = ['auto-saved', 'production'];
      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService,
        autoSave: true,
        defaultTags
      });

      await callbacks.onSuccess!(mockMutationResponse, mockMutationVariables, mockMutationContext);

      expect(mockHistoryService.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: defaultTags
        })
      );
    });

    it('should apply custom transformations', async () => {
      const transformHistoryEntry = jest.fn().mockReturnValue({
        tags: ['custom-tag'],
        notes: 'Custom notes',
        isFavorite: true
      });

      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService,
        autoSave: true,
        transformHistoryEntry
      });

      await callbacks.onSuccess!(mockMutationResponse, mockMutationVariables, mockMutationContext);

      expect(transformHistoryEntry).toHaveBeenCalledWith(
        mockMutationResponse,
        mockMutationVariables,
        mockMutationContext
      );

      expect(mockHistoryService.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['custom-tag'],
          notes: 'Custom notes',
          isFavorite: true
        })
      );
    });

    it('should call user-provided onSuccess callback', async () => {
      const userOnSuccess = jest.fn();
      const userConfig: UseTryonMutationConfig = {
        onSuccess: userOnSuccess
      };

      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService,
        autoSave: true
      }, userConfig);

      await callbacks.onSuccess!(mockMutationResponse, mockMutationVariables, mockMutationContext);

      expect(userOnSuccess).toHaveBeenCalledWith(
        mockMutationResponse,
        mockMutationVariables,
        mockMutationContext
      );
    });

    it('should handle history save errors gracefully', async () => {
      const saveError = new Error('History save failed');
      (mockHistoryService.addEntry as jest.Mock).mockRejectedValue(saveError);

      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService,
        autoSave: true
      });

      // Should not throw error
      await expect(
        callbacks.onSuccess!(mockMutationResponse, mockMutationVariables, mockMutationContext)
      ).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save try-on result to history:',
        saveError
      );
    });
  });

  describe('onError callback', () => {
    const mockError = {
      error: 'Network error',
      code: 'NETWORK_ERROR',
      retryable: true
    };

    it('should track errors when enabled', async () => {
      const contextWithError = {
        ...mockMutationContext,
        retryCount: 1,
        previousError: new Error('Previous error')
      };

      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService,
        trackErrors: true
      });

      await callbacks.onError!(mockError, mockMutationVariables, contextWithError);

      expect(console.log).toHaveBeenCalledWith(
        'Error tracked for history integration:',
        expect.objectContaining({
          error: 'Network error',
          timestamp: expect.any(String),
          retryAttempt: 1
        })
      );
    });

    it('should not track errors when disabled', async () => {
      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService,
        trackErrors: false
      });

      await callbacks.onError!(mockError, mockMutationVariables, mockMutationContext);

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should call user-provided onError callback', async () => {
      const userOnError = jest.fn();
      const userConfig: UseTryonMutationConfig = {
        onError: userOnError
      };

      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService
      }, userConfig);

      await callbacks.onError!(mockError, mockMutationVariables, mockMutationContext);

      expect(userOnError).toHaveBeenCalledWith(
        mockError,
        mockMutationVariables,
        mockMutationContext
      );
    });
  });

  describe('onSettled callback', () => {
    it('should call user-provided onSettled callback', async () => {
      const userOnSettled = jest.fn();
      const userConfig: UseTryonMutationConfig = {
        onSettled: userOnSettled
      };

      const callbacks = createHistoryIntegratedCallbacks({
        historyService: mockHistoryService
      }, userConfig);

      await callbacks.onSettled!(
        mockMutationResponse,
        null,
        mockMutationVariables,
        mockMutationContext
      );

      expect(userOnSettled).toHaveBeenCalledWith(
        mockMutationResponse,
        null,
        mockMutationVariables,
        mockMutationContext
      );
    });
  });
});

describe('createHistoryEntryFromMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockHistoryService.addEntry as jest.Mock).mockResolvedValue(mockHistoryEntry);
  });

  it('should create history entry with correct data', async () => {
    await createHistoryEntryFromMutation(
      mockMutationResponse,
      mockMutationVariables,
      mockMutationContext,
      { historyService: mockHistoryService }
    );

    expect(mockHistoryService.addEntry).toHaveBeenCalledWith({
      generatedImage: mockMutationResponse.img_generated,
      modelImage: mockMutationVariables.modelImage,
      apparelImages: mockMutationVariables.apparelImages,
      processingTime: expect.any(Number),
      metadata: {
        modelVersion: mockMutationResponse.metadata?.modelVersion,
        appliedQuality: mockMutationResponse.metadata?.appliedQuality,
        processingConfig: {
          imageProcessing: mockMutationVariables.options?.imageProcessing,
          requestOptions: {
            timeout: mockMutationVariables.options?.timeout,
            quality: mockMutationVariables.options?.quality
          }
        },
        imageProcessingResults: mockMutationContext.imageProcessingResults
      },
      tags: [],
      notes: undefined,
      isFavorite: false
    });
  });

  it('should apply additional options', async () => {
    const options = {
      historyService: mockHistoryService,
      additionalTags: ['manual', 'test'],
      notes: 'Manual entry',
      isFavorite: true
    };

    await createHistoryEntryFromMutation(
      mockMutationResponse,
      mockMutationVariables,
      mockMutationContext,
      options
    );

    expect(mockHistoryService.addEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['manual', 'test'],
        notes: 'Manual entry',
        isFavorite: true
      })
    );
  });

  it('should calculate processing time correctly', async () => {
    const contextWithStartTime = {
      ...mockMutationContext,
      startTime: Date.now() - 3000 // 3 seconds ago
    };

    await createHistoryEntryFromMutation(
      mockMutationResponse,
      mockMutationVariables,
      contextWithStartTime,
      { historyService: mockHistoryService }
    );

    const addEntryCall = (mockHistoryService.addEntry as jest.Mock).mock.calls[0][0];
    expect(addEntryCall.processingTime).toBeGreaterThan(2000);
    expect(addEntryCall.processingTime).toBeLessThan(4000);
  });

  it('should handle missing startTime', async () => {
    const contextWithoutStartTime = {
      ...mockMutationContext,
      startTime: undefined as any
    };

    await createHistoryEntryFromMutation(
      mockMutationResponse,
      mockMutationVariables,
      contextWithoutStartTime,
      { historyService: mockHistoryService }
    );

    const addEntryCall = (mockHistoryService.addEntry as jest.Mock).mock.calls[0][0];
    expect(addEntryCall.processingTime).toBeUndefined();
  });
});

describe('createShareableHistoryEntry', () => {
  it('should create shareable entry with limited data', () => {
    const shareableEntry = createShareableHistoryEntry(mockHistoryEntry);

    expect(shareableEntry).toEqual({
      id: mockHistoryEntry.id,
      timestamp: mockHistoryEntry.timestamp,
      generatedImage: mockHistoryEntry.generatedImage,
      processingTime: mockHistoryEntry.processingTime,
      tags: mockHistoryEntry.tags,
      isFavorite: mockHistoryEntry.isFavorite,
      notes: mockHistoryEntry.notes,
      metadata: {
        modelVersion: mockHistoryEntry.metadata?.modelVersion,
        appliedQuality: mockHistoryEntry.metadata?.appliedQuality,
        processingTime: mockHistoryEntry.processingTime
      }
    });

    // Should not include original images
    expect(shareableEntry).not.toHaveProperty('modelImage');
    expect(shareableEntry).not.toHaveProperty('apparelImages');
  });

  it('should handle missing metadata gracefully', () => {
    const entryWithoutMetadata = {
      ...mockHistoryEntry,
      metadata: undefined
    };

    const shareableEntry = createShareableHistoryEntry(entryWithoutMetadata);

    expect(shareableEntry.metadata).toEqual({
      modelVersion: undefined,
      appliedQuality: undefined,
      processingTime: entryWithoutMetadata.processingTime
    });
  });
});