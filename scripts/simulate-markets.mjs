import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the market simulator.");

const client = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const markets = { "EUR/USD": 1.1724, "GBP/USD": 1.3452, "USD/JPY": 157.24, "XAU/USD": 3492.5, "BTC/USD": 111240 };

function tick(symbol) {
  const previous = markets[symbol];
  const change = previous * ((Math.random() - 0.5) * 0.0008);
  const close = Number((previous + change).toFixed(symbol === "BTC/USD" ? 2 : 4));
  markets[symbol] = close;
  const spread = Math.abs(change) + previous * 0.00015;
  return { symbol, open: previous, high: Number((Math.max(previous, close) + spread).toFixed(8)), low: Number((Math.min(previous, close) - spread).toFixed(8)), close, volume: Number((Math.random() * 1000 + 100).toFixed(4)), interval: "1m" };
}

async function writeTicks() {
  const rows = Object.keys(markets).map(tick);
  const { error } = await client.from("market_ticks").insert(rows);
  if (error) console.error(new Date().toISOString(), error.message); else console.log(new Date().toISOString(), "wrote", rows.length, "market ticks");
}

await writeTicks();
setInterval(writeTicks, 1500);
