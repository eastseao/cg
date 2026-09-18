/* ═══ 成品BOM页 ═══ */
App.PAGE_LOADERS.product_bom = function(container) {
  let rows = DB.getProductBOM();

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>成品BOM</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-bom">+ 新增</button>
      </div>
      <div class="page-toolbar">
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="bom-search" placeholder="搜索"></div>
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${rows.length} 条</span>
      </div>
      <div class="page-body" id="bom-wrap"></div>
    </div>
  `;

  function render(kw) {
    const filtered = kw ? rows.filter(r => (r.product_name + r.material_name + r.finished_project_no + r.material_project_no).toLowerCase().includes(kw.toLowerCase())) : rows;
    const cols = [
      { key: 'finished_project_no', title: '成品项目号' },
      { key: 'product_name', title: '产品名称' },
      { key: 'spec', title: '规格' },
      { key: 'retail_price', title: '零售价', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'brand', title: '品牌' },
      { key: 'material_project_no', title: '材料项目号' },
      { key: 'material_name', title: '材料名称' },
      { key: 'quantity', title: '数量' },
      { key: 'unit', title: '单位' },
    ];
    const table = App.createTable(cols, filtered, {
      onContextMenu: (row) => [
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除？', () => { DB.deleteProductBOM(row.id); App.toast('已删除', 'success'); renderPage(); }) },
      ]
    });
    const wrap = document.getElementById('bom-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
  }

  function renderPage() { rows = DB.getProductBOM(); render(document.getElementById('bom-search').value); }

  document.getElementById('btn-add-bom').addEventListener('click', () => {
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">成品项目号 *</label><input class="form-input" id="f-fpno"></div>
        <div class="form-group"><label class="form-label">产品名称</label><input class="form-input" id="f-pname"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">规格</label><input class="form-input" id="f-spec"></div>
        <div class="form-group"><label class="form-label">零售价</label><input class="form-input" id="f-price" type="number" step="0.01"></div>
        <div class="form-group"><label class="form-label">品牌</label><input class="form-input" id="f-brand"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">材料项目号 *</label><input class="form-input" id="f-mpno"></div>
        <div class="form-group"><label class="form-label">材料名称</label><input class="form-input" id="f-mname"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">数量</label><input class="form-input" id="f-qty" type="number" value="1"></div>
        <div class="form-group"><label class="form-label">单位</label><input class="form-input" id="f-unit" value="PCS"></div>
      </div>
    `;
    App.showModal('新增BOM', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="bom-save">保存</button>`);
    document.getElementById('bom-save').addEventListener('click', () => {
      const data = {
        finished_project_no: document.getElementById('f-fpno').value.trim(),
        product_name: document.getElementById('f-pname').value.trim(),
        spec: document.getElementById('f-spec').value.trim(),
        retail_price: parseFloat(document.getElementById('f-price').value) || 0,
        brand: document.getElementById('f-brand').value.trim(),
        material_project_no: document.getElementById('f-mpno').value.trim(),
        material_name: document.getElementById('f-mname').value.trim(),
        quantity: parseFloat(document.getElementById('f-qty').value) || 0,
        unit: document.getElementById('f-unit').value.trim() || 'PCS',
      };
      if (!data.finished_project_no || !data.material_project_no) { App.toast('成品和材料项目号必填', 'error'); return; }
      DB.saveProductBOMBatch([data]); App.closeModal(); App.toast('保存成功', 'success'); renderPage();
    });
  });

  document.getElementById('bom-search').addEventListener('input', App.debounce(() => render(document.getElementById('bom-search').value)));
  render('');
};
