// traffic.js - Statistik Pengunjung Rahasia (Full Version)
(function() {
    'use strict';

    // ==========================================
    // 1. Konfigurasi (Sama persis dengan app.js)
    // ==========================================
    const _u = ['https://script', '.google', '.com/macros/s/', 'AKfycbxYkn2gYBMtTpdOsWvbCeXCtR1OVZPhSL-cE9SFxHQIP4TXWvq8Bi_nWX0DcQDj5NNo', '/exec'];
    const TRAFFIC_API_URL = _u.join('');
    
    const _t = ['ZWhw', 'LTIw', 'MjYt', 'amVj', 'LWE4', 'ZjNr', 'OW0y', 'eDdx', 'MQ=='];
    const TRAFFIC_TOKEN = atob(_t.join(''));

    // ==========================================
    // 2. Deteksi Device & Browser
    // ==========================================
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Desktop';
        let browser = 'Unknown';
        
        // Deteksi Device
        if (/tablet|ipad|playbook|silk/i.test(ua)) {
            device = 'Tablet';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
            device = 'Mobile';
        }
        
        // Deteksi Browser
        if (ua.indexOf('Edg') > -1) {
            browser = 'Edge';
        } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
            browser = 'Chrome';
        } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
            browser = 'Safari';
        } else if (ua.indexOf('Firefox') > -1) {
            browser = 'Firefox';
        } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
            browser = 'Opera';
        } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
            browser = 'IE';
        }
        
        return { device, browser };
    }

    // ==========================================
    // 3. Fungsi Tracking (Fire & Forget)
    // ==========================================
    function trackVisitor() {
        try {
            // Buat pseudo-ID unik untuk browser ini (disimpan di localStorage)
            let visitorId = localStorage.getItem('ehp_visitor_id');
            if (!visitorId) {
                visitorId = 'v-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
                localStorage.setItem('ehp_visitor_id', visitorId);
            }

            const { device, browser } = getDeviceInfo();
            
            const params = new URLSearchParams({
                action: 'trackVisitor',
                token: TRAFFIC_TOKEN,
                ip: visitorId,
                device: device,
                browser: browser,
                path: window.location.pathname + window.location.hash,
                referrer: document.referrer || 'direct'
            });

            const url = TRAFFIC_API_URL + '?' + params.toString();
            
            // Gunakan sendBeacon (paling andal saat user menutup tab)
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url);
            } else {
                // Fallback untuk browser lama
                fetch(url, { method: 'GET', keepalive: true, mode: 'no-cors' }).catch(() => {});
            }
            
            // Debug log (bisa dilihat di console browser)
            console.log('[Traffic] Tracked:', device, browser);
        } catch(e) {
            // Silent fail agar tidak mengganggu user experience
            console.error('[Traffic] Error:', e);
        }
    }

    // Jalankan tracking segera saat script dimuat
    trackVisitor();

    // ==========================================
    // 4. Inject UI ke Admin Dashboard
    // ==========================================
    function injectTrafficUI() {
        const dashboard = document.getElementById('adminDashboard');
        if (!dashboard) return;

        // Cek apakah sudah di-inject sebelumnya (mencegah duplikasi)
        if (document.getElementById('traffic-stats-section')) return;

        const trafficHTML = `
            <div class="info-section animate-slide-up" id="traffic-stats-section" style="margin-top: 24px; border-top: 2px dashed var(--border); padding-top: 20px;">
                <h2 style="margin-bottom: 16px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <span class="material-icons-outlined" style="color: var(--warning);">bar_chart</span> 
                    Statistik Pengunjung (Rahasia)
                </h2>
                
                <div class="stats-grid" style="margin-bottom: 20px;">
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

                <!-- Tabel Kunjungan Terbaru -->
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <span class="material-icons-outlined" style="font-size: 16px;">schedule</span>
                        Kunjungan Terbaru (Real-time)
                    </h3>
                    <div class="admin-table-wrapper">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>Device</th>
                                    <th>Browser</th>
                                    <th>Halaman</th>
                                </tr>
                            </thead>
                            <tbody id="recent-visits-body">
                                <tr><td colspan="4" style="text-align:center; padding: 20px;">Memuat data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Tabel Riwayat 7 Hari -->
                <div>
                    <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <span class="material-icons-outlined" style="font-size: 16px;">calendar_month</span>
                        Riwayat 7 Hari Terakhir
                    </h3>
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
                </div>

                <button class="btn btn-outline btn-sm" onclick="window.loadTrafficData()" style="margin-top: 16px; width: 100%;">
                    <span class="material-icons-outlined" style="font-size:16px;">refresh</span> Refresh Data
                </button>
            </div>
        `;
        
        // Suntikkan HTML tepat setelah section "Data Pendaftar"
        const firstSection = dashboard.querySelector('.info-section');
        if (firstSection) {
            firstSection.insertAdjacentHTML('afterend', trafficHTML);
        }
    }

    // ==========================================
    // 5. Load & Render Data
    // ==========================================
    window.loadTrafficData = async function() {
        const tbodyHistory = document.getElementById('traffic-history-body');
        const tbodyVisits = document.getElementById('recent-visits-body');
        
        if (tbodyHistory) tbodyHistory.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Memuat data...</td></tr>';
        if (tbodyVisits) tbodyVisits.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Memuat data...</td></tr>';

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
                
                if (elViewsToday) elViewsToday.textContent = data.today.views || 0;
                if (elUniqueToday) elUniqueToday.textContent = data.today.unique || 0;
                if (elTotalViews) elTotalViews.textContent = data.total.totalViews || 0;

                // Render Tabel Kunjungan Terbaru
                if (tbodyVisits) {
                    if (data.recentVisits && data.recentVisits.length > 0) {
                        tbodyVisits.innerHTML = data.recentVisits.map(visit => {
                            let deviceIcon = 'computer';
                            if (visit.device === 'Mobile') deviceIcon = 'smartphone';
                            if (visit.device === 'Tablet') deviceIcon = 'tablet_mac';
                            
                            // Bersihkan path untuk tampilan yang lebih rapi
                            let cleanPath = visit.path || '/';
                            if (cleanPath.includes('#')) cleanPath = cleanPath.split('#')[1] || 'Home';
                            else if (cleanPath === '/' || cleanPath === '/ehp/') cleanPath = 'Home';

                            return `
                                <tr>
                                    <td><strong>${visit.time}</strong></td>
                                    <td>
                                        <span class="material-icons-outlined" style="font-size:14px; vertical-align:middle; margin-right:4px; color:var(--primary);">${deviceIcon}</span>
                                        ${visit.device}
                                    </td>
                                    <td>${visit.browser}</td>
                                    <td style="font-size:11px; color:var(--text-secondary);">${cleanPath}</td>
                                </tr>
                            `;
                        }).join('');
                    } else {
                        tbodyVisits.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color:var(--text-secondary);">Belum ada data kunjungan</td></tr>';
                    }
                }

                // Render Tabel Riwayat 7 Hari
                if (tbodyHistory) {
                    tbodyHistory.innerHTML = data.history.map(row => `
                        <tr>
                            <td>${row.date}</td>
                            <td><strong>${row.views}</strong></td>
                            <td>${row.unique}</td>
                        </tr>
                    `).join('');
                }
                
                console.log('[Traffic] Data loaded successfully');
            } else {
                console.error('[Traffic] API Error:', result);
                if (tbodyHistory) tbodyHistory.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--danger);">Gagal memuat data</td></tr>';
                if (tbodyVisits) tbodyVisits.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--danger);">Gagal memuat data</td></tr>';
            }
        } catch (e) {
            console.error('[Traffic] Fetch Error:', e);
            if (tbodyHistory) tbodyHistory.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--danger);">Error koneksi</td></tr>';
            if (tbodyVisits) tbodyVisits.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--danger);">Error koneksi</td></tr>';
        }
    };

    // ==========================================
    // 6. Inisialisasi & Observer
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectTrafficUI);
    } else {
        injectTrafficUI();
    }

    // Observer untuk mendeteksi kapan Admin berhasil login (display: block)
    const adminDash = document.getElementById('adminDashboard');
    if (adminDash) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'adminDashboard' && mutation.target.style.display === 'block') {
                    // Admin baru saja login, muat data traffic dengan sedikit delay
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
