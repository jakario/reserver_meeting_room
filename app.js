// Mock Data for Meeting Rooms
const initialMockRooms = [
    { id: 1, name: "Meeting Room 201", floor: 2, capacity: 4, amenities: ["TV", "Whiteboard"], image: "https://images.unsplash.com/photo-1556761175-5973dc0f32f7?auto=format&fit=crop&q=80&w=800", status: "available" },
    { id: 2, name: "Meeting Room 202", floor: 2, capacity: 8, amenities: ["Projector", "Video Conf"], image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800", status: "available" },
    { id: 3, name: "Meeting Room 203", floor: 2, capacity: 12, amenities: ["Smart Board", "Coffee"], image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800", status: "available" },
    { id: 4, name: "Meeting Room 301", floor: 3, capacity: 4, amenities: ["Monitor", "Quiet Zone"], image: "https://images.unsplash.com/photo-1598425237654-4c0529d380e2?auto=format&fit=crop&q=80&w=800", status: "available" },
    { id: 5, name: "Meeting Room 302", floor: 3, capacity: 10, amenities: ["Projector", "Mic System"], image: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&q=80&w=800", status: "available" },
    { id: 6, name: "Meeting Room 303", floor: 3, capacity: 6, amenities: ["TV", "Whiteboard"], image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800", status: "available" },
    { id: 7, name: "Meeting Room 401", floor: 4, capacity: 20, amenities: ["Projector", "Mic System", "Catering"], image: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&q=80&w=800", status: "available" },
    { id: 8, name: "Meeting Room 402", floor: 4, capacity: 8, amenities: ["Smart Board", "Video Conf"], image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800", status: "available" },
    { id: 9, name: "Meeting Room 403", floor: 4, capacity: 5, amenities: ["TV", "Snacks"], image: "https://images.unsplash.com/photo-1556761175-5973dc0f32f7?auto=format&fit=crop&q=80&w=800", status: "available" }
];

// Load from LocalStorage or use default
let mockRooms = [];
const savedRooms = localStorage.getItem('meeting_rooms_data');
if (savedRooms) {
    mockRooms = JSON.parse(savedRooms);
} else {
    mockRooms = JSON.parse(JSON.stringify(initialMockRooms)); // Deep copy
    localStorage.setItem('meeting_rooms_data', JSON.stringify(mockRooms));
}

function saveRoomsToStorage() {
    localStorage.setItem('meeting_rooms_data', JSON.stringify(mockRooms));
}

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const roomGrid = document.getElementById('room-grid');
const modalOverlay = document.getElementById('booking-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBookingBtn = document.getElementById('cancel-booking');
const bookingForm = document.getElementById('booking-form');
const modalRoomName = document.getElementById('modal-room-name');
const bookingRoomId = document.getElementById('booking-room-id');
const toast = document.getElementById('toast');
const searchBtn = document.querySelector('.search-btn');

// Theme Management
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = themeToggle.querySelector('.material-symbols-rounded');
    icon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
}

// Initialize Theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
if (savedTheme === 'dark') {
    themeToggle.querySelector('.material-symbols-rounded').textContent = 'light_mode';
}
themeToggle.addEventListener('click', toggleTheme);

// Render Rooms
function renderRooms(rooms) {
    roomGrid.innerHTML = '';
    
    // Update status overview
    const availableCount = mockRooms.filter(r => r.status === 'available').length;
    const unavailableCount = mockRooms.filter(r => r.status === 'unavailable').length;
    const overviewDiv = document.getElementById('status-overview');
    if (overviewDiv) {
        overviewDiv.innerHTML = `
            <div style="background: var(--glass-bg); padding: 8px 16px; border-radius: var(--radius-full); display: flex; align-items: center; gap: 8px; border: 1px solid var(--border);">
                <span class="material-symbols-rounded" style="color: #10B981;">fiber_manual_record</span>
                <span>ว่าง: <strong>${availableCount}</strong></span>
            </div>
            <div style="background: var(--glass-bg); padding: 8px 16px; border-radius: var(--radius-full); display: flex; align-items: center; gap: 8px; border: 1px solid var(--border);">
                <span class="material-symbols-rounded" style="color: #EF4444;">fiber_manual_record</span>
                <span>ไม่ว่าง: <strong>${unavailableCount}</strong></span>
            </div>
        `;
    }

    if(rooms.length === 0) {
        roomGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">ไม่พบห้องประชุมที่ตรงกับเงื่อนไข</p>';
        return;
    }

    rooms.forEach(room => {
        // Create amenities HTML
        const amenitiesHTML = room.amenities.map(amenity => `
            <span class="amenity">
                <span class="material-symbols-rounded" style="font-size: 14px;">check</span> ${amenity}
            </span>
        `).join('');

        const isAvailable = room.status === 'available';
        const badgeColor = isAvailable ? '#10B981' : '#EF4444';
        const badgeText = isAvailable ? 'ว่าง' : 'ไม่ว่าง';
        
        const buttonHtml = isAvailable 
            ? `<button class="btn-book" onclick="openBookingModal(${room.id})">จองห้องนี้</button>`
            : `<button class="btn-book" disabled style="background: var(--bg-main); color: var(--text-muted); cursor: not-allowed; border: 1px solid var(--border);">ไม่ว่าง</button>`;

        const cardHTML = `
            <div class="room-card" data-id="${room.id}" style="${!isAvailable ? 'opacity: 0.75;' : ''}">
                <div class="room-image">
                    <div class="room-badge">
                        <span class="material-symbols-rounded" style="font-size: 16px; color: ${badgeColor};">fiber_manual_record</span> ${badgeText}
                    </div>
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
                        ${buttonHtml}
                    </div>
                </div>
            </div>
        `;
        
        roomGrid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Modal Management
window.openBookingModal = function(roomId) {
    const room = mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    modalRoomName.textContent = `จองห้อง: ${room.name}`;
    bookingRoomId.value = room.id;
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('booking-date').value = today;
    
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
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

// Handle Form Submission (Make it real via LocalStorage)
bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const roomId = parseInt(bookingRoomId.value);
    
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'กำลังดำเนินการ...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Change room status
        const roomIndex = mockRooms.findIndex(r => r.id === roomId);
        if(roomIndex !== -1) {
            mockRooms[roomIndex].status = 'unavailable';
            saveRoomsToStorage();
        }
        
        closeBookingModal();
        renderRooms(mockRooms);
        showToast('จองห้องประชุมสำเร็จแล้ว! ข้อมูลถูกบันทึกเรียบร้อย');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 600);
});

// Search functionality
searchBtn.addEventListener('click', () => {
    const originalText = searchBtn.textContent;
    searchBtn.textContent = 'กำลังค้นหา...';
    searchBtn.style.opacity = '0.7';
    
    // Get filter values
    const capacityFilter = document.getElementById('filter-capacity').value;
    
    setTimeout(() => {
        searchBtn.textContent = originalText;
        searchBtn.style.opacity = '1';
        
        // Filter logic
        let filteredRooms = [...mockRooms];
        
        if (capacityFilter !== 'any') {
            filteredRooms = filteredRooms.filter(room => {
                if (capacityFilter === 'small') return room.capacity >= 1 && room.capacity <= 4;
                if (capacityFilter === 'medium') return room.capacity >= 5 && room.capacity <= 10;
                if (capacityFilter === 'large') return room.capacity > 10;
                return true;
            });
        }
        
        renderRooms(filteredRooms);
        
    }, 400);
});

// Add reset functionality in console or UI if needed
// window.resetData = function() {
//     localStorage.removeItem('meeting_rooms_data');
//     location.reload();
// }

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderRooms(mockRooms);
});
