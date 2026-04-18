// ─── Firebase SDK Imports (Version 12.11.0) ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ─── Firebase Configuration ───
const firebaseConfig = {
    apiKey: "AIzaSyA3j0hKqGlcIZBKUdWk2QgSItKQBgeyXyA",
    authDomain: "cdhp-87979.firebaseapp.com",
    projectId: "cdhp-87979",
    storageBucket: "cdhp-87979.firebasestorage.app",
    messagingSenderId: "1059870042612",
    appId: "1:1059870042612:web:2eac3dcb927f3e213bb1a1",
    measurementId: "G-BZS8FPB1K2"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function for time ago
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + "m ago";
    return "Just now";
}

// ─── Global Function: Initialize Header UI ───
window.initHeader = function() {
    const menuBtn = document.getElementById('menu-btn');
    const headerNav = document.getElementById('header-nav');
    
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');
    
    const signOutBtn = document.getElementById('signOutBtn');

    // 1. Mobile Menu Toggle
    if (menuBtn && headerNav) {
        menuBtn.onclick = function(e) {
            e.stopPropagation();
            headerNav.classList.toggle('active');
        };
    }

    // 2. Profile Dropdown Toggle
    if (profileBtn && profileDropdown) {
        profileBtn.onclick = function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            if(notifDropdown) notifDropdown.classList.remove('show');
        };
    }

    // 3. Notification Dropdown Toggle
    if (notifBtn && notifDropdown) {
        notifBtn.onclick = function(e) {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
            if(profileDropdown) profileDropdown.classList.remove('show');
        };
    }

    // 4. Dynamic Active Link Highlight
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'PatientDashboard.html'; // Default to dashboard if root
    
    const navLinks = document.querySelectorAll('.header-nav-link');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentFile) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 5. Sign Out
    if (signOutBtn) {
        signOutBtn.onclick = function(e) {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = '../src/index.html';
            }).catch((error) => {
                console.error("Sign Out Error:", error);
            });
        };
    }

    // Close Dropdowns on outside click
    document.onclick = function(e) {
        if (profileBtn && profileDropdown && !profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
        if (notifBtn && notifDropdown && !notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.remove('show');
        }
        if (window.innerWidth <= 1200 && headerNav && headerNav.classList.contains('active') && menuBtn && !menuBtn.contains(e.target) && !headerNav.contains(e.target)) {
            headerNav.classList.remove('active');
        }
    };

    // ─── Firebase Auth State Observer & Notifications ───
    onAuthStateChanged(auth, async (user) => {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userIdDisplay = document.getElementById('userIdDisplay');
        const profileBtnImg = document.getElementById('profile-btn');

        if (user) {
            try {
                // Fetch User Profile
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    if(userNameDisplay) userNameDisplay.textContent = userData.name;
                    
                    if(userIdDisplay) {
                        if (userData.role) {
                            const formattedRole = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
                            userIdDisplay.textContent = `Portal : ${formattedRole}`;
                        } else {
                            userIdDisplay.textContent = "Portal : Not Found";
                        }
                    }

                    if (profileBtnImg) {
                        if (userData.profileImageUrl) {
                            profileBtnImg.src = userData.profileImageUrl;
                        } else {
                            profileBtnImg.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
                        }
                    }
                }

                // ─── Notifications Logic ───
                const notifList = document.getElementById('notification-list');
                const notifBadge = document.getElementById('notification-badge');
                const markAllReadBtn = document.getElementById('mark-all-read-btn');

                if (notifList && notifBadge) {
                    // Fetch notifications for the logged-in patient
                    const q = query(
                        collection(db, "notifications"),
                        where("userId", "==", user.uid)
                    );

                    onSnapshot(q, (snapshot) => {
                        notifList.innerHTML = '';
                        let unreadCount = 0;
                        const notifications = [];

                        snapshot.forEach((docSnap) => {
                            const data = docSnap.data();
                            notifications.push({ id: docSnap.id, ref: docSnap.ref, ...data });
                            if (!data.isRead) unreadCount++;
                        });

                        // Sort newest first in memory
                        notifications.sort((a, b) => {
                            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                            return timeB - timeA;
                        });

                        // Toggle Badge
                        notifBadge.style.display = unreadCount > 0 ? 'block' : 'none';

                        if (notifications.length === 0) {
                            notifList.innerHTML = '<div style="padding: 16px; text-align: center; font-size: 0.85rem; color: var(--text-muted);">No notifications yet.</div>';
                            return;
                        }

                        notifications.forEach(notif => {
                            const item = document.createElement('div');
                            item.className = `notif-item ${!notif.isRead ? 'unread' : ''}`;
                            
                            // Dynamic Icon and Link based on message content
                            let iconClass = 'fa-solid fa-bell';
                            let bgClass = 'bg-[#f0f9ff] text-[#0ea5e9]'; 
                            let targetLink = 'appointment.html'; 

                            const msgLower = (notif.message || '').toLowerCase();
                            const titleLower = (notif.title || '').toLowerCase();
                            const fullText = msgLower + " " + titleLower;

                            // Keyword mapping for specific pages and colors
                            if(fullText.includes('approved') || fullText.includes('rescheduled')) {
                                iconClass = 'fa-solid fa-calendar-check';
                                bgClass = 'bg-[#ecfdf5] text-[#10b981]';
                                targetLink = `appointment.html`; // Take to appointment history
                            } else if (fullText.includes('cancel')) {
                                iconClass = 'fa-solid fa-ban';
                                bgClass = 'bg-[#fef2f2] text-[#ef4444]';
                                targetLink = `appointment.html`;
                            } else if (fullText.includes('complet') || fullText.includes('prescription')) {
                                iconClass = 'fa-solid fa-file-medical';
                                bgClass = 'bg-[#f5f3ff] text-[#8b5cf6]';
                                targetLink = 'medical-records.html'; // Take to medical records
                            } else if (fullText.includes('pending') || fullText.includes('request')) {
                                iconClass = 'fa-regular fa-clock';
                                bgClass = 'bg-[#fffbeb] text-[#f59e0b]';
                            }

                            const date = notif.createdAt ? notif.createdAt.toDate() : new Date();
                            const timeAgoStr = timeAgo(date);

                            item.innerHTML = `
                                <div class="notif-icon" style="${bgClass}">
                                    <i class="${iconClass}"></i>
                                </div>
                                <div class="notif-content">
                                    <div class="notif-title">${notif.title || 'Update'}</div>
                                    <div class="notif-msg">${notif.message || ''}</div>
                                    <div class="notif-time"><i class="fa-regular fa-clock"></i> ${timeAgoStr}</div>
                                </div>
                                ${!notif.isRead ? '<div style="width: 8px; height: 8px; background-color: var(--color-primary); border-radius: 50%; margin-top: 6px;"></div>' : ''}
                            `;

                            // Mark as read and redirect
                            item.addEventListener('click', async () => {
                                if (!notif.isRead) {
                                    await updateDoc(doc(db, "notifications", notif.id), { isRead: true });
                                }
                                window.location.href = notif.link || targetLink;
                            });

                            notifList.appendChild(item);
                        });

                        // Mark all as read
                        if (markAllReadBtn) {
                            markAllReadBtn.onclick = async (e) => {
                                e.stopPropagation();
                                const batch = writeBatch(db);
                                let hasUpdates = false;
                                notifications.forEach((n) => {
                                    if (!n.isRead) {
                                        batch.update(n.ref, { isRead: true });
                                        hasUpdates = true;
                                    }
                                });
                                if (hasUpdates) {
                                    try {
                                        await batch.commit();
                                    } catch (err) {
                                        console.error("Error marking all read:", err);
                                    }
                                }
                            };
                        }
                    }, (error) => {
                        console.error("Error listening to notifications:", error);
                        notifList.innerHTML = '<div style="padding: 16px; text-align: center; font-size: 0.85rem; color: #ef4444;">Failed to load notifications.</div>';
                    });
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
                if(userNameDisplay) userNameDisplay.textContent = "Error loading name";
            }
        } else {
            window.location.href = 'index.html';
        }
    });
};