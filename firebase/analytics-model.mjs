import { REPORT_CATEGORIES, REPORT_BARANGAYS, REPORT_STATUSES } from './report-model.mjs';

// ISO calendar dates in Odiongan, independent of the viewer's device timezone.
export function submissionDay(timestamp) {
    const milliseconds = timestamp?.toMillis?.();
    if (!Number.isFinite(milliseconds)) return null;
    const date = new Date(milliseconds + 8 * 60 * 60 * 1000);
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}
function validDay(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
        && new Date(value).toISOString().slice(0, 10) === value;
}
export function summarizeReports(reports, { from = '', to = '', category = '', barangay = '' } = {}) {
    if ((from && !validDay(from)) || (to && !validDay(to))) throw new Error('Choose valid dates.');
    if (from && to && from > to) throw new Error('The start date must be on or before the end date.');
    const rows = reports.filter(r => !r.pending).map(r => ({ report: r, day: submissionDay(r.timestamp) }))
        .filter(({ report: r, day }) => (!category || r.issueCategory === category) && (!barangay || r.barangayArea === barangay)
            && (!from || (day && day >= from)) && (!to || (day && day <= to)));
    const count = (values, field) => values.map(label => ({ label, count: rows.filter(({ report }) => report[field] === label).length }));
    const days = rows.map(r => r.day).filter(Boolean).sort();
    const start = from || days[0], end = to || days.at(-1);
    const monthly = start && end && (Date.parse(end) - Date.parse(start)) / 86400000 > 92;
    const timeline = [];
    if (start && end) {
        const cursor = new Date(monthly ? start.slice(0, 7) + '-01' : start);
        const last = monthly ? end.slice(0, 7) : end;
        while (cursor.toISOString().slice(0, monthly ? 7 : 10) <= last) {
            const label = cursor.toISOString().slice(0, monthly ? 7 : 10);
            timeline.push({ label, count: days.filter(day => day.startsWith(label)).length });
            if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
            else cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
    }
    return { total: rows.length, statuses: count(REPORT_STATUSES, 'reportStatus'), categories: count(REPORT_CATEGORIES, 'issueCategory'),
        barangays: count(REPORT_BARANGAYS, 'barangayArea'), timeline, monthly: Boolean(monthly), undated: rows.filter(r => !r.day).length };
}
