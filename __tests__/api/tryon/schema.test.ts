import { TryonSchema } from '../../../src/app/api/tryon/schema';

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

      expect(() => TryonSchema.parse(invalidPayload)).toThrow('String must contain at least 1 character(s)');
    });
  });
}); 