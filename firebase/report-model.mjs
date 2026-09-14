// Shared report values and validation; no network or browser dependencies.
export const REPORT_CATEGORIES = Object.freeze([
    'Road and public infrastructure damage',
    'Malfunctioning public streetlights',
    'Clogged or damaged drainage systems',
    'Improper waste disposal',
    'Minor flooding caused by blocked waterways',
    'Deterioration of municipal public facilities',
]);
export const REPORT_STATUSES = Object.freeze([
    'Received', 'For Verification', 'Referred', 'Ongoing', 'Resolved', 'Not Within LGU Jurisdiction',
]);
export const REPORT_BARANGAYS = Object.freeze([
    'Amatong', 'Anahao', 'Bangon', 'Batiano', 'Budiong', 'Canduyong', 'Dapawan',
    'Gabawan', 'Libertad', 'Ligaya', 'Liwanag', 'Liwayway', 'Malilico', 'Mayha',
    'Panique', 'Pato-o', 'Poctoy', 'Progreso Este', 'Progreso Weste', 'Rizal',
    'Tabing Dagat', 'Tabobo-an', 'Tuburan', 'Tumingad', 'Tulay',
]);
export function buildTextReport(input, uid, timestamp) {
    const fields = ['issueCategory', 'barangayArea', 'locationDescription', 'issueDescription'];
    if (!input || typeof input !== 'object' || Object.keys(input).some(key => !fields.includes(key))) {
        throw new Error('Only the text report fields are supported in this step.');
    }
    if (typeof uid !== 'string' || !uid) throw new Error('Please sign in before submitting a report.');
    const data = {};
    for (const field of fields) {
        if (typeof input[field] !== 'string' || !input[field].trim()) throw new Error('Complete the category, barangay, street/landmark, and description.');
        data[field] = input[field].trim();
    }
    if (!REPORT_CATEGORIES.includes(data.issueCategory)) throw new Error('Choose a category from the list.');
    if (!REPORT_BARANGAYS.includes(data.barangayArea)) throw new Error('Choose a barangay from the list.');
    if (data.locationDescription.length > 500) throw new Error('Keep the street/landmark description within 500 characters.');
    if (data.issueDescription.length > 5000) throw new Error('Keep the report description within 5,000 characters.');
    return { ...data, submitterID: uid, reportStatus: 'Received', timestamp, updatedAt: timestamp };
}
export function sortReports(items) {
    return [...items].sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0) || a.id.localeCompare(b.id));
}
export function reportDate(timestamp) {
    return timestamp?.toDate ? timestamp.toDate().toLocaleString() : 'Awaiting confirmation';
}
export function reportError(error) {
    if (error.code === 'permission-denied') return 'Report access was denied. Check your resident account and the published report rules.';
    if (error.code === 'unauthenticated') return 'Your sign-in could not be verified. Please sign in again.';
    if (error.code) return 'Unable to load or save reports. Check your connection and retry.';
    return error.message;
}

export const REPORT_PRIORITIES = Object.freeze(['High', 'Medium', 'Low']);
export const REPORT_ROUTING = Object.freeze(['Barangay', 'Municipal', 'External']);
export function validPin(pin) {
    return pin && Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude)
        && pin.latitude >= -90 && pin.latitude <= 90 && pin.longitude >= -180 && pin.longitude <= 180;
}
export function googleMapsLink(pin) {
    if (!validPin(pin)) return null;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(pin.latitude + ',' + pin.longitude);
}
export function buildProcessingUpdate(input) {
    const keys = ['reportStatus', 'priorityLevel', 'routingLevel', 'referredTo'];
    if (!input || Object.keys(input).some(key => !keys.includes(key))) throw new Error('Only report processing fields can be updated.');
    if (!REPORT_STATUSES.includes(input.reportStatus)) throw new Error('Choose a valid report status.');
    const result = { reportStatus: input.reportStatus };
    for (const [key, values] of [['priorityLevel', REPORT_PRIORITIES], ['routingLevel', REPORT_ROUTING]]) {
        const value = input[key] === '' || input[key] == null ? null : input[key];
        if (value !== null && !values.includes(value)) throw new Error('Choose a valid priority and routing level.');
        result[key] = value;
    }
    if (input.referredTo != null && typeof input.referredTo !== 'string') throw new Error('Enter a valid referral destination.');
    result.referredTo = input.referredTo?.trim() || null;
    if (result.referredTo?.length > 200) throw new Error('Keep the referral destination within 200 characters.');
    return result;
}
