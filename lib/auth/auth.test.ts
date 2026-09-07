import { describe, expect, it } from "vitest";
import { validateLogin, validateRegistration } from "./auth";

describe("demo auth validation", () => {
  it("requires valid registration details", () => {
    expect(validateRegistration({ fullName: "A", email: "bad", password: "short", confirmPassword: "short" })).toContain("full name");
    expect(validateRegistration({ fullName: "Alex Smith", email: "alex@example.com", password: "password", confirmPassword: "different" })).toContain("match");
    expect(validateRegistration({ fullName: "Alex Smith", email: "alex@example.com", password: "password123", confirmPassword: "password123" })).toBeNull();
  });
  it("requires a valid login shape", () => {
    expect(validateLogin("bad", "password")).toContain("valid");
    expect(validateLogin("alex@example.com", "")).toContain("password");
    expect(validateLogin("alex@example.com", "password123")).toBeNull();
  });
});
