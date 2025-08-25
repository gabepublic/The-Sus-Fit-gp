import { z } from 'zod'

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'Claude API key is required'),
  PINECONE_API_KEY: z.string().min(1, 'Pinecone API key is required'),
  PINECONE_ENVIRONMENT: z.string().min(1, 'Pinecone environment is required'),
  PINECONE_INDEX_NAME: z.string().min(1, 'Pinecone index name is required'),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_TRACING_V2: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // During CI/build, provide mock values to allow the build to complete
      if (process.env.CI) {
        console.warn('Environment validation failed in CI, using mock values for build')
        return {
          ANTHROPIC_API_KEY: 'sk-mock-anthropic-key',
          PINECONE_API_KEY: 'mock-pinecone-key',
          PINECONE_ENVIRONMENT: 'mock-environment',
          PINECONE_INDEX_NAME: 'mock-index',
          LANGCHAIN_API_KEY: undefined,
          LANGCHAIN_TRACING_V2: undefined,
          NEXT_PUBLIC_APP_URL: undefined,
          NODE_ENV: process.env.NODE_ENV,
        }
      }
      
      console.error('Environment validation failed:')
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`)
      })
      throw new Error('Invalid environment variables')
    }
    throw error
  }
}

// Only validate env at import time if not in test environment
export const env = process.env.NODE_ENV === 'test' ? {} as Env : validateEnv()