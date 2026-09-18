/* ═══ 应付提醒页 ═══ */
App.PAGE_LOADERS.collection = function(container) {
  let rows = DB.getCollections();

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>应付提醒</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-col">+ 新增</button>
      </div>
      <div class="page-toolbar">
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="col-search" placeholder="搜索"></div>
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${rows.length} 条，合计 ¥${App.formatMoney(rows.reduce((s,r)=>s+(r.amount_due||0),0))}</span>
      </div>
      <div class="page-body" id="col-wrap"></div>
    </div>
  `;

  function render(kw) {
    const filtered = kw ? rows.filter(r => (r.supplier_name + r.contact_person + r.wechat).includes(kw)) : rows;
    const cols = [
      { key: 'reminder_date', title: '催款日期', render: v => App.formatDate(v) },
      { key: 'supplier_name', title: '供应商' },
      { key: 'amount_due', title: '应付金额', render: v => '¥' + App.formatMoney(v) },
      { key: 'contact_person', title: '联系人' },
      { key: 'wechat', title: '微信' },
      { key: 'notify_internal', title: '内部通知', render: v => v ? '<span class="tag tag-info">已通知</span>' : '<span class="tag tag-default">未通知</span>' },
      { key: 'notify_manager', title: '通知经理', render: v => v ? '<span class="tag tag-info">已通知</span>' : '<span class="tag tag-default">未通知</span>' },
      { key: 'remark', title: '备注' },
    ];
    const table = App.createTable(cols, filtered, {
      onContextMenu: (row) => [
        { label: '编辑', action: () => editCol(row) },
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除？', () => { DB.deleteCollection(row.id); App.toast('已删除', 'success'); renderPage(); }) },
      ]
    });
    const wrap = document.getElementById('col-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
  }

  function renderPage() { rows = DB.getCollections(); render(document.getElementById('col-search').value); }

  function editCol(row) {
    const isNew = !row;
    const d = row || { supplier_name: '', contact_person: '', wechat: '', reminder_date: DB.today(), amount_due: 0, notify_internal: 0, notify_manager: 0, remark: '' };
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">供应商 *</label><input class="form-input" id="f-supplier_name" value="${App.escapeHtml(d.supplier_name||'')}"></div>
        <div class="form-group"><label class="form-label">应付金额</label><input class="form-input" id="f-amount_due" type="number" step="0.01" value="${d.amount_due||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">联系人</label><input class="form-input" id="f-contact_person" value="${App.escapeHtml(d.contact_person||'')}"></div>
        <div class="form-group"><label class="form-label">微信</label><input class="form-input" id="f-wechat" value="${App.escapeHtml(d.wechat||'')}"></div>
        <div class="form-group"><label class="form-label">催款日期</label><input class="form-input" id="f-reminder_date" type="date" value="${App.formatDate(d.reminder_date)}"></div>
      </div>
      <div class="form-row">
        <label class="checkbox-label"><input type="checkbox" id="f-notify_internal" ${d.notify_internal?'checked':''}> 内部通知</label>
        <label class="checkbox-label"><input type="checkbox" id="f-notify_manager" ${d.notify_manager?'checked':''}> 通知经理</label>
      </div>
      <div class="form-group"><label class="form-label">备注</label><textarea class="form-textarea" id="f-remark">${App.escapeHtml(d.remark||'')}</textarea></div>
    `;
    App.showModal(isNew ? '新增催款' : '编辑催款', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="col-save">保存</button>`);
    document.getElementById('col-save').addEventListener('click', () => {
      const data = {
        supplier_name: document.getElementById('f-supplier_name').value.trim(),
        amount_due: parseFloat(document.getElementById('f-amount_due').value) || 0,
        contact_person: document.getElementById('f-contact_person').value.trim(),
        wechat: document.getElementById('f-wechat').value.trim(),
        reminder_date: document.getElementById('f-reminder_date').value,
        notify_internal: document.getElementById('f-notify_internal').checked ? 1 : 0,
        notify_manager: document.getElementById('f-notify_manager').checked ? 1 : 0,
        remark: document.getElementById('f-remark').value.trim(),
      };
      if (!data.supplier_name) { App.toast('供应商必填', 'error'); return; }
      if (isNew) DB.saveCollection(data); else DB.updateCollection(row.id, data);
      App.closeModal(); App.toast('保存成功', 'success'); renderPage();
    });
  }

  document.getElementById('btn-add-col').addEventListener('click', () => editCol(null));
  document.getElementById('col-search').addEventListener('input', App.debounce(() => render(document.getElementById('col-search').value)));
  render('');
};
