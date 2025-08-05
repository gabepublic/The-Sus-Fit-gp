import { TryonSchema } from '../../../src/app/api/tryon/schema';
import { normalizeBase64 } from '../../../src/lib/tryOnSchema';

describe('TryonSchema', () => {
  describe('valid payloads', () => {
    it('should validate a correct payload', () => {
      const validPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      const result = TryonSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('should validate payload with multiple apparel images', () => {
      const validPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: [
          'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        ]
      };

      const result = TryonSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('should validate payload with pure base64 strings', () => {
      const validPayload = {
        modelImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: ['iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      const result = TryonSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });
  });

  describe('normalizeBase64 function', () => {
    it('should strip data URL prefix from base64 strings', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const expected = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      expect(normalizeBase64(dataUrl)).toBe(expected);
    });

    it('should return pure base64 strings unchanged', () => {
      const pureBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      expect(normalizeBase64(pureBase64)).toBe(pureBase64);
    });

    it('should handle different image formats', () => {
      const jpegDataUrl = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const expected = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      expect(normalizeBase64(jpegDataUrl)).toBe(expected);
    });
  });

  describe('invalid payloads', () => {
    it('should reject payload with missing modelImage', () => {
      const invalidPayload = {
        apparelImages: ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      expect(() => TryonSchema.parse(invalidPayload)).toThrow('Required');
    });

    it('should reject payload with empty modelImage', () => {
      const invalidPayload = {
        modelImage: '',
        apparelImages: ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      expect(() => TryonSchema.parse(invalidPayload)).toThrow('Missing model image');
    });

    it('should reject payload with missing apparelImages', () => {
      const invalidPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };

      expect(() => TryonSchema.parse(invalidPayload)).toThrow('Required');
    });

    it('should reject payload with empty apparelImages array', () => {
      const invalidPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: []
      };

      expect(() => TryonSchema.parse(invalidPayload)).toThrow('At least one apparel image required');
    });

    it('should reject payload with empty string in apparelImages', () => {
      const invalidPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: ['', 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      expect(() => TryonSchema.parse(invalidPayload)).toThrow('Invalid apparel image');
    });

    it('should reject payload with invalid base64 data', () => {
      const invalidPayload = {
        modelImage: 'not-base64-data',
        apparelImages: ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      expect(() => TryonSchema.parse(invalidPayload)).toThrow('Invalid base64 image data');
    });
  });
}); 