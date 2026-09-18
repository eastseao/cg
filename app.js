/* ═══ 应用核心 ═══ */
const App = {
  currentPage: null,
  NAV_ITEMS: [
    { key: 'dashboard', label: '概览', section: '采购', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
    { key: 'packaging', label: '下单', section: '采购', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
    { key: 'plan', label: '计划', section: '采购', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' },
    { key: 'quotation', label: '报价', section: '采购', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' },
    { key: 'query', label: '台账', section: '资源', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
    { key: 'product_bom', label: 'BOM', section: '资源', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-7.5L15 7m-6 6l-4.5 4.5M19.5 19.5L15 15M9 9L4.5 4.5"/></svg>' },
    { key: 'supplier', label: '厂家', section: '资源', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>' },
    { key: 'compare', label: '比价', section: '业务', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' },
    { key: 'contract', label: '合同', section: '业务', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M8 9h2"/></svg>' },
    { key: 'collection', label: '应付', section: '业务', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { key: 'purchase', label: '垫付', section: '业务', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
    { key: 'memo', label: '备忘', section: '业务', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
    { key: 'travel', label: '差旅', section: '业务', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>' },
    { key: 'inventory', label: '库存', section: '库存', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' },
  ],
  PAGE_TITLES: {
    dashboard: '概览', packaging: '包材下单', plan: '采购计划', quotation: '报价管理',
    query: '物料台账', product_bom: '成品BOM', supplier: '供应商管理',
    compare: '三方比价', contract: '合同管理', collection: '应付提醒',
    purchase: '采购垫付', memo: '备忘录', travel: '差旅管理', inventory: '库存管理', settings: '设置'
  },
  PAGE_LOADERS: {},

  async init() {
    // 初始化数据库
    await DB.init();
    // 渲染侧边栏
    App.renderSidebar();
    // 绑定事件
    App.bindEvents();
    // 加载默认页面
    App.navigate('dashboard');
  },

  renderSidebar() {
    const area = document.getElementById('nav-area');
    area.innerHTML = '';
    App.NAV_ITEMS.forEach(item => {
      const el = document.createElement('div');
      el.className = 'nav-item';
      el.dataset.page = item.key;
      el.innerHTML = `${item.icon}<span>${item.label}</span>`;
      el.addEventListener('click', () => App.navigate(item.key));
      area.appendChild(el);
    });
  },

  bindEvents() {
    document.getElementById('btn-collapse').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });
    // Settings nav (icon-only at bottom)
    const settingsNav = document.querySelector('.nav-item[data-page="settings"]');
    if (settingsNav) settingsNav.addEventListener('click', () => App.navigate('settings'));
    document.getElementById('modal-close').addEventListener('click', App.closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) App.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { App.closeModal(); App.closeContextMenu(); }
    });
    document.addEventListener('click', () => App.closeContextMenu());
  },

  navigate(key) {
    if (App.currentPage === key) return;
    App.currentPage = key;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === key);
    });
    document.getElementById('page-title').textContent = App.PAGE_TITLES[key] || key;
    const content = document.getElementById('page-content');
    content.innerHTML = '';
    const loader = App.PAGE_LOADERS[key];
    if (loader) { try { loader(content); } catch (e) { console.error('Page load error:', key, e); content.innerHTML = `<div class="empty-state"><p>页面加载失败: ${e.message}</p></div>`; } }
    else content.innerHTML = '<div class="empty-state"><p>页面未实现</p></div>';
  },

  // ═══ 模态弹窗 ═══
  showModal(title, bodyHTML, footerHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-footer').innerHTML = footerHTML || '';
    document.getElementById('modal-overlay').classList.remove('hidden');
  },
  closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); },

  // ═══ Toast ═══
  toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  },

  // ═══ 右键菜单 ═══
  showContextMenu(x, y, items) {
    const menu = document.getElementById('context-menu');
    menu.innerHTML = '';
    items.forEach(item => {
      if (item.sep) { const sep = document.createElement('div'); sep.className = 'context-menu-separator'; menu.appendChild(sep); return; }
      const el = document.createElement('div');
      el.className = 'context-menu-item' + (item.danger ? ' danger' : '');
      el.textContent = item.label;
      el.addEventListener('click', (e) => { e.stopPropagation(); App.closeContextMenu(); item.action(); });
      menu.appendChild(el);
    });
    menu.style.left = Math.min(x, window.innerWidth - 160) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 200) + 'px';
    menu.classList.remove('hidden');
  },
  closeContextMenu() { document.getElementById('context-menu').classList.add('hidden'); },

  // ═══ 工具函数 ═══
  formatMoney(n) { const v = Number(n) || 0; return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
  formatDate(s) { if (!s) return ''; return String(s).slice(0, 10); },
  escapeHtml(s) { if (s === null || s === undefined) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
  debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
  downloadBlob(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); },
  downloadText(text, filename, mime = 'text/plain') { App.downloadBlob(new Blob([text], { type: mime + ';charset=utf-8' }), filename); },
  numToChinese(n) {
    if (!n && n !== 0) return '零元整';
    const digits = ['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
    const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
    const intPart = Math.floor(Math.abs(n));
    const decPart = Math.round((Math.abs(n) - intPart) * 100);
    if (intPart === 0 && decPart === 0) return '零元整';
    let result = '';
    const intStr = String(intPart);
    for (let i = 0; i < intStr.length; i++) {
      const d = parseInt(intStr[i]); const u = units[intStr.length - 1 - i];
      if (d === 0) { if (!result.endsWith('零')) result += '零'; }
      else result += digits[d] + u;
    }
    result = result.replace(/零+$/, ''); if (result.endsWith('零')) result = result.slice(0, -1);
    result += '元';
    if (decPart === 0) result += '整';
    else { const j = Math.floor(decPart / 10); const f = decPart % 10; if (j > 0) result += digits[j] + '角'; if (f > 0) result += digits[f] + '分'; }
    return (n < 0 ? '负' : '') + result;
  },

  // 表格行右键
  attachRowContextMenu(row, items) {
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      App.showContextMenu(e.clientX, e.clientY, items);
    });
  },

  // 创建表格
  createTable(columns, rows, options = {}) {
    const wrap = document.createElement('div');
    wrap.style.overflow = 'auto'; wrap.style.height = '100%';
    const table = document.createElement('table');
    table.className = 'data-table';
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    columns.forEach(c => { const th = document.createElement('th'); th.textContent = c.title; if (c.width) th.style.width = c.width; tr.appendChild(th); });
    thead.appendChild(tr); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    if (rows.length === 0) {
      const tr2 = document.createElement('tr');
      const td = document.createElement('td'); td.colSpan = columns.length; td.style.textAlign = 'center'; td.style.color = 'var(--text-tertiary)'; td.style.padding = '40px';
      td.textContent = options.emptyText || '暂无数据';
      tr2.appendChild(td); tbody.appendChild(tr2);
    } else {
      rows.forEach(rowData => {
        const tr2 = document.createElement('tr');
        if (options.onContextMenu) App.attachRowContextMenu(tr2, options.onContextMenu(rowData));
        columns.forEach(c => {
          const td = document.createElement('td');
          const val = rowData[c.key];
          if (c.render) td.innerHTML = c.render(val, rowData);
          else td.textContent = val !== null && val !== undefined ? val : '';
          tr2.appendChild(td);
        });
        tbody.appendChild(tr2);
      });
    }
    table.appendChild(tbody); wrap.appendChild(table);
    return wrap;
  },

  // 确认对话框
  showConfirm(msg, onConfirm) {
    App.showModal('确认', `<p style="padding:8px 0">${msg}</p>`, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="confirm-ok">确定</button>`);
    document.getElementById('confirm-ok').addEventListener('click', () => { App.closeModal(); onConfirm(); });
  },

  // 打印
  printHTML(html) {
    const c = document.getElementById('print-container');
    c.innerHTML = html; c.classList.remove('hidden');
    setTimeout(() => { window.print(); c.classList.add('hidden'); c.innerHTML = ''; }, 100);
  },
};

// 启动
window.addEventListener('DOMContentLoaded', () => { App.init(); });
