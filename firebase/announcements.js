import { getServices } from './client.js';
import { hasRole } from './auth.js';
import { collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { uploadAnnouncementImage, deleteAnnouncementImage, announcementImageURL } from '../supabase/storage.js';

export function validateAnnouncement(title, content, file) {
    if (!title.trim() || title.trim().length > 200) throw new Error('Enter a title of 1–200 characters.');
    if (!content.trim() || content.trim().length > 10000) throw new Error('Enter announcement text of 1–10,000 characters.');
    if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0)) {
        throw new Error('Choose one JPEG, PNG, or WebP image up to 5 MB.');
    }
}
export async function watchAnnouncements(onData, onError) {
    const { db } = await getServices();
    return onSnapshot(query(collection(db, 'announcements'), orderBy('datePosted', 'desc')), { includeMetadataChanges: true }, snapshot => {
        onData(snapshot.docs.map(item => ({ ...item.data(), id: item.id })), snapshot.metadata);
    }, onError);
}
async function adminServices() {
    if (!navigator.onLine) throw new Error('You are offline. Reconnect before making changes.');
    const services = await getServices();
    if (!await hasRole(services.auth.currentUser, 'Admin')) throw new Error('An authorized admin account is required.');
    return services;
}
export async function createAnnouncement(title, content, file) {
    validateAnnouncement(title, content, file);
    const { auth, db } = await adminServices();
    const target = doc(collection(db, 'announcements'));
    const data = { authorID: auth.currentUser.uid, title: title.trim(), content: content.trim(), datePosted: serverTimestamp() };
    let uploadedImage = false;
    try {
        if (file) {
            data.announcementImageURL = await uploadAnnouncementImage(target.id, file);
            uploadedImage = true;
        }
        await setDoc(target, data);
    } catch (error) {
        if (uploadedImage) {
            try { await deleteAnnouncementImage(target.id); }
            catch (cleanupError) { console.error('Announcement upload cleanup failed:', cleanupError.code); }
        }
        throw error;
    }
}
export async function removeAnnouncement(item) {
    const { db } = await adminServices();
    await deleteDoc(doc(db, 'announcements', item.id));
    if (item.announcementImageURL) {
        if (item.announcementImageURL !== announcementImageURL(item.id)) {
            return 'Announcement deleted. Its older image reference needs manual cleanup in the original storage service.';
        }
        try { await deleteAnnouncementImage(item.id); }
        catch {
            return 'Announcement deleted, but its image could not be removed from Storage. Ask the project administrator to clean it up.';
        }
    }
    return 'Announcement deleted.';
}
export function announcementError(error) {
    if (error.code === 'permission-denied' || error.code === 'storage/unauthorized') return 'Access denied. Check the published announcement rules and your admin access.';
    if (error.code?.startsWith('storage/')) return `${error.message} Your announcement text has been kept.`;
    if (error.code) return 'Unable to complete the request. Check your connection and retry.';
    return error.message;
}
// Use textContent for user-entered text; never interpolate it into HTML.
export function textElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}
export function announcementImage(url, className) {
    if (!url) return null;
    try { if (new URL(url).protocol !== 'https:') return null; } catch { return null; }
    const image = document.createElement('img');
    image.src = url;
    image.alt = 'Announcement attachment';
    image.className = className;
    image.loading = 'lazy';
    return image;
}
