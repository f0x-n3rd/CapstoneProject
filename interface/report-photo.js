import { getServices } from '../firebase/client.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { downloadReportPhoto, uploadReportPhoto } from '../supabase/report-storage.js';

// One viewer per details panel. Bytes live only in a revocable object URL.
export function createReportPhotoViewer(container) {
    let key = '', generation = 0, controller, objectURL, report;
    function clear() {
        ++generation; controller?.abort();
        if (objectURL) URL.revokeObjectURL(objectURL);
        objectURL = null; key = ''; report = null; container.replaceChildren();
    }
    getServices().then(({ auth }) => {
        let uid = auth.currentUser?.uid;
        onAuthStateChanged(auth, user => {
            if (uid !== user?.uid) clear();
            uid = user?.uid;
        });
    }).catch(clear);
    async function load(currentReport, current) {
        controller?.abort(); controller = new AbortController();
        const signal = controller.signal;
        container.replaceChildren();
        if (objectURL) URL.revokeObjectURL(objectURL);
        objectURL = null;
        const message = document.createElement('p'); message.setAttribute('role', 'status'); message.textContent = 'Loading photo…'; container.append(message);
        try {
            const { auth } = await getServices();
            const uid = auth.currentUser?.uid;
            const blob = await downloadReportPhoto(currentReport.id, uid, signal);
            if (current !== generation || signal.aborted || auth.currentUser?.uid !== uid) return;
            objectURL = URL.createObjectURL(blob);
            const image = document.createElement('img');
            image.src = objectURL; image.alt = 'Photo attached to this report';
            image.style.maxWidth = '100%'; image.style.height = 'auto'; image.style.objectFit = 'contain';
            image.addEventListener('error', () => { message.textContent = 'This photo could not be displayed.'; });
            message.textContent = ''; container.append(image);
        } catch (error) {
            if (current !== generation || signal.aborted) return;
            message.textContent = error.status === 404 ? 'The photo has not uploaded yet.' : 'Photo could not load. Check your connection and access, then retry.';
            const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Retry photo';
            retry.addEventListener('click', () => void load(currentReport, current)); container.append(retry);
            const { auth } = await getServices().catch(() => ({ auth: null }));
            if (current !== generation || signal.aborted) return;
            if (error.status === 404 && auth?.currentUser?.uid === currentReport.submitterID) {
                const label = document.createElement('label'); label.textContent = 'Retry the missing photo upload: ';
                const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
                label.append(input); container.append(label);
                input.addEventListener('change', async () => {
                    const file = input.files?.[0]; if (!file) return;
                    input.disabled = true; retry.disabled = true; message.textContent = 'Uploading photo…';
                    try {
                        await uploadReportPhoto(currentReport.id, file, currentReport.submitterID, signal);
                        if (current === generation && !signal.aborted) await load(currentReport, current);
                    } catch (uploadError) {
                        if (current === generation && !signal.aborted) {
                            message.textContent = uploadError.message || 'Upload failed. Retry loading the photo before uploading again.';
                            input.disabled = false; retry.disabled = false; input.value = '';
                        }
                    }
                });
            }
        }
    }
    return {
        clear,
        set(next) {
            const nextKey = next.id + ':' + (next.supportingImageURL || '');
            if (key === nextKey) return;
            clear(); key = nextKey; report = next;
            if (!report.supportingImageURL) { container.textContent = 'No photo attached.'; return; }
            void load(report, generation);
        },
    };
}
