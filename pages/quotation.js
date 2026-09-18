/* ═══ 报价管理页 ═══ */
App.PAGE_LOADERS.quotation = function(container) {
  let products = DB.getQuotationProducts();
  let config = DB.getQuotationConfig();
  let suppliers = DB.getAllQuotationSuppliers();
  let activeTab = 'products';

  container.innerHTML = `
    <div class="page">
      <div class="page-header"><h2>报价管理</h2></div>
      <div class="page-toolbar">
        <button class="btn btn-sm ${activeTab==='products'?'btn-primary':''}" data-tab="products" id="tab-products">产品管理</button>
        <button class="btn btn-sm ${activeTab==='config'?'btn-primary':''}" data-tab="config" id="tab-config">需方配置</button>
        <button class="btn btn-sm ${activeTab==='suppliers'?'btn-primary':''}" data-tab="suppliers" id="tab-suppliers">供方管理</button>
      </div>
      <div class="page-body" id="qcontent" style="padding:16px;overflow:auto"></div>
    </div>
  `;

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('btn-primary', b.dataset.tab === tab));
    render();
  }

  function render() {
    const c = document.getElementById('qcontent');
    if (activeTab === 'products') renderProducts(c);
    else if (activeTab === 'config') renderConfig(c);
    else if (activeTab === 'suppliers') renderSuppliers(c);
  }

  function renderProducts(c) {
    products = DB.getQuotationProducts();
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="q-search" placeholder="搜索产品" style="width:180px"></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" id="btn-export-quotation">导出报价单</button>
          <button class="btn btn-primary btn-sm" id="btn-add-qp">+ 新增产品</button>
        </div>
      </div>
      <table class="data-table">
        <thead><tr><th>项目号</th><th>产品名称</th><th>产品尺寸</th><th>材质工艺</th><th>供货周期</th><th>箱规</th><th>单位</th><th>阶梯价格</th><th>操作</th></tr></thead>
        <tbody id="qp-tbody"></tbody>
      </table>
    `;
    renderProductRows();
    document.getElementById('btn-add-qp').addEventListener('click', () => editProduct(null));
    document.getElementById('q-search').addEventListener('input', App.debounce(() => renderProductRows()));
    document.getElementById('btn-export-quotation').addEventListener('click', exportQuotation);
  }

  function renderProductRows() {
    const kw = (document.getElementById('q-search')?.value || '').toLowerCase();
    const filtered = kw ? products.filter(p => (p.product_name + p.item_no + p.product_size).toLowerCase().includes(kw)) : products;
    const tb = document.getElementById('qp-tbody');
    tb.innerHTML = filtered.map(p => `
      <tr>
        <td>${App.escapeHtml(p.item_no||'')}</td>
        <td>${App.escapeHtml(p.product_name||'')}</td>
        <td>${App.escapeHtml(p.product_size||'')}</td>
        <td>${App.escapeHtml(p.material_process||'')}</td>
        <td>${App.escapeHtml(p.supply_cycle||'')}</td>
        <td>${App.escapeHtml(p.carton_spec||'')}</td>
        <td>${App.escapeHtml(p.unit||'')}</td>
        <td>${(p.tiers||[]).map(t => `${App.escapeHtml(t.tier_name)}: ${t.min_qty}${t.max_qty?'-'+t.max_qty:'≥'} @¥${t.unit_price}`).join('<br>')}</td>
        <td><button class="btn-icon" onclick="App._editQP(${p.id})">✎</button> <button class="btn-icon" onclick="App._delQP(${p.id})">🗑</button></td>
      </tr>
    `).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--text-tertiary);padding:40px">暂无产品</td></tr>';
  }

  App._editQP = (id) => {
    const p = products.find(x => x.id === id);
    editProduct(p);
  };
  App._delQP = (id) => {
    App.showConfirm('确认删除此产品及其价格阶梯？', () => { DB.deleteQuotationProduct(id); App.toast('已删除', 'success'); render(); });
  };

  function editProduct(p) {
    const isNew = !p;
    const d = p || { item_no: '', product_name: '', product_size: '', material_process: '', supply_cycle: '', carton_spec: '', unit: 'PCS', tiers: [] };
    const tiers = d.tiers || [];
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">项目号</label><input class="form-input" id="f-item_no" value="${App.escapeHtml(d.item_no||'')}"></div>
        <div class="form-group"><label class="form-label">产品名称 *</label><input class="form-input" id="f-product_name" value="${App.escapeHtml(d.product_name||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">产品尺寸</label><input class="form-input" id="f-product_size" value="${App.escapeHtml(d.product_size||'')}"></div>
        <div class="form-group"><label class="form-label">材质工艺</label><input class="form-input" id="f-material_process" value="${App.escapeHtml(d.material_process||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">供货周期</label><input class="form-input" id="f-supply_cycle" value="${App.escapeHtml(d.supply_cycle||'')}"></div>
        <div class="form-group"><label class="form-label">箱规</label><input class="form-input" id="f-carton_spec" value="${App.escapeHtml(d.carton_spec||'')}"></div>
        <div class="form-group"><label class="form-label">单位</label><input class="form-input" id="f-unit" value="${App.escapeHtml(d.unit||'PCS')}"></div>
      </div>
      <div class="form-group"><label class="form-label">价格阶梯</label>
        <div id="tiers-wrap">${tiers.map((t,i) => tierRow(t,i)).join('')}</div>
        <button class="btn btn-sm" id="btn-add-tier" style="margin-top:8px">+ 添加阶梯</button>
      </div>
    `;
    App.showModal(isNew ? '新增产品' : '编辑产品', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="qp-save">保存</button>`);
    document.getElementById('btn-add-tier').addEventListener('click', () => {
      const wrap = document.getElementById('tiers-wrap');
      wrap.insertAdjacentHTML('beforeend', tierRow({}, wrap.children.length));
    });
    document.getElementById('qp-save').addEventListener('click', () => {
      const data = {
        item_no: document.getElementById('f-item_no').value.trim(),
        product_name: document.getElementById('f-product_name').value.trim(),
        product_size: document.getElementById('f-product_size').value.trim(),
        material_process: document.getElementById('f-material_process').value.trim(),
        supply_cycle: document.getElementById('f-supply_cycle').value.trim(),
        carton_spec: document.getElementById('f-carton_spec').value.trim(),
        unit: document.getElementById('f-unit').value.trim() || 'PCS',
      };
      if (!data.product_name) { App.toast('产品名称必填', 'error'); return; }
      const tierEls = document.querySelectorAll('.tier-row');
      const newTiers = [];
      tierEls.forEach(el => {
        newTiers.push({
          tier_name: el.querySelector('.t-name').value.trim(),
          min_qty: parseInt(el.querySelector('.t-min').value) || 0,
          max_qty: el.querySelector('.t-max').value ? parseInt(el.querySelector('.t-max').value) : null,
          unit_price: parseFloat(el.querySelector('.t-price').value) || 0,
        });
      });
      if (isNew) {
        const pid = DB.saveQuotationProduct(data);
        newTiers.forEach(t => { t.product_id = pid; DB.saveQuotationTier(t); });
      } else {
        DB.updateQuotationProduct(d.id, data);
        DB.deleteQuotationTiers(d.id);
        newTiers.forEach(t => { t.product_id = d.id; DB.saveQuotationTier(t); });
      }
      App.closeModal(); App.toast('保存成功', 'success'); render();
    });
  }

  function tierRow(t, i) {
    return `<div class="tier-row form-inline" style="margin-bottom:6px">
      <input class="form-input t-name" placeholder="阶梯名" value="${App.escapeHtml(t.tier_name||'')}" style="width:100px">
      <input class="form-input t-min" type="number" placeholder="起" value="${t.min_qty||0}" style="width:80px">
      <input class="form-input t-max" type="number" placeholder="止" value="${t.max_qty||''}" style="width:80px">
      <input class="form-input t-price" type="number" step="0.01" placeholder="单价" value="${t.unit_price||0}" style="width:100px">
      <button class="btn-icon" onclick="this.parentElement.remove()">✕</button>
    </div>`;
  }

  function exportQuotation() {
    if (products.length === 0) { App.toast('暂无产品可导出', 'warning'); return; }
    config = DB.getQuotationConfig();
    let html = `
      <div style="font-family:sans-serif;padding:30px;max-width:900px;margin:0 auto">
        <h1 style="text-align:center;font-size:22px;margin-bottom:20px">报价单</h1>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="width:50%;vertical-align:top;padding:4px 12px">
            <div style="font-weight:600;margin-bottom:8px">需方信息</div>
            <div>企业名称：${App.escapeHtml(config.buyer_name||'')}</div>
            <div>联系人：${App.escapeHtml(config.buyer_contact||'')}</div>
            <div>手机：${App.escapeHtml(config.buyer_phone||'')}</div>
            <div>送货地址：${App.escapeHtml(config.buyer_address||'')}</div>
          </td><td style="width:50%;vertical-align:top;padding:4px 12px">
            <div style="font-weight:600;margin-bottom:8px">供方信息</div>
            <div>供应商名称：_______________</div>
            <div>联系人：_______________</div>
            <div>联系方式：_______________</div>
            <div>地址：_______________</div>
            <div>报价日期：${DB.today()}</div>
            <div>报价有效期：180天</div>
          </td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;border:1px solid #333">
          <thead><tr style="background:#f0f0f0">
            <th style="border:1px solid #333;padding:6px">序号</th>
            <th style="border:1px solid #333;padding:6px">产品名称</th>
            <th style="border:1px solid #333;padding:6px">项目号</th>
            <th style="border:1px solid #333;padding:6px">产品尺寸</th>
            <th style="border:1px solid #333;padding:6px">材质工艺</th>
            <th style="border:1px solid #333;padding:6px">供货周期</th>
            <th style="border:1px solid #333;padding:6px">数量</th>
            <th style="border:1px solid #333;padding:6px">单价(¥)</th>
          </tr></thead>
          <tbody>
            ${products.map((p, idx) => {
              const tiers = p.tiers || [];
              const tierCount = tiers.length || 1;
              let rows = '';
              tiers.forEach((t, ti) => {
                rows += `<tr>
                  ${ti === 0 ? `<td rowspan="${tierCount}" style="border:1px solid #333;padding:6px;text-align:center">${idx+1}</td><td rowspan="${tierCount}" style="border:1px solid #333;padding:6px">${App.escapeHtml(p.product_name||'')}</td><td rowspan="${tierCount}" style="border:1px solid #333;padding:6px">${App.escapeHtml(p.item_no||'')}</td><td rowspan="${tierCount}" style="border:1px solid #333;padding:6px">${App.escapeHtml(p.product_size||'')}</td><td rowspan="${tierCount}" style="border:1px solid #333;padding:6px">${App.escapeHtml(p.material_process||'')}</td><td rowspan="${tierCount}" style="border:1px solid #333;padding:6px">${App.escapeHtml(p.supply_cycle||'')}</td>` : ''}
                  <td style="border:1px solid #333;padding:6px;text-align:center">${t.min_qty}${t.max_qty?'-'+t.max_qty:'≥'}</td>
                  <td style="border:1px solid #333;padding:6px;text-align:center">${t.unit_price||''}</td>
                </tr>`;
              });
              return rows;
            }).join('')}
          </tbody>
        </table>
        <div style="margin-top:20px;font-size:13px">
          <div><strong>付款方式：</strong>${App.escapeHtml(config.payment_terms||'')}</div>
          <div><strong>运输方式：</strong>${App.escapeHtml(config.transport_method||'')}</div>
          <div><strong>发货文件：</strong>${App.escapeHtml(config.delivery_docs||'')}</div>
          <div><strong>报价要求：</strong>${App.escapeHtml(config.quote_requirement||'')}</div>
          <div style="margin-top:12px;color:#666;font-size:12px">${App.escapeHtml(config.footer_note||'')}</div>
        </div>
      </div>
    `;
    App.printHTML(html);
  }

  function renderConfig(c) {
    config = DB.getQuotationConfig();
    c.innerHTML = `
      <div style="max-width:600px">
        <h3 style="margin-bottom:16px">需方信息配置</h3>
        <div class="form-group"><label class="form-label">企业名称</label><input class="form-input" id="c-buyer_name" value="${App.escapeHtml(config.buyer_name||'')}"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">联系人</label><input class="form-input" id="c-buyer_contact" value="${App.escapeHtml(config.buyer_contact||'')}"></div>
          <div class="form-group"><label class="form-label">手机</label><input class="form-input" id="c-buyer_phone" value="${App.escapeHtml(config.buyer_phone||'')}"></div>
        </div>
        <div class="form-group"><label class="form-label">送货地址</label><input class="form-input" id="c-buyer_address" value="${App.escapeHtml(config.buyer_address||'')}"></div>
        <div class="form-group"><label class="form-label">付款方式</label><input class="form-input" id="c-payment_terms" value="${App.escapeHtml(config.payment_terms||'')}"></div>
        <div class="form-group"><label class="form-label">运输方式</label><input class="form-input" id="c-transport_method" value="${App.escapeHtml(config.transport_method||'')}"></div>
        <div class="form-group"><label class="form-label">发货文件</label><input class="form-input" id="c-delivery_docs" value="${App.escapeHtml(config.delivery_docs||'')}"></div>
        <div class="form-group"><label class="form-label">报价要求</label><input class="form-input" id="c-quote_requirement" value="${App.escapeHtml(config.quote_requirement||'')}"></div>
        <div class="form-group"><label class="form-label">页脚备注</label><textarea class="form-textarea" id="c-footer_note">${App.escapeHtml(config.footer_note||'')}</textarea></div>
        <button class="btn btn-primary" id="btn-save-config">保存配置</button>
      </div>
    `;
    document.getElementById('btn-save-config').addEventListener('click', () => {
      const d = {
        buyer_name: document.getElementById('c-buyer_name').value,
        buyer_contact: document.getElementById('c-buyer_contact').value,
        buyer_phone: document.getElementById('c-buyer_phone').value,
        buyer_address: document.getElementById('c-buyer_address').value,
        payment_terms: document.getElementById('c-payment_terms').value,
        transport_method: document.getElementById('c-transport_method').value,
        delivery_docs: document.getElementById('c-delivery_docs').value,
        quote_requirement: document.getElementById('c-quote_requirement').value,
        footer_note: document.getElementById('c-footer_note').value,
      };
      DB.updateQuotationConfig(d); App.toast('配置已保存', 'success');
    });
  }

  function renderSuppliers(c) {
    suppliers = DB.getAllQuotationSuppliers();
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:var(--font-body);color:var(--text-secondary)">共 ${suppliers.length} 家供方</span>
        <button class="btn btn-primary btn-sm" id="btn-add-qs">+ 新增供方</button>
      </div>
      <table class="data-table">
        <thead><tr><th>供应商名称</th><th>联系人</th><th>电话</th><th>地址</th><th>报价日期</th><th>报价有效期</th><th>操作</th></tr></thead>
        <tbody>
          ${suppliers.map(s => `<tr>
            <td>${App.escapeHtml(s.supplier_name||'')}</td><td>${App.escapeHtml(s.contact_person||'')}</td><td>${App.escapeHtml(s.phone||'')}</td>
            <td>${App.escapeHtml(s.address||'')}</td><td>${App.formatDate(s.quote_date)}</td><td>${App.escapeHtml(s.quote_validity||'')}</td>
            <td><button class="btn-icon" onclick="App._delQS(${s.id})">🗑</button></td>
          </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-tertiary)">暂无供方</td></tr>'}
        </tbody>
      </table>
    `;
    document.getElementById('btn-add-qs').addEventListener('click', () => {
      const body = `<div class="form-group"><label class="form-label">供应商名称 *</label><input class="form-input" id="qs-name"></div>
        <div class="form-row"><div class="form-group"><label class="form-label">联系人</label><input class="form-input" id="qs-contact"></div><div class="form-group"><label class="form-label">电话</label><input class="form-input" id="qs-phone"></div></div>
        <div class="form-group"><label class="form-label">地址</label><input class="form-input" id="qs-address"></div>
        <div class="form-row"><div class="form-group"><label class="form-label">报价日期</label><input class="form-input" id="qs-date" type="date" value="${DB.today()}"></div><div class="form-group"><label class="form-label">报价有效期</label><input class="form-input" id="qs-validity" value="180天"></div></div>`;
      App.showModal('新增供方', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="qs-save">保存</button>`);
      document.getElementById('qs-save').addEventListener('click', () => {
        const name = document.getElementById('qs-name').value.trim();
        if (!name) { App.toast('名称必填', 'error'); return; }
        DB.saveQuotationSupplierRecord({ supplier_name: name, contact_person: document.getElementById('qs-contact').value, phone: document.getElementById('qs-phone').value, address: document.getElementById('qs-address').value, quote_date: document.getElementById('qs-date').value, quote_validity: document.getElementById('qs-validity').value });
        App.closeModal(); App.toast('保存成功', 'success'); render();
      });
    });
    App._delQS = (id) => { App.showConfirm('确认删除？', () => { DB.deleteQuotationSupplierRecord(id); App.toast('已删除', 'success'); render(); }); };
  }

  document.getElementById('tab-products').addEventListener('click', () => switchTab('products'));
  document.getElementById('tab-config').addEventListener('click', () => switchTab('config'));
  document.getElementById('tab-suppliers').addEventListener('click', () => switchTab('suppliers'));
  render();
};
