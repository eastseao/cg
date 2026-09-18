/* ═══ 设置页 ═══ */
App.PAGE_LOADERS.settings = function(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header"><h2>设置</h2></div>
      <div style="padding:16px;max-width:600px">
        <div class="card" style="margin-bottom:16px">
          <h3 style="margin-bottom:12px">数据管理</h3>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn" id="btn-export-db">导出数据库</button>
            <button class="btn" id="btn-import-db">导入数据库</button>
            <input type="file" id="db-file" accept=".db,.sqlite" style="display:none">
            <button class="btn" id="btn-export-xlsx">导出Excel</button>
            <button class="btn" id="btn-clear-all">清空所有数据</button>
          </div>
        </div>
        <div class="card" style="margin-bottom:16px">
          <h3 style="margin-bottom:12px">项目管理</h3>
          <div id="proj-list" style="margin-bottom:8px"></div>
          <div style="display:flex;gap:8px">
            <input class="form-input" id="new-proj" placeholder="新项目名称" style="flex:1">
            <button class="btn btn-primary btn-sm" id="btn-add-proj">添加</button>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:12px">关于</h3>
          <div style="font-size:var(--font-micro);color:var(--text-secondary);line-height:2">
            <div>采购管理系统 网页版 V1.0</div>
            <div>基于 Electron 桌面版 V1.1.18 改造</div>
            <div>数据存储：SQLite WASM (LocalStorage 持久化)</div>
            <div>技术栈：原生 JavaScript + sql.js + SheetJS (xlsx)</div>
          </div>
        </div>
      </div>
    </div>
  `;

  function renderProjects() {
    const projects = DB.getProjects();
    document.getElementById('proj-list').innerHTML = projects.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--divider)">
        <span>${App.escapeHtml(p.name)}</span>
        ${p.name !== '默认项目' ? `<button class="btn-icon" onclick="DB.execute('DELETE FROM projects WHERE id=${p.id}'); App.toast('已删除','success'); renderProjects();">🗑</button>` : ''}
      </div>
    `).join('');
  }

  renderProjects();

  document.getElementById('btn-add-proj').addEventListener('click', () => {
    const name = document.getElementById('new-proj').value.trim();
    if (!name) return;
    DB.addProject(name); App.toast('已添加', 'success');
    document.getElementById('new-proj').value = ''; renderProjects();
  });

  document.getElementById('btn-export-db').addEventListener('click', () => {
    const blob = DB.exportBinary();
    App.downloadBlob(blob, `procurement_db_${DB.today()}.db`);
    App.toast('数据库已导出', 'success');
  });

  document.getElementById('btn-import-db').addEventListener('click', () => document.getElementById('db-file').click());
  document.getElementById('db-file').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    App.showConfirm('导入将覆盖现有数据，确认继续？', async () => {
      await DB.importBinary(file);
      App.toast('导入成功', 'success');
      setTimeout(() => location.reload(), 1000);
    });
    e.target.value = '';
  });

  document.getElementById('btn-export-xlsx').addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
    // 供应商
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.getSuppliers()), '供应商');
    // 采购垫付
    const purchases = DB.getPurchases(0).map(p => ({ date: p.date, project: p.project, handler: p.handler, total: p.total, payment_method: p.payment_method, invoice_status: p.invoice_status, reimbursement_status: p.reimbursement_status, remark: p.remark }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchases), '采购垫付');
    // 包材下单
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.getPackagingOrders({ archived: 0 })), '包材下单');
    // 备忘录
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.getMemos('', '', '', 0)), '备忘录');
    // 计划
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.getPlanRecords(0)), '采购计划');
    // 比价
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DB.getThirdPartyRecords()), '三方比价');
    XLSX.writeFile(wb, `采购数据导出_${DB.today()}.xlsx`);
    App.toast('Excel已导出', 'success');
  });

  document.getElementById('btn-clear-all').addEventListener('click', () => {
    App.showConfirm('确认清空所有数据？此操作不可恢复！', () => {
      localStorage.removeItem(DB.STORAGE_KEY);
      App.toast('已清空，正在重置...', 'success');
      setTimeout(() => location.reload(), 1000);
    });
  });
};
