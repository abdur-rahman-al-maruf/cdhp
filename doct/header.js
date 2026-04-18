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
window.initializeHeader = function() {
    
    // 1. Profile Dropdown Toggle Logic
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    const notifBtn = document.getElementById('notification-btn');
    const notifMenu = document.getElementById('notification-menu');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('invisible');
            profileMenu.classList.toggle('opacity-0');
            profileMenu.classList.toggle('translate-y-2');
            
            // Close notification menu if open
            if(notifMenu && !notifMenu.classList.contains('invisible')) {
                notifMenu.classList.add('invisible', 'opacity-0', 'translate-y-2');
            }
        });
    }

    // Notification Dropdown Toggle Logic
    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifMenu.classList.toggle('invisible');
            notifMenu.classList.toggle('opacity-0');
            notifMenu.classList.toggle('translate-y-2');
            
            // Close profile menu if open
            if(profileMenu && !profileMenu.classList.contains('invisible')) {
                profileMenu.classList.add('invisible', 'opacity-0', 'translate-y-2');
            }
        });
    }

    // Close dropdowns when clicking anywhere outside
    document.addEventListener('click', (e) => {
        if (profileBtn && profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.add('invisible', 'opacity-0', 'translate-y-2');
        }
        if (notifBtn && notifMenu && !notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
            notifMenu.classList.add('invisible', 'opacity-0', 'translate-y-2');
        }
    });

    // 2. Mobile Menu Toggle Logic
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('header-nav');

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            if (mobileMenu.classList.contains('max-h-0')) {
                mobileMenu.classList.remove('max-h-0');
                mobileMenu.classList.add('max-h-[500px]'); 
            } else {
                mobileMenu.classList.add('max-h-0');
                mobileMenu.classList.remove('max-h-[500px]'); 
            }
        });
    }
    
    // 3. Dynamic Active Link Logic
    const currentUrl = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkUrl = link.getAttribute('href');
        // Prevent matching empty hrefs, fallback for active matching
        if (linkUrl && linkUrl !== '#' && currentUrl.includes(linkUrl)) {
            link.classList.add('text-white', 'font-semibold');
            link.classList.remove('text-white/80');
            
            const underline = link.querySelector('.underline-anim');
            if (underline) {
                underline.classList.remove('opacity-0', 'w-0');
                underline.classList.add('opacity-100', 'w-[70%]');
            }
        }
    });

    // 4. Sign Out Logic
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                // Return to login page after successful sign out
                window.location.href = '../src/index.html';
            }).catch((error) => {
                console.error("Sign Out Error:", error);
            });
        });
    }

    // 5. Firebase Auth State & Fetch Data
    onAuthStateChanged(auth, async (user) => {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userIdDisplay = document.getElementById('userIdDisplay');
        const profileImg = document.getElementById('header-profile-img');

        if (user) {
            try {
                // Fetch user profile data from Firestore
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    
                    // Display Name
                    if (userNameDisplay) userNameDisplay.textContent = userData.name || 'Doctor';
                    
                    // Display Role (Portal)
                    if (userIdDisplay && userData.role) {
                        const formattedRole = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
                        userIdDisplay.textContent = `Portal : ${formattedRole}`;
                    }
                    
                    // Set Profile Picture
                    if (profileImg) {
                        if (userData.profileImageUrl) {
                            profileImg.src = userData.profileImageUrl;
                        } else {
                            profileImg.src = `https://ui-avatars.com/api/?name=${userData.name || 'Doctor'}&background=ccfbf1&color=0f766e`;
                        }
                    }
                }

                // 6. Fetch Notifications
                const notifList = document.getElementById('notification-list');
                const notifBadge = document.getElementById('notification-badge');
                const markAllReadBtn = document.getElementById('mark-all-read-btn');

                if (notifList && notifBadge) {
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
                            // Filter: Only process 'New Appointment Alerts' (type: appointment or registration)
                            if (data.type === 'appointment' || data.type === 'registration') {
                                notifications.push({ id: docSnap.id, ref: docSnap.ref, ...data });
                                if (!data.isRead) unreadCount++;
                            }
                        });

                        // Sort descending by createdAt in memory
                        notifications.sort((a, b) => {
                            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                            return timeB - timeA;
                        });

                        // Show/hide badge
                        if (unreadCount > 0) {
                            notifBadge.classList.remove('hidden');
                        } else {
                            notifBadge.classList.add('hidden');
                        }

                        // Handle empty state
                        if (notifications.length === 0) {
                            notifList.innerHTML = '<div class="p-5 text-center text-sm text-slate-400">No new appointment alerts yet.</div>';
                            return;
                        }

                        // Render notifications
                        notifications.forEach(notif => {
                            const item = document.createElement('div');
                            item.className = `p-3 border-b border-slate-700/50 hover:bg-white/5 cursor-pointer transition-colors flex gap-3 items-start ${!notif.isRead ? 'bg-teal-900/20' : ''}`;
                            
                            const icon = 'fa-user-plus text-emerald-400';

                            // Format date
                            const date = notif.createdAt ? notif.createdAt.toDate() : new Date();
                            const timeAgoStr = timeAgo(date);

                            item.innerHTML = `
                                <div class="mt-1 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                                    <i class="fa-solid ${icon}"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="text-sm font-bold ${!notif.isRead ? 'text-white' : 'text-slate-300'} mb-0.5 leading-tight">${notif.title || 'New Appointment Request'}</p>
                                    <p class="text-xs text-slate-400 line-clamp-2">${notif.message || 'You have a new patient registration pending.'}</p>
                                    <p class="text-[10px] text-slate-500 mt-1"><i class="fa-regular fa-clock"></i> ${timeAgoStr}</p>
                                </div>
                                ${!notif.isRead ? '<div class="w-2 h-2 rounded-full bg-teal-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(20,184,166,0.8)]"></div>' : ''}
                            `;

                            // Mark as read on click and always redirect to new-registrations.html
                            item.addEventListener('click', async () => {
                                if (!notif.isRead) {
                                    await updateDoc(doc(db, "notifications", notif.id), { isRead: true });
                                }
                                window.location.href = 'new-registrations.html';
                            });

                            notifList.appendChild(item);
                        });
                        
                        // Mark all as read logic
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
                        notifList.innerHTML = '<div class="p-5 text-center text-sm text-red-400">Failed to load notifications.</div>';
                    });
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            // Unauthenticated user
            window.location.href = '../src/index.html';
        }
    });
};