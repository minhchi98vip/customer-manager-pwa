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
// LOAD OPTIONS
// ============================================================
async function loadOptions() {
  // Đã chuyển sang nhập tay, không cần tải danh sách từ Google Sheets nữa
  return; 
}

// ============================================================
// THÊM KHÁCH HÀNG
// ============================================================
const form = document.getElementById('customer-form');
const btnSave = document.getElementById('btn-save');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (btnSave.disabled) return; // chống double-click
  
  const data = {
    customerName: document.getElementById('customerName').value.trim(),
    address: document.getElementById('address').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    productName: document.getElementById('productName').value,
    productCode: document.getElementById('productCode').value.trim(),
    activationDate: document.getElementById('activationDate').value, // yyyy-mm-dd
    account: document.getElementById('account').value.trim(),
    password: document.getElementById('password').value,
    securityPassword: document.getElementById('securityPassword').value,
    price: document.getElementById('price').value,
    memoryCard: document.getElementById('memoryCard').value,
    accessories: document.getElementById('accessories').value.trim(),
    note: document.getElementById('note').value.trim()
  };
  
  // Validate
  if (!data.customerName) return showMessage(document.getElementById('form-message'), 'Vui lòng nhập tên khách hàng', 'error');
  if (!data.phone) return showMessage(document.getElementById('form-message'), 'Vui lòng nhập số điện thoại', 'error');
  if (!data.productName) return showMessage(document.getElementById('form-message'), 'Vui lòng chọn sản phẩm', 'error');
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
  if (!keyword) return;
  
  const type = document.querySelector('input[name="searchType"]:checked').value;
  const resultsEl = document.getElementById('search-results');
  const detailEl = document.getElementById('detail-panel');
  detailEl.classList.add('hidden');
  resultsEl.innerHTML = '<p>Đang tìm kiếm...</p>';
  
  try {
    const res = await apiCall('search', { keyword, type });
    if (!res.success) throw new Error(res.error);
    
    if (res.results.length === 0) {
      resultsEl.innerHTML = '<p style="color:#6b7280;text-align:center;padding:2rem;">Không tìm thấy kết quả phù
