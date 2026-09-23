import { getServices } from '../../firebase/client.js';
import { hasRole } from '../../firebase/auth.js';
import { watchAnnouncements, createAnnouncement, removeAnnouncement, validateAnnouncement, announcementError, textElement, announcementImage } from '../../firebase/announcements.js';

function adminNotice(node, text, tone = 'pending') {
    node.className = 'admin_notice notice-' + tone;
    node.textContent = text;
}


const list = document.getElementById('announcementsList');
const feedback = document.getElementById('announcementFeedback');
const formFeedback = document.getElementById('announcementFormFeedback');
const modal = document.getElementById('announcementModal');
const view = document.getElementById('viewAnnouncementModal');
const open = document.getElementById('openModalBtn');
const post = document.getElementById('postAnnouncementBtn');
const title = document.getElementById('announcementTitle');
const content = document.getElementById('announcementContent');
const inputs = [document.getElementById('imageUploadCamera'), document.getElementById('imageUploadFile')];
let file = null;
let previewURL;
let busy = false;
let stop;
let starting = false;
function resetImage() {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
    file = null;
    inputs.forEach(input => input.value = '');
    document.getElementById('photoPreviews').replaceChildren();
}
inputs.forEach(input => input.addEventListener('change', () => {
    const selected = input.files[0];
    if (!selected) return;
    try { validateAnnouncement('Preview', 'Preview', selected); }
    catch (error) { adminNotice(formFeedback, error.message, 'error'); input.value = ''; return; }
    resetImage(); file = selected; previewURL = URL.createObjectURL(file);
    const image = document.createElement('img'); image.src = previewURL; image.className = 'photo_placeholder'; image.alt = 'Selected attachment';
    const remove = textElement('button', 'btn_remove_img', 'Remove image'); remove.type = 'button'; remove.onclick = () => { if (!busy) resetImage(); };
    document.getElementById('photoPreviews').append(image, remove);
}));
open.onclick = () => { modal.classList.add('active'); title.focus(); };
document.getElementById('closeAnnouncementBtn').onclick = () => { if (!busy) { modal.classList.remove('active'); open.focus(); } };
modal.onclick = event => { if (event.target === modal && !busy) modal.classList.remove('active'); };
view.onclick = event => { if (event.target === view) view.classList.remove('active'); };
document.getElementById('closeViewModalBtn').onclick = () => view.classList.remove('active');
function render(items) {
    list.replaceChildren();
    if (!items.length) list.append(textElement('p', 'announcement_empty', 'No announcements yet. Create an announcement to share an update with residents.'));
    items.forEach(item => {
        const card = textElement('div', 'announcement_card', '');
        const copy = textElement('div', 'announcement_copy', '');
        const posted = item.datePosted?.toDate?.();
        const date = posted instanceof Date && !Number.isNaN(posted.getTime())
            ? 'Published ' + posted.toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }) + ' (Philippine time)'
            : 'Publication time pending';
        copy.append(textElement('h3', '', item.title), textElement('p', 'announcement_date', date), textElement('p', 'announcement_excerpt', item.content));
        const photo = textElement('div', 'announcement_photo', '');
        const image = announcementImage(item.announcementImageURL, 'card_img_thumb');
        photo.append(image || textElement('span', '', 'No image attached'));
        const details = textElement('button', 'btn_announcement_details', 'View details'); details.type = 'button';
        details.onclick = () => {
            document.getElementById('viewTitle').textContent = item.title;
            document.getElementById('viewContent').textContent = item.content;
            const images = document.getElementById('viewImagesContainer'); images.replaceChildren();
            const full = announcementImage(item.announcementImageURL, 'view_full_img'); if (full) images.append(full);
            view.classList.add('active');
        };
        const remove = textElement('button', 'btn_delete_announcement', 'Delete'); remove.type = 'button';
        remove.onclick = async () => {
            if (!confirm('Delete this announcement?')) return;
            remove.disabled = true;
            try {
                const result = await removeAnnouncement(item);
                adminNotice(feedback, result, result === 'Announcement deleted.' ? 'success' : 'pending');
            }
            catch (error) { adminNotice(feedback, announcementError(error), 'error'); remove.disabled = false; }
        };
        const actions = textElement('div', 'announcement_actions', '');
        actions.append(details, remove);
        card.append(copy, photo, actions); list.append(card);
    });
}
post.onclick = async () => {
    if (busy) return;
    busy = true; post.disabled = true; title.disabled = true; content.disabled = true; inputs.forEach(input => input.disabled = true);
    adminNotice(formFeedback, 'Publishing…', 'pending');
    try {
        await createAnnouncement(title.value, content.value, file);
        title.value = ''; content.value = ''; resetImage(); modal.classList.remove('active');
        adminNotice(feedback, 'Announcement published.', 'success'); adminNotice(formFeedback, '', 'pending');
    } catch (error) { adminNotice(formFeedback, announcementError(error), 'error'); }
    finally { busy = false; post.disabled = false; title.disabled = false; content.disabled = false; inputs.forEach(input => input.disabled = false); }
};
async function start() {
    if (starting) return;
    starting = true;
    open.disabled = true;
    try {
        const { auth } = await getServices();
        if (!await hasRole(auth.currentUser, 'Admin')) throw new Error('Admin access is required.');
        open.disabled = false; stop?.();
        stop = await watchAnnouncements((items, metadata) => {
            render(items);
            adminNotice(feedback, metadata.fromCache ? 'Connecting… displayed announcements may be out of date.' : '', 'pending');
        }, error => adminNotice(feedback, announcementError(error), 'error'));
    } catch (error) { adminNotice(feedback, announcementError(error), 'error'); }
    finally { starting = false; }
}
document.getElementById('announcementRetry').onclick = start;
await start();
