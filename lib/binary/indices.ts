export type BinaryIndexDefinition = {
  symbol: string;
  name: string;
  tickIntervalMs: 1000 | 2000;
  movementScale: number;
};

const standard = [10, 15, 25, 50, 75, 100].map(volatility => ({
  symbol: `V${volatility}`,
  name: `Volatility ${volatility} Index`,
  tickIntervalMs: 2000 as const,
  movementScale: volatility / 100,
}));

const oneSecond = [10, 15, 25, 50, 75, 100, 150, 250].map(volatility => ({
  symbol: `V${volatility}_1S`,
  name: `Volatility ${volatility} (1s) Index`,
  tickIntervalMs: 1000 as const,
  movementScale: volatility / 100,
}));

export const BINARY_INDEX_CATALOGUE: BinaryIndexDefinition[] = [...standard, ...oneSecond];
