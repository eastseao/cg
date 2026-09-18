/* ═══ 概览页 ═══ */
App.PAGE_LOADERS.dashboard = function(container) {
  const purchases = DB.getPurchases(0);
  const memos = DB.getMemos('', '', '待处理', 0);
  const suppliers = DB.getSuppliers();
  const collections = DB.getCollections();
  const packaging = DB.getPackagingOrders({ archived: 0 });
  const totalPurchase = purchases.reduce((s, p) => s + (p.total || 0), 0);
  const totalCollection = collections.reduce((s, c) => s + (c.amount_due || 0), 0);

  container.innerHTML = `
    <div class="page">
      <div class="page-header"><h2>概览</h2></div>
      <div style="display:flex;gap:16px;padding:16px;flex-wrap:wrap">
        <div class="stat-card" style="flex:1;min-width:200px">
          <div class="stat-icon" style="background:var(--info-bg);color:var(--info)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
          <div class="stat-label">采购垫付 (笔)</div>
          <div class="stat-value">${purchases.length}</div>
          <div style="font-size:var(--font-micro);color:var(--text-secondary)">合计 ¥${App.formatMoney(totalPurchase)}</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:200px">
          <div class="stat-icon" style="background:var(--warning-bg);color:var(--warning)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
          <div class="stat-label">待处理备忘</div>
          <div class="stat-value">${memos.length}</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:200px">
          <div class="stat-icon" style="background:var(--success-bg);color:var(--success)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg></div>
          <div class="stat-label">供应商总数</div>
          <div class="stat-value">${suppliers.length}</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:200px">
          <div class="stat-icon" style="background:var(--danger-bg);color:var(--danger)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="stat-label">应付金额</div>
          <div class="stat-value">¥${App.formatMoney(totalCollection)}</div>
          <div style="font-size:var(--font-micro);color:var(--text-secondary)">${collections.length} 笔待催</div>
        </div>
        <div class="stat-card" style="flex:1;min-width:200px">
          <div class="stat-icon" style="background:var(--info-bg);color:var(--info)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg></div>
          <div class="stat-label">包材下单</div>
          <div class="stat-value">${packaging.length}</div>
        </div>
      </div>
      <div style="padding:0 16px 16px;flex:1;display:flex;gap:16px;min-height:0">
        <div class="card" style="flex:1;display:flex;flex-direction:column;min-width:0">
          <h3 style="font-size:var(--font-body);font-weight:600;margin-bottom:12px">最近备忘</h3>
          <div style="flex:1;overflow:auto">
            ${memos.slice(0, 8).map(m => `<div style="padding:8px 0;border-bottom:1px solid var(--divider)"><div style="font-weight:500">${App.escapeHtml(m.content)}</div><div style="font-size:var(--font-micro);color:var(--text-secondary)">${App.formatDate(m.date)} · ${App.escapeHtml(m.handler||'')} · <span class="tag tag-warning">待处理</span></div></div>`).join('') || '<div class="empty-state" style="padding:20px">暂无待处理备忘</div>'}
          </div>
        </div>
        <div class="card" style="flex:1;display:flex;flex-direction:column;min-width:0">
          <h3 style="font-size:var(--font-body);font-weight:600;margin-bottom:12px">最近采购</h3>
          <div style="flex:1;overflow:auto">
            ${purchases.slice(0, 8).map(p => `<div style="padding:8px 0;border-bottom:1px solid var(--divider)"><div style="font-weight:500">${App.escapeHtml(p.project)} - ${App.escapeHtml(p.handler)}</div><div style="font-size:var(--font-micro);color:var(--text-secondary)">${App.formatDate(p.date)} · ¥${App.formatMoney(p.total)} · <span class="tag ${p.invoice_status==='已开票'?'tag-success':'tag-default'}">${p.invoice_status}</span></div></div>`).join('') || '<div class="empty-state" style="padding:20px">暂无采购记录</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
};
