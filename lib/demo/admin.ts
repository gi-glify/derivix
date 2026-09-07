import type { KycProfile, KycStatus, Transaction } from "./types";

export function reviewKyc(status: KycStatus, decision: "APPROVED" | "REJECTED" | "REQUIRES_REVIEW") { return status === "PENDING" || status === "REQUIRES_REVIEW" ? decision : status; }
export function approveWithdrawal(transaction: Transaction) { return transaction.type === "WITHDRAWAL" && transaction.status === "PENDING" ? { ...transaction, status: "COMPLETED" as const } : transaction; }
export function adminOverview(transactions: Transaction[], kyc: KycProfile) { return { deposits: transactions.filter((item) => item.type === "DEPOSIT" && item.status === "COMPLETED").reduce((sum, item) => sum + item.amount, 0), pendingWithdrawals: transactions.filter((item) => item.type === "WITHDRAWAL" && item.status === "PENDING").length, kycStatus: kyc.status }; }
