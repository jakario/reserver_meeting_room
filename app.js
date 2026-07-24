// --- Firebase Configuration ---
// จำเป็นต้องนำค่า Config จาก Firebase (https://console.firebase.google.com/) มาใส่ตรงนี้
const firebaseConfig = {
  apiKey: "AIzaSyAz5Mx6GdnyxxrgT1mRvshVw3jHs8ww7yQ",
  authDomain: "reserve-meeting-room-2a1af.firebaseapp.com",
  // ถ้าคุณเลือก Server เป็นสิงคโปร์ URL จะเป็นตามด้านล่างนี้ แต่ถ้าเป็นสหรัฐฯ จะเป็น .firebaseio.com
  databaseURL: "https://reserve-meeting-room-2a1af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "reserve-meeting-room-2a1af",
  storageBucket: "reserve-meeting-room-2a1af.firebasestorage.app",
  messagingSenderId: "487896334123",
  appId: "1:487896334123:web:effef836250854b9c40f6e",
  measurementId: "G-5WR0RSLTZT"
};

// Initialize Firebase
let database;
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
    } catch (e) {
        console.log("Firebase error:", e);
    }
} else {
    console.log("Firebase not configured yet. Fallback to LocalStorage.");
}

// Setup 1 Meeting Room
const roomData = [
    { 
        id: 1, 
        name: "IT Meeting Room (ห้องประชุม IT)", 
        floor: 1, 
        capacity: 10, 
        amenities: ["Mic System", "Whiteboard", "Video Conf"], 
        image: "S__237256707.jpg",
        status: "available"
    }
];

// Global Bookings Array
let bookings = [];
let currentRoomId = null;
let currentPage = 1;
const rowsPerPage = 10;

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
                    <span class="material-symbols-rounded" style="font-size: 18px;">group</span>
                    รองรับไม่ควรเกิน ${room.capacity} คน
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
    const paginationControls = document.getElementById('pagination-controls');
    
    if (bookings.length === 0) {
        scheduleTbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">ไม่มีข้อมูลการจอง</td>
            </tr>
        `;
        if (paginationControls) paginationControls.innerHTML = '';
        updateBookingStatus();
        renderCalendar();
        return;
    }

    // Sort bookings by date descending
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalPages = Math.ceil(sortedBookings.length / rowsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedBookings = sortedBookings.slice(startIndex, startIndex + rowsPerPage);

    paginatedBookings.forEach(b => {
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

    if (typeof renderPagination === 'function') renderPagination(totalPages);
    updateBookingStatus();
    renderCalendar();
}

function renderPagination(totalPages) {
    const paginationControls = document.getElementById('pagination-controls');
    if (!paginationControls) return;
    
    paginationControls.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size: 18px;">chevron_left</span>';
    prevBtn.style.cssText = `display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-main); color: var(--text-main); cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'}; opacity: ${currentPage === 1 ? '0.5' : '1'}; transition: background 0.2s;`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderSchedule(); } };
    paginationControls.appendChild(prevBtn);
    
    // Page Numbers
    const pageIndicator = document.createElement('span');
    pageIndicator.textContent = `หน้า ${currentPage} / ${totalPages}`;
    pageIndicator.style.cssText = `font-size: 0.9rem; color: var(--text-muted); margin: 0 8px; font-weight: 500;`;
    paginationControls.appendChild(pageIndicator);
    
    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size: 18px;">chevron_right</span>';
    nextBtn.style.cssText = `display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-main); color: var(--text-main); cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'}; opacity: ${currentPage === totalPages ? '0.5' : '1'}; transition: background 0.2s;`;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderSchedule(); } };
    paginationControls.appendChild(nextBtn);
}

function updateBookingStatus() {
    const statusIndicator = document.getElementById('booking-status-indicator');
    if (!statusIndicator) return;

    if (bookings.length === 0) {
        statusIndicator.innerHTML = `<span class="material-symbols-rounded" style="margin-right: 6px; font-size: 20px; color: #10B981;">check_circle</span> <span style="color: #10B981;">ว่าง (ยังไม่มีคิวการจอง)</span>`;
        return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Filter upcoming bookings (date >= today)
    const upcoming = bookings.filter(b => b.date >= todayStr);
    
    // Sort by date, then startTime
    upcoming.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
    });

    if (upcoming.length === 0) {
        statusIndicator.innerHTML = `<span class="material-symbols-rounded" style="margin-right: 6px; font-size: 20px; color: #10B981;">check_circle</span> <span style="color: #10B981;">ว่าง (ไม่มีคิวจองเร็วๆ นี้)</span>`;
        return;
    }

    const nextBooking = upcoming[0];
    
    if (nextBooking.date === todayStr) {
        statusIndicator.innerHTML = `<span class="material-symbols-rounded" style="margin-right: 6px; font-size: 20px; color: #EF4444;">error</span> <span style="color: #EF4444;">มีการจองใช้วันนี้: ${nextBooking.startTime} - ${nextBooking.endTime}</span>`;
    } else {
        const dateObj = new Date(nextBooking.date);
        const options = { month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('th-TH', options);
        statusIndicator.innerHTML = `<span class="material-symbols-rounded" style="margin-right: 6px; font-size: 20px; color: #F59E0B;">schedule</span> <span style="color: #F59E0B;">การจองใกล้สุด: ${formattedDate} เวลา ${nextBooking.startTime}</span>`;
    }
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
    
    if (!startTime || !endTime) {
        showToast('กรุณาเลือกเวลาให้ครบถ้วน', true);
        return;
    }
    
    if (startTime >= endTime) {
        showToast('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น', true);
        return;
    }
    
    // Check for overlapping bookings
    const isOverlap = bookings.some(b => {
        if (b.date !== date) return false;
        // Check if the time intervals [startTime, endTime) overlap
        return (startTime < b.endTime) && (endTime > b.startTime);
    });

    if (isOverlap) {
        showToast('ไม่สามารถจองได้ เนื่องจากมีการจองในวันและเวลาดังกล่าวแล้ว', true);
        return;
    }
    
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

// Calendar State
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

window.changeCalendarMonth = function(offset) {
    currentCalendarMonth += offset;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderCalendar();
};

// Render Calendar
function renderCalendar() {
    const calendarEl = document.getElementById('sidebar-calendar');
    if (!calendarEl) return;
    
    const year = currentCalendarYear;
    const month = currentCalendarMonth;
    
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = `
        <div class="calendar-header" style="display: flex; justify-content: space-between; align-items: center;">
            <button onclick="changeCalendarMonth(-1)" style="background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; padding: 4px; border-radius: 4px;" onmouseover="this.style.background='var(--bg-main)'" onmouseout="this.style.background='none'"><span class="material-symbols-rounded" style="font-size: 20px;">chevron_left</span></button>
            <span style="font-weight: 600;">${monthNames[month]} ${year + 543}</span>
            <button onclick="changeCalendarMonth(1)" style="background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; padding: 4px; border-radius: 4px;" onmouseover="this.style.background='var(--bg-main)'" onmouseout="this.style.background='none'"><span class="material-symbols-rounded" style="font-size: 20px;">chevron_right</span></button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-name">อา</div>
            <div class="calendar-day-name">จ</div>
            <div class="calendar-day-name">อ</div>
            <div class="calendar-day-name">พ</div>
            <div class="calendar-day-name">พฤ</div>
            <div class="calendar-day-name">ศ</div>
            <div class="calendar-day-name">ส</div>
    `;
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    const now = new Date();
    const isCurrentMonthYear = (year === now.getFullYear() && month === now.getMonth());
    const todayDate = now.getDate();
    
    // Create a set of booked dates (YYYY-MM-DD)
    const bookedDates = new Set(bookings.map(b => b.date));
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = (isCurrentMonthYear && i === todayDate);
        const isBooked = bookedDates.has(dateStr);
        
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isBooked) classes += ' booked';
        
        html += `<div class="${classes}">${i}</div>`;
    }
    
    html += `</div>`;
    calendarEl.innerHTML = html;
}
