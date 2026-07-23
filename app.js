// --- Firebase Configuration ---
// จำเป็นต้องนำค่า Config จาก Firebase (https://console.firebase.google.com/) มาใส่ตรงนี้
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
} catch (e) {
    console.log("Firebase not configured yet. Fallback to local array.");
}

// Setup 1 Meeting Room
const roomData = [
    { 
        id: 1, 
        name: "Main Meeting Room (ห้องประชุมใหญ่)", 
        floor: 1, 
        capacity: 20, 
        amenities: ["Projector", "Mic System", "Whiteboard", "Video Conf"], 
        image: "S__237256707.jpg",
        status: "available"
    }
];

// Global Bookings Array
let bookings = [];

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const roomGrid = document.getElementById('room-grid');
const modalOverlay = document.getElementById('booking-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBookingBtn = document.getElementById('cancel-booking');
const bookingForm = document.getElementById('booking-form');
const modalRoomName = document.getElementById('modal-room-name');
const toast = document.getElementById('toast');
const scheduleTbody = document.getElementById('schedule-tbody');

// Views & Navigation
const navBook = document.getElementById('nav-book');
const navSchedule = document.getElementById('nav-schedule');
const viewBooking = document.getElementById('view-booking');
const viewSchedule = document.getElementById('view-schedule');

navBook.addEventListener('click', (e) => {
    e.preventDefault();
    navBook.classList.add('active');
    navSchedule.classList.remove('active');
    viewBooking.style.display = 'block';
    viewSchedule.style.display = 'none';
});

navSchedule.addEventListener('click', (e) => {
    e.preventDefault();
    navSchedule.classList.add('active');
    navBook.classList.remove('active');
    viewBooking.style.display = 'none';
    viewSchedule.style.display = 'block';
});

// Theme Management
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const icon = themeToggle.querySelector('.material-symbols-rounded');
    icon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
}

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
if (savedTheme === 'dark') {
    themeToggle.querySelector('.material-symbols-rounded').textContent = 'light_mode';
}
themeToggle.addEventListener('click', toggleTheme);

// Render Room
function renderRooms() {
    roomGrid.innerHTML = '';
    const room = roomData[0];
    const amenitiesHTML = room.amenities.map(amenity => `
        <span class="amenity">
            <span class="material-symbols-rounded" style="font-size: 14px;">check</span> ${amenity}
        </span>
    `).join('');

    const cardHTML = `
        <div class="room-card" data-id="${room.id}">
            <div class="room-image">
                <img src="${room.image}" alt="${room.name}" loading="lazy">
            </div>
            <div class="room-content">
                <h4 class="room-title">${room.name}</h4>
                <div class="room-capacity">
                    <span class="material-symbols-rounded" style="font-size: 18px;">layers</span>
                    ชั้น ${room.floor}
                    <span class="material-symbols-rounded" style="font-size: 18px; margin-left: 12px;">group</span>
                    รองรับสูงสุด ${room.capacity} คน
                </div>
                <div class="room-amenities">
                    ${amenitiesHTML}
                </div>
                <div class="room-footer" style="justify-content: flex-end;">
                    <button class="btn-book" onclick="openBookingModal()">จองห้องนี้</button>
                </div>
            </div>
        </div>
    `;
    roomGrid.insertAdjacentHTML('beforeend', cardHTML);
}

// Render Schedule Table
function renderSchedule() {
    scheduleTbody.innerHTML = '';
    
    if (bookings.length === 0) {
        scheduleTbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">ไม่มีข้อมูลการจอง</td>
            </tr>
        `;
        return;
    }

    // Sort bookings by date descending
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedBookings.forEach(b => {
        // Format date
        const dateObj = new Date(b.date);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('th-TH', options);

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';
        tr.innerHTML = `
            <td style="padding: 16px;">${formattedDate}</td>
            <td style="padding: 16px;">${b.startTime} - ${b.endTime}</td>
            <td style="padding: 16px;"><strong>${b.title}</strong></td>
            <td style="padding: 16px; color: var(--primary); font-weight: 500;">${b.bookedBy}</td>
        `;
        scheduleTbody.appendChild(tr);
    });
}

// Real-time Database Listener
function setupDatabaseListener() {
    if (database) {
        // Listen to "bookings" path in Firebase Realtime Database
        database.ref('bookings').on('value', (snapshot) => {
            const data = snapshot.val();
            bookings = [];
            if (data) {
                // Convert object of objects to array
                for (let key in data) {
                    bookings.push(data[key]);
                }
            }
            renderSchedule();
        });
    } else {
        // Fallback to LocalStorage if Firebase is not configured
        const savedBookings = localStorage.getItem('meeting_bookings_data');
        if (savedBookings) {
            bookings = JSON.parse(savedBookings);
            renderSchedule();
        }
    }
}

// Modal Management
window.openBookingModal = function() {
    const room = roomData[0];
    modalRoomName.textContent = `จองห้อง: ${room.name}`;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('booking-date').value = today;
    
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

function closeBookingModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    bookingForm.reset();
}

closeModalBtn.addEventListener('click', closeBookingModal);
cancelBookingBtn.addEventListener('click', closeBookingModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeBookingModal();
});

// Toast Notification
function showToast(message, isError = false) {
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    toastMessage.textContent = message;
    
    if (isError) {
        toast.style.borderLeftColor = '#EF4444';
        toastIcon.textContent = 'error';
        toastIcon.style.color = '#EF4444';
    } else {
        toast.style.borderLeftColor = '#10B981';
        toastIcon.textContent = 'check_circle';
        toastIcon.style.color = '#10B981';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Handle Form Submission
bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('booking-title').value;
    const bookedBy = document.getElementById('booking-by').value;
    const date = document.getElementById('booking-date').value;
    const startTime = document.getElementById('booking-time-start').value;
    const endTime = document.getElementById('booking-time-end').value;
    
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'กำลังบันทึก...';
    submitBtn.disabled = true;
    
    const newBooking = {
        id: Date.now(),
        title,
        bookedBy,
        date,
        startTime,
        endTime
    };

    if (database) {
        // Push to Firebase
        database.ref('bookings').push(newBooking)
            .then(() => {
                closeBookingModal();
                showToast('จองห้องประชุมสำเร็จแล้ว! ข้อมูลถูกบันทึกขึ้นระบบส่วนกลาง');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            })
            .catch((error) => {
                console.error(error);
                showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', true);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
    } else {
        // Fallback to LocalStorage
        bookings.push(newBooking);
        localStorage.setItem('meeting_bookings_data', JSON.stringify(bookings));
        renderSchedule();
        
        closeBookingModal();
        showToast('ไม่ได้เชื่อมต่อ Firebase (บันทึกลง LocalStorage แทน)');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderRooms();
    setupDatabaseListener(); // Start listening for realtime updates
});
