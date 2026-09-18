/* ═══ 差旅页 ═══ */
App.PAGE_LOADERS.travel = function(container) {
  let rows = DB.getTravels(0);

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>差旅管理</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-travel">+ 新增</button>
      </div>
      <div class="page-toolbar">
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="travel-search" placeholder="搜索"></div>
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${rows.length} 条</span>
      </div>
      <div class="page-body" id="travel-wrap"></div>
    </div>
  `;

  function render(kw) {
    const filtered = kw ? rows.filter(r => (r.reason + r.destination + r.handler).includes(kw)) : rows;
    const cols = [
      { key: 'reason', title: '事由' },
      { key: 'destination', title: '目的地' },
      { key: 'start_date', title: '出发日期', render: v => App.formatDate(v) },
      { key: 'end_date', title: '返回日期', render: v => App.formatDate(v) },
      { key: 'duration', title: '天数' },
      { key: 'handler', title: '经办人' },
      { key: 'total', title: '费用', render: v => v ? '¥' + App.formatMoney(v) : '' },
      { key: 'invoice_status', title: '开票状态', render: v => `<span class="tag ${v==='已开票'?'tag-success':'tag-default'}">${v||''}</span>` },
      { key: 'reimbursement_status', title: '报销状态', render: v => `<span class="tag ${v==='已报销'?'tag-success':'tag-default'}">${v||''}</span>` },
    ];
    const table = App.createTable(cols, filtered, {
      onContextMenu: (row) => [
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除？', () => { DB.deleteTravel(row.id); App.toast('已删除', 'success'); renderPage(); }) },
      ]
    });
    const wrap = document.getElementById('travel-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
  }

  function renderPage() { rows = DB.getTravels(0); render(document.getElementById('travel-search').value); }

  document.getElementById('btn-add-travel').addEventListener('click', () => {
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">事由 *</label><input class="form-input" id="f-reason"></div>
        <div class="form-group"><label class="form-label">目的地</label><input class="form-input" id="f-destination"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">出发日期</label><input class="form-input" id="f-start_date" type="date" value="${DB.today()}"></div>
        <div class="form-group"><label class="form-label">返回日期</label><input class="form-input" id="f-end_date" type="date" value="${DB.today()}"></div>
        <div class="form-group"><label class="form-label">经办人</label><input class="form-input" id="f-handler"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">开票状态</label><select class="form-select" id="f-invoice_status"><option>未开票</option><option>已开票</option></select></div>
        <div class="form-group"><label class="form-label">报销状态</label><select class="form-select" id="f-reimbursement_status"><option>未报销</option><option>已报销</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">备注</label><input class="form-input" id="f-remark"></div>
    `;
    App.showModal('新增差旅', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="travel-save">保存</button>`);
    document.getElementById('travel-save').addEventListener('click', () => {
      const sd = document.getElementById('f-start_date').value;
      const ed = document.getElementById('f-end_date').value;
      let dur = 0;
      if (sd && ed) { const s = new Date(sd), e = new Date(ed); dur = Math.round((e - s) / 86400000) + 1; }
      const data = {
        reason: document.getElementById('f-reason').value.trim(),
        destination: document.getElementById('f-destination').value.trim(),
        start_date: sd, end_date: ed, duration: dur,
        handler: document.getElementById('f-handler').value.trim(),
        invoice_status: document.getElementById('f-invoice_status').value,
        reimbursement_status: document.getElementById('f-reimbursement_status').value,
        remark: document.getElementById('f-remark').value.trim(),
      };
      if (!data.reason) { App.toast('事由必填', 'error'); return; }
      DB.saveTravel(data, [], []);
      App.closeModal(); App.toast('保存成功', 'success'); renderPage();
    });
  });

  document.getElementById('travel-search').addEventListener('input', App.debounce(() => render(document.getElementById('travel-search').value)));
  render('');
};
