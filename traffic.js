// traffic.js - Statistik Pengunjung Rahasia
(function() {
    // Konfigurasi (Sama persis dengan obfuscation di app.js)
    const _u = ['https://script', '.google', '.com/macros/s/', 'AKfycbxYkn2gYBMtTpdOsWvbCeXCtR1OVZPhSL-cE9SFxHQIP4TXWvq8Bi_nWX0DcQDj5NNo', '/exec'];
    const TRAFFIC_API_URL = _u.join('');
    const _t = ['ZWhw', 'LTIw', 'MjYt', 'amVj', 'LWE4', 'ZjNr', 'OW0y', 'eDdx', 'MQ=='];
    const TRAFFIC_TOKEN = atob(_t.join(''));

    // 1. Fungsi Tracking (Fire and Forget - Tidak memperlambat loading)
    function trackVisitor() {
        try {
            // Buat pseudo-ID unik untuk browser ini (bukan IP asli demi privasi, tapi cukup untuk hitung unique)
            let visitorId = localStorage.getItem('ehp_visitor_id');
            if (!visitorId) {
                visitorId = 'v-' + Math.random().toString(36).substring(2, 10);
                localStorage.setItem('ehp_visitor_id', visitorId);
            }

            const payload = {
                action: 'trackVisitor',
                token: TRAFFIC_TOKEN,
                ip: visitorId,
                path: window.location.pathname,
                referrer: document.referrer || 'direct'
            };

            // Gunakan sendBeacon (lebih andal saat user menutup tab) atau fetch fallback
            const url = `${TRAFFIC_API_URL}?action=trackVisitor&token=${TRAFFIC_TOKEN}&ip=${encodeURIComponent(visitorId)}`;
            
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url);
            } else {
                fetch(url, { method: 'GET', keepalive: true });
            }
        } catch(e) {
            // Silent fail agar tidak mengganggu user
        }
    }

    // Jalankan tracking segera saat script dimuat
    trackVisitor();

    // 2. Fungsi Inject UI ke dalam Admin Dashboard
    function injectTrafficUI() {
        const dashboard = document.getElementById('adminDashboard');
        if (!dashboard) return;

        // Cek apakah sudah di-inject sebelumnya
        if (document.getElementById('traffic-stats-section')) return;

        const trafficHTML = `
            <div class="info-section animate-slide-up" id="traffic-stats-section" style="margin-top: 24px; border-top: 2px dashed var(--border); padding-top: 20px;">
                <h2 style="margin-bottom: 16px; font-size: 16px;">
                    <span class="material-icons-outlined" style="color: var(--warning); vertical-align: middle;">bar_chart</span> 
                    Statistik Pengunjung (Rahasia)
                </h2>
                <div class="stats-grid" style="margin-bottom: 16px;">
                    <div class="stat-card">
                        <span class="material-icons-outlined">visibility</span>
                        <div class="stat-number" id="t-views-today">0</div>
                        <div class="stat-label">Views Hari Ini</div>
                    </div>
                    <div class="stat-card">
                        <span class="material-icons-outlined">people</span>
                        <div class="stat-number" id="t-unique-today">0</div>
                        <div class="stat-label">Unique Hari Ini</div>
                    </div>
                    <div class="stat-card">
                        <span class="material-icons-outlined">trending_up</span>
                        <div class="stat-number" id="t-total-views">0</div>
                        <div class="stat-label">Total Views</div>
                    </div>
                </div>
                <div class="admin-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Views</th>
                                <th>Unique</th>
                            </tr>
                        </thead>
                        <tbody id="traffic-history-body">
                            <tr><td colspan="3" style="text-align:center; padding: 20px;">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
                <button class="btn btn-outline btn-sm" onclick="window.loadTrafficData()" style="margin-top: 12px; width: 100%;">
                    <span class="material-icons-outlined" style="font-size:16px;">refresh</span> Refresh Data
                </button>
            </div>
        `;
        
        // Suntikkan HTML tepat setelah section "Data Pendaftar" di admin dashboard
        const firstSection = dashboard.querySelector('.info-section');
        if (firstSection) {
            firstSection.insertAdjacentHTML('afterend', trafficHTML);
        }
    }

    // 3. Fungsi Load Data Traffic
    window.loadTrafficData = async function() {
        const tbody = document.getElementById('traffic-history-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Memuat data...</td></tr>';

        try {
            const url = `${TRAFFIC_API_URL}?action=getTrafficStats&token=${TRAFFIC_TOKEN}`;
            const response = await fetch(url);
            const result = await response.json();

            if (result.success && result.data) {
                const data = result.data;
                
                // Update kartu ringkasan
                const elViewsToday = document.getElementById('t-views-today');
                const elUniqueToday = document.getElementById('t-unique-today');
                const elTotalViews = document.getElementById('t-total-views');
                
                if (elViewsToday) elViewsToday.textContent = data.today.views;
                if (elUniqueToday) elUniqueToday.textContent = data.today.unique;
                if (elTotalViews) elTotalViews.textContent = data.total.totalViews;

                // Update tabel riwayat
                if (tbody) {
                    tbody.innerHTML = data.history.map(row => `
                        <tr>
                            <td>${row.date}</td>
                            <td><strong>${row.views}</strong></td>
                            <td>${row.unique}</td>
                        </tr>
                    `).join('');
                }
            }
        } catch (e) {
            console.error('Traffic load error:', e);
            if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--danger);">Gagal memuat data</td></tr>';
        }
    };

    // 4. Inisialisasi
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectTrafficUI);
    } else {
        injectTrafficUI();
    }

    // 5. Observer: Deteksi kapan Admin berhasil login (display: block)
    const adminDash = document.getElementById('adminDashboard');
    if (adminDash) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'adminDashboard' && mutation.target.style.display === 'block') {
                    // Admin baru saja login, muat data traffic dengan sedikit delay agar smooth
                    setTimeout(() => {
                        if (typeof window.loadTrafficData === 'function') {
                            window.loadTrafficData();
                        }
                    }, 300);
                }
            });
        });
        observer.observe(adminDash, { attributes: true, attributeFilter: ['style'] });
    }

})();
