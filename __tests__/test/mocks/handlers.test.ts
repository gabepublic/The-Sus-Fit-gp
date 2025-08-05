import { handlers } from '@/test/mocks/handlers'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// Create a test server
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('mock handlers', () => {
  it('has the correct number of handlers', () => {
    expect(handlers).toHaveLength(4)
  })

  it('handles Claude API requests', async () => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id', 'msg_test123')
    expect(data).toHaveProperty('type', 'message')
    expect(data).toHaveProperty('role', 'assistant')
    expect(data.content[0]).toHaveProperty('text', 'This is a mock response from Claude API')
    expect(data).toHaveProperty('model', 'claude-3-sonnet-20240229')
  })

  it('handles Pinecone upsert requests', async () => {
    const response = await fetch('https://api.pinecone.io/v1/indexes/test-index/vectors/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: [{ id: 'test-vector', values: [1, 2, 3] }],
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('upsertedCount', 1)
  })

  it('handles Pinecone query requests', async () => {
    const response = await fetch('https://api.pinecone.io/v1/indexes/test-index/vectors/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: [1, 2, 3],
        topK: 5,
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('matches')
    expect(data.matches).toHaveLength(1)
    expect(data.matches[0]).toHaveProperty('id', 'test-vector-1')
    expect(data.matches[0]).toHaveProperty('score', 0.9)
    expect(data.matches[0].metadata).toHaveProperty('text', 'This is a test vector')
  })

  it('handles OpenAI API requests', async () => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id', 'chatcmpl-test123')
    expect(data).toHaveProperty('object', 'chat.completion')
    expect(data).toHaveProperty('model', 'gpt-3.5-turbo')
    expect(data.choices[0].message).toHaveProperty('content', 'This is a mock response from OpenAI API')
    expect(data.choices[0]).toHaveProperty('finish_reason', 'stop')
  })

  it('handles different Pinecone index names', async () => {
    const response = await fetch('https://api.pinecone.io/v1/indexes/another-index/vectors/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: [{ id: 'test-vector', values: [1, 2, 3] }],
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('upsertedCount', 1)
  })

  it('returns proper HTTP response structure', async () => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })

    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('handles requests with different payloads', async () => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'What is 2+2?' },
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('choices')
    expect(data.choices).toHaveLength(1)
  })
}) 