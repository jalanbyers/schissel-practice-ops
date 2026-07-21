import { config } from 'dotenv';
config();

import { describe, it, expect, beforeEach } from 'vitest';
import { Runner, InMemorySessionService } from '@google/adk';
import { rootAgent } from '../../app/agent.js';

// These integration tests call the live Gemini API and require credentials.
// Skipped when no key is present so the workspace test command stays green
// locally and in CI without secrets. Set GEMINI_API_KEY (or
// GOOGLE_GENAI_API_KEY) to run them.
const hasApiKey = Boolean(
  process.env['GEMINI_API_KEY'] ?? process.env['GOOGLE_GENAI_API_KEY'],
);

describe.skipIf(!hasApiKey)('Agent Integration', () => {
  let runner: Runner;
  let sessionService: InMemorySessionService;

  beforeEach(() => {
    sessionService = new InMemorySessionService();
    runner = new Runner({
      appName: 'test-app',
      agent: rootAgent,
      sessionService,
    });
  });

  it('should respond to a weather query', async () => {
    await sessionService.createSession({
      appName: 'test-app',
      userId: 'test-user',
      sessionId: 'test-session',
    });

    const events: unknown[] = [];
    for await (const event of runner.runAsync({
      userId: 'test-user',
      sessionId: 'test-session',
      newMessage: {
        role: 'user',
        parts: [{ text: 'What is the weather in San Francisco?' }],
      },
    })) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);
  }, 30000);

  it('should respond to another weather query', async () => {
    await sessionService.createSession({
      appName: 'test-app',
      userId: 'test-user',
      sessionId: 'test-session-2',
    });

    const events: unknown[] = [];
    for await (const event of runner.runAsync({
      userId: 'test-user',
      sessionId: 'test-session-2',
      newMessage: {
        role: 'user',
        parts: [{ text: 'What is the weather in New York?' }],
      },
    })) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);
  }, 30000);
});
