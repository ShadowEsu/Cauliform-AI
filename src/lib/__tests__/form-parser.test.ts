import { describe, it, expect } from "vitest";
import {
  extractFormId,
  isValidGoogleFormUrl,
} from "../form-parser";

describe("extractFormId", () => {
  it("extracts ID from docs.google.com/forms/d/e/ URL", () => {
    const url =
      "https://docs.google.com/forms/d/e/1FAIpQLSeYpuyaG0XcrMvoxGugjTgsqafpGJyH5x5tQDJ7HSXNIyt8tQ/viewform?usp=dialog";
    expect(extractFormId(url)).toBe(
      "1FAIpQLSeYpuyaG0XcrMvoxGugjTgsqafpGJyH5x5tQDJ7HSXNIyt8tQ"
    );
  });

  it("extracts ID from docs.google.com/forms/d/ URL", () => {
    const url =
      "https://docs.google.com/forms/d/abc123/viewform";
    expect(extractFormId(url)).toBe("abc123");
  });

  it("extracts ID from forms.google.com URL", () => {
    const url =
      "https://forms.google.com/forms/d/e/abc123/viewform";
    expect(extractFormId(url)).toBe("abc123");
  });

  it("returns null for invalid URL", () => {
    expect(extractFormId("https://google.com")).toBeNull();
    expect(extractFormId("not a url")).toBeNull();
  });
});

describe("isValidGoogleFormUrl", () => {
  it("accepts valid docs.google.com form URLs", () => {
    expect(
      isValidGoogleFormUrl(
        "https://docs.google.com/forms/d/e/1FAIpQLSe/viewform"
      )
    ).toBe(true);
  });

  it("accepts valid forms.google.com URLs", () => {
    expect(
      isValidGoogleFormUrl(
        "https://forms.google.com/forms/d/e/1FAIpQLSe/viewform"
      )
    ).toBe(true);
  });

  it("rejects non-Google URLs", () => {
    expect(isValidGoogleFormUrl("https://example.com/forms/")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isValidGoogleFormUrl("not a url")).toBe(false);
  });

  it("rejects Google URLs without /forms/", () => {
    expect(
      isValidGoogleFormUrl("https://docs.google.com/document/d/123")
    ).toBe(false);
  });
});
