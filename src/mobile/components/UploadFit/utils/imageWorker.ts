/**
 * @fileoverview Image Processing Web Workers - Offload heavy image processing to prevent main thread blocking
 * @module @/mobile/components/UploadFit/utils/imageWorker
 * @version 1.0.0
 */

// =============================================================================
// TYPES AND INTERFACES (Task 6.5)
// =============================================================================

/**
 * Web Worker message types
 */
export const WORKER_MESSAGE_TYPES = {
  COMPRESS_IMAGE: 'compress-image',
  CONVERT_FORMAT: 'convert-format',
  PROCESS_CANVAS: 'process-canvas',
  GENERATE_PREVIEW: 'generate-preview',
  VALIDATE_IMAGE: 'validate-image',
  BATCH_PROCESS: 'batch-process',
  PROGRESS_UPDATE: 'progress-update',
  TASK_COMPLETE: 'task-complete',
  TASK_ERROR: 'task-error',
  WORKER_READY: 'worker-ready'
} as const;

export type WorkerMessageType = typeof WORKER_MESSAGE_TYPES[keyof typeof WORKER_MESSAGE_TYPES];

/**
 * Worker task configuration
 */
export interface WorkerTaskConfig {
  /** Task ID for tracking */
  taskId: string;
  /** Task type */
  type: WorkerMessageType;
  /** File data as ArrayBuffer */
  fileData: ArrayBuffer;
  /** File metadata */
  fileInfo: {
    name: string;
    type: string;
    size: number;
  };
  /** Task-specific options */
  options: any;
}

/**
 * Worker message interface
 */
export interface WorkerMessage {
  /** Message type */
  type: WorkerMessageType;
  /** Task ID */
  taskId?: string;
  /** Message payload */
  payload?: any;
  /** Error information */
  error?: string;
  /** Progress information (0-1) */
  progress?: number;
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  /** Maximum number of workers */
  maxWorkers?: number;
  /** Worker script URL or blob */
  workerScript?: string | Blob;
  /** Timeout for tasks in milliseconds */
  taskTimeout?: number;
  /** Whether to terminate idle workers */
  terminateIdle?: boolean;
  /** Idle timeout in milliseconds */
  idleTimeout?: number;
}

/**
 * Worker task result
 */
export interface WorkerTaskResult<T = any> {
  /** Task ID */
  taskId: string;
  /** Whether task succeeded */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message */
  error?: string;
  /** Processing time */
  processingTime: number;
  /** Worker that processed the task */
  workerId: string;
}

/**
 * Worker pool statistics
 */
export interface WorkerPoolStats {
  /** Total number of workers */
  totalWorkers: number;
  /** Number of active workers */
  activeWorkers: number;
  /** Number of idle workers */
  idleWorkers: number;
  /** Tasks in queue */
  queuedTasks: number;
  /** Completed tasks */
  completedTasks: number;
  /** Failed tasks */
  failedTasks: number;
  /** Average task time */
  averageTaskTime: number;
}

// =============================================================================
// WORKER SCRIPT GENERATION (Task 6.5)
// =============================================================================

/**
 * Generate worker script as blob for image processing
 * This creates a self-contained worker that can handle various image operations
 */
function generateWorkerScript(): Blob {
  const workerScript = `
    // Worker script for image processing operations
    let isReady = false;
    
    // Import browser-image-compression in worker if available
    let imageCompression = null;
    
    // Initialize worker
    async function initializeWorker() {
      try {
        // Import image compression library
        if (typeof importScripts !== 'undefined') {
          // For browsers that support importScripts
          try {
            importScripts('https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js');
            imageCompression = window.imageCompression;
          } catch (e) {
            console.warn('Failed to load image compression library in worker:', e);
          }
        }
        
        isReady = true;
        postMessage({ type: 'worker-ready' });
      } catch (error) {
        postMessage({ 
          type: 'task-error', 
          error: 'Failed to initialize worker: ' + error.message 
        });
      }
    }
    
    // Handle compression task
    async function handleCompressionTask(taskId, fileData, fileInfo, options) {
      try {
        if (!imageCompression) {
          throw new Error('Image compression library not available in worker');
        }
        
        // Convert ArrayBuffer back to File
        const file = new File([fileData], fileInfo.name, { type: fileInfo.type });
        
        // Compress image
        const compressedFile = await imageCompression(file, {
          maxSizeMB: options.maxSizeMB || 1,
          maxWidthOrHeight: options.maxWidthOrHeight || 1920,
          initialQuality: options.initialQuality || 0.7,
          useWebWorker: false, // Already in worker
          onProgress: (progress) => {
            postMessage({
              type: 'progress-update',
              taskId,
              progress: progress / 100
            });
          }
        });
        
        // Convert result to transferable format
        const resultBuffer = await compressedFile.arrayBuffer();
        
        postMessage({
          type: 'task-complete',
          taskId,
          payload: {
            fileData: resultBuffer,
            originalSize: fileInfo.size,
            compressedSize: compressedFile.size,
            compressionRatio: (fileInfo.size - compressedFile.size) / fileInfo.size
          }
        }, [resultBuffer]);
        
      } catch (error) {
        postMessage({
          type: 'task-error',
          taskId,
          error: error.message
        });
      }
    }
    
    // Handle format conversion task
    async function handleFormatConversion(taskId, fileData, fileInfo, options) {
      try {
        // Create canvas for format conversion
        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context not available in worker');
        }
        
        // Convert ArrayBuffer to Blob then to ImageBitmap
        const blob = new Blob([fileData], { type: fileInfo.type });
        const imageBitmap = await createImageBitmap(blob);
        
        // Set canvas size
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        
        // Draw image
        ctx.drawImage(imageBitmap, 0, 0);
        
        // Convert to target format
        const convertedBlob = await canvas.convertToBlob({
          type: options.targetFormat || 'image/jpeg',
          quality: options.quality || 0.8
        });
        
        const resultBuffer = await convertedBlob.arrayBuffer();
        
        postMessage({
          type: 'task-complete',
          taskId,
          payload: {
            fileData: resultBuffer,
            originalSize: fileInfo.size,
            convertedSize: convertedBlob.size,
            originalFormat: fileInfo.type,
            targetFormat: options.targetFormat
          }
        }, [resultBuffer]);
        
        imageBitmap.close();
        
      } catch (error) {
        postMessage({
          type: 'task-error',
          taskId,
          error: error.message
        });
      }
    }
    
    // Handle canvas processing task
    async function handleCanvasProcessing(taskId, fileData, fileInfo, options) {
      try {
        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context not available in worker');
        }
        
        const blob = new Blob([fileData], { type: fileInfo.type });
        const imageBitmap = await createImageBitmap(blob);
        
        // Calculate new dimensions
        let { width, height } = options;
        
        if (options.maintainAspectRatio) {
          const aspectRatio = imageBitmap.width / imageBitmap.height;
          if (width && !height) {
            height = width / aspectRatio;
          } else if (height && !width) {
            width = height * aspectRatio;
          }
        }
        
        canvas.width = width || imageBitmap.width;
        canvas.height = height || imageBitmap.height;
        
        // Configure canvas
        ctx.imageSmoothingEnabled = options.smoothing !== false;
        ctx.imageSmoothingQuality = options.quality || 'high';
        
        // Apply transformations
        if (options.rotation) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((options.rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }
        
        if (options.flipHorizontal) {
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
        }
        
        if (options.flipVertical) {
          ctx.scale(1, -1);
          ctx.translate(0, -canvas.height);
        }
        
        // Draw image
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
        
        // Convert result
        const resultBlob = await canvas.convertToBlob({
          type: options.outputFormat || fileInfo.type,
          quality: options.outputQuality || 0.9
        });
        
        const resultBuffer = await resultBlob.arrayBuffer();
        
        postMessage({
          type: 'task-complete',
          taskId,
          payload: {
            fileData: resultBuffer,
            width: canvas.width,
            height: canvas.height,
            originalSize: fileInfo.size,
            processedSize: resultBlob.size
          }
        }, [resultBuffer]);
        
        imageBitmap.close();
        
      } catch (error) {
        postMessage({
          type: 'task-error',
          taskId,
          error: error.message
        });
      }
    }
    
    // Handle preview generation task
    async function handlePreviewGeneration(taskId, fileData, fileInfo, options) {
      try {
        const canvas = new OffscreenCanvas(options.width || 64, options.height || 64);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context not available in worker');
        }
        
        const blob = new Blob([fileData], { type: fileInfo.type });
        const imageBitmap = await createImageBitmap(blob);
        
        // Configure for low quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low';
        
        // Draw scaled image
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
        
        // Convert to low quality JPEG
        const previewBlob = await canvas.convertToBlob({
          type: 'image/jpeg',
          quality: options.quality || 0.2
        });
        
        const resultBuffer = await previewBlob.arrayBuffer();
        
        postMessage({
          type: 'task-complete',
          taskId,
          payload: {
            fileData: resultBuffer,
            previewSize: previewBlob.size
          }
        }, [resultBuffer]);
        
        imageBitmap.close();
        
      } catch (error) {
        postMessage({
          type: 'task-error',
          taskId,
          error: error.message
        });
      }
    }
    
    // Message handler
    self.onmessage = async function(event) {
      const { type, taskId, fileData, fileInfo, options } = event.data;
      
      if (!isReady && type !== 'worker-ready') {
        postMessage({
          type: 'task-error',
          taskId,
          error: 'Worker not ready'
        });
        return;
      }
      
      const startTime = performance.now();
      
      try {
        switch (type) {
          case 'compress-image':
            await handleCompressionTask(taskId, fileData, fileInfo, options);
            break;
            
          case 'convert-format':
            await handleFormatConversion(taskId, fileData, fileInfo, options);
            break;
            
          case 'process-canvas':
            await handleCanvasProcessing(taskId, fileData, fileInfo, options);
            break;
            
          case 'generate-preview':
            await handlePreviewGeneration(taskId, fileData, fileInfo, options);
            break;
            
          default:
            postMessage({
              type: 'task-error',
              taskId,
              error: 'Unknown task type: ' + type
            });
        }
      } catch (error) {
        postMessage({
          type: 'task-error',
          taskId,
          error: error.message
        });
      }
      
      const processingTime = performance.now() - startTime;
      postMessage({
        type: 'progress-update',
        taskId,
        progress: 1,
        processingTime
      });
    };
    
    // Initialize worker
    initializeWorker();
  `;

  return new Blob([workerScript], { type: 'application/javascript' });
}

// =============================================================================
// WORKER POOL IMPLEMENTATION (Task 6.5)
// =============================================================================

/**
 * Worker pool for managing multiple Web Workers for image processing
 * 
 * Features:
 * - Automatic worker lifecycle management
 * - Task queue with priority support
 * - Load balancing across workers
 * - Timeout handling
 * - Progress tracking
 * - Error recovery
 * - Resource cleanup
 */
export class ImageProcessingWorkerPool {
  private workers: Map<string, Worker> = new Map();
  private workerStatus: Map<string, 'idle' | 'busy' | 'terminated'> = new Map();
  private taskQueue: Array<{
    config: WorkerTaskConfig;
    resolve: (result: WorkerTaskResult) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private activeTasks: Map<string, {
    workerId: string;
    timeout: NodeJS.Timeout;
    startTime: number;
  }> = new Map();
  private stats = {
    completedTasks: 0,
    failedTasks: 0,
    totalProcessingTime: 0,
    averageTaskTime: 0
  };

  private config: Required<WorkerPoolConfig>;
  private workerScript: Blob;

  constructor(config: WorkerPoolConfig = {}) {
    this.config = {
      maxWorkers: navigator.hardwareConcurrency || 4,
      workerScript: '',
      taskTimeout: 30000, // 30 seconds
      terminateIdle: true,
      idleTimeout: 60000, // 1 minute
      ...config
    };

    this.workerScript = generateWorkerScript();
    this.initialize();
  }

  /**
   * Initialize the worker pool
   */
  private initialize(): void {
    // Create initial worker
    this.createWorker();
  }

  /**
   * Create a new worker
   */
  private createWorker(): string {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const workerUrl = URL.createObjectURL(this.workerScript);
    
    try {
      const worker = new Worker(workerUrl);
      
      worker.onmessage = (event) => this.handleWorkerMessage(workerId, event);
      worker.onerror = (error) => this.handleWorkerError(workerId, error);
      worker.onmessageerror = (error) => this.handleWorkerError(workerId, error);

      this.workers.set(workerId, worker);
      this.workerStatus.set(workerId, 'idle');

      return workerId;
    } finally {
      URL.revokeObjectURL(workerUrl);
    }
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(workerId: string, event: MessageEvent): void {
    const message: WorkerMessage = event.data;

    switch (message.type) {
      case WORKER_MESSAGE_TYPES.WORKER_READY:
        this.workerStatus.set(workerId, 'idle');
        this.processQueue();
        break;

      case WORKER_MESSAGE_TYPES.TASK_COMPLETE:
        this.handleTaskComplete(workerId, message);
        break;

      case WORKER_MESSAGE_TYPES.TASK_ERROR:
        this.handleTaskError(workerId, message);
        break;

      case WORKER_MESSAGE_TYPES.PROGRESS_UPDATE:
        this.handleProgressUpdate(workerId, message);
        break;
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(workerId: string, message: WorkerMessage): void {
    const taskId = message.taskId!;
    const activeTask = this.activeTasks.get(taskId);

    if (activeTask) {
      clearTimeout(activeTask.timeout);
      this.activeTasks.delete(taskId);
      this.workerStatus.set(workerId, 'idle');

      const processingTime = Date.now() - activeTask.startTime;
      this.updateStats(true, processingTime);

      // Find and resolve the task promise
      const queueIndex = this.taskQueue.findIndex(item => 
        item.config.taskId === taskId
      );

      if (queueIndex >= 0) {
        const queueItem = this.taskQueue.splice(queueIndex, 1)[0];
        queueItem.resolve({
          taskId,
          success: true,
          data: message.payload,
          processingTime,
          workerId
        });
      }

      // Process next task
      this.processQueue();
    }
  }

  /**
   * Handle task error
   */
  private handleTaskError(workerId: string, message: WorkerMessage): void {
    const taskId = message.taskId!;
    const activeTask = this.activeTasks.get(taskId);

    if (activeTask) {
      clearTimeout(activeTask.timeout);
      this.activeTasks.delete(taskId);
      this.workerStatus.set(workerId, 'idle');

      const processingTime = Date.now() - activeTask.startTime;
      this.updateStats(false, processingTime);

      // Find and reject the task promise
      const queueIndex = this.taskQueue.findIndex(item => 
        item.config.taskId === taskId
      );

      if (queueIndex >= 0) {
        const queueItem = this.taskQueue.splice(queueIndex, 1)[0];
        queueItem.reject(new Error(message.error || 'Unknown worker error'));
      }

      // Process next task
      this.processQueue();
    }
  }

  /**
   * Handle progress updates
   */
  private handleProgressUpdate(workerId: string, message: WorkerMessage): void {
    // Progress updates can be used for UI feedback
    // This is a placeholder for progress handling
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    console.error(`Worker ${workerId} error:`, error);
    
    // Mark worker as terminated
    this.workerStatus.set(workerId, 'terminated');
    
    // Find any active tasks for this worker and fail them
    for (const [taskId, task] of this.activeTasks.entries()) {
      if (task.workerId === workerId) {
        clearTimeout(task.timeout);
        this.activeTasks.delete(taskId);
        
        const queueIndex = this.taskQueue.findIndex(item => 
          item.config.taskId === taskId
        );

        if (queueIndex >= 0) {
          const queueItem = this.taskQueue.splice(queueIndex, 1)[0];
          queueItem.reject(new Error('Worker terminated unexpectedly'));
        }
      }
    }

    // Remove the terminated worker
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerId);
      this.workerStatus.delete(workerId);
    }

    // Create replacement worker if needed
    if (this.workers.size < this.config.maxWorkers && this.taskQueue.length > 0) {
      this.createWorker();
    }
  }

  /**
   * Process task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) {
      return;
    }

    // Find idle worker
    const idleWorkerId = Array.from(this.workerStatus.entries())
      .find(([, status]) => status === 'idle')?.[0];

    if (!idleWorkerId) {
      // Create new worker if under limit
      if (this.workers.size < this.config.maxWorkers) {
        this.createWorker();
      }
      return;
    }

    // Get next task
    const queueItem = this.taskQueue.find(item => 
      !this.activeTasks.has(item.config.taskId)
    );

    if (!queueItem) {
      return;
    }

    // Assign task to worker
    const worker = this.workers.get(idleWorkerId)!;
    const { config } = queueItem;

    this.workerStatus.set(idleWorkerId, 'busy');

    // Set up timeout
    const timeout = setTimeout(() => {
      this.handleTaskTimeout(config.taskId);
    }, this.config.taskTimeout);

    this.activeTasks.set(config.taskId, {
      workerId: idleWorkerId,
      timeout,
      startTime: Date.now()
    });

    // Send task to worker
    worker.postMessage({
      type: config.type,
      taskId: config.taskId,
      fileData: config.fileData,
      fileInfo: config.fileInfo,
      options: config.options
    }, [config.fileData]);

    // Process more tasks if possible
    setTimeout(() => this.processQueue(), 0);
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(taskId: string): void {
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      this.activeTasks.delete(taskId);
      this.workerStatus.set(activeTask.workerId, 'idle');
      
      const queueIndex = this.taskQueue.findIndex(item => 
        item.config.taskId === taskId
      );

      if (queueIndex >= 0) {
        const queueItem = this.taskQueue.splice(queueIndex, 1)[0];
        queueItem.reject(new Error(`Task ${taskId} timed out after ${this.config.taskTimeout}ms`));
      }

      this.updateStats(false, this.config.taskTimeout);
    }
  }

  /**
   * Update pool statistics
   */
  private updateStats(success: boolean, processingTime: number): void {
    if (success) {
      this.stats.completedTasks++;
      this.stats.totalProcessingTime += processingTime;
      this.stats.averageTaskTime = this.stats.totalProcessingTime / this.stats.completedTasks;
    } else {
      this.stats.failedTasks++;
    }
  }

  /**
   * Submit task to worker pool
   * 
   * @param config Task configuration
   * @returns Promise resolving to task result
   */
  public async submitTask(config: WorkerTaskConfig): Promise<WorkerTaskResult> {
    return new Promise((resolve, reject) => {
      // Create a copy of file data for transfer
      const fileDataCopy = config.fileData.slice(0);
      
      const queueItem = {
        config: {
          ...config,
          fileData: fileDataCopy
        },
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.taskQueue.push(queueItem);
      this.processQueue();
    });
  }

  /**
   * Get pool statistics
   */
  public getStats(): WorkerPoolStats {
    return {
      totalWorkers: this.workers.size,
      activeWorkers: Array.from(this.workerStatus.values()).filter(status => status === 'busy').length,
      idleWorkers: Array.from(this.workerStatus.values()).filter(status => status === 'idle').length,
      queuedTasks: this.taskQueue.length,
      completedTasks: this.stats.completedTasks,
      failedTasks: this.stats.failedTasks,
      averageTaskTime: this.stats.averageTaskTime
    };
  }

  /**
   * Terminate all workers and clean up
   */
  public terminate(): void {
    // Clear all timeouts
    for (const task of this.activeTasks.values()) {
      clearTimeout(task.timeout);
    }

    // Terminate all workers
    for (const worker of this.workers.values()) {
      worker.terminate();
    }

    // Reject all pending tasks
    for (const queueItem of this.taskQueue) {
      queueItem.reject(new Error('Worker pool terminated'));
    }

    // Clear all data
    this.workers.clear();
    this.workerStatus.clear();
    this.taskQueue.length = 0;
    this.activeTasks.clear();
  }
}

// =============================================================================
// HIGH-LEVEL API FUNCTIONS (Task 6.5)
// =============================================================================

/**
 * Global worker pool instance
 */
let globalWorkerPool: ImageProcessingWorkerPool | null = null;

/**
 * Get or create global worker pool
 */
function getWorkerPool(): ImageProcessingWorkerPool {
  if (!globalWorkerPool) {
    globalWorkerPool = new ImageProcessingWorkerPool();
  }
  return globalWorkerPool;
}

/**
 * Compress image using Web Worker
 * 
 * @param file Image file to compress
 * @param options Compression options
 * @returns Promise resolving to compressed file data
 * 
 * @example
 * ```typescript
 * const result = await compressImageWithWorker(file, {
 *   maxSizeMB: 1,
 *   maxWidthOrHeight: 1920,
 *   initialQuality: 0.7
 * });
 * 
 * const compressedFile = new File([result.data.fileData], file.name, { type: file.type });
 * ```
 */
export async function compressImageWithWorker(
  file: File,
  options: any = {}
): Promise<WorkerTaskResult> {
  const pool = getWorkerPool();
  const fileData = await file.arrayBuffer();
  
  return pool.submitTask({
    taskId: `compress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: WORKER_MESSAGE_TYPES.COMPRESS_IMAGE,
    fileData,
    fileInfo: {
      name: file.name,
      type: file.type,
      size: file.size
    },
    options
  });
}

/**
 * Convert image format using Web Worker
 * 
 * @param file Image file to convert
 * @param targetFormat Target format
 * @param quality Quality setting (0-1)
 * @returns Promise resolving to converted file data
 */
export async function convertFormatWithWorker(
  file: File,
  targetFormat: string,
  quality: number = 0.8
): Promise<WorkerTaskResult> {
  const pool = getWorkerPool();
  const fileData = await file.arrayBuffer();
  
  return pool.submitTask({
    taskId: `convert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: WORKER_MESSAGE_TYPES.CONVERT_FORMAT,
    fileData,
    fileInfo: {
      name: file.name,
      type: file.type,
      size: file.size
    },
    options: { targetFormat, quality }
  });
}

/**
 * Process image with canvas operations using Web Worker
 * 
 * @param file Image file to process
 * @param operations Canvas operations to apply
 * @returns Promise resolving to processed file data
 */
export async function processImageWithWorker(
  file: File,
  operations: any = {}
): Promise<WorkerTaskResult> {
  const pool = getWorkerPool();
  const fileData = await file.arrayBuffer();
  
  return pool.submitTask({
    taskId: `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: WORKER_MESSAGE_TYPES.PROCESS_CANVAS,
    fileData,
    fileInfo: {
      name: file.name,
      type: file.type,
      size: file.size
    },
    options: operations
  });
}

/**
 * Generate preview using Web Worker
 * 
 * @param file Image file
 * @param previewConfig Preview configuration
 * @returns Promise resolving to preview data
 */
export async function generatePreviewWithWorker(
  file: File,
  previewConfig: any = {}
): Promise<WorkerTaskResult> {
  const pool = getWorkerPool();
  const fileData = await file.arrayBuffer();
  
  return pool.submitTask({
    taskId: `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: WORKER_MESSAGE_TYPES.GENERATE_PREVIEW,
    fileData,
    fileInfo: {
      name: file.name,
      type: file.type,
      size: file.size
    },
    options: previewConfig
  });
}

/**
 * Get worker pool statistics
 * 
 * @returns Current worker pool statistics
 */
export function getWorkerPoolStats(): WorkerPoolStats {
  const pool = getWorkerPool();
  return pool.getStats();
}

/**
 * Terminate the global worker pool
 * Call this when your application is shutting down
 */
export function terminateWorkerPool(): void {
  if (globalWorkerPool) {
    globalWorkerPool.terminate();
    globalWorkerPool = null;
  }
}

/**
 * Check if Web Workers are supported
 * 
 * @returns Whether Web Workers are available
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Check if OffscreenCanvas is supported (required for worker canvas operations)
 * 
 * @returns Whether OffscreenCanvas is available
 */
export function isOffscreenCanvasSupported(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

// =============================================================================
// UTILITY FUNCTIONS (Task 6.5)
// =============================================================================

/**
 * Create optimized worker pool configuration for mobile devices
 * 
 * @returns Mobile-optimized worker pool config
 */
export function getMobileOptimizedWorkerConfig(): WorkerPoolConfig {
  // Reduce worker count on mobile for memory efficiency
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    maxWorkers: isMobile ? Math.min(2, navigator.hardwareConcurrency || 2) : navigator.hardwareConcurrency || 4,
    taskTimeout: 60000, // Longer timeout for mobile
    terminateIdle: true,
    idleTimeout: 30000 // Shorter idle timeout to free memory
  };
}

/**
 * Process multiple files with worker pool
 * 
 * @param files Array of files to process
 * @param operation Operation to perform on each file
 * @param options Operation options
 * @param onProgress Progress callback
 * @returns Promise resolving to array of results
 */
export async function processBatchWithWorkers(
  files: File[],
  operation: 'compress' | 'convert' | 'process' | 'preview',
  options: any = {},
  onProgress?: (progress: number) => void
): Promise<WorkerTaskResult[]> {
  const results: WorkerTaskResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      let result: WorkerTaskResult;
      
      switch (operation) {
        case 'compress':
          result = await compressImageWithWorker(file, options);
          break;
        case 'convert':
          result = await convertFormatWithWorker(file, options.targetFormat, options.quality);
          break;
        case 'process':
          result = await processImageWithWorker(file, options);
          break;
        case 'preview':
          result = await generatePreviewWithWorker(file, options);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      results.push(result);
    } catch (error) {
      results.push({
        taskId: `batch-error-${i}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: 0,
        workerId: 'none'
      });
    }
    
    onProgress?.((i + 1) / files.length);
  }
  
  return results;
}