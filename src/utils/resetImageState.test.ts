import { resetImageState, ResetImageStateArgs } from './resetImageState';

describe('resetImageState', () => {
  let mockSetters: ResetImageStateArgs['setters'];
  let mockSetSelfieUrl: jest.Mock;
  let mockSetAnimeUrl: jest.Mock;
  let mockSetSelfieBlob: jest.Mock;
  let mockSetAnimeBlob: jest.Mock;

  beforeEach(() => {
    // Create mock setter functions
    mockSetSelfieUrl = jest.fn();
    mockSetAnimeUrl = jest.fn();
    mockSetSelfieBlob = jest.fn();
    mockSetAnimeBlob = jest.fn();

    mockSetters = {
      setSelfieUrl: mockSetSelfieUrl,
      setAnimeUrl: mockSetAnimeUrl,
      setSelfieBlob: mockSetSelfieBlob,
      setAnimeBlob: mockSetAnimeBlob,
    };

    // Mock URL.revokeObjectURL since it doesn't exist in Node.js environment
    global.URL = {
      ...global.URL,
      revokeObjectURL: jest.fn(),
    } as typeof global.URL;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should revoke blob URLs and reset all state setters', () => {
    const args: ResetImageStateArgs = {
      selfieUrl: 'blob:http://localhost:3000/abc123',
      animeUrl: 'blob:http://localhost:3000/def456',
      setters: mockSetters,
    };

    resetImageState(args);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost:3000/abc123');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost:3000/def456');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);

    expect(mockSetSelfieUrl).toHaveBeenCalledWith(null);
    expect(mockSetAnimeUrl).toHaveBeenCalledWith(null);
    expect(mockSetSelfieBlob).toHaveBeenCalledWith(null);
    expect(mockSetAnimeBlob).toHaveBeenCalledWith(null);
  });

  it('should not revoke data URLs', () => {
    const args: ResetImageStateArgs = {
      selfieUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      animeUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      setters: mockSetters,
    };

    resetImageState(args);

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    expect(mockSetSelfieUrl).toHaveBeenCalledWith(null);
    expect(mockSetAnimeUrl).toHaveBeenCalledWith(null);
    expect(mockSetSelfieBlob).toHaveBeenCalledWith(null);
    expect(mockSetAnimeBlob).toHaveBeenCalledWith(null);
  });

  it('should handle null URLs', () => {
    const args: ResetImageStateArgs = {
      selfieUrl: null,
      animeUrl: null,
      setters: mockSetters,
    };

    resetImageState(args);

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    expect(mockSetSelfieUrl).toHaveBeenCalledWith(null);
    expect(mockSetAnimeUrl).toHaveBeenCalledWith(null);
    expect(mockSetSelfieBlob).toHaveBeenCalledWith(null);
    expect(mockSetAnimeBlob).toHaveBeenCalledWith(null);
  });

  it('should handle mixed blob and data URLs', () => {
    const args: ResetImageStateArgs = {
      selfieUrl: 'blob:http://localhost:3000/abc123',
      animeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      setters: mockSetters,
    };

    resetImageState(args);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost:3000/abc123');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);

    expect(mockSetSelfieUrl).toHaveBeenCalledWith(null);
    expect(mockSetAnimeUrl).toHaveBeenCalledWith(null);
    expect(mockSetSelfieBlob).toHaveBeenCalledWith(null);
    expect(mockSetAnimeBlob).toHaveBeenCalledWith(null);
  });

  it('should handle empty string URLs', () => {
    const args: ResetImageStateArgs = {
      selfieUrl: '',
      animeUrl: '',
      setters: mockSetters,
    };

    resetImageState(args);

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    expect(mockSetSelfieUrl).toHaveBeenCalledWith(null);
    expect(mockSetAnimeUrl).toHaveBeenCalledWith(null);
    expect(mockSetSelfieBlob).toHaveBeenCalledWith(null);
    expect(mockSetAnimeBlob).toHaveBeenCalledWith(null);
  });

  it('should handle non-blob URLs that do not start with blob:', () => {
    const args: ResetImageStateArgs = {
      selfieUrl: 'https://example.com/image.jpg',
      animeUrl: 'http://localhost:3000/api/image/123',
      setters: mockSetters,
    };

    resetImageState(args);

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    expect(mockSetSelfieUrl).toHaveBeenCalledWith(null);
    expect(mockSetAnimeUrl).toHaveBeenCalledWith(null);
    expect(mockSetSelfieBlob).toHaveBeenCalledWith(null);
    expect(mockSetAnimeBlob).toHaveBeenCalledWith(null);
  });

  it('should call all setters even if some URLs are null', () => {
    const args: ResetImageStateArgs = {
      selfieUrl: 'blob:http://localhost:3000/abc123',
      animeUrl: null,
      setters: mockSetters,
    };

    resetImageState(args);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost:3000/abc123');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);

    expect(mockSetSelfieUrl).toHaveBeenCalledWith(null);
    expect(mockSetAnimeUrl).toHaveBeenCalledWith(null);
    expect(mockSetSelfieBlob).toHaveBeenCalledWith(null);
    expect(mockSetAnimeBlob).toHaveBeenCalledWith(null);
  });
}); 