// Editor.js - Sistem Manajemen Konten VTech Info

// Konfigurasi
const CONFIG = {
    TELEGRAM_BOT_TOKEN: '7566732177:AAEfcYaw03XYo655z73edS1vXkwFg2aFXtU',
    TELEGRAM_CHAT_ID: '1618920755',
    API_URL: 'https://api.telegram.org/bot'
};

// Data artikel
let articles = JSON.parse(localStorage.getItem('vtech_articles') || '[]');
let subscribers = JSON.parse(localStorage.getItem('vtech_subscribers') || '[]');

// Inisialisasi editor
function initEditor() {
    createAdminPanel();
    loadSubscribersTable();
    setupArticleForm();
}

// Membuat panel admin
function createAdminPanel() {
    const adminPanel = document.createElement('div');
    adminPanel.className = 'admin-panel';
    adminPanel.innerHTML = `
        <h2><i class="fas fa-cogs"></i> Panel Admin VTech Info</h2>
        
        <div class="admin-tabs">
            <button class="tab-button active" data-tab="subscribers">Daftar Pelanggan</button>
            <button class="tab-button" data-tab="articles">Kelola Artikel</button>
            <button class="tab-button" data-tab="settings">Pengaturan</button>
        </div>
        
        <div class="tab-content">
            <div id="subscribers-tab" class="tab-pane active">
                <h3><i class="fas fa-users"></i> Daftar Pelanggan Newsletter</h3>
                <div class="subscribers-info">
                    <p>Total pelanggan: <strong>${subscribers.length}</strong></p>
                    <button id="exportSubscribers" class="btn-primary">
                        <i class="fas fa-download"></i> Ekspor Data
                    </button>
                    <button id="refreshSubscribers" class="btn-secondary">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
                <div id="subscribersTableContainer"></div>
            </div>
            
            <div id="articles-tab" class="tab-pane">
                <h3><i class="fas fa-edit"></i> Kelola Artikel</h3>
                <button id="addArticleBtn" class="btn-primary">
                    <i class="fas fa-plus"></i> Tambah Artikel Baru
                </button>
                <div id="articlesListContainer"></div>
                
                <div id="articleFormContainer" style="display: none;">
                    <h4>Tambah/Edit Artikel</h4>
                    <form id="articleForm">
                        <div class="form-group">
                            <label for="articleTitle">Judul Artikel</label>
                            <input type="text" id="articleTitle" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="articleExcerpt">Ringkasan</label>
                            <textarea id="articleExcerpt" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="articleContent">Konten</label>
                            <textarea id="articleContent" rows="10"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="articleCategory">Kategori</label>
                            <select id="articleCategory">
                                <option value="Bot Development">Bot Development</option>
                                <option value="Web Development">Web Development</option>
                                <option value="Mobile Apps">Mobile Apps</option>
                                <option value="Artificial Intelligence">Artificial Intelligence</option>
                                <option value="Cyber Security">Cyber Security</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="articleImage">URL Gambar</label>
                            <input type="url" id="articleImage">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Simpan Artikel</button>
                            <button type="button" id="cancelArticle" class="btn-secondary">Batal</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div id="settings-tab" class="tab-pane">
                <h3><i class="fas fa-cog"></i> Pengaturan Sistem</h3>
                <div class="settings-section">
                    <h4>Notifikasi Telegram</h4>
                    <p>Status: <span id="telegramStatus">Menguji koneksi...</span></p>
                    <button id="testTelegram" class="btn-primary">
                        <i class="fas fa-paper-plane"></i> Test Notifikasi
                    </button>
                </div>
                
                <div class="settings-section">
                    <h4>Backup Data</h4>
                    <button id="backupData" class="btn-primary">
                        <i class="fas fa-download"></i> Backup Semua Data
                    </button>
                    <button id="restoreData" class="btn-secondary">
                        <i class="fas fa-upload"></i> Restore Data
                    </button>
                    <input type="file" id="restoreFile" accept=".json" style="display: none;">
                </div>
            </div>
        </div>
    `;
    
    // Sisipkan panel admin di awal konten utama
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.parentNode.insertBefore(adminPanel, mainContent);
    } else {
        document.body.appendChild(adminPanel);
    }
    
    // Setup event listeners untuk tab
    setupAdminTabs();
    setupArticleManagement();
    setupSettings();
}

// Setup tab admin
function setupAdminTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Hapus class active dari semua tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Tambah class active ke tab yang diklik
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Refresh data jika diperlukan
            if (tabId === 'subscribers') {
                loadSubscribersTable();
            } else if (tabId === 'articles') {
                loadArticlesList();
            }
        });
    });
}

// Memuat tabel pelanggan
function loadSubscribersTable() {
    const container = document.getElementById('subscribersTableContainer');
    
    if (subscribers.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada pelanggan yang terdaftar.</p>';
        return;
    }
    
    let tableHTML = `
        <table class="subscribers-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Tanggal Bergabung</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    subscribers.forEach((subscriber, index) => {
        const maskedEmail = window.vtechApp ? window.vtechApp.maskEmail(subscriber.email) : 
            subscriber.email.substring(0, 2) + '*'.repeat(subscriber.email.split('@')[0].length - 2) + '@' + subscriber.email.split('@')[1];
        
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${subscriber.name}</td>
                <td class="email-masked">${maskedEmail}</td>
                <td>${new Date(subscriber.subscribedAt).toLocaleDateString('id-ID')}</td>
                <td>
                    <button class="btn-small btn-danger" onclick="deleteSubscriber(${subscriber.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
    
    // Setup event listener untuk ekspor data
    document.getElementById('exportSubscribers').addEventListener('click', exportSubscribersData);
    document.getElementById('refreshSubscribers').addEventListener('click', loadSubscribersTable);
}

// Setup manajemen artikel
function setupArticleManagement() {
    document.getElementById('addArticleBtn').addEventListener('click', showArticleForm);
    document.getElementById('cancelArticle').addEventListener('click', hideArticleForm);
    document.getElementById('articleForm').addEventListener('submit', saveArticle);
    
    loadArticlesList();
}

// Memuat daftar artikel
function loadArticlesList() {
    const container = document.getElementById('articlesListContainer');
    
    if (articles.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada artikel.</p>';
        return;
    }
    
    let articlesHTML = '<div class="articles-grid">';
    
    articles.forEach((article, index) => {
        articlesHTML += `
            <div class="article-item">
                <div class="article-item-image">
                    <img src="${article.image || 'https://images.unsplash.com/photo-1611605698335-8b1569810432?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" alt="${article.title}">
                </div>
                <div class="article-item-content">
                    <h4>${article.title}</h4>
                    <p class="article-category">${article.category}</p>
                    <p class="article-excerpt">${article.excerpt}</p>
                    <div class="article-actions">
                        <button class="btn-small btn-primary" onclick="editArticle(${article.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-small btn-danger" onclick="deleteArticle(${article.id})">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    articlesHTML += '</div>';
    container.innerHTML = articlesHTML;
}

// Menampilkan form artikel
function showArticleForm(article = null) {
    const formContainer = document.getElementById('articleFormContainer');
    const form = document.getElementById('articleForm');
    
    if (article) {
        // Mode edit
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleExcerpt').value = article.excerpt;
        document.getElementById('articleContent').value = article.content;
        document.getElementById('articleCategory').value = article.category;
        document.getElementById('articleImage').value = article.image || '';
        form.dataset.editId = article.id;
    } else {
        // Mode tambah
        form.reset();
        delete form.dataset.editId;
    }
    
    formContainer.style.display = 'block';
    document.getElementById('articlesListContainer').style.display = 'none';
    document.getElementById('addArticleBtn').style.display = 'none';
}

// Menyembunyikan form artikel
function hideArticleForm() {
    document.getElementById('articleFormContainer').style.display = 'none';
    document.getElementById('articlesListContainer').style.display = 'block';
    document.getElementById('addArticleBtn').style.display = 'block';
}

// Menyimpan artikel
function saveArticle(e) {
    e.preventDefault();
    
    const form = e.target;
    const isEdit = form.dataset.editId;
    
    const articleData = {
        title: document.getElementById('articleTitle').value,
        excerpt: document.getElementById('articleExcerpt').value,
        content: document.getElementById('articleContent').value,
        category: document.getElementById('articleCategory').value,
        image: document.getElementById('articleImage').value,
        date: new Date().toISOString(),
        author: 'Admin'
    };
    
    if (isEdit) {
        // Update artikel yang ada
        const articleIndex = articles.findIndex(a => a.id == isEdit);
        if (articleIndex !== -1) {
            articles[articleIndex] = { ...articles[articleIndex], ...articleData };
        }
    } else {
        // Tambah artikel baru
        articleData.id = Date.now();
        articles.unshift(articleData);
    }
    
    localStorage.setItem('vtech_articles', JSON.stringify(articles));
    
    if (window.vtechApp) {
        window.vtechApp.showNotification(
            `Artikel "${articleData.title}" berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`, 
            'success'
        );
    } else {
        alert(`Artikel "${articleData.title}" berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`);
    }
    
    hideArticleForm();
    loadArticlesList();
}

// Edit artikel
function editArticle(id) {
    const article = articles.find(a => a.id === id);
    if (article) {
        showArticleForm(article);
    }
}

// Hapus artikel
function deleteArticle(id) {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
        articles = articles.filter(a => a.id !== id);
        localStorage.setItem('vtech_articles', JSON.stringify(articles));
        loadArticlesList();
        
        if (window.vtechApp) {
            window.vtechApp.showNotification('Artikel berhasil dihapus!', 'success');
        } else {
            alert('Artikel berhasil dihapus!');
        }
    }
}

// Hapus pelanggan
function deleteSubscriber(id) {
    if (confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
        subscribers = subscribers.filter(s => s.id !== id);
        localStorage.setItem('vtech_subscribers', JSON.stringify(subscribers));
        loadSubscribersTable();
        
        if (window.vtechApp) {
            window.vtechApp.showNotification('Pelanggan berhasil dihapus!', 'success');
        } else {
            alert('Pelanggan berhasil dihapus!');
        }
    }
}

// Ekspor data pelanggan
function exportSubscribersData() {
    const dataStr = JSON.stringify(subscribers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vtech-subscribers-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (window.vtechApp) {
        window.vtechApp.showNotification('Data pelanggan berhasil diekspor!', 'success');
    } else {
        alert('Data pelanggan berhasil diekspor!');
    }
}

// Setup pengaturan
function setupSettings() {
    // Test koneksi Telegram
    document.getElementById('testTelegram').addEventListener('click', testTelegramConnection);
    
    // Backup data
    document.getElementById('backupData').addEventListener('click', backupAllData);
    document.getElementById('restoreData').addEventListener('click', () => {
        document.getElementById('restoreFile').click();
    });
    document.getElementById('restoreFile').addEventListener('change', restoreDataFromFile);
    
    // Test koneksi Telegram saat pertama kali
    testTelegramConnection();
}

// Test koneksi Telegram
async function testTelegramConnection() {
    const statusElement = document.getElementById('telegramStatus');
    statusElement.textContent = 'Menguji...';
    
    const testMessage = {
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: '🔔 *TEST NOTIFICATION* 🔔\n\nIni adalah test notifikasi dari sistem VTech Info.\n\nWaktu: ' + new Date().toLocaleString('id-ID'),
        parse_mode: 'Markdown'
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testMessage)
        });
        
        const result = await response.json();
        
        if (result.ok) {
            statusElement.textContent = 'Terhubung ✓';
            statusElement.style.color = '#34C759';
            
            if (window.vtechApp) {
                window.vtechApp.showNotification('Koneksi Telegram berhasil!', 'success');
            }
        } else {
            statusElement.textContent = 'Gagal ✗';
            statusElement.style.color = '#FF3B30';
            
            if (window.vtechApp) {
                window.vtechApp.showNotification('Koneksi Telegram gagal!', 'error');
            }
        }
    } catch (error) {
        console.error('Error testing Telegram connection:', error);
        statusElement.textContent = 'Error ✗';
        statusElement.style.color = '#FF3B30';
        
        if (window.vtechApp) {
            window.vtechApp.showNotification('Error testing Telegram connection!', 'error');
        }
    }
}

// Backup semua data
function backupAllData() {
    const allData = {
        subscribers: subscribers,
        articles: articles,
        backupDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vtech-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (window.vtechApp) {
        window.vtechApp.showNotification('Backup semua data berhasil!', 'success');
    } else {
        alert('Backup semua data berhasil!');
    }
}

// Restore data dari file
function restoreDataFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const backupData = JSON.parse(event.target.result);
            
            if (backupData.subscribers && backupData.articles) {
                if (confirm('Apakah Anda yakin ingin mengembalikan data dari backup? Data saat ini akan digantikan.')) {
                    subscribers = backupData.subscribers;
                    articles = backupData.articles;
                    
                    localStorage.setItem('vtech_subscribers', JSON.stringify(subscribers));
                    localStorage.setItem('vtech_articles', JSON.stringify(articles));
                    
                    loadSubscribersTable();
                    loadArticlesList();
                    
                    if (window.vtechApp) {
                        window.vtechApp.showNotification('Data berhasil dipulihkan dari backup!', 'success');
                    } else {
                        alert('Data berhasil dipulihkan dari backup!');
                    }
                }
            } else {
                throw new Error('Format file backup tidak valid');
            }
        } catch (error) {
            console.error('Error restoring data:', error);
            
            if (window.vtechApp) {
                window.vtechApp.showNotification('Error memulihkan data: Format file tidak valid!', 'error');
            } else {
                alert('Error memulihkan data: Format file tidak valid!');
            }
        }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset input file
}

// Setup form artikel
function setupArticleForm() {
    // Tidak diperlukan lagi karena sudah dihandle di setupArticleManagement
}

// Inisialisasi editor saat halaman dimuat
document.addEventListener('DOMContentLoaded', initEditor);

// Ekspor fungsi untuk penggunaan global
window.vtechEditor = {
    initEditor,
    loadSubscribersTable,
    showArticleForm,
    hideArticleForm,
    editArticle,
    deleteArticle,
    deleteSubscriber,
    exportSubscribersData,
    testTelegramConnection,
    backupAllData
};
