import { describe, it, expect } from 'vitest';
import { serve, serveHandler } from '../server.js';
import { connect } from '../client.js';
import { getRuntimeKey } from '../runtime.js';

describe('Basic API Tests', () => {
  it('should export serve function', () => {
    expect(typeof serve).toBe('function');
  });

  it('should export serveHandler function', () => {
    expect(typeof serveHandler).toBe('function');
  });

  it('should export connect function', () => {
    expect(typeof connect).toBe('function');
  });

  it('should detect Node.js runtime', () => {
    const runtime = getRuntimeKey();
    expect(runtime).toBe('node');
  });

  it('should create server handler with correct options', () => {
    const handler = serveHandler({
      apiKeys: ['test-key'],
      connectPath: '/test-connect'
    });
    
    expect(typeof handler).toBe('function');
  });

  it('should handle basic server creation', () => {
    const server = serve({
      apiKeys: ['test-key'],
      port: 0 // Use port 0 to avoid conflicts
    });
    
    expect(server).toBeDefined();
    expect(typeof server.listen).toBe('function');
    expect(typeof server.close).toBe('function');
    
    // Clean up
    server.close();
  });
});