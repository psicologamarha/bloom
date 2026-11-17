/**
 * BLOOM 2027 · Conexión con Google Calendar (fase 7)
 *
 * Todo ocurre en el navegador de cada usuaria, sin servidor y sin costo:
 *  - El permiso se pide con Google Identity Services (ventana de Google).
 *  - El permiso de acceso vive solo en la memoria de la pestaña (nunca se guarda
 *    en el dispositivo ni en la nube) y dura alrededor de una hora.
 *  - BLOOM crea su propio calendario «BLOOM 2027» y solo escribe ahí
 *    (permiso calendar.app.created). Nunca toca los demás calendarios.
 *  - Ver las citas de Google dentro de BLOOM es opcional y de solo lectura
 *    (permiso calendar.events.readonly, se pide únicamente si ella lo activa).
 */
/** Identificador del proyecto de Google de BLOOM. Se completa en la fase 8. */
export const CLIENT_ID = globalThis.BLOOM_GOOGLE_CLIENT_ID || '';
export const SCOPE_WRITE = 'https://www.googleapis.com/auth/calendar.app.created';
export const SCOPE_READ = 'https://www.googleapis.com/auth/calendar.events.readonly';
const API = 'https://www.googleapis.com/calendar/v3';
export const TZ = 'America/Bogota';
const gis = () => globalThis.google;
let token = '', tokenExp = 0, granted = '';
export const hasToken = () => !!token && Date.now() < tokenExp - 60000;
export const canRead = () => hasToken() && granted.includes(SCOPE_READ);
/** Google Calendar se enciende cuando Google apruebe sus permisos (BLOOM_CALENDAR_ON en config.js). */
export const available = () => !!CLIENT_ID && !!globalThis.BLOOM_CALENDAR_ON;
function loadGis() {
    if (gis()?.accounts?.oauth2)
        return Promise.resolve();
    return new Promise((ok, bad) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = () => ok();
        s.onerror = () => bad(new Error('sin-internet'));
        document.head.appendChild(s);
    });
}
/** Abre la ventana de Google para dar permiso. readToo pide además ver las citas. */
export async function connect(readToo, silent = false) {
    if (!CLIENT_ID)
        throw new Error('sin-proyecto');
    await loadGis();
    const scope = readToo ? `${SCOPE_WRITE} ${SCOPE_READ}` : SCOPE_WRITE;
    await new Promise((ok, bad) => {
        const c = gis().accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID, scope,
            callback: r => {
                if (r.error || !r.access_token)
                    return bad(new Error(r.error || 'cancelado'));
                token = r.access_token;
                tokenExp = Date.now() + (r.expires_in || 3600) * 1000;
                granted = r.scope || scope;
                if (!granted.includes(SCOPE_WRITE)) {
                    token = '';
                    return bad(new Error('sin-permiso'));
                }
                ok();
            },
            error_callback: e => bad(new Error(e.type === 'popup_closed' ? 'cancelado' : e.type)),
        });
        c.requestAccessToken({ prompt: silent ? '' : 'consent' });
    });
}
export function disconnect() {
    const g = gis();
    if (token && g?.accounts?.oauth2)
        g.accounts.oauth2.revoke(token);
    token = '';
    tokenExp = 0;
    granted = '';
}
async function call(method, path, body, retry = 0) {
    if (!hasToken())
        throw new Error('sin-sesion');
    const r = await fetch(API + path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if ((r.status === 429 || r.status >= 500 || r.status === 403 && retry < 1) && retry < 4) {
        await new Promise(s => setTimeout(s, 400 * 2 ** retry));
        return call(method, path, body, retry + 1);
    }
    if (r.status === 401) {
        token = '';
        throw new Error('sin-sesion');
    }
    if (r.status === 404 || r.status === 410)
        throw Object.assign(new Error('no-existe'), { status: r.status });
    if (!r.ok)
        throw new Error('google-' + r.status);
    return (r.status === 204 ? undefined : await r.json());
}
const addDays = (k, n) => { const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8) + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const hh = (n) => String(n).padStart(2, '0');
function body(w) {
    const when = w.hour === undefined
        ? { start: { date: w.date }, end: { date: addDays(w.date, 1) } }
        : { start: { dateTime: `${w.date}T${hh(w.hour)}:00:00-05:00`, timeZone: TZ }, end: { dateTime: `${w.date}T${hh(w.hour + 1)}:00:00-05:00`, timeZone: TZ } };
    return { summary: w.summary, description: 'Desde BLOOM 2027 · bloom.psicologamarha.com\nPara cambiarlo, edítalo en tu agenda BLOOM.', ...when, ...(w.colorId ? { colorId: w.colorId } : {}), reminders: { useDefault: false, overrides: w.hour === undefined ? [] : [{ method: 'popup', minutes: 30 }] }, transparency: w.hour === undefined ? 'transparent' : 'opaque', extendedProperties: { private: { bloomKey: w.key } } };
}
const same = (g, w) => {
    const b = body(w);
    return g.summary === b.summary && (g.colorId || '') === (w.colorId || '') &&
        (w.hour === undefined ? g.start?.date === w.date : (g.start?.dateTime || '').slice(0, 13) === `${w.date}T${hh(w.hour)}`);
};
export async function ensureCalendar(id) {
    if (id) {
        try {
            await call('GET', `/calendars/${encodeURIComponent(id)}`);
            return id;
        }
        catch (e) {
            if (e.message !== 'no-existe')
                throw e;
        }
    }
    const c = await call('POST', '/calendars', { summary: 'BLOOM 2027', description: 'Lo que anotas en tu agenda BLOOM by Psicóloga Marha', timeZone: TZ });
    return c.id;
}
async function listAll(calId) {
    const out = [];
    let page = '';
    do {
        const r = await call('GET', `/calendars/${encodeURIComponent(calId)}/events?maxResults=2500&showDeleted=false${page ? '&pageToken=' + encodeURIComponent(page) : ''}`);
        out.push(...(r.items || []));
        page = r.nextPageToken || '';
    } while (page);
    return out;
}
/** Deja el calendario BLOOM igual a lo que hay en la agenda: crea, corrige y quita. */
export async function syncAll(calId, wanted, progress) {
    const have = await listAll(calId);
    const byKey = new Map(), dupes = [];
    have.forEach(g => { const k = g.extendedProperties?.private?.bloomKey; if (!k || byKey.has(k))
        dupes.push(g);
    else
        byKey.set(k, g); });
    const jobs = [];
    let created = 0, updated = 0, removed = 0;
    const cal = `/calendars/${encodeURIComponent(calId)}/events`;
    const want = new Map(wanted.map(w => [w.key, w]));
    want.forEach((w, k) => {
        const g = byKey.get(k);
        if (!g)
            jobs.push(() => call('POST', cal, body(w)).then(() => created++));
        else if (!same(g, w))
            jobs.push(() => call('PUT', `${cal}/${encodeURIComponent(g.id)}`, body(w)).then(() => updated++));
    });
    [...byKey.entries()].filter(([k]) => !want.has(k)).map(([, g]) => g).concat(dupes)
        .forEach(g => jobs.push(() => call('DELETE', `${cal}/${encodeURIComponent(g.id)}`).catch(e => { if (e.message !== 'no-existe')
        throw e; }).then(() => removed++)));
    let done = 0;
    progress?.(0, jobs.length);
    const run = async () => { while (jobs.length) {
        const j = jobs.shift();
        await j();
        progress?.(++done, done + jobs.length);
    } };
    await Promise.all([run(), run(), run()]);
    return { created, updated, removed, total: wanted.length };
}
export async function deleteCalendar(calId) {
    try {
        await call('DELETE', `/calendars/${encodeURIComponent(calId)}`);
    }
    catch (e) {
        if (e.message !== 'no-existe')
            throw e;
    }
}
/** Citas del calendario principal entre dos fechas (YYYY-MM-DD, la segunda sin incluir). */
export async function readRange(from, to) {
    if (!canRead())
        return [];
    const q = `timeMin=${encodeURIComponent(from + 'T00:00:00-05:00')}&timeMax=${encodeURIComponent(to + 'T00:00:00-05:00')}&singleEvents=true&orderBy=startTime&maxResults=2500&timeZone=${TZ}`;
    const r = await call('GET', `/calendars/primary/events?${q}`);
    return (r.items || []).filter(g => g.status !== 'cancelled').flatMap(g => {
        const title = g.summary || '(Ocupada)';
        if (g.start?.date) { // todo el día, puede durar varios días
            const out = [];
            let k = g.start.date;
            const end = g.end?.date || addDays(k, 1);
            for (let i = 0; k < end && i < 60; i++, k = addDays(k, 1))
                out.push({ title, date: k, allDay: true });
            return out;
        }
        const s = toLocal(g.start?.dateTime || ''), e = toLocal(g.end?.dateTime || '');
        return [{ title, date: s.slice(0, 10), start: s.slice(11, 16), end: e.slice(11, 16), allDay: false }];
    });
}
/** Convierte una hora de Google a la hora de Colombia (UTC-5, sin horario de verano). */
function toLocal(iso) {
    const d = new Date(new Date(iso).getTime() - 5 * 3600000);
    return d.toISOString().slice(0, 16).replace('Z', '');
}
