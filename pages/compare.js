/* ═══ 三方比价页 ═══ */
App.PAGE_LOADERS.compare = function(container) {
  let rows = DB.getThirdPartyRecords();

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>三方比价</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-cmp">+ 新增</button>
      </div>
      <div class="page-toolbar">
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${rows.length} 条</span>
      </div>
      <div class="page-body" id="cmp-wrap"></div>
    </div>
  `;

  function render() {
    rows = DB.getThirdPartyRecords();
    const cols = [
      { key: 'product_name', title: '品名' },
      { key: 'item_no', title: '项目号' },
      { key: 'material_structure', title: '材质结构' },
      { key: 'spec_size', title: '规格尺寸' },
      { key: 'quantity_tier', title: '数量' },
      { key: 'supplier1', title: '供应商1' },
      { key: 'price1_tier', title: '价格1', render: v => v ? '¥' + v : '' },
      { key: 'supplier2', title: '供应商2' },
      { key: 'price2_tier', title: '价格2', render: v => v ? '¥' + v : '' },
      { key: 'supplier3', title: '供应商3' },
      { key: 'price3_tier', title: '价格3', render: v => v ? '¥' + v : '' },
      { key: 'final_supplier', title: '最终供应商', render: v => v ? `<span class="tag tag-success">${v}</span>` : '' },
      { key: 'apply_date', title: '申请日期', render: v => App.formatDate(v) },
    ];
    const table = App.createTable(cols, rows, {
      onContextMenu: (row) => [
        { label: '编辑', action: () => editRecord(row) },
        { label: '导出比价表', action: () => exportCompare(row) },
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除？', () => { DB.deleteThirdPartyRecord(row.id); App.toast('已删除', 'success'); render(); }) },
      ]
    });
    const wrap = document.getElementById('cmp-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
  }

  function editRecord(row) {
    const isNew = !row;
    const d = row || { product_name: '', item_no: '', material_structure: '', spec_size: '', quantity_tier: '', supplier1: '', supplier2: '', supplier3: '', final_supplier: '', price1_tier: '', price2_tier: '', price3_tier: '' };
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">品名 *</label><input class="form-input" id="f-product_name" value="${App.escapeHtml(d.product_name||'')}"></div>
        <div class="form-group"><label class="form-label">项目号</label><input class="form-input" id="f-item_no" value="${App.escapeHtml(d.item_no||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">材质结构</label><input class="form-input" id="f-material_structure" value="${App.escapeHtml(d.material_structure||'')}"></div>
        <div class="form-group"><label class="form-label">规格尺寸</label><input class="form-input" id="f-spec_size" value="${App.escapeHtml(d.spec_size||'')}"></div>
        <div class="form-group"><label class="form-label">数量(逗号分隔)</label><input class="form-input" id="f-quantity_tier" value="${App.escapeHtml(d.quantity_tier||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">供应商1</label><input class="form-input" id="f-supplier1" value="${App.escapeHtml(d.supplier1||'')}"></div>
        <div class="form-group"><label class="form-label">价格1(逗号分隔)</label><input class="form-input" id="f-price1_tier" value="${App.escapeHtml(d.price1_tier||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">供应商2</label><input class="form-input" id="f-supplier2" value="${App.escapeHtml(d.supplier2||'')}"></div>
        <div class="form-group"><label class="form-label">价格2(逗号分隔)</label><input class="form-input" id="f-price2_tier" value="${App.escapeHtml(d.price2_tier||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">供应商3</label><input class="form-input" id="f-supplier3" value="${App.escapeHtml(d.supplier3||'')}"></div>
        <div class="form-group"><label class="form-label">价格3(逗号分隔)</label><input class="form-input" id="f-price3_tier" value="${App.escapeHtml(d.price3_tier||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">最终做货供应商</label><input class="form-input" id="f-final_supplier" value="${App.escapeHtml(d.final_supplier||'')}"></div>
    `;
    App.showModal(isNew ? '新增比价' : '编辑比价', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="cmp-save">保存</button>`);
    document.getElementById('cmp-save').addEventListener('click', () => {
      const data = {
        product_name: document.getElementById('f-product_name').value.trim(),
        item_no: document.getElementById('f-item_no').value.trim(),
        material_structure: document.getElementById('f-material_structure').value.trim(),
        spec_size: document.getElementById('f-spec_size').value.trim(),
        quantity_tier: document.getElementById('f-quantity_tier').value.trim(),
        supplier1: document.getElementById('f-supplier1').value.trim(),
        supplier2: document.getElementById('f-supplier2').value.trim(),
        supplier3: document.getElementById('f-supplier3').value.trim(),
        final_supplier: document.getElementById('f-final_supplier').value.trim(),
        price1_tier: document.getElementById('f-price1_tier').value.trim(),
        price2_tier: document.getElementById('f-price2_tier').value.trim(),
        price3_tier: document.getElementById('f-price3_tier').value.trim(),
      };
      if (!data.product_name) { App.toast('品名必填', 'error'); return; }
      if (isNew) DB.saveThirdPartyRecord(data); else DB.updateThirdPartyRecord(row.id, data);
      App.closeModal(); App.toast('保存成功', 'success'); render();
    });
  }

  function exportCompare(row) {
    const config = DB.getQuotationConfig();
    const qtys = (row.quantity_tier||'').split(',').filter(x=>x);
    const p1 = (row.price1_tier||'').split(',');
    const p2 = (row.price2_tier||'').split(',');
    const p3 = (row.price3_tier||'').split(',');
    const maxR = Math.max(qtys.length, 1);
    let dataRows = '';
    for (let i = 0; i < maxR; i++) {
      dataRows += `<tr><td style="border:1px solid #333;padding:6px;text-align:center">${i+1}</td>
      ${i===0?`<td style="border:1px solid #333;padding:6px" rowspan="${maxR}">${App.escapeHtml(row.product_name||'')}</td><td style="border:1px solid #333;padding:6px" rowspan="${maxR}">${App.escapeHtml(row.item_no||'')}</td><td style="border:1px solid #333;padding:6px" rowspan="${maxR}">${App.escapeHtml(row.material_structure||'')}</td><td style="border:1px solid #333;padding:6px" rowspan="${maxR}">${App.escapeHtml(row.spec_size||'')}</td>`:''}
      <td style="border:1px solid #333;padding:6px;text-align:center">${qtys[i]||''}</td>
      <td style="border:1px solid #333;padding:6px;text-align:center">${p1[i]||''}</td>
      <td style="border:1px solid #333;padding:6px;text-align:center">${p2[i]||''}</td>
      <td style="border:1px solid #333;padding:6px;text-align:center">${p3[i]||''}</td></tr>`;
    }
    const finalHTML = `
      <div style="font-family:sans-serif;padding:30px;max-width:900px;margin:0 auto">
        <h1 style="text-align:center;font-size:20px;margin-bottom:4px">${App.escapeHtml(config.buyer_name||'')}</h1>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>地址：${App.escapeHtml(config.buyer_address||'')}</span><span>申请时间：${DB.today()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:16px"><span>电话：${App.escapeHtml(config.buyer_phone||'')}</span><span>负责人：王维</span></div>
        <h2 style="text-align:center;font-size:18px;margin-bottom:12px">比 价 表</h2>
        <table style="width:100%;border-collapse:collapse;border:1.5px solid #333">
          <thead><tr style="background:#f0f0f0;font-size:13px">
            <th style="border:1px solid #333;padding:6px">序号</th><th style="border:1px solid #333;padding:6px">品名</th>
            <th style="border:1px solid #333;padding:6px">项目号</th><th style="border:1px solid #333;padding:6px">材质结构</th>
            <th style="border:1px solid #333;padding:6px">规格尺寸</th><th style="border:1px solid #333;padding:6px">数量(PCS)</th>
            <th style="border:1px solid #333;padding:6px">${App.escapeHtml(row.supplier1||'供应商1')}（¥）</th>
            <th style="border:1px solid #333;padding:6px">${App.escapeHtml(row.supplier2||'供应商2')}（¥）</th>
            <th style="border:1px solid #333;padding:6px">${App.escapeHtml(row.supplier3||'供应商3')}（¥）</th>
          </tr></thead>
          <tbody>${dataRows}</tbody>
        </table>
        <div style="margin-top:20px;font-size:13px"><strong>最终做货供应商：</strong>${App.escapeHtml(row.final_supplier||'')}</div>
        <div style="margin-top:40px;display:flex;justify-content:space-around;font-size:13px"><div>部门主管签字：____________</div><div>采购复核签字：____________</div></div>
      </div>
    `;
    App.printHTML(finalHTML);
  }

  document.getElementById('btn-add-cmp').addEventListener('click', () => editRecord(null));
  render();
};
