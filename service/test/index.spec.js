import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src';

describe('OAuth token worker', () => {
  it('rejects non-POST requests', async () => {
    const request = new Request('http://example.com', { method: 'GET' });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(405);
    expect(await response.text()).toBe('Method Not Allowed');
  });

  it('requires code in request body', async () => {
    const request = new Request('http://example.com', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Missing `code`' });
  });

  it('handles invalid JSON', async () => {
    const request = new Request('http://example.com', {
      method: 'POST',
      body: 'not json',
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns access token when code provided', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'token123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    Object.assign(env, {
      GITHUB_CLIENT_ID: 'id',
      GITHUB_CLIENT_SECRET: 'secret',
    });
    const request = new Request('http://example.com', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc' }),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ access_token: 'token123' });
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
  });
});
