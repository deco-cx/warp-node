import { request } from "undici";
import { makeWebSocket } from "./channel.js";
import pkg from "./package.json" with { type: "json" };
import { handleServerMessage } from "./handlers.client.js";
import type { ClientMessage, ClientState, ServerMessage } from "./messages.js";
import { dataViewerSerializer } from "./serializers.js";

export const CLIENT_VERSION_QUERY_STRING = "v";
/**
 * Options for establishing a connection.
 * @typedef {Object} ConnectOptions
 * @property {string} apiKey - The apiKey used for connecting to the server.
 * @property {string} domain - The domain to register the connection with.
 * @property {string} server - The WebSocket server URL.
 * @property {string} localAddr - The local address for the WebSocket connection.
 * @property {boolean} sw - If it should use a service worker.
 */
export interface ConnectOptions {
  apiKey: string;
  domain: string;
  server: string;
  localAddr: string;
  sw?: boolean;
}

/**
 * Represents a connection status object.
 * @typedef {Object} Connected
 * @property {Promise<void>} closed - A promise that resolves when the connection is closed.
 * @property {Promise<void>} registered - A promise that resolves when the connection is registered.
 */
export interface Connected {
  closed: Promise<Error | undefined>;
  registered: Promise<void>;
}

/**
 * Establishes a WebSocket connection with the server.
 * @param {ConnectOptions} opts - Options for establishing the connection.
 * @returns {Promise<Connected>} A promise that resolves with the connection status.
 */
export const connectMainThread = async (
  opts: ConnectOptions,
): Promise<Connected> => {
  const closed = Promise.withResolvers<Error | undefined>();
  const registered = Promise.withResolvers<void>();
  const client = request; // Use undici.request for Node.js to allow host header override

  const socket = new WebSocket(
    `${opts.server}/_connect?${CLIENT_VERSION_QUERY_STRING}=${pkg.version}`,
  );
  const ch = await makeWebSocket<ClientMessage, ServerMessage, ArrayBuffer>(
    socket,
    dataViewerSerializer(),
  );
  await ch.out.send({
    id: crypto.randomUUID(),
    type: "register",
    apiKey: opts.apiKey,
    domain: opts.domain,
  });
  const wsSockets: Record<string, WebSocket> = {};

  (async () => {
    let reason: undefined | Error;
    const state: ClientState = {
      client,
      localAddr: opts.localAddr,
      live: false,
      requests: {},
      wsSockets,
      ch,
    };
    try {
      for await (const message of ch.in.recv()) {
        await handleServerMessage(state, message);
        if (state.live) {
          registered.resolve();
        }
      }
    } catch (err) {
      reason = err as Error;
      console.error(new Date(), "error handling message", err);
    } finally {
      closed.resolve(reason);
    }
  })();
  return { closed: closed.promise, registered: registered.promise };
};

/**
 * Establishes a WebSocket connection with the server.
 * @param {ConnectOptions} opts - Options for establishing the connection.
 * @returns {Promise<Connected>} A promise that resolves with the connection status.
 */
export const connectSW = (opts: ConnectOptions): Promise<Connected> => {
  const closed = Promise.withResolvers<Error | undefined>();
  const registered = Promise.withResolvers<void>();
  
  // For Node.js, use worker_threads instead of Web Workers
  if (typeof process !== "undefined" && process.versions?.node) {
    import("worker_threads").then(({ Worker }) => {
      const worker = new Worker(import.meta.url);
      worker.on("message", (message) => {
        if (message === "closed") {
          closed.resolve(undefined);
        }
        if (message === "registered") {
          registered.resolve();
        }
      });
      worker.postMessage(opts);
    });
  } else {
    // For other environments (browsers, Deno), use Web Workers
    const worker = new Worker(import.meta.url, {
      type: "module",
    });
    worker.addEventListener("message", (message) => {
      if (message.data === "closed") {
        closed.resolve(undefined);
      }
      if (message.data === "registered") {
        registered.resolve();
      }
    });
    worker.postMessage(opts);
  }

  return Promise.resolve({
    closed: closed.promise,
    registered: registered.promise,
  });
};

// Worker message handler - works for both Web Workers and worker_threads
if (typeof process !== "undefined" && process.versions?.node) {
  // Node.js worker_threads
  import("worker_threads").then(({ parentPort }) => {
    if (parentPort) {
      parentPort.on("message", async (evt) => {
        const { closed, registered } = await connectMainThread(evt);
        closed.then(() => parentPort!.postMessage("closed"));
        registered.then(() => parentPort!.postMessage("registered"));
      });
    }
  });
} else {
  // Web Workers (browsers, Deno)
  // @ts-ignore: "trust-me"
  self.onmessage = async (evt) => {
    const { closed, registered } = await connectMainThread(evt.data);
    // @ts-ignore: "trust-me"
    closed.then(() => self.postMessage("closed"));
    // @ts-ignore: "trust-me"
    registered.then(() => self.postMessage("registered"));
  };
}

/**
 * Establishes a WebSocket connection with the server.
 * @param {ConnectOptions} opts - Options for establishing the connection.
 * @returns {Promise<Connected>} A promise that resolves with the connection status.
 */
export const connect = async (opts: ConnectOptions): Promise<Connected> => {
  return opts.sw ? connectSW(opts) : await connectMainThread(opts);
};
