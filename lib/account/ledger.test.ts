import { describe, expect, it } from "vitest";
import { availableBalance, validateLedgerAmount } from "./types";

describe("universal account ledger rules", () => {
  it("derives available balance after active reservations", () => {
    expect(availableBalance({ total: 100, reserved: 35 })).toBe(65);
  });

  it("rejects a reservation that exceeds available funds", () => {
    expect(() => validateLedgerAmount(66, { total: 100, reserved: 35 })).toThrow("Insufficient available balance");
  });

  it("rejects non-positive ledger amounts", () => {
    expect(() => validateLedgerAmount(0, { total: 100, reserved: 0 })).toThrow("Amount must be greater than zero");
  });
});
