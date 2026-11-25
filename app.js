// ============================================================
// TIỆN ÍCH
// ============================================================
async function apiCall(action, params = {}, method = 'GET') {
  const url = new URL(CONFIG.API_URL);
  url.searchParams.set('token', CONFIG.API_TOKEN);
  
  if (method === 'GET') {
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Lỗi kết nối server');
    return res.json();
  } else {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ token: CONFIG.API_TOKEN, action, ...params })
    });
    if (!res.ok) throw new Error('Lỗi kết nối server');
    return res.json();
  }
}

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
  el.classList.remove('hidden');
  if (type === 'success') setTimeout(() => el.classList.add('hidden'), 4000);
}

// ============================================================
// TAB SWITCHING
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ============================================================
// THÊM KHÁCH HÀNG
// ============================================================
const form = document.getElementById('customer-form');
const btnSave = document.getElementById('btn-save');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (btnSave.disabled) return;
  
  // Lấy dữ liệu và chuyển đổi ngày tháng từ yyyy-mm-dd sang dd/mm/yyyy
  let rawDate = document.getElementById('activationDate').value;
  let formattedDate = '';
  if (rawDate) {
    const parts = rawDate.split('-'); // yyyy-mm-dd
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // dd/mm/yyyy
    }
  }

  const data = {
    customerName: document.getElementById('customerName').value.trim(),
    address: document.getElementById('address').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    productName: document.getElementById('productName').value.trim(),
    productCode: document.getElementById('productCode').value.trim(),
    activationDate: formattedDate, // Đã được format lại thành dd/mm/yyyy
    account: document.getElementById('account').value.trim(),
    password: document.getElementById('password').value,
    securityPassword: document.getElementById('securityPassword').value,
    price: document.getElementById('price').value,
    memoryCard: document.getElementById('memoryCard').value.trim(),
    accessories: document.getElementById('accessories').value.trim(),
    note: document.getElementById('note').value.trim()
  };
  
  if (!data.customerName) return showMessage(document.getElementById('form-message'), 'Vui lòng nhập tên khách hàng', 'error');
  if (!data.phone) return showMessage(document.getElementById('form-message'), 'Vui lòng nhập số điện thoại', 'error');
  if (!data.productName) return showMessage(document.getElementById('form-message'), 'Vui lòng nhập tên sản phẩm', 'error');
  if (!data.productCode) return showMessage(document.getElementById('form-message'), 'Vui lòng nhập mã sản phẩm', 'error');
  if (!data.activationDate) return showMessage(document.getElementById('form-message'), 'Vui lòng chọn ngày kích hoạt', 'error');
  
  btnSave.disabled = true;
  btnSave.textContent = 'Đang lưu...';
  
  try {
    const res = await apiCall('add', { data }, 'POST');
    if (res.success) {
      showMessage(document.getElementById('form-message'), '✅ Đã lưu thông tin khách hàng thành công!', 'success');
      form.reset();
    } else {
      showMessage(document.getElementById('form-message'), `❌ ${res.error}`, 'error');
    }
  } catch (err) {
    showMessage(document.getElementById('form-message'), '❌ Không kết nối được server. Kiểm tra mạng và thử lại.', 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Lưu thông tin';
  }
});

document.getElementById('btn-reset').addEventListener('click', () => form.reset());

// ============================================================
// TÌM KIẾM
// ============================================================
document.getElementById('btn-search').addEventListener('click', async () => {
  const keyword = document.getElementById('search-keyword').value.trim();
  if (!keyword) return alert('Vui lòng nhập từ khóa tìm kiếm!');
  
  const type = document.querySelector('input[name="searchType"]:checked').value;
  const resultsEl = document.getElementById('search-results');
  const detailEl = document.getElementById('detail-panel');
  detailEl.classList.add('hidden');
  resultsEl.innerHTML = '<p>Đang tìm kiếm...</p>';
  
  try {
    const res = await apiCall('search', { keyword, type });
    if (!res.success) throw new Error(res.error);
    
    if (res.results.length === 0) {
      resultsEl.innerHTML = '<p style="color:#6b7280;text-align:center;padding:2rem;">Không tìm thấy kết quả phù hợp.</p>';
      return;
    }
    
    resultsEl.innerHTML = res.results.map(r => `
      <div class="result-card" onclick="showDetail('${r.id}')">
        <h3>${escapeHtml(r.customerName)}</h3>
        <p>📞 ${escapeHtml(r.phone)}</p>
        <p>📦 ${escapeHtml(r.productName)} - ${escapeHtml(r.productCode)}</p>
        <p>📅 Kích hoạt: ${r.activationDate || '-'} | BH: ${r.warranty || '-'}</p>
      </div>
    `).join('');
  } catch (err) {
    resultsEl.innerHTML = `<p style="color:#ef4444;text-align:center;">Lỗi: ${err.message}</p>`;
  }
});

// ============================================================
// HIỂN THỊ CHI TIẾT
// ============================================================
async function showDetail(id) {
  const detailEl = document.getElementById('detail-panel');
  
  if (!id) {
    alert('Lỗi: Không tìm thấy ID của bản ghi này.');
    return;
  }

  detailEl.innerHTML = '<p>Đang tải chi tiết...</p>';
  detailEl.classList.remove('hidden');
  
  try {
    const res = await apiCall('getById', { id });
    if (!res.success) throw new Error(res.error);
    
    const r = res.record;
    detailEl.innerHTML = `
      <h2>Thông tin chi tiết</h2>
      <div class="detail-row"><div class="label">Tên khách hàng:</div><div class="value">${escapeHtml(r.customerName)}</div></div>
      <div class="detail-row"><div class="label">Địa chỉ:</div><div class="value">${escapeHtml(r.address || '-')}</div></div>
      <div class="detail-row"><div class="label">Điện thoại:</div><div class="value">${escapeHtml(r.phone)}</div></div>
      <div class="detail-row"><div class="label">Sản phẩm:</div><div class="value">${escapeHtml(r.productName)}</div></div>
      <div class="detail-row"><div class="label">Mã sản phẩm:</div><div class="value">${escapeHtml(r.productCode)}</div></div>
      <div class="detail-row"><div class="label">Ngày kích hoạt:</div><div class="value">${r.activationDate || '-'}</div></div>
      <div class="detail-row"><div class="label">Bảo hành:</div><div class="value">${r.warranty || '-'}</div></div>
      <div class="detail-row"><div class="label">Tài khoản:</div><div class="value">${escapeHtml(r.account || '-')}</div></div>
      <div class="detail-row">
        <div class="label">Mật khẩu:</div>
        <div class="value"><span id="pass-display">••••••</span> <button onclick="togglePass('${escapeHtml(r.password)}')" style="margin-left:10px;font-size:0.8rem;cursor:pointer;background:none;border:none;color:#1a73e8;">Hiện</button></div>
      </div>
      <div class="detail-row">
        <div class="label">Mật khẩu bảo mật:</div>
        <div class="value"><span id="sec-pass-display">••••••</span> <button onclick="toggleSecPass('${escapeHtml(r.securityPassword)}')" style="margin-left:10px;font-size:0.8rem;cursor:pointer;background:none;border:none;color:#1a73e8;">Hiện</button></div>
      </div>
      <div class="detail-row"><div class="label">Đơn giá:</div><div class="value">${r.price ? Number(r.price).toLocaleString('vi-VN') + ' đ' : '-'}</div></div>
      <div class="detail-row"><div class="label">Thẻ nhớ:</div><div class="value">${escapeHtml(r.memoryCard || '-')}</div></div>
      <div class="detail-row"><div class="label">Phụ kiện:</div><div class="value">${escapeHtml(r.accessories || '-')}</div></div>
      <div class="detail-row"><div class="label">Ghi chú:</div><div class="value">${escapeHtml(r.note || '-')}</div></div>
      
      <div class="detail-actions">
        <button onclick="copyInfo('${r.id}')" style="background:#e5e7eb;color:#374151;">Sao chép</button>
        <button onclick="deleteRecord('${r.id}')" style="background:#fee2e2;color:#991b1b;">Xóa</button>
        <button onclick="document.getElementById('detail-panel').classList.add('hidden')" style="background:#1a73e8;color:white;">Đóng</button>
      </div>
    `;
  } catch (err) {
    detailEl.innerHTML = `<p style="color:#ef4444;">Lỗi: ${err.message}</p>`;
  }
}

function togglePass(pass) {
  const el = document.getElementById('pass-display');
  el.textContent = el.textContent === '••••••' ? (pass || 'Không có') : '••••••';
}

function toggleSecPass(pass) {
  const el = document.getElementById('sec-pass-display');
  el.textContent = el.textContent === '••••••' ? (pass || 'Không có') : '••••••';
}

async function copyInfo(id) {
  try {
    const res = await apiCall('getById', { id });
    if (!res.success) throw new Error(res.error);
    const r = res.record;
    const text = `Tên: ${r.customerName}
SĐT: ${r.phone}
Địa chỉ: ${r.address}
Sản phẩm: ${r.productName} (${r.productCode})
Ngày K.H: ${r.activationDate}
Bảo hành: ${r.warranty}
TK: ${r.account} | MK: ${r.password}
Giá: ${r.price ? Number(r.price).toLocaleString('vi-VN') + 'đ' : '-'}`;
    
    await navigator.clipboard.writeText(text);
    alert('Đã sao chép thông tin vào bộ nhớ tạm!');
  } catch (err) {
    alert('Lỗi sao chép: ' + err.message);
  }
}

async function deleteRecord(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này? Thao tác không thể hoàn tác.')) return;
  
  try {
    const res = await apiCall('delete', { id }, 'POST');
    if (res.success) {
      alert('Đã xóa thành công!');
      document.getElementById('detail-panel').classList.add('hidden');
      document.getElementById('btn-search').click(); 
    } else {
      alert('Lỗi: ' + res.error);
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW reg failed:', err));
}
