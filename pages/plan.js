/* ═══ 采购计划页 ═══ */
App.PAGE_LOADERS.plan = function(container) {
  const records = DB.getPlanRecords(0);
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>采购计划</h2>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" id="btn-plan-template">下载导入模板</button>
          <button class="btn btn-primary btn-sm" id="btn-add-plan">+ 新增</button>
        </div>
      </div>
      <div class="page-toolbar">
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="plan-search" placeholder="搜索"></div>
        <button class="btn btn-sm" id="btn-import-plan">导入Excel</button>
        <input type="file" id="plan-file" accept=".xlsx,.xls" style="display:none">
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${records.length} 条</span>
      </div>
      <div class="page-body" id="plan-table-wrap"></div>
    </div>
  `;

  function render(kw) {
    const filtered = kw ? records.filter(r => (r.material_name + r.approval_no + r.item_no).includes(kw)) : records;
    const cols = [
      { key: 'approval_no', title: '审批编号' },
      { key: 'item_seq', title: '序号' },
      { key: 'item_no', title: '物料项目号' },
      { key: 'material_name', title: '物料名称' },
      { key: 'spec', title: '规格' },
      { key: 'quantity', title: '数量', render: v => v || '' },
      { key: 'unit', title: '单位' },
      { key: 'unit_price', title: '单价', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'amount', title: '金额', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'expected_delivery', title: '预计交货', render: v => App.formatDate(v) },
      { key: 'remark', title: '备注' },
    ];
    const table = App.createTable(cols, filtered, {
      onContextMenu: (row) => [
        { label: '编辑', action: () => editPlan(row) },
        { label: '归档', action: () => { DB.archivePlanRecord(row.id); App.toast('已归档', 'success'); renderPage(); } },
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除？', () => { DB.deletePlanRecord(row.id); App.toast('已删除', 'success'); renderPage(); }) },
      ]
    });
    const wrap = document.getElementById('plan-table-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
  }

  function renderPage() {
    const fresh = DB.getPlanRecords(0);
    records.splice(0, records.length, ...fresh);
    render(document.getElementById('plan-search').value);
  }

  function editPlan(row) {
    const isNew = !row;
    const d = row || { approval_no: '', item_seq: '', item_no: '', material_name: '', spec: '', quantity: 0, unit: '', unit_price: 0, amount: 0, expected_delivery: '', remark: '' };
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">审批编号</label><input class="form-input" id="f-approval_no" value="${App.escapeHtml(d.approval_no||'')}"></div>
        <div class="form-group"><label class="form-label">序号</label><input class="form-input" id="f-item_seq" value="${App.escapeHtml(d.item_seq||'')}"></div>
        <div class="form-group"><label class="form-label">物料项目号</label><input class="form-input" id="f-item_no" value="${App.escapeHtml(d.item_no||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">物料名称 *</label><input class="form-input" id="f-material_name" value="${App.escapeHtml(d.material_name||'')}"></div>
        <div class="form-group"><label class="form-label">规格</label><input class="form-input" id="f-spec" value="${App.escapeHtml(d.spec||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">数量</label><input class="form-input" id="f-quantity" type="number" value="${d.quantity||0}"></div>
        <div class="form-group"><label class="form-label">单位</label><input class="form-input" id="f-unit" value="${App.escapeHtml(d.unit||'')}"></div>
        <div class="form-group"><label class="form-label">单价</label><input class="form-input" id="f-unit_price" type="number" step="0.01" value="${d.unit_price||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">金额</label><input class="form-input" id="f-amount" type="number" step="0.01" value="${d.amount||0}"></div>
        <div class="form-group"><label class="form-label">预计交货日期</label><input class="form-input" id="f-expected_delivery" type="date" value="${App.formatDate(d.expected_delivery)}"></div>
      </div>
      <div class="form-group"><label class="form-label">备注</label><textarea class="form-textarea" id="f-remark">${App.escapeHtml(d.remark||'')}</textarea></div>
    `;
    App.showModal(isNew ? '新增计划' : '编辑计划', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="plan-save">保存</button>`);
    document.getElementById('plan-save').addEventListener('click', () => {
      const data = {
        approval_no: val('approval_no'), item_seq: val('item_seq'), item_no: val('item_no'),
        material_name: val('material_name'), spec: val('spec'), quantity: num('quantity'), unit: val('unit'),
        unit_price: num('unit_price'), amount: num('amount'), expected_delivery: val('expected_delivery'), remark: val('remark'),
      };
      if (!data.material_name) { App.toast('物料名称必填', 'error'); return; }
      if (isNew) DB.savePlanRecord(data); else DB.updatePlanRecord(row.id, data);
      App.closeModal(); App.toast('保存成功', 'success'); renderPage();
    });
    function val(id) { return document.getElementById('f-' + id).value.trim(); }
    function num(id) { return parseFloat(document.getElementById('f-' + id).value) || 0; }
  }

  document.getElementById('btn-add-plan').addEventListener('click', () => editPlan(null));
  document.getElementById('btn-plan-template').addEventListener('click', () => {
    const ws = XLSX.utils.aoa_to_sheet([['审批编号','序号','物料项目号','物料名称','规格','单位','数量','单价','金额','预计交货日期','备注']]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, '采购计划');
    XLSX.writeFile(wb, '采购计划导入模板.xlsx');
    App.toast('模板已下载', 'success');
  });
  document.getElementById('btn-import-plan').addEventListener('click', () => document.getElementById('plan-file').click());
  document.getElementById('plan-file').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: ['approval_no','item_seq','item_no','material_name','spec','unit','quantity','unit_price','amount','expected_delivery','remark'], range: 1 });
      let count = 0;
      rows.forEach(r => { if (r.material_name) { DB.savePlanRecord(r); count++; } });
      App.toast(`导入 ${count} 条记录`, 'success'); renderPage();
    };
    reader.readAsArrayBuffer(file); e.target.value = '';
  });
  document.getElementById('plan-search').addEventListener('input', App.debounce(() => render(document.getElementById('plan-search').value)));
  render('');
};
