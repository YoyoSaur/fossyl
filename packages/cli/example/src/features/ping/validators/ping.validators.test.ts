import { describe, it, expect } from "vitest";
import { createPingSchema, updatePingSchema, listPingQuerySchema } from "./ping.validators";

describe("ping validators", () => {
  describe("createPingSchema", () => {
    it("accepts valid message", () => {
      const result = createPingSchema.parse({ message: "hello" });
      expect(result).toEqual({ message: "hello" });
    });

    it("rejects empty message", () => {
      expect(() => createPingSchema.parse({ message: "" })).toThrow();
    });

    it("rejects missing message", () => {
      expect(() => createPingSchema.parse({})).toThrow();
    });

    it("rejects message over 255 chars", () => {
      expect(() => createPingSchema.parse({ message: "a".repeat(256) })).toThrow();
    });
  });

  describe("updatePingSchema", () => {
    it("accepts valid message", () => {
      const result = updatePingSchema.parse({ message: "updated" });
      expect(result).toEqual({ message: "updated" });
    });

    it("accepts empty body", () => {
      const result = updatePingSchema.parse({});
      expect(result).toEqual({});
    });

    it("rejects empty string", () => {
      expect(() => updatePingSchema.parse({ message: "" })).toThrow();
    });
  });

  describe("listPingQuerySchema", () => {
    it("accepts empty query", () => {
      const result = listPingQuerySchema.parse({});
      expect(result).toEqual({});
    });

    it("accepts search param", () => {
      const result = listPingQuerySchema.parse({ search: "test" });
      expect(result).toEqual({ search: "test" });
    });
  });
});
