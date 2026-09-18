/* ═══ 物料台账页 ═══ */
App.PAGE_LOADERS.query = function(container) {
  let filters = { year: '', supplier: '', material_name: '', item_no: '' };

  container.innerHTML = `
    <div class="page">
      <div class="page-header"><h2>物料台账</h2></div>
      <div class="page-toolbar">
        <input class="form-input" id="q-year" placeholder="年份" style="width:80px" value="${filters.year}">
        <input class="form-input" id="q-supplier" placeholder="供应商" style="width:140px">
        <input class="form-input" id="q-material" placeholder="物料名称" style="width:140px">
        <input class="form-input" id="q-itemno" placeholder="项目号" style="width:120px">
        <button class="btn btn-sm btn-primary" id="btn-query">查询</button>
        <button class="btn btn-sm" id="btn-clear-ledger">清空台账</button>
        <button class="btn btn-sm" id="btn-import-ledger">导入Excel</button>
        <input type="file" id="ledger-file" accept=".xlsx,.xls" style="display:none">
      </div>
      <div class="page-body" id="ledger-wrap" style="padding:0"></div>
    </div>
  `;

  function render() {
    const rows = DB.getMaterialLedger(filters);
    const cols = [
      { key: 'contract_no', title: '合同编号' },
      { key: 'supplier', title: '供应商' },
      { key: 'item_no', title: '项目号' },
      { key: 'material_name', title: '物料名称' },
      { key: 'quantity', title: '数量', render: v => v || '' },
      { key: 'unit', title: '单位' },
      { key: 'unit_price', title: '单价', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'amount', title: '金额', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'year', title: '年份' },
    ];
    const table = App.createTable(cols, rows, { emptyText: '暂无台账数据' });
    const wrap = document.getElementById('ledger-wrap');
    wrap.innerHTML = '';
    const stats = document.createElement('div');
    stats.style.padding = '8px 16px'; stats.style.fontSize = 'var(--font-micro)'; stats.style.color = 'var(--text-secondary)';
    const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
    stats.textContent = `共 ${rows.length} 条，合计金额 ¥${App.formatMoney(total)}`;
    wrap.appendChild(stats); wrap.appendChild(table);
  }

  document.getElementById('btn-query').addEventListener('click', () => {
    filters.year = document.getElementById('q-year').value.trim();
    filters.supplier = document.getElementById('q-supplier').value.trim();
    filters.material_name = document.getElementById('q-material').value.trim();
    filters.item_no = document.getElementById('q-itemno').value.trim();
    render();
  });
  document.getElementById('btn-clear-ledger').addEventListener('click', () => {
    App.showConfirm('确认清空全部台账数据？此操作不可恢复！', () => { DB.clearMaterialLedger(); App.toast('已清空', 'success'); render(); });
  });
  document.getElementById('btn-import-ledger').addEventListener('click', () => document.getElementById('ledger-file').click());
  document.getElementById('ledger-file').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const mapped = rows.map(r => ({
        contract_no: r['合同编号'] || r['contract_no'] || '',
        supplier: r['供应商'] || r['supplier'] || '',
        item_no: r['项目号'] || r['item_no'] || '',
        material_name: r['物料名称'] || r['material_name'] || '',
        quantity: parseFloat(r['数量'] || r['quantity'] || 0),
        unit: r['单位'] || r['unit'] || '',
        unit_price: parseFloat(r['单价'] || r['unit_price'] || 0),
        amount: parseFloat(r['金额'] || r['amount'] || 0),
        year: r['年份'] || r['year'] || String(new Date().getFullYear()),
        raw_data: JSON.stringify(r),
      }));
      DB.saveMaterialLedger(mapped);
      App.toast(`导入 ${mapped.length} 条`, 'success'); render();
    };
    reader.readAsArrayBuffer(file); e.target.value = '';
  });
  render();
};
