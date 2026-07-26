// ============================================================
// QuantStrike AI — API Client Wrapper
// ============================================================

import { API_BASE_URL } from "./constants";
import type { ApiResponse, PaginatedResponse } from "./types";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.detail || error.message || `API error: ${response.status}`
        );
      }
      return response.json();
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("API error")) {
        throw error;
      }
      // Network or parsing error — use mock data fallback
      console.warn(`API unavailable (${endpoint}), using mock data`);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const query = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return this.request<T>(`${endpoint}${query}`);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // ── Dashboard ──────────────────────────────────────────
  dashboard = {
    get: () => this.get<ApiResponse<import("./types").DashboardData>>("/dashboard"),
  };

  // ── Market Data ────────────────────────────────────────
  market = {
    getOverview: () => this.get<ApiResponse<import("./types").MarketOverview>>("/market/overview"),
    getData: (symbol: string) =>
      this.get<ApiResponse<import("./types").MarketDataWithIndicators>>(`/market/${symbol}`),
    getIndicators: (symbol: string) =>
      this.get<ApiResponse<import("./types").Indicators>>(`/market/${symbol}/indicators`),
  };

  // ── Option Chain ───────────────────────────────────────
  optionChain = {
    get: (symbol: string, expiry?: string) =>
      this.get<ApiResponse<import("./types").OptionChainData>>(
        `/option-chain/${symbol}`,
        expiry ? { expiry } : undefined
      ),
    getExpiries: (symbol: string) =>
      this.get<ApiResponse<string[]>>(`/option-chain/${symbol}/expiries`),
  };

  // ── Recommendations ────────────────────────────────────
  recommendations = {
    getAll: (params?: Record<string, string>) =>
      this.get<PaginatedResponse<import("./types").Recommendation>>(
        "/recommendations",
        params
      ),
    getById: (id: string) =>
      this.get<ApiResponse<import("./types").Recommendation>>(
        `/recommendations/${id}`
      ),
  };

  // ── Scanner ────────────────────────────────────────────
  scanner = {
    getResults: (params?: Record<string, string>) =>
      this.get<ApiResponse<import("./types").ScannerResult[]>>(
        "/scanner",
        params
      ),
  };

  // ── Watchlist ──────────────────────────────────────────
  watchlist = {
    getAll: () =>
      this.get<ApiResponse<import("./types").Watchlist[]>>("/watchlist"),
    create: (data: { name: string }) =>
      this.post<ApiResponse<import("./types").Watchlist>>("/watchlist", data),
    addItem: (watchlistId: string, item: Partial<import("./types").WatchlistItem>) =>
      this.post<ApiResponse<import("./types").WatchlistItem>>(
        `/watchlist/${watchlistId}/items`,
        item
      ),
    removeItem: (watchlistId: string, itemId: string) =>
      this.delete<ApiResponse<void>>(
        `/watchlist/${watchlistId}/items/${itemId}`
      ),
    deleteWatchlist: (id: string) =>
      this.delete<ApiResponse<void>>(`/watchlist/${id}`),
  };

  // ── Alerts ─────────────────────────────────────────────
  alerts = {
    getAll: () =>
      this.get<ApiResponse<import("./types").Alert[]>>("/alerts"),
    create: (data: Partial<import("./types").Alert>) =>
      this.post<ApiResponse<import("./types").Alert>>("/alerts", data),
    delete: (id: string) =>
      this.delete<ApiResponse<void>>(`/alerts/${id}`),
    toggle: (id: string) =>
      this.put<ApiResponse<import("./types").Alert>>(`/alerts/${id}/toggle`),
  };

  // ── Backtesting ────────────────────────────────────────
  backtest = {
    run: (input: import("./types").BacktestInput) =>
      this.post<ApiResponse<import("./types").BacktestResult>>(
        "/backtest/run",
        input
      ),
    getHistory: () =>
      this.get<ApiResponse<import("./types").BacktestResult[]>>(
        "/backtest/history"
      ),
  };

  // ── Settings ───────────────────────────────────────────
  settings = {
    get: () =>
      this.get<ApiResponse<import("./types").AppSettings>>("/settings"),
    update: (data: Partial<import("./types").AppSettings>) =>
      this.put<ApiResponse<import("./types").AppSettings>>("/settings", data),
  };
}

export const api = new ApiClient(API_BASE_URL);
