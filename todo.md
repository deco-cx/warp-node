# Deno to Node.js Migration Plan

## Overview
This project is a WebSocket tunneling library that currently uses Deno-specific APIs. The migration will focus on replacing Deno APIs with Node.js equivalents while maintaining the same functionality.

## High Priority Tasks

### 1. Update package.json
- Remove Deno-specific scripts (`deno test`, `deno fmt`, etc.)
- Add Node.js scripts (`npm test`, `npm run build`, etc.) 
- Add required Node.js dependencies: `ws`, `undici`, `@types/ws`
- Update existing devDependencies as needed

### 2. Replace JSON import assertion in client.ts
- Replace `import denoJSON from "./deno.json" assert { type: "json" };` 
- Use `fs.readFileSync` + `JSON.parse` to read package.json version
- Update version reference from `denoJSON.version` to package.json version

### 3. Replace Deno.serve with Node.js HTTP server in server.ts
- Replace `Deno.serve()` with Node.js `http.createServer()`
- Update `serve()` function return type from `Deno.HttpServer<Deno.NetAddr>` 
- Maintain same handler interface for compatibility

### 4. Replace Deno.upgradeWebSocket with ws library in runtime.ts
- Replace `Deno.upgradeWebSocket(req)` with `ws` library WebSocket upgrade
- Update `upgradeWebSocket()` function to use Node.js WebSocket implementation
- Maintain same return interface `{ socket: WebSocket; response: Response }`

## Medium Priority Tasks

### 5. Replace Deno.createHttpClient with Node.js equivalent
- Replace `Deno.createHttpClient()` with `undici` or native fetch
- Update client HTTP requests to use Node.js APIs
- Maintain same configuration options

### 6. Update Worker API usage for Node.js compatibility
- Replace Deno Worker API with Node.js `worker_threads`
- Update worker permissions and message passing
- Maintain same interface for service worker functionality

### 7. Add Node.js specific configuration
- Create `tsconfig.json` for TypeScript compilation
- Configure ESM module resolution
- Set up proper Node.js target and lib settings

### 8. Update import/export statements
- Add `.js` extensions to relative imports for Node.js ESM compatibility
- Ensure all imports work with Node.js module resolution
- Update any dynamic imports if needed

## Low Priority Tasks

### 9. Remove Deno-specific files
- Delete `deno.json`
- Delete `deno.lock`
- Clean up any Deno-specific configuration

## Key APIs to Replace

| Deno API | Node.js Replacement |
|----------|-------------------|
| `Deno.serve()` | `http.createServer()` |
| `Deno.upgradeWebSocket()` | `ws` library |
| `Deno.createHttpClient()` | `undici` or native fetch |
| `import ... assert { type: "json" }` | `fs.readFileSync()` + `JSON.parse()` |
| Deno Worker API | `worker_threads` |

## Notes
- Focus on functionality first, tests will be handled later
- Maintain existing TypeScript interfaces and public API
- Keep Cloudflare Workers compatibility (DurableObject class)
- Preserve WebSocket tunneling functionality
- Runtime detection should still work for different environments