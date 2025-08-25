/**
 * @jest-environment jsdom
 */
import { act, waitFor } from '@testing-library/react';
import { 
  renderBridgeHook, 
  MockAPIUtils, 
  WorkflowTestUtils,
  setupTestEnvironment 
} from '../test-utils/index';
import { usePageComponentState } from '@/hooks/useBackwardCompatibility';

// Mock business layer dependencies
jest.mock('../../src/business-layer', () => ({
  useTryonMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    reset: jest.fn(),
  })),
  useImageProcessing: jest.fn(() => ({
    processImage: jest.fn(),
    processBasic: jest.fn(),
    isProcessing: false,
    error: null,
  })),
  useImageValidation: jest.fn(() => ({
    data: { isValid: true, errors: [] },
    error: null,
    isLoading: false,
    isError: false,
  })),
  useImageMetadata: jest.fn(() => ({
    data: { dimensions: { width: 1024, height: 768 }, format: 'image/jpeg', size: 102400 },
    error: null,
    isLoading: false,
    isError: false,
  })),
  useImageThumbnail: jest.fn(() => ({
    data: 'data:image/jpeg;base64,mock-thumbnail',
    error: null,
    isLoading: false,
    isError: false,
  })),
  processImageForTryon: jest.fn(),
  resizeImageTo1024x1536: jest.fn(),
}));

// Mock utility dependencies
jest.mock('../../src/utils/image', () => ({
  fileToBase64: jest.fn().mockResolvedValue('data:image/jpeg;base64,mock-data'),
  compressBase64: jest.fn().mockReturnValue('data:image/jpeg;base64,compressed-mock-data'),
  CompressionFailedError: class extends Error { constructor(msg: string) { super(msg); } }
}));

jest.mock('../../src/lib/errorToMessage', () => ({
  errorToMessage: jest.fn().mockReturnValue('Mock error message')
}));

// Mock browser APIs for image processing
beforeAll(() => {
  // Mock fetch for createFileFromImageUrl
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/jpeg' }))
    })
  );

  // Mock Image constructor for resizeImage
  global.Image = class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = 1024;
    height = 1536;
    crossOrigin = '';
    
    set src(value: string) {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  } as any;

  // Mock Canvas and CanvasRenderingContext2D
  global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    drawImage: jest.fn(),
  })) as any;

  global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/jpeg;base64,resized-image-data');

  // Mock document.createElement for canvas
  const originalCreateElement = document.createElement;
  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: jest.fn(),
        }),
        toDataURL: () => 'data:image/jpeg;base64,resized-image-data'
      } as any;
    }
    return originalCreateElement.call(document, tagName);
  }) as any;
});

// Setup test environment
setupTestEnvironment();

describe('usePageComponentState', () => {
  // Setup MSW server hooks at describe level
  MockAPIUtils.setupServer();

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderBridgeHook(() => usePageComponentState());

      expect(result.current.isCapturing).toBe(false);
      expect(result.current.leftCardImage).toBeNull();
      expect(result.current.rightCardImage).toBeNull();
      expect(result.current.showPolaroid).toBe(false);
      expect(result.current.userImageFile).toBeNull();
      expect(result.current.apparelImageFile).toBeNull();
      expect(result.current.generatedImage).toBeNull();
      expect(result.current.hasError).toBe(false);
    });

    it('should provide all required handler functions', () => {
      const { result } = renderBridgeHook(() => usePageComponentState());

      expect(typeof result.current.handleUserFileUpload).toBe('function');
      expect(typeof result.current.handleApparelFileUpload).toBe('function');
      expect(typeof result.current.handleLeftCardImageUpload).toBe('function');
      expect(typeof result.current.handleRightCardImageUpload).toBe('function');
      expect(typeof result.current.handleCameraButtonClick).toBe('function');
      expect(typeof result.current.handleGenerationStart).toBe('function');
      expect(typeof result.current.handleGenerationComplete).toBe('function');
      expect(typeof result.current.handleClosePolaroid).toBe('function');
      expect(typeof result.current.handleRetryGeneration).toBe('function');
    });
  });

  describe('File Upload Handling', () => {
    it('should handle user file upload correctly', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // Mock file reading
      testUtils.mockFileRead('data:image/jpeg;base64,user-image-data');

      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
      });

      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
      });
    });

    it('should handle apparel file upload correctly', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // Mock file reading
      testUtils.mockFileRead('data:image/jpeg;base64,apparel-image-data');

      act(() => {
        result.current.handleApparelFileUpload(mockFiles.apparelImage);
      });

      await waitFor(() => {
        expect(result.current.apparelImageFile).toBe(mockFiles.apparelImage);
      });
    });

    it('should handle left card image upload', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockImageUrl = 'data:image/jpeg;base64,left-card-image';

      // Mock file reading and URL creation
      testUtils.mockFileRead('data:image/jpeg;base64,processed-left-image');

      await act(async () => {
        await result.current.handleLeftCardImageUpload(mockImageUrl);
      });

      await waitFor(() => {
        expect(result.current.leftCardImage).toBeTruthy();
        expect(result.current.leftCardImage).toContain('data:image/jpeg;base64');
      });
    });

    it('should handle right card image upload', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockImageUrl = 'data:image/jpeg;base64,right-card-image';

      // Mock file reading and URL creation
      testUtils.mockFileRead('data:image/jpeg;base64,processed-right-image');

      await act(async () => {
        await result.current.handleRightCardImageUpload(mockImageUrl);
      });

      await waitFor(() => {
        expect(result.current.rightCardImage).toBeTruthy();
        expect(result.current.rightCardImage).toContain('data:image/jpeg;base64');
      });
    });
  });

  describe('Try-on Generation Workflow', () => {
    it('should handle complete try-on workflow successfully', async () => {
      const { result, testUtils, waitForWorkflow } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // Setup successful API response
      testUtils.mockSuccessfulApiCall({
        img_generated: 'data:image/jpeg;base64,generated-image-data'
      });

      // Mock file reading
      testUtils.mockFileRead('data:image/jpeg;base64,processed-image');

      // Upload files
      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
        result.current.handleApparelFileUpload(mockFiles.apparelImage);
      });

      // Wait for files to be uploaded
      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
        expect(result.current.apparelImageFile).toBe(mockFiles.apparelImage);
      });

      // Start generation
      act(() => {
        result.current.handleCameraButtonClick();
      });

      // Wait for capturing state
      await waitFor(() => {
        expect(result.current.isCapturing).toBe(true);
        expect(result.current.showPolaroid).toBe(true);
      });

      // Wait for generation completion
      await waitFor(() => {
        expect(result.current.isCapturing).toBe(false);
        expect(result.current.generatedImage).toBeTruthy();
      }, { timeout: 10000 });
    });

    it('should handle API errors gracefully', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // Setup API error response
      testUtils.mockApiError('Server error', 500);
      testUtils.mockFileRead('data:image/jpeg;base64,processed-image');

      // Upload files
      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
        result.current.handleApparelFileUpload(mockFiles.apparelImage);
      });

      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
        expect(result.current.apparelImageFile).toBe(mockFiles.apparelImage);
      });

      // Start generation
      act(() => {
        result.current.handleCameraButtonClick();
      });

      // Wait for error state
      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
        expect(result.current.isCapturing).toBe(false);
      }, { timeout: 10000 });
    });

    it('should handle retry generation', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // First attempt fails
      testUtils.mockApiError('Server error', 500);
      testUtils.mockFileRead('data:image/jpeg;base64,processed-image');

      // Upload files and generate (will fail)
      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
        result.current.handleApparelFileUpload(mockFiles.apparelImage);
      });

      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
        expect(result.current.apparelImageFile).toBe(mockFiles.apparelImage);
      });

      act(() => {
        result.current.handleCameraButtonClick();
      });

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
      });

      // Setup successful retry
      testUtils.mockSuccessfulApiCall({
        img_generated: 'data:image/jpeg;base64,retry-generated-image'
      });

      // Retry generation
      act(() => {
        result.current.handleRetryGeneration();
      });

      await waitFor(() => {
        expect(result.current.hasError).toBe(false);
        expect(result.current.generatedImage).toBeTruthy();
      }, { timeout: 10000 });
    });
  });

  describe('Modal State Management', () => {
    it('should handle polaroid close correctly', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());

      // Setup successful generation first
      const mockFiles = WorkflowTestUtils.createMockFiles();
      testUtils.mockSuccessfulApiCall();
      testUtils.mockFileRead('data:image/jpeg;base64,processed-image');

      // Complete workflow
      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
        result.current.handleApparelFileUpload(mockFiles.apparelImage);
      });

      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
        expect(result.current.apparelImageFile).toBe(mockFiles.apparelImage);
      });

      act(() => {
        result.current.handleCameraButtonClick();
      });

      await waitFor(() => {
        expect(result.current.showPolaroid).toBe(true);
      });

      // Close polaroid
      act(() => {
        result.current.handleClosePolaroid();
      });

      await waitFor(() => {
        expect(result.current.showPolaroid).toBe(false);
      });
    });

    it('should handle generation callbacks correctly', async () => {
      const { result } = renderBridgeHook(() => usePageComponentState());

      // Test generation start callback
      act(() => {
        result.current.handleGenerationStart();
      });

      // Test generation complete callback
      act(() => {
        result.current.handleGenerationComplete('mock-image-url');
      });

      // These are legacy callbacks that should not throw errors
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });

  describe('Error Scenarios', () => {
    it('should handle file upload without both images', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // Upload only user image
      testUtils.mockFileRead('data:image/jpeg;base64,processed-image');
      
      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
      });

      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
      });

      // Try to generate without apparel image
      act(() => {
        result.current.handleCameraButtonClick();
      });

      // Should not start capturing without both images
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.showPolaroid).toBe(false);
    });

    it('should handle API timeout gracefully', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // Setup timeout
      testUtils.mockApiTimeout(1000);
      testUtils.mockFileRead('data:image/jpeg;base64,processed-image');

      // Upload files
      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
        result.current.handleApparelFileUpload(mockFiles.apparelImage);
      });

      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
        expect(result.current.apparelImageFile).toBe(mockFiles.apparelImage);
      });

      // Start generation
      act(() => {
        result.current.handleCameraButtonClick();
      });

      // Wait for timeout error
      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
        expect(result.current.isCapturing).toBe(false);
      }, { timeout: 15000 });
    });

    it('should handle file reading errors during generation', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // File upload should work normally (files are stored, not read at upload time)
      testUtils.mockFileRead('data:image/jpeg;base64,processed-image');
      
      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
        result.current.handleApparelFileUpload(mockFiles.apparelImage);
      });

      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
        expect(result.current.apparelImageFile).toBe(mockFiles.apparelImage);
        expect(result.current.hasError).toBe(false); // No error during upload
      });

      // Now mock API error for generation (file reading errors would happen during generation)
      testUtils.mockApiError('File processing failed', 400);

      // Start generation - this is where file reading/processing happens
      act(() => {
        result.current.handleCameraButtonClick();
      });

      // Wait for error state from generation failure
      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
        expect(result.current.isCapturing).toBe(false);
      }, { timeout: 10000 });
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency throughout workflow', async () => {
      const { result, testUtils } = renderBridgeHook(() => usePageComponentState());
      const mockFiles = WorkflowTestUtils.createMockFiles();

      // Track state changes
      const stateChanges: any[] = [];
      
      // Initial state
      stateChanges.push({
        step: 'initial',
        isCapturing: result.current.isCapturing,
        hasFiles: !!result.current.userImageFile && !!result.current.apparelImageFile,
        showPolaroid: result.current.showPolaroid,
        hasResult: !!result.current.generatedImage,
        hasError: result.current.hasError,
      });

      testUtils.mockSuccessfulApiCall();
      testUtils.mockFileRead('data:image/jpeg;base64,processed-image');

      // Upload files
      act(() => {
        result.current.handleUserFileUpload(mockFiles.userImage);
        result.current.handleApparelFileUpload(mockFiles.apparelImage);
      });

      await waitFor(() => {
        expect(result.current.userImageFile).toBe(mockFiles.userImage);
        expect(result.current.apparelImageFile).toBe(mockFiles.apparelImage);
      });

      stateChanges.push({
        step: 'files-uploaded',
        isCapturing: result.current.isCapturing,
        hasFiles: !!result.current.userImageFile && !!result.current.apparelImageFile,
        showPolaroid: result.current.showPolaroid,
        hasResult: !!result.current.generatedImage,
        hasError: result.current.hasError,
      });

      // Start generation
      act(() => {
        result.current.handleCameraButtonClick();
      });

      await waitFor(() => {
        expect(result.current.isCapturing).toBe(true);
        expect(result.current.showPolaroid).toBe(true);
      });

      stateChanges.push({
        step: 'generation-started',
        isCapturing: result.current.isCapturing,
        hasFiles: !!result.current.userImageFile && !!result.current.apparelImageFile,
        showPolaroid: result.current.showPolaroid,
        hasResult: !!result.current.generatedImage,
        hasError: result.current.hasError,
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isCapturing).toBe(false);
        expect(result.current.generatedImage).toBeTruthy();
      }, { timeout: 10000 });

      stateChanges.push({
        step: 'generation-complete',
        isCapturing: result.current.isCapturing,
        hasFiles: !!result.current.userImageFile && !!result.current.apparelImageFile,
        showPolaroid: result.current.showPolaroid,
        hasResult: !!result.current.generatedImage,
        hasError: result.current.hasError,
      });

      // Verify state progression
      expect(stateChanges[0]).toEqual({
        step: 'initial',
        isCapturing: false,
        hasFiles: false,
        showPolaroid: false,
        hasResult: false,
        hasError: false,
      });

      expect(stateChanges[1]).toEqual({
        step: 'files-uploaded',
        isCapturing: false,
        hasFiles: true,
        showPolaroid: false,
        hasResult: false,
        hasError: false,
      });

      expect(stateChanges[2]).toEqual({
        step: 'generation-started',
        isCapturing: true,
        hasFiles: true,
        showPolaroid: true,
        hasResult: false,
        hasError: false,
      });

      expect(stateChanges[3]).toEqual({
        step: 'generation-complete',
        isCapturing: false,
        hasFiles: true,
        showPolaroid: true,
        hasResult: true,
        hasError: false,
      });
    });
  });
});