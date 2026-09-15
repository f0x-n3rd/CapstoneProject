// Independent of Firebase so connection/setup feedback still works if its SDK fails.
const banner = document.createElement('div');
banner.className = 'offline_notice';
banner.setAttribute('role', 'status');
banner.setAttribute('aria-live', 'polite');
(document.querySelector('.app_container') || document.body).prepend(banner);
let prepared = false, failed = false;
function update() {
    banner.hidden = navigator.onLine && prepared;
    banner.textContent = !navigator.onLine
        ? "You're offline—saved information may be outdated. Reconnect to submit reports or load photos and maps."
        : failed ? 'Offline setup could not finish. Reload while connected to try again.'
        : 'Preparing this device for offline viewing…';
}
window.addEventListener('online', update);
window.addEventListener('offline', update);
update();
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'OFFLINE_READY') { prepared = true; failed = false; update(); }
    });
    navigator.serviceWorker.register('./sw.js').then(async registration => {
        registration.active?.postMessage({ type: 'CHECK_OFFLINE_READY' });
        const observe = worker => {
            if (!worker) return;
            worker.addEventListener('statechange', () => {
                if (worker.state === 'activated') { prepared = true; failed = false; update(); }
                if (worker.state === 'redundant') { failed = true; update(); }
            });
        };
        observe(registration.installing);
        registration.addEventListener('updatefound', () => observe(registration.installing));
        const active = await navigator.serviceWorker.ready;
        active.active?.postMessage({ type: 'CHECK_OFFLINE_READY' });
    }).catch(() => { failed = true; update(); });
} else { failed = true; update(); }

// Conceal the document before it enters back/forward history. A restored page
// stays concealed until a fresh load checks the current Firebase session.
window.addEventListener('pagehide', () => { document.documentElement.style.visibility = 'hidden'; });
window.addEventListener('pageshow', event => {
    if (event.persisted) {
        document.documentElement.style.visibility = 'hidden';
        window.location.reload();
    }
});
