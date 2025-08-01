import { stopMediaStream } from './stopMediaStream';

// Define MediaStreamTrack type for testing environment
type MediaStreamTrack = {
  stop: () => void;
  readyState: 'live' | 'ended';
};

describe('stopMediaStream', () => {
  let mockStream: MediaStream;
  let mockVideo: HTMLVideoElement;
  let mockTrack1: MediaStreamTrack;
  let mockTrack2: MediaStreamTrack;

  beforeEach(() => {
    // Create mock tracks
    mockTrack1 = {
      stop: jest.fn(),
      readyState: 'live',
    } as unknown as MediaStreamTrack;

    mockTrack2 = {
      stop: jest.fn(),
      readyState: 'live',
    } as unknown as MediaStreamTrack;

    // Create mock stream
    mockStream = {
      getTracks: jest.fn().mockReturnValue([mockTrack1, mockTrack2]),
    } as unknown as MediaStream;

    // Create mock video element
    mockVideo = {
      srcObject: mockStream,
    } as unknown as HTMLVideoElement;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should do nothing when stream is null or undefined', () => {
    stopMediaStream(null);
    stopMediaStream(undefined);

    expect(mockStream.getTracks).not.toHaveBeenCalled();
  });

  it('should stop all tracks in the stream', () => {
    stopMediaStream(mockStream);

    expect(mockStream.getTracks).toHaveBeenCalledTimes(1);
    expect(mockTrack1.stop).toHaveBeenCalledTimes(1);
    expect(mockTrack2.stop).toHaveBeenCalledTimes(1);
  });

  it('should not stop tracks that are already ended', () => {
    mockTrack1.readyState = 'ended';
    mockTrack2.readyState = 'live';

    stopMediaStream(mockStream);

    expect(mockTrack1.stop).not.toHaveBeenCalled();
    expect(mockTrack2.stop).toHaveBeenCalledTimes(1);
  });

  it('should clear video srcObject when it matches the stream', () => {
    stopMediaStream(mockStream, mockVideo);

    expect(mockVideo.srcObject).toBeNull();
  });

  it('should not clear video srcObject when it does not match the stream', () => {
    const differentStream = {} as MediaStream;
    mockVideo.srcObject = differentStream;

    stopMediaStream(mockStream, mockVideo);

    expect(mockVideo.srcObject).toBe(differentStream);
  });

  it('should not clear video srcObject when video is null', () => {
    stopMediaStream(mockStream, null);

    expect(mockStream.getTracks).toHaveBeenCalledTimes(1);
    expect(mockTrack1.stop).toHaveBeenCalledTimes(1);
    expect(mockTrack2.stop).toHaveBeenCalledTimes(1);
  });

  it('should handle empty track array', () => {
    mockStream.getTracks = jest.fn().mockReturnValue([]);

    stopMediaStream(mockStream);

    expect(mockStream.getTracks).toHaveBeenCalledTimes(1);
  });

  it('should handle both stream and video cleanup in one call', () => {
    stopMediaStream(mockStream, mockVideo);

    expect(mockStream.getTracks).toHaveBeenCalledTimes(1);
    expect(mockTrack1.stop).toHaveBeenCalledTimes(1);
    expect(mockTrack2.stop).toHaveBeenCalledTimes(1);
    expect(mockVideo.srcObject).toBeNull();
  });
}); 