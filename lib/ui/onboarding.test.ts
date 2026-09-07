import { describe, expect, it } from "vitest";
import { onboardingSteps } from "./onboarding";

describe("first-time onboarding", () => {
  it("covers the core workspace journey in order", () => {
    expect(onboardingSteps.map((step) => step.title)).toEqual(["Welcome to Derivix", "Your overview", "Markets", "Trade", "Wallet and account"]);
    expect(onboardingSteps.slice(1).every((step) => step.href)).toBe(true);
  });
});
