// ========================================================
//  Market Pulse — Frontend Application Logic
// ========================================================

(function () {
  'use strict';

  const API_URL = '/api/market-data';
  const REFRESH_INTERVAL = 1000; // 1 second auto-refresh

  // DOM References
  const elements = {
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    tableContainer: document.getElementById('table-container'),
    statusBadge: document.getElementById('status-badge'),
    statusText: document.getElementById('status-text'),
    lastUpdated: document.getElementById('last-updated'),
    refreshBtn: document.getElementById('refresh-btn'),
    retryBtn: document.getElementById('retry-btn'),

    // Filters
    sectorFilter: document.getElementById('sector-filter'),
    nifty50Filter: document.getElementById('nifty50-filter'),

    // Stats
    totalStocks: document.getElementById('total-stocks'),
    gainerCount: document.getElementById('gainer-count'),
    loserCount: document.getElementById('loser-count'),
    rsiCount: document.getElementById('rsi-count'),

    // Tab elements
    tabGainers: document.getElementById('tab-gainers'),
    tabLosers: document.getElementById('tab-losers'),
    tabRsi: document.getElementById('tab-rsi'),
    rsiBadge: document.getElementById('rsi-badge'),

    // Panels
    panelGainers: document.getElementById('panel-gainers'),
    panelLosers: document.getElementById('panel-losers'),
    panelRsi: document.getElementById('panel-rsi'),

    // Table bodies
    gainersTbody: document.getElementById('gainers-tbody'),
    losersTbody: document.getElementById('losers-tbody'),
    rsiTbody: document.getElementById('rsi-tbody'),

    // Count labels
    gainersCountLabel: document.getElementById('gainers-count-label'),
    losersCountLabel: document.getElementById('losers-count-label'),
    rsiCountLabel: document.getElementById('rsi-count-label'),

    // No data
    noRsiData: document.getElementById('no-rsi-data'),
    rsiTable: document.getElementById('rsi-table')
  };

  let currentTab = 'gainers';
  let refreshTimer = null;
  let latestData = null;

  // -------- Tab Navigation --------
  function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        switchTab(target);
      });
    });
  }

  function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Update panels
    document.querySelectorAll('.data-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${tab}`).classList.add('active');
  }

  // -------- Status Updates --------
  function setStatus(type, text) {
    elements.statusBadge.className = 'status-badge';
    if (type === 'loading') elements.statusBadge.classList.add('loading');
    if (type === 'error') elements.statusBadge.classList.add('error');
    elements.statusText.textContent = text;
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // -------- Number Formatting --------
  function formatPrice(num) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return '₹' + Number(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatChange(num) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const sign = num >= 0 ? '+' : '';
    return sign + Number(num).toFixed(2);
  }

  function formatPercent(num) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const sign = num >= 0 ? '+' : '';
    return sign + Number(num).toFixed(2) + '%';
  }

  // -------- RSI Helpers --------
  function getRsiColor(rsi) {
    if (rsi === null) return 'var(--text-muted)';
    if (rsi >= 80) return 'var(--color-loss)';
    if (rsi >= 70) return 'var(--color-rsi-strong)';
    if (rsi >= 50) return 'var(--color-gain)';
    if (rsi >= 30) return 'var(--text-secondary)';
    return 'var(--color-loss)';
  }

  function getRsiBarClass(rsi) {
    if (rsi >= 80) return 'rsi-fill-danger';
    if (rsi >= 70) return 'rsi-fill-warning';
    return 'rsi-fill-normal';
  }

  function getRsiSignal(rsi) {
    if (rsi >= 80) return { text: 'Extreme', class: 'signal-extreme' };
    return { text: 'Overbought', class: 'signal-overbought' };
  }

  // -------- Render RSI Cell --------
  function renderRsiCell(rsi) {
    if (rsi === null || rsi === undefined) {
      return '<span style="color: var(--text-muted)">—</span>';
    }
    const color = getRsiColor(rsi);
    const barClass = getRsiBarClass(rsi);
    return `
      <span class="rsi-cell">
        <span class="rsi-value" style="color: ${color}">${rsi.toFixed(1)}</span>
        <span class="rsi-bar"><span class="rsi-bar-fill ${barClass}" style="width: ${rsi}%"></span></span>
      </span>
    `;
  }

  // -------- Table Row Builders --------
  function buildGainerRow(stock, index) {
    const rankClass = index < 3 ? 'rank-top3' : '';
    return `
      <tr>
        <td><span class="rank-num ${rankClass}">${index + 1}</span></td>
        <td class="symbol-cell">${stock.symbol}</td>
        <td class="sector-cell"><span class="sector-badge">${stock.sector || 'Others'}</span></td>
        <td class="price-cell">${formatPrice(stock.ltp)}</td>
        <td class="change-positive">${formatChange(stock.change)}</td>
        <td>
          <span class="percent-badge positive">▲ ${formatPercent(stock.changePercent)}</span>
        </td>
        <td style="color: var(--text-secondary)">${formatPrice(stock.open)}</td>
        <td style="color: var(--text-secondary)">${formatPrice(stock.high)}</td>
        <td style="color: var(--text-secondary)">${formatPrice(stock.low)}</td>
        <td>${renderRsiCell(stock.rsi)}</td>
      </tr>
    `;
  }

  function buildLoserRow(stock, index) {
    const rankClass = index < 3 ? 'rank-top3-loss' : '';
    return `
      <tr>
        <td><span class="rank-num ${rankClass}">${index + 1}</span></td>
        <td class="symbol-cell">${stock.symbol}</td>
        <td class="sector-cell"><span class="sector-badge">${stock.sector || 'Others'}</span></td>
        <td class="price-cell">${formatPrice(stock.ltp)}</td>
        <td class="change-negative">${formatChange(stock.change)}</td>
        <td>
          <span class="percent-badge negative">▼ ${formatPercent(stock.changePercent)}</span>
        </td>
        <td style="color: var(--text-secondary)">${formatPrice(stock.open)}</td>
        <td style="color: var(--text-secondary)">${formatPrice(stock.high)}</td>
        <td style="color: var(--text-secondary)">${formatPrice(stock.low)}</td>
        <td>${renderRsiCell(stock.rsi)}</td>
      </tr>
    `;
  }

  function buildRsiRow(stock, index) {
    const signal = getRsiSignal(stock.rsi);
    const changeClass = stock.changePercent >= 0 ? 'change-positive' : 'change-negative';
    const percentClass = stock.changePercent >= 0 ? 'positive' : 'negative';
    const arrow = stock.changePercent >= 0 ? '▲' : '▼';

    return `
      <tr>
        <td><span class="rank-num">${index + 1}</span></td>
        <td class="symbol-cell">${stock.symbol}</td>
        <td class="sector-cell"><span class="sector-badge">${stock.sector || 'Others'}</span></td>
        <td class="price-cell">${formatPrice(stock.ltp)}</td>
        <td class="${changeClass}">${formatChange(stock.change)}</td>
        <td>
          <span class="percent-badge ${percentClass}">${arrow} ${formatPercent(stock.changePercent)}</span>
        </td>
        <td>${renderRsiCell(stock.rsi)}</td>
        <td style="text-align: right">
          <span class="signal-badge ${signal.class}">${signal.text}</span>
        </td>
      </tr>
    `;
  }

  // -------- Filter Data --------
  function filterStocks(stocks) {
    if (!stocks) return [];
    const sector = elements.sectorFilter.value;
    const nifty50 = elements.nifty50Filter.checked;
    
    return stocks.filter(stock => {
      let pass = true;
      if (sector !== 'All' && stock.sector !== sector) pass = false;
      if (nifty50 && !stock.isNifty50) pass = false;
      return pass;
    });
  }

  // -------- Render Data --------
  function renderData(data) {
    if (!data) return;
    latestData = data;

    const filteredAll = filterStocks(data.allStocks);
    const filteredGainers = filterStocks(data.gainers);
    const filteredLosers = filterStocks(data.losers);
    const filteredRsi = filterStocks(data.rsiAbove70);

    // Stats
    elements.totalStocks.textContent = filteredAll.length;
    elements.gainerCount.textContent = filteredGainers.length;
    elements.loserCount.textContent = filteredLosers.length;
    elements.rsiCount.textContent = filteredRsi.length;
    elements.rsiBadge.textContent = filteredRsi.length;

    // Count labels
    elements.gainersCountLabel.textContent = `${filteredGainers.length} stocks`;
    elements.losersCountLabel.textContent = `${filteredLosers.length} stocks`;
    elements.rsiCountLabel.textContent = `${filteredRsi.length} stocks`;

    // Gainers table
    if (filteredGainers.length > 0) {
      elements.gainersTbody.innerHTML = filteredGainers.map((s, i) => buildGainerRow(s, i)).join('');
    } else {
      elements.gainersTbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted)">No gainers found for this filter</td></tr>';
    }

    // Losers table
    if (filteredLosers.length > 0) {
      elements.losersTbody.innerHTML = filteredLosers.map((s, i) => buildLoserRow(s, i)).join('');
    } else {
      elements.losersTbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted)">No losers found for this filter</td></tr>';
    }

    // RSI table
    if (filteredRsi.length > 0) {
      elements.rsiTbody.innerHTML = filteredRsi.map((s, i) => buildRsiRow(s, i)).join('');
      elements.rsiTable.classList.remove('hidden');
      elements.noRsiData.classList.add('hidden');
    } else {
      elements.rsiTbody.innerHTML = '';
      elements.rsiTable.classList.add('hidden');
      elements.noRsiData.classList.remove('hidden');
    }

    // Last updated
    if (data.lastUpdated) {
      elements.lastUpdated.textContent = `Updated: ${formatTime(data.lastUpdated)}`;
    }
  }

  // -------- Fetch Market Data --------
  async function fetchData(isRefresh = false) {
    try {
      if (!isRefresh) {
        elements.loadingState.classList.remove('hidden');
        elements.errorState.classList.add('hidden');
        elements.tableContainer.classList.add('hidden');
      }

      setStatus('loading', 'Fetching...');
      elements.refreshBtn.classList.add('spinning');

      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Show data
      elements.loadingState.classList.add('hidden');
      elements.errorState.classList.add('hidden');
      elements.tableContainer.classList.remove('hidden');

      renderData(data);
      
      if (data.isFetching) {
        setStatus('loading', 'Fetching quotes...');
        elements.refreshBtn.classList.add('spinning');
      } else {
        setStatus('live', 'Live');
        elements.refreshBtn.classList.remove('spinning');
      }

    } catch (error) {
      console.error('Fetch error:', error);

      if (!isRefresh) {
        elements.loadingState.classList.add('hidden');
        elements.tableContainer.classList.add('hidden');
        elements.errorState.classList.remove('hidden');
        elements.errorMessage.textContent = error.message || 'Failed to connect to the server. Make sure the backend is running.';
      }

      setStatus('error', 'Error');
      elements.refreshBtn.classList.remove('spinning');
    }
  }

  // -------- Auto Refresh --------
  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => fetchData(true), REFRESH_INTERVAL);
  }

  // -------- Event Listeners --------
  function initEvents() {
    elements.refreshBtn.addEventListener('click', () => {
      // Clear cache and re-fetch
      fetch('/api/refresh').then(() => fetchData(true));
    });

    elements.retryBtn.addEventListener('click', () => {
      fetchData(false);
    });

    elements.sectorFilter.addEventListener('change', () => {
      if (latestData) renderData(latestData);
    });
    
    elements.nifty50Filter.addEventListener('change', () => {
      if (latestData) renderData(latestData);
    });
  }

  // -------- Initialize --------
  function init() {
    initTabs();
    initEvents();
    fetchData(false);
    startAutoRefresh();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
