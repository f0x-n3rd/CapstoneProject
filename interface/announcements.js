import { watchAnnouncements, announcementError, textElement, announcementImage } from '../firebase/announcements.js';
import { initializeAnnouncementSlider } from './announcement_loop.js';
const list = document.getElementById('announcements_container');
const slider = document.querySelector('.card_slider');
const feedback = document.getElementById('announcementFeedback');
const retry = document.getElementById('announcementRetry');
// Shared empty state, outside the carousel and announcement grid.
let emptyState;
if (slider || list) {
    emptyState = textElement('section', list ? 'announcement_empty_state announcement_empty_page' : 'announcement_empty_state', '');
    emptyState.hidden = true;
    emptyState.setAttribute('role', 'status');
    const icon = document.createElement('img');
    icon.src = 'assets/announcement.png';
    icon.alt = '';
    icon.className = 'announcement_empty_icon';
    emptyState.append(icon,
        textElement('h3', '', 'No announcements yet'),
        textElement('p', '', 'Community news and updates will appear here once published.'));
    (list || slider.parentElement).before(emptyState);
}
function noticeTone(node, tone) {
    node.classList.remove('notice-pending', 'notice-success', 'notice-error', 'notice-info');
    node.classList.add('notice-' + tone);
}
let stop;
let starting = false;
if (slider) initializeAnnouncementSlider();
function render(items, confirmedEmpty = false) {
    if (emptyState) emptyState.hidden = !confirmedEmpty;
    const target = list || slider;
    target.replaceChildren();
    if (slider) slider.parentElement.hidden = items.length === 0;
    for (const item of (slider ? items.slice(0, 5) : items)) {
        const card = textElement(list ? 'article' : 'div', list ? 'announcement_card' : 'empty_card', '');
        const details = textElement('div', list ? 'announcement_details' : 'announcement_text_block', '');
        const link = document.createElement('a'); link.href = `announcement.html#announcement-${encodeURIComponent(item.id)}`;
        link.className = 'announcement_preview_link';
        link.append(textElement(list ? 'h4' : 'h3', 'text_title', item.title));
        details.append(link, textElement('p', list ? 'announcement_content' : 'text_description', item.content));
        const image = announcementImage(item.announcementImageURL, list ? 'announcement_image' : 'image_announcement');
        if (slider && image) card.append(image);
        card.append(details);
        if (list) {
            card.id = `announcement-${item.id}`;
            const media = textElement('div', 'announcement_media', '');
            if (image) media.append(image);
            media.append(textElement('p', 'announcement_date', item.datePosted?.toDate ? `Published: ${item.datePosted.toDate().toLocaleString()}` : 'Publishing…'));
            card.append(media);
        }
        target.append(card);
    }
    slider?.dispatchEvent(new Event('announcements-updated'));
}
async function start() {
    if (starting) return;
    starting = true; retry.disabled = true;
    noticeTone(feedback, 'pending'); feedback.textContent = 'Connecting to announcements…';
    if (emptyState) emptyState.hidden = true;
    try {
        stop?.();
        stop = await watchAnnouncements((items, metadata) => {
            noticeTone(feedback, metadata.fromCache ? 'pending' : 'info');
            render(items, !metadata.fromCache && items.length === 0);
            feedback.textContent = metadata.fromCache
                ? (items.length ? 'Showing previously loaded announcements. Waiting for a connection.' : (navigator.onLine ? 'Connecting to announcements…' : 'No announcements saved in this session. Connect to load them.'))
                : (items.length || emptyState ? '' : 'No announcements have been published yet.');
            retry.hidden = !metadata.fromCache;
        }, error => { noticeTone(feedback, 'error'); feedback.textContent = announcementError(error); retry.hidden = false; });
    } catch (error) { noticeTone(feedback, 'error'); feedback.textContent = announcementError(error); retry.hidden = false; }
    finally { starting = false; retry.disabled = false; }
}
retry.onclick = start;
window.addEventListener('offline', () => { noticeTone(feedback, 'pending'); feedback.textContent = 'You are offline. Loaded announcements may be out of date.'; retry.hidden = false; });
window.addEventListener('online', () => { if (!retry.hidden) void start(); });
await start();
