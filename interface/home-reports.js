import { watchOwnReports } from '../firebase/reports.js';
import { reportDate, reportError } from '../firebase/report-model.mjs';

const list = document.getElementById('homeReports');
const feedback = document.getElementById('homeReportsFeedback');
const note = document.getElementById('homeReportsNote');
const retry = document.getElementById('homeReportsRetry');
let stop, starting = false, generation = 0;
function notice(text, tone = 'pending') {
    feedback.textContent = text;
    feedback.className = 'notice-' + tone;
}
function node(tag, className, text = '') {
    const item = document.createElement(tag);
    item.className = className; item.textContent = text;
    return item;
}
function render(items) {
    note.hidden = items.length <= 5;
    list.replaceChildren();
    for (const report of items.slice(0, 5)) {
        const row = node('li', 'home_report_row');
        const link = node('a', 'home_report_link');
        link.href = 'tracking_reports.html#report=' + encodeURIComponent(report.id);
        const info = node('span', 'home_report_info');
        info.append(node('strong', '', report.issueCategory), node('span', 'home_report_meta', report.barangayArea + ' · ' + reportDate(report.timestamp)));
        const tones = { 'Received': 'blue', 'For Verification': 'amber', 'Referred': 'purple', 'Ongoing': 'blue', 'Resolved': 'green' };
        const tone = report.pending ? 'amber' : (tones[report.reportStatus] || 'neutral');
        link.append(info, node('span', 'home_report_badge home_report_' + tone, report.pending ? 'Sending — not confirmed' : report.reportStatus));
        row.append(link); list.append(row);
    }
}
async function start() {
    if (starting) return;
    starting = true; retry.disabled = true;
    const current = ++generation;
    stop?.();
    notice('Loading your reports…');
    try {
        stop = await watchOwnReports((items, meta) => {
            if (current !== generation) return;
            if (meta.state !== 'ready') {
                render([]); retry.hidden = true;
                notice(meta.state === 'signed-out' ? 'Sign in to view your reports.' : 'Loading your reports…');
                return;
            }
            render(items);
            notice(meta.fromCache
                ? (items.length ? 'Showing saved reports. Reconnect for the latest information.' : 'No reports saved in this session. Connect to load them.')
                : (items.length ? '' : 'You have not submitted any reports yet.'), meta.fromCache ? 'pending' : 'info');
            retry.hidden = !meta.fromCache;
        }, error => {
            if (current !== generation) return;
            if (['permission-denied', 'unauthenticated'].includes(error.code)) render([]);
            notice(reportError(error), 'error'); retry.hidden = false;
        });
    } catch (error) { notice(reportError(error), 'error'); retry.hidden = false; }
    finally { starting = false; retry.disabled = false; }
}
retry.addEventListener('click', start);
window.addEventListener('online', () => { if (!retry.hidden) void start(); });
await start();
