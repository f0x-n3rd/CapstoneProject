import { watchAnnouncements, announcementError, textElement, announcementImage } from '../firebase/announcements.js';
import { initializeAnnouncementSlider } from './announcement_loop.js';
const list = document.getElementById('announcements_container');
const slider = document.querySelector('.card_slider');
const feedback = document.getElementById('announcementFeedback');
const retry = document.getElementById('announcementRetry');
let stop;
let starting = false;
if (slider) initializeAnnouncementSlider();
function render(items) {
    const target = list || slider;
    target.replaceChildren();
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
    try {
        stop?.();
        stop = await watchAnnouncements((items, metadata) => {
            render(items);
            feedback.textContent = metadata.fromCache
                ? (items.length ? 'Showing previously loaded announcements. Waiting for a connection.' : 'Connecting to announcements…')
                : (items.length ? '' : 'No announcements have been published yet.');
            retry.hidden = !metadata.fromCache;
        }, error => { feedback.textContent = announcementError(error); retry.hidden = false; });
    } catch (error) { feedback.textContent = announcementError(error); retry.hidden = false; }
    finally { starting = false; retry.disabled = false; }
}
retry.onclick = start;
window.addEventListener('offline', () => { feedback.textContent = 'You are offline. Loaded announcements may be out of date.'; retry.hidden = false; });
window.addEventListener('online', () => { if (!retry.hidden) void start(); });
await start();
