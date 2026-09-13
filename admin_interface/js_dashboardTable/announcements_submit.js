import { getServices } from '../../firebase/client.js';
import { hasRole } from '../../firebase/auth.js';
import { watchAnnouncements, createAnnouncement, removeAnnouncement, validateAnnouncement, announcementError, textElement, announcementImage } from '../../firebase/announcements.js';

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
    catch (error) { formFeedback.textContent = error.message; input.value = ''; return; }
    resetImage(); file = selected; previewURL = URL.createObjectURL(file);
    const image = document.createElement('img'); image.src = previewURL; image.className = 'photo_placeholder'; image.alt = 'Selected attachment';
    const remove = textElement('button', 'btn_remove_img', 'Remove image'); remove.type = 'button'; remove.onclick = () => { if (!busy) resetImage(); };
    document.getElementById('photoPreviews').append(image, remove);
}));
open.onclick = () => modal.classList.add('active');
modal.onclick = event => { if (event.target === modal && !busy) modal.classList.remove('active'); };
view.onclick = event => { if (event.target === view) view.classList.remove('active'); };
document.getElementById('closeViewModalBtn').onclick = () => view.classList.remove('active');
function render(items) {
    list.replaceChildren();
    if (!items.length) list.append(textElement('p', '', 'No announcements yet.'));
    items.forEach(item => {
        const card = textElement('div', 'announcement_card', '');
        const details = textElement('button', '', ''); details.type = 'button';
        details.append(textElement('h3', '', item.title), textElement('p', '', item.content));
        const image = announcementImage(item.announcementImageURL, 'card_img_thumb'); if (image) details.append(image);
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
            try { feedback.textContent = await removeAnnouncement(item); }
            catch (error) { feedback.textContent = announcementError(error); remove.disabled = false; }
        };
        card.append(details, remove); list.append(card);
    });
}
post.onclick = async () => {
    if (busy) return;
    busy = true; post.disabled = true; title.disabled = true; content.disabled = true; inputs.forEach(input => input.disabled = true);
    formFeedback.textContent = 'Publishing…';
    try {
        await createAnnouncement(title.value, content.value, file);
        title.value = ''; content.value = ''; resetImage(); modal.classList.remove('active');
        feedback.textContent = 'Announcement published.'; formFeedback.textContent = '';
    } catch (error) { formFeedback.textContent = announcementError(error); }
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
            feedback.textContent = metadata.fromCache ? 'Connecting… displayed announcements may be out of date.' : '';
        }, error => feedback.textContent = announcementError(error));
    } catch (error) { feedback.textContent = announcementError(error); }
    finally { starting = false; }
}
document.getElementById('announcementRetry').onclick = start;
await start();
