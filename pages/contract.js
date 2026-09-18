/* ═══ 合同管理页 ═══ */
App.PAGE_LOADERS.contract = function(container) {
  let activeTab = 'suppliers';

  container.innerHTML = `
    <div class="page">
      <div class="page-header"><h2>合同管理</h2></div>
      <div class="page-toolbar">
        <button class="btn btn-sm ${activeTab==='suppliers'?'btn-primary':''}" data-tab="suppliers" id="tab-cs">合同供应商</button>
        <button class="btn btn-sm ${activeTab==='partyA'?'btn-primary':''}" data-tab="partyA" id="tab-pa">甲方信息</button>
        <button class="btn btn-sm ${activeTab==='products'?'btn-primary':''}" data-tab="products" id="tab-cp">合同产品</button>
        <button class="btn btn-sm ${activeTab==='generate'?'btn-primary':''}" data-tab="generate" id="tab-gen">生成合同</button>
      </div>
      <div class="page-body" id="ccontent" style="padding:16px;overflow:auto"></div>
    </div>
  `;

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('btn-primary', b.dataset.tab === tab));
    render();
  }

  function render() {
    const c = document.getElementById('ccontent');
    if (activeTab === 'suppliers') renderSuppliers(c);
    else if (activeTab === 'partyA') renderPartyA(c);
    else if (activeTab === 'products') renderProducts(c);
    else if (activeTab === 'generate') renderGenerate(c);
  }

  function renderSuppliers(c) {
    const list = DB.getContractSuppliers();
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:var(--font-body);color:var(--text-secondary)">共 ${list.length} 家</span>
        <button class="btn btn-primary btn-sm" id="btn-add-cs">+ 新增</button>
      </div>
      <table class="data-table">
        <thead><tr><th>简称</th><th>全称</th><th>法定代表人</th><th>地址</th><th>联系人</th><th>电话</th><th>付款天数</th><th>开户行</th><th>账号</th><th>操作</th></tr></thead>
        <tbody>
          ${list.map(s => `<tr>
            <td>${App.escapeHtml(s.short_name||'')}</td><td>${App.escapeHtml(s.full_name||'')}</td><td>${App.escapeHtml(s.legal_rep||'')}</td>
            <td>${App.escapeHtml(s.address||'')}</td><td>${App.escapeHtml(s.contact||'')}</td><td>${App.escapeHtml(s.phone||'')}</td>
            <td>${App.escapeHtml(s.payment_days||'')}</td><td>${App.escapeHtml(s.bank||'')}</td><td>${App.escapeHtml(s.account||'')}</td>
            <td><button class="btn-icon" onclick="App._editCS(${s.id})">✎</button> <button class="btn-icon" onclick="App._delCS(${s.id})">🗑</button></td>
          </tr>`).join('') || '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-tertiary)">暂无供应商</td></tr>'}
        </tbody>
      </table>
    `;
    document.getElementById('btn-add-cs').addEventListener('click', () => editCS(null));
    App._editCS = (id) => { const s = list.find(x => x.id === id); editCS(s); };
    App._delCS = (id) => { App.showConfirm('确认删除？', () => { DB.deleteContractSupplier(id); App.toast('已删除', 'success'); render(); }); };
  }

  function editCS(s) {
    const isNew = !s;
    const d = s || { short_name: '', full_name: '', legal_rep: '', address: '', contact: '', auth_rep: '', phone: '', fax: '', payment_days: '90', payment_method: '电汇', account_name: '', bank: '', account: '', remark: '' };
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">简称</label><input class="form-input" id="f-short_name" value="${App.escapeHtml(d.short_name||'')}"></div>
        <div class="form-group"><label class="form-label">全称 *</label><input class="form-input" id="f-full_name" value="${App.escapeHtml(d.full_name||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">法定代表人</label><input class="form-input" id="f-legal_rep" value="${App.escapeHtml(d.legal_rep||'')}"></div>
        <div class="form-group"><label class="form-label">地址</label><input class="form-input" id="f-address" value="${App.escapeHtml(d.address||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">联系人</label><input class="form-input" id="f-contact" value="${App.escapeHtml(d.contact||'')}"></div>
        <div class="form-group"><label class="form-label">授权代表</label><input class="form-input" id="f-auth_rep" value="${App.escapeHtml(d.auth_rep||'')}"></div>
        <div class="form-group"><label class="form-label">电话</label><input class="form-input" id="f-phone" value="${App.escapeHtml(d.phone||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">传真</label><input class="form-input" id="f-fax" value="${App.escapeHtml(d.fax||'')}"></div>
        <div class="form-group"><label class="form-label">付款天数</label><input class="form-input" id="f-payment_days" value="${App.escapeHtml(d.payment_days||'90')}"></div>
        <div class="form-group"><label class="form-label">付款方式</label><input class="form-input" id="f-payment_method" value="${App.escapeHtml(d.payment_method||'电汇')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">账户名称</label><input class="form-input" id="f-account_name" value="${App.escapeHtml(d.account_name||'')}"></div>
        <div class="form-group"><label class="form-label">开户行</label><input class="form-input" id="f-bank" value="${App.escapeHtml(d.bank||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">账号</label><input class="form-input" id="f-account" value="${App.escapeHtml(d.account||'')}"></div>
    `;
    App.showModal(isNew ? '新增合同供应商' : '编辑合同供应商', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="cs-save">保存</button>`);
    document.getElementById('cs-save').addEventListener('click', () => {
      const data = {};
      ['short_name','full_name','legal_rep','address','contact','auth_rep','phone','fax','payment_days','payment_method','account_name','bank','account'].forEach(k => {
        data[k] = document.getElementById('f-' + k).value.trim();
      });
      if (!data.full_name) { App.toast('全称必填', 'error'); return; }
      if (isNew) DB.saveContractSupplier(data); else DB.updateContractSupplier(s.id, data);
      App.closeModal(); App.toast('保存成功', 'success'); render();
    });
  }

  function renderPartyA(c) {
    const pa = DB.getContractPartyA();
    c.innerHTML = `
      <div style="max-width:500px">
        <h3 style="margin-bottom:16px">甲方（需方）信息</h3>
        <div class="form-group"><label class="form-label">公司名称</label><input class="form-input" id="pa-company_name" value="${App.escapeHtml(pa?.company_name||'')}"></div>
        <div class="form-group"><label class="form-label">法定代表人</label><input class="form-input" id="pa-legal_rep" value="${App.escapeHtml(pa?.legal_rep||'')}"></div>
        <div class="form-group"><label class="form-label">地址</label><input class="form-input" id="pa-address" value="${App.escapeHtml(pa?.address||'')}"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">联系人</label><input class="form-input" id="pa-contact" value="${App.escapeHtml(pa?.contact||'')}"></div>
          <div class="form-group"><label class="form-label">电话</label><input class="form-input" id="pa-phone" value="${App.escapeHtml(pa?.phone||'')}"></div>
        </div>
        <button class="btn btn-primary" id="btn-save-pa">保存</button>
      </div>
    `;
    document.getElementById('btn-save-pa').addEventListener('click', () => {
      DB.saveContractPartyA({
        company_name: document.getElementById('pa-company_name').value,
        legal_rep: document.getElementById('pa-legal_rep').value,
        address: document.getElementById('pa-address').value,
        contact: document.getElementById('pa-contact').value,
        phone: document.getElementById('pa-phone').value,
      });
      App.toast('保存成功', 'success');
    });
  }

  function renderProducts(c) {
    const list = DB.getContractProducts();
    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:var(--font-body);color:var(--text-secondary)">共 ${list.length} 条</span>
        <button class="btn btn-primary btn-sm" id="btn-add-cp">+ 新增</button>
      </div>
      <table class="data-table">
        <thead><tr><th>合同编号</th><th>产品名称</th><th>项目号</th><th>规格</th><th>单位</th><th>数量</th><th>单价</th><th>金额</th><th>操作</th></tr></thead>
        <tbody>
          ${list.map(p => `<tr>
            <td>${App.escapeHtml(p.contract_no||'')}</td><td>${App.escapeHtml(p.product_name||'')}</td><td>${App.escapeHtml(p.project_no||'')}</td>
            <td>${App.escapeHtml(p.spec||'')}</td><td>${App.escapeHtml(p.unit||'')}</td><td>${p.quantity||''}</td>
            <td>${p.unit_price?'¥'+App.formatMoney(p.unit_price):''}</td><td>${p.amount?'¥'+App.formatMoney(p.amount):''}</td>
            <td><button class="btn-icon" onclick="App._delCP(${p.id})">🗑</button></td>
          </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-tertiary)">暂无产品</td></tr>'}
        </tbody>
      </table>
    `;
    document.getElementById('btn-add-cp').addEventListener('click', () => {
      const body = `
        <div class="form-group"><label class="form-label">合同编号</label><input class="form-input" id="cp-contract_no"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">产品名称 *</label><input class="form-input" id="cp-product_name"></div>
          <div class="form-group"><label class="form-label">项目号</label><input class="form-input" id="cp-project_no"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">规格</label><input class="form-input" id="cp-spec"></div>
          <div class="form-group"><label class="form-label">单位</label><input class="form-input" id="cp-unit" value="PCS"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">数量</label><input class="form-input" id="cp-quantity" type="number" value="0"></div>
          <div class="form-group"><label class="form-label">单价</label><input class="form-input" id="cp-unit_price" type="number" step="0.01" value="0"></div>
          <div class="form-group"><label class="form-label">金额</label><input class="form-input" id="cp-amount" type="number" step="0.01" value="0"></div>
        </div>
      `;
      App.showModal('新增合同产品', body, `<button class="btn btn-secondary" onclick="App.closeModal()">取消</button><button class="btn btn-primary" id="cp-save">保存</button>`);
      document.getElementById('cp-save').addEventListener('click', () => {
        const data = {
          contract_no: document.getElementById('cp-contract_no').value.trim(),
          product_name: document.getElementById('cp-product_name').value.trim(),
          project_no: document.getElementById('cp-project_no').value.trim(),
          spec: document.getElementById('cp-spec').value.trim(),
          unit: document.getElementById('cp-unit').value.trim(),
          quantity: parseFloat(document.getElementById('cp-quantity').value) || 0,
          unit_price: parseFloat(document.getElementById('cp-unit_price').value) || 0,
          amount: parseFloat(document.getElementById('cp-amount').value) || 0,
        };
        if (!data.product_name) { App.toast('产品名称必填', 'error'); return; }
        DB.saveContractProduct(data); App.closeModal(); App.toast('保存成功', 'success'); render();
      });
    });
    App._delCP = (id) => { App.showConfirm('确认删除？', () => { DB.deleteContractProduct(id); App.toast('已删除', 'success'); render(); }); };
  }

  function renderGenerate(c) {
    const cs = DB.getContractSuppliers();
    const pa = DB.getContractPartyA();
    c.innerHTML = `
      <div style="max-width:600px">
        <h3 style="margin-bottom:16px">生成合同</h3>
        <div class="form-group"><label class="form-label">合同编号</label><input class="form-input" id="gen-contract_no" placeholder="如：TRT-QH-CG-2026-001"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">签订日期</label><input class="form-input" id="gen-date" type="date" value="${DB.today()}"></div>
          <div class="form-group"><label class="form-label">税率</label><input class="form-input" id="gen-tax_rate" type="number" value="13"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">交货天数</label><input class="form-input" id="gen-delivery_days" type="number" value="15"></div>
          <div class="form-group"><label class="form-label">付款天数</label><input class="form-input" id="gen-payment_days" type="number" value="90"></div>
        </div>
        <div class="form-group"><label class="form-label">乙方（供应商）</label><select class="form-select" id="gen-supplier">${cs.map(s => `<option value="${s.id}">${App.escapeHtml(s.full_name||s.short_name||'')}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">产品明细（每行：名称,项目号,规格,单位,数量,单价,金额,备注）</label>
          <textarea class="form-textarea" id="gen-products" style="min-height:120px" placeholder="彩盒,81000001,200*150*80mm,PCS,5000,7.20,36000.00,无&#10;标签,81000002,60*40mm,PCS,10000,0.45,4500.00,无"></textarea>
        </div>
        <button class="btn btn-primary" id="btn-gen-contract">生成合同</button>
      </div>
    `;
    document.getElementById('btn-gen-contract').addEventListener('click', () => {
      const supplier = cs.find(s => s.id == document.getElementById('gen-supplier').value) || {};
      const contractNo = document.getElementById('gen-contract_no').value.trim();
      const date = document.getElementById('gen-date').value;
      const taxRate = parseFloat(document.getElementById('gen-tax_rate').value) || 13;
      const deliveryDays = parseInt(document.getElementById('gen-delivery_days').value) || 15;
      const paymentDays = parseInt(document.getElementById('gen-payment_days').value) || 90;
      const lines = document.getElementById('gen-products').value.trim().split('\n').filter(x => x.trim());
      const products = lines.map(l => { const p = l.split(','); return { product_name: p[0]||'', project_no: p[1]||'', spec: p[2]||'', unit: p[3]||'', quantity: parseFloat(p[4])||0, unit_price: parseFloat(p[5])||0, amount: parseFloat(p[6])||0, remark: p[7]||'' }; });
      const totalAmount = products.reduce((s, p) => s + (p.amount || 0), 0);
      generateContractHTML(contractNo, date, pa, supplier, products, totalAmount, taxRate, deliveryDays, paymentDays);
    });
  }

  function generateContractHTML(contractNo, date, partyA, partyB, products, totalAmount, taxRate, deliveryDays, paymentDays) {
    const upperAmount = App.numToChinese(totalAmount);
    const [y, m, d] = (date || '').split('-');
    const html = `
      <div style="font-family:'SimSun','宋体',serif;padding:40px;max-width:800px;margin:0 auto;font-size:14px;line-height:1.8">
        <div style="text-align:right;font-size:12px;margin-bottom:20px">合同编号：${App.escapeHtml(contractNo)}</div>
        <h1 style="text-align:center;font-size:22px;margin-bottom:24px">采购合同</h1>
        <p>甲方：${App.escapeHtml(partyA?.company_name||'')}</p>
        <p>乙方：${App.escapeHtml(partyB?.full_name||partyB?.short_name||'')}</p>
        <p>根据《中华人民共和国民法典》及相关法律法规，甲乙双方在平等、自愿、公平、诚实信用的基础上，经友好协商，就甲方向乙方购得<strong>${products.map(p => App.escapeHtml(p.product_name)).join('、')}</strong>标签产品事宜，于${App.escapeHtml(y||'')}年${parseInt(m)||''}月${parseInt(d)||''}日签订合同，达成如下协议：</p>
        <p><strong>第一条　产品信息</strong></p>
        <table style="width:100%;border-collapse:collapse;border:1.5px solid #000;margin:8px 0">
          <thead><tr style="background:#f5f5f5"><th style="border:1px solid #000;padding:6px">物料名称</th><th style="border:1px solid #000;padding:6px">项目号</th><th style="border:1px solid #000;padding:6px">规格</th><th style="border:1px solid #000;padding:6px">单位</th><th style="border:1px solid #000;padding:6px">数量</th><th style="border:1px solid #000;padding:6px">单价</th><th style="border:1px solid #000;padding:6px">金额</th><th style="border:1px solid #000;padding:6px">备注</th></tr></thead>
          <tbody>
            ${products.map(p => `<tr><td style="border:1px solid #000;padding:6px">${App.escapeHtml(p.product_name)}</td><td style="border:1px solid #000;padding:6px">${App.escapeHtml(p.project_no)}</td><td style="border:1px solid #000;padding:6px">${App.escapeHtml(p.spec)}</td><td style="border:1px solid #000;padding:6px;text-align:center">${App.escapeHtml(p.unit)}</td><td style="border:1px solid #000;padding:6px;text-align:right">${p.quantity}</td><td style="border:1px solid #000;padding:6px;text-align:right">${p.unit_price?App.formatMoney(p.unit_price):''}</td><td style="border:1px solid #000;padding:6px;text-align:right">${p.amount?App.formatMoney(p.amount):''}</td><td style="border:1px solid #000;padding:6px">${App.escapeHtml(p.remark||'')}</td></tr>`).join('')}
            <tr><td colspan="6" style="border:1px solid #000;padding:6px;text-align:center"><strong>合计</strong></td><td colspan="2" style="border:1px solid #000;padding:6px"><strong>大写：${upperAmount}　小写：￥${App.formatMoney(totalAmount)}元整</strong></td></tr>
          </tbody>
        </table>
        <p><strong>第二条　质量标准</strong></p>
        <p>乙方提供的产品应符合国家相关质量标准及甲方技术要求，产品应无瑕疵、无缺陷。</p>
        <p><strong>第三条　交货时间及方式</strong></p>
        <p>交货时间：乙方应在收到甲方通知后<strong>${deliveryDays}</strong>天内发货。交货地点：甲方指定地点，运输费用由乙方承担。</p>
        <p><strong>第四条　付款方式</strong></p>
        <p>货到票到<strong>${paymentDays}</strong>天内付款。付款方式：${App.escapeHtml(partyB?.payment_method||'电汇')}。</p>
        <p>增值税税率：${taxRate}%。</p>
        <p><strong>第五条　违约责任</strong></p>
        <p>任何一方违约，应按合同总金额的5%向守约方支付违约金。</p>
        <p><strong>第六条　争议解决</strong></p>
        <p>本合同在履行过程中发生争议，双方应协商解决；协商不成的，向甲方所在地人民法院提起诉讼。</p>
        <p><strong>第七条　其他约定</strong></p>
        <p>本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。</p>
        <div style="margin-top:40px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="width:50%;vertical-align:top;padding:8px">
              <p>甲方（盖章）：${App.escapeHtml(partyA?.company_name||'')}</p>
              <p>法定代表人：${App.escapeHtml(partyA?.legal_rep||'')}</p>
              <p>地址：${App.escapeHtml(partyA?.address||'')}</p>
              <p>联系人：${App.escapeHtml(partyA?.contact||'')}</p>
              <p>电话：${App.escapeHtml(partyA?.phone||'')}</p>
            </td><td style="width:50%;vertical-align:top;padding:8px">
              <p>乙方（盖章）：${App.escapeHtml(partyB?.full_name||'')}</p>
              <p>法定代表人：${App.escapeHtml(partyB?.legal_rep||'')}</p>
              <p>地址：${App.escapeHtml(partyB?.address||'')}</p>
              <p>联系人：${App.escapeHtml(partyB?.contact||'')}</p>
              <p>电话：${App.escapeHtml(partyB?.phone||'')}</p>
            </td></tr>
          </table>
        </div>
        <div style="margin-top:24px">
          <p>账户名称：${App.escapeHtml(partyB?.account_name||'')}</p>
          <p>开  户  行：${App.escapeHtml(partyB?.bank||'')}</p>
          <p>账    号：${App.escapeHtml(partyB?.account||'')}</p>
        </div>
      </div>
    `;
    App.printHTML(html);
    App.toast('合同已生成，可通过浏览器打印为PDF', 'success');
  }

  document.getElementById('tab-cs').addEventListener('click', () => switchTab('suppliers'));
  document.getElementById('tab-pa').addEventListener('click', () => switchTab('partyA'));
  document.getElementById('tab-cp').addEventListener('click', () => switchTab('products'));
  document.getElementById('tab-gen').addEventListener('click', () => switchTab('generate'));
  render();
};
