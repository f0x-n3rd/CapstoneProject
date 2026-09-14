import { createReportPhotoViewer } from '../../interface/report-photo.js';
import { watchAdminReports, updateAdminReport } from '../../firebase/admin-reports.js';
import { REPORT_STATUSES, REPORT_PRIORITIES, REPORT_ROUTING, reportDate, googleMapsLink } from '../../firebase/report-model.mjs';

const byId = id => document.getElementById(id);
const photoViewer = createReportPhotoViewer(byId('editorPhoto'));
const table = byId('reportsTableBody'), cards = byId('reportsListContainer');
const message = byId('reportsFeedback'), retry = byId('reportsRetry');
const modal = byId('reportEditor'), form = byId('processingForm'), feedback = byId('processingFeedback');
let reports = [], selected = null, expectedVersion = null, dirty = false, saving = false;
let uid = null, epoch = 0, stop, starting = false, allowed = false;

function node(tag, text = '', className = '') {
    const element = document.createElement(tag); element.textContent = text; element.className = className; return element;
}
function button(text, action, className = 'btn_update') {
    const result = node('button', text, className); result.type = 'button'; result.addEventListener('click', action); return result;
}
function options(id, values, optional = false) {
    const select = byId(id);
    if (optional) select.add(new Option('Not assigned', ''));
    values.forEach(value => select.add(new Option(value, value)));
}
options('processingStatus', REPORT_STATUSES);
options('processingPriority', REPORT_PRIORITIES, true);
options('processingRouting', REPORT_ROUTING, true);
function locationLink(report) {
    const url = googleMapsLink(report.geoLocation);
    if (!url) return node('span', 'No map pin supplied');
    const link = node('a', 'Open in Google Maps'); link.href = url;
    link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
}
function showDetails(report, resetDraft = false) {
    byId('editorTitle').textContent = 'Report ' + report.id;
    const details = byId('editorDetails'); details.replaceChildren();
    for (const [label, value] of [
        ['Resident', report.fullName], ['Resident UID', report.submitterID], ['Category', report.issueCategory],
        ['Barangay', report.barangayArea], ['Landmark', report.locationDescription],
        ['Description', report.issueDescription], ['Submitted', reportDate(report.timestamp)],
        ['Last updated', reportDate(report.updatedAt)], ['Saved status', report.reportStatus],
    ]) details.append(node('p', label + ': ' + (value || 'Not available')));
    details.append(locationLink(report));
    photoViewer.set(report);
    if (resetDraft) {
        byId('processingStatus').value = report.reportStatus;
        byId('processingPriority').value = report.priorityLevel || '';
        byId('processingRouting').value = report.routingLevel || '';
        byId('processingReferral').value = report.referredTo || '';
        expectedVersion = report.updatedAt; dirty = false;
    }
}
function openReport(id) {
    const report = reports.find(item => item.id === id);
    if (!allowed || !report || saving) return;
    selected = id; feedback.textContent = ''; showDetails(report, true);
    modal.hidden = false; modal.classList.add('active'); byId('processingStatus').focus();
}
function closeEditor(force = false) {
    if (saving && !force) return;
    modal.hidden = true; modal.classList.remove('active');
    photoViewer.clear();
    selected = null; expectedVersion = null; dirty = false;
    form.reset(); byId('editorDetails').replaceChildren(); feedback.textContent = '';
    byId('editorTitle').textContent = '';
}
function render() {
    const query = byId('residentSearchInput').value.trim().toLowerCase();
    const filtered = reports.filter(report => [report.fullName, report.id, report.issueCategory, report.barangayArea, report.reportStatus]
        .some(value => String(value || '').toLowerCase().includes(query)));
    table?.replaceChildren(); cards?.replaceChildren();
    for (const report of filtered) {
        if (table) {
            const row = node('tr');
            for (const value of [report.id, report.fullName, report.issueCategory, report.barangayArea + ' — ' + report.locationDescription]) row.append(node('td', value));
            const detail = node('td'); detail.append(button('View details / process', () => openReport(report.id)));
            row.append(detail, node('td', reportDate(report.timestamp)), node('td', report.pending ? 'Saving — not confirmed' : report.reportStatus));
            table.append(row);
        }
        if (cards) {
            const card = node('article', '', 'report_card');
            card.append(node('h2', report.fullName, 'resident_name'));
            for (const [label, value] of [
                ['Report', report.id], ['Category', report.issueCategory],
                ['Location', report.barangayArea + ' — ' + report.locationDescription],
                ['Description', report.issueDescription], ['Status', report.pending ? 'Saving — not confirmed' : report.reportStatus],
                ['Priority', report.priorityLevel || 'Not assigned'], ['Routing', report.routingLevel || 'Not assigned'],
                ['Referral', report.referredTo || 'Not assigned'], ['Submitted', reportDate(report.timestamp)],
            ]) card.append(node('p', label + ': ' + value));
            card.append(locationLink(report), button('View details / process', () => openReport(report.id)));
            cards.append(card);
        }
    }
    if (!filtered.length) {
        if (table) { const row = node('tr'), cell = node('td', query ? 'No matching reports.' : 'No reports available.'); cell.colSpan = 7; row.append(cell); table.append(row); }
        if (cards) cards.append(node('p', query ? 'No matching reports.' : 'No reports available.'));
    }
    if (selected) {
        const report = reports.find(item => item.id === selected);
        if (!report) { closeEditor(true); return; }
        if (!saving) {
            showDetails(report, !dirty);
            if (dirty && !report.updatedAt?.isEqual(expectedVersion)) feedback.textContent = 'This report changed. Reload saved values before updating.';
        }
    }
}
function clear() {
    allowed = false; ++epoch; reports = [];
    table?.replaceChildren(); cards?.replaceChildren(); closeEditor(true);
}
async function start() {
    if (starting) return;
    starting = true; retry.disabled = true; stop?.(); clear();
    const current = epoch;
    message.textContent = 'Checking admin access…';
    try {
        stop = await watchAdminReports((items, meta) => {
            if (current !== epoch) return;
            uid = meta.uid;
            if (meta.state === 'signed-out') { clear(); window.location.replace('admin_login/admin.html'); return; }
            if (meta.state !== 'ready') {
                allowed = false; reports = []; table?.replaceChildren(); cards?.replaceChildren(); closeEditor(true);
                message.textContent = meta.state === 'blocked' ? 'Admin access is unavailable.' : 'Checking admin access…'; return;
            }
            allowed = true; reports = items; render();
            message.textContent = meta.fromCache ? 'Showing loaded reports. Waiting for the latest information…' : '';
            retry.hidden = !meta.fromCache;
        }, error => {
            if (current !== epoch) return;
            allowed = false; reports = []; table?.replaceChildren(); cards?.replaceChildren(); closeEditor(true);
            message.textContent = error.code === 'permission-denied' ? 'Admin access was denied. Check your role and the published rules.' : 'Reports could not load. Check your connection and retry.';
            retry.hidden = false;
        });
    } catch {
        message.textContent = 'Reports could not load. Check your connection and retry.'; retry.hidden = false;
    } finally { starting = false; retry.disabled = false; }
}
byId('residentSearchInput').addEventListener('input', render);
retry.addEventListener('click', start);
byId('closeEditor').addEventListener('click', () => closeEditor());
modal.addEventListener('click', event => { if (event.target === modal) closeEditor(); });
byId('reloadProcessing').addEventListener('click', () => {
    const report = reports.find(item => item.id === selected);
    if (report && !saving) { showDetails(report, true); feedback.textContent = 'Loaded current saved values.'; }
});
form.addEventListener('input', () => { dirty = true; });
form.addEventListener('change', () => { dirty = true; });
form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!allowed || saving || !selected || !form.reportValidity()) return;
    const id = selected, sessionUid = uid, current = epoch;
    const input = {
        reportStatus: byId('processingStatus').value, priorityLevel: byId('processingPriority').value,
        routingLevel: byId('processingRouting').value, referredTo: byId('processingReferral').value,
    };
    saving = true; [...form.elements].forEach(control => control.disabled = true);
    feedback.textContent = 'Saving… Keep this page open until confirmed.';
    try {
        const result = await updateAdminReport(id, input, expectedVersion);
        if (!allowed || current !== epoch || sessionUid !== uid || result.uid !== uid || selected !== id) return;
        dirty = false;
        const latest = reports.find(report => report.id === id);
        if (latest) showDetails(latest, true);
        feedback.textContent = 'Changes saved.';
    } catch (error) {
        if (allowed && current === epoch && sessionUid === uid && selected === id) {
            feedback.textContent = error.code ? 'Changes were not saved. Check your connection and admin access, then retry.' : error.message;
        }
    } finally { saving = false; [...form.elements].forEach(control => control.disabled = false); }
});
window.addEventListener('beforeunload', event => {
    if (saving || dirty) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('online', () => { if (!allowed) void start(); });
await start();
