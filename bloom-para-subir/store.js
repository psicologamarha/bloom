/**
 * BLOOM 2027 · Guardado en el dispositivo
 *
 * Todo se guarda al instante en IndexedDB (la memoria del navegador del
 * celular o computador). Cada documento lleva `pending: true` mientras no se
 * haya enviado a la nube; la sincronización de la fase 8 enviará esos y
 * descargará los cambios hechos en otros dispositivos.
 *
 * Si el navegador no permite IndexedDB (modo privado en algunos navegadores),
 * la app sigue funcionando en memoria y avisa que debe descargarse una copia.
 */
import { SCHEMA_VERSION, isValidDocId } from './model.js';
const DB_NAME = 'bloom-2027';
const STORE = 'docs';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isObj = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Mezcla de tres versiones: base (lo último que ambas tenían), lo de aquí y lo de la nube. */
export function merge3(base, mine, theirs) {
    if (same(mine, base))
        return theirs;
    if (same(theirs, base) || same(mine, theirs))
        return mine;
    if (isObj(mine) && isObj(theirs)) {
        const b = isObj(base) ? base : {}, out = {};
        new Set([...Object.keys(mine), ...Object.keys(theirs)]).forEach(k => {
            const v = merge3(b[k], mine[k], theirs[k]);
            if (v !== undefined)
                out[k] = v;
        });
        return out;
    }
    return mine;
}
function req(r) {
    return new Promise((ok, fail) => { r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error); });
}
export class Store {
    constructor() {
        this.db = null;
        this.cache = new Map();
        this.timers = new Map();
        this.listeners = [];
        this.state = 'saved';
        /* ---------- Sincronización con la nube (fase 8) ---------- */
        this.remoteListeners = [];
    }
    /** Abre la base del dispositivo y carga todos los documentos en memoria. */
    async open() {
        try {
            this.db = await new Promise((ok, fail) => {
                const r = indexedDB.open(DB_NAME, 1);
                r.onupgradeneeded = () => { r.result.createObjectStore(STORE, { keyPath: 'id' }); };
                r.onsuccess = () => ok(r.result);
                r.onerror = () => fail(r.error);
            });
            const all = await req(this.db.transaction(STORE).objectStore(STORE).getAll());
            all.forEach(d => this.cache.set(d.id, d));
            // Pide al navegador que no borre estos datos si necesita espacio.
            try {
                await navigator.storage?.persist?.();
            }
            catch { /* opcional */ }
        }
        catch {
            this.db = null;
            this.setState('memory-only');
        }
    }
    onState(fn) { this.listeners.push(fn); }
    setState(s) { this.state = s; this.listeners.forEach(l => l(s)); }
    get(id) { return this.cache.get(id)?.data; }
    /** Devuelve el documento o lo crea con su valor inicial (sin guardarlo hasta que cambie). */
    getOr(id, make) {
        const d = this.cache.get(id);
        if (d)
            return d.data;
        const data = make();
        this.cache.set(id, { id, data, schema: SCHEMA_VERSION, updatedAt: 0, pending: false });
        return data;
    }
    /** Marca un documento como cambiado y lo guarda en el dispositivo (agrupando cambios seguidos). */
    touch(id) {
        const d = this.cache.get(id);
        if (!d)
            return;
        d.updatedAt = Date.now();
        d.pending = true;
        this.setState(this.db ? 'saving' : 'memory-only');
        clearTimeout(this.timers.get(id));
        this.timers.set(id, window.setTimeout(() => this.flush(id), 250));
    }
    async flush(id) {
        this.timers.delete(id);
        if (!this.db)
            return;
        const d = this.cache.get(id);
        if (!d)
            return;
        try {
            await req(this.db.transaction(STORE, 'readwrite').objectStore(STORE).put(structuredClone(d)));
            if (this.timers.size === 0)
                this.setState('saved');
        }
        catch {
            this.setState('error');
        }
    }
    /** Guarda de inmediato lo que esté esperando (por ejemplo, al cerrar la app). */
    async flushAll() { await Promise.all([...this.timers.keys()].map(id => { clearTimeout(this.timers.get(id)); return this.flush(id); })); }
    /** Todos los documentos con contenido (para el buscador). */
    all() { return [...this.cache.values()].filter(d => d.updatedAt > 0); }
    /** Documentos con cambios aún no enviados a la nube (para la fase 8). */
    pending() { return [...this.cache.values()].filter(d => d.pending); }
    onRemote(fn) { this.remoteListeners.push(fn); }
    async persist(d) {
        if (this.db) {
            try {
                await req(this.db.transaction(STORE, 'readwrite').objectStore(STORE).put(structuredClone(d)));
            }
            catch {
                this.setState('error');
            }
        }
    }
    /** Copia exacta de lo pendiente para enviarla (sin que cambios posteriores se mezclen). */
    snapshotPending() {
        return this.pending().map(d => ({ id: d.id, data: structuredClone(d.data), schema: d.schema, updatedAt: d.updatedAt }));
    }
    /** Copia de todo lo escrito (para guardar el archivo completo en Drive). */
    snapshotAll() {
        return [...this.cache.values()].filter(d => d.updatedAt > 0).map(d => ({ id: d.id, data: structuredClone(d.data), schema: d.schema, updatedAt: d.updatedAt, pending: d.pending }));
    }
    /** La nube recibió el documento tal como estaba en `sentAt`. Si cambió después, sigue pendiente. */
    async markSynced(id, sentAt, sent) {
        const d = this.cache.get(id);
        if (!d)
            return;
        d.base = sent;
        if (d.updatedAt <= sentAt)
            d.pending = false;
        await this.persist(d);
    }
    /**
     * Llega un cambio hecho en otro dispositivo.
     * - Si aquí no hay nada sin enviar, se toma el de la nube.
     * - Si aquí también hubo cambios, se mezclan campo por campo: se conserva lo
     *   que cambió en cada lado, y si los dos cambiaron lo mismo, gana lo de aquí.
     */
    async applyRemote(list) {
        const changed = [];
        for (const r of list) {
            if (!isValidDocId(r.id) || typeof r.data !== 'object' || r.data === null)
                continue;
            const id = r.id, d = this.cache.get(id);
            if (d && same(d.data, r.data)) {
                d.base = structuredClone(r.data);
                if (!d.pending)
                    d.updatedAt = Math.max(d.updatedAt, r.updatedAt);
                else
                    d.pending = false;
                await this.persist(d);
                continue;
            }
            let nd;
            if (d?.pending) {
                if (d.base === undefined && d.updatedAt > r.updatedAt) {
                    d.base = structuredClone(r.data);
                    await this.persist(d);
                    continue;
                } // primera vez: gana lo más reciente
                const merged = d.base === undefined ? r.data : merge3(d.base, d.data, r.data);
                nd = { id, data: merged, schema: d.schema, updatedAt: d.updatedAt, pending: !same(merged, r.data), base: structuredClone(r.data) };
            }
            else
                nd = { id, data: r.data, schema: r.schema || SCHEMA_VERSION, updatedAt: r.updatedAt, pending: false, base: structuredClone(r.data) };
            if (this.timers.has(id)) {
                clearTimeout(this.timers.get(id));
                this.timers.delete(id);
            }
            this.cache.set(id, nd);
            await this.persist(nd);
            changed.push(id);
        }
        if (changed.length)
            this.remoteListeners.forEach(l => l(changed));
        return changed;
    }
    /** Borra la agenda de este dispositivo (al cerrar sesión en un equipo compartido o al cambiar de cuenta). */
    async clearLocal() {
        this.timers.forEach(t => clearTimeout(t));
        this.timers.clear();
        this.cache.clear();
        if (this.db)
            await req(this.db.transaction(STORE, 'readwrite').objectStore(STORE).clear());
        this.setState('saved');
    }
    /** ¿Hay algo escrito en este dispositivo? */
    hasContent() { return [...this.cache.values()].some(d => d.updatedAt > 0); }
    /* ---------- Copia de seguridad ---------- */
    /** Archivo con toda la información de la usuaria. */
    exportBackup() {
        const docs = [...this.cache.values()].filter(d => d.updatedAt > 0).map(({ id, data, schema, updatedAt }) => ({ id, data, schema, updatedAt }));
        return JSON.stringify({ app: 'BLOOM', year: 2027, schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(), docs }, null, 1);
    }
    /** Restaura una copia. Solo acepta archivos de BLOOM y documentos con ids válidos. */
    async importBackup(text) {
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch {
            throw new Error('El archivo no es una copia de BLOOM.');
        }
        const p = parsed;
        if (p?.app !== 'BLOOM' || !Array.isArray(p.docs))
            throw new Error('El archivo no es una copia de BLOOM.');
        const valid = p.docs.filter(d => d && typeof d.id === 'string' && isValidDocId(d.id) && typeof d.data === 'object' && d.data !== null);
        for (const d of valid) {
            this.cache.set(d.id, { id: d.id, data: d.data, schema: Number(d.schema) || SCHEMA_VERSION, updatedAt: Date.now(), pending: true });
            if (this.db)
                await req(this.db.transaction(STORE, 'readwrite').objectStore(STORE).put(structuredClone(this.cache.get(d.id))));
        }
        this.setState(this.db ? 'saved' : 'memory-only');
        return valid.length;
    }
}
