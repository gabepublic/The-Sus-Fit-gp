import { ResizeOptions, ImagesMetadata } from '@/lib/imageResizingService';

// Re-export ResizeOptions for external use
export type { ResizeOptions };


// export interface ResizeOptions {
//     width?: number;
//     height?: number;
//     fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
//     format?: 'jpeg' | 'png' | 'webp' | 'tiff';
//     quality?: number;
//     withoutEnlargement?: boolean;
// }
    
export interface ResizeResponse {
    success: boolean;
    message?: string;
    error?: string;
    resizedB64?: string
    metadata?: ImagesMetadata;
    resizeInfo?: {
        options: ResizeOptions;
        compressionRatio: number;
    };
}

export class ResizeService {
    /**
     * Resize an image with custom options
     */
    static async resizeImage(
        imageB64: string,
        options: ResizeOptions
    ): Promise<ResizeResponse> {
        try {
            console.log('resizeService - imageB64', imageB64.substring(0, 50) + '...');
            console.log('resizeService - options', options);
            const response = await fetch('/api/resize', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                imageB64,
                options,
                }),
            });

            const data = await response.json();
            console.log('resizeService -result:', data);

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Failed to resize image',
                };
            }

            return data;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    /**
     * Validate resize options
     */
    static validateResizeOptions(options: ResizeOptions): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (options.width !== undefined) {
            if (!Number.isInteger(options.width) || options.width < 1 || options.width > 10000) {
                errors.push('Width must be an integer between 1 and 10000 pixels');
            }
        }

        if (options.height !== undefined) {
            if (!Number.isInteger(options.height) || options.height < 1 || options.height > 10000) {
                errors.push('Height must be an integer between 1 and 10000 pixels');
            }
        }

        if (options.quality !== undefined) {
            if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) {
                errors.push('Quality must be an integer between 1 and 100');
            }
        }

        if (options.fit && !['cover', 'contain', 'fill', 'inside', 'outside'].includes(options.fit)) {
            errors.push('Fit must be one of: cover, contain, fill, inside, outside');
        }

        if (options.format && !['jpeg', 'png', 'webp', 'tiff'].includes(options.format)) {
            errors.push('Format must be one of: jpeg, png, webp, tiff');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

}
