import { describe, it, expect, afterEach, vi } from "vitest";
import { hasSeenWelcome, markWelcomeSeen } from "./welcomeSession";

const fakeStorage = () => {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("welcome screen session flag", () => {
  it("is false for a new session and true once marked", () => {
    vi.stubGlobal("sessionStorage", fakeStorage());
    expect(hasSeenWelcome()).toBe(false);
    markWelcomeSeen();
    expect(hasSeenWelcome()).toBe(true);
  });

  it("never throws when storage is blocked (e.g. private mode) — the welcome screen just shows again", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    vi.stubGlobal("sessionStorage", blocked);
    expect(hasSeenWelcome()).toBe(false);
    expect(() => markWelcomeSeen()).not.toThrow();
  });
});
