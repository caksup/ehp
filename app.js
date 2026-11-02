// ============================================
// Configuration - Token di-obfuscate
// ============================================
const _c = ['6285335913758', '2626'];
const WA_NUMBER = _c[0];
const ADMIN_PIN = _c[1];

// Token di-encode base64 + split untuk mempersulit reverse
const _t = ['ZWhw', 'LTIw', 'MjYt', 'amVj', 'LWE4', 'ZjNr', 'OW0y', 'eDdx', 'MQ=='];
const SECRET_TOKEN = atob(_t.join(''));

// API URL di-split untuk mempersulit scraping
const _u = [
    'https://script',
    '.google',
    '.com/macros/s/',
    'AKfycbxYkn2gYBMtTpdOsWvbCeXCtR1OVZPhSL-cE9SFxHQIP4TXWvq8Bi_nWX0DcQDj5NNo',
    '/exec'
];
const API_URL = _u.join('');

let registrationData = {};
let selectedPayment = '';
let isAdminLoggedIn = false;

// ============================================
// Theme
// ============================================
function initTheme() {
    const saved = localStorage.getItem('ehp-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeIcon').textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ehp-theme', newTheme);
    document.getElementById('themeIcon').textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
}

function showLoading(show) {
    document.getElementById('headerLoading').classList.toggle('active', show);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icons = { success: 'check_circle', error: 'error', warning: 'warning' };
    document.getElementById('toastIcon').textContent = icons[type] || 'info';
    document.getElementById('toastMessage').textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ============================================
// Date Parser
// ============================================
function parseDateRobust(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const str = value.toString().trim();
    if (!str) return null;
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    const indoMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[\s,]+(\d{1,2})[:\.](\d{2})(?:[:\.](\d{2}))?)?$/);
    if (indoMatch) {
        const day = parseInt(indoMatch[1]);
        const month = parseInt(indoMatch[2]) - 1;
        let year = parseInt(indoMatch[3]);
        if (year < 100) year += 2000;
        const hour = indoMatch[4] ? parseInt(indoMatch[4]) : 0;
        const min = indoMatch[5] ? parseInt(indoMatch[5]) : 0;
        const sec = indoMatch[6] ? parseInt(indoMatch[6]) : 0;
        d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

function formatDateIndo(date) {
    if (!date) return '-';
    try { return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch(e) { return '-'; }
}

// ============================================
// Helpers
// ============================================
function maskName(name) {
    if (!name) return '';
    name = name.trim();
    if (name.length <= 4) return name.toUpperCase();
    const first = name.substring(0, 2).toUpperCase();
    const last = name.substring(name.length - 2).toUpperCase();
    const middle = '*'.repeat(name.length - 4);
    return first + middle + last;
}

function getKelasGrup(kelasValue) {
    if (!kelasValue) return '';
    const k = kelasValue.toString().trim().toUpperCase();
    if (k === 'A' || k === 'B') return k;
    const num = parseInt(k);
    if (num === 2 || num === 3) return 'A';
    if (num === 4 || num === 5 || num === 6) return 'B';
    return '';
}

function getKelasAsli(d) { return d['Kelas Asli'] || d['KelasAsli'] || d['Kelas'] || d.kelasAsli || d.kelas || ''; }
function getKelasGrupFromData(d) {
    const grup = d['Kelas Grup'] || d['KelasGrup'] || d.kelasGrup;
    if (grup) return grup.toString().toUpperCase().trim();
    return getKelasGrup(getKelasAsli(d));
}
function getStatus(d) { return (d.Status || d.status || '').toString().toLowerCase().trim(); }
function getNama(d) { return d['Nama Lengkap'] || d.NamaLengkap || d.nama || ''; }
function getSekolah(d) { return d['Asal Sekolah'] || d.AsalSekolah || d.sekolah || ''; }
function getTimestamp(d) { return d['TimestampISO'] || d.TimestampISO || d.Timestamp || d.timestamp || ''; }

// ============================================
// Navigation
// ============================================
function navigateTo(pageId, navItem) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (navItem) navItem.classList.add('active');
    const isAdm = pageId === 'pageAdmin' && isAdminLoggedIn;
    document.getElementById('statsBanner').style.display = isAdm ? 'none' : 'block';
    document.getElementById('quotaSection').style.display = isAdm ? 'none' : 'block';
    document.getElementById('urgencyBanner').style.display = isAdm ? 'none' : 'block';
    if (pageId === 'pageQuota') loadSeatData();
    if (pageId === 'pageAdmin' && isAdminLoggedIn) loadAdminData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleHash() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ehp-ap') || window.location.search.includes('ehp-ap')) {
        navigateTo('pageAdmin', null);
        return;
    }
    const hash = window.location.hash;
    if (hash === '#ehp-info-26' || hash === '' || hash === '#') {
        navigateTo('pageInfo', document.querySelector('[data-page="pageInfo"]'));
    } else if (hash === '#ehp-form-26') {
        navigateTo('pageForm', document.querySelector('[data-page="pageForm"]'));
    } else if (hash === '#ehp-cek-26') {
        navigateTo('pageQuota', document.querySelector('[data-page="pageQuota"]'));
    }
}

// ============================================
// API
// ============================================
async function apiCall(action, data = {}) {
    showLoading(true);
    try {
        const params = new URLSearchParams({ action, token: SECRET_TOKEN, ...data });
        const url = `${API_URL}?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();
        showLoading(false);
        return result;
    } catch (error) {
        showLoading(false);
        showToast('Terjadi kesalahan koneksi.', 'error');
        return { success: false, message: error.toString() };
    }
}

async function loadStats() {
    const result = await apiCall('getStats');
    if (result.success) {
        const stats = result.data;
        document.getElementById('statTotal').textContent = stats.total;
        document.getElementById('statPaid').textContent = stats.paid;
        document.getElementById('statUnpaid').textContent = stats.unpaid;
        const max = 10;
        const percentA = Math.min((stats.bookingA / max) * 100, 100);
        const percentB = Math.min((stats.bookingB / max) * 100, 100);
        document.getElementById('quotaBarA').style.width = percentA + '%';
        document.getElementById('quotaBarB').style.width = percentB + '%';
        document.getElementById('quotaTextA').textContent = `${stats.bookingA} / ${max} Siswa`;
        document.getElementById('quotaTextB').textContent = `${stats.bookingB} / ${max} Siswa`;
        if (percentA >= 100) document.getElementById('quotaBarA').classList.add('full');
        if (percentB >= 100) document.getElementById('quotaBarB').classList.add('full');
    }
}

// ============================================
// Form
// ============================================
async function handleSubmit(event) {
    event.preventDefault();
    const kelasAsli = document.getElementById('kelasAsli').value;
    const kelasGrup = getKelasGrup(kelasAsli);
    const formData = {
        action: 'register',
        namaLengkap: document.getElementById('namaLengkap').value.trim(),
        tempat: document.getElementById('tempat').value.trim(),
        tanggalLahir: document.getElementById('tanggalLahir').value,
        kelasAsli: kelasAsli,
        kelasGrup: kelasGrup,
        asalSekolah: document.getElementById('asalSekolah').value.trim(),
        alamat: document.getElementById('alamat').value.trim(),
        nomorHP: document.getElementById('nomorHP').value.trim()
    };
    const result = await apiCall('register', formData);
    if (result.success) {
        registrationData = { ...formData, id: result.id, waNumber: result.waNumber };
        showConfirmation(formData);
        showToast('Pendaftaran berhasil!', 'success');
        loadStats();
    } else {
        showToast(result.message || 'Pendaftaran gagal', 'error');
    }
}

function showConfirmation(data) {
    const details = document.getElementById('confirmDetails');
    const tgl = data.tanggalLahir ? new Date(data.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    details.innerHTML = `
        <div class="confirm-detail-row"><span class="confirm-detail-label">ID Pendaftaran</span><span class="confirm-detail-value">${registrationData.id || '-'}</span></div>
        <div class="confirm-detail-row"><span class="confirm-detail-label">Nama</span><span class="confirm-detail-value">${data.namaLengkap}</span></div>
        <div class="confirm-detail-row"><span class="confirm-detail-label">TTL</span><span class="confirm-detail-value">${data.tempat}, ${tgl}</span></div>
        <div class="confirm-detail-row"><span class="confirm-detail-label">Kelas</span><span class="confirm-detail-value">Kelas ${data.kelasAsli} SD → Grup ${data.kelasGrup}</span></div>
        <div class="confirm-detail-row"><span class="confirm-detail-label">Sekolah</span><span class="confirm-detail-value">${data.asalSekolah}</span></div>
        <div class="confirm-detail-row"><span class="confirm-detail-label">No. HP</span><span class="confirm-detail-value">${data.nomorHP}</span></div>
    `;
    navigateTo('pageConfirm', document.querySelector('[data-page="pageForm"]'));
}

function selectPayment(element) {
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedPayment = element.dataset.method;
}

function redirectToWA() {
    if (!selectedPayment) {
        showToast('Pilih metode pembayaran terlebih dahulu', 'warning');
        return;
    }
    const paymentNames = { 'transfer': 'Transfer Bank', 'qris': 'QRIS', 'cash': 'Tunai', 'ewallet': 'E-Wallet' };
    const messageText = 
        '*PENDAFTARAN EHP - JAGAT EDUCATION CENTER*\n\n' +
        '[ID] ' + registrationData.id + '\n' +
        '[Nama] ' + registrationData.namaLengkap + '\n' +
        '[TTL] ' + registrationData.tempat + ', ' + registrationData.tanggalLahir + '\n' +
        '[Kelas] Kelas ' + registrationData.kelasAsli + ' SD (Grup ' + registrationData.kelasGrup + ')\n' +
        '[Sekolah] ' + registrationData.asalSekolah + '\n' +
        '[No. HP] ' + registrationData.nomorHP + '\n' +
        '[Metode Bayar] ' + paymentNames[selectedPayment] + '\n\n' +
        'Saya ingin melakukan pembayaran. Mohon informasi lebih lanjut. Terima kasih.';
    const encodedMessage = encodeURIComponent(messageText);
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodedMessage, '_blank');
}

// ============================================
// Booking Seat
// ============================================
async function loadSeatData() {
    const result = await apiCall('getAll');
    const seatListA = document.getElementById('seatListA');
    const seatListB = document.getElementById('seatListB');
    if (result.success && result.data && result.data.length > 0) {
        const paidA = result.data.filter(d => getStatus(d) === 'paid' && getKelasGrupFromData(d) === 'A');
        const paidB = result.data.filter(d => getStatus(d) === 'paid' && getKelasGrupFromData(d) === 'B');
        seatListA.innerHTML = paidA.length > 0 ? paidA.map((d, i) => renderSeatItem(d, i)).join('') : `<div class="empty-state"><span class="material-icons-outlined">event_busy</span><p>Belum ada yang menduduki seat</p></div>`;
        seatListB.innerHTML = paidB.length > 0 ? paidB.map((d, i) => renderSeatItem(d, i)).join('') : `<div class="empty-state"><span class="material-icons-outlined">event_busy</span><p>Belum ada yang menduduki seat</p></div>`;
    } else {
        seatListA.innerHTML = seatListB.innerHTML = `<div class="empty-state"><span class="material-icons-outlined">event_busy</span><p>Belum ada data pendaftar</p></div>`;
    }
}

function renderSeatItem(d, index) {
    const nama = getNama(d);
    const maskedName = maskName(nama);
    const kelasAsli = getKelasAsli(d) || '-';
    const sekolah = getSekolah(d) || '-';
    const rawDate = getTimestamp(d);
    const parsedDate = parseDateRobust(rawDate);
    const tglDaftar = formatDateIndo(parsedDate);
    return `
        <div class="seat-item">
            <div class="seat-number">${index + 1}</div>
            <div class="seat-info">
                <div class="seat-name">${maskedName}</div>
                <div class="seat-meta">
                    <span><span class="material-icons-outlined">school</span> Kelas ${kelasAsli}</span>
                    <span><span class="material-icons-outlined">apartment</span> ${sekolah}</span>
                    <span><span class="material-icons-outlined">calendar_today</span> ${tglDaftar}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// Admin
// ============================================
async function verifyAdminPin() {
    const pin = document.getElementById('adminPin').value;
    if (!pin) { showToast('Masukkan PIN terlebih dahulu', 'warning'); return; }
    if (pin === ADMIN_PIN) {
        isAdminLoggedIn = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('statsBanner').style.display = 'none';
        document.getElementById('quotaSection').style.display = 'none';
        document.getElementById('urgencyBanner').style.display = 'none';
        loadAdminData();
        showToast('Login berhasil!', 'success');
    } else {
        showToast('PIN salah!', 'error');
        document.getElementById('adminPin').value = '';
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('statsBanner').style.display = 'block';
    document.getElementById('quotaSection').style.display = 'block';
    document.getElementById('urgencyBanner').style.display = 'block';
    document.getElementById('adminPin').value = '';
    navigateTo('pageInfo', document.querySelector('[data-page="pageInfo"]'));
}

async function loadAdminData() {
    const result = await apiCall('getAll');
    const tbody = document.getElementById('adminTableBody');
    if (result.success && result.data && result.data.length > 0) {
        tbody.innerHTML = result.data.map((d, i) => {
            const isPaid = getStatus(d) === 'paid';
            const kelasAsli = getKelasAsli(d) || '-';
            const kelasGrup = getKelasGrupFromData(d) || '-';
            return `<tr>
                <td>${i + 1}</td>
                <td><strong>${getNama(d)}</strong><br><small style="color: var(--text-secondary);">${getSekolah(d)}</small></td>
                <td><span style="font-weight:600; color: var(--primary);">Kelas ${kelasAsli}</span></td>
                <td><span class="badge badge-paid">Grup ${kelasGrup}</span></td>
                <td>${d['Nomor HP'] || d.NomorHP || ''}</td>
                <td><span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}"><span class="material-icons-outlined" style="font-size: 14px;">${isPaid ? 'check_circle' : 'pending'}</span>${isPaid ? 'Paid' : 'Unpaid'}</span></td>
                <td><button class="btn ${isPaid ? 'btn-outline' : 'btn-success'} btn-sm" onclick="toggleStatus('${d.ID}', '${isPaid ? 'unpaid' : 'paid'}')"><span class="material-icons-outlined">${isPaid ? 'close' : 'check'}</span>${isPaid ? 'Unpaid' : 'Paid'}</button></td>
            </tr>`;
        }).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px;">Belum ada data pendaftar</td></tr>`;
    }
}

async function toggleStatus(id, newStatus) {
    const result = await apiCall('updateStatus', { id: id, status: newStatus });
    if (result.success) {
        showToast(`Status berhasil diubah ke ${newStatus}`, 'success');
        loadAdminData();
        loadStats();
    } else {
        showToast(result.message, 'error');
    }
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadStats();
    handleHash();
    window.addEventListener('hashchange', handleHash);
    document.getElementById('adminPin').addEventListener('input', function(e) {
        if (this.value.length >= 4) setTimeout(() => verifyAdminPin(), 300);
    });
});

setInterval(() => { if (!isAdminLoggedIn) loadStats(); }, 30000);
