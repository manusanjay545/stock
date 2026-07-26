// ============================================================
// QuantStrike AI — Number & Date Formatters
// ============================================================

/**
 * Format a number as Indian Rupee currency
 */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number with Indian-style commas (e.g., 12,34,567)
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format large numbers in compact form (12.5K, 1.2L, 3.4Cr)
 */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (Math.abs(value) >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format change with sign and color class
 */
export function formatChange(value: number, decimals = 2): { text: string; className: string } {
  const sign = value > 0 ? "+" : "";
  return {
    text: `${sign}${value.toFixed(decimals)}`,
    className: value > 0 ? "text-green-400" : value < 0 ? "text-red-400" : "text-gray-400",
  };
}

/**
 * Format date string
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format time string
 */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Format datetime
 */
export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

/**
 * Format expiry date for display (e.g., "31 Jul 2025")
 */
export function formatExpiry(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Get score color based on thresholds
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Moderate";
  if (score >= 40) return "Weak";
  return "Poor";
}

/**
 * Relative time (e.g. "2 minutes ago")
 */
export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
