/* ═══ 采购垫付页 ═══ */
App.PAGE_LOADERS.purchase = function(container) {
  let rows = DB.getPurchases(0);
  const projects = DB.getProjects();

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>采购垫付</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-pur">+ 新增</button>
      </div>
      <div class="page-toolbar">
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="pur-search" placeholder="搜索"></div>
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${rows.length} 笔，合计 ¥${App.formatMoney(rows.reduce((s,r)=>s+(r.total||0),0))}</span>
      </div>
      <div class="page-body" id="pur-wrap"></div>
    </div>
  `;

  function render(kw) {
    const filtered = kw ? rows.filter(r => (r.project + r.handler + r.remark).includes(kw)) : rows;
    const cols = [
      { key: 'date', title: '日期', render: v => App.formatDate(v) },
      { key: 'project', title: '项目' },
      { key: 'handler', title: '经办人' },
      { key: 'total', title: '金额', render: v => '¥' + App.formatMoney(v) },
      { key: 'payment_method', title: '付款方式' },
      { key: 'invoice_status', title: '开票状态', render: v => `<span class="tag ${v==='已开票'?'tag-success':'tag-default'}">${v||''}</span>` },
      { key: 'reimbursement_status', title: '报销状态', render: v => `<span class="tag ${v==='已报销'?'tag-success':'tag-default'}">${v||''}</span>` },
      { key: 'items_count', title: '明细', render: (v, row) => `${(row.items||[]).length} 项` },
    ];
    const table = App.createTable(cols, filtered, {
      onContextMenu: (row) => [
        { label: '编辑', action: () => editPurchase(row) },
        { label: '查看明细', action: () => viewItems(row) },
        { label: '归档', action: () => { DB.archivePurchase(row.id); App.toast('已归档', 'success'); renderPage(); } },
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除？', () => { DB.deletePurchase(row.id); App.toast('已删除', 'success'); renderPage(); }) },
      ]
    });
    const wrap = document.getElementById('pur-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
  }

  function renderPage() { rows = DB.getPurchases(0); render(document.getElementById('pur-search').value); }

  function viewItems(row) {
    const items = row.items || [];
    const body = `<table class="data-table"><thead><tr><th>名称</th><th>规格</th><th>数量</th><th>单价</th><th>供应商</th><th>金额</th></tr></thead><tbody>${items.map(it => `<tr><td>${App.escapeHtml(it.name||'')}</td><td>${App.escapeHtml(it.spec||'')}</td><td>${it.quantity||''}</td><td>${it.unit_price?'¥'+App.formatMoney(it.unit_price):''}</td><td>${App.escapeHtml(it.supplier||'')}</td><td>${it.total?'¥'+App.formatMoney(it.total):''}</td></tr>`).join('')}</tbody></table>`;
    App.showModal('采购明细 - ' + (row.project || ''), body, `<button class="btn btn-secondary" onclick="App.closeModal()">关闭</button>`);
  }

  function editPurchase(row) {
    const isNew = !row;
    const d = row || { date: DB.today(), project: '', handler: '', payment_method: '银行转账', invoice_status: '未开票', reimbursement_status: '未报销', remark: '', items: [] };
    const items = d.items || [];
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">日期</label><input class="form-input" id="f-date" type="date" value="${App.formatDate(d.date)}"></div>
        <div class="form-group"><label class="form-label">项目</label><select class="form-select" id="f-project">${projects.map(p => `<option ${d.project===p.name?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">经办人</label><input class="form-input" id="f-handler" value="${App.escapeHtml(d.handler||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">付款方式</label><select class="form-select" id="f-payment_method"><option ${d.payment_method==='银行转账'?'selected':''}>银行转账</option><option ${d.payment_method==='微信'?'selected':''}>微信</option><option ${d.payment_method==='支付宝'?'selected':''}>支付宝</option><option ${d.payment_method==='现金'?'selected':''}>现金</option></select></div>
        <div class="form-group"><label class="form-label">开票状态</label><select class="form-select" id="f-invoice_status"><option ${d.invoice_status==='未开票'?'selected':''}>未开票</option><option ${d.invoice_status==='已开票'?'selected':''}>已开票</option></select></div>
        <div class="form-group"><label class="form-label">报销状态</label><select class="form-select" id="f-reimbursement_status"><option ${d.reimbursement_status==='未报销'?'selected':''}>未报销</option><option ${d.reimbursement_status==='已报销'?'selected':''}>已报销</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">备注</label><input class="form-input" id="f-remark" value="${App.escapeHtml(d.remark||'')}"></div>
      <div class="form-group"><label class="form-label">采购明细</label>
        <div id="items-wrap">${items.map((it, i) => itemRow(it, i)).join('')}</div>
        <button class="btn btn-sm" id="btn-add-item" style="margin-top:8px">+ 添加明细</button>
      </div>
    `;
    App.showModal(isNew ? '新增采购' : '编辑采购', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="pur-save">保存</button>`);
    document.getElementById('btn-add-item').addEventListener('click', () => {
      document.getElementById('items-wrap').insertAdjacentHTML('beforeend', itemRow({}, document.querySelectorAll('.item-row').length));
    });
    document.getElementById('pur-save').addEventListener('click', () => {
      const data = {
        date: document.getElementById('f-date').value,
        project: document.getElementById('f-project').value,
        handler: document.getElementById('f-handler').value.trim(),
        payment_method: document.getElementById('f-payment_method').value,
        invoice_status: document.getElementById('f-invoice_status').value,
        reimbursement_status: document.getElementById('f-reimbursement_status').value,
        remark: document.getElementById('f-remark').value.trim(),
      };
      const itemEls = document.querySelectorAll('.item-row');
      const newItems = [];
      itemEls.forEach(el => {
        const name = el.querySelector('.i-name').value.trim();
        if (!name) return;
        const qty = parseFloat(el.querySelector('.i-qty').value) || 0;
        const price = parseFloat(el.querySelector('.i-price').value) || 0;
        newItems.push({ name, spec: el.querySelector('.i-spec').value.trim(), quantity: qty, unit_price: price, supplier: el.querySelector('.i-sup').value.trim(), total: Math.round(qty * price * 100) / 100 });
      });
      if (isNew) DB.savePurchase(data, newItems); else DB.updatePurchase(row.id, data, newItems);
      App.closeModal(); App.toast('保存成功', 'success'); renderPage();
    });
  }

  function itemRow(it, i) {
    return `<div class="item-row form-inline" style="margin-bottom:6px;gap:4px">
      <input class="form-input i-name" placeholder="名称" value="${App.escapeHtml(it.name||'')}" style="flex:2">
      <input class="form-input i-spec" placeholder="规格" value="${App.escapeHtml(it.spec||'')}" style="flex:1">
      <input class="form-input i-qty" type="number" placeholder="数量" value="${it.quantity||''}" style="width:70px">
      <input class="form-input i-price" type="number" step="0.01" placeholder="单价" value="${it.unit_price||''}" style="width:80px">
      <input class="form-input i-sup" placeholder="供应商" value="${App.escapeHtml(it.supplier||'')}" style="flex:1">
      <button class="btn-icon" onclick="this.parentElement.remove()">✕</button>
    </div>`;
  }

  document.getElementById('btn-add-pur').addEventListener('click', () => editPurchase(null));
  document.getElementById('pur-search').addEventListener('input', App.debounce(() => render(document.getElementById('pur-search').value)));
  render('');
};
