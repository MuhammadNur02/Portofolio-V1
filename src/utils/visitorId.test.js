import { describe, it, expect, afterEach, vi } from "vitest";
import { getDeviceTraits, getVisitorId } from "./visitorId";

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

describe("visitor id", () => {
  it("is created once and stays the same on every later visit", () => {
    vi.stubGlobal("localStorage", fakeStorage());
    const first = getVisitorId();
    // The database parameter is a uuid, so anything else would be rejected.
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(getVisitorId()).toBe(first);
  });

  it("differs between browsers", () => {
    vi.stubGlobal("localStorage", fakeStorage());
    const one = getVisitorId();
    vi.stubGlobal("localStorage", fakeStorage());
    expect(getVisitorId()).not.toBe(one);
  });

  it("is null when storage is blocked (e.g. private mode) — the database then relies on its own fingerprint", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    vi.stubGlobal("localStorage", blocked);
    expect(getVisitorId()).toBe(null);
  });
});

describe("device traits", () => {
  const chromium = (model) => ({ userAgentData: { getHighEntropyValues: async () => ({ model }) } });

  it("is the screen size plus the device model", async () => {
    vi.stubGlobal("screen", { width: 360, height: 800 });
    vi.stubGlobal("navigator", chromium("SM-A155F"));
    expect(await getDeviceTraits()).toBe("360x800 SM-A155F");
  });

  it("does not change when the phone is rotated", async () => {
    vi.stubGlobal("navigator", chromium("SM-A155F"));
    vi.stubGlobal("screen", { width: 360, height: 800 });
    const portrait = await getDeviceTraits();
    vi.stubGlobal("screen", { width: 800, height: 360 });
    expect(await getDeviceTraits()).toBe(portrait);
  });

  it("is just the screen size where the model is unknown (desktop Chrome, Safari, Firefox)", async () => {
    vi.stubGlobal("screen", { width: 1920, height: 1080 });
    vi.stubGlobal("navigator", chromium(""));
    expect(await getDeviceTraits()).toBe("1080x1920");
    vi.stubGlobal("navigator", {});
    expect(await getDeviceTraits()).toBe("1080x1920");
  });

  it("keeps the screen size when the browser refuses to give the model", async () => {
    vi.stubGlobal("screen", { width: 1920, height: 1080 });
    vi.stubGlobal("navigator", {
      userAgentData: {
        getHighEntropyValues: async () => {
          throw new Error("blocked");
        },
      },
    });
    expect(await getDeviceTraits()).toBe("1080x1920");
  });

  it("is empty, never an error, outside a browser", async () => {
    vi.stubGlobal("screen", undefined);
    expect(await getDeviceTraits()).toBe("");
  });
});
