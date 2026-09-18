/* ═══ 包材下单页 ═══ */
App.PAGE_LOADERS.packaging = function(container) {
  const orders = DB.getPackagingOrders({ archived: 0 });
  const projects = DB.getProjects();
  const suppliers = DB.getContractSuppliers().map(s => s.short_name || s.full_name);

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>包材下单</h2>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" id="btn-add-pkg">+ 新增下单</button>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="pkg-search" placeholder="搜索物料/厂家/项目号"></div>
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${orders.length} 条</span>
      </div>
      <div class="page-body" id="pkg-table-wrap"></div>
    </div>
  `;

  function render(keyword) {
    const filtered = keyword ? orders.filter(o => (o.material_name + o.order_factory + o.project_no).includes(keyword)) : orders;
    const cols = [
      { key: 'material_name', title: '物料名称' },
      { key: 'project', title: '项目' },
      { key: 'project_no', title: '项目号' },
      { key: 'order_factory', title: '下单厂家' },
      { key: 'compare_price', title: '核价', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'compare_date', title: '核价日期', render: v => App.formatDate(v) },
      { key: 'contract_status', title: '合同状态', render: v => `<span class="tag ${v==='已签订'?'tag-success':v==='待签订'?'tag-warning':'tag-default'}">${v||''}</span>` },
      { key: 'notify_date', title: '通知发货', render: v => App.formatDate(v) },
      { key: 'ship_date', title: '发货日期', render: v => App.formatDate(v) },
      { key: 'ship_method', title: '物流方式' },
      { key: 'tracking_no', title: '物流单号' },
      { key: 'amount', title: '金额', render: v => v ? '¥' + App.formatMoney(v) : '' },
    ];
    const table = App.createTable(cols, filtered, {
      onContextMenu: (row) => [
        { label: '编辑', action: () => editOrder(row) },
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除此记录？', () => { DB.deletePackagingOrder(row.id); App.toast('已删除', 'success'); renderPage(); }) },
      ]
    });
    document.getElementById('pkg-table-wrap').innerHTML = '';
    document.getElementById('pkg-table-wrap').appendChild(table);
  }

  function renderPage() {
    const kw = document.getElementById('pkg-search').value;
    const fresh = DB.getPackagingOrders({ archived: 0 });
    orders.splice(0, orders.length, ...fresh);
    render(kw);
  }

  function editOrder(row) {
    const isNew = !row;
    const d = row || { material_name: '', project: '', project_no: '', order_factory: '', compare_price: 0, compare_date: '', contract_status: '待签订', notify_date: '', ship_date: '', ship_method: '', tracking_no: '', amount: 0 };
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">物料名称 *</label><input class="form-input" id="f-material_name" value="${App.escapeHtml(d.material_name)}"></div>
        <div class="form-group"><label class="form-label">项目</label><select class="form-select" id="f-project">${projects.map(p => `<option ${d.project===p.name?'selected':''}>${p.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">项目号</label><input class="form-input" id="f-project_no" value="${App.escapeHtml(d.project_no||'')}"></div>
        <div class="form-group"><label class="form-label">下单厂家</label><input class="form-input" id="f-order_factory" list="supplier-list" value="${App.escapeHtml(d.order_factory||'')}"><datalist id="supplier-list">${suppliers.map(s=>`<option>${s}</option>`).join('')}</datalist></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">核价</label><input class="form-input" id="f-compare_price" type="number" step="0.01" value="${d.compare_price||0}"></div>
        <div class="form-group"><label class="form-label">核价日期</label><input class="form-input" id="f-compare_date" type="date" value="${App.formatDate(d.compare_date)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">合同状态</label><select class="form-select" id="f-contract_status"><option ${d.contract_status==='待签订'?'selected':''}>待签订</option><option ${d.contract_status==='已签订'?'selected':''}>已签订</option></select></div>
        <div class="form-group"><label class="form-label">通知发货日期</label><input class="form-input" id="f-notify_date" type="date" value="${App.formatDate(d.notify_date)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">发货日期</label><input class="form-input" id="f-ship_date" type="date" value="${App.formatDate(d.ship_date)}"></div>
        <div class="form-group"><label class="form-label">物流方式</label><input class="form-input" id="f-ship_method" value="${App.escapeHtml(d.ship_method||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">物流单号</label><input class="form-input" id="f-tracking_no" value="${App.escapeHtml(d.tracking_no||'')}"></div>
        <div class="form-group"><label class="form-label">金额</label><input class="form-input" id="f-amount" type="number" step="0.01" value="${d.amount||0}"></div>
      </div>
    `;
    App.showModal(isNew ? '新增下单' : '编辑下单', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="pkg-save">保存</button>`);
    document.getElementById('pkg-save').addEventListener('click', () => {
      const data = {
        material_name: document.getElementById('f-material_name').value.trim(),
        project: document.getElementById('f-project').value,
        project_no: document.getElementById('f-project_no').value.trim(),
        order_factory: document.getElementById('f-order_factory').value.trim(),
        compare_price: parseFloat(document.getElementById('f-compare_price').value) || 0,
        compare_date: document.getElementById('f-compare_date').value,
        contract_status: document.getElementById('f-contract_status').value,
        notify_date: document.getElementById('f-notify_date').value,
        ship_date: document.getElementById('f-ship_date').value,
        ship_method: document.getElementById('f-ship_method').value.trim(),
        tracking_no: document.getElementById('f-tracking_no').value.trim(),
        amount: parseFloat(document.getElementById('f-amount').value) || 0,
      };
      if (!data.material_name) { App.toast('物料名称必填', 'error'); return; }
      if (isNew) DB.savePackagingOrder(data); else DB.updatePackagingOrder(row.id, data);
      App.closeModal(); App.toast('保存成功', 'success'); renderPage();
    });
  }

  document.getElementById('btn-add-pkg').addEventListener('click', () => editOrder(null));
  document.getElementById('pkg-search').addEventListener('input', App.debounce(() => render(document.getElementById('pkg-search').value)));
  render('');
};
