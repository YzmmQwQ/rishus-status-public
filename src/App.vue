<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const DEV = import.meta.env.DEV;
const API_BASE = '/api';
const REFRESH_INTERVAL = 60000;
const refreshSeconds = REFRESH_INTERVAL / 1000;

// Translations
const translations = {
  zh: {
    langHint: '蛤？还有多语言呐？',
    online: '在线',
    offline: '离线',
    loading: '加载中...',
    fetchError: '请求失败',
    serverError: '无法获取服务器状态',
    refreshEvery: '每 {n} 秒自动刷新',
    lastUpdate: '最后更新',
    visitSite: '访问网站',
    moreInfo: '更多信息',
    onlinePlayers: '在线'
  },
  en: {
    langHint: 'Huh? Multiple languages?',
    online: 'Online',
    offline: 'Offline',
    loading: 'Loading...',
    fetchError: 'Request Failed',
    serverError: 'Failed to get server status',
    refreshEvery: 'Auto refresh every {n}s',
    lastUpdate: 'Last update',
    visitSite: 'Visit',
    moreInfo: 'More info',
    onlinePlayers: 'Online'
  },
  ja: {
    langHint: 'え？多言語対応なの？',
    online: 'オンライン',
    offline: 'オフライン',
    loading: '読み込み中...',
    fetchError: 'リクエスト失敗',
    serverError: 'サーバーステータスを取得できません',
    refreshEvery: '{n}秒ごとに自動更新',
    lastUpdate: '最終更新',
    visitSite: '訪問',
    moreInfo: '詳細',
    onlinePlayers: 'オンライン'
  }
};

const langNames = { zh: '中文', en: 'ENGLISH', ja: '日本語' };

// Mock data (dev only)
const MOCK_MC_DATA = {
  servers: [
    {
      name: 'Finaless',
      host: 'mc.yz-mm.top',
      port: 25565,
      online: true,
      players: { online: 12, max: 50 },
      version: 'Paper 1.20.4',
      motd: '欢迎来到YZMM生存服务器！',
      playerList: ['Steve', 'Alex', 'Notch', 'Builder_王'],
      infoUrl: 'https://docs.rishu.cfd/learn-more/mc-server.html#finaless'
    },
    {
      name: 'TradeCraft',
      host: 'mc.781391.cc',
      port: 25565,
      online: true,
      players: { online: 3, max: 20 },
      version: 'Paper 1.20.4',
      motd: '创造模式服务器',
      playerList: ['设计师A', '建筑师B'],
      infoUrl: 'https://docs.rishu.cfd/learn-more/mc-server.html#tradecraft'
    }
  ]
};

const MOCK_DATA = {
  '/server': {
    data: {
      cpu: {
        percent: 23.8,
        model: 'Intel i7-12700K',
        speed: 3.6,
        physicalCores: 8,
        threads: 16,
        coresText: '8C16H',
        gridLayout: { perRow: 8 },
        coresLoad: [5, 82, 15, 3, 67, 28, 91, 12, 45, 8, 73, 19, 56, 34, 7, 61]
      },
      memory: { total: 32 * 1024 * 1024 * 1024, used: 18.5 * 1024 * 1024 * 1024, percent: 57.8 },
      uptime: 3456789,
      load: [2.45, 3.12, 2.89]
    },
    updatedAt: Date.now()
  },
  '/websites': {
    websites: [
      { name: '一只铭铭的小站', url: 'https://yz-mm.top', online: true, latency: 156 },
      { name: 'Rishuですわ.', url: 'https://rishu.cfd', online: true, latency: 89 }
    ],
    updatedAt: Date.now()
  }
};

// Reactive state
const websites = ref([]);
const serverData = ref(null);
const mcServers = ref([]);
const mcError = ref(null);
const lastUpdate = ref('--');
const isDark = ref(false);
const currentLang = ref(localStorage.getItem('lang') || 'zh');
const langMenuOpen = ref(false);
const cursorEl = ref(null);
const scrollProgress = ref(0);

let refreshTimer;
let revealObserver;
let scrollRAF;

// i18n
function t(key, vars = {}) {
  let text = translations[currentLang.value][key] || translations.zh[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

// Utils
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getProgressClass(percent) {
  if (percent >= 90) return 'danger';
  if (percent >= 70) return 'warning';
  return '';
}

function formatTime(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleTimeString('zh-CN');
}

// Computed views
const cpu = computed(() => {
  const d = serverData.value?.cpu;
  const percent = d?.percent || 0;
  return {
    model: serverData.value ? (d?.model || '--') : t('offline'),
    speed: d?.speed ?? '--',
    coresText: d?.coresText || '--',
    value: serverData.value ? `${percent.toFixed(1)}%` : '--',
    percent,
    barClass: getProgressClass(percent)
  };
});

const cpuCores = computed(() => {
  const d = serverData.value?.cpu;
  if (!d) return { cores: [], perRow: 8 };
  const threads = d.threads || d.coresLoad?.length || 8;
  const coresLoad = d.coresLoad || Array(threads).fill(d.percent || 0);
  const perRow = d.gridLayout?.perRow || Math.ceil(threads / 2);
  const cores = [];
  for (let i = 0; i < threads; i++) {
    const load = coresLoad[i] || 0;
    let level = '';
    if (load >= 61) level = 'level-4';
    else if (load >= 41) level = 'level-3';
    else if (load >= 21) level = 'level-2';
    else if (load >= 2) level = 'level-1';
    cores.push(level);
  }
  return { cores, perRow };
});

const memory = computed(() => {
  if (!serverData.value) {
    return { value: t('offline'), percent: 0, barClass: '', info: '' };
  }
  const m = serverData.value.memory || {};
  const percent = m.percent || 0;
  return {
    value: `${formatBytes(m.used)} / ${formatBytes(m.total)}`,
    percent,
    barClass: getProgressClass(percent),
    info: m.info || formatBytes(m.total)
  };
});

const uptimeItems = computed(() => {
  const uptime = serverData.value?.uptime;
  if (!uptime) {
    return [
      { value: '--', label: '--' },
      { value: '--', label: '--' },
      { value: '--', label: '--' }
    ];
  }
  const totalSeconds = Math.floor(uptime);
  const months = Math.floor(totalSeconds / (86400 * 30));
  const days = Math.floor((totalSeconds % (86400 * 30)) / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const units = [
    { value: months, label: 'MO' },
    { value: days, label: 'D' },
    { value: hours, label: 'H' },
    { value: minutes, label: 'M' }
  ];
  let startIndex = 0;
  for (let i = 0; i < units.length; i++) {
    if (units[i].value > 0) {
      startIndex = i;
      break;
    }
  }
  if (startIndex + 3 > units.length) {
    startIndex = units.length - 3;
  }
  return units.slice(startIndex, startIndex + 3);
});

const loadItems = computed(() => {
  const load = serverData.value?.load;
  return [
    { value: load?.[0]?.toFixed(1) ?? '--', label: '1M' },
    { value: load?.[1]?.toFixed(1) ?? '--', label: '5M' },
    { value: load?.[2]?.toFixed(1) ?? '--', label: '15M' }
  ];
});

function mcAddress(s) {
  return s.port === 25565 ? s.host : `${s.host}:${s.port}`;
}

// Theme
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  isDark.value = saved === 'dark' || (!saved && prefersDark);
  document.body.classList.toggle('dark', isDark.value);
}

function toggleTheme() {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  document.body.classList.toggle('dark', isDark.value);
}

// Language
function toggleLangMenu() {
  langMenuOpen.value = !langMenuOpen.value;
}

function setLang(lang) {
  currentLang.value = lang;
  localStorage.setItem('lang', lang);
  langMenuOpen.value = false;
}

function handleDocumentClick(e) {
  if (!e.target.closest('.lang-selector')) {
    langMenuOpen.value = false;
  }
}

// Scroll progress / back to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleScroll() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  scrollProgress.value = Math.min(window.scrollY / maxScroll, 1);
}

function queueHandleScroll() {
  if (scrollRAF) return;
  scrollRAF = window.requestAnimationFrame(() => {
    scrollRAF = 0;
    handleScroll();
  });
}

// API
async function fetchAPI(endpoint) {
  if (DEV) {
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
    return MOCK_DATA[endpoint];
  }
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return null;
  }
}

async function updateWebsites() {
  let result;
  if (DEV) {
    await new Promise((r) => setTimeout(r, 50));
    result = MOCK_DATA['/websites'];
  } else {
    result = await fetchAPI('/websites');
  }
  websites.value = result?.websites || [];
  return result?.updatedAt;
}

async function updateServer() {
  const result = await fetchAPI('/server');
  serverData.value = result?.data || null;
  return result?.updatedAt;
}

async function updateMC() {
  try {
    let result;
    if (DEV) {
      await new Promise((r) => setTimeout(r, 100));
      result = {
        success: true,
        servers: MOCK_MC_DATA.servers.map((s) => ({
          ...s,
          players: s.online
            ? { online: Math.floor(Math.random() * s.players.max), max: s.players.max }
            : null
        })),
        updatedAt: Date.now()
      };
    } else {
      const res = await fetch(`${API_BASE}/minecraft`);
      result = await res.json();
    }

    if (!result.success || !result.servers) {
      mcServers.value = [];
      mcError.value = t('serverError');
      return null;
    }

    mcServers.value = result.servers;
    mcError.value = null;
    return result?.updatedAt;
  } catch (error) {
    mcServers.value = [];
    mcError.value = t('fetchError');
    return null;
  }
}

async function refreshAll() {
  const [websiteTime, serverTime, mcTime] = await Promise.all([
    updateWebsites(),
    updateServer(),
    updateMC()
  ]);
  const latestTime = Math.max(websiteTime || 0, serverTime || 0, mcTime || 0);
  lastUpdate.value = formatTime(latestTime || Date.now());
}

// Custom cursor
const cursorPos = { x: -100, y: -100 };
const cursorSmooth = { x: -100, y: -100 };
const cursorSize = { width: 26, height: 26 };
let cursorTarget = null;
let cursorClickScale = 1;
let cursorClickTarget = 1;
let cursorRAF;
const cursorListeners = [];

function tickCursor() {
  let x = cursorPos.x;
  let y = cursorPos.y;

  if (cursorTarget && !cursorTarget.isConnected) {
    cursorTarget = null;
    cursorEl.value?.classList.remove('is-hover');
  }

  if (cursorTarget) {
    const rect = cursorTarget.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      cursorTarget = null;
      cursorEl.value?.classList.remove('is-hover');
    } else {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x = centerX + (x - centerX) * 0.12;
      y = centerY + (y - centerY) * 0.12;
      cursorSize.width = rect.width + 20;
      cursorSize.height = rect.height + 20;
    }
  }

  if (!cursorTarget) {
    cursorSize.width += (26 - cursorSize.width) * 0.2;
    cursorSize.height += (26 - cursorSize.height) * 0.2;
  }

  cursorSmooth.x += (x - cursorSmooth.x) * 0.28;
  cursorSmooth.y += (y - cursorSmooth.y) * 0.28;
  cursorClickScale += (cursorClickTarget - cursorClickScale) * 0.3;

  if (cursorEl.value) {
    cursorEl.value.style.transform =
      `translate3d(${cursorSmooth.x}px, ${cursorSmooth.y}px, 0) translate(-50%, -50%) scale(${cursorClickScale})`;
    cursorEl.value.style.setProperty('--cursor-width', `${cursorSize.width}px`);
    cursorEl.value.style.setProperty('--cursor-height', `${cursorSize.height}px`);
  }

  cursorRAF = window.requestAnimationFrame(tickCursor);
}

function setupCursor() {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  document.body.classList.add('has-custom-cursor');

  const onPointerMove = (e) => {
    cursorPos.x = e.clientX;
    cursorPos.y = e.clientY;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  cursorListeners.push({ target: window, type: 'pointermove', fn: onPointerMove });

  cursorRAF = window.requestAnimationFrame(tickCursor);

  // 只吸附交互控件（顶栏按钮、链接、卡片内小按钮），
  // 不吸附 .status-item / .mc-server 等大卡片，避免挡住里面的小按钮
  const hoverSelectors =
    'a, button, .nav-link, .lang-btn, .theme-toggle';
  const onDocumentOver = (e) => {
    const target = e.target.closest?.(hoverSelectors);
    if (!target || cursorTarget === target) return;
    cursorTarget = target;
    cursorEl.value?.classList.add('is-hover');
  };
  const onDocumentOut = (e) => {
    if (!cursorTarget) return;
    if (e.relatedTarget && cursorTarget.contains(e.relatedTarget)) return;
    cursorTarget = null;
    cursorEl.value?.classList.remove('is-hover');
  };
  document.addEventListener('pointerover', onDocumentOver);
  document.addEventListener('pointerout', onDocumentOut);
  cursorListeners.push({ target: document, type: 'pointerover', fn: onDocumentOver });
  cursorListeners.push({ target: document, type: 'pointerout', fn: onDocumentOut });

  // 磁吸：顶栏按钮跟随光标轻微位移
  const magneticSelectors = '.theme-toggle, .lang-btn, .nav-link';
  let magneticTarget = null;
  let magneticRect = null;
  const onMagneticMove = (e) => {
    const el = e.target.closest?.(magneticSelectors);
    if (!el) return;
    if (magneticTarget !== el) {
      magneticTarget = el;
      magneticRect = el.getBoundingClientRect();
    }
    el.classList.add('is-magnetic');
    const x = (e.clientX - magneticRect.left - magneticRect.width / 2) * 0.4;
    const y = (e.clientY - magneticRect.top - magneticRect.height / 2) * 0.4;
    el.style.setProperty('--mx', x);
    el.style.setProperty('--my', y);
  };
  const onMagneticOut = (e) => {
    if (!magneticTarget) return;
    if (e.relatedTarget && magneticTarget.contains(e.relatedTarget)) return;
    magneticTarget.style.setProperty('--mx', 0);
    magneticTarget.style.setProperty('--my', 0);
    magneticTarget = null;
    magneticRect = null;
  };
  document.addEventListener('pointermove', onMagneticMove);
  document.addEventListener('pointerout', onMagneticOut);
  cursorListeners.push({ target: document, type: 'pointermove', fn: onMagneticMove });
  cursorListeners.push({ target: document, type: 'pointerout', fn: onMagneticOut });

  const onWindowLeave = () => cursorEl.value?.classList.add('is-hidden');
  const onWindowEnter = () => cursorEl.value?.classList.remove('is-hidden');
  document.addEventListener('mouseleave', onWindowLeave);
  document.addEventListener('mouseenter', onWindowEnter);
  cursorListeners.push({ target: document, type: 'mouseleave', fn: onWindowLeave });
  cursorListeners.push({ target: document, type: 'mouseenter', fn: onWindowEnter });

  const onPointerDown = () => { cursorClickTarget = 0.82; };
  const onPointerUp = () => { cursorClickTarget = 1; };
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });
  cursorListeners.push({ target: window, type: 'pointerdown', fn: onPointerDown });
  cursorListeners.push({ target: window, type: 'pointerup', fn: onPointerUp });
  cursorListeners.push({ target: window, type: 'pointercancel', fn: onPointerUp });
}

// Scroll reveal
function setupReveal() {
  const blocks = Array.from(document.querySelectorAll('.reveal-block'));
  if (!blocks.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    blocks.forEach((b) => b.classList.add('is-visible'));
    return;
  }
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  blocks.forEach((b) => revealObserver.observe(b));
}

onMounted(async () => {
  initTheme();
  await refreshAll();
  refreshTimer = window.setInterval(refreshAll, REFRESH_INTERVAL);

  handleScroll();
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('scroll', queueHandleScroll, { passive: true });
  setupCursor();
  nextTick(setupReveal);
});

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer);
  window.cancelAnimationFrame(cursorRAF);
  window.cancelAnimationFrame(scrollRAF);
  revealObserver?.disconnect();
  cursorListeners.forEach(({ target, type, fn }) => {
    target.removeEventListener(type, fn);
  });
  cursorTarget = null;
  document.body.classList.remove('has-custom-cursor');
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('scroll', queueHandleScroll);
});
</script>

<template>
  <div class="dotted-bg"></div>
  <div class="scroll-progress" :style="{ transform: `scaleX(${scrollProgress})` }" aria-hidden="true"></div>
  <div class="side-scroll-indicator" aria-hidden="true">
    <span :style="{ transform: `scaleY(${Math.max(scrollProgress, 0.08)})` }"></span>
  </div>

  <nav class="top-bar">
    <button type="button" class="site-title" @click="scrollToTop">STATUS.RISHU.CFD</button>
    <div class="nav-right">
      <a href="https://rishu.cfd" class="nav-link" target="_blank">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>MAIN</span>
      </a>
      <a href="https://docs.rishu.cfd" class="nav-link" target="_blank">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <span>DOCS</span>
      </a>
      <div class="lang-selector">
        <button class="lang-btn" @click="toggleLangMenu">
          <svg class="lang-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span id="currentLang">{{ langNames[currentLang] }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="lang-menu" :class="{ show: langMenuOpen }">
          <div class="lang-menu-header">{{ t('langHint') }}</div>
          <button @click="setLang('zh')">中文</button>
          <button @click="setLang('en')">English</button>
          <button @click="setLang('ja')">日本語</button>
        </div>
      </div>
      <button class="theme-toggle" @click="toggleTheme">
        <svg v-show="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg v-show="!isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <span id="themeText">{{ isDark ? 'LIGHT' : 'DARK' }}</span>
      </button>
    </div>
  </nav>

  <div class="container">
    <div class="section-label">WEBSITES</div>

    <!-- 网站状态 -->
    <div class="status-grid reveal-block">
      <div v-if="!websites.length" class="status-item">
        <div class="status-header">
          <span class="status-name">{{ t('loading') }}</span>
          <span class="status-dot checking"></span>
        </div>
      </div>
      <div v-for="site in websites" :key="site.url" class="status-item">
        <div class="status-header">
          <span class="status-name">{{ site.name }}</span>
          <span class="status-dot" :class="site.online ? 'online' : 'offline'"></span>
        </div>
        <div class="status-value">{{ site.online ? t('online') : t('offline') }}</div>
        <div class="status-detail">{{ site.url.replace('https://', '') }}</div>
        <a :href="site.url" target="_blank" class="status-link-btn" :title="t('visitSite')">→</a>
      </div>
    </div>

    <div class="section-label">SERVER RESOURCES</div>

    <!-- 服务器资源 -->
    <div class="resources-grid reveal-block">
      <!-- CPU 大格 -->
      <div class="cpu-block">
        <div class="label">
          <span class="label-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg> CPU
          </span>
          <span class="label-detail">{{ cpu.model }} · {{ cpu.speed }}GHz · {{ cpu.coresText }}</span>
        </div>
        <div class="cpu-value">{{ cpu.value }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :class="cpu.barClass" :style="{ width: cpu.percent + '%' }"></div>
        </div>
        <div class="cpu-grid" :style="{ gridTemplateColumns: `repeat(${cpuCores.perRow}, 1fr)` }">
          <div v-for="(level, i) in cpuCores.cores" :key="i" class="cpu-core" :class="level"></div>
        </div>
      </div>
      <!-- 内存和运行时间 -->
      <div class="info-grid">
        <div class="info-item">
          <div class="label">
            <span class="label-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2" /><line x1="6" y1="10" x2="6" y2="14" /><line x1="10" y1="10" x2="10" y2="14" /><line x1="14" y1="10" x2="14" y2="14" /><line x1="18" y1="10" x2="18" y2="14" /></svg> MEMORY
            </span>
            <span class="label-detail">{{ memory.info }}</span>
          </div>
          <div class="value">{{ memory.value }}</div>
          <div class="progress-bar">
            <div class="progress-fill" :class="memory.barClass" :style="{ width: memory.percent + '%' }"></div>
          </div>
        </div>
        <div class="info-item">
          <div class="uptime-load-row">
            <div class="uptime-section">
              <div class="label">
                <span class="label-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> UPTIME
                </span>
              </div>
              <div class="uptime-grid">
                <div v-for="(u, i) in uptimeItems" :key="i" class="uptime-item">
                  <div class="uptime-value">{{ u.value }}</div>
                  <div class="uptime-unit">{{ u.label }}</div>
                </div>
              </div>
            </div>
            <div class="vertical-divider"></div>
            <div class="load-section">
              <div class="label">
                <span class="label-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> LOAD
                </span>
              </div>
              <div class="load-grid">
                <div v-for="(l, i) in loadItems" :key="i" class="uptime-item">
                  <div class="uptime-value">{{ l.value }}</div>
                  <div class="uptime-unit">{{ l.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-label">MINECRAFT SERVERS</div>

    <!-- Minecraft 服务器 -->
    <div class="mc-grid reveal-block">
      <div v-if="mcError" class="loading-item">{{ mcError }}</div>
      <div v-else-if="!mcServers.length" class="loading-item">
        <div class="status-header">
          <span class="status-name">{{ t('loading') }}</span>
        </div>
      </div>
      <template v-else>
        <div v-for="s in mcServers" :key="`${s.host}:${s.port}`" class="mc-server" :class="{ offline: !s.online }">
          <div class="mc-header">
            <span class="mc-name">{{ s.name }}</span>
            <span class="mc-status-dot" :class="{ offline: !s.online }"></span>
          </div>
          <div class="mc-address">{{ mcAddress(s) }}</div>
          <template v-if="s.online">
            <div class="mc-players">{{ s.players.online }} <span>/ {{ s.players.max }}</span></div>
            <div v-if="s.version" class="mc-version">{{ s.version }}</div>
            <div v-if="s.motd" class="mc-motd">{{ s.motd }}</div>
            <div v-if="s.playerList && s.playerList.length" class="mc-player-list">
              {{ t('onlinePlayers') }}: {{ s.playerList.join(', ') }}
            </div>
          </template>
          <div v-else class="mc-players" style="color: var(--accent-negative);">{{ t('offline') }}</div>
          <a v-if="s.infoUrl" :href="s.infoUrl" target="_blank" class="mc-info-btn" :title="t('moreInfo')">⋯</a>
        </div>
      </template>
    </div>

    <div class="divider"></div>

    <!-- 刷新信息 -->
    <div class="footer">
      <div class="refresh-info">
        <span>{{ t('refreshEvery', { n: refreshSeconds }) }}</span>
      </div>
      <div class="last-update">
        <span>{{ t('lastUpdate') }}</span>: <span>{{ lastUpdate }}</span>
      </div>
      <span class="footer-credit">Made by <a href="https://yz-mm.top" target="_blank" class="footer-link">YZMM</a></span>
    </div>
  </div>

  <div ref="cursorEl" class="cursor" aria-hidden="true">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>
