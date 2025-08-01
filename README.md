[![NPM Version](https://img.shields.io/npm/v/@deco-cx/warp-node)](https://www.npmjs.com/package/@deco-cx/warp-node)
[![NPM Downloads](https://img.shields.io/npm/dm/@deco-cx/warp-node)](https://www.npmjs.com/package/@deco-cx/warp-node)
[![GitHub License](https://img.shields.io/github/license/deco-cx/warp-node)](https://github.com/deco-cx/warp-node/blob/main/LICENSE)

# Warp Node

**Warp Node** is a simple tool that allows your locally running HTTP(s) servers
to have a public URL, serving as an easy-to-self-host alternative to services
like `ngrok`. Warp Node is implemented for Node.js and other JavaScript runtimes
with the goal of providing flexibility and minimal dependencies.

The project has two main components:

- **Server**: Deployable on a server, it connects to the outside world and is
  accessible from any domain.
- **Client**: Runs locally to connect a given HTTP endpoint running on a local
  or non-public network.

<img width="1390" alt="image" src="https://github.com/deco-cx/warp/assets/5839364/914ab723-02cf-4a1a-9799-72671ffa5974">

## Installation

```bash
npm install @deco-cx/warp-node
```

## Requirements

- Node.js 22+ (for Node.js environments - requires Promise.withResolvers support)
- Works in Cloudflare Workers, Deno, and other JavaScript runtimes

## Server

The Warp server opens a single HTTP port to which the Warp client connects and
upgrades to a WebSocket connection. Each request to this HTTP port is forwarded
(based on the client's HOST header) to the corresponding connected Warp client
connection, which then serves the request.

### Usage

To start the Warp server, import the `serve` function from the Warp package and
call it with the appropriate configuration.

#### Example

```typescript
import { serve } from "@deco-cx/warp-node";

const port = 8080; // The port where the Warp server will listen
const apiKeys = ["YOUR_API_KEY1", "YOUR_API_KEY2"]; // Array of API keys for authentication

const server = serve({ port, apiKeys });
console.log(`Warp server listening on port ${port}`);
```

#### Parameters

- `port`: The port number where the Warp server will listen for connections.
- `apiKeys`: An array of API keys used for client authentication.

## Client

The Warp client connects to the Warp server. Upon connection, the client shares
the given API key and the domain it wants to receive requests for.

### Usage

To connect a client to the Warp server, import the `connect` function from the
Warp package and call it with the appropriate configuration.

#### Example

```typescript
import { connect } from "@deco-cx/warp-node";

const port = 3000; // The local port you want to expose
const domain = "www.your.domain.com"; // The domain name for your service
const server = "wss://YOUR_SERVER"; // The WebSocket URL of your Warp server
const apiKey = "YOUR_API_KEY"; // The apiKey

const { registered, closed } = await connect({
  domain,
  localAddr: `http://localhost:${port}`,
  server,
  apiKey,
});

await registered;
console.log("Client registered successfully");

closed.then(() => {
  console.log("Connection closed");
});
```

#### Parameters

- `domain`: The domain name that will be used to access your localhost service.
- `localAddr`: The local address of the service you want to expose (e.g.,
  `http://localhost:3000`).
- `server`: The WebSocket URL of your Warp server (e.g., `wss://YOUR_SERVER`).
- `apiKey`: The apiKey for connecting to the Warp server.

#### Return Values

- `registered`: A promise that resolves when the client has successfully
  registered with the server.
- `closed`: A promise that resolves when the connection to the server is closed.

## Example Workflow

Here’s a complete example of setting up a Warp server and client:

### Server

```typescript
import { serve } from "@deco-cx/warp-node";

const port = 8080;
const apiKeys = ["YOUR_API_KEY1", "YOUR_API_KEY2"];

const server = serve({ port, apiKeys });
console.log(`Warp server listening on port ${port}`);
```

### Client

```typescript
import { connect } from "@deco-cx/warp-node";

const port = 3000;
const domain = "www.your.domain.com";
const server = "wss://YOUR_SERVER";
const apiKey = "API_KEY";

(async () => {
  const { registered, closed } = await connect({
    domain,
    localAddr: `http://localhost:${port}`,
    server,
    apiKey,
  });

  await registered;
  console.log("Client registered successfully");

  closed.then(() => {
    console.log("Connection closed");
  });
})();
```

## Runtime Compatibility

Warp Node is designed to work across multiple JavaScript runtimes:

- **Node.js 22+**: Full support with native HTTP and WebSocket handling
- **Cloudflare Workers**: Works with WebSocketPair API
- **Deno**: Compatible with Deno's WebSocket implementation
- **Bun**: Should work with Bun's WebSocket support

The library automatically detects the runtime environment and uses the
appropriate APIs.

## TypeScript Support

This package includes full TypeScript definitions. No additional `@types`
packages are needed.

```typescript
import {
  connect,
  type ConnectOptions,
  type HandlerOptions,
  serve,
} from "@deco-cx/warp-node";
```

## Troubleshooting

### Common Issues

- **Invalid API Key**: Ensure that the API key you are using is listed in the
  `apiKeys` array on the server.
- **Connection Refused**: Check that the server is running and accessible at the
  specified WebSocket URL.
- **Domain Not Accessible**: Ensure that the domain name is correctly configured
  and pointing to the Warp server.
- **Node.js Version**: Ensure you're using Node.js 22 or later for full
  compatibility.

## Contributing

This project is open source. Feel free to contribute by submitting issues or
pull requests.

## License

MIT License - see [LICENSE](./LICENSE) file for details.
