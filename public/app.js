// ═══════════════════════════════════════════════════════
//  MarketPulse AI — Core Application Logic
//  Unified Overview Dashboard with Change Detection
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  const POLL = 15000;
  const DEBOUNCE = 200;
  const TOAST_MS = 3000;

  const THRESHOLD_MINOR = 1;
  const THRESHOLD_WATCH = 3;
  const THRESHOLD_HIGH  = 5;

  const KEY_WL = 'mp_watchlist';
  const KEY_SNAP = 'mp_snapshots';
  const KEY_LAST = 'mp_last_visit';
  const KEY_PORTFOLIO = 'mp_paper_portfolio';
  const KEY_ORDERS = 'mp_paper_orders';
  const KEY_BALANCE = 'mp_paper_balance';
  const INITIAL_BALANCE = 1000000; // ₹10,00,000

  let watchlist = JSON.parse(localStorage.getItem(KEY_WL) || '["RELIANCE","TCS","HDFCBANK","INFY","ITC"]');
  let snapshots = JSON.parse(localStorage.getItem(KEY_SNAP) || '{}');
  let lastVisit = parseInt(localStorage.getItem(KEY_LAST)) || Date.now();
  let currentStocks = [];
  let hasUnseen = false;
  let currentDetailSymbol = null;
  let currentDetailLtp = 0;
  let orderSide = 'BUY'; // current selected side for order panel

  const el = {
    search: document.getElementById('search-input'),
    dropdown: document.getElementById('search-dropdown'),
    lblLast: document.getElementById('val-last-checked'),
    lblNow: document.getElementById('val-now'),
    statMean: document.getElementById('stat-meaningful'),
    statAttn: document.getElementById('stat-attention'),
    alertsCont: document.getElementById('alerts-container'),
    alertsEmpty: document.getElementById('alerts-empty'),
    wlBody: document.getElementById('wl-tbody'),
    wlEmpty: document.getElementById('wl-empty'),
    btnSeen: document.getElementById('btn-mark-seen'),
    aiForm: document.getElementById('ai-chat-form'),
    aiInput: document.getElementById('ai-input'),
    chatHistory: document.getElementById('chat-history'),
    aiOrb: document.getElementById('ai-orb'),
    orbTitle: document.getElementById('orb-title'),
    orbSub: document.getElementById('orb-subtitle'),
    aiChecklist: document.getElementById('ai-checklist'),
    toasts: document.getElementById('toasts')
  };

  // ── Date Formatting ──
  function fmtTime(ts) {
    const d = new Date(parseInt(ts));
    const now = new Date();
    const isToday = now.toDateString() === d.toDateString();
    const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString();
    const prefix = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${prefix}, ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
  }

  function timeAgo(isoString) {
    if (!isoString) return '';
    const s = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
    return Math.floor(s / 86400) + ' day(s) ago';
  }

  function timeSinceVisit() {
    const diff = Date.now() - lastVisit;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  function getGreeting() {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ── Data & Storage ──
  const WL = {
    save() { localStorage.setItem(KEY_WL, JSON.stringify(watchlist)); },
    add(sym) {
      if (!watchlist.includes(sym)) {
        watchlist.push(sym);
        this.save();
        refresh();
        toast(`${sym} added to watchlist`);
      }
    },
    remove(sym) {
      watchlist = watchlist.filter(s => s !== sym);
      this.save();
      delete snapshots[sym];
      Detect.saveSnap();
      refresh();
      toast(`${sym} removed from watchlist`);
    }
  };

  const Detect = {
    saveSnap() { localStorage.setItem(KEY_SNAP, JSON.stringify(snapshots)); },
    
    updateVisit() {
      lastVisit = Date.now();
      localStorage.setItem(KEY_LAST, lastVisit.toString());
      if (el.lblLast) el.lblLast.textContent = fmtTime(lastVisit);
    },

    saveExitSnapshot(stocks) {
      if (!stocks || !stocks.length) return;
      stocks.forEach(s => {
        if (s.ltp) {
          snapshots[s.symbol] = { price: s.ltp, rsi: s.rsi, ts: Date.now() };
        }
      });
      this.saveSnap();
      this.updateVisit();
    },

    markSeen(stocks) {
      stocks.forEach(s => {
        snapshots[s.symbol] = { price: s.ltp, rsi: s.rsi, ts: Date.now() };
      });
      this.saveSnap();
      this.updateVisit();
      hasUnseen = false;
    },

    analyze(stock) {
      const snap = snapshots[stock.symbol];
      if (!snap || !stock.ltp) return null;
      
      const pDiff = ((stock.ltp - snap.price) / snap.price) * 100;
      const rsiNow = stock.rsi || 50;
      const rsiOld = snap.rsi || 50;
      
      const reasons = [];
      let level = 'normal';
      
      if (Math.abs(pDiff) >= THRESHOLD_HIGH) {
        level = 'high';
        reasons.push({
          color: pDiff > 0 ? 'green' : 'red',
          text: `Price moved significantly`
        });
      } else if (Math.abs(pDiff) >= THRESHOLD_WATCH) {
        level = 'watch';
        reasons.push({
          color: pDiff > 0 ? 'green' : 'red',
          text: `Price ${pDiff > 0 ? 'increased' : 'fell'} notably`
        });
      } else if (Math.abs(pDiff) >= THRESHOLD_MINOR) {
        level = 'minor';
        reasons.push({
          color: pDiff > 0 ? 'green' : 'red',
          text: `Price changed (${pDiff > 0 ? '+' : ''}${pDiff.toFixed(1)}%)`
        });
      }

      if (rsiNow > 70 && rsiOld <= 70) {
        level = level === 'normal' ? 'watch' : level;
        reasons.push({ color: 'red', text: `Entered overbought zone (RSI ${rsiNow.toFixed(0)})` });
      }
      if (rsiNow < 30 && rsiOld >= 30) {
        level = level === 'normal' ? 'watch' : level;
        reasons.push({ color: 'green', text: `Entered oversold zone (RSI ${rsiNow.toFixed(0)})` });
      }
      
      if (stock.yHigh && stock.ltp > stock.yHigh && snap.price <= stock.yHigh) {
        level = level === 'normal' || level === 'minor' ? 'watch' : level;
        reasons.push({ color: 'green', text: 'New 30-day high' });
      }
      if (stock.yLow && stock.ltp < stock.yLow && snap.price >= stock.yLow) {
        level = level === 'normal' || level === 'minor' ? 'watch' : level;
        reasons.push({ color: 'red', text: 'Broke 30-day low' });
      }

      // Add some extra context reasons for richer cards
      if (Math.abs(pDiff) >= THRESHOLD_MINOR) {
        if (stock.volume && stock.avgVolume && stock.volume > stock.avgVolume * 1.5) {
          reasons.push({ color: 'orange', text: `Volume ${(stock.volume / stock.avgVolume).toFixed(1)}x normal` });
        } else {
          reasons.push({ color: 'green', text: 'Volume within normal range' });
        }
      }

      if (reasons.length === 0) return null;
      return { level, reasons, diff: pDiff };
    }
  };

  // ── Paper Trading System ──
  const PaperTrade = {
    getBalance() {
      const saved = localStorage.getItem(KEY_BALANCE);
      return saved !== null ? parseFloat(saved) : INITIAL_BALANCE;
    },
    setBalance(val) {
      localStorage.setItem(KEY_BALANCE, val.toString());
    },
    getPortfolio() {
      return JSON.parse(localStorage.getItem(KEY_PORTFOLIO) || '{}');
    },
    savePortfolio(p) {
      localStorage.setItem(KEY_PORTFOLIO, JSON.stringify(p));
    },
    getOrders() {
      return JSON.parse(localStorage.getItem(KEY_ORDERS) || '[]');
    },
    saveOrders(o) {
      localStorage.setItem(KEY_ORDERS, JSON.stringify(o));
    },

    buy(symbol, qty, price) {
      const total = qty * price;
      let balance = this.getBalance();
      if (total > balance) {
        toast('Insufficient paper balance!');
        return false;
      }
      balance -= total;
      this.setBalance(balance);

      const portfolio = this.getPortfolio();
      if (portfolio[symbol]) {
        const h = portfolio[symbol];
        const newQty = h.qty + qty;
        h.avgPrice = ((h.avgPrice * h.qty) + (price * qty)) / newQty;
        h.qty = newQty;
      } else {
        portfolio[symbol] = { qty, avgPrice: price };
      }
      this.savePortfolio(portfolio);

      const orders = this.getOrders();
      orders.unshift({ ts: Date.now(), symbol, side: 'BUY', qty, price, total });
      this.saveOrders(orders);

      toast(`📗 Paper BUY: ${qty} × ${symbol} @ ₹${price.toLocaleString('en-IN')}`);
      return true;
    },

    sell(symbol, qty, price) {
      const portfolio = this.getPortfolio();
      if (!portfolio[symbol] || portfolio[symbol].qty < qty) {
        toast('You don\'t hold enough shares to sell!');
        return false;
      }
      const total = qty * price;
      let balance = this.getBalance();
      balance += total;
      this.setBalance(balance);

      portfolio[symbol].qty -= qty;
      if (portfolio[symbol].qty <= 0) {
        delete portfolio[symbol];
      }
      this.savePortfolio(portfolio);

      const orders = this.getOrders();
      orders.unshift({ ts: Date.now(), symbol, side: 'SELL', qty, price, total });
      this.saveOrders(orders);

      toast(`📕 Paper SELL: ${qty} × ${symbol} @ ₹${price.toLocaleString('en-IN')}`);
      return true;
    },

    reset() {
      this.setBalance(INITIAL_BALANCE);
      this.savePortfolio({});
      this.saveOrders([]);
      toast('Portfolio reset to ₹10,00,000');
    },

    addFunds(amount) {
      let balance = this.getBalance();
      balance += amount;
      this.setBalance(balance);
      toast(`₹${amount.toLocaleString('en-IN')} added to paper balance`);
    }
  };

  // ── Add Money Modal ──
  function showAddMoneyModal() {
    const overlay = document.createElement('div');
    overlay.className = 'add-money-overlay';
    overlay.innerHTML = `
      <div class="add-money-modal">
        <h2>💰 Add Virtual Funds</h2>
        <p>Top up your paper trading balance. This is not real money.</p>
        <div class="add-money-presets">
          <button class="preset-btn" data-amt="100000">₹1,00,000</button>
          <button class="preset-btn" data-amt="500000">₹5,00,000</button>
          <button class="preset-btn" data-amt="1000000">₹10,00,000</button>
          <button class="preset-btn" data-amt="2500000">₹25,00,000</button>
        </div>
        <input type="number" class="add-money-input" id="add-money-amt" placeholder="Enter custom amount" min="1">
        <div class="add-money-actions">
          <button class="am-cancel" id="am-cancel">Cancel</button>
          <button class="am-confirm" id="am-confirm">Add Funds</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#add-money-amt');
    overlay.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.amt;
      });
    });

    overlay.querySelector('#am-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#am-confirm').addEventListener('click', () => {
      const amt = parseInt(input.value);
      if (!amt || amt <= 0) { toast('Enter a valid amount'); return; }
      PaperTrade.addFunds(amt);
      renderOverviewHoldings();
      renderPortfolio();
      overlay.remove();
    });
  }

  // ── Overview Holdings Rendering ──
  function renderOverviewHoldings() {
    const portfolio = PaperTrade.getPortfolio();
    const balance = PaperTrade.getBalance();
    const symbols = Object.keys(portfolio);
    const section = document.getElementById('overview-holdings-section');
    const tbody = document.getElementById('ov-holdings-tbody');

    if (symbols.length === 0 && balance === INITIAL_BALANCE) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = 'block';

    // Update summary cards
    const ovCash = document.getElementById('ov-cash');
    const ovInvested = document.getElementById('ov-invested');
    const ovCurrent = document.getElementById('ov-current');
    const ovPnl = document.getElementById('ov-pnl');

    if (ovCash) ovCash.textContent = '₹' + balance.toLocaleString('en-IN');

    let totalInvested = 0;
    let totalCurrent = 0;

    if (tbody) tbody.innerHTML = '';

    symbols.forEach(sym => {
      const h = portfolio[sym];
      const stock = currentStocks.find(s => s.symbol === sym);
      const currentPrice = stock ? stock.ltp : h.avgPrice;
      const invested = h.avgPrice * h.qty;
      const current = currentPrice * h.qty;
      const pnl = current - invested;
      const pnlPct = invested > 0 ? (pnl / invested * 100) : 0;
      totalInvested += invested;
      totalCurrent += current;

      if (tbody) {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
          <td>
            <div class="sym-col">
              <div class="sym-icon">${sym.substring(0,2)}</div>
              <div class="sym-name">${sym}</div>
            </div>
          </td>
          <td class="right"><div class="val-price">₹${h.avgPrice.toLocaleString('en-IN', {minimumFractionDigits:2})}</div></td>
          <td class="right">${h.qty}</td>
          <td class="right">₹${current.toLocaleString('en-IN')}</td>
          <td class="right">
            <div class="change-pill ${pnl >= 0 ? 'up' : 'down'}">
              ${pnl >= 0 ? '+' : ''}₹${pnl.toLocaleString('en-IN', {minimumFractionDigits:0})} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)
            </div>
          </td>
        `;
        tr.addEventListener('click', () => openStockDetails(sym));
        tbody.appendChild(tr);
      }
    });

    const totalPnl = totalCurrent - totalInvested;
    if (ovInvested) ovInvested.textContent = '₹' + totalInvested.toLocaleString('en-IN');
    if (ovCurrent) ovCurrent.textContent = '₹' + totalCurrent.toLocaleString('en-IN');
    if (ovPnl) {
      ovPnl.textContent = (totalPnl >= 0 ? '+' : '') + '₹' + totalPnl.toLocaleString('en-IN');
      ovPnl.className = 'hc-value ' + (totalPnl >= 0 ? 'text-green' : 'text-red');
    }

    // Also update the order panel balance display
    const opBalanceEl = document.getElementById('op-balance');
    if (opBalanceEl) opBalanceEl.textContent = '₹' + balance.toLocaleString('en-IN');
  }

  // ── UI Rendering ──
  function renderAlerts(alerts) {
    if (!alerts.length) {
      el.alertsCont.innerHTML = '';
      el.alertsCont.appendChild(el.alertsEmpty);
      el.alertsEmpty.style.display = 'block';
      el.statMean.textContent = '0';
      el.statAttn.textContent = '0';
      return;
    }
    
    el.alertsEmpty.style.display = 'none';
    el.alertsCont.innerHTML = '';
    
    let attnCount = 0;
    
    alerts.forEach((a, i) => {
      if (a.level === 'high') attnCount++;

      const levelLabel = {
        high: 'High Attention',
        watch: 'Watch',
        minor: 'Info'
      }[a.level] || 'Normal';

      const initials = a.stock.symbol.substring(0, 2);

      const html = `
        <div class="alert-card ${a.level}" style="animation-delay: ${i * 0.08}s">
          <div class="ac-header">
            <div class="ac-top-left">
              <div class="ac-logo">${initials}</div>
              <div>
                <div class="ac-sym">${a.stock.symbol}</div>
                <div class="ac-price ${a.diff > 0 ? 'text-green' : 'text-red'}">
                  ${a.diff > 0 ? '+' : ''}${a.diff.toFixed(1)}%
                </div>
              </div>
            </div>
            <div class="badge ${a.level}">${levelLabel}</div>
          </div>
          <div class="ac-reasons">
            ${a.reasons.map(r => `
              <div class="ac-reason">
                <div class="ac-check ${r.color}">✓</div>
                <span>${r.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      el.alertsCont.insertAdjacentHTML('beforeend', html);
    });
    
    el.statMean.textContent = alerts.length;
    el.statAttn.textContent = attnCount;
  }

  function renderTable(stocks, alertsMap) {
    el.wlBody.innerHTML = '';
    if (!stocks.length) {
      el.wlEmpty.style.display = 'block';
      return;
    }
    el.wlEmpty.style.display = 'none';
    
    stocks.forEach(s => {
      const alert = alertsMap[s.symbol];
      const level = alert ? alert.level : 'normal';
      const levelLabel = {
        high: 'High', watch: 'Watch', minor: 'Info', normal: 'Normal'
      }[level];
      const badgeClass = `att-${level}`;
      const icon = {
        high: '🔴', watch: '🟡', minor: 'ℹ️', normal: '✓'
      }[level];

      // Since Last Check diff
      let sincePct = s.changePct;
      const snap = snapshots[s.symbol];
      if (snap && snap.price) {
        sincePct = ((s.ltp - snap.price) / snap.price) * 100;
      }
      const sinceIsUp = sincePct >= 0;

      let rowClass = '';
      if (level === 'high') rowClass = 'row-attention';
      else if (level === 'watch' || level === 'minor') rowClass = 'row-changed';

      const initials = s.symbol.substring(0, 2);
      const companyName = s.companyName || s.sector || '';
      
      const tr = document.createElement('tr');
      tr.className = rowClass + " clickable-row";
      tr.dataset.sym = s.symbol;
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td>
          <div class="sym-col">
            <div class="sym-icon">${initials}</div>
            <div>
              <div class="sym-name">${s.symbol}</div>
              <div class="sym-desc">${companyName}</div>
            </div>
          </div>
        </td>
        <td class="right">
          <div class="val-price">₹${s.ltp ? s.ltp.toLocaleString('en-IN') : '--'}</div>
        </td>
        <td class="right">
          <div class="change-pill ${sinceIsUp ? 'up' : 'down'}">
            ${sinceIsUp ? '+' : ''}${sincePct != null ? sincePct.toFixed(1) : '--'}%
          </div>
        </td>
        <td class="center">
          <div class="attention-badge ${badgeClass}">
            <span>${icon}</span> ${levelLabel}
          </div>
        </td>
        <td class="right">
          <div class="text-updated">${timeAgo(s.lastUpdated)}</div>
        </td>
        <td class="center">
          <button class="icon-btn small del-btn" data-sym="${s.symbol}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </button>
        </td>
      `;
      
      tr.addEventListener('click', (e) => {
        if (!e.target.closest('.del-btn')) {
          openStockDetails(s.symbol);
        }
      });
      
      el.wlBody.appendChild(tr);
    });
    
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        WL.remove(e.currentTarget.dataset.sym);
      });
    });
  }

  // ── Main Fetch & Refresh ──
  async function refresh() {
    if (!watchlist.length) { renderTable([], {}); renderAlerts([]); return; }
    
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: watchlist })
      });
      const data = await res.json();
      currentStocks = data.stocks.map(s => ({...s, lastUpdated: data.lastUpdated}));
      
      const alerts = [];
      const alertsMap = {};
      
      currentStocks.forEach(s => {
        if (!snapshots[s.symbol]) {
          snapshots[s.symbol] = { price: s.ltp, rsi: s.rsi, ts: Date.now() };
        }
        const analysis = Detect.analyze(s);
        if (analysis) {
          alerts.push({ stock: s, ...analysis });
          alertsMap[s.symbol] = analysis;
        }
      });
      Detect.saveSnap();
      
      const levelOrder = { high: 0, watch: 1, minor: 2 };
      alerts.sort((a, b) => (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3));
      
      renderAlerts(alerts);
      renderTable(currentStocks, alertsMap);
      
      if (el.lblNow) el.lblNow.textContent = fmtTime(Date.now());
      
    } catch (e) { console.error('Refresh error', e); }
  }

  // ── Stock Details View ──
  async function openStockDetails(symbol) {
    try {
      const res = await fetch(`/api/stock/details/${symbol}`);
      const data = await res.json();
      
      // Update basic header info
      document.getElementById('sd-logo').textContent = data.symbol.substring(0,2);
      document.getElementById('sd-symbol').textContent = `${data.symbol} · NSE`;
      document.getElementById('sd-name').textContent = data.companyName;
      document.getElementById('sd-ltp').textContent = `₹${data.ltp.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
      
      const changeEl = document.getElementById('sd-change');
      changeEl.className = `sd-change ${data.changePct >= 0 ? 'text-green' : 'text-red'}`;
      changeEl.innerHTML = `${data.changePct >= 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePct.toFixed(2)}%) <span class="sd-duration">1D</span>`;
      
      // Order panel header
      document.getElementById('op-title').textContent = data.companyName;
      document.getElementById('op-sub-price').textContent = `NSE ₹${data.ltp.toLocaleString('en-IN', {minimumFractionDigits:2})}`;

      // Save current detail context for order panel
      currentDetailSymbol = data.symbol;
      currentDetailLtp = data.ltp;
      orderSide = 'BUY';

      // Wire order panel
      const opQty = document.getElementById('op-qty');
      const opBalance = document.getElementById('op-balance');
      const opRequired = document.getElementById('op-required');
      const opActionBtn = document.getElementById('op-action-btn');
      const opTabBuy = document.getElementById('op-tab-buy');
      const opTabSell = document.getElementById('op-tab-sell');

      function updateOrderPanel() {
        const q = parseInt(opQty.value) || 0;
        const req = q * currentDetailLtp;
        opRequired.textContent = '₹' + req.toLocaleString('en-IN');
        opBalance.textContent = '₹' + PaperTrade.getBalance().toLocaleString('en-IN');
        opActionBtn.textContent = orderSide === 'BUY' ? 'Buy' : 'Sell';
        opActionBtn.style.background = orderSide === 'BUY' ? 'var(--green-primary)' : 'var(--red-primary)';
        opTabBuy.className = 'op-tab' + (orderSide === 'BUY' ? ' active' : '');
        opTabSell.className = 'op-tab' + (orderSide === 'SELL' ? ' active' : '');
      }

      opTabBuy.onclick = () => { orderSide = 'BUY'; updateOrderPanel(); };
      opTabSell.onclick = () => { orderSide = 'SELL'; updateOrderPanel(); };
      opQty.oninput = updateOrderPanel;

      opActionBtn.onclick = () => {
        const q = parseInt(opQty.value) || 0;
        if (q <= 0) { toast('Enter a valid quantity'); return; }
        let success;
        if (orderSide === 'BUY') {
          success = PaperTrade.buy(currentDetailSymbol, q, currentDetailLtp);
        } else {
          success = PaperTrade.sell(currentDetailSymbol, q, currentDetailLtp);
        }
        if (success) {
          updateOrderPanel();
          renderPortfolio();
        }
      };

      updateOrderPanel();

      // Market Depth
      document.getElementById('depth-buy-pct').textContent = data.depth.buyOrdersPct + '%';
      document.getElementById('depth-sell-pct').textContent = data.depth.sellOrdersPct + '%';
      document.getElementById('depth-bar-buy').style.width = data.depth.buyOrdersPct + '%';
      document.getElementById('depth-bar-sell').style.width = data.depth.sellOrdersPct + '%';
      
      document.getElementById('depth-bids').innerHTML = data.depth.bids.map(b => `<div class="depth-row buy"><span class="flex-1">${b.price}</span><span class="text-green">${b.qty}</span></div>`).join('');
      document.getElementById('depth-asks').innerHTML = data.depth.asks.map(a => `<div class="depth-row sell"><span class="flex-1">${a.price}</span><span class="text-red">${a.qty}</span></div>`).join('');
      document.getElementById('depth-bid-tot').textContent = data.depth.bidTotal;
      document.getElementById('depth-ask-tot').textContent = data.depth.askTotal;

      // Performance
      document.getElementById('perf-today-low').textContent = data.performance.todayLow;
      document.getElementById('perf-today-high').textContent = data.performance.todayHigh;
      document.getElementById('perf-52-low').textContent = data.performance.week52Low;
      document.getElementById('perf-52-high').textContent = data.performance.week52High;
      document.getElementById('perf-open').textContent = data.performance.openPrice;
      document.getElementById('perf-prev').textContent = data.performance.prevClose;
      document.getElementById('perf-vol').textContent = data.performance.liveVolume;
      document.getElementById('perf-lc').textContent = data.performance.lowerCircuit;
      document.getElementById('perf-uc').textContent = data.performance.upperCircuit;

      // Fundamentals
      document.getElementById('fund-mcap').textContent = data.fundamentals.marketCap;
      document.getElementById('fund-roe').textContent = data.fundamentals.roe;
      document.getElementById('fund-pe').textContent = data.fundamentals.peRatio;
      document.getElementById('fund-eps').textContent = data.fundamentals.eps;
      document.getElementById('fund-pb').textContent = data.fundamentals.pbRatio;
      document.getElementById('fund-div').textContent = data.fundamentals.divYield;
      document.getElementById('fund-ind-pe').textContent = data.fundamentals.industryPe;
      document.getElementById('fund-bv').textContent = data.fundamentals.bookValue;
      document.getElementById('fund-dte').textContent = data.fundamentals.debtToEquity;
      document.getElementById('fund-fv').textContent = data.fundamentals.faceValue;

      // About
      document.getElementById('about-desc').innerHTML = data.about.desc + ' <span class="text-green cursor-pointer">...Read more</span>';
      document.getElementById('about-ceo').textContent = data.about.ceo;
      document.getElementById('about-founded').textContent = data.about.founded;
      document.getElementById('about-symbol').textContent = data.about.nseSymbol;

      // Shareholding
      document.getElementById('sh-bars').innerHTML = `
        <div class="sh-row"><div class="sh-lbl">Promoters</div><div class="sh-track"><div class="sh-fill fill-prm" style="width:${data.shareholding.promoters}%"></div></div><div class="sh-val">${data.shareholding.promoters}%</div></div>
        <div class="sh-row"><div class="sh-lbl">FII</div><div class="sh-track"><div class="sh-fill fill-fii" style="width:${data.shareholding.fii}%"></div></div><div class="sh-val">${data.shareholding.fii}%</div></div>
        <div class="sh-row"><div class="sh-lbl">DII</div><div class="sh-track"><div class="sh-fill fill-dii" style="width:${data.shareholding.dii}%"></div></div><div class="sh-val">${data.shareholding.dii}%</div></div>
        <div class="sh-row"><div class="sh-lbl">Public</div><div class="sh-track"><div class="sh-fill fill-pub" style="width:${data.shareholding.public}%"></div></div><div class="sh-val">${data.shareholding.public}%</div></div>
      `;

      // Financials Bar Chart
      const maxFin = Math.max(...data.financials.yearly.map(f => Math.max(f.rev, f.prof)));
      document.getElementById('fin-bar-chart').innerHTML = data.financials.yearly.map(f => `
        <div class="fin-col">
          <div class="fin-bar bg-slate" style="height: ${(f.rev/maxFin)*100}%"></div>
          <div class="fin-bar bg-green" style="height: ${(f.prof/maxFin)*100}%"></div>
          <div class="fin-lbl">${f.year}</div>
        </div>
      `).join('');

      // Draw SVG Sparkline Chart
      const maxPrice = Math.max(...data.chartData);
      const minPrice = Math.min(...data.chartData);
      const range = maxPrice - minPrice || 1;
      let pathD = "";
      let fillD = "";
      const step = 800 / (data.chartData.length - 1);
      
      data.chartData.forEach((val, i) => {
        const x = i * step;
        const y = 300 - (((val - minPrice) / range) * 260 + 20); // leave 20px padding
        if (i === 0) {
          pathD += `M ${x},${y} `;
          fillD += `M ${x},300 L ${x},${y} `;
        } else {
          pathD += `L ${x},${y} `;
          fillD += `L ${x},${y} `;
        }
      });
      fillD += `L 800,300 Z`;
      
      const chartPath = document.getElementById('sd-chart-path');
      const chartFill = document.getElementById('sd-chart-fill');
      const isNegative = data.changePct < 0;
      const strokeColor = isNegative ? 'var(--red-primary)' : 'var(--green-primary)';
      
      chartPath.setAttribute('d', pathD);
      chartPath.setAttribute('stroke', strokeColor);
      
      chartFill.setAttribute('d', fillD);
      // update gradient colors
      const grad = document.getElementById('chartGrad');
      grad.innerHTML = `
        <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0"/>
      `;

      // Switch tab visually
      document.querySelectorAll('.nav-menu .nav-item').forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.getElementById('tab-stock-details').classList.add('active');
      document.getElementById('tab-stock-details').style.display = 'block';

      // Stock Details Watchlist button
      const wlBtn = document.getElementById('btn-sd-wl');
      if (wlBtn) {
        wlBtn.onclick = () => {
          if (watchlist.includes(symbol)) {
            WL.remove(symbol);
            wlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
            wlBtn.title = "Add to Watchlist";
          } else {
            WL.add(symbol);
            wlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="var(--green-primary)" stroke="var(--green-primary)" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
            wlBtn.title = "Remove from Watchlist";
          }
        };
        if (watchlist.includes(symbol)) {
          wlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="var(--green-primary)" stroke="var(--green-primary)" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
          wlBtn.title = "Remove from Watchlist";
        } else {
          wlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
          wlBtn.title = "Add to Watchlist";
        }
      }

      // Ensure Overview tab works again when clicked
      document.querySelector('[data-tab="overview"]').addEventListener('click', () => {
         document.getElementById('tab-stock-details').style.display = 'none';
      }, {once: true});

    } catch(e) {
      console.error("Failed to load stock details", e);
      toast("Failed to load stock details");
    }
  }

  // ── Search & Dropdown ──
  function initSearch() {
    let to;
    el.search.addEventListener('input', (e) => {
      clearTimeout(to);
      const q = e.target.value.trim();
      if (!q) { el.dropdown.style.display = 'none'; return; }
      to = setTimeout(async () => {
        const res = await fetch(`/api/search?q=${q}`);
        const results = await res.json();
        el.dropdown.innerHTML = results.map(r => `
          <div class="search-item" data-sym="${r.symbol}">
            <div style="flex: 1;">
              <strong>${r.symbol}</strong>
              <div style="font-size:0.7rem;color:var(--text-tertiary)">${r.sector}</div>
            </div>
            ${r.ltp ? `<div class="${r.changePct>=0?'text-green':'text-red'}" style="margin-right: 10px;">₹${r.ltp}</div>` : ''}
            <button class="icon-btn small btn-add-search" data-sym="${r.symbol}" title="Add to Watchlist">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        `).join('');
        el.dropdown.style.display = 'block';
      }, DEBOUNCE);
    });
    
    el.dropdown.addEventListener('click', e => {
      const addBtn = e.target.closest('.btn-add-search');
      if (addBtn) {
        e.stopPropagation();
        if (!watchlist.includes(addBtn.dataset.sym)) {
          WL.add(addBtn.dataset.sym);
        } else {
          toast(`${addBtn.dataset.sym} is already in your watchlist`);
        }
        return;
      }

      const item = e.target.closest('.search-item');
      if (item) {
        openStockDetails(item.dataset.sym);
        el.search.value = '';
        el.dropdown.style.display = 'none';
      }
    });
    
    document.addEventListener('click', e => {
      if (!e.target.closest('#search-wrap')) el.dropdown.style.display = 'none';
    });
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    el.toasts.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(20px)';
      t.style.transition = 'all 0.3s';
      setTimeout(() => t.remove(), 300);
    }, TOAST_MS);
  }

  // ── AI Chat ──
  function setAiState(state) {
    el.aiOrb.className = `ai-orb ${state}`;
    if (state === 'idle') {
      el.orbTitle.textContent = 'Listening...';
      el.orbSub.textContent = 'Ready to help with your watchlist';
    } else if (state === 'thinking') {
      el.orbTitle.textContent = 'Thinking...';
      el.orbSub.textContent = 'Analyzing your request';
    }
  }

  function addMessage(text, isUser = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${isUser ? 'msg-user' : 'msg-ai'}`;
    const formattedText = isUser ? text : text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    wrapper.innerHTML = `<div class="msg-bubble">${formattedText}</div>`;
    el.chatHistory.appendChild(wrapper);
    el.aiForm.scrollIntoView({ behavior: 'smooth' });
  }

  el.aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = el.aiInput.value.trim();
    if (!text) return;
    
    el.aiInput.value = '';
    addMessage(text, true);
    setAiState('thinking');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: text,
          watchlist: currentStocks.map(s => ({
            symbol: s.symbol, ltp: s.ltp, changePct: s.changePct, rsi: s.rsi
          }))
        })
      });
      const data = await res.json();
      setAiState('idle');
      addMessage(data.reply);
    } catch (err) {
      setAiState('idle');
      addMessage("I'm sorry, I couldn't connect to the server right now.");
    }
  });

  // ── Auto-save on exit ──
  function autoSaveOnExit() {
    if (currentStocks.length > 0) {
      Detect.saveExitSnapshot(currentStocks);
    }
  }

  // ── Portfolio Tab Rendering ──
  function renderPortfolio() {
    const portfolio = PaperTrade.getPortfolio();
    const orders = PaperTrade.getOrders();
    const balance = PaperTrade.getBalance();
    const symbols = Object.keys(portfolio);

    // Update summary values
    const portfolioBalanceEl = document.getElementById('portfolio-balance');
    const portfolioValueEl = document.getElementById('portfolio-value');
    const portfolioPnlEl = document.getElementById('portfolio-pnl');
    const opBalanceEl = document.getElementById('op-balance');

    if (portfolioBalanceEl) portfolioBalanceEl.textContent = '₹' + balance.toLocaleString('en-IN');
    if (opBalanceEl) opBalanceEl.textContent = '₹' + balance.toLocaleString('en-IN');

    // Build holdings table
    const tbody = document.getElementById('portfolio-tbody');
    const emptyEl = document.getElementById('portfolio-empty');
    if (tbody) tbody.innerHTML = '';

    if (symbols.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (portfolioValueEl) portfolioValueEl.textContent = '₹0';
      if (portfolioPnlEl) { portfolioPnlEl.textContent = '₹0'; portfolioPnlEl.className = 'time-val'; }
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      let totalValue = 0;
      let totalInvested = 0;

      symbols.forEach(sym => {
        const h = portfolio[sym];
        const stock = currentStocks.find(s => s.symbol === sym);
        const currentPrice = stock ? stock.ltp : h.avgPrice;
        const invested = h.avgPrice * h.qty;
        const current = currentPrice * h.qty;
        const pnl = current - invested;
        const pnlPct = invested > 0 ? (pnl / invested * 100) : 0;
        totalValue += current;
        totalInvested += invested;

        const initials = sym.substring(0, 2);
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
          <td>
            <div class="sym-col">
              <div class="sym-icon">${initials}</div>
              <div class="sym-name">${sym}</div>
            </div>
          </td>
          <td class="right"><div class="val-price">₹${h.avgPrice.toLocaleString('en-IN', {minimumFractionDigits:2})}</div></td>
          <td class="right">${h.qty}</td>
          <td class="right">₹${invested.toLocaleString('en-IN')}</td>
          <td class="right">₹${current.toLocaleString('en-IN')}</td>
          <td class="right">
            <div class="change-pill ${pnl >= 0 ? 'up' : 'down'}">
              ${pnl >= 0 ? '+' : ''}₹${pnl.toLocaleString('en-IN', {minimumFractionDigits:0})} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)
            </div>
          </td>
          <td class="center">
            <button class="icon-btn small" title="View Details" data-sym="${sym}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </button>
          </td>
        `;
        tr.addEventListener('click', () => openStockDetails(sym));
        if (tbody) tbody.appendChild(tr);
      });

      const totalPnl = totalValue - totalInvested;
      if (portfolioValueEl) portfolioValueEl.textContent = '₹' + totalValue.toLocaleString('en-IN');
      if (portfolioPnlEl) {
        portfolioPnlEl.textContent = (totalPnl >= 0 ? '+' : '') + '₹' + totalPnl.toLocaleString('en-IN');
        portfolioPnlEl.className = 'time-val ' + (totalPnl >= 0 ? 'text-green' : 'text-red');
      }
    }

    // Build orders table
    const ordersTbody = document.getElementById('orders-tbody');
    const ordersEmpty = document.getElementById('orders-empty');
    if (ordersTbody) ordersTbody.innerHTML = '';

    if (orders.length === 0) {
      if (ordersEmpty) ordersEmpty.style.display = 'block';
    } else {
      if (ordersEmpty) ordersEmpty.style.display = 'none';
      orders.slice(0, 50).forEach(o => {
        const tr = document.createElement('tr');
        const d = new Date(o.ts);
        tr.innerHTML = `
          <td><div class="text-updated">${d.toLocaleDateString('en-IN', {day:'numeric',month:'short'})} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></td>
          <td><strong>${o.symbol}</strong></td>
          <td class="center">
            <div class="attention-badge ${o.side === 'BUY' ? 'att-normal' : 'att-high'}" style="${o.side === 'BUY' ? 'background:var(--green-light);color:var(--green-primary)' : ''}">
              ${o.side}
            </div>
          </td>
          <td class="right">${o.qty}</td>
          <td class="right">₹${o.price.toLocaleString('en-IN')}</td>
          <td class="right">₹${o.total.toLocaleString('en-IN')}</td>
        `;
        if (ordersTbody) ordersTbody.appendChild(tr);
      });
    }
  }

  // ── Tab Navigation ──
  function initTabs() {
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        item.classList.add('active');
        const targetTabId = 'tab-' + item.dataset.tab;
        const targetTab = document.getElementById(targetTabId);
        if (targetTab) targetTab.classList.add('active');
      });
    });
  }

  // ── Init ──
  async function init() {
    initSearch();
    initTabs();

    const mobileAiToggle = document.getElementById('mobile-ai-toggle');
    const mobileAiClose = document.getElementById('mobile-ai-close');
    const aiPanel = document.querySelector('.ai-panel');

    if (mobileAiToggle && aiPanel) {
      mobileAiToggle.addEventListener('click', () => {
        aiPanel.classList.add('open');
      });
    }
    if (mobileAiClose && aiPanel) {
      mobileAiClose.addEventListener('click', () => {
        aiPanel.classList.remove('open');
      });
    }

    const greetingEl = document.querySelector('.greeting');
    if (greetingEl) greetingEl.textContent = `${getGreeting()}, Sir/Mam`;

    // Display last-visit time with relative label
    const subtitleEl = document.querySelector('.subtitle');
    if (el.lblLast) el.lblLast.textContent = fmtTime(lastVisit);
    if (el.lblNow) el.lblNow.textContent = fmtTime(Date.now());
    if (subtitleEl && lastVisit) {
      const diff = Date.now() - lastVisit;
      const mins = Math.floor(diff / 60000);
      let awayStr;
      if (mins < 1) awayStr = 'just now';
      else if (mins < 60) awayStr = `${mins} min ago`;
      else {
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) awayStr = `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
        else { const d = Math.floor(hrs/24); awayStr = `${d} day${d>1?'s':''} ago`; }
      }
      subtitleEl.textContent = `Here's what changed since your last visit (${awayStr}).`;
    }

    function markAllSeen() {
      Detect.markSeen(currentStocks);
      renderAlerts([]);
      refresh();
      toast('All changes marked as seen');
    }

    if (el.btnSeen) el.btnSeen.addEventListener('click', markAllSeen);

    // Portfolio reset
    const resetBtn = document.getElementById('btn-reset-portfolio');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset your paper portfolio? All holdings and orders will be cleared.')) {
          PaperTrade.reset();
          renderPortfolio();
          renderOverviewHoldings();
        }
      });
    }

    // Add Money buttons
    const addMoneyBtn = document.getElementById('btn-add-money');
    if (addMoneyBtn) addMoneyBtn.addEventListener('click', showAddMoneyModal);
    const opAddMoneyBtn = document.getElementById('op-add-money-btn');
    if (opAddMoneyBtn) opAddMoneyBtn.addEventListener('click', showAddMoneyModal);

    await refresh();
    renderPortfolio();
    renderOverviewHoldings();

    setInterval(async () => {
      if (!document.hidden) {
        await refresh();
        renderPortfolio();
        renderOverviewHoldings();
      }
    }, POLL);

    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        autoSaveOnExit();
      } else {
        await refresh();
        renderPortfolio();
        renderOverviewHoldings();
      }
    });

    window.addEventListener('beforeunload', () => {
      autoSaveOnExit();
    });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
