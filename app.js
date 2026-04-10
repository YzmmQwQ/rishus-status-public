// 配置
const CONFIG = {
    apiBase: '/api',
    refreshInterval: 60000,
    devMode: false
};

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
let currentLang = localStorage.getItem('lang') || 'zh';

function t(key, vars = {}) {
    let text = translations[currentLang][key] || translations['zh'][key] || key;
    for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

function toggleLangMenu() {
    const menu = document.getElementById('langMenu');
    menu.classList.toggle('show');
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.getElementById('currentLang').textContent = langNames[lang];
    document.getElementById('langMenu').classList.remove('show');
    applyTranslations();
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang] && translations[currentLang][key]) {
            el.innerHTML = translations[currentLang][key];
        }
    });
    // 更新刷新间隔文本
    const refreshEl = document.querySelector('[data-i18n="refreshEvery"]');
    if (refreshEl) {
        const interval = CONFIG.refreshInterval / 1000;
        refreshEl.innerHTML = t('refreshEvery', { n: interval }).replace('{n}', `<span id="refreshInterval">${interval}</span>`);
    }
}

// Close lang menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-selector')) {
        document.getElementById('langMenu')?.classList.remove('show');
    }
});

// 模拟数据
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

// 工具函数
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
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

// 主题切换
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('sunIcon').style.display = isDark ? 'block' : 'none';
    document.getElementById('moonIcon').style.display = isDark ? 'none' : 'block';
    document.getElementById('themeText').textContent = isDark ? 'LIGHT' : 'DARK';
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);

    if (isDark) {
        document.body.classList.add('dark');
    }

    document.getElementById('sunIcon').style.display = isDark ? 'block' : 'none';
    document.getElementById('moonIcon').style.display = isDark ? 'none' : 'block';
    document.getElementById('themeText').textContent = isDark ? 'LIGHT' : 'DARK';
}

// API 调用
async function fetchAPI(endpoint) {
    if (CONFIG.devMode) {
        await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
        return MOCK_DATA[endpoint];
    }

    try {
        const response = await fetch(`${CONFIG.apiBase}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return null;
    }
}

// 更新网站状态
async function updateWebsites() {
    const container = document.getElementById('websites');

    let result;
    if (CONFIG.devMode) {
        await new Promise(r => setTimeout(r, 50));
        result = MOCK_DATA['/websites'];
    } else {
        result = await fetchAPI('/websites');
    }

    const websites = result?.websites || [];
    container.innerHTML = '';

    for (const site of websites) {
        const div = document.createElement('div');
        div.className = 'status-item';
        div.innerHTML = `
            <div class="status-header">
                <span class="status-name">${site.name}</span>
                <span class="status-dot ${site.online ? 'online' : 'offline'}"></span>
            </div>
            <div class="status-value">${site.online ? t('online') : t('offline')}</div>
            <div class="status-detail">${site.url.replace('https://', '')}</div>
            <a href="${site.url}" target="_blank" class="status-link-btn" title="${t('visitSite')}">→</a>
        `;
        container.appendChild(div);
    }

    return result?.updatedAt;
}

// 更新服务器资源
async function updateServerResources() {
    const result = await fetchAPI('/server');

    if (!result?.data) {
        document.getElementById('cpuModel').textContent = t('offline');
        document.getElementById('memValue').textContent = t('offline');
        return null;
    }

    const data = result.data;

    // CPU
    const cpuPercent = data.cpu?.percent || 0;
    document.getElementById('cpuModel').textContent = data.cpu?.model || '--';
    document.getElementById('cpuSpeed').textContent = data.cpu?.speed || '--';
    document.getElementById('cpuCores').textContent = data.cpu?.coresText || '--';
    document.getElementById('cpuValue').textContent = `${cpuPercent.toFixed(1)}%`;
    const cpuBar = document.getElementById('cpuBar');
    cpuBar.style.width = `${cpuPercent}%`;
    cpuBar.className = `progress-fill ${getProgressClass(cpuPercent)}`;

    // CPU 核心格子
    const cpuGrid = document.getElementById('cpuGrid');
    cpuGrid.innerHTML = '';

    const threads = data.cpu?.threads || data.cpu?.coresLoad?.length || 8;
    const coresLoad = data.cpu?.coresLoad || Array(threads).fill(cpuPercent);
    const perRow = data.cpu?.gridLayout?.perRow || Math.ceil(threads / 2);

    cpuGrid.style.gridTemplateColumns = `repeat(${perRow}, 1fr)`;

    for (let i = 0; i < threads; i++) {
        const load = coresLoad[i] || 0;
        const div = document.createElement('div');
        div.className = 'cpu-core';

        if (load >= 61) div.classList.add('level-4');
        else if (load >= 41) div.classList.add('level-3');
        else if (load >= 21) div.classList.add('level-2');
        else if (load >= 2) div.classList.add('level-1');

        cpuGrid.appendChild(div);
    }

    // Memory
    const mem = data.memory || {};
    const memPercent = mem.percent || 0;
    document.getElementById('memValue').textContent = `${formatBytes(mem.used)} / ${formatBytes(mem.total)}`;
    document.getElementById('memTotal').textContent = formatBytes(mem.total);
    const memBar = document.getElementById('memBar');
    memBar.style.width = `${memPercent}%`;
    memBar.className = `progress-fill ${getProgressClass(memPercent)}`;

    // Uptime
    if (data.uptime) {
        const totalSeconds = Math.floor(data.uptime);
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

        for (let i = 0; i < 3; i++) {
            const unit = units[startIndex + i];
            document.getElementById(`uptime${i + 1}`).textContent = unit.value;
            document.getElementById(`uptimeUnit${i + 1}`).textContent = unit.label;
        }
    }

    // Load
    if (data.load) {
        document.getElementById('load1').textContent = data.load[0]?.toFixed(1) || '--';
        document.getElementById('load5').textContent = data.load[1]?.toFixed(1) || '--';
        document.getElementById('load15').textContent = data.load[2]?.toFixed(1) || '--';
    }

    // 本地服务状态
    const localServicesContainer = document.getElementById('localServices');
    const localServicesLabel = document.getElementById('localServicesLabel');
    if (data.localServices && data.localServices.length > 0) {
        localServicesLabel.style.display = 'block';
        localServicesContainer.innerHTML = '';

        for (const service of data.localServices) {
            const div = document.createElement('div');
            div.className = 'status-item';
            div.innerHTML = `
                <div class="status-header">
                    <span class="status-name">${service.name}</span>
                    <span class="status-dot ${service.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="status-value">${service.online ? t('online') : t('offline')}</div>
                <div class="status-detail">${service.online ? '✓ Available' : '✗ Unavailable'}</div>
            `;
            localServicesContainer.appendChild(div);
        }
    } else {
        localServicesLabel.style.display = 'none';
        localServicesContainer.innerHTML = '';
    }

    return result?.updatedAt;
}

// 更新 Minecraft 服务器
async function updateMCServers() {
    const container = document.getElementById('mcServers');

    try {
        let result;

        if (CONFIG.devMode) {
            await new Promise(r => setTimeout(r, 100));
            result = {
                success: true,
                servers: MOCK_MC_DATA.servers.map(s => ({
                    ...s,
                    players: s.online ? {
                        online: Math.floor(Math.random() * s.players.max),
                        max: s.players.max
                    } : null
                })),
                updatedAt: Date.now()
            };
        } else {
            const response = await fetch(`${CONFIG.apiBase}/minecraft`);
            result = await response.json();
        }

        if (!result.success || !result.servers) {
            container.innerHTML = `<div class="loading-item">${t('serverError')}</div>`;
            return null;
        }

        container.innerHTML = '';

        for (const data of result.servers) {
            const div = document.createElement('div');
            div.className = `mc-server ${data.online ? '' : 'offline'}`;

            const displayAddress = data.port === 25565 ? data.host : `${data.host}:${data.port}`;

            if (data.online) {
                div.innerHTML = `
                    <div class="mc-header">
                        <span class="mc-name">${data.name}</span>
                        <span class="mc-status-dot"></span>
                    </div>
                    <div class="mc-address">${displayAddress}</div>
                    <div class="mc-players">${data.players.online} <span>/ ${data.players.max}</span></div>
                    ${data.version ? `<div class="mc-version">${data.version}</div>` : ''}
                    ${data.motd ? `<div class="mc-motd">${data.motd}</div>` : ''}
                    ${data.playerList && data.playerList.length > 0 ? `
                        <div class="mc-player-list">${t('onlinePlayers')}: ${data.playerList.join(', ')}</div>
                    ` : ''}
                    ${data.infoUrl ? `<a href="${data.infoUrl}" target="_blank" class="mc-info-btn" title="${t('moreInfo')}">⋯</a>` : ''}
                `;
            } else {
                div.innerHTML = `
                    <div class="mc-header">
                        <span class="mc-name">${data.name}</span>
                        <span class="mc-status-dot offline"></span>
                    </div>
                    <div class="mc-address">${displayAddress}</div>
                    <div class="mc-players" style="color: var(--accent-negative);">${t('offline')}</div>
                    ${data.infoUrl ? `<a href="${data.infoUrl}" target="_blank" class="mc-info-btn" title="${t('moreInfo')}">⋯</a>` : ''}
                `;
            }

            container.appendChild(div);
        }

        return result?.updatedAt;
    } catch (error) {
        container.innerHTML = `<div class="loading-item">${t('fetchError')}</div>`;
        return null;
    }
}

// 刷新
async function refreshAll() {
    const [websiteTime, serverTime, mcTime] = await Promise.all([
        updateWebsites(),
        updateServerResources(),
        updateMCServers()
    ]);

    // 使用最新的更新时间
    const latestTime = Math.max(websiteTime || 0, serverTime || 0, mcTime || 0);
    document.getElementById('lastUpdate').textContent = formatTime(latestTime || Date.now());
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    document.getElementById('currentLang').textContent = langNames[currentLang];
    applyTranslations();
    refreshAll();
    setInterval(refreshAll, CONFIG.refreshInterval);
});
