import { describe, it, expect } from "vitest";
import { submitGoogleForm } from "../form-submitter";
import { parseGoogleForm } from "../form-parser";

const TEST_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeYpuyaG0XcrMvoxGugjTgsqafpGJyH5x5tQDJ7HSXNIyt8tQ/viewform";

describe("Form Submission via TinyFish", () => {
  it(
    "parses form and extracts entry IDs",
    async () => {
      const formData = await parseGoogleForm(TEST_FORM_URL);
      expect(formData.questions.length).toBe(3);
      for (const q of formData.questions) {
        expect(q.entryId).toBeDefined();
        expect(typeof q.entryId).toBe("number");
      }
    },
    15000
  );

  it(
    "submits a Google Form via TinyFish browser agent",
    async () => {
      const responses = [
        { questionTitle: "Whats your name?", answer: "Cauliform Test Bot" },
        { questionTitle: "How old are you?", answer: "42" },
        { questionTitle: "what grade are you?", answer: "Junior" },
      ];

      const result = await submitGoogleForm(TEST_FORM_URL, responses);

      console.log("TinyFish result:", JSON.stringify(result, null, 2));

      // If TINYFISH_API_KEY is not set, it will return an error
      if (result.error === "TINYFISH_API_KEY not set") {
        console.log("Skipping: TINYFISH_API_KEY not configured");
        return;
      }

      expect(result.success).toBe(true);
      expect(result.steps).toBeGreaterThan(0);
    },
    180000 // 3 min timeout — TinyFish can take a while
  );
});
