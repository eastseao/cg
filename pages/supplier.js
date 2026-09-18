/* ═══ 供应商管理页 ═══ */
App.PAGE_LOADERS.supplier = function(container) {
  let rows = DB.getSuppliers();

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>供应商管理</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-sup">+ 新增</button>
      </div>
      <div class="page-toolbar">
        <select class="form-select" id="sup-cat" style="width:100px"><option value="">全部分类</option><option>包材</option><option>印刷</option><option>原料</option><option>其他</option></select>
        <select class="form-select" id="sup-status" style="width:100px"><option value="">全部状态</option><option>合作中</option><option>接洽中</option><option>已停止</option></select>
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="sup-search" placeholder="搜索供应商"></div>
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${rows.length} 家</span>
      </div>
      <div class="page-body" id="sup-wrap"></div>
    </div>
  `;

  function render() {
    const cat = document.getElementById('sup-cat').value;
    const status = document.getElementById('sup-status').value;
    const kw = document.getElementById('sup-search').value;
    const filtered = DB.getSuppliers(cat, kw, status);
    const cols = [
      { key: 'name', title: '名称' },
      { key: 'category', title: '分类', render: v => v ? `<span class="tag tag-info">${v}</span>` : '' },
      { key: 'main_product', title: '主营产品' },
      { key: 'contact_person', title: '联系人' },
      { key: 'phone', title: '电话' },
      { key: 'wechat', title: '微信' },
      { key: 'cooperation_status', title: '合作状态', render: v => `<span class="tag ${v==='合作中'?'tag-success':v==='接洽中'?'tag-warning':'tag-default'}">${v||''}</span>` },
      { key: 'quote_status', title: '报价状态' },
      { key: 'sample_status', title: '样品状态' },
      { key: 'payment_method', title: '付款方式' },
      { key: 'invoice_type', title: '发票类型' },
      { key: 'tax_rate', title: '税率' },
    ];
    const table = App.createTable(cols, filtered, {
      onContextMenu: (row) => [
        { label: '编辑', action: () => editSupplier(row) },
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除？', () => { DB.deleteSupplier(row.id); App.toast('已删除', 'success'); render(); }) },
      ]
    });
    const wrap = document.getElementById('sup-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
  }

  function editSupplier(row) {
    const isNew = !row;
    const d = row || { name: '', category: '', main_product: '', contact_person: '', phone: '', wechat: '', cooperation_status: '接洽中', quote_status: '', sample_status: '', payment_method: '', invoice_type: '', tax_rate: '', remark: '' };
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">名称 *</label><input class="form-input" id="f-name" value="${App.escapeHtml(d.name)}"></div>
        <div class="form-group"><label class="form-label">分类</label><select class="form-select" id="f-category"><option value="">请选择</option><option ${d.category==='包材'?'selected':''}>包材</option><option ${d.category==='印刷'?'selected':''}>印刷</option><option ${d.category==='原料'?'selected':''}>原料</option><option ${d.category==='其他'?'selected':''}>其他</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">主营产品</label><input class="form-input" id="f-main_product" value="${App.escapeHtml(d.main_product||'')}"></div>
        <div class="form-group"><label class="form-label">合作状态</label><select class="form-select" id="f-cooperation_status"><option ${d.cooperation_status==='接洽中'?'selected':''}>接洽中</option><option ${d.cooperation_status==='合作中'?'selected':''}>合作中</option><option ${d.cooperation_status==='已停止'?'selected':''}>已停止</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">联系人</label><input class="form-input" id="f-contact_person" value="${App.escapeHtml(d.contact_person||'')}"></div>
        <div class="form-group"><label class="form-label">电话</label><input class="form-input" id="f-phone" value="${App.escapeHtml(d.phone||'')}"></div>
        <div class="form-group"><label class="form-label">微信</label><input class="form-input" id="f-wechat" value="${App.escapeHtml(d.wechat||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">报价状态</label><input class="form-input" id="f-quote_status" value="${App.escapeHtml(d.quote_status||'')}"></div>
        <div class="form-group"><label class="form-label">样品状态</label><input class="form-input" id="f-sample_status" value="${App.escapeHtml(d.sample_status||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">付款方式</label><input class="form-input" id="f-payment_method" value="${App.escapeHtml(d.payment_method||'')}"></div>
        <div class="form-group"><label class="form-label">发票类型</label><input class="form-input" id="f-invoice_type" value="${App.escapeHtml(d.invoice_type||'')}"></div>
        <div class="form-group"><label class="form-label">税率</label><input class="form-input" id="f-tax_rate" value="${App.escapeHtml(d.tax_rate||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">备注</label><textarea class="form-textarea" id="f-remark">${App.escapeHtml(d.remark||'')}</textarea></div>
    `;
    App.showModal(isNew ? '新增供应商' : '编辑供应商', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="sup-save">保存</button>`);
    document.getElementById('sup-save').addEventListener('click', () => {
      const data = {
        name: document.getElementById('f-name').value.trim(),
        category: document.getElementById('f-category').value,
        main_product: document.getElementById('f-main_product').value.trim(),
        contact_person: document.getElementById('f-contact_person').value.trim(),
        phone: document.getElementById('f-phone').value.trim(),
        wechat: document.getElementById('f-wechat').value.trim(),
        cooperation_status: document.getElementById('f-cooperation_status').value,
        quote_status: document.getElementById('f-quote_status').value.trim(),
        sample_status: document.getElementById('f-sample_status').value.trim(),
        payment_method: document.getElementById('f-payment_method').value.trim(),
        invoice_type: document.getElementById('f-invoice_type').value.trim(),
        tax_rate: document.getElementById('f-tax_rate').value.trim(),
        remark: document.getElementById('f-remark').value.trim(),
      };
      if (!data.name) { App.toast('名称必填', 'error'); return; }
      if (isNew) DB.saveSupplier(data); else DB.updateSupplier(row.id, data);
      App.closeModal(); App.toast('保存成功', 'success'); render();
    });
  }

  document.getElementById('btn-add-sup').addEventListener('click', () => editSupplier(null));
  document.getElementById('sup-cat').addEventListener('change', render);
  document.getElementById('sup-status').addEventListener('change', render);
  document.getElementById('sup-search').addEventListener('input', App.debounce(render));
  render();
};
