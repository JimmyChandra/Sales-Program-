/**
 * ════════════════════════════════════════════════════════════════
 *   PROGRAM PENJUALAN KASIR — Backend (Google Apps Script)
 *   Database: Google Sheets (spreadsheet yang sama dengan script ini)
 * ════════════════════════════════════════════════════════════════
 *
 * CARA PASANG:
 * 1. Buka Google Sheets baru (kosong).
 * 2. Menu Extensions → Apps Script.
 * 3. Hapus semua kode default, paste seluruh isi file ini.
 * 4. Jalankan fungsi `setupSheets` sekali (pilih dari dropdown function
 *    lalu klik Run) untuk membuat semua tab & header otomatis + akun
 *    admin default. Izinkan permission yang diminta Google.
 * 5. Deploy → New deployment → Pilih tipe "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 6. Copy URL deployment (.../exec), paste ke halaman Pengaturan di
 *    aplikasi web (index.html) atau ke variabel APP_URL di file itu.
 *
 * AKUN ADMIN DEFAULT setelah setupSheets dijalankan:
 *      Username: admin
 *      Password: admin123
 *   -> Segera login dan ganti password lewat menu Pengguna.
 */

const SHEET_USERS   = 'Users';
const SHEET_PRODUK  = 'Produk';
const SHEET_TRX     = 'Transaksi';
const SHEET_TRXITEM = 'DetailTransaksi';
const SHEET_LOG     = 'LogAktivitas';

// ─────────────────────────────────────────────────────────────────
// SETUP AWAL
// ─────────────────────────────────────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const defs = {
    [SHEET_USERS]:   ['id','username','password','role','nama','aktif','created_at'],
    [SHEET_PRODUK]:  ['id','barcode','nama','tipe','harga_jual','harga_beli','stok','satuan','created_at','updated_at'],
    [SHEET_TRX]:     ['id','no_struk','tanggal','kasir','subtotal','ppn','total','bayar','kembalian','metode','created_at'],
    [SHEET_TRXITEM]: ['id','transaksi_id','produk_id','barcode','nama','harga','qty','subtotal'],
    [SHEET_LOG]:     ['waktu','user','aksi','keterangan'],
  };

  Object.keys(defs).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = defs[name];
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });

  // Hapus sheet default "Sheet1" jika kosong dan masih ada
  const def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() <= 1 && ss.getSheets().length > 1) ss.deleteSheet(def);

  // Seed akun admin default (jika Users masih kosong)
  const shUsers = ss.getSheetByName(SHEET_USERS);
  if (shUsers.getLastRow() <= 1) {
    shUsers.appendRow([1, 'admin', hashPw_('admin123'), 'admin', 'Administrator', true, nowStr_()]);
    shUsers.appendRow([2, 'kasir', hashPw_('kasir123'), 'kasir', 'Kasir 1', true, nowStr_()]);
  }

  // Seed beberapa produk contoh (jika Produk masih kosong)
  const shProd = ss.getSheetByName(SHEET_PRODUK);
  if (shProd.getLastRow() <= 1) {
    const seeds = [
      [1,'8991002101012','Aqua 600ml','Minuman',4000,2500,50,'botol'],
      [2,'8991002101234','Indomie Goreng','Makanan',3500,2500,100,'bungkus'],
      [3,'8991002105678','Teh Botol Sosro','Minuman',5000,3500,60,'botol'],
      [4,'8991002109876','Biscuit Roma','Makanan',8500,6000,25,'bungkus'],
    ];
    seeds.forEach(s => shProd.appendRow([...s, nowStr_(), nowStr_()]));
  }

  SpreadsheetApp.flush();
  return 'Setup selesai! Akun admin: admin / admin123';
}

// ─────────────────────────────────────────────────────────────────
// UTIL
// ─────────────────────────────────────────────────────────────────
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(name) { return ss_().getSheetByName(name); }
function nowStr_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'); }

function hashPw_(pw) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pw, Utilities.Charset.UTF_8);
  return raw.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2,'0')).join('');
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(c => c !== '' && c !== null))
    .map(row => {
      const o = {};
      headers.forEach((h,i) => o[h] = row[i]);
      return o;
    });
}

function nextId_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;
  const vals = sheet.getRange(2,1,lastRow-1,1).getValues();
  const ids = vals.map(r => Number(r[0])).filter(n => !isNaN(n));
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function findRowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const vals = sheet.getRange(2,1,lastRow-1,1).getValues();
  for (let i=0;i<vals.length;i++) if (Number(vals[i][0]) === Number(id)) return i+2;
  return -1;
}

function logAktivitas_(user, aksi, ket) {
  try { sh_(SHEET_LOG).appendRow([nowStr_(), user || '-', aksi, ket]); } catch(e) {}
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────────
// ENTRY POINTS
// ─────────────────────────────────────────────────────────────────
function doGet(e) {
  return json_({ ok: true, message: 'Program Penjualan Kasir API aktif' });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok:false, error:'Payload tidak valid' }); }

  const action = body.action;
  try {
    if (action !== 'ping' && action !== 'login') {
      const auth = authorize_(body, action);
      if (!auth.ok) return json_(auth);
      body.user = auth.user.username;
    }
    switch (action) {
      case 'ping':            return json_({ ok:true, message:'pong' });
      case 'login':            return json_(apiLogin_(body));
      case 'getProduk':        return json_({ ok:true, data: sheetToObjects_(sh_(SHEET_PRODUK)) });
      case 'findByBarcode':    return json_(apiFindByBarcode_(body));
      case 'addProduk':        return json_(apiAddProduk_(body));
      case 'updateProduk':     return json_(apiUpdateProduk_(body));
      case 'deleteProduk':     return json_(apiDeleteProduk_(body));
      case 'createTransaksi':  return json_(apiCreateTransaksi_(body));
      case 'getTransaksi':     return json_({ ok:true, data: apiGetTransaksi_(body) });
      case 'getDetailTransaksi': return json_({ ok:true, data: apiGetDetail_(body) });
      case 'getLaporan':       return json_(apiLaporan_(body));
      case 'getUsers':         return json_(apiGetUsers_(body));
      case 'addUser':          return json_(apiAddUser_(body));
      case 'updateUser':       return json_(apiUpdateUser_(body));
      case 'deleteUser':       return json_(apiDeleteUser_(body));
      default: return json_({ ok:false, error:'Action tidak dikenal: ' + action });
    }
  } catch (err) {
    return json_({ ok:false, error: err.message || String(err) });
  }
}

// ─────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────
function apiLogin_(body) {
  const { username, password } = body;
  if (!username || !password) return { ok:false, error:'Username & password wajib diisi' };
  const users = sheetToObjects_(sh_(SHEET_USERS));
  const u = users.find(x => String(x.username).toLowerCase() === String(username).toLowerCase());
  if (!u) return { ok:false, error:'Username tidak ditemukan' };
  if (u.aktif === false) return { ok:false, error:'Akun dinonaktifkan' };
  if (u.password !== hashPw_(password)) return { ok:false, error:'Password salah' };
  logAktivitas_(username, 'login', 'Login berhasil sebagai ' + u.role);
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('session:' + token, JSON.stringify({ id:u.id, username:u.username, role:u.role, nama:u.nama }), 21600);
  return { ok:true, token, user: { id:u.id, username:u.username, role:u.role, nama:u.nama } };
}

function authorize_(body, action) {
  const token = String(body.token || '');
  const raw = token && CacheService.getScriptCache().get('session:' + token);
  if (!raw) return { ok:false, error:'Sesi berakhir. Silakan login kembali.' };
  const user = JSON.parse(raw);
  const adminOnly = ['addProduk','updateProduk','deleteProduk','getUsers','addUser','updateUser','deleteUser'];
  if (adminOnly.indexOf(action) >= 0 && user.role !== 'admin') return { ok:false, error:'Aksi ini hanya untuk admin.' };
  return { ok:true, user };
}

// ─────────────────────────────────────────────────────────────────
// PRODUK
// ─────────────────────────────────────────────────────────────────
function apiFindByBarcode_(body) {
  const produk = sheetToObjects_(sh_(SHEET_PRODUK));
  const p = produk.find(x => String(x.barcode) === String(body.barcode));
  return p ? { ok:true, data:p } : { ok:false, error:'Produk dengan barcode tsb tidak ditemukan' };
}

function apiAddProduk_(body) {
  const sh = sh_(SHEET_PRODUK);
  const d = body.produk || body;
  const id = nextId_(sh);
  sh.appendRow([id, d.barcode||'', d.nama, d.tipe||'Umum', Number(d.harga_jual)||0, Number(d.harga_beli)||0, Number(d.stok)||0, d.satuan||'pcs', nowStr_(), nowStr_()]);
  logAktivitas_(body.user, 'tambah_produk', d.nama);
  return { ok:true, id };
}

function apiUpdateProduk_(body) {
  const sh = sh_(SHEET_PRODUK);
  const d = body.produk || body;
  const row = findRowById_(sh, d.id);
  if (row < 0) return { ok:false, error:'Produk tidak ditemukan' };
  sh.getRange(row,2,1,8).setValues([[d.barcode||'', d.nama, d.tipe||'Umum', Number(d.harga_jual)||0, Number(d.harga_beli)||0, Number(d.stok)||0, d.satuan||'pcs', sh.getRange(row,9).getValue()]]);
  sh.getRange(row,10).setValue(nowStr_());
  logAktivitas_(body.user, 'edit_produk', d.nama);
  return { ok:true };
}

function apiDeleteProduk_(body) {
  const sh = sh_(SHEET_PRODUK);
  const row = findRowById_(sh, body.id);
  if (row < 0) return { ok:false, error:'Produk tidak ditemukan' };
  sh.deleteRow(row);
  logAktivitas_(body.user, 'hapus_produk', 'ID ' + body.id);
  return { ok:true };
}

// ─────────────────────────────────────────────────────────────────
// TRANSAKSI (PENJUALAN)
// ─────────────────────────────────────────────────────────────────
function apiCreateTransaksi_(body) {
  const header = body.header;
  const items = body.items || [];
  if (!items.length) return { ok:false, error:'Keranjang kosong' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
  const shTrx  = sh_(SHEET_TRX);
  const shItem = sh_(SHEET_TRXITEM);
  const shProd = sh_(SHEET_PRODUK);

  // Harga dan stok selalu diverifikasi dari database server, bukan dari browser.
  const normalized = [];
  let subtotal = 0;
  items.forEach(it => {
    const row = findRowById_(shProd, it.produk_id);
    if (row < 0) throw new Error('Produk tidak ditemukan: ' + it.produk_id);
    const p = shProd.getRange(row,1,1,10).getValues()[0];
    const qty = Math.floor(Number(it.qty));
    const price = Number(p[4]);
    if (!Number.isFinite(qty) || qty < 1) throw new Error('Jumlah produk tidak valid.');
    if (Number(p[6]) < qty) throw new Error('Stok tidak cukup untuk ' + p[2]);
    const lineTotal = price * qty;
    subtotal += lineTotal;
    normalized.push({ row, id:p[0], barcode:p[1], nama:p[2], harga:price, qty, subtotal:lineTotal });
  });
  const total = subtotal; // Penjualan tidak mengenakan PPN.
  const bayar = Number(header.bayar);
  if (!Number.isFinite(bayar) || bayar < total) throw new Error('Pembayaran kurang dari total.');

  const id = nextId_(shTrx);
  const noStruk = header.no_struk || ('TRX' + new Date().getTime());
  shTrx.appendRow([id, noStruk, nowStr_(), body.user||'-', subtotal, 0, total, bayar, Math.max(0,bayar-total), header.metode||'Tunai', nowStr_()]);

  normalized.forEach(it => {
    const itemId = nextId_(shItem);
    shItem.appendRow([itemId, id, it.id, it.barcode||'', it.nama, it.harga, it.qty, it.subtotal]);
    shProd.getRange(it.row,7).setValue(Number(shProd.getRange(it.row,7).getValue()) - it.qty);
    shProd.getRange(it.row,10).setValue(nowStr_());
  });

  logAktivitas_(body.user, 'penjualan', `Struk ${noStruk} total ${total}`);
  return { ok:true, id, no_struk: noStruk };
  } finally {
    lock.releaseLock();
  }
}

function apiGetTransaksi_(body) {
  let data = sheetToObjects_(sh_(SHEET_TRX));
  if (body.dari) data = data.filter(t => String(t.tanggal) >= body.dari);
  if (body.sampai) data = data.filter(t => String(t.tanggal) <= body.sampai + ' 23:59:59');
  return data.sort((a,b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function apiGetDetail_(body) {
  const data = sheetToObjects_(sh_(SHEET_TRXITEM));
  return data.filter(x => Number(x.transaksi_id) === Number(body.transaksi_id));
}

// ─────────────────────────────────────────────────────────────────
// LAPORAN
// ─────────────────────────────────────────────────────────────────
function apiLaporan_(body) {
  const trx = sheetToObjects_(sh_(SHEET_TRX));
  const items = sheetToObjects_(sh_(SHEET_TRXITEM));
  const produk = sheetToObjects_(sh_(SHEET_PRODUK));

  const now = new Date();
  const todayStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');

  const startOfWeek = new Date(now);
  const day = (startOfWeek.getDay() + 6) % 7; // senin=0
  startOfWeek.setDate(startOfWeek.getDate() - day);
  const weekStr = Utilities.formatDate(startOfWeek, 'Asia/Jakarta', 'yyyy-MM-dd');

  const monthStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM');

  const sum = arr => arr.reduce((s,t) => s + Number(t.total||0), 0);

  const harian   = trx.filter(t => String(t.tanggal).slice(0,10) === todayStr);
  const mingguan = trx.filter(t => String(t.tanggal).slice(0,10) >= weekStr);
  const bulanan  = trx.filter(t => String(t.tanggal).slice(0,7) === monthStr);

  // Produk terlaris (30 transaksi terakhir atau sesuai filter bulan)
  const itemMap = {};
  items.forEach(it => {
    const trxRef = trx.find(t => Number(t.id) === Number(it.transaksi_id));
    if (!trxRef || String(trxRef.tanggal).slice(0,7) !== monthStr) return;
    if (!itemMap[it.nama]) itemMap[it.nama] = { nama: it.nama, qty: 0, nominal: 0 };
    itemMap[it.nama].qty += Number(it.qty);
    itemMap[it.nama].nominal += Number(it.subtotal);
  });
  const terlaris = Object.values(itemMap).sort((a,b) => b.qty - a.qty).slice(0,10);

  const stokTipis = produk.filter(p => Number(p.stok) <= 5);

  // Grafik 7 hari terakhir
  const grafik7hari = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const ds = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
    const totalHari = sum(trx.filter(t => String(t.tanggal).slice(0,10) === ds));
    grafik7hari.push({ tanggal: ds, total: totalHari });
  }

  return {
    ok: true,
    harian:   { total: sum(harian),   count: harian.length },
    mingguan: { total: sum(mingguan), count: mingguan.length },
    bulanan:  { total: sum(bulanan),  count: bulanan.length },
    terlaris,
    stokTipis,
    grafik7hari,
  };
}

// ─────────────────────────────────────────────────────────────────
// USERS (ADMIN)
// ─────────────────────────────────────────────────────────────────
function apiGetUsers_(body) {
  const data = sheetToObjects_(sh_(SHEET_USERS)).map(u => ({ id:u.id, username:u.username, role:u.role, nama:u.nama, aktif:u.aktif }));
  return { ok:true, data };
}

function apiAddUser_(body) {
  const sh = sh_(SHEET_USERS);
  const d = body.userData || body;
  const existing = sheetToObjects_(sh).find(x => String(x.username).toLowerCase() === String(d.username).toLowerCase());
  if (existing) return { ok:false, error:'Username sudah dipakai' };
  const id = nextId_(sh);
  sh.appendRow([id, d.username, hashPw_(d.password), d.role||'kasir', d.nama||d.username, true, nowStr_()]);
  logAktivitas_(body.user, 'tambah_user', d.username);
  return { ok:true, id };
}

function apiUpdateUser_(body) {
  const sh = sh_(SHEET_USERS);
  const d = body.userData || body;
  const row = findRowById_(sh, d.id);
  if (row < 0) return { ok:false, error:'User tidak ditemukan' };
  if (d.password) sh.getRange(row,3).setValue(hashPw_(d.password));
  sh.getRange(row,4).setValue(d.role);
  sh.getRange(row,5).setValue(d.nama);
  sh.getRange(row,6).setValue(d.aktif !== false);
  logAktivitas_(body.user, 'edit_user', d.username||d.id);
  return { ok:true };
}

function apiDeleteUser_(body) {
  const sh = sh_(SHEET_USERS);
  const row = findRowById_(sh, body.id);
  if (row < 0) return { ok:false, error:'User tidak ditemukan' };
  sh.deleteRow(row);
  logAktivitas_(body.user, 'hapus_user', 'ID ' + body.id);
  return { ok:true };
}
