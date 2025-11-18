// Konfigurasi
const CONFIG = {
    TELEGRAM_BOT_TOKEN: '7566732177:AAEfcYaw03XYo655z73edS1vXkwFg2aFXtU',
    TELEGRAM_CHAT_ID: '1618920755',
    API_URL: 'https://api.telegram.org/bot'
};

// Data pelanggan
let subscribers = JSON.parse(localStorage.getItem('vtech_subscribers') || '[]');

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

// Check for saved theme or prefered scheme
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        localStorage.setItem('theme', 'light');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
});

// Mobile Menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const overlay = document.getElementById('overlay');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
});

mobileMenuClose.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
});

overlay.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Search Functionality
const searchInput = document.querySelector('.search-input');

searchInput.addEventListener('focus', () => {
    searchInput.parentElement.classList.add('focused');
});

searchInput.addEventListener('blur', () => {
    searchInput.parentElement.classList.remove('focused');
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});

// Newsletter Form Submission
const newsletterForm = document.getElementById('newsletterForm');

newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('subscriberName').value;
    const email = document.getElementById('subscriberEmail').value;
    
    if (name && email) {
        // Cek apakah email sudah terdaftar
        const existingSubscriber = subscribers.find(sub => sub.email === email);
        
        if (existingSubscriber) {
            showNotification('Email sudah terdaftar sebelumnya!', 'error');
            return;
        }
        
        // Tambahkan pelanggan baru
        const newSubscriber = {
            id: Date.now(),
            name: name,
            email: email,
            subscribedAt: new Date().toISOString()
        };
        
        subscribers.push(newSubscriber);
        localStorage.setItem('vtech_subscribers', JSON.stringify(subscribers));
        
        // Kirim notifikasi ke Telegram
        await sendTelegramNotification(newSubscriber);
        
        showNotification(`Terima kasih ${name}! Anda telah berhasil berlangganan newsletter.`, 'success');
        newsletterForm.reset();
    }
});

// File Download Simulation
document.querySelectorAll('.file-download').forEach(file => {
    file.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Download akan dimulai. Ini adalah simulasi untuk demo.', 'success');
    });
});

// Fungsi untuk mengirim notifikasi ke Telegram
async function sendTelegramNotification(subscriber) {
    const message = {
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: `📧 *NEW SUBSCRIBER NOTIFICATION* 📧\n\n` +
              `*Nama:* ${subscriber.name}\n` +
              `*Email:* ${subscriber.email}\n` +
              `*Tanggal:* ${new Date(subscriber.subscribedAt).toLocaleString('id-ID')}\n\n` +
              `*Data JSON:*\n\`\`\`json\n${JSON.stringify(subscriber, null, 2)}\n\`\`\``,
        parse_mode: 'Markdown'
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });
        
        const result = await response.json();
        console.log('Telegram notification sent:', result);
        return result.ok;
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        return false;
    }
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'success') {
    // Hapus notifikasi sebelumnya jika ada
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Buat elemen notifikasi baru
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Tampilkan notifikasi
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Sembunyikan notifikasi setelah 5 detik
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Fungsi untuk memformat email (menyensor sebagian)
function maskEmail(email) {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2 
        ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
        : localPart.charAt(0) + '*';
    
    return `${maskedLocal}@${domain}`;
}

// Ekspor fungsi untuk digunakan di editor.js
window.vtechApp = {
    subscribers,
    maskEmail,
    showNotification
};
