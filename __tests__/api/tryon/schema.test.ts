import { TryonSchema } from '../../../src/app/api/tryon/schema';
import { 
  normalizeBase64, 
  Base64Str, 
  TryOnParamsSchema, 
  TryOnResultSchema 
} from '../../../src/lib/tryOnSchema';

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

    // New tests to improve branch coverage
    it('should handle malformed data URL without comma', () => {
      const malformedDataUrl = 'data:image/png;base64';
      
      expect(normalizeBase64(malformedDataUrl)).toBe(malformedDataUrl);
    });

    it('should handle data URL with empty base64 part', () => {
      const dataUrlWithEmptyBase64 = 'data:image/png;base64,';
      
      expect(normalizeBase64(dataUrlWithEmptyBase64)).toBe('');
    });

    it('should handle string that starts with data:image/ but is not a valid data URL', () => {
      const invalidDataUrl = 'data:image/png;base64,invalid-base64-data';
      
      expect(normalizeBase64(invalidDataUrl)).toBe('invalid-base64-data');
    });
  });

  describe('Base64Str schema', () => {
    it('should validate valid data URLs', () => {
      const validDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      expect(() => Base64Str.parse(validDataUrl)).not.toThrow();
    });

    it('should validate valid pure base64 strings', () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      expect(() => Base64Str.parse(validBase64)).not.toThrow();
    });

    it('should validate base64 strings with different padding', () => {
      // Test that the regex accepts valid base64 strings
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      expect(() => Base64Str.parse(validBase64)).not.toThrow();
    });

    it('should reject invalid base64 strings', () => {
      const invalidBase64 = 'not-base64-data';
      
      expect(() => Base64Str.parse(invalidBase64)).toThrow('Invalid base64 image data');
    });

    it('should reject malformed data URLs', () => {
      const malformedDataUrl = 'data:image/png;base64,invalid-base64-data';
      
      expect(() => Base64Str.parse(malformedDataUrl)).toThrow('Invalid base64 image data');
    });
  });

  describe('TryOnParamsSchema', () => {
    it('should validate correct parameters', () => {
      const validParams = {
        modelImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };
      
      expect(() => TryOnParamsSchema.parse(validParams)).not.toThrow();
    });

    it('should reject missing modelImage', () => {
      const invalidParams = {
        apparelImages: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };
      
      expect(() => TryOnParamsSchema.parse(invalidParams)).toThrow('Required');
    });

    it('should reject empty apparelImages array', () => {
      const invalidParams = {
        modelImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: []
      };
      
      expect(() => TryOnParamsSchema.parse(invalidParams)).toThrow('At least one apparel image is required');
    });
  });

  describe('TryOnResultSchema', () => {
    it('should validate correct result', () => {
      const validResult = {
        imgGenerated: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };
      
      expect(() => TryOnResultSchema.parse(validResult)).not.toThrow();
    });

    it('should validate result with pure base64', () => {
      const validResult = {
        imgGenerated: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };
      
      expect(() => TryOnResultSchema.parse(validResult)).not.toThrow();
    });

    it('should reject missing imgGenerated', () => {
      const invalidResult = {};
      
      expect(() => TryOnResultSchema.parse(invalidResult)).toThrow('Required');
    });

    it('should reject invalid base64 in imgGenerated', () => {
      const invalidResult = {
        imgGenerated: 'not-base64-data'
      };
      
      expect(() => TryOnResultSchema.parse(invalidResult)).toThrow('Invalid base64 image data');
    });

    it('should reject empty imgGenerated', () => {
      const invalidResult = {
        imgGenerated: 'invalid-base64-data'
      };
      
      expect(() => TryOnResultSchema.parse(invalidResult)).toThrow('Invalid base64 image data');
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