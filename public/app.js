// ═══════════════════════════════════════════════════════
//  MarketPulse AI — Core Application Logic (Dark Theme + Auto Change Detection)
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  const POLL = 15000;
  const DEBOUNCE = 200;
  const TOAST_MS = 3000;

  // Change thresholds (percentage)
  const THRESHOLD_MINOR = 1;   // 1-3%: informational
  const THRESHOLD_WATCH = 3;   // 3-5%: watch level
  const THRESHOLD_HIGH  = 5;   // 5%+: high attention

  const KEY_WL = 'mp_watchlist';
  const KEY_SNAP = 'mp_snapshots';
  const KEY_LAST = 'mp_last_visit';

  // State
  let watchlist = JSON.parse(localStorage.getItem(KEY_WL) || '["RELIANCE","TCS","HDFCBANK"]');
  let snapshots = JSON.parse(localStorage.getItem(KEY_SNAP) || '{}');
  let lastVisit = parseInt(localStorage.getItem(KEY_LAST)) || Date.now();
  let currentStocks = [];
  let hasUnseen = false;

  // Elements
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
    
    // Change banner
    changeBanner: document.getElementById('change-banner'),
    bannerTitle: document.getElementById('banner-title'),
    bannerSub: document.getElementById('banner-sub'),
    bannerDismiss: document.getElementById('banner-dismiss'),
    
    // AI Panel
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

  // ── Greeting based on time of day ──
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
      el.lblLast.textContent = fmtTime(lastVisit);
    },

    // Save current prices as snapshot (called on exit)
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
      hideBanner();
    },

    analyze(stock) {
      const snap = snapshots[stock.symbol];
      if (!snap || !stock.ltp) return null;
      
      const pDiff = ((stock.ltp - snap.price) / snap.price) * 100;
      const rsiNow = stock.rsi || 50;
      const rsiOld = snap.rsi || 50;
      
      const reasons = [];
      let level = 'normal'; // normal, minor, watch, high
      
      // Price thresholds
      if (Math.abs(pDiff) >= THRESHOLD_HIGH) {
        level = 'high';
        reasons.push({
          icon: pDiff > 0 ? '📈' : '📉',
          color: pDiff > 0 ? 'green' : 'red',
          text: `Price moved significantly (${pDiff > 0 ? '+' : ''}${pDiff.toFixed(1)}%)`
        });
      } else if (Math.abs(pDiff) >= THRESHOLD_WATCH) {
        level = 'watch';
        reasons.push({
          icon: pDiff > 0 ? '↗' : '↘',
          color: pDiff > 0 ? 'green' : 'red',
          text: `Price shifted (${pDiff > 0 ? '+' : ''}${pDiff.toFixed(1)}%)`
        });
      } else if (Math.abs(pDiff) >= THRESHOLD_MINOR) {
        level = 'minor';
        reasons.push({
          icon: pDiff > 0 ? '▲' : '▼',
          color: pDiff > 0 ? 'green' : 'red',
          text: `Price changed (${pDiff > 0 ? '+' : ''}${pDiff.toFixed(1)}%)`
        });
      }

      // RSI zone transitions
      if (rsiNow > 70 && rsiOld <= 70) {
        level = level === 'normal' ? 'watch' : level;
        reasons.push({ icon: '🔥', color: 'red', text: `Entered overbought zone (RSI ${rsiNow.toFixed(0)})` });
      }
      if (rsiNow < 30 && rsiOld >= 30) {
        level = level === 'normal' ? 'watch' : level;
        reasons.push({ icon: '🧊', color: 'green', text: `Entered oversold zone (RSI ${rsiNow.toFixed(0)})` });
      }
      
      // 30-day high break
      if (stock.yHigh && stock.ltp > stock.yHigh && snap.price <= stock.yHigh) {
        level = level === 'normal' || level === 'minor' ? 'watch' : level;
        reasons.push({ icon: '⭐', color: 'green', text: 'Broke 30-day high' });
      }

      // 30-day low break
      if (stock.yLow && stock.ltp < stock.yLow && snap.price >= stock.yLow) {
        level = level === 'normal' || level === 'minor' ? 'watch' : level;
        reasons.push({ icon: '⚠️', color: 'red', text: 'Broke 30-day low' });
      }

      if (reasons.length === 0) return null;
      return { level, reasons, diff: pDiff };
    }
  };

  // ── Banner Control ──
  function showBanner(alerts) {
    if (!alerts.length) { hideBanner(); return; }
    
    const highCount = alerts.filter(a => a.level === 'high').length;
    const watchCount = alerts.filter(a => a.level === 'watch').length;
    const minorCount = alerts.filter(a => a.level === 'minor').length;
    const total = alerts.length;
    
    const parts = [];
    if (highCount) parts.push(`${highCount} need attention`);
    if (watchCount) parts.push(`${watchCount} to watch`);
    if (minorCount) parts.push(`${minorCount} minor`);
    
    el.bannerTitle.textContent = `${total} stock${total > 1 ? 's' : ''} changed since your last visit`;
    el.bannerSub.textContent = `Last checked ${timeSinceVisit()} · ${parts.join(', ')}`;
    el.changeBanner.classList.add('visible');
    hasUnseen = true;
  }

  function hideBanner() {
    el.changeBanner.classList.remove('visible');
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

      const html = `
        <div class="alert-card ${a.level}" style="animation-delay: ${i * 0.08}s">
          <div class="ac-header">
            <div>
              <div class="ac-sym">${a.stock.symbol}</div>
              <div class="ac-price ${a.diff > 0 ? 'text-green' : 'text-red'}">
                ${a.diff > 0 ? '+' : ''}${a.diff.toFixed(1)}%
                <span style="font-size:0.8rem;font-weight:400;color:var(--text-secondary);margin-left:4px">
                  ₹${a.stock.ltp ? a.stock.ltp.toLocaleString('en-IN') : '--'}
                </span>
              </div>
            </div>
            <div class="badge ${a.level}">${levelLabel}</div>
          </div>
          <div class="ac-reasons">
            ${a.reasons.map(r => `
              <div class="ac-reason">
                <span class="ac-icon icon-${r.color}">${r.icon}</span>
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
      const isUp = s.changePct >= 0;
      const stroke = isUp ? 'stroke-green' : 'stroke-red';
      const spark = isUp
        ? 'M0,20 L20,25 L40,15 L60,18 L80,5 L100,0'
        : 'M0,5 L20,10 L40,2 L60,15 L80,12 L100,20';
      
      const alert = alertsMap[s.symbol];
      const level = alert ? alert.level : 'normal';
      const levelLabel = {
        high: 'High', watch: 'Watch', minor: 'Info', normal: 'Normal'
      }[level];
      const badgeClass = `att-${level}`;
      const icon = {
        high: '🔴', watch: '🟡', minor: 'ℹ️', normal: '✓'
      }[level];

      // Calculate since last check diff
      let sincePct = s.changePct; // default to day change
      const snap = snapshots[s.symbol];
      if (snap && snap.price) {
        sincePct = ((s.ltp - snap.price) / snap.price) * 100;
      }
      const sinceIsUp = sincePct >= 0;

      // Row class for highlighting changed stocks
      let rowClass = '';
      if (level === 'high') rowClass = 'row-attention';
      else if (level === 'watch' || level === 'minor') rowClass = 'row-changed';

      // New badge for changed stocks
      let newBadge = '';
      if (alert && Math.abs(sincePct) >= THRESHOLD_MINOR) {
        newBadge = `<span class="new-badge ${sinceIsUp ? 'up' : 'down'}">${sinceIsUp ? '↑' : '↓'} changed</span>`;
      }
      
      const tr = document.createElement('tr');
      tr.className = rowClass;
      tr.innerHTML = `
        <td>
          <div class="sym-col">
            <div class="sym-icon">${s.symbol.substring(0,2)}</div>
            <div>
              <div class="sym-name">${s.symbol} ${newBadge}</div>
              <div class="sym-desc">${s.sector}</div>
            </div>
          </div>
        </td>
        <td class="right">
          <div class="val-price">₹${s.ltp ? s.ltp.toLocaleString('en-IN') : '--'}</div>
        </td>
        <td class="right">
          <div class="change-pill ${sinceIsUp ? 'up' : 'down'}">
            <span class="arrow">${sinceIsUp ? '▲' : '▼'}</span>
            ${sincePct != null ? Math.abs(sincePct).toFixed(1) : '--'}%
          </div>
        </td>
        <td class="center">
          <svg class="trend-sparkline ${stroke}" viewBox="0 0 100 24" preserveAspectRatio="none">
            <path d="${spark}" fill="none" stroke-width="2"/>
          </svg>
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
    if (!watchlist.length) { renderTable([], {}); renderAlerts([]); hideBanner(); return; }
    
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
        // Only create initial snapshot if one doesn't exist yet
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
      
      // Sort: high > watch > minor
      const levelOrder = { high: 0, watch: 1, minor: 2 };
      alerts.sort((a, b) => (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3));
      
      renderAlerts(alerts);
      renderTable(currentStocks, alertsMap);
      
      // Show/update banner if there are changes
      if (alerts.length > 0) {
        showBanner(alerts);
      } else {
        hideBanner();
      }
      
      el.lblNow.textContent = fmtTime(Date.now());
      
    } catch (e) { console.error('Refresh error', e); }
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
            <div>
              <strong>${r.symbol}</strong>
              <div style="font-size:0.75rem;color:var(--text-tertiary)">${r.sector}</div>
            </div>
            ${r.ltp ? `<div class="${r.changePct>=0?'text-green':'text-red'}">₹${r.ltp}</div>` : ''}
          </div>
        `).join('');
        el.dropdown.style.display = 'block';
      }, DEBOUNCE);
    });
    
    el.dropdown.addEventListener('click', e => {
      const item = e.target.closest('.search-item');
      if (item) {
        WL.add(item.dataset.sym);
        el.search.value = '';
        el.dropdown.style.display = 'none';
      }
    });
    
    document.addEventListener('click', e => {
      if (!e.target.closest('#search-wrap')) el.dropdown.style.display = 'none';
    });
  }

  // ── UI Helpers ──
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

  // ── AI Chat Logic ──
  function setAiState(state) {
    // states: idle, thinking
    el.aiOrb.className = `ai-orb ${state}`;
    if (state === 'idle') {
      el.orbTitle.textContent = 'Listening...';
      el.orbSub.textContent = 'Ready to help with your watchlist';
      el.aiChecklist.style.display = 'none';
    } else if (state === 'thinking') {
      el.orbTitle.textContent = 'Thinking...';
      el.orbSub.textContent = 'Analyzing your request';
      el.aiChecklist.style.display = 'flex';
      simulateChecklist();
    }
  }

  function simulateChecklist() {
    const items = el.aiChecklist.querySelectorAll('.check-item');
    items.forEach(i => i.querySelector('.check-circle').className = 'check-circle'); // reset
    
    let current = 0;
    const interval = setInterval(() => {
      if (current > 0 && current <= items.length) {
        items[current-1].querySelector('.check-circle').className = 'check-circle check-active';
        items[current-1].querySelector('.check-circle').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      }
      if (current < items.length) {
        items[current].querySelector('.check-circle').className = 'check-circle check-spin';
        items[current].querySelector('.check-circle').innerHTML = '';
      }
      current++;
      if (current > items.length) clearInterval(interval);
    }, 800);
  }

  function addMessage(text, isUser = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${isUser ? 'msg-user' : 'msg-ai'}`;
    
    const formattedText = isUser ? text : text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    
    wrapper.innerHTML = `
      <div class="msg-bubble">${formattedText}</div>
    `;
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

  // ── Auto-save snapshot on exit ──
  function autoSaveOnExit() {
    if (currentStocks.length > 0) {
      Detect.saveExitSnapshot(currentStocks);
    }
  }

  // ── Tab Navigation ──
  function initTabs() {
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        
        // Add active class to clicked item and corresponding tab
        item.classList.add('active');
        const targetTabId = 'tab-' + item.dataset.tab;
        const targetTab = document.getElementById(targetTabId);
        
        if (targetTab) {
          targetTab.classList.add('active');
        }
      });
    });
  }

  // ── Init ──
  async function init() {
    WL.init = () => {}; // dummy
    initSearch();
    initTabs();

    // Update greeting dynamically
    const greetingEl = document.querySelector('.greeting');
    if (greetingEl) {
      greetingEl.textContent = `${getGreeting()}, Manu`;
    }

    el.lblLast.textContent = fmtTime(lastVisit);
    el.lblNow.textContent = fmtTime(Date.now());

    // Mark all seen — both button and banner dismiss
    function markAllSeen() {
      Detect.markSeen(currentStocks);
      renderAlerts([]);
      refresh();
      toast('All changes marked as seen');
    }

    el.btnSeen.addEventListener('click', markAllSeen);
    el.bannerDismiss.addEventListener('click', markAllSeen);

    await refresh();

    // Polling
    setInterval(async () => {
      if (!document.hidden) await refresh();
    }, POLL);

    // Auto-save on tab switch
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        // User is leaving — save current prices as snapshot
        autoSaveOnExit();
      } else {
        // User is back — refresh and show changes
        await refresh();
      }
    });

    // Auto-save when closing browser/tab
    window.addEventListener('beforeunload', () => {
      autoSaveOnExit();
    });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
