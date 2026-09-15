import { readOffline, saveOffline, removeOffline } from './offline-cache.mjs';
import { getServices } from "./client.js";
import { getRoleProfile, logout, authMessage } from "./auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const container = document.querySelector(".app_container");
const status = document.getElementById("sessionStatus");
const message = document.getElementById("sessionMessage");
const retry = document.getElementById("sessionRetry");
const button = document.getElementById("residentLogout");
const card = document.querySelector('[data-fb-collection="residents"]');
const profileStatus = document.getElementById("profileStatus");
const profileMessage = document.getElementById("profileMessage");
const profileRetry = document.getElementById("profileRetry");
let auth;
let unsubscribe;
let starting = false;
let activeUid = null;
let profileRequest = 0;
let loadingProfile = false;
let hasProfile = false;

function clearProfile() {
    if (!card) return;
    for (const field of ["fullName", "emailAddress", "homeBarangay"]) {
        card.querySelector(`[data-fb-field="${field}"]`).textContent = "";
    }
    card.querySelector(".profile_avatar").textContent = "…";
    hasProfile = false;
}

function showProfile(profile) {
    for (const field of ["fullName", "emailAddress", "homeBarangay"]) {
        card.querySelector(`[data-fb-field="${field}"]`).textContent = profile[field] || "Not provided";
    }
    const words = (profile.fullName || "").trim().split(/\s+/).filter(Boolean);
    const initials = words.length > 1 ? [words[0], words[words.length - 1]] : words;
    card.querySelector(".profile_avatar").textContent = initials.map(word => Array.from(word)[0]).join("").toUpperCase() || "?";
    hasProfile = true;
}

async function loadProfile() {
    if (!card || !auth?.currentUser || loadingProfile) return;
    const user = auth.currentUser;
    const saved = readOffline(user.uid, 'profile');
    if (saved) showProfile(saved);
    if (!navigator.onLine) {
        profileMessage.textContent = saved ? "Showing saved profile information. Reconnect to refresh." : "No profile saved in this session. Connect to load it.";
        profileStatus.hidden = false;
        return;
    }
    const request = ++profileRequest;
    loadingProfile = true;
    profileRetry.disabled = true;
    card.setAttribute("aria-busy", "true");
    if (!hasProfile) card.querySelector('[data-fb-field="fullName"]').textContent = "Loading profile…";
    try {
        const profile = await getRoleProfile(user, "Resident");
        // Ignore a response for an account that has since signed out or changed.
        if (request !== profileRequest || auth.currentUser?.uid !== user.uid) return;
        if (!profile) {
            removeOffline(user.uid, "profile");
            clearProfile();
            profileMessage.textContent = "Your resident profile is unavailable. Retry or contact the project administrator.";
            profileStatus.hidden = false;
            return;
        }
        showProfile(profile);
        saveOffline(user.uid, 'profile', Object.fromEntries(['fullName', 'emailAddress', 'homeBarangay'].map(field => [field, profile[field] || ''])));
        profileStatus.hidden = true;
    } catch (error) {
        if (request !== profileRequest || auth.currentUser?.uid !== user.uid) return;
        console.error("Resident profile loading failed:", error.code || error.name);
        const denied = ["permission-denied", "unauthenticated"].includes(error.code);
        if (denied) removeOffline(user.uid, "profile");
        if (denied || !hasProfile) clearProfile();
        profileMessage.textContent = denied
            ? "Unable to access your profile. Retry or contact the project administrator."
            : "Unable to load your profile. Check your connection and retry.";
        profileStatus.hidden = false;
    } finally {
        if (request === profileRequest) {
            loadingProfile = false;
            profileRetry.disabled = false;
            card.setAttribute("aria-busy", "false");
        }
    }
}

function handleSession(user) {
    if (activeUid !== user?.uid) {
        ++profileRequest;
        loadingProfile = false;
        clearProfile();
        if (profileStatus) profileStatus.hidden = true;
    }
    activeUid = user?.uid || null;
    if (!user || user.isAnonymous) {
        container.hidden = true;
        window.location.replace("signed-out.html");
        return;
    }
    // Authentication restores the session without a Firestore profile lookup.
    // Database rules enforce access to each page's data independently.
    container.hidden = false;
    status.hidden = true;
    if (button) button.disabled = false;
    if (card) void loadProfile();
}

async function startSession() {
    if (starting) return;
    starting = true;
    retry.disabled = true;
    try {
        ({ auth } = await getServices());
        unsubscribe?.();
        unsubscribe = onAuthStateChanged(auth, handleSession);
    } catch (error) {
        message.textContent = "Unable to restore your sign-in. Please retry.";
        status.hidden = false;
        console.error("Session restoration failed:", error.code || error.name);
    } finally {
        starting = false;
        retry.disabled = false;
    }
}

retry.addEventListener("click", startSession);
profileRetry?.addEventListener("click", loadProfile);
window.addEventListener("online", () => {
    if (card && !profileStatus.hidden) void loadProfile();
});
window.addEventListener("offline", () => {
    if (!card || !activeUid) return;
    profileMessage.textContent = "Connection lost. Loaded profile information may be out of date.";
    profileStatus.hidden = false;
});
if (button) {
    button.addEventListener("click", async () => {
        button.disabled = true;
        try {
            await logout();
            container.hidden = true;
            window.location.replace("signed-out.html");
        } catch (error) {
            message.textContent = authMessage(error);
            status.hidden = false;
            button.disabled = false;
        }
    });
}
await startSession();
