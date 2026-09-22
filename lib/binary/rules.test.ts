import { describe, expect, it } from "vitest";
import { evaluateDigitContract, extractLastDigit, type BinaryContractType } from "./rules";

describe("binary digit contract rules", () => {
  it.each([
    ["OVER", 4, 5, true], ["OVER", 4, 4, false],
    ["UNDER", 4, 3, true], ["UNDER", 4, 4, false],
    ["MATCHES", 7, 7, true], ["MATCHES", 7, 6, false],
    ["DIFFERS", 7, 6, true], ["DIFFERS", 7, 7, false],
    ["ODD", null, 9, true], ["ODD", null, 8, false],
    ["EVEN", null, 8, true], ["EVEN", null, 9, false],
  ] as [BinaryContractType, number | null, number, boolean][]) ("evaluates %s %s against %s", (type, prediction, digit, won) => {
    expect(evaluateDigitContract(type, prediction, digit).won).toBe(won);
  });

  it("extracts the final displayed digit from a fixed precision quote", () => {
    expect(extractLastDigit(1245.673, 3)).toBe(3);
    expect(extractLastDigit(8356.428, 3)).toBe(8);
  });

  it("rejects a prediction outside the digit range", () => {
    expect(() => evaluateDigitContract("MATCHES", 10, 4)).toThrow("Prediction must be a digit");
  });
});
