import { describe, expect, it } from "vitest";
import { completedBalance, hasCompletedDeposit, validateWithdrawal } from "./ledger";
import type { Transaction } from "./types";

const deposit: Transaction = { id: "d1", type: "DEPOSIT", amount: 5000, status: "COMPLETED", provider: "Demo M-Pesa", description: "Deposit", createdAt: "2026-09-07" };

describe("demo ledger", () => {
  it("does not count pending deposits in the available balance", () => {
    expect(completedBalance([{ ...deposit, status: "PENDING" }])).toBe(0);
  });

  it("unlocks trading only after a completed deposit", () => {
    expect(hasCompletedDeposit([{ ...deposit, status: "PENDING" }])).toBe(false);
    expect(hasCompletedDeposit([deposit])).toBe(true);
  });

  it("adds profits and subtracts withdrawals from completed balance", () => {
    expect(completedBalance([deposit, { ...deposit, id: "p1", type: "TRADE_PROFIT", amount: 350 }, { ...deposit, id: "w1", type: "WITHDRAWAL", amount: 1000 }])).toBe(4350);
  });

  it("validates withdrawals against the available balance", () => {
    expect(validateWithdrawal(0, 5000)).toContain("greater");
    expect(validateWithdrawal(6000, 5000)).toContain("exceeds");
    expect(validateWithdrawal(2500, 5000)).toBeNull();
  });
});
