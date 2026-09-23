import { describe, it, expect, vi } from "vitest";
import { normalizeEmail, rpIdForOrigin, encodeCredentialId } from "./auth";

// Mock the external dependencies
vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
  FieldValue: {
    serverTimestamp: vi.fn(() => new Date()),
  },
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(),
}));

vi.mock("firebase-admin/app-check", () => ({
  getAppCheck: vi.fn(),
}));

vi.mock("@google-cloud/error-reporting", () => ({
  ErrorReporting: vi.fn().mockImplementation(function () {
    this.report = vi.fn();
  }),
}));

describe("Auth Utilities", () => {
  describe("normalizeEmail", () => {
    it("lowercases and trims email", () => {
      expect(normalizeEmail("  Test@Example.COM  ")).toBe("test@example.com");
    });

    it("handles empty string", () => {
      expect(normalizeEmail("")).toBe("");
    });

    it("handles null", () => {
      expect(normalizeEmail(null as string | null)).toBe("");
    });

    it("handles undefined", () => {
      expect(normalizeEmail(undefined as string | undefined)).toBe("");
    });
  });

  describe("rpIdForOrigin", () => {
    it("returns localhost for localhost origin", () => {
      expect(rpIdForOrigin("http://localhost:5173")).toBe("localhost");
    });

    it("returns 127.0.0.1 for 127.0.0.1 origin", () => {
      expect(rpIdForOrigin("http://127.0.0.1:5173")).toBe("127.0.0.1");
    });

    it("returns sovereign.nyc for www.sovereign.nyc", () => {
      expect(rpIdForOrigin("https://www.sovereign.nyc")).toBe("sovereign.nyc");
    });

    it("returns hostname for other origins", () => {
      expect(rpIdForOrigin("https://example.com")).toBe("example.com");
    });

    it("returns DEFAULT_RP_ID for invalid origin", () => {
      expect(rpIdForOrigin("invalid")).toBe("sovereign.nyc");
    });
  });

  describe("encodeCredentialId", () => {
    it("returns string as-is", () => {
      const id = "test-credential-id";
      expect(encodeCredentialId(id)).toBe(id);
    });

    it("converts Uint8Array to base64url", () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const result = encodeCredentialId(buffer);
      expect(result).toBe("AQIDBA");
    });
  });
});