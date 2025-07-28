import { describe, expect, it } from "vitest";
import { Queue } from "../queue.js";
import { makeChan } from "../channel.js";
import { dataViewerSerializer, jsonSerializer } from "../serializers.js";

describe("Unit Tests", () => {
  describe("Queue", () => {
    it("should create empty queue", () => {
      const queue = new Queue<number>();
      expect(queue.size).toBe(0);
      expect(queue.locked).toBe(false);
    });

    it("should push items", () => {
      const queue = new Queue<string>();
      queue.push("first");
      queue.push("second");

      expect(queue.size).toBe(2);
      expect(queue.locked).toBe(false);
    });

    it("should pop items asynchronously", async () => {
      const queue = new Queue<string>();
      queue.push("test-value");

      const value = await queue.pop();
      expect(value).toBe("test-value");
      expect(queue.size).toBe(0);
    });
  });

  describe("Channel", () => {
    it("should create channel with default capacity", () => {
      const channel = makeChan<string>();
      expect(channel).toBeDefined();
      expect(typeof channel.send).toBe("function");
      expect(typeof channel.recv).toBe("function");
      expect(typeof channel.close).toBe("function");
    });

    it("should create channel with custom capacity", () => {
      const channel = makeChan<number>(5);
      expect(channel).toBeDefined();
    });
  });

  describe("Serializers", () => {
    it("should create JSON serializer", () => {
      const serializer = jsonSerializer();
      expect(serializer).toBeDefined();
      expect(typeof serializer.serialize).toBe("function");
      expect(typeof serializer.deserialize).toBe("function");
    });

    it("should serialize and deserialize JSON messages", () => {
      const serializer = jsonSerializer();
      const data = { chunk: new Uint8Array([1, 2, 3]) };

      const serialized = serializer.serialize(data);
      expect(typeof serialized).toBe("string");

      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(data);
    });

    it("should create DataView serializer", () => {
      const serializer = dataViewerSerializer();
      expect(serializer).toBeDefined();
      expect(typeof serializer.serialize).toBe("function");
      expect(typeof serializer.deserialize).toBe("function");
    });
  });
});
