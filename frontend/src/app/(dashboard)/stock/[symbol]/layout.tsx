export function generateStaticParams() {
  const symbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC", "HINDUNILVR", "SBIN", "BHARTIARTL", "NIFTY", "BANKNIFTY"];
  return symbols.map((symbol) => ({
    symbol: symbol,
  }));
}

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
