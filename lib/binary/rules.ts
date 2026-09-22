export type BinaryContractType = "OVER" | "UNDER" | "MATCHES" | "DIFFERS" | "ODD" | "EVEN";

export function extractLastDigit(value: number, precision: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(precision) || precision < 0 || precision > 12) {
    throw new Error("A finite value and precision from 0 to 12 are required");
  }
  const fixed = value.toFixed(precision);
  const digit = Number(fixed.at(-1));
  if (!Number.isInteger(digit)) throw new Error("Unable to extract the final digit");
  return digit;
}

export function evaluateDigitContract(type: BinaryContractType, prediction: number | null, finalDigit: number): { won: boolean; reason: string } {
  if (!Number.isInteger(finalDigit) || finalDigit < 0 || finalDigit > 9) throw new Error("Final digit must be between 0 and 9");
  if (["OVER", "UNDER", "MATCHES", "DIFFERS"].includes(type) && (!Number.isInteger(prediction) || prediction! < 0 || prediction! > 9)) {
    throw new Error("Prediction must be a digit");
  }
  const barrier = prediction as number;
  const won = type === "OVER" ? finalDigit > barrier
    : type === "UNDER" ? finalDigit < barrier
      : type === "MATCHES" ? finalDigit === barrier
        : type === "DIFFERS" ? finalDigit !== barrier
          : type === "ODD" ? finalDigit % 2 === 1
            : finalDigit % 2 === 0;
  return { won, reason: won ? "Condition met" : "Condition not met" };
}
