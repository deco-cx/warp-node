// copied from https://github.com/honojs/hono/blob/80c7e225af5fd8f92b3a69015fe78c546b678ba9/src/helper/adapter/index.ts#L45 under MIT License.
/**
 * @module
 * Adapter Helper for Hono.
 */
import { WebSocketServer } from "ws";
import process from "node:process";

const SHOW_DEBUG = process.env.DEBUG === "1";

export type Runtime =
  | "node"
  | "deno"
  | "bun"
  | "workerd"
  | "fastly"
  | "edge-light"
  | "other";

const knownUserAgents: Partial<Record<Runtime, string>> = {
  deno: "Deno",
  bun: "Bun",
  workerd: "Cloudflare-Workers",
  node: "Node.js",
};

export const getRuntimeKey = (): Runtime => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const global = globalThis as any;

  // check if the current runtime supports navigator.userAgent
  const userAgentSupported = typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string";

  // if supported, check the user agent
  if (userAgentSupported) {
    for (const [runtimeKey, userAgent] of Object.entries(knownUserAgents)) {
      if (checkUserAgentEquals(userAgent)) {
        return runtimeKey as Runtime;
      }
    }
  }

  // check if running on Edge Runtime
  if (typeof global?.EdgeRuntime === "string") {
    return "edge-light";
  }

  // check if running on Fastly
  if (global?.fastly !== undefined) {
    return "fastly";
  }

  // userAgent isn't supported before Node v21.1.0; so fallback to the old way
  if (global?.process?.release?.name === "node") {
    return "node";
  }

  // couldn't detect the runtime
  return "other";
};

const checkUserAgentEquals = (platform: string): boolean => {
  const userAgent = navigator.userAgent;

  return userAgent.startsWith(platform);
};

export const upgradeWebSocket = (
  req: Request,
): { socket: WebSocket; response: Response } => {
  const runtimeKey = getRuntimeKey();

  if (SHOW_DEBUG) {
    console.log("[upgradeWebSocket] detected runtime:", runtimeKey);
  }

  if (runtimeKey === "deno") {
    // @ts-ignore: Deno global not available in Node.js
    return Deno.upgradeWebSocket(req);
  }

  if (runtimeKey === "node") {
    // For Node.js, we need to handle WebSocket upgrade differently
    // This is a simplified version - in practice, you'd need to properly handle the upgrade
    const wss = new WebSocketServer({ noServer: true });

    // Create a mock WebSocket-like object for compatibility
    const socket = new EventTarget() as WebSocket;

    return {
      socket,
      response: new Response(null, {
        status: 101,
        headers: {
          "Upgrade": "websocket",
          "Connection": "Upgrade",
        },
      }),
    };
  }

  // For Cloudflare Workers and other runtimes
  // @ts-ignore: WebSocketPair is not part of the global scope
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);
  // @ts-ignore: WebSocketPair is not part of the global scope
  const originalAccept = server.accept.bind(server);
  // @ts-ignore: WebSocketPair is not part of the global scope
  server.accept = () => {
    originalAccept();
    // @ts-ignore: WebSocketPair is not part of the global scope
    server.dispatchEvent(new Event("open"));
  };
  return {
    socket: server as WebSocket,
    response: new Response(null, {
      status: 101,
      // @ts-ignore: webSocket is not part of the Response type
      webSocket: client,
    }),
  };
};
