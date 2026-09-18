/* ═══ 备忘录页 ═══ */
App.PAGE_LOADERS.memo = function(container) {
  let rows = DB.getMemos('', '', '', 0);
  const projects = DB.getProjects();

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h2>备忘录</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-memo">+ 新增</button>
      </div>
      <div class="page-toolbar">
        <select class="form-select" id="memo-project" style="width:120px"><option value="">全部项目</option>${projects.map(p => `<option>${p.name}</option>`).join('')}</select>
        <select class="form-select" id="memo-status" style="width:100px"><option value="">全部状态</option><option>待处理</option><option>处理中</option><option>已完成</option></select>
        <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="memo-search" placeholder="搜索"></div>
        <span style="font-size:var(--font-micro);color:var(--text-secondary)">共 ${rows.length} 条</span>
      </div>
      <div class="page-body" id="memo-wrap"></div>
    </div>
  `;

  function render() {
    const project = document.getElementById('memo-project').value;
    const status = document.getElementById('memo-status').value;
    const kw = document.getElementById('memo-search').value;
    rows = DB.getMemos(kw, project, status, 0);
    const cols = [
      { key: 'date', title: '日期', render: v => App.formatDate(v) },
      { key: 'project', title: '项目' },
      { key: 'content', title: '内容' },
      { key: 'handler', title: '经办人' },
      { key: 'deadline', title: '截止日期', render: v => v ? `<span style="color:var(--warning)">${App.formatDate(v)}</span>` : '' },
      { key: 'status', title: '状态', render: v => `<span class="tag ${v==='已完成'?'tag-success':v==='处理中'?'tag-info':'tag-warning'}">${v||'待处理'}</span>` },
      { key: 'remark', title: '备注' },
    ];
    const table = App.createTable(cols, rows, {
      onContextMenu: (row) => [
        { label: '编辑', action: () => editMemo(row) },
        { label: '标记完成', action: () => { DB.updateMemo(row.id, { ...row, status: '已完成' }); App.toast('已完成', 'success'); render(); } },
        { label: '归档', action: () => { DB.archiveMemo(row.id, true); App.toast('已归档', 'success'); render(); } },
        { label: '删除', danger: true, action: () => App.showConfirm('确认删除？', () => { DB.deleteMemo(row.id); App.toast('已删除', 'success'); render(); }) },
      ]
    });
    const wrap = document.getElementById('memo-wrap');
    wrap.innerHTML = ''; wrap.appendChild(table);
  }

  function editMemo(row) {
    const isNew = !row;
    const d = row || { date: DB.today(), project: '', handler: '', content: '', deadline: '', status: '待处理', remark: '' };
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">日期</label><input class="form-input" id="f-date" type="date" value="${App.formatDate(d.date)}"></div>
        <div class="form-group"><label class="form-label">项目</label><select class="form-select" id="f-project">${projects.map(p => `<option ${d.project===p.name?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">经办人</label><input class="form-input" id="f-handler" value="${App.escapeHtml(d.handler||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">内容 *</label><textarea class="form-textarea" id="f-content">${App.escapeHtml(d.content||'')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">截止日期</label><input class="form-input" id="f-deadline" type="date" value="${App.formatDate(d.deadline)}"></div>
        <div class="form-group"><label class="form-label">状态</label><select class="form-select" id="f-status"><option ${d.status==='待处理'?'selected':''}>待处理</option><option ${d.status==='处理中'?'selected':''}>处理中</option><option ${d.status==='已完成'?'selected':''}>已完成</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">备注</label><input class="form-input" id="f-remark" value="${App.escapeHtml(d.remark||'')}"></div>
    `;
    App.showModal(isNew ? '新增备忘' : '编辑备忘', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="memo-save">保存</button>`);
    document.getElementById('memo-save').addEventListener('click', () => {
      const data = {
        date: document.getElementById('f-date').value,
        project: document.getElementById('f-project').value,
        handler: document.getElementById('f-handler').value.trim(),
        content: document.getElementById('f-content').value.trim(),
        deadline: document.getElementById('f-deadline').value,
        status: document.getElementById('f-status').value,
        remark: document.getElementById('f-remark').value.trim(),
      };
      if (!data.content) { App.toast('内容必填', 'error'); return; }
      if (isNew) DB.saveMemo(data); else DB.updateMemo(row.id, data);
      App.closeModal(); App.toast('保存成功', 'success'); render();
    });
  }

  document.getElementById('btn-add-memo').addEventListener('click', () => editMemo(null));
  document.getElementById('memo-project').addEventListener('change', render);
  document.getElementById('memo-status').addEventListener('change', render);
  document.getElementById('memo-search').addEventListener('input', App.debounce(render));
  render();
};
