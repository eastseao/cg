/* ═══ 库存管理页 ═══ */
App.PAGE_LOADERS.inventory = function(container) {
  let activeWh = 'total';
  const WH_NAMES = { total: '全部仓库', wh1: '1号库', wh5: '5号库', pkg: '包材库', raw: '原料库' };

  container.innerHTML = `
    <div class="page">
      <div class="page-header"><h2>库存管理</h2></div>
      <div class="page-toolbar">
        <select class="form-select" id="inv-wh" style="width:120px">
          <option value="total">全部仓库</option><option value="wh1">1号库</option><option value="wh5">5号库</option><option value="pkg">包材库</option><option value="raw">原料库</option>
        </select>
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="inv-search" placeholder="搜索"></div>
        <button class="btn btn-sm" id="btn-import-inv">导入Excel</button>
        <input type="file" id="inv-file" accept=".xlsx,.xls" style="display:none">
        <button class="btn btn-sm" id="btn-clear-inv">清空</button>
      </div>
      <div id="inv-stats" style="padding:8px 16px;display:flex;gap:16px;flex-wrap:wrap"></div>
      <div class="page-body" id="inv-wrap"></div>
    </div>
  `;

  function renderStats() {
    const stats = DB.getInventoryStats(activeWh);
    const el = document.getElementById('inv-stats');
    el.innerHTML = `
      <div class="stat-mini"><span class="stat-mini-label">总品种</span><span class="stat-mini-value">${stats.rowCount || 0}</span></div>
      <div class="stat-mini"><span class="stat-mini-label">总数量</span><span class="stat-mini-value">${App.formatMoney(stats.totalQty || 0)}</span></div>
      <div class="stat-mini"><span class="stat-mini-label">总金额</span><span class="stat-mini-value">¥${App.formatMoney(stats.totalAmount || 0)}</span></div>
      ${activeWh === 'total' ? (stats.byWarehouse||[]).map(w => `<div class="stat-mini"><span class="stat-mini-label">${w.name}</span><span class="stat-mini-value">${w.rowCount}种 / ¥${App.formatMoney(w.totalAmount)}</span></div>`).join('') : ''}
    `;
  }

  function render() {
    const kw = document.getElementById('inv-search').value;
    const rows = DB.queryInventory({ warehouse: activeWh, keyword: kw });
    const cols = [
      { key: 'warehouse', title: '仓库', render: v => WH_NAMES[v] || v },
      { key: 'item_no', title: '项目号' },
      { key: 'material_name', title: '物料名称' },
      { key: 'spec', title: '规格' },
      { key: 'unit', title: '单位' },
      { key: 'batch', title: '批次' },
      { key: 'quantity', title: '数量', render: v => v || '' },
      { key: 'unit_price', title: '单价', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'amount', title: '金额', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'location', title: '库位' },
      { key: 'remark', title: '备注' },
    ];
    const table = App.createTable(cols, rows, { emptyText: '暂无库存数据' });
    const wrap = document.getElementById('inv-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
    renderStats();
  }

  document.getElementById('inv-wh').addEventListener('change', (e) => { activeWh = e.target.value; render(); });
  document.getElementById('inv-search').addEventListener('input', App.debounce(render));
  document.getElementById('btn-import-inv').addEventListener('click', () => document.getElementById('inv-file').click());
  document.getElementById('btn-clear-inv').addEventListener('click', () => {
    App.showConfirm(`确认清空${activeWh === 'total' ? '全部' : WH_NAMES[activeWh]}库存数据？`, () => { DB.clearInventory(activeWh); App.toast('已清空', 'success'); render(); });
  });
  document.getElementById('inv-file').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const wh = activeWh === 'total' ? 'wh1' : activeWh;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const mapped = rows.map(r => ({
        warehouse: wh,
        item_no: r['项目号'] || r['item_no'] || '',
        material_name: r['物料名称'] || r['material_name'] || '',
        spec: r['规格'] || r['spec'] || '',
        unit: r['单位'] || r['unit'] || '',
        batch: r['批次'] || r['batch'] || '',
        quantity: parseFloat(r['数量'] || r['quantity'] || 0),
        location: r['库位'] || r['location'] || '',
        unit_price: parseFloat(r['单价'] || r['unit_price'] || 0),
        amount: parseFloat(r['金额'] || r['amount'] || 0),
        remark: r['备注'] || r['remark'] || '',
      }));
      DB.importInventory(mapped);
      App.toast(`导入 ${mapped.length} 条到 ${WH_NAMES[wh]}`, 'success'); render();
    };
    reader.readAsArrayBuffer(file); e.target.value = '';
  });
  render();
};
