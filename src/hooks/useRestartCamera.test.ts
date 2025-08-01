import { renderHook, act } from '@testing-library/react';
import { useRestartCamera } from './useRestartCamera';
import { stopMediaStream } from '../utils/stopMediaStream';

// Mock the stopMediaStream utility
jest.mock('../utils/stopMediaStream');
const mockStopMediaStream = stopMediaStream as jest.MockedFunction<typeof stopMediaStream>;

// Mock navigator.mediaDevices.getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

describe('useRestartCamera', () => {
  let mockVideoRef: React.RefObject<HTMLVideoElement>;
  let mockVideoElement: HTMLVideoElement;
  let mockStream: MediaStream;

  beforeEach(() => {
    // Create mock video element
    mockVideoElement = {
      srcObject: null,
      play: jest.fn().mockResolvedValue(undefined),
    } as unknown as HTMLVideoElement;

    // Create mock video ref
    mockVideoRef = {
      current: mockVideoElement,
    };

    // Create mock stream
    mockStream = {
      getTracks: jest.fn().mockReturnValue([]),
    } as unknown as MediaStream;

    // Reset mocks
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request new camera stream and attach to video element', async () => {
    const { result } = renderHook(() => useRestartCamera(mockVideoRef));

    await act(async () => {
      await result.current();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'user' }
    });
    expect(mockVideoElement.srcObject).toBe(mockStream);
    expect(mockVideoElement.play).toHaveBeenCalled();
  });

  it('should stop previous stream before requesting new one', async () => {
    const { result } = renderHook(() => useRestartCamera(mockVideoRef));

    // First call to establish initial stream
    await act(async () => {
      await result.current();
    });

    // Second call to test cleanup of previous stream
    await act(async () => {
      await result.current();
    });

    expect(mockStopMediaStream).toHaveBeenCalledWith(mockStream, mockVideoElement);
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
  });

  it('should handle PermissionDeniedError by re-throwing', async () => {
    const permissionError = new Error('Permission denied');
    permissionError.name = 'NotAllowedError';
    mockGetUserMedia.mockRejectedValue(permissionError);

    const { result } = renderHook(() => useRestartCamera(mockVideoRef));

    await expect(act(async () => {
      await result.current();
    })).rejects.toThrow('Permission denied');
  });

  it('should handle NotFoundError by re-throwing', async () => {
    const notFoundError = new Error('No camera found');
    notFoundError.name = 'NotFoundError';
    mockGetUserMedia.mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useRestartCamera(mockVideoRef));

    await expect(act(async () => {
      await result.current();
    })).rejects.toThrow('No camera found');
  });

  it('should handle video element not being available', async () => {
    const nullVideoRef = { current: null };
    const { result } = renderHook(() => useRestartCamera(nullVideoRef));

    await act(async () => {
      await result.current();
    });

    expect(mockGetUserMedia).toHaveBeenCalled();
    // Should not set srcObject or call play since video element is null
    expect(mockVideoElement.srcObject).toBeNull();
    expect(mockVideoElement.play).not.toHaveBeenCalled();
  });

  it('should handle video play failure', async () => {
    const playError = new Error('Video play failed');
    mockVideoElement.play.mockRejectedValue(playError);

    const { result } = renderHook(() => useRestartCamera(mockVideoRef));

    await expect(act(async () => {
      await result.current();
    })).rejects.toThrow('Video play failed');
  });

  it('should not call stopMediaStream if no previous stream exists', async () => {
    const { result } = renderHook(() => useRestartCamera(mockVideoRef));

    await act(async () => {
      await result.current();
    });

    expect(mockStopMediaStream).not.toHaveBeenCalled();
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
  });

  it('should maintain stream reference across multiple calls', async () => {
    const { result } = renderHook(() => useRestartCamera(mockVideoRef));

    // First call
    await act(async () => {
      await result.current();
    });

    // Second call
    await act(async () => {
      await result.current();
    });

    expect(mockStopMediaStream).toHaveBeenCalledWith(mockStream, mockVideoElement);
    expect(mockVideoElement.srcObject).toBe(mockStream);
  });

  it('should handle getUserMedia with different constraints', async () => {
    const { result } = renderHook(() => useRestartCamera(mockVideoRef));

    await act(async () => {
      await result.current();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'user' }
    });
  });
}); 