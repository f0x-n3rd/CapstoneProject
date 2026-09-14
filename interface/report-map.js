import { BARANGAY_CENTERS } from './barangay-centers.mjs';
import { validPin } from '../firebase/report-model.mjs';

export function createReportMap() {
    const container = document.getElementById('report_map');
    const barangay = document.getElementById('location');
    const status = document.getElementById('map_status');
    const confirm = document.getElementById('confirm_pin');
    const open = document.getElementById('open_map');
    const remove = document.getElementById('remove_pin');
    let map, marker, pin = null, busy = false;
    function reset() {
        if (marker) map.removeLayer(marker);
        marker = null; pin = null; confirm.checked = false; confirm.disabled = true;
        remove.disabled = true;
        status.textContent = 'No pin selected. Barangay and landmark are still required.';
    }
    function place(latlng) {
        if (busy || !BARANGAY_CENTERS[barangay.value]) return;
        const next = { latitude: latlng.lat, longitude: latlng.lng };
        if (!validPin(next)) return;
        pin = next; confirm.checked = false; confirm.disabled = false; remove.disabled = false;
        if (!marker) {
            marker = window.L.marker(latlng, { draggable: true, autoPan: true }).addTo(map);
            marker.on('dragend', () => place(marker.getLatLng()));
        } else marker.setLatLng(latlng);
        status.textContent = 'Selected pin: ' + pin.latitude.toFixed(6) + ', ' + pin.longitude.toFixed(6) + '. Confirm below to include it.';
    }
    function center() {
        const coordinates = BARANGAY_CENTERS[barangay.value];
        if (map && coordinates) map.setView(coordinates, 15);
    }
    function show() {
        if (busy) return;
        if (!BARANGAY_CENTERS[barangay.value]) { status.textContent = 'Choose a barangay first.'; return; }
        if (!window.L) { status.textContent = 'The map could not load. Reload this page when connected, or submit without a pin.'; return; }
        container.hidden = false;
        if (!map) {
            map = window.L.map(container, { scrollWheelZoom: false });
            window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).on('tileerror', () => {
                if (!pin) status.textContent = 'Map tiles could not load. You can retry or submit using barangay and landmark only.';
            }).addTo(map);
            map.on('click', event => place(event.latlng));
            center();
        }
        map.invalidateSize();
        if (!pin) center();
    }
    barangay.addEventListener('change', () => { reset(); center(); show(); });
    open.addEventListener('click', show);
    remove.addEventListener('click', reset);
    reset();
    return {
        show,
        reset() { reset(); container.hidden = true; },
        setBusy(value) {
            busy = value; open.disabled = value;
            confirm.disabled = value || !pin; remove.disabled = value || !pin;
            if (marker) value ? marker.dragging.disable() : marker.dragging.enable();
        },
        getPin() {
            if (pin && !confirm.checked) throw new Error('Confirm the selected map pin or remove it before submitting.');
            return pin ? { ...pin } : null;
        },
    };
}
