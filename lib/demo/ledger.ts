import type { Transaction } from "./types";

export function completedBalance(transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.status === "COMPLETED")
    .reduce((balance, transaction) => {
      const credit = ["DEPOSIT", "TRADE_PROFIT"].includes(transaction.type);
      return balance + (credit ? transaction.amount : -transaction.amount);
    }, 0);
}

export function hasCompletedDeposit(transactions: Transaction[]) {
  return transactions.some((transaction) => transaction.type === "DEPOSIT" && transaction.status === "COMPLETED");
}

export function validateWithdrawal(amount: number, balance: number) {
  if (amount <= 0) return "Enter a withdrawal amount greater than zero.";
  if (amount > balance) return "Withdrawal amount exceeds your available balance.";
  return null;
}
