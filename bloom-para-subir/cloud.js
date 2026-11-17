const CLIENT_ID = globalThis.BLOOM_GOOGLE_CLIENT_ID || '';
export const available = () => !!CLIENT_ID;
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata openid email profile';
const FILE = 'bloom-2027.json';
const DRIVE = 'https://www.googleapis.com/drive/v3', UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const ls = { get: (k) => { try {
        return localStorage.getItem(k);
    }
    catch {
        return null;
    } }, set: (k, v) => { try {
        localStorage.setItem(k, v);
    }
    catch { /* */ } }, del: (k) => { try {
        localStorage.removeItem(k);
    }
    catch { /* */ } } };
const ss = { get: (k) => { try {
        return sessionStorage.getItem(k);
    }
    catch {
        return null;
    } }, set: (k, v) => { try {
        sessionStorage.setItem(k, v);
    }
    catch { /* */ } }, del: (k) => { try {
        sessionStorage.removeItem(k);
    }
    catch { /* */ } } };
const UKEY = 'bloom-user', OWNER = 'bloom-owner', FKEY = 'bloom-drive-file', VKEY = 'bloom-drive-version', TKEY = 'bloom-drive-token';
let me = null;
try {
    me = JSON.parse(ls.get(UKEY) || 'null');
}
catch {
    me = null;
}
let token = '', tokenExp = 0;
try {
    const t = JSON.parse(ss.get(TKEY) || 'null');
    if (t && t.u === me?.id) {
        token = t.a;
        tokenExp = t.e;
    }
}
catch { /* */ }
const hasToken = () => !!token && Date.now() < tokenExp - 60000;
let state = !available() ? 'off' : !me ? 'signed-out' : hasToken() ? 'synced' : 'needs-tap';
let lastSync = 0, lastError = '';
const listeners = [];
export const onState = (fn) => { listeners.push(fn); };
const setState = (s) => { state = s; listeners.forEach(l => l(s)); };
export const getState = () => state;
export const user = () => me;
export const lastSyncAt = () => lastSync;
export const debug = () => ({ state, lastError, token: hasToken() });
const gis = () => globalThis.google;
function loadGis() {
    if (gis()?.accounts?.oauth2)
        return Promise.resolve();
    return new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => ok(); s.onerror = () => bad(new Error('sin-internet')); document.head.appendChild(s); });
}
async function askToken(silent) {
    if (!CLIENT_ID)
        throw new Error('sin-proyecto');
    await loadGis();
    await new Promise((ok, bad) => {
        const c = gis().accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID, scope: SCOPE,
            callback: r => {
                if (r.error || !r.access_token)
                    return bad(new Error(r.error || 'cancelado'));
                if (r.scope && !r.scope.includes('drive.appdata'))
                    return bad(new Error('sin-permiso'));
                token = r.access_token;
                tokenExp = Date.now() + (r.expires_in || 3600) * 1000;
                ok();
            },
            error_callback: e => bad(new Error(e.type === 'popup_closed' ? 'cancelado' : e.type)),
        });
        c.requestAccessToken(silent ? { prompt: '', login_hint: me?.email } : { prompt: 'select_account' });
    });
}
/** Abre la ventana de Google. La primera vez pide elegir la cuenta y dar permiso. */
export async function signIn() {
    await askToken(false);
    const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok)
        throw new Error('google-' + r.status);
    const j = await r.json();
    if (me && me.id !== j.sub) {
        ls.del(FKEY);
        ls.del(VKEY);
    }
    me = { id: j.sub, email: j.email || '', name: j.name || '' };
    ls.set(UKEY, JSON.stringify(me));
    keepToken();
    setState('synced');
}
/** Al volver a abrir BLOOM el permiso ya venció: se renueva con un toque (sin volver a elegir cuenta). */
export async function resume() { await askToken(true); keepToken(); setState('synced'); }
function keepToken() { if (me)
    ss.set(TKEY, JSON.stringify({ u: me.id, a: token, e: tokenExp })); }
export function ownerMismatch() { const o = ls.get(OWNER); return !!me && !!o && o !== me.id; }
export function claimDevice() { if (me)
    ls.set(OWNER, me.id); }
export async function signOut(store, wipe) {
    const g = gis();
    if (token && g?.accounts?.oauth2)
        g.accounts.oauth2.revoke(token);
    token = '';
    tokenExp = 0;
    me = null;
    ls.del(UKEY);
    ss.del(TKEY);
    ls.del(FKEY);
    ls.del(VKEY);
    if (wipe) {
        await store.clearLocal();
        ls.del(OWNER);
    }
    setState(available() ? 'signed-out' : 'off');
}
/* ---------- Drive ---------- */
async function call(method, url, body, type, retry = 0) {
    if (!hasToken())
        throw new Error('sin-sesion');
    const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, ...(type ? { 'Content-Type': type } : {}) }, body });
    if ((r.status === 429 || r.status >= 500) && retry < 3) {
        await new Promise(s => setTimeout(s, 500 * 2 ** retry));
        return call(method, url, body, type, retry + 1);
    }
    if (r.status === 401) {
        token = '';
        ss.del(TKEY);
        throw new Error('sin-sesion');
    }
    return r;
}
async function findFile() {
    const known = ls.get(FKEY);
    if (known)
        return known;
    const r = await call('GET', `${DRIVE}/files?spaces=appDataFolder&q=${encodeURIComponent(`name='${FILE}' and trashed=false`)}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc`);
    if (!r.ok)
        throw new Error('drive-' + r.status);
    const id = (await r.json()).files[0]?.id || '';
    if (id)
        ls.set(FKEY, id);
    return id;
}
async function meta(id) {
    const r = await call('GET', `${DRIVE}/files/${id}?fields=version`);
    if (r.status === 404) {
        ls.del(FKEY);
        ls.del(VKEY);
        return null;
    }
    if (!r.ok)
        throw new Error('drive-' + r.status);
    return (await r.json()).version;
}
/* ---------- Sincronizar ---------- */
let running = null, again = false;
export function sync(store) {
    if (!me || !available())
        return Promise.resolve();
    if (!hasToken()) {
        setState('needs-tap');
        return Promise.resolve();
    }
    if (running) {
        again = true;
        return running;
    }
    running = (async () => {
        do {
            again = false;
            if (!navigator.onLine) {
                setState('offline');
                break;
            }
            setState('syncing');
            try {
                await once(store);
                lastSync = Date.now();
                lastError = '';
                setState('synced');
            }
            catch (e) {
                const m = e.message;
                lastError = m;
                setState(m === 'sin-sesion' ? 'needs-tap' : navigator.onLine ? 'error' : 'offline');
                break;
            }
        } while (again);
    })().finally(() => { running = null; });
    return running;
}
async function once(store) {
    let id = await findFile();
    let version = id ? await meta(id) : null;
    if (id && version === null)
        id = '';
    // 1. Traer lo que cambió en otros dispositivos
    if (id && version !== ls.get(VKEY)) {
        const r = await call('GET', `${DRIVE}/files/${id}?alt=media`);
        if (!r.ok)
            throw new Error('drive-' + r.status);
        const b = await r.json();
        if (b?.app === 'BLOOM' && b.docs)
            await store.applyRemote(Object.entries(b.docs).map(([k, v]) => ({ id: k, data: v.data, schema: v.schema, updatedAt: v.updatedAt })));
        ls.set(VKEY, version);
    }
    // 2. Enviar si hay algo nuevo aquí
    const pend = store.snapshotPending();
    if (!pend.length && id)
        return;
    if (id) {
        const now = await meta(id);
        if (now !== null && now !== version) {
            again = true;
            return;
        }
    } // otro dispositivo escribió justo ahora: repetir
    const all = store.snapshotAll();
    const bundle = { app: 'BLOOM', year: 2027, savedAt: new Date().toISOString(), docs: Object.fromEntries(all.map(d => [d.id, { data: d.data, schema: d.schema, updatedAt: d.updatedAt }])) };
    const json = JSON.stringify(bundle);
    let r;
    if (id)
        r = await call('PATCH', `${UPLOAD}/files/${id}?uploadType=media&fields=id,version`, json, 'application/json');
    else {
        const bd = 'bloom' + Math.random().toString(36).slice(2);
        const body = `--${bd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE, parents: ['appDataFolder'], mimeType: 'application/json' })}\r\n--${bd}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${bd}--`;
        r = await call('POST', `${UPLOAD}/files?uploadType=multipart&fields=id,version`, body, `multipart/related; boundary=${bd}`);
    }
    if (!r.ok)
        throw new Error('drive-' + r.status);
    const out = await r.json();
    ls.set(FKEY, out.id);
    ls.set(VKEY, out.version);
    for (const d of all)
        if (d.pending)
            await store.markSynced(d.id, d.updatedAt, d.data);
}
/** Borra la agenda guardada en su Drive y la de este dispositivo. */
export async function deleteAccount(store) {
    if (!hasToken())
        await askToken(true);
    const id = await findFile();
    if (id) {
        const r = await call('DELETE', `${DRIVE}/files/${id}`);
        if (!r.ok && r.status !== 404)
            throw new Error('drive-' + r.status);
    }
    await signOut(store, true);
}
