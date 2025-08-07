/**
 * Mock OpenAI SDK for testing
 * 
 * Provides a mock implementation of the OpenAI client with the images.edit method
 * for testing the generateTryOn function without making actual API calls.
 */

export default class OpenAI {
  public images = {
    edit: jest.fn()
  };

  constructor(config?: { apiKey: string }) {
    // Mock constructor that accepts config but doesn't use it
  }
}
