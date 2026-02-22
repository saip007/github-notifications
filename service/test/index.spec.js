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

  it('handles OPTIONS preflight', async () => {
    const request = new Request('http://example.com', { method: 'OPTIONS' });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
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

describe('mark-read route', () => {
  it('requires threadId', async () => {
    const request = new Request('http://example.com/mark-read', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok' }),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Missing `threadId`' });
  });

  it('requires token', async () => {
    const request = new Request('http://example.com/mark-read', {
      method: 'POST',
      body: JSON.stringify({ threadId: '123' }),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Missing `token`' });
  });

  it('proxies PATCH to GitHub and returns success', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 205 }));
    const request = new Request('http://example.com/mark-read', {
      method: 'POST',
      body: JSON.stringify({ threadId: '42', token: 'tok' }),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/notifications/threads/42',
      expect.objectContaining({ method: 'PATCH' }),
    );
    fetchMock.mockRestore();
  });
});

describe('mark-all-read route', () => {
  it('requires token', async () => {
    const request = new Request('http://example.com/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Missing `token`' });
  });

  it('proxies PUT to GitHub and returns success', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 205 }));
    const request = new Request('http://example.com/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok' }),
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/notifications',
      expect.objectContaining({ method: 'PUT' }),
    );
    fetchMock.mockRestore();
  });
});
