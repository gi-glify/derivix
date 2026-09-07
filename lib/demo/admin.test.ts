import { describe, expect, it } from "vitest";
import { adminOverview, approveWithdrawal, reviewKyc } from "./admin";

describe("demo administration", () => {
  it("only lets admins change reviewable KYC states", () => { expect(reviewKyc("PENDING", "APPROVED")).toBe("APPROVED"); expect(reviewKyc("NOT_STARTED", "APPROVED")).toBe("NOT_STARTED"); });
  it("completes pending withdrawals without changing other transactions", () => { const withdrawal = { id: "w1", type: "WITHDRAWAL" as const, amount: 1000, status: "PENDING" as const, provider: "M-Pesa", description: "Withdrawal", createdAt: "2026-09-07" }; expect(approveWithdrawal(withdrawal).status).toBe("COMPLETED"); expect(approveWithdrawal({ ...withdrawal, type: "DEPOSIT" }).status).toBe("PENDING"); });
  it("summarizes admin activity", () => { const deposit = { id: "d1", type: "DEPOSIT" as const, amount: 5000, status: "COMPLETED" as const, provider: "M-Pesa", description: "Deposit", createdAt: "2026-09-07" }; expect(adminOverview([deposit], { status: "PENDING", fullName: "Alex Smith", country: "Kenya", documentType: "National ID", documentNumber: "123" }).deposits).toBe(5000); });
});
