/* ═══ 数据库层 (sql.js + LocalStorage 持久化) ═══ */
const DB = {
  sql: null,
  db: null,
  STORAGE_KEY: 'procurement_db_v1118',

  async init() {
    // 加载 sql.js
    const SQL = await initSqlJs({ locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}` });
    DB.sql = SQL;
    // 尝试从 LocalStorage 加载
    const saved = localStorage.getItem(DB.STORAGE_KEY);
    if (saved) {
      try {
        const arr = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
        DB.db = new SQL.Database(arr);
      } catch (e) {
        DB.db = new SQL.Database();
        DB.initTables();
      }
    } else {
      DB.db = new SQL.Database();
      DB.initTables();
      DB.insertSampleData();
    }
    DB.db.run('PRAGMA foreign_keys = ON');
    DB.save();
    return DB.db;
  },

  save() {
    const data = DB.db.export();
    const b64 = btoa(String.fromCharCode(...data));
    try { localStorage.setItem(DB.STORAGE_KEY, b64); } catch (e) { console.warn('DB save failed', e); }
  },

  exportBinary() {
    const data = DB.db.export();
    return new Blob([data], { type: 'application/octet-stream' });
  },

  async importBinary(file) {
    const buf = await file.arrayBuffer();
    DB.db = new DB.sql.Database(new Uint8Array(buf));
    DB.db.run('PRAGMA foreign_keys = ON');
    DB.save();
  },

  now() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  },

  today() { return new Date().toISOString().slice(0, 10); },

  queryAll(sql, params = []) {
    try {
      const stmt = DB.db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    } catch (e) { console.error('Query error:', sql, e); return []; }
  },

  queryOne(sql, params = []) {
    const rows = DB.queryAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  execute(sql, params = []) {
    try { DB.db.run(sql, params); DB.save(); return true; } catch (e) { console.error('Exec error:', sql, e); return false; }
  },

  insertId(sql, params = []) {
    try {
      DB.db.run(sql, params);
      const r = DB.queryOne('SELECT last_insert_rowid() as id');
      DB.save();
      return r ? r.id : 0;
    } catch (e) { console.error('Insert error:', sql, e); return 0; }
  },

  hasColumn(table, col) {
    const rows = DB.queryAll(`PRAGMA table_info(${table})`);
    return rows.some(r => r.name === col);
  },

  tableExists(table) {
    return !!DB.queryOne(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table]);
  },

  initTables() {
    const db = DB.db;
    db.run(`CREATE TABLE IF NOT EXISTS purchase (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, project TEXT NOT NULL, handler TEXT NOT NULL, payment_method TEXT NOT NULL, invoice_status TEXT NOT NULL, reimbursement_status TEXT NOT NULL, remark TEXT, archived INTEGER DEFAULT 0, created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS purchase_items (id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_id INTEGER NOT NULL, name TEXT, spec TEXT, quantity REAL, unit_price REAL, supplier TEXT, total REAL, FOREIGN KEY(purchase_id) REFERENCES purchase(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL)`);
    db.run(`INSERT OR IGNORE INTO projects(name) VALUES('默认项目'),('电商新品'),('传渠项目')`);
    db.run(`CREATE TABLE IF NOT EXISTS material_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT, contract_no TEXT, supplier TEXT, item_no TEXT, material_name TEXT, quantity REAL, unit TEXT, unit_price REAL, amount REAL, year TEXT, raw_data TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS packaging_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, material_name TEXT NOT NULL, project TEXT NOT NULL, project_no TEXT, order_factory TEXT, compare_price REAL, compare_date TEXT, compare_remark TEXT, contract_status TEXT, contract_remark TEXT, notify_date TEXT, expected_delivery_date TEXT, notify_remark TEXT, production_cycle TEXT, expected_ship_date TEXT, production_remark TEXT, ship_date TEXT, ship_method TEXT, tracking_no TEXT, expected_arrival TEXT, notify_warehouse INTEGER DEFAULT 0, amount REAL DEFAULT 0, archived INTEGER DEFAULT 0, created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS travel (id INTEGER PRIMARY KEY AUTOINCREMENT, reason TEXT NOT NULL, destination TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, duration INTEGER, handler TEXT, invoice_status TEXT NOT NULL DEFAULT '未开票', reimbursement_status TEXT NOT NULL DEFAULT '未报销', remark TEXT, archived INTEGER DEFAULT 0, created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS travel_transport (id INTEGER PRIMARY KEY AUTOINCREMENT, travel_id INTEGER NOT NULL, transport_type TEXT, travel_date TEXT, departure TEXT, destination TEXT, amount REAL, FOREIGN KEY(travel_id) REFERENCES travel(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS travel_hotel (id INTEGER PRIMARY KEY AUTOINCREMENT, travel_id INTEGER NOT NULL, checkin_date TEXT, checkout_date TEXT, room_count INTEGER, amount REAL, invoice_status TEXT, FOREIGN KEY(travel_id) REFERENCES travel(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT, main_product TEXT, contact_person TEXT, phone TEXT, wechat TEXT, cooperation_status TEXT DEFAULT '接洽中', quote_status TEXT, sample_status TEXT, payment_method TEXT, invoice_type TEXT, tax_rate TEXT, remark TEXT, created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS collection_reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_name TEXT NOT NULL, contact_person TEXT, wechat TEXT, reminder_date TEXT, amount_due REAL, notify_internal INTEGER DEFAULT 0, notify_manager INTEGER DEFAULT 0, remark TEXT, created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS memos (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, project TEXT, handler TEXT, content TEXT, deadline TEXT, status TEXT DEFAULT '待处理', remark TEXT, created_at TEXT DEFAULT '', archived INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS quotation_products (id INTEGER PRIMARY KEY AUTOINCREMENT, item_no TEXT, product_name TEXT NOT NULL, product_size TEXT, material_process TEXT, supply_cycle TEXT, carton_spec TEXT, unit TEXT DEFAULT 'PCS', created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS quotation_tiers (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, tier_name TEXT NOT NULL, min_qty INTEGER NOT NULL DEFAULT 0, max_qty INTEGER, unit_price REAL NOT NULL DEFAULT 0, FOREIGN KEY(product_id) REFERENCES quotation_products(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS quotation_config (id INTEGER PRIMARY KEY, buyer_name TEXT DEFAULT '北京同仁堂健康药业（青海）有限公司', buyer_contact TEXT DEFAULT '王维', buyer_phone TEXT DEFAULT '18094719236', buyer_address TEXT DEFAULT '青海省海西州德令哈市同仁堂路1号', payment_terms TEXT DEFAULT '按协议条件付款', transport_method TEXT DEFAULT '物料或者专车请提前说明', delivery_docs TEXT DEFAULT '请随货放【发货单】【厂检报告】', quote_requirement TEXT DEFAULT '需含税含运', quote_template_note TEXT DEFAULT '报价单模板由需方提供', footer_note TEXT DEFAULT '请写明产品尺寸和详细的材质工艺、发货包装形式、箱规等信息', created_at TEXT DEFAULT '')`);
    db.run(`INSERT OR IGNORE INTO quotation_config(id) VALUES(1)`);
    db.run(`CREATE TABLE IF NOT EXISTS quotation_suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_name TEXT NOT NULL DEFAULT '', contact_person TEXT DEFAULT '', phone TEXT DEFAULT '', address TEXT DEFAULT '', quote_date TEXT DEFAULT '', quote_validity TEXT DEFAULT '', created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS quotation_records (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_name TEXT DEFAULT '', product_ids TEXT DEFAULT '', product_names TEXT DEFAULT '', product_count INTEGER DEFAULT 0, excel_path TEXT DEFAULT '', created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS third_party_records (id INTEGER PRIMARY KEY AUTOINCREMENT, product_name TEXT DEFAULT '', item_no TEXT DEFAULT '', material_structure TEXT DEFAULT '', spec_size TEXT DEFAULT '', quantity_tier TEXT DEFAULT '', supplier1 TEXT DEFAULT '', supplier2 TEXT DEFAULT '', supplier3 TEXT DEFAULT '', final_supplier TEXT DEFAULT '', price1_tier TEXT DEFAULT '', price2_tier TEXT DEFAULT '', price3_tier TEXT DEFAULT '', apply_date TEXT DEFAULT '', created_at TEXT DEFAULT '', updated_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS contract_suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, short_name TEXT DEFAULT '', full_name TEXT DEFAULT '', legal_rep TEXT DEFAULT '', address TEXT DEFAULT '', contact TEXT DEFAULT '', auth_rep TEXT DEFAULT '', phone TEXT DEFAULT '', fax TEXT DEFAULT '', payment_days TEXT DEFAULT '90', payment_method TEXT DEFAULT '电汇', account_name TEXT DEFAULT '', bank TEXT DEFAULT '', account TEXT DEFAULT '', remark TEXT DEFAULT '', created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS contract_party_a (id INTEGER PRIMARY KEY DEFAULT 1, company_name TEXT DEFAULT '北京同仁堂健康药业（青海）有限公司', legal_rep TEXT DEFAULT '施能文', address TEXT DEFAULT '', contact TEXT DEFAULT '龙存英', phone TEXT DEFAULT '13897764859')`);
    db.run(`INSERT OR IGNORE INTO contract_party_a(id) VALUES(1)`);
    db.run(`CREATE TABLE IF NOT EXISTS contract_products (id INTEGER PRIMARY KEY AUTOINCREMENT, contract_no TEXT, product_name TEXT, project_no TEXT, material_structure TEXT, spec TEXT, unit TEXT, quantity REAL, unit_price REAL, amount REAL, remark TEXT, created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS product_bom (id INTEGER PRIMARY KEY AUTOINCREMENT, finished_project_no TEXT NOT NULL, product_name TEXT, spec TEXT, retail_price REAL DEFAULT 0, brand TEXT, material_project_no TEXT NOT NULL, material_name TEXT, quantity REAL DEFAULT 0, unit TEXT DEFAULT '', created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS plan_records (id INTEGER PRIMARY KEY AUTOINCREMENT, approval_no TEXT DEFAULT '', item_seq TEXT DEFAULT '', item_no TEXT DEFAULT '', material_name TEXT NOT NULL DEFAULT '', spec TEXT DEFAULT '', quantity REAL DEFAULT 0, unit TEXT DEFAULT '', unit_price REAL DEFAULT 0, amount REAL DEFAULT 0, expected_delivery TEXT DEFAULT '', remark TEXT DEFAULT '', archived INTEGER DEFAULT 0, submitted_at TEXT DEFAULT '', approved_at TEXT DEFAULT '', created_at TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, warehouse TEXT NOT NULL, item_no TEXT, material_name TEXT, spec TEXT, unit TEXT, batch TEXT, quantity REAL DEFAULT 0, location TEXT, unit_price REAL DEFAULT 0, amount REAL DEFAULT 0, remark TEXT, source_sheet TEXT, source_file TEXT, imported_at TEXT)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_inv_warehouse ON inventory(warehouse)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_inv_item_no ON inventory(item_no)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_inv_material_name ON inventory(material_name)`);
    db.run(`CREATE TABLE IF NOT EXISTS import_history (id INTEGER PRIMARY KEY AUTOINCREMENT, warehouse TEXT NOT NULL, file_name TEXT, sheet_name TEXT, rows_imported INTEGER DEFAULT 0, imported_at TEXT)`);
  },

  insertSampleData() {
    const now = DB.now();
    // 示例供应商
    DB.execute(`INSERT INTO suppliers (name, category, main_product, contact_person, phone, wechat, cooperation_status, quote_status, sample_status, payment_method, invoice_type, tax_rate, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['深圳包装材料有限公司', '包材', '标签/纸盒', '张经理', '13800138001', 'zhang001', '合作中', '已报价', '已打样', '月结90天', '增值税专用发票', '13%', '优质供应商', now]);
    DB.execute(`INSERT INTO suppliers (name, category, main_product, contact_person, phone, wechat, cooperation_status, quote_status, sample_status, payment_method, invoice_type, tax_rate, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['广州印刷科技有限公司', '印刷', '彩盒/说明书', '李总', '13800138002', 'li002', '合作中', '已报价', '已打样', '月结60天', '增值税专用发票', '13%', '', now]);
    DB.execute(`INSERT INTO suppliers (name, category, main_product, contact_person, phone, wechat, cooperation_status, quote_status, sample_status, payment_method, invoice_type, tax_rate, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['浙江塑料制品厂', '包材', '塑料瓶/瓶盖', '王工', '13800138003', 'wang003', '接洽中', '待报价', '待打样', '款到发货', '增值税普通发票', '3%', '', now]);

    // 示例备忘录
    DB.execute(`INSERT INTO memos (date, project, handler, content, deadline, status, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [DB.today(), '电商新品', '龙存英', '跟进深圳包装材料厂打样进度', '2026-10-01', '待处理', '', now]);
    DB.execute(`INSERT INTO memos (date, project, handler, content, deadline, status, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [DB.today(), '传渠项目', '王维', '确认广州印刷厂报价单', '2026-09-30', '待处理', '', now]);

    // 示例催款记录
    DB.execute(`INSERT INTO collection_reminders (supplier_name, contact_person, wechat, reminder_date, amount_due, notify_internal, notify_manager, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['深圳包装材料有限公司', '张经理', 'zhang001', DB.today(), 50000, 1, 0, '第三季度货款', now]);

    // 示例采购垫付
    const pid = DB.insertId(`INSERT INTO purchase (date, project, handler, payment_method, invoice_status, reimbursement_status, remark, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [DB.today(), '电商新品', '龙存英', '银行转账', '未开票', '未报销', '紧急采购', now]);
    DB.execute(`INSERT INTO purchase_items (purchase_id, name, spec, quantity, unit_price, supplier, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pid, '标签纸（热敏）', '60*40mm', 100, 0.5, '深圳包装材料有限公司', 50]);
    DB.execute(`INSERT INTO purchase_items (purchase_id, name, spec, quantity, unit_price, supplier, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pid, 'A4复印纸', '70g/500张', 20, 18, '本地文具店', 360]);

    // 示例包材下单
    DB.execute(`INSERT INTO packaging_orders (material_name, project, project_no, order_factory, compare_price, compare_date, contract_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['彩盒-保健品礼盒', '电商新品', '81000001', '广州印刷科技有限公司', 3.5, DB.today(), '已签订', now]);
    DB.execute(`INSERT INTO packaging_orders (material_name, project, project_no, order_factory, compare_price, compare_date, contract_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['标签-营养成分表', '传渠项目', '81000002', '深圳包装材料有限公司', 0.45, DB.today(), '待签订', now]);

    // 示例计划
    DB.execute(`INSERT INTO plan_records (approval_no, item_seq, item_no, material_name, spec, quantity, unit, unit_price, amount, expected_delivery, remark, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      ['AP2026001', '01', '81000003', '玻璃瓶', '100ml', 5000, '个', 2.8, 14000, '2026-10-15', '', now]);
    DB.execute(`INSERT INTO plan_records (approval_no, item_seq, item_no, material_name, spec, quantity, unit, unit_price, amount, expected_delivery, remark, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      ['AP2026002', '02', '81000004', '瓶盖', '28mm', 5000, '个', 0.3, 1500, '2026-10-15', '', now]);

    // 示例报价产品
    const qp1 = DB.insertId(`INSERT INTO quotation_products (item_no, product_name, product_size, material_process, supply_cycle, carton_spec, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['81000005', '保健品礼盒', '200*150*80mm', '灰板纸+铜版纸', '15天', '560*380*310mm(24入)', 'PCS', now]);
    DB.execute(`INSERT INTO quotation_tiers (product_id, tier_name, min_qty, max_qty, unit_price) VALUES (?, ?, ?, ?, ?)`, [qp1, '首批', 1000, 4999, 8.5]);
    DB.execute(`INSERT INTO quotation_tiers (product_id, tier_name, min_qty, max_qty, unit_price) VALUES (?, ?, ?, ?, ?)`, [qp1, '量产', 5000, null, 7.2]);
    const qp2 = DB.insertId(`INSERT INTO quotation_products (item_no, product_name, product_size, material_process, supply_cycle, carton_spec, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['81000006', '营养成分标签', '60*40mm', '热敏纸', '7天', '400*300*200mm(500入)', 'PCS', now]);
    DB.execute(`INSERT INTO quotation_tiers (product_id, tier_name, min_qty, max_qty, unit_price) VALUES (?, ?, ?, ?, ?)`, [qp2, '标准', 500, null, 0.45]);

    // 示例合同供应商
    DB.execute(`INSERT INTO contract_suppliers (short_name, full_name, legal_rep, address, contact, auth_rep, phone, fax, payment_days, payment_method, account_name, bank, account, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['深圳包装', '深圳市包装材料有限公司', '刘某', '深圳市龙岗区某路1号', '张经理', '张某', '13800138001', '0755-1234567', '90', '电汇', '深圳市包装材料有限公司', '中国银行深圳分行', '1234567890123456', '', now]);

    // 示例三方比价
    DB.execute(`INSERT INTO third_party_records (product_name, item_no, material_structure, spec_size, quantity_tier, supplier1, supplier2, supplier3, final_supplier, price1_tier, price2_tier, price3_tier, apply_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['彩盒-保健品礼盒', '81000001', '灰板纸+铜版纸', '200*150*80mm', '5000', '深圳包装材料有限公司', '广州印刷科技有限公司', '浙江塑料制品厂', '广州印刷科技有限公司', '8.80', '7.20', '9.50', DB.today(), now]);

    // 示例BOM
    DB.execute(`INSERT INTO product_bom (finished_project_no, product_name, spec, retail_price, brand, material_project_no, material_name, quantity, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['F001', '保健品礼盒装', '200*150*80mm', 128, '同仁堂', '81000001', '彩盒', 1, 'PCS', now]);
    DB.execute(`INSERT INTO product_bom (finished_project_no, product_name, spec, retail_price, brand, material_project_no, material_name, quantity, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['F001', '保健品礼盒装', '200*150*80mm', 128, '同仁堂', '81000005', '标签', 2, 'PCS', now]);

    // 示例报价供方
    DB.execute(`INSERT INTO quotation_suppliers (supplier_name, contact_person, phone, address, quote_date, quote_validity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['深圳包装材料有限公司', '张经理', '13800138001', '深圳市龙岗区', DB.today(), '180天', now]);
    DB.execute(`INSERT INTO quotation_suppliers (supplier_name, contact_person, phone, address, quote_date, quote_validity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['广州印刷科技有限公司', '李总', '13800138002', '广州市番禺区', DB.today(), '90天', now]);
  },

  // ═══ CRUD API ═══
  getSettings() {
    const rows = DB.queryAll('SELECT key, value FROM settings');
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    return obj;
  },
  updateSetting(key, value) { DB.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]); },

  // 采购垫付
  getPurchases(archived = 0) {
    const ps = DB.queryAll('SELECT * FROM purchase WHERE archived = ? ORDER BY date DESC', [archived]);
    return ps.map(p => ({ ...p, items: DB.queryAll('SELECT * FROM purchase_items WHERE purchase_id = ?', [p.id]), total: (DB.queryOne('SELECT COALESCE(SUM(total),0) as s FROM purchase_items WHERE purchase_id = ?', [p.id]) || {}).s || 0 }));
  },
  getPurchase(id) {
    const p = DB.queryOne('SELECT * FROM purchase WHERE id = ?', [id]);
    if (p) { p.items = DB.queryAll('SELECT * FROM purchase_items WHERE purchase_id = ?', [id]); p.total = (DB.queryOne('SELECT COALESCE(SUM(total),0) as s FROM purchase_items WHERE purchase_id = ?', [id]) || {}).s || 0; }
    return p;
  },
  savePurchase(data, items) {
    const id = DB.insertId('INSERT INTO purchase (date, project, handler, payment_method, invoice_status, reimbursement_status, remark, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)', [data.date, data.project, data.handler, data.payment_method, data.invoice_status, data.reimbursement_status, data.remark || '', DB.now()]);
    (items || []).forEach(it => DB.execute('INSERT INTO purchase_items (purchase_id, name, spec, quantity, unit_price, supplier, total) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, it.name, it.spec, it.quantity, it.unit_price, it.supplier, it.total]));
    return id;
  },
  updatePurchase(id, data, items) {
    DB.execute('UPDATE purchase SET date=?, project=?, handler=?, payment_method=?, invoice_status=?, reimbursement_status=?, remark=? WHERE id=?', [data.date, data.project, data.handler, data.payment_method, data.invoice_status, data.reimbursement_status, data.remark || '', id]);
    DB.execute('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);
    (items || []).forEach(it => DB.execute('INSERT INTO purchase_items (purchase_id, name, spec, quantity, unit_price, supplier, total) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, it.name, it.spec, it.quantity, it.unit_price, it.supplier, it.total]));
  },
  deletePurchase(id) { DB.execute('DELETE FROM purchase_items WHERE purchase_id = ?', [id]); DB.execute('DELETE FROM purchase WHERE id = ?', [id]); },
  archivePurchase(id, v = true) { DB.execute('UPDATE purchase SET archived = ? WHERE id = ?', [v ? 1 : 0, id]); },

  // 供应商
  getSuppliers(cat, kw, status) {
    let sql = 'SELECT * FROM suppliers WHERE 1=1'; const p = [];
    if (cat) { sql += ' AND category = ?'; p.push(cat); }
    if (kw) { sql += ' AND (name LIKE ? OR contact_person LIKE ? OR main_product LIKE ?)'; p.push(`%${kw}%`, `%${kw}%`, `%${kw}%`); }
    if (status) { sql += ' AND cooperation_status = ?'; p.push(status); }
    sql += ' ORDER BY id DESC'; return DB.queryAll(sql, p);
  },
  getSupplier(id) { return DB.queryOne('SELECT * FROM suppliers WHERE id = ?', [id]); },
  saveSupplier(d) { return DB.insertId('INSERT INTO suppliers (name, cooperation_status, category, main_product, contact_person, phone, wechat, quote_status, sample_status, payment_method, invoice_type, tax_rate, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.name, d.cooperation_status || '接洽中', d.category || '', d.main_product || '', d.contact_person || '', d.phone || '', d.wechat || '', d.quote_status || '', d.sample_status || '', d.payment_method || '', d.invoice_type || '', d.tax_rate || '', d.remark || '', DB.now()]); },
  updateSupplier(id, d) { DB.execute('UPDATE suppliers SET name=?, cooperation_status=?, category=?, main_product=?, contact_person=?, phone=?, wechat=?, quote_status=?, sample_status=?, payment_method=?, invoice_type=?, tax_rate=?, remark=? WHERE id=?', [d.name, d.cooperation_status || '接洽中', d.category || '', d.main_product || '', d.contact_person || '', d.phone || '', d.wechat || '', d.quote_status || '', d.sample_status || '', d.payment_method || '', d.invoice_type || '', d.tax_rate || '', d.remark || '', id]); },
  deleteSupplier(id) { DB.execute('DELETE FROM suppliers WHERE id = ?', [id]); },

  // 催款
  getCollections(kw, sd, ed) {
    let sql = 'SELECT * FROM collection_reminders WHERE 1=1'; const p = [];
    if (kw) { sql += ' AND (supplier_name LIKE ? OR contact_person LIKE ? OR wechat LIKE ?)'; p.push(`%${kw}%`, `%${kw}%`, `%${kw}%`); }
    if (sd) { sql += ' AND reminder_date >= ?'; p.push(sd); }
    if (ed) { sql += ' AND reminder_date <= ?'; p.push(ed); }
    sql += ' ORDER BY reminder_date DESC'; return DB.queryAll(sql, p);
  },
  saveCollection(d) { return DB.insertId('INSERT INTO collection_reminders (supplier_name, contact_person, wechat, reminder_date, amount_due, notify_internal, notify_manager, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.supplier_name, d.contact_person || '', d.wechat || '', d.reminder_date, d.amount_due, d.notify_internal || 0, d.notify_manager || 0, d.remark || '', DB.now()]); },
  updateCollection(id, d) { DB.execute('UPDATE collection_reminders SET supplier_name=?, contact_person=?, wechat=?, reminder_date=?, amount_due=?, notify_internal=?, notify_manager=?, remark=? WHERE id=?', [d.supplier_name, d.contact_person || '', d.wechat || '', d.reminder_date, d.amount_due, d.notify_internal || 0, d.notify_manager || 0, d.remark || '', id]); },
  deleteCollection(id) { DB.execute('DELETE FROM collection_reminders WHERE id = ?', [id]); },

  // 备忘录
  getMemos(kw, project, status, archived = 0) {
    let sql = 'SELECT * FROM memos WHERE archived = ?'; const p = [archived];
    if (kw) { sql += ' AND (content LIKE ? OR handler LIKE ? OR remark LIKE ?)'; p.push(`%${kw}%`, `%${kw}%`, `%${kw}%`); }
    if (project) { sql += ' AND project = ?'; p.push(project); }
    if (status) { sql += ' AND status = ?'; p.push(status); }
    sql += ' ORDER BY date DESC'; return DB.queryAll(sql, p);
  },
  saveMemo(d) { return DB.insertId('INSERT INTO memos (date, project, handler, content, deadline, status, remark, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)', [d.date, d.project, d.handler, d.content, d.deadline, d.status || '待处理', d.remark || '', DB.now()]); },
  updateMemo(id, d) { DB.execute('UPDATE memos SET date=?, project=?, handler=?, content=?, deadline=?, status=?, remark=? WHERE id=?', [d.date, d.project, d.handler, d.content, d.deadline, d.status || '待处理', d.remark || '', id]); },
  deleteMemo(id) { DB.execute('DELETE FROM memos WHERE id = ?', [id]); },
  archiveMemo(id, v) { DB.execute('UPDATE memos SET archived = ? WHERE id = ?', [v ? 1 : 0, id]); },

  // 包材下单
  getPackagingOrders(filters = {}) {
    let sql = 'SELECT * FROM packaging_orders WHERE 1=1'; const p = [];
    if (filters.archived !== undefined) { sql += ' AND COALESCE(archived,0) = ?'; p.push(filters.archived); }
    if (filters.keyword) { sql += ' AND (material_name LIKE ? OR order_factory LIKE ? OR project_no LIKE ?)'; p.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`); }
    sql += ' ORDER BY id DESC'; return DB.queryAll(sql, p);
  },
  savePackagingOrder(d) { return DB.insertId('INSERT INTO packaging_orders (material_name, project, project_no, order_factory, compare_price, compare_date, compare_remark, contract_status, contract_remark, notify_date, expected_delivery_date, notify_remark, production_cycle, expected_ship_date, production_remark, ship_date, ship_method, tracking_no, expected_arrival, notify_warehouse, amount, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)', [d.material_name, d.project || '', d.project_no || '', d.order_factory || '', d.compare_price || 0, d.compare_date || '', d.compare_remark || '', d.contract_status || '', d.contract_remark || '', d.notify_date || '', d.expected_delivery_date || '', d.notify_remark || '', d.production_cycle || '', d.expected_ship_date || '', d.production_remark || '', d.ship_date || '', d.ship_method || '', d.tracking_no || '', d.expected_arrival || '', d.notify_warehouse || 0, d.amount || 0, DB.now()]); },
  updatePackagingOrder(id, d) {
    const fields = ['material_name','project','project_no','order_factory','compare_price','compare_date','compare_remark','contract_status','contract_remark','notify_date','expected_delivery_date','notify_remark','production_cycle','expected_ship_date','production_remark','ship_date','ship_method','tracking_no','expected_arrival','notify_warehouse','amount','archived'];
    const sets = []; const vals = [];
    fields.forEach(f => { if (d[f] !== undefined) { sets.push(`${f}=?`); vals.push(d[f]); } });
    if (sets.length === 0) return; vals.push(id);
    DB.execute(`UPDATE packaging_orders SET ${sets.join(', ')} WHERE id=?`, vals);
  },
  deletePackagingOrder(id) { DB.execute('DELETE FROM packaging_orders WHERE id = ?', [id]); },
  archivePackagingOrder(id) { DB.execute('UPDATE packaging_orders SET archived = 1 WHERE id = ?', [id]); },

  // 报价
  getQuotationProducts() {
    const ps = DB.queryAll('SELECT * FROM quotation_products ORDER BY id');
    return ps.map(p => ({ ...p, tiers: DB.queryAll('SELECT * FROM quotation_tiers WHERE product_id = ? ORDER BY min_qty', [p.id]) }));
  },
  saveQuotationProduct(d) { return DB.insertId('INSERT INTO quotation_products (item_no, product_name, product_size, material_process, supply_cycle, carton_spec, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [d.item_no || '', d.product_name, d.product_size || '', d.material_process || '', d.supply_cycle || '', d.carton_spec || '', d.unit || 'PCS', DB.now()]); },
  updateQuotationProduct(id, d) { DB.execute('UPDATE quotation_products SET item_no=?, product_name=?, product_size=?, material_process=?, supply_cycle=?, carton_spec=?, unit=? WHERE id=?', [d.item_no || '', d.product_name, d.product_size || '', d.material_process || '', d.supply_cycle || '', d.carton_spec || '', d.unit || 'PCS', id]); },
  deleteQuotationProduct(id) { DB.execute('DELETE FROM quotation_tiers WHERE product_id = ?', [id]); DB.execute('DELETE FROM quotation_products WHERE id = ?', [id]); },
  saveQuotationTier(d) { return DB.insertId('INSERT INTO quotation_tiers (product_id, tier_name, min_qty, max_qty, unit_price) VALUES (?, ?, ?, ?, ?)', [d.product_id, d.tier_name || '', d.min_qty, d.max_qty, d.unit_price]); },
  deleteQuotationTiers(pid) { DB.execute('DELETE FROM quotation_tiers WHERE product_id = ?', [pid]); },
  getQuotationConfig() { return DB.queryOne('SELECT * FROM quotation_config WHERE id = 1'); },
  updateQuotationConfig(d) { DB.execute('UPDATE quotation_config SET buyer_name=?, buyer_contact=?, buyer_phone=?, buyer_address=?, payment_terms=?, transport_method=?, delivery_docs=?, quote_requirement=?, quote_template_note=?, footer_note=? WHERE id=1', [d.buyer_name || '', d.buyer_contact || '', d.buyer_phone || '', d.buyer_address || '', d.payment_terms || '', d.transport_method || '', d.delivery_docs || '', d.quote_requirement || '', d.quote_template_note || '', d.footer_note || '']); },
  getAllQuotationSuppliers() { return DB.queryAll('SELECT * FROM quotation_suppliers ORDER BY id'); },
  saveQuotationSupplierRecord(d) { return DB.insertId('INSERT INTO quotation_suppliers (supplier_name, contact_person, phone, address, quote_date, quote_validity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [d.supplier_name, d.contact_person || '', d.phone || '', d.address || '', d.quote_date || '', d.quote_validity || '', DB.now()]); },
  deleteQuotationSupplierRecord(id) { DB.execute('DELETE FROM quotation_suppliers WHERE id = ?', [id]); },

  // 合同
  getContractSuppliers() { return DB.queryAll('SELECT * FROM contract_suppliers ORDER BY id'); },
  getContractPartyA() { return DB.queryOne('SELECT * FROM contract_party_a WHERE id = 1'); },
  saveContractSupplier(d) { return DB.insertId('INSERT INTO contract_suppliers (short_name, full_name, legal_rep, address, contact, auth_rep, phone, fax, payment_days, payment_method, account_name, bank, account, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.short_name||'', d.full_name||'', d.legal_rep||'', d.address||'', d.contact||'', d.auth_rep||'', d.phone||'', d.fax||'', d.payment_days||'90', d.payment_method||'电汇', d.account_name||'', d.bank||'', d.account||'', d.remark||'', DB.now()]); },
  updateContractSupplier(id, d) { DB.execute('UPDATE contract_suppliers SET short_name=?, full_name=?, legal_rep=?, address=?, contact=?, auth_rep=?, phone=?, fax=?, payment_days=?, payment_method=?, account_name=?, bank=?, account=?, remark=? WHERE id=?', [d.short_name||'', d.full_name||'', d.legal_rep||'', d.address||'', d.contact||'', d.auth_rep||'', d.phone||'', d.fax||'', d.payment_days||'90', d.payment_method||'电汇', d.account_name||'', d.bank||'', d.account||'', d.remark||'', id]); },
  deleteContractSupplier(id) { DB.execute('DELETE FROM contract_suppliers WHERE id = ?', [id]); },
  saveContractPartyA(d) { DB.execute('UPDATE contract_party_a SET company_name=?, legal_rep=?, address=?, contact=?, phone=? WHERE id=1', [d.company_name||'', d.legal_rep||'', d.address||'', d.contact||'', d.phone||'']); },
  getContractProducts() { return DB.queryAll('SELECT * FROM contract_products ORDER BY id DESC'); },
  saveContractProduct(d) { return DB.insertId('INSERT INTO contract_products (contract_no, product_name, project_no, material_structure, spec, unit, quantity, unit_price, amount, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.contract_no||'', d.product_name||'', d.project_no||'', d.material_structure||'', d.spec||'', d.unit||'', d.quantity||0, d.unit_price||0, d.amount||0, d.remark||'', DB.now()]); },
  deleteContractProduct(id) { DB.execute('DELETE FROM contract_products WHERE id = ?', [id]); },

  // 三方比价
  getThirdPartyRecords() { return DB.queryAll('SELECT * FROM third_party_records ORDER BY id DESC'); },
  saveThirdPartyRecord(d) { return DB.insertId('INSERT INTO third_party_records (product_name, item_no, material_structure, spec_size, quantity_tier, supplier1, supplier2, supplier3, final_supplier, price1_tier, price2_tier, price3_tier, apply_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.product_name||'', d.item_no||'', d.material_structure||'', d.spec_size||'', d.quantity_tier||'', d.supplier1||'', d.supplier2||'', d.supplier3||'', d.final_supplier||'', d.price1_tier||'', d.price2_tier||'', d.price3_tier||'', DB.today(), DB.now()]); },
  updateThirdPartyRecord(id, d) { DB.execute('UPDATE third_party_records SET product_name=?, item_no=?, material_structure=?, spec_size=?, quantity_tier=?, supplier1=?, supplier2=?, supplier3=?, final_supplier=?, price1_tier=?, price2_tier=?, price3_tier=?, updated_at=? WHERE id=?', [d.product_name||'', d.item_no||'', d.material_structure||'', d.spec_size||'', d.quantity_tier||'', d.supplier1||'', d.supplier2||'', d.supplier3||'', d.final_supplier||'', d.price1_tier||'', d.price2_tier||'', d.price3_tier||'', DB.now(), id]); },
  deleteThirdPartyRecord(id) { DB.execute('DELETE FROM third_party_records WHERE id = ?', [id]); },

  // 计划
  getPlanRecords(archived = 0) { return DB.queryAll('SELECT * FROM plan_records WHERE archived = ? ORDER BY id DESC', [archived]); },
  savePlanRecord(d) { return DB.insertId('INSERT INTO plan_records (approval_no, item_seq, item_no, material_name, spec, quantity, unit, unit_price, amount, expected_delivery, remark, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)', [d.approval_no||'', d.item_seq||'', d.item_no||'', d.material_name||'', d.spec||'', d.quantity||0, d.unit||'', d.unit_price||0, d.amount||0, d.expected_delivery||'', d.remark||'', DB.now()]); },
  updatePlanRecord(id, d) { DB.execute('UPDATE plan_records SET approval_no=?, item_seq=?, item_no=?, material_name=?, spec=?, quantity=?, unit=?, unit_price=?, amount=?, expected_delivery=?, remark=? WHERE id=?', [d.approval_no||'', d.item_seq||'', d.item_no||'', d.material_name||'', d.spec||'', d.quantity||0, d.unit||'', d.unit_price||0, d.amount||0, d.expected_delivery||'', d.remark||'', id]); },
  deletePlanRecord(id) { DB.execute('DELETE FROM plan_records WHERE id = ?', [id]); },
  archivePlanRecord(id) { DB.execute('UPDATE plan_records SET archived = 1 WHERE id = ?', [id]); },

  // BOM
  getProductBOM(filters = {}) {
    let sql = 'SELECT * FROM product_bom WHERE 1=1'; const p = [];
    if (filters.keyword) { sql += ' AND (product_name LIKE ? OR material_name LIKE ? OR finished_project_no LIKE ? OR material_project_no LIKE ?)'; p.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`); }
    sql += ' ORDER BY id DESC'; return DB.queryAll(sql, p);
  },
  saveProductBOMBatch(rows) { rows.forEach(r => DB.execute('INSERT INTO product_bom (finished_project_no, product_name, spec, retail_price, brand, material_project_no, material_name, quantity, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [r.finished_project_no||'', r.product_name||'', r.spec||'', r.retail_price||0, r.brand||'', r.material_project_no||'', r.material_name||'', r.quantity||0, r.unit||'', DB.now()])); },
  deleteProductBOM(id) { DB.execute('DELETE FROM product_bom WHERE id = ?', [id]); },

  // 物料台账
  getMaterialLedger(filters = {}) {
    let sql = 'SELECT * FROM material_ledger WHERE 1=1'; const p = [];
    if (filters.year) { sql += ' AND year = ?'; p.push(filters.year); }
    if (filters.supplier) { sql += ' AND supplier LIKE ?'; p.push(`%${filters.supplier}%`); }
    if (filters.material_name) { sql += ' AND material_name LIKE ?'; p.push(`%${filters.material_name}%`); }
    if (filters.item_no) { sql += ' AND item_no = ?'; p.push(filters.item_no); }
    sql += ' ORDER BY contract_no'; return DB.queryAll(sql, p);
  },
  saveMaterialLedger(rows) { DB.execute('DELETE FROM material_ledger'); rows.forEach(r => DB.execute('INSERT INTO material_ledger (contract_no, supplier, item_no, material_name, quantity, unit, unit_price, amount, year, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [r.contract_no||'', r.supplier||'', r.item_no||'', r.material_name||'', r.quantity||0, r.unit||'', r.unit_price||0, r.amount||0, r.year||'', r.raw_data||''])); },
  clearMaterialLedger() { DB.execute('DELETE FROM material_ledger'); },

  // 库存
  queryInventory(filters = {}) {
    let sql = 'SELECT * FROM inventory WHERE 1=1'; const p = [];
    if (filters.warehouse && filters.warehouse !== 'total') { sql += ' AND warehouse = ?'; p.push(filters.warehouse); }
    if (filters.keyword) { sql += ' AND (item_no LIKE ? OR material_name LIKE ? OR spec LIKE ?)'; p.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`); }
    sql += ' ORDER BY warehouse, item_no, material_name, id DESC LIMIT 10000'; return DB.queryAll(sql, p);
  },
  getInventoryStats(wh) {
    let where = ''; const p = [];
    if (wh && wh !== 'total') { where = 'WHERE warehouse = ?'; p.push(wh); }
    const row = DB.queryOne(`SELECT COUNT(*) as rowCount, COALESCE(SUM(quantity),0) as totalQty, COALESCE(SUM(amount),0) as totalAmount FROM inventory ${where}`, p) || { rowCount: 0, totalQty: 0, totalAmount: 0 };
    const byW = DB.queryAll('SELECT warehouse, COUNT(*) as rowCount, COALESCE(SUM(quantity),0) as totalQty, COALESCE(SUM(amount),0) as totalAmount FROM inventory GROUP BY warehouse');
    const nameMap = { wh1: '1号库', wh5: '5号库', pkg: '包材库', raw: '原料库' };
    return { ...row, byWarehouse: byW.map(r => ({ ...r, name: nameMap[r.warehouse] || r.warehouse })) };
  },
  clearInventory(wh) { if (!wh || wh === 'total') { DB.execute('DELETE FROM inventory'); DB.execute('DELETE FROM import_history'); } else DB.execute('DELETE FROM inventory WHERE warehouse = ?', [wh]); },
  importInventory(rows) { rows.forEach(r => DB.execute('INSERT INTO inventory (warehouse, item_no, material_name, spec, unit, batch, quantity, location, unit_price, amount, remark, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [r.warehouse||'', r.item_no||'', r.material_name||'', r.spec||'', r.unit||'', r.batch||'', r.quantity||0, r.location||'', r.unit_price||0, r.amount||0, r.remark||'', DB.now()])); DB.save(); },

  // 项目
  getProjects() { return DB.queryAll('SELECT * FROM projects ORDER BY name'); },
  addProject(name) { DB.execute('INSERT OR IGNORE INTO projects (name) VALUES (?)', [name]); },

  // 差旅
  getTravels(archived = 0) {
    const ts = DB.queryAll('SELECT * FROM travel WHERE archived = ? ORDER BY start_date DESC', [archived]);
    return ts.map(t => { const tr = DB.queryAll('SELECT * FROM travel_transport WHERE travel_id = ?', [t.id]); const ho = DB.queryAll('SELECT * FROM travel_hotel WHERE travel_id = ?', [t.id]); return { ...t, transports: tr, hotels: ho, total: tr.reduce((s,r)=>s+(r.amount||0),0) + ho.reduce((s,r)=>s+(r.amount||0),0) }; });
  },
  saveTravel(d, transports, hotels) {
    const id = DB.insertId('INSERT INTO travel (reason, destination, start_date, end_date, duration, handler, invoice_status, reimbursement_status, archived, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)', [d.reason, d.destination, d.start_date, d.end_date, d.duration||0, d.handler, d.invoice_status, d.reimbursement_status, d.remark||'', DB.now()]);
    (transports||[]).forEach(t => DB.execute('INSERT INTO travel_transport (travel_id, transport_type, travel_date, departure, destination, amount) VALUES (?, ?, ?, ?, ?, ?)', [id, t.transport_type, t.travel_date, t.departure, t.destination, t.amount]));
    (hotels||[]).forEach(h => DB.execute('INSERT INTO travel_hotel (travel_id, checkin_date, checkout_date, room_count, amount, invoice_status) VALUES (?, ?, ?, ?, ?, ?)', [id, h.checkin_date, h.checkout_date, h.room_count, h.amount, h.invoice_status||'未开票']));
    return id;
  },
  deleteTravel(id) { DB.execute('DELETE FROM travel_transport WHERE travel_id = ?', [id]); DB.execute('DELETE FROM travel_hotel WHERE travel_id = ?', [id]); DB.execute('DELETE FROM travel WHERE id = ?', [id]); },
};
