/**
 * BLOOM 2027 · Aplicación (fase 2: portada, navegación y Mi año)
 */
import { Store } from './store.js';
import { YEAR, newSettings, daysInMonth, newMonth, newDay, normalizeMonth, normalizeDay, monthId, dayId, financeTotals, habitProgress, growthProgress, dailySpend, dailyIncome } from './model.js';
import { STICKER_CATS, stickerById } from './stickers.js';
import * as G from './google.js';
import * as C from './cloud.js';
import { PREP_WEEKS, PREP_DAYS } from './prepare.js';
import { MONTHS, DIMENSIONS, VISION_VERSE, PHRASE, WELCOME, ART, CENTRAL, NVI_NOTICE, wreath, bouquet, garland, rose, daisy, AREAS, GROWTH, growthRef, STEWARD, CLOSING_VERSE, PREP, CLOSING, FAMILY_KINDS, WORK_KINDS, DAILY } from './content.js';
const store = new Store();
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const LOGO = 'logo.png';
const STATUSES = ['Por iniciar', 'En proceso', 'En pausa', 'Lograda'];
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WD = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const TAB_COLORS = ['t-navy', 't-rose', 't-blue', 't-sand', 't-mist', 't-blush'];
const BLOOM_LINES = ['Florecer también es avanzar despacio.', 'Hoy riego lo que quiero ver crecer.', 'Las raíces trabajan aunque no se vean.', 'Un paso pequeño también es crecimiento.', 'Hay belleza en los procesos.', 'Hoy cultivo paz, no prisa.', 'Florezco donde Dios me plantó.', 'Lo que cuido, crece.', 'Mi valor no depende de mi lista de pendientes.', 'Cada día es tierra nueva.', 'Puedo empezar de nuevo a mitad del día.', 'Soy jardín, no máquina.', 'La calma también es fruto.', 'Siembro hoy con esperanza.'];
/* ---------- Documentos ---------- */
const newYear = () => ({ vision: { feel: '', build: '', leave: '', cultivate: '', word: '', verse: '', declaration: '' }, goals: [] });
const MAKERS = { year: newYear, settings: newSettings, prep: () => ({ done: Array(31).fill(false), notes: Array(31).fill('') }) };
const docOf = (id) => {
    if (id.startsWith('month:'))
        return normalizeMonth(store.getOr(id, newMonth));
    if (id.startsWith('day:'))
        return normalizeDay(store.getOr(id, newDay));
    return store.getOr(id, (MAKERS[id] ?? (() => ({}))));
};
const TPL = {
    income: () => ({ src: '', exp: '', date: '', rec: '', status: 'Pendiente' }), fixed: () => ({ cat: '', budget: '', real: '' }),
    variable: () => ({ cat: '', desc: '', budget: '', real: '', date: '' }), debts: () => ({ name: '', balance: '', fee: '', day: '', rate: '', paid: false }),
    savings: () => ({ name: '', goal: '', saved: '' }), bills: () => ({ what: '', amount: '', due: '', remind: '', paid: false }),
    todos: () => ({ t: '', done: false }), purchases: () => ({ what: '', amount: '', cat: 'Mercado' }), incomes: () => ({ what: '', amount: '', src: 'Consulta' }), ptask: () => ({ t: '', done: false, date: '' }), family: () => ({ date: '', what: '', kind: 'Actividad de los hijos' }), work: () => ({ date: '', what: '', kind: 'Proyecto', done: false })
};
const year = () => docOf('year');
const settings = () => docOf('settings');
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
/** Un segmento "#id" busca en una lista el elemento con ese id (así borrar uno no mueve los demás). */
const step = (a, k) => a == null ? a : k.startsWith('#') ? a.find?.(x => x.id === k.slice(1)) : a[k];
function setPath(o, path, v) {
    const ks = path.split('.');
    let a = o;
    ks.slice(0, -1).forEach(k => { a = step(a, k); });
    if (a != null)
        a[ks[ks.length - 1]] = v;
}
const goalById = (id) => year().goals.find(g => g.id === id);
/* ---------- Campos ---------- */
const fld = (doc, p, val, ph = '', type = 'text', extra = '') => `<input class="inp" type="${type}" data-doc="${doc}" data-p="${p}" value="${esc(val)}" placeholder="${esc(ph)}" ${extra}>`;
const ta = (doc, p, val, ph = '', rows = 2) => `<textarea class="inp" rows="${rows}" data-doc="${doc}" data-p="${p}" placeholder="${esc(ph)}">${esc(val)}</textarea>`;
const lab = (t, inner) => `<label class="f"><span>${t}</span>${inner}</label>`;
const para = '<div class="para">Paráfrasis Bloom · lee el texto completo en tu Biblia</div>';
/* ---------- Cálculos del año ---------- */
function yearStats() {
    const goals = year().goals.filter(g => g.name.trim());
    const avg = (a) => a.length ? a.reduce((t, g) => t + (+g.progress || 0), 0) / a.length : 0;
    const byDim = DIMENSIONS.map(d => { const gs = goals.filter(g => g.dimension === d.id); return { d, count: gs.length, avg: avg(gs) }; });
    const byStatus = STATUSES.map(s => ({ s, count: goals.filter(g => g.status === s).length }));
    const byMonth = MONTHS.map((_, i) => goals.filter(g => g.month === i).length);
    return { goals, total: avg(goals), byDim, byStatus, byMonth };
}
const ring = (pct, size = 64) => {
    const R = size * .4, C = 2 * Math.PI * R, c = size / 2;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${Math.round(pct)}%"><circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#E4EAF3" stroke-width="${size * .11}"/><circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#C48F9B" stroke-width="${size * .11}" stroke-linecap="round" stroke-dasharray="${C * pct / 100} ${C}" transform="rotate(-90 ${c} ${c})"/><text x="${c}" y="${c + size * .09}" text-anchor="middle" font-family="Cormorant Garamond" font-size="${size * .27}" font-weight="600" fill="#23395B">${Math.round(pct)}%</text></svg>`;
};
const SOON = {};
function route() {
    const h = (location.hash || '#tapa').slice(1);
    if (h === 'tapa' || h === '')
        return { v: 'tapa' };
    let r;
    if (h === 'mi-anio')
        return { v: 'anio' };
    if (h === 'metas')
        return { v: 'metas' };
    if (h === 'finanzas')
        return { v: 'finanzas' };
    if (h === 'stickers')
        return { v: 'stickers' };
    if (h === 'estudio')
        return { v: 'estudio' };
    if (h === 'ciclo' || h === 'compras' || h === 'hojitas' || h === 'oracion' || h === 'proyectos' || h === 'lectura')
        return { v: h };
    if (h === 'buscar')
        return { v: 'buscar' };
    if (h === 'recordatorios')
        return { v: 'recordatorios' };
    if (h === 'ajustes')
        return { v: 'ajustes' };
    if ((r = h.match(/^portada-(\d{1,2})$/)) && +r[1] >= 1 && +r[1] <= 12)
        return { v: 'portada', m: +r[1] - 1 };
    if ((r = h.match(/^mes-(\d{1,2})$/)) && +r[1] >= 1 && +r[1] <= 12)
        return { v: 'mes', m: +r[1] - 1 };
    if ((r = h.match(/^dia-2027-(\d{2})-(\d{2})$/))) {
        const m = +r[1] - 1, d = +r[2];
        if (m >= 0 && m < 12 && d >= 1 && d <= daysInMonth(m))
            return { v: 'dia', m, d };
    }
    if ((r = h.match(/^semana-(\d{1,2})$/)) && +r[1] >= 1 && +r[1] <= 53)
        return { v: 'semana', w: +r[1] };
    if (h === 'hoy') {
        const n = new Date();
        if (n.getFullYear() === YEAR - 1 && n.getMonth() === 11)
            return { v: 'preparar', d: n.getDate() };
        const t = todayInYear();
        return { v: 'dia', m: t.getMonth(), d: t.getDate() };
    }
    const pm = h.match(/^preparar(?:-(\d{1,2}))?$/);
    if (pm)
        return { v: 'preparar', d: pm[1] ? Math.min(31, Math.max(1, +pm[1])) : 0 };
    if (SOON[h])
        return { v: 'pronto', s: h };
    return { v: 'inicio' };
}
const routeKey = (r) => r.v === 'mes' || r.v === 'portada' ? 'm' + r.m : r.v === 'dia' ? 'm' + r.m : r.v === 'pronto' ? r.s : r.v;
/** Mes que se resalta como "actual": el real durante 2027; antes de 2027, enero. */
const currentMonth = () => { const t = new Date(); return t.getFullYear() === YEAR ? t.getMonth() : t.getFullYear() > YEAR ? 11 : 0; };
/* ---------- Marco: separadores, ubicación, menú móvil ---------- */
function renderFrame(r) {
    const act = routeKey(r);
    const tab = (href, key, t, c, extra = '') => `<a class="tab ${c} ${extra} ${act === key ? 'active' : ''}" href="#${href}" ${act === key ? 'aria-current="page"' : ''}>${t}</a>`;
    $('#tabs').innerHTML =
        tab('inicio', 'inicio', 'Inicio', 't-navy') + tab('mi-anio', 'anio', 'Mi año', 't-rose') +
            MONTHS.map((mo, i) => `<a class="tab m ${TAB_COLORS[i % 6]} ${i === 0 ? 'gap' : ''} ${act === 'm' + i ? 'active' : ''}" href="#portada-${i + 1}" title="${mo.n}" ${act === 'm' + i ? 'aria-current="page"' : ''}>${mo.n.slice(0, 3).toUpperCase()}</a>`).join('') +
            tab('finanzas', 'finanzas', 'Finanzas', 't-navy', 'gap') + tab('metas', 'metas', 'Metas', 't-rose') + tab('proyectos', 'proyectos', 'Proyectos', 't-blue') +
            tab('lectura', 'lectura', 'Mi lectura', 't-sand') + (settings().studioEnabled ? tab('estudio', 'estudio', 'Estudio', 't-mist') : '') +
            tab('oracion', 'oracion', 'Oración', 't-navy', 'gap') + tab('hojitas', 'hojitas', 'Hojitas', 't-rose') + tab('compras', 'compras', 'Compras', 't-blue') + (cycleOn() ? tab('ciclo', 'ciclo', 'Mi ciclo', 't-blush') : '') + tab('stickers', 'stickers', 'Stickers', 't-sand');
    const c = ['<a href="#inicio">Inicio</a>'];
    if (r.v === 'anio')
        c.push('<b>Mi año 2027</b>');
    if (r.v === 'metas')
        c.push('<b>Panel de metas</b>');
    if (r.v === 'finanzas')
        c.push('<b>Mis finanzas del año</b>');
    if (r.v === 'stickers')
        c.push('<b>Biblioteca de stickers</b>');
    if (r.v === 'estudio')
        c.push('<b>Mi Estudio Creativo</b>');
    if (r.v === 'preparar')
        c.push(r.d ? `<a href="#preparar">31 días para florecer</a> › <b>Día ${r.d}</b>` : '<b>31 días para florecer</b>');
    const LIFE = { ciclo: 'Mi ciclo', compras: 'Lista de compras', hojitas: 'Mis hojitas', oracion: 'Peticiones de oración', proyectos: 'Mis proyectos', lectura: 'Mi lectura' };
    if (LIFE[r.v])
        c.push(`<b>${LIFE[r.v]}</b>`);
    if (r.v === 'buscar')
        c.push('<b>Buscar</b>');
    if (r.v === 'recordatorios')
        c.push('<b>Recordatorios</b>');
    if (r.v === 'ajustes')
        c.push('<b>Ajustes y copias</b>');
    if (r.v === 'mes')
        c.push(`<a href="#portada-${r.m + 1}">${MONTHS[r.m].n}</a>`, '<b>Planear</b>');
    if (r.v === 'portada')
        c.push(`<b>${MONTHS[r.m].n}</b>`, '<span class="muted">Portada</span>');
    if (r.v === 'dia') {
        const dt = new Date(YEAR, r.m, r.d);
        c.push(`<a href="#mes-${r.m + 1}">${MONTHS[r.m].n}</a>`, `<b>${WEEKDAYS[dt.getDay()]} ${r.d}</b>`);
    }
    if (r.v === 'pronto')
        c.push(`<b>${SOON[r.s][0]}</b>`);
    if (r.v === 'semana')
        c.push(`<b>Semana ${r.w}</b>`);
    $('#crumbs').innerHTML = c.join('<span class="sep">›</span>');
    const mk = r.v === 'dia' || r.v === 'semana' ? 'hoy' : r.v === 'mes' || r.v === 'portada' ? 'meses' : r.v === 'anio' || r.v === 'metas' ? 'anio' : r.v === 'inicio' ? 'inicio' : 'mas';
    document.querySelectorAll('#mnav [data-m]').forEach(el => el.classList.toggle('on', el.dataset.m === mk));
}
const pager = (prev, next) => `<nav class="pager" aria-label="Volver y continuar">${prev ? `<a href="${prev[0]}">← ${prev[1]}</a>` : '<span></span>'}${next ? `<a href="${next[0]}">${next[1]} →</a>` : '<span></span>'}</nav>`;
/* ---------- Portada ---------- */
function viewCover() {
    const now = currentMonth(), st = yearStats(), name = settings().name.trim();
    const icons = [rose(), daisy('#F5E6E9', '#D8A7B1'), ART.flower(), rose('#A9BCD6', '#8FA6C6'), ART.butterfly('#D8A7B1', '#A9BCD6'), daisy()];
    return `${cloudBanner()}${prepBanner()}<div class="cover">
  <section class="cover-hero">
    <div class="deco" style="right:-26px;top:-40px;width:230px;opacity:.95">${bouquet(0)}</div>
    <div style="display:flex;gap:16px;align-items:center">
      <img class="logo-main" src="${LOGO}" alt="Logo de Psicóloga Marha">
      <div><div class="eyebrow">Florecer en Dios</div><div class="small muted">Agenda digital · Edición 2027</div></div>
    </div>
    <h1 class="bloom-title">BLOOM</h1>
    <div class="bloom-by">by Psicóloga Marha</div>
    <div class="year">2027</div>
    <figure class="central"><blockquote>${CENTRAL.text}</blockquote><figcaption>${CENTRAL.ref} · NVI</figcaption></figure>
    <div class="garland">${garland()}</div>
  </section>
  <div class="welcome"><span class="washi w-rose"></span>
      <p class="serif" style="font-size:20px;font-style:italic">${name ? `Querida ${esc(name)}:` : WELCOME[0]}</p>
      ${WELCOME.slice(1, 3).map(p => `<p>${p}</p>`).join('')}
      <p class="serif" style="font-size:19px;font-style:italic">${PHRASE}</p>
      <div class="sign">Con cariño, Psicóloga Marha</div>
  </div>
  <section class="months-card">
    <div class="deco" style="right:-30px;top:-40px;width:150px;opacity:.9;transform:scaleX(-1)">${bouquet(1)}</div>
    <div class="eyebrow">Mi año 2027</div>
    <h2 class="serif" style="font-weight:500;font-size:34px">Elige tu mes</h2>
    <nav class="months" aria-label="Los doce meses">${MONTHS.map((mo, i) => `<a class="month ${i === now ? 'now' : ''}" href="#portada-${i + 1}"><span class="dot">${icons[i % 6]}</span><span class="mn">${mo.n.toUpperCase()}</span><span class="mt">${mo.t}</span></a>`).join('')}</nav>
    <div class="quick">
      <a class="chip" href="#hoy">✿ Mi página de hoy</a><a class="chip" href="#mi-anio">Diseñar mi año</a>
      <a class="chip" href="#mes-${now + 1}">Ir a ${MONTHS[now].n.toLowerCase()}</a>
      <a class="chip" href="#metas">Mis metas</a>
      <a class="chip" href="#ajustes">Mi copia de seguridad</a>
    </div>
    <a class="year-prog" href="#metas">${ring(st.total, 56)}<div><div style="font-weight:500">Mi progreso del año</div><div class="small muted">${st.goals.length ? `${st.goals.length} ${st.goals.length === 1 ? 'meta' : 'metas'} · ${st.byStatus[3].count} ${st.byStatus[3].count === 1 ? 'lograda' : 'logradas'}` : 'Aún no has escrito tus metas del año'}</div></div></a>
  </section>
  </div>`;
}
/* ---------- Mi año ---------- */
function goalCard(g) {
    const P = (k) => `goals.#${g.id}.${k}`;
    return `<details class="goal" ${g.name ? '' : 'open'} data-goal="${g.id}">
    <summary><span class="gn">${esc(g.name) || 'Nueva meta'}</span><span class="pbar" style="width:60px"><i style="width:${+g.progress || 0}%"></i></span><span class="status">${esc(g.status)}</span></summary>
    <div class="gb">
      ${lab('Nombre de la meta', fld('year', P('name'), g.name, 'Por ejemplo: Leer la Biblia completa'))}
      ${lab('Descripción', ta('year', P('description'), g.description, '¿Qué significa lograrla?'))}
      <div class="grid2">
        ${lab('Fecha objetivo', fld('year', P('targetDate'), g.targetDate, '', 'date', `min="${YEAR}-01-01" max="${YEAR}-12-31"`))}
        ${lab('Relación con un mes', `<select class="inp" data-doc="year" data-p="${P('month')}" data-t="month"><option value="">Ninguno</option>${MONTHS.map((m, i) => `<option value="${i}" ${g.month === i ? 'selected' : ''}>${m.n}</option>`).join('')}</select>`)}
        ${lab('Estado de avance', `<select class="inp" data-doc="year" data-p="${P('status')}">${STATUSES.map(s => `<option ${s === g.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`)}
        ${lab(`Avance · <b data-live="pct">${+g.progress || 0}%</b>`, `<input type="range" min="0" max="100" step="5" data-doc="year" data-p="${P('progress')}" data-t="n" value="${+g.progress || 0}">`)}
      </div>
      ${lab('Acciones necesarias', ta('year', P('actions'), g.actions, 'Pasos concretos, uno por renglón', 3))}
      ${lab('Reflexión bíblica relacionada', fld('year', P('verseRef'), g.verseRef, 'Referencia, por ejemplo Filipenses 4:13'))}
      <button class="rm" data-a="goal-del" data-id="${g.id}">Eliminar esta meta</button>
    </div></details>`;
}
function board() {
    const st = yearStats();
    return `<div class="board">
    <div style="text-align:center">${ring(st.total, 170)}<div class="small muted">Avance promedio de ${st.goals.length} ${st.goals.length === 1 ? 'meta' : 'metas'}</div></div>
    <div><div class="bars">${st.byDim.map(x => `<div class="b"><span>${x.d.n}</span><div class="pbar ${x.count ? '' : 'navy'}" style="height:8px"><i style="width:${x.avg}%"></i></div><span class="small muted">${x.count ? Math.round(x.avg) + '%' : '—'}</span></div>`).join('')}</div>
    <div class="statusrow">${st.byStatus.map(x => `<span>${x.s}: <b>${x.count}</b></span>`).join('')}</div></div>
  </div>
  <div class="eyebrow" style="margin-top:20px">Metas por mes</div>
  <div class="mgoals">${MONTHS.map((m, i) => `<a href="#mes-${i + 1}"><b>${st.byMonth[i]}</b>${m.n.slice(0, 3)}</a>`).join('')}</div>`;
}
function viewYear() {
    const y = year(), v = y.vision, D = 'year';
    return `<header class="mhero two">
    <div><div class="eyebrow">Antes de comenzar</div><h1>Mi año 2027</h1><div class="theme">Diseño el año que quiero vivir con Dios</div></div>
    <aside class="promise"><div class="ref">Mi promesa para el año · ${VISION_VERSE.ref}</div><p>${VISION_VERSE.p}</p><div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div></aside>
  </header>
  <nav class="modnav" aria-label="Secciones"><a href="#" data-a="jump" data-to="sec-vision"><b>1</b>Mi visión</a><a href="#" data-a="jump" data-to="sec-metas"><b>2</b>Mis metas globales</a><a href="#" data-a="jump" data-to="sec-tablero"><b>3</b>Mi tablero</a></nav>
  <div class="mods" style="grid-template-columns:1fr">
    <section class="mod" id="sec-vision"><span class="washi w-rose"></span>
      <div class="mod-h"><span class="letter">1</span><h2>Mi visión del año</h2></div>
      <div class="grid3">
        ${lab('Mi palabra del año', fld(D, 'vision.word', v.word, 'Florecer'))}
        ${lab('Mi versículo del año', fld(D, 'vision.verse', v.verse, 'Referencia, por ejemplo Isaías 43:19'))}
        <div></div>
      </div>
      <div class="vision">
        ${lab('¿Cómo quiero sentirme al terminar 2027?', ta(D, 'vision.feel', v.feel))}
        ${lab('¿Qué quiero construir?', ta(D, 'vision.build', v.build))}
        ${lab('¿Qué quiero dejar atrás?', ta(D, 'vision.leave', v.leave))}
        ${lab('¿Qué quiero cultivar?', ta(D, 'vision.cultivate', v.cultivate))}
      </div>
      ${lab('Mi declaración personal para 2027', ta(D, 'vision.declaration', v.declaration, 'En 2027 decido…', 3))}
    </section>
    <section class="mod" id="sec-metas"><span class="washi w-blue"></span>
      <div class="mod-h"><span class="letter">2</span><h2>Mis metas globales</h2><span class="hint">Escribe solo las que de verdad quieres trabajar</span></div>
      <div class="dimgrid">${DIMENSIONS.map(d => {
        const gs = y.goals.filter(g => g.dimension === d.id);
        const avg = gs.length ? gs.reduce((t, g) => t + (+g.progress || 0), 0) / gs.length : 0;
        return `<div class="dim" id="dim-${d.id}"><h3>${d.n} <span class="cnt">${gs.length || ''}</span><span class="pbar"><i style="width:${avg}%"></i></span></h3>
          <div class="reflect" style="font-size:13px"><b>${d.ref}</b> · ${d.p}${para}</div>
          ${gs.map(goalCard).join('')}
          <button class="add" data-a="goal-add" data-dim="${d.id}">+ Agregar meta</button></div>`;
    }).join('')}</div>
    </section>
    <section class="mod" id="sec-tablero"><span class="washi w-sand"></span>
      <div class="mod-h"><span class="letter">3</span><h2>Mi tablero de progreso anual</h2></div>
      <div id="board">${board()}</div>
    </section>
  </div>
  ${pager(['#inicio', 'Portada'], ['#mes-1', 'Enero'])}`;
}
function viewGoals() {
    const st = yearStats();
    return `<header class="mhero" style="grid-template-columns:1fr;border:none"><div><div class="eyebrow">Panel de metas</div><h1 style="font-size:clamp(40px,6vw,64px)">Mis metas 2027</h1></div></header>
  <section class="mod"><div id="board">${board()}</div></section>
  <section class="mod" style="margin-top:20px"><div class="mod-h"><h2>Todas mis metas</h2></div>
  ${st.goals.length ? `<table class="tbl"><thead><tr><th>Meta</th><th>Dimensión</th><th>Mes</th><th>Fecha</th><th>Avance</th><th>Estado</th></tr></thead><tbody>${st.goals.slice().sort((a, b) => (a.targetDate || '9').localeCompare(b.targetDate || '9')).map(g => `<tr><td><a href="#mi-anio" data-a="open-goal" data-id="${g.id}">${esc(g.name)}</a></td><td>${DIMENSIONS.find(d => d.id === g.dimension).n}</td><td>${g.month === null ? '—' : MONTHS[g.month].n}</td><td>${g.targetDate ? g.targetDate.slice(8) + '/' + g.targetDate.slice(5, 7) : '—'}</td><td>${+g.progress || 0}%</td><td><span class="status">${g.status}</span></td></tr>`).join('')}</tbody></table>`
        : '<p class="muted">Todavía no hay metas. <a href="#mi-anio">Escríbelas en Mi año</a>.</p>'}
  </section>
  <section class="mod" style="margin-top:20px"><div class="mod-h"><h2>Metas de cada mes</h2></div>
  ${(() => {
        const rows = MONTHS.flatMap((mo, m) => { const md = store.get(monthId(m)); return md ? AREAS.filter(a => md.goals[a.id]?.obj.trim()).map(a => ({ m, mo, a, g: md.goals[a.id] })) : []; });
        return rows.length ? `<table class="tbl"><thead><tr><th>Mes</th><th>Área</th><th>Objetivo</th><th>Avance</th><th>Estado</th></tr></thead><tbody>${rows.map(x => `<tr><td><a href="#mes-${x.m + 1}">${x.mo.n}</a></td><td>${x.a.n}</td><td>${esc(x.g.obj)}</td><td>${+x.g.progress || 0}%</td><td><span class="status">${x.g.status}</span></td></tr>`).join('')}</tbody></table>` : '<p class="muted small">Las metas que escribas en «Planeando mi mes» aparecerán aquí.</p>';
    })()}
  </section>
  ${pager(['#mi-anio', 'Mi año'], null)}`;
}
/* ---------- Planeando mi mes (fase 3) ---------- */
const monthDoc = (m) => normalizeMonth(docOf(monthId(m)));
const peekDay = (id) => store.get(id);
const money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const getAt = (o, p) => p.split('.').reduce(step, o);
const sel = (doc, p, val, opts) => `<select class="inp" data-doc="${doc}" data-p="${p}">${opts.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
const chk = (doc, p, val, label = '') => `<input type="checkbox" data-doc="${doc}" data-p="${p}" data-t="b" ${val ? 'checked' : ''} ${label ? `aria-label="${esc(label)}"` : ''}>`;
const num = (doc, p, val, ph = '0') => `<input class="inp" type="number" inputmode="numeric" min="0" step="1000" data-doc="${doc}" data-p="${p}" data-t="money" value="${esc(val)}" placeholder="${ph}">`;
let finTab = 'ingresos';
const PURCHASE_CATS = ['Mercado', 'Comida fuera', 'Transporte', 'Hogar', 'Hijos', 'Salud', 'Ropa', 'Belleza y cuidado', 'Regalos', 'Ofrenda y diezmo', 'Trabajo o negocio', 'Antojos', 'Otros'];
const INCOME_SRC = ['Consulta', 'Salario', 'Quincena', 'Pago de cliente', 'Venta', 'Honorarios', 'Transferencia', 'Arriendo', 'Regalo', 'Otro'];
const monthTotals = (m) => financeTotals(monthDoc(m).fin, dailySpend(m, peekDay).total, dailyIncome(m, peekDay).total);
const COMPUTED = {
    mprog: d => {
        const m = +d.m, mo = monthDoc(m);
        const h = habitProgress(mo, m, peekDay).total, g = growthProgress(mo, m, peekDay).total;
        const goals = Object.values(mo.goals).filter(x => x.obj.trim()), ga = goals.length ? goals.reduce((t, x) => t + (+x.progress || 0), 0) / goals.length / 100 : 0;
        const p = mo.prep.filter(Boolean).length / 6;
        return [['Hábitos', h], ['Trabajando en mí', g], ['Metas del mes', ga], ['Preparando mi mes', p]].map(([t, v]) => `<div class="mp"><span>${t}</span><div class="pbar" style="background:rgba(255,255,255,.18)"><i style="width:${Math.round(+v * 100)}%"></i></div><b>${Math.round(+v * 100)}%</b></div>`).join('');
    },
    goal: d => { const g = monthDoc(+d.m).goals[d.a]; return `<span class="pbar" style="width:60px"><i style="width:${+g.progress || 0}%"></i></span><span class="status">${esc(g.status)}</span>`; },
    goalpct: d => `${+monthDoc(+d.m).goals[d.a].progress || 0}%`,
    hab: d => { const s = habitProgress(monthDoc(+d.m), +d.m, peekDay).per[+d.i]; return `<span class="small muted">${s.done}/${daysInMonth(+d.m)}</span>`; },
    grw: d => { const s = growthProgress(monthDoc(+d.m), +d.m, peekDay).per[+d.i]; return `<span class="small muted">${s.done}/${daysInMonth(+d.m)}</span>`; },
    grwref: d => { const r = growthRef(monthDoc(+d.m).growth[+d.i] || ''); return r ? `Para meditar: ${r}` : ''; },
    habtotal: d => {
        const m = +d.m, s = habitProgress(monthDoc(m), m, peekDay), named = monthDoc(m).habits.filter(x => x.trim()).length;
        return `${ring(s.total * 100, 64)}<div><div style="font-weight:500">${named} de 8 hábitos escritos</div><div class="small muted">Cumplimiento del mes. Marca cada día en la tabla de abajo o, desde la fase 4, en la página de cada día.</div></div>`;
    },
    kpis: d => {
        const t = monthTotals(+d.m);
        return [['Total ingresos', money(t.incomeReceived), `esperado ${money(t.incomeExpected)}${t.dailyIncome ? ` · día a día ${money(t.dailyIncome)}` : ''}`], ['Total gastos', money(t.expenses), `fijos ${money(t.fixedReal)} · variables ${money(t.varReal)} · día a día ${money(t.dailyReal)}`], ['Deudas pagadas', money(t.debtPaid), 'cuotas marcadas como pagadas'], ['Total ahorrado', money(t.saved), 'aportes del mes'], ['Presupuesto vs. real', money(Math.abs(t.budgetDiff)), t.budgetDiff >= 0 ? 'a tu favor' : 'por encima del presupuesto'], ['Dinero disponible', money(t.available), 'después de gastos, deudas y ahorro']]
            .map(([k, v, s], i) => `<div class="kpi ${i === 5 ? 'hl' : ''}"><div class="k">${k}</div><div class="v">${i === 5 && t.available < 0 ? '−' : ''}${v.replace('-', '')}</div><div class="k" style="font-size:11px">${s}</div></div>`).join('');
    },
    charts: d => {
        const t = monthTotals(+d.m);
        const parts = [{ n: 'Gastos fijos', v: t.fixedReal, c: '#23395B' }, { n: 'Gastos variables', v: t.varReal, c: '#8FA6C6' }, { n: 'Compras del día a día', v: t.dailyReal, c: '#E6C9CF' }, { n: 'Deudas pagadas', v: t.debtPaid, c: '#C48F9B' }, { n: 'Ahorro', v: t.saved, c: '#D8A7B1' }, { n: 'Disponible', v: Math.max(t.available, 0), c: '#D9C5AE' }];
        const total = Math.max(t.incomeReceived, parts.slice(0, 5).reduce((s, p) => s + p.v, 0)), R = 70, C = 2 * Math.PI * R;
        let off = 0;
        const segs = total > 0 ? parts.filter(p => p.v > 0).map(p => { const len = p.v / total * C; const s = `<circle r="${R}" cx="90" cy="90" fill="none" stroke="${p.c}" stroke-width="22" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 90 90)"/>`; off += len; return s; }).join('') : '';
        const max = Math.max(1, t.fixedBudget, t.fixedReal, t.varBudget, t.varReal, t.dailyBudget, t.dailyReal);
        const bar = (w, c) => `<div style="height:10px;border-radius:6px;background:#F3EDE5;margin:3px 0"><div style="height:100%;width:${w / max * 100}%;background:${c};border-radius:6px"></div></div>`;
        return `<div><svg viewBox="0 0 180 180" width="210" height="210" role="img" aria-label="En qué se va tu dinero"><circle r="${R}" cx="90" cy="90" fill="none" stroke="#EFE8DF" stroke-width="22"/>${segs}<text x="90" y="84" text-anchor="middle" font-size="11" fill="#5E6B80" font-family="Jost">${total > 0 ? 'Disponible' : 'Agrega ingresos'}</text><text x="90" y="106" text-anchor="middle" font-size="18" font-weight="600" fill="#23395B" font-family="Cormorant Garamond">${total > 0 ? money(t.available) : '—'}</text></svg></div>
      <div><div class="legend">${parts.map(p => `<div><i style="background:${p.c}"></i>${p.n}: <b style="font-weight:500">${money(p.v)}</b></div>`).join('')}</div>
      <div style="margin-top:16px;font-size:12.5px"><div style="display:flex;gap:14px;color:var(--ink-soft)"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#A9BCD6;margin-right:5px"></i>Presupuesto</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#C48F9B;margin-right:5px"></i>Real</span></div>
      <div style="margin-top:8px">Gastos fijos</div>${bar(t.fixedBudget, '#A9BCD6')}${bar(t.fixedReal, '#C48F9B')}<div style="margin-top:8px">Gastos variables</div>${bar(t.varBudget, '#A9BCD6')}${bar(t.varReal, '#C48F9B')}<div style="margin-top:8px">Compras del día a día</div>${bar(t.dailyBudget, '#A9BCD6')}${bar(t.dailyReal, '#C48F9B')}</div></div>`;
    },
    sum: d => money(getAt(docOf(d.doc), d.l).reduce((t, x) => t + (Number(x[d.k]) || 0), 0)),
    dif: d => { const r = getAt(docOf(d.doc), d.p); if (r.budget === '' && r.real === '')
        return ''; const x = (+r.budget || 0) - (+r.real || 0); return `<span style="color:${x < 0 ? 'var(--bad)' : 'var(--good)'}">${x < 0 ? '−' : ''}${money(Math.abs(x))}</span>`; },
    debtnew: d => { const r = getAt(docOf(d.doc), d.p); return r.balance === '' ? '' : money((+r.balance || 0) - (r.paid ? +r.fee || 0 : 0)); },
    read: d => { const r = monthDoc(+d.m).reading, pct = +r.total ? Math.min(1, (+r.read || 0) / +r.total) : 0; return `<div class="pbar" style="height:8px"><i style="width:${pct * 100}%"></i></div><div class="small muted" style="margin-top:4px">${+r.total ? `${Math.round(pct * 100)}% leído` : 'Escribe el total de páginas para ver tu avance'}</div>`; },
    dayin: d => { const p = docOf(d.doc).incomes, t = p.reduce((s, x) => s + (Number(x.amount) || 0), 0); return t ? '+ ' + money(t) : ''; },
    daybuy: d => { const p = docOf(d.doc).purchases, t = p.reduce((s, x) => s + (Number(x.amount) || 0), 0); return t ? money(t) : ''; },
    free: d => { const n = eventsOn(d.k).filter(e => e.h !== undefined).length; return `${15 - n} ${15 - n === 1 ? 'hora libre' : 'horas libres'} · 6:00 a. m. – 8:00 p. m.`; },
    daycount: d => { const dd = docOf(d.doc), n = +d.n; if (!n)
        return ''; const k = d.k, mo = monthDoc(Number(d.doc.slice(9, 11)) - 1); const done = mo[k].filter((h, i) => h.trim() && dd[k][i]).length; return `${done} de ${n}`; },
    prep: d => { const p = monthDoc(+d.m).prep.filter(Boolean).length; return p === 6 ? 'Estás lista para comenzar tu mes 🌸' : `${p} de 6 revisados`; },
    close: d => {
        const m = +d.m, mo = monthDoc(m), h = habitProgress(mo, m, peekDay), g = growthProgress(mo, m, peekDay), t = monthTotals(m);
        const goals = Object.values(mo.goals).filter(x => x.obj.trim()), done = goals.filter(x => x.status === 'Lograda').length;
        return `<div class="kpi"><div class="k">Hábitos cumplidos</div><div class="v">${Math.round(h.total * 100)}%</div></div><div class="kpi"><div class="k">Trabajando en mí</div><div class="v">${Math.round(g.total * 100)}%</div></div><div class="kpi"><div class="k">Metas logradas</div><div class="v">${done} de ${goals.length}</div></div><div class="kpi"><div class="k">Recibido en el mes</div><div class="v">${money(t.incomeReceived)}</div><div class="k" style="font-size:11px">esperado ${money(t.incomeExpected)}</div></div><div class="kpi"><div class="k">Gastado en el mes</div><div class="v">${money(t.expenses)}</div><div class="k" style="font-size:11px">${money(t.dailyReal)} en compras diarias</div></div><div class="kpi hl"><div class="k">Balance del mes</div><div class="v">${t.available < 0 ? '−' : ''}${money(Math.abs(t.available))}</div></div>`;
    }
};
function refreshComputed() { document.querySelectorAll('[data-c]').forEach(el => { const f = COMPUTED[el.dataset.c]; if (f)
    el.innerHTML = f(el.dataset); }); }
function tracker(m, kind) {
    const mo = monthDoc(m), names = mo[kind], days = daysInMonth(m);
    const rows = names.map((n, i) => [n, i]).filter(([n]) => n.trim());
    if (!rows.length)
        return `<p class="small muted">Cuando escribas ${kind === 'habits' ? 'tus hábitos' : 'en qué vas a trabajar'}, aquí aparece la tabla para marcar cada día.</p>`;
    const head = Array.from({ length: days }, (_, k) => { const wd = new Date(YEAR, m, k + 1).getDay(); return `<th class="${wd === 0 ? 'sun' : ''}">${k + 1}</th>`; }).join('');
    return `<div class="trk"><table><thead><tr><th class="nm"></th>${head}</tr></thead><tbody>${rows.map(([n, i]) => `<tr><th class="nm" title="${esc(n)}">${esc(n)}</th>${Array.from({ length: days }, (_, k) => { const id = dayId(m, k + 1); const v = !!peekDay(id)?.[kind]?.[i]; return `<td><label class="dot"><input type="checkbox" data-doc="${id}" data-p="${kind}.${i}" data-t="b" ${v ? 'checked' : ''} aria-label="${esc(n)}, ${k + 1} de ${MONTHS[m].n}"><span></span></label></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function viewMonth(m) {
    const mo = MONTHS[m], d = monthDoc(m), D = monthId(m), st = STEWARD[m];
    const yg = year().goals.filter(g => g.name.trim());
    const mods = [['a', 'Enfoque'], ['b', 'Metas'], ['c', 'Hábitos'], ['m', 'Trabajando en mí'], ['d', 'Prioridades'], ['e', 'Finanzas'], ['f', 'Familia y hogar'], ['g', 'Proyecto y trabajo'], ['h', 'Lectura'], ['i', 'Preparando mi mes'], ['j', 'Cierre']];
    const linked = year().goals.filter(g => g.month === m && g.name.trim());
    const goalsHTML = AREAS.map(a => {
        const g = d.goals[a.id], gp = `goals.${a.id}`;
        return `<details class="area"><summary><span class="an">${a.n}</span><span data-c="goal" data-m="${m}" data-a="${a.id}" style="display:flex;gap:8px;align-items:center"></span></summary>
      <div class="ab"><div class="grid2">
        ${lab('Objetivo', ta(D, gp + '.obj', g.obj, '¿Qué quieres lograr este mes?'))}
        ${lab('Acciones concretas', ta(D, gp + '.actions', g.actions, 'Pasos pequeños y claros'))}
        ${lab('Fecha límite', fld(D, gp + '.due', g.due, '', 'date', `min="${YEAR}-${pad(m + 1)}-01" max="${YEAR}-${pad(m + 1)}-${daysInMonth(m)}"`))}
        ${lab('Estado', sel(D, gp + '.status', g.status, STATUSES))}
        ${lab(`Indicador de avance · <b data-c="goalpct" data-m="${m}" data-a="${a.id}"></b>`, `<input type="range" min="0" max="100" step="5" data-doc="${D}" data-p="${gp}.progress" data-t="n" value="${+g.progress || 0}">`)}
        ${lab('Vincular con una meta del año', `<select class="inp" data-doc="${D}" data-p="${gp}.yearGoalId" data-t="null"><option value="">Sin vincular</option>${yg.map(y => `<option value="${y.id}" ${g.yearGoalId === y.id ? 'selected' : ''}>${esc(y.name)}</option>`).join('')}</select>`)}
      </div>
      <div class="reflect"><b>${a.ref}</b> · ${a.p}${para}</div></div></details>`;
    }).join('');
    const L = (k) => `fin.${k}`;
    const rows = (list, cols) => getAt(d, list).map((r, i) => `<tr>${cols(r, `${list}.${i}`)}<td style="width:30px"><button class="x" data-a="del" data-doc="${D}" data-l="${list}" data-i="${i}" aria-label="Eliminar fila">×</button></td></tr>`).join('');
    const add = (list, tpl, t) => `<button class="add" data-a="add" data-doc="${D}" data-l="${list}" data-tpl="${tpl}">+ ${t}</button>`;
    const sum = (list, k) => `<td class="num" data-c="sum" data-doc="${D}" data-l="${list}" data-k="${k}"></td>`;
    const fin = {
        ingresos: ['Mis ingresos', `<table class="tbl"><thead><tr><th>Fuente</th><th>Valor esperado</th><th>Fecha estimada</th><th>Valor recibido</th><th>Estado</th><th></th></tr></thead><tbody>${rows(L('income'), (r, p) => `<td>${fld(D, p + '.src', r.src, 'Salario, ventas, consulta…')}</td><td class="num">${num(D, p + '.exp', r.exp)}</td><td>${fld(D, p + '.date', r.date, '', 'date')}</td><td class="num">${num(D, p + '.rec', r.rec)}</td><td>${sel(D, p + '.status', String(r.status), ['Pendiente', 'Parcial', 'Recibido'])}</td>`)}</tbody><tfoot><tr><td>Total</td>${sum(L('income'), 'exp')}<td></td>${sum(L('income'), 'rec')}<td colspan="2"></td></tr></tfoot></table>${add(L('income'), 'income', 'Agregar ingreso')}
      <p class="small muted" style="margin-top:6px">Arriba planeas lo que esperas recibir. Si te pagan por días, por quincenas o en montos que cambian, anota cada pago en «Dinero que recibí hoy» de la página del día: se suma solo aquí abajo.</p>
      ${(() => {
                const di = dailyIncome(m, peekDay);
                return di.items.length ? `<h4 class="serif" style="font-weight:500;font-size:19px;margin:16px 0 8px">Recibido día a día</h4>
        <div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kpi"><div class="k">Primera quincena (1 al 15)</div><div class="v">${money(di.q1)}</div></div><div class="kpi"><div class="k">Segunda quincena (16 al ${daysInMonth(m)})</div><div class="v">${money(di.q2)}</div></div><div class="kpi hl"><div class="k">Total recibido día a día</div><div class="v">${money(di.total)}</div></div></div>
        <div class="bars" style="margin-top:12px">${di.bySrc.map(([c, v]) => `<div class="b"><span>${esc(c)}</span><div class="pbar navy" style="height:8px"><i style="width:${v / Math.max(1, di.bySrc[0][1]) * 100}%"></i></div><span class="small">${money(v)}</span></div>`).join('')}</div>
        <table class="tbl" style="margin-top:12px"><thead><tr><th>Día</th><th>Concepto</th><th>Fuente</th><th>Valor</th></tr></thead><tbody>${di.items.map(i => `<tr><td><a href="#dia-${YEAR}-${pad(m + 1)}-${pad(i.d)}">${i.d}</a></td><td>${esc(i.what)}</td><td>${esc(i.src)}</td><td class="num">${money(i.amount)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3">Total</td><td class="num">${money(di.total)}</td></tr></tfoot></table>` : '';
            })()}`],
        fijos: ['Mis gastos fijos', `<table class="tbl"><thead><tr><th>Categoría</th><th>Presupuesto</th><th>Valor real</th><th>Diferencia</th><th></th></tr></thead><tbody>${rows(L('fixed'), (r, p) => `<td>${fld(D, p + '.cat', r.cat, 'Nueva categoría')}</td><td class="num">${num(D, p + '.budget', r.budget)}</td><td class="num">${num(D, p + '.real', r.real)}</td><td class="num small" data-c="dif" data-doc="${D}" data-p="${p}"></td>`)}</tbody><tfoot><tr><td>Total</td>${sum(L('fixed'), 'budget')}${sum(L('fixed'), 'real')}<td colspan="2"></td></tr></tfoot></table>${add(L('fixed'), 'fixed', 'Agregar categoría')}`],
        variables: ['Mis gastos variables', `<table class="tbl"><thead><tr><th>Categoría</th><th>Descripción</th><th>Presupuesto</th><th>Valor real</th><th>Fecha</th><th></th></tr></thead><tbody>${rows(L('variable'), (r, p) => `<td>${fld(D, p + '.cat', r.cat, 'Ropa, salidas…')}</td><td>${fld(D, p + '.desc', r.desc)}</td><td class="num">${num(D, p + '.budget', r.budget)}</td><td class="num">${num(D, p + '.real', r.real)}</td><td>${fld(D, p + '.date', r.date, '', 'date')}</td>`)}</tbody><tfoot><tr><td colspan="2">Total</td>${sum(L('variable'), 'budget')}${sum(L('variable'), 'real')}<td colspan="2"></td></tr></tfoot></table>${d.fin.variable.length ? '' : '<p class="small muted">Gastos que cambian cada mes: ropa, salidas, regalos…</p>'}${add(L('variable'), 'variable', 'Agregar gasto')}`],
        diario: ['Mis compras del día a día', (() => {
                const ds = dailySpend(m, peekDay);
                return `<p class="small muted" style="margin-top:-4px">Se llenan solas con lo que anotas en «Mis compras de hoy» de cada día. Aquí ves el total y en qué se fue.</p>
      <div class="grid2">${lab('Presupuesto para compras del mes', num(D, 'fin.dailyBudget', d.fin.dailyBudget ?? ''))}<div class="kpi"><div class="k">Gastado en compras del día a día</div><div class="v">${money(ds.total)}</div><div class="k" style="font-size:11px">${ds.items.length} ${ds.items.length === 1 ? 'compra' : 'compras'}${+(d.fin.dailyBudget || 0) ? ` · ${+(d.fin.dailyBudget || 0) - ds.total >= 0 ? 'te quedan ' + money(+(d.fin.dailyBudget || 0) - ds.total) : 'pasaste el presupuesto por ' + money(ds.total - +(d.fin.dailyBudget || 0))}` : ''}</div></div></div>
      ${ds.byCat.length ? `<h4 class="serif" style="font-weight:500;font-size:19px;margin:14px 0 6px">Por categoría</h4><div class="bars">${ds.byCat.map(([c, v]) => `<div class="b"><span>${esc(c)}</span><div class="pbar" style="height:8px"><i style="width:${v / Math.max(1, ds.byCat[0][1]) * 100}%"></i></div><span class="small">${money(v)}</span></div>`).join('')}</div>
      <h4 class="serif" style="font-weight:500;font-size:19px;margin:16px 0 6px">Día por día</h4><table class="tbl"><thead><tr><th>Día</th><th>Compra</th><th>Categoría</th><th>Valor</th></tr></thead><tbody>${ds.items.map(i => `<tr><td><a href="#dia-${YEAR}-${pad(m + 1)}-${pad(i.d)}">${i.d}</a></td><td>${esc(i.what)}</td><td>${esc(i.cat)}</td><td class="num">${money(i.amount)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3">Total</td><td class="num">${money(ds.total)}</td></tr></tfoot></table>`
                    : `<p class="small muted">Aún no hay compras anotadas. Abre <a href="#dia-${YEAR}-${pad(m + 1)}-01">la página de un día</a> y usa «Mis compras de hoy».</p>`}`;
            })()],
        deudas: ['Mis deudas', `<table class="tbl"><thead><tr><th>Obligación</th><th>Saldo pendiente</th><th>Cuota</th><th>Fecha de pago</th><th>Tasa %</th><th>Pagada</th><th>Saldo actualizado</th><th></th></tr></thead><tbody>${rows(L('debts'), (r, p) => `<td>${fld(D, p + '.name', r.name, 'Tarjeta, préstamo…')}</td><td class="num">${num(D, p + '.balance', r.balance)}</td><td class="num">${num(D, p + '.fee', r.fee)}</td><td>${fld(D, p + '.day', r.day, '', 'date')}</td><td class="num">${fld(D, p + '.rate', r.rate, '—', 'text', 'inputmode="decimal" style="width:60px"')}</td><td>${chk(D, p + '.paid', !!r.paid, 'Cuota pagada')}</td><td class="num small" data-c="debtnew" data-doc="${D}" data-p="${p}"></td>`)}</tbody></table>${d.fin.debts.length ? '' : '<p class="small muted">Sin deudas registradas. Si tienes alguna, agrégala para ver su saldo actualizado.</p>'}${add(L('debts'), 'debts', 'Agregar deuda')}`],
        ahorros: ['Mis ahorros', `<table class="tbl"><thead><tr><th>Objetivo</th><th>Meta total</th><th>Aporte de este mes</th><th></th></tr></thead><tbody>${rows(L('savings'), (r, p) => `<td>${fld(D, p + '.name', r.name, 'Nuevo objetivo')}</td><td class="num">${num(D, p + '.goal', r.goal)}</td><td class="num">${num(D, p + '.saved', r.saved)}</td>`)}</tbody><tfoot><tr><td>Total ahorrado</td><td></td>${sum(L('savings'), 'saved')}<td></td></tr></tfoot></table>${add(L('savings'), 'savings', 'Agregar objetivo')}`],
        compromisos: ['Mis compromisos financieros', `<table class="tbl"><thead><tr><th>Factura por pagar</th><th>Valor</th><th>Vence</th><th>Recordatorio</th><th>Pagada</th><th></th></tr></thead><tbody>${rows(L('bills'), (r, p) => `<td>${fld(D, p + '.what', r.what, 'Internet, colegio…')}</td><td class="num">${num(D, p + '.amount', r.amount)}</td><td>${fld(D, p + '.due', r.due, '', 'date')}</td><td>${fld(D, p + '.remind', r.remind, '2 días antes')}</td><td>${chk(D, p + '.paid', !!r.paid, 'Factura pagada')}</td>`)}</tbody></table>${add(L('bills'), 'bills', 'Agregar factura')}<p class="small muted">Los avisos en el celular llegan con el centro de notificaciones (fase 6).</p>`],
        balance: ['Mi balance mensual', `<div class="charts" data-c="charts" data-m="${m}"></div>`]
    };
    const ft = fin[finTab] ? finTab : 'ingresos';
    const listBlock = (key, kinds, ph) => `<div class="list">${d[key].map((r, i) => `<div class="row">${fld(D, `${key}.${i}.date`, r.date, '', 'date')}${fld(D, `${key}.${i}.what`, r.what, ph)}${sel(D, `${key}.${i}.kind`, r.kind, kinds)}<button class="x" data-a="del" data-doc="${D}" data-l="${key}" data-i="${i}" aria-label="Eliminar">×</button></div>`).join('')}</div>
    ${d[key].length ? '' : '<p class="small muted">Espacio opcional. Lo que tenga fecha aparece en el calendario del mes y, desde la fase 4, en la página de ese día.</p>'}${add(key, key, 'Agregar')}`;
    const growthPicker = `<div class="gpick">${GROWTH.map(x => `<div><div class="eyebrow" style="margin:8px 0 6px">${x.g}</div><div class="gchips">${x.items.map(([n]) => `<button class="gchip ${d.growth.some(g => g.trim().toLowerCase() === n.toLowerCase()) ? 'on' : ''}" data-a="grow" data-m="${m}" data-v="${esc(n)}">${n}</button>`).join('')}</div></div>`).join('')}</div>`;
    return `<nav class="mstrip" aria-label="Meses">${MONTHS.map((x, i) => `<a class="${i === m ? 'on' : ''}" href="#mes-${i + 1}">${x.n.slice(0, 3).toUpperCase()}</a>`).join('')}</nav>
  <header class="mhero">
    <div><div class="eyebrow">Planeando mi mes · ${YEAR}</div><h1>${mo.n}</h1><div class="theme" id="mtheme">Tema de florecimiento: ${esc(d.focus.theme || mo.t)}</div>
      <div class="subtabs"><a class="chip" href="#portada-${m + 1}">← Portada de ${mo.n.toLowerCase()}</a><a class="chip" href="#" data-a="jump" data-to="mod-cal">Calendario</a><a class="chip" href="#semana-${weekOf(new Date(YEAR, m, 1))}">Semanas</a><a class="chip" href="#dia-${YEAR}-${pad(m + 1)}-01">Días</a><a class="chip" href="#" data-a="jump" data-to="mod-j">Cierre del mes</a></div></div>
    <aside class="promise"><div class="ref">Mi promesa del mes · ${mo.ref}</div><p>${mo.p}</p><div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div><div class="mprog" data-c="mprog" data-m="${m}"></div></aside>
  </header>
  <nav class="modnav" aria-label="Módulos">${mods.map(([l, t]) => `<a href="#" data-a="jump" data-to="mod-${l}"><b>${l === 'm' ? '✿' : l.toUpperCase()}</b>${t}</a>`).join('')}</nav>
  <div class="mods">
    <section class="mod" id="mod-a"><span class="washi w-rose"></span>
      <div class="mod-h"><span class="letter">A</span><h2>Mi enfoque del mes</h2></div>
      ${lab('Tema de florecimiento', fld(D, 'focus.theme', d.focus.theme, mo.t))}
      <div class="grid2">${lab('¿Qué quiero cultivar este mes?', ta(D, 'focus.cultivate', d.focus.cultivate))}${lab('¿Qué quiero mejorar?', ta(D, 'focus.improve', d.focus.improve))}${lab('¿Qué quiero soltar?', ta(D, 'focus.release', d.focus.release))}${lab('¿Qué quiero priorizar?', ta(D, 'focus.prioritize', d.focus.prioritize))}</div>
      ${lab('Mi declaración del mes', ta(D, 'focus.declaration', d.focus.declaration, `Este ${mo.n.toLowerCase()} decido…`))}
      ${lab('Otra promesa bíblica para este mes (opcional)', fld(D, 'focus.myPromise', d.focus.myPromise, 'Referencia, por ejemplo Salmo 23:1'))}
      <div class="reflect"><b>Reflexión.</b> ${mo.r}</div>
    </section>
    <section class="mod" id="mod-d"><span class="washi w-blue"></span>
      <div class="mod-h"><span class="letter">D</span><h2>Mis prioridades</h2></div>
      ${[1, 2, 3].map(i => `<div class="pri"><span class="n">${i}</span><div style="flex:1">${fld(D, `pri.p${i}`, d.pri['p' + i], `Prioridad ${i}`)}</div></div>`).join('')}
      ${lab('Una decisión importante que debo tomar', ta(D, 'pri.decision', d.pri.decision))}
      ${lab('Un asunto que no puedo seguir aplazando', ta(D, 'pri.postponed', d.pri.postponed))}
      ${lab('Algo que quiero hacer por mí', ta(D, 'pri.forMe', d.pri.forMe))}
    </section>
    <section class="mod wide" id="mod-b"><span class="washi w-sand"></span>
      <div class="mod-h"><span class="letter">B</span><h2>Mis metas del mes</h2><span class="hint">Toca un área para abrirla</span></div>
      ${linked.length ? `<div class="linked"><span class="small muted">Metas del año para ${mo.n.toLowerCase()}:</span> ${linked.map(g => `<span class="status">✿ ${esc(g.name)}</span>`).join(' ')}</div>` : ''}
      <div class="areas">${goalsHTML}</div>
    </section>
    <section class="mod" id="mod-c"><span class="washi w-rose"></span>
      <div class="mod-h"><span class="letter">C</span><h2>Mis hábitos del mes</h2></div>
      <p class="small muted" style="margin-top:-6px">Escribe tus propios hábitos. Aparecen en cada día de ${mo.n.toLowerCase()}; si cambias un nombre, lo ya marcado se conserva.</p>
      <div class="habits">${d.habits.map((h, i) => `<div class="habit"><span class="num">${i + 1}</span>${fld(D, `habits.${i}`, h, 'Mi hábito…')}<span data-c="hab" data-m="${m}" data-i="${i}"></span></div>`).join('')}</div>
      <div class="ring" data-c="habtotal" data-m="${m}"></div>
    </section>
    <section class="mod" id="mod-m"><span class="washi w-blue"></span>
      <div class="mod-h"><span class="letter">✿</span><h2>Trabajando en mí</h2></div>
      <p class="small muted" style="margin-top:-6px">Elige tres aspectos en los que quieres crecer este mes, o escribe los tuyos. Siempre en positivo: hacia dónde vas, no lo que te falta.</p>
      ${[0, 1, 2].map(i => `<div class="habit grow"><span class="num">${i + 1}</span><div style="flex:1">${fld(D, `growth.${i}`, d.growth[i], 'Toca una opción o escribe la tuya')}<div class="para" data-c="grwref" data-m="${m}" data-i="${i}"></div></div><span data-c="grw" data-m="${m}" data-i="${i}"></span>${d.growth[i] ? `<button class="x" data-a="grow-clear" data-m="${m}" data-i="${i}" aria-label="Quitar">×</button>` : ''}</div>`).join('')}
      <details class="gdet" ${d.growth.every(g => g.trim()) ? '' : 'open'}><summary>Ver ideas para elegir</summary>${growthPicker}</details>
      <div class="reflect" style="margin-top:12px"><b>Gálatas 5:22-23</b> · El fruto del Espíritu es amor, alegría, paz, paciencia, amabilidad, bondad, fidelidad, humildad y dominio propio.${para}</div>
    </section>
    <section class="mod wide" id="mod-trk"><span class="washi w-sand"></span>
      <div class="mod-h"><span class="letter">✓</span><h2>Mi seguimiento del mes</h2><span class="hint">Toca un círculo para marcar el día</span></div>
      <h3 class="serif trk-h">Hábitos</h3><div data-trk="habits">${tracker(m, 'habits')}</div>
      <h3 class="serif trk-h">Trabajando en mí</h3><div data-trk="growth">${tracker(m, 'growth')}</div>
    </section>
    <section class="mod wide" id="mod-e"><span class="washi w-rose"></span>
      <div class="mod-h"><span class="letter">E</span><h2>Planeación financiera del mes</h2><span class="hint">Valores en pesos colombianos</span></div>
      <div class="kpis" data-c="kpis" data-m="${m}"></div>
      <div class="ftabs" style="margin-top:16px">${Object.entries(fin).map(([k, [t]]) => `<button class="${k === ft ? 'on' : ''}" data-a="ftab" data-k="${k}">${t.replace('Mis ', '').replace('Mi ', '')}</button>`).join('')}</div>
      <h3 class="serif" style="font-weight:500;font-size:22px;margin-bottom:8px">${fin[ft][0]}</h3>
      <div class="tblwrap">${fin[ft][1]}</div>
      <div class="steward"><div style="width:70px">${bouquet(m % 2)}</div><div><div class="eyebrow">Mi mayordomía financiera</div><h4>${st[0]}</h4><p class="serif" style="font-size:19px;margin:4px 0">${st[1]}</p>${para}<div class="small" style="margin-top:8px">${st[2]}</div></div></div>
    </section>
    <section class="mod" id="mod-f"><span class="washi w-blue"></span><div class="mod-h"><span class="letter">F</span><h2>Mi familia y mi hogar</h2></div>${listBlock('family', FAMILY_KINDS, 'Reunión de padres, cumpleaños…')}</section>
    <section class="mod" id="mod-g"><span class="washi w-sand"></span><div class="mod-h"><span class="letter">G</span><h2>Mi proyecto y trabajo</h2></div>${listBlock('work', WORK_KINDS, 'Entrega, cliente, lanzamiento…')}</section>
    <section class="mod" id="mod-h"><span class="washi w-rose"></span>
      <div class="mod-h"><span class="letter">H</span><h2>Mi lectura del mes</h2></div>
      ${lab('Libro del mes', fld(D, 'reading.book', d.reading.book, 'Título y autora'))}
      <div class="grid2">${lab('Páginas leídas', `<input class="inp" type="number" min="0" inputmode="numeric" data-doc="${D}" data-p="reading.read" data-t="money" value="${esc(d.reading.read)}">`)}${lab('Total de páginas', `<input class="inp" type="number" min="0" inputmode="numeric" data-doc="${D}" data-p="reading.total" data-t="money" value="${esc(d.reading.total)}">`)}${lab('Fecha de inicio', fld(D, 'reading.start', d.reading.start, '', 'date'))}${lab('Fecha de finalización', fld(D, 'reading.end', d.reading.end, '', 'date'))}</div>
      <div data-c="read" data-m="${m}" style="margin:2px 0 12px"></div>
      ${lab('Una frase que me hizo florecer', ta(D, 'reading.quote', d.reading.quote))}
    </section>
    <section class="mod" id="mod-i"><span class="washi w-blue"></span>
      <div class="mod-h"><span class="letter">I</span><h2>Preparando mi mes</h2></div>
      <div class="small muted" data-c="prep" data-m="${m}" style="margin:-6px 0 6px"></div>
      <div class="checks">${PREP.map((q, i) => `<label>${chk(D, `prep.${i}`, d.prep[i])}<span>${q}</span></label>`).join('')}</div>
    </section>
    <section class="mod wide" id="mod-cal"><span class="washi w-sand"></span>
      <div class="mod-h"><span class="letter">✦</span><h2>Calendario de ${mo.n.toLowerCase()}</h2></div>
      <div class="cal" id="mcal">${monthCal(m)}</div>
    </section>
    <section class="mod wide closing" id="mod-j"><span class="washi w-rose"></span>
      <div class="mod-h"><span class="letter">J</span><h2>Mi florecimiento · cierre de ${mo.n.toLowerCase()}</h2><span class="hint">Para el último día del mes</span></div>
      <div class="kpis closek" data-c="close" data-m="${m}"></div>
      <div class="grid2" style="margin-top:16px">${CLOSING.map(([k, q]) => lab(q, ta(D, `closing.${k}`, d.closing[k]))).join('')}</div>
      <div class="reflect"><b>${CLOSING_VERSE.ref}</b> · ${CLOSING_VERSE.p}${para}</div>
    </section>
  </div>
  ${pager([`#portada-${m + 1}`, `Portada de ${mo.n.toLowerCase()}`], m < 11 ? [`#portada-${m + 2}`, MONTHS[m + 1].n] : ['#metas', 'Panel de metas'])}`;
}
function monthCal(m) {
    const mo = MONTHS[m], md = monthDoc(m), first = new Date(YEAR, m, 1), lead = (first.getDay() + 6) % 7;
    let cells = WD.map(w => `<div class="dh">${w}</div>`).join('') + '<div class="blank"></div>'.repeat(lead);
    for (let d = 1; d <= daysInMonth(m); d++) {
        const key = `${YEAR}-${pad(m + 1)}-${pad(d)}`, wd = new Date(YEAR, m, d).getDay();
        const ev = [...year().goals.filter(g => g.targetDate === key && g.name.trim()).map(g => ['Meta', g.name]), ...md.family.filter(x => x.date === key && x.what).map(x => ['', x.what]), ...md.work.filter(x => x.date === key && x.what).map(x => ['s', x.what]), ...md.fin.bills.filter(x => x.due === key && x.what).map(x => ['s', 'Pagar: ' + x.what]), ...studioOn(key).map(x => ['s', x.t])];
        cells += `<a href="#dia-${key}" class="${wd === 0 ? 'sun' : ''} ${ev.length ? 'has' : ''}" aria-label="${d} de ${mo.n}"><span class="d">${d}</span>${ev.slice(0, 3).map(([k, t]) => `<span class="ev ${k === 's' ? 's' : ''}">${k === 'Meta' ? 'Meta: ' : ''}${esc(t)}</span>`).join('')}${ev.length > 3 ? `<span class="small muted">+${ev.length - 3}</span>` : ''}</a>`;
    }
    return cells;
}
/* ---------- Semana y día (fase 4) ---------- */
const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 a. m. – 8 p. m.
const KINDS = ['Cita', 'Reunión', 'Trabajo', 'Personal', 'Familia', 'Consulta', 'Compromiso'];
const FEELS = ['En paz', 'Agradecida', 'Con energía', 'Esperanzada', 'Cansada', 'Ansiosa', 'Triste'];
const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'a. m.' : 'p. m.'}`;
const dkey = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const WEEK1 = new Date(2026, 11, 28); // lunes de la semana que contiene el 1 de enero de 2027
const weekStart = (w) => new Date(WEEK1.getFullYear(), WEEK1.getMonth(), WEEK1.getDate() + (w - 1) * 7);
const weekOf = (dt) => Math.floor(Math.round((new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime() - WEEK1.getTime()) / 864e5) / 7) + 1;
const weekDocId = (w) => `week:${YEAR}-W${pad(w)}`;
const todayInYear = () => { const t = new Date(); return t.getFullYear() === YEAR ? t : t.getFullYear() > YEAR ? new Date(YEAR, 11, 31) : new Date(YEAR, 0, 1); };
const doyOf = (dt) => Math.round((dt.getTime() - new Date(YEAR, 0, 1).getTime()) / 864e5);
function gcalLink(key, h, text) {
    const ymd = key.replace(/-/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${ymd}T${pad(h)}0000/${ymd}T${pad(h + 1)}0000&ctz=America/Bogota&details=${encodeURIComponent('Desde BLOOM 2027')}`;
}
/** Todo lo que tiene fecha en un día: horas ocupadas, familia, trabajo, facturas y metas. */
function eventsOn(key) {
    const dt = new Date(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8)), m = dt.getMonth();
    const out = [];
    const day = store.get(`day:${key}`);
    if (day)
        Object.entries(day.hours || {}).forEach(([h, x]) => { if (x && x.t.trim())
            out.push({ t: x.t, k: x.k, h: +h }); });
    const md = store.get(monthId(m));
    if (md) {
        md.family.forEach(x => { if (x.date === key && x.what)
            out.push({ t: x.what, k: 'Familia' }); });
        md.work.forEach(x => { if (x.date === key && x.what)
            out.push({ t: x.what, k: 'Trabajo' }); });
        md.fin.bills.forEach(x => { if (x.due === key && x.what)
            out.push({ t: 'Pagar: ' + x.what, k: 'Compromiso' }); });
        AREAS.forEach(a => { const g = md.goals[a.id]; if (g?.due === key && g.obj.trim())
            out.push({ t: 'Meta: ' + g.obj, k: 'Compromiso' }); });
    }
    year().goals.forEach(g => { if (g.targetDate === key && g.name.trim())
        out.push({ t: 'Meta del año: ' + g.name, k: 'Compromiso' }); });
    projectTasksOn(key).forEach(x => out.push(x));
    studioOn(key).forEach(x => out.push({ t: `${x.t}${x.f === 'pub' && x.p.pubTime ? ' · ' + x.p.pubTime : ''} (${x.p.platform})`, k: 'Mi Estudio' }));
    return out.sort((a, b) => (a.h ?? 99) - (b.h ?? 99));
}
function viewDay(m, d) {
    const dt = new Date(YEAR, m, d), key = dkey(dt), D = dayId(m, d), day = docOf(D), mo = monthDoc(m);
    HOURS.forEach(h => { if (!day.hours[h])
        day.hours[h] = { t: '', k: 'Cita' }; });
    const idx = doyOf(dt), pr = DAILY[idx % DAILY.length];
    const prev = new Date(YEAR, m, d - 1), next = new Date(YEAR, m, d + 1);
    const habits = mo.habits.map((h, i) => [h, i]).filter(([h]) => h.trim());
    const growth = mo.growth.map((h, i) => [h, i]).filter(([h]) => h.trim());
    const others = eventsOn(key).filter(e => e.h === undefined);
    const row = (h) => {
        const x = day.hours[h], busy = !!x.t.trim();
        return `<div class="hr ${busy ? 'busy' : ''} k-${x.k}" data-h="${h}"><span class="h">${hourLabel(h)}</span>${fld(D, `hours.${h}.t`, x.t, '')}${sel(D, `hours.${h}.k`, x.k, KINDS)}${gOn() ? '' : `<a class="gc" target="_blank" rel="noopener" href="${gcalLink(key, h, x.t)}" title="Añadir a Google Calendar" aria-label="Añadir a Google Calendar">↗</a>`}</div>`;
    };
    const checks = (list, kind) => `<div class="hchk">${list.map(([n, i]) => `<label class="${day[kind][i] ? 'done' : ''}">${chk(D, `${kind}.${i}`, !!day[kind][i])}<span>${esc(n)}</span></label>`).join('')}</div>`;
    return `<header class="dayhead">
    <div class="bignum">${d}</div>
    <div><div class="wd">${WEEKDAYS[dt.getDay()]}</div><div class="mo serif">${MONTHS[m].n} ${YEAR}</div><div class="ph">${BLOOM_LINES[idx % BLOOM_LINES.length]}</div></div>
    <div class="daynav">${prev.getFullYear() === YEAR ? `<a class="iconbtn" href="#dia-${dkey(prev)}" aria-label="Día anterior">←</a>` : ''}<a class="iconbtn" href="#semana-${weekOf(dt)}">Mi semana</a><a class="iconbtn" href="#mes-${m + 1}">Mi mes</a>${next.getFullYear() === YEAR ? `<a class="iconbtn" href="#dia-${dkey(next)}" aria-label="Día siguiente">→</a>` : ''}</div>
  </header>
  <div class="daygrid">
    <section>
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px"><h3 class="serif" style="font-weight:500;font-size:25px">Mi agenda</h3><span class="small muted" data-c="free" data-k="${key}"></span></div>
      <div class="hours">${HOURS.map(row).join('')}</div>
      <div class="legendday"><span><i style="background:var(--rose-dust)"></i>Ocupado</span><span><i style="background:var(--blue)"></i>Trabajo y reuniones</span><span><i style="background:#B89B7E"></i>Familia</span><span><i style="background:#fff;border:1px solid var(--line-2)"></i>Disponible</span>${gOn() ? '<span>Tus citas se copian solas a tu calendario «BLOOM 2027» de Google</span>' : '<span>↗ abre la cita en Google Calendar para guardarla</span>'}</div>
    </section>
    <aside class="stack">
      <div class="prom"><div class="ref">La promesa de hoy · ${pr[0]}</div><p>${pr[1]}</p><div class="para">Paráfrasis Bloom · lee el texto completo en tu Biblia</div><div class="rec">${pr[2]}</div></div>
      <div class="prio"><h3>Mi prioridad del día</h3>${fld(D, 'priority', day.priority, 'Lo más importante de hoy')}</div>
      <div class="card hab-card"><h3>Mis hábitos <span class="small muted" data-c="daycount" data-doc="${D}" data-k="habits" data-n="${habits.length}"></span></h3>
        ${habits.length ? checks(habits, 'habits') : `<p class="small muted">Aún no has escrito tus hábitos de ${MONTHS[m].n.toLowerCase()}. <a href="#mes-${m + 1}">Escríbelos en Planeando mi mes</a> y aparecerán aquí.</p>`}</div>
      <div class="card grow-card"><h3>Trabajando en mí <span class="small muted" data-c="daycount" data-doc="${D}" data-k="growth" data-n="${growth.length}"></span></h3>
        ${growth.length ? checks(growth, 'growth') : `<p class="small muted">Elige en <a href="#mes-${m + 1}">Planeando mi mes</a> tres aspectos en los que quieres crecer.</p>`}</div>
      <div class="card buy-card in-card"><h3>Dinero que recibí hoy <span class="small muted" data-c="dayin" data-doc="${D}"></span></h3>
        ${day.incomes.map((p, i) => `<div class="buy">${fld(D, `incomes.${i}.what`, p.what, 'Consulta Ana, quincena…')}${num(D, `incomes.${i}.amount`, p.amount)}${sel(D, `incomes.${i}.src`, p.src, INCOME_SRC)}<button class="x" data-a="del" data-doc="${D}" data-l="incomes" data-i="${i}" aria-label="Eliminar ingreso">×</button></div>`).join('')}
        <button class="add" data-a="add" data-doc="${D}" data-l="incomes" data-tpl="incomes">+ Agregar ingreso</button>
        <div class="small muted" style="margin-top:8px">Se suma sola a <a href="#mes-${m + 1}" data-a="fin-ingresos">los ingresos de ${MONTHS[m].n.toLowerCase()}</a>.</div></div>
      <div class="card buy-card"><h3>Mis compras de hoy <span class="small muted" data-c="daybuy" data-doc="${D}"></span></h3>
        ${day.purchases.map((p, i) => `<div class="buy">${fld(D, `purchases.${i}.what`, p.what, '¿Qué compraste?')}${num(D, `purchases.${i}.amount`, p.amount)}${sel(D, `purchases.${i}.cat`, p.cat, PURCHASE_CATS)}<button class="x" data-a="del" data-doc="${D}" data-l="purchases" data-i="${i}" aria-label="Eliminar compra">×</button></div>`).join('')}
        <button class="add" data-a="add" data-doc="${D}" data-l="purchases" data-tpl="purchases">+ Agregar compra</button>
        <div class="small muted" style="margin-top:8px">Se suma sola a <a href="#mes-${m + 1}" data-a="fin-diario">las finanzas de ${MONTHS[m].n.toLowerCase()}</a>.</div></div>
      <div class="card"><h3>Mis pendientes</h3>
        ${day.todos.map((t, i) => `<div class="todo ${t.done ? 'done' : ''}">${chk(D, `todos.${i}.done`, t.done, 'Hecho')}${fld(D, `todos.${i}.t`, t.t, 'Pendiente')}<button class="x" data-a="del" data-doc="${D}" data-l="todos" data-i="${i}" aria-label="Eliminar">×</button></div>`).join('')}
        <button class="add" data-a="add" data-doc="${D}" data-l="todos" data-tpl="todos">+ Agregar pendiente</button></div>
      ${others.length ? `<div class="card"><h3>También hoy</h3>${others.map(e => `<div class="todo"><span class="status">${e.k}</span><span>${esc(e.t)}</span></div>`).join('')}</div>` : ''}
      ${googleDayCard(key)}
      ${cycleCard(key)}
      <div class="card"><h3>Mi espacio personal</h3>
        <div class="small muted" style="margin-bottom:6px">¿Cómo me siento hoy?</div>
        <div class="feel">${FEELS.map(f => `<button class="${day.feel === f ? 'on' : ''}" data-a="feel" data-doc="${D}" data-v="${f}">${f}</button>`).join('')}</div>
        ${lab('Algo por lo que agradezco', ta(D, 'grateful', day.grateful))}
        ${lab('Mi intención para hoy', ta(D, 'intention', day.intention))}</div>
    </aside>
  </div>
  ${pager(prev.getFullYear() === YEAR ? [`#dia-${dkey(prev)}`, 'Día anterior'] : null, next.getFullYear() === YEAR ? [`#dia-${dkey(next)}`, 'Día siguiente'] : null)}`;
}
function weekTitle(ds) {
    const a = ds[0], b = ds[ds.length - 1], mn = (x) => MONTHS[x.getMonth()].n.toLowerCase();
    return a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} de ${mn(b)}` : `${a.getDate()} de ${mn(a)} – ${b.getDate()} de ${mn(b)}`;
}
function viewWeek(w) {
    const start = weekStart(w), days = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    const inYear = days.filter(x => x.getFullYear() === YEAR), mid = inYear[Math.min(3, inYear.length - 1)] ?? days[3];
    const W = weekDocId(w), wk = store.getOr(W, () => ({ priorities: ['', '', ''], tasks: [] }));
    const pr = DAILY[(w * 3) % DAILY.length], fmt = (x) => `${x.getDate()} de ${MONTHS[x.getMonth()].n.toLowerCase()}`;
    const months = [...new Set(inYear.map(x => x.getMonth()))];
    const cards = days.map(x => {
        if (x.getFullYear() !== YEAR)
            return `<div class="wday out"><div class="wd">${WEEKDAYS[x.getDay()].slice(0, 3)}</div><div class="dn">${x.getDate()}</div><div class="small muted">${x.getFullYear()}</div></div>`;
        const key = dkey(x), ev = eventsOn(key), dd = store.get(`day:${key}`), mo = store.get(monthId(x.getMonth()));
        const nh = mo ? mo.habits.filter(h => h.trim()).length : 0, done = dd && mo ? mo.habits.filter((h, i) => h.trim() && dd.habits[i]).length : 0;
        const busy = ev.filter(e => e.h !== undefined).length, today = key === dkey(new Date());
        return `<a class="wday ${today ? 'today' : ''}" href="#dia-${key}"><div class="wd">${WEEKDAYS[x.getDay()].slice(0, 3)}</div><div class="dn">${x.getDate()}</div>
      ${dd?.priority ? `<div class="wp">★ ${esc(dd.priority)}</div>` : ''}
      <div class="wev">${ev.slice(0, 5).map(e => `<span class="ev ${e.k === 'Trabajo' || e.k === 'Reunión' ? 's' : ''}">${e.h !== undefined ? hourLabel(e.h) + ' · ' : ''}${esc(e.t)}</span>`).join('')}${ev.length > 5 ? `<span class="small muted">+${ev.length - 5} más</span>` : ''}</div>
      <div class="wfoot"><span title="Horas libres entre 6 a. m. y 8 p. m.">${15 - busy} h libres</span>${nh ? `<span>✓ ${done}/${nh}</span>` : ''}</div>${(() => { const sp = (dd?.purchases ?? []).reduce((s, p) => s + (Number(p.amount) || 0), 0); return sp ? `<div class="wspent">Compras: ${money(sp)}</div>` : ''; })()}${(() => { const inc = (dd?.incomes ?? []).reduce((s, p) => s + (Number(p.amount) || 0), 0); return inc ? `<div class="wspent win">Recibí: ${money(inc)}</div>` : ''; })()}</a>`;
    }).join('');
    const goals = months.flatMap(m => { const md = store.get(monthId(m)); return md ? AREAS.filter(a => md.goals[a.id]?.obj.trim()).map(a => ({ m, a, g: md.goals[a.id] })) : []; });
    return `<header class="mhero two">
    <div><div class="eyebrow">Mi semana · ${w} de 53</div><h1 class="wtitle">${weekTitle(inYear)}</h1>
      <div class="subtabs">${months.map(m => `<a class="chip" href="#mes-${m + 1}">Planear ${MONTHS[m].n.toLowerCase()}</a>`).join('')}<a class="chip" href="#dia-${dkey(mid)}">Ir a un día</a></div></div>
    <aside class="promise"><div class="ref">Reflexión de la semana · ${pr[0]}</div><p>${pr[1]}</p><div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div></aside>
  </header>
  <div class="week">${cards}</div>
  <div class="mods" style="margin-top:20px">
    <section class="mod"><span class="washi w-rose"></span><div class="mod-h"><h2>Mis tres prioridades de la semana</h2></div>
      ${[0, 1, 2].map(i => `<div class="pri"><span class="n">${i + 1}</span><div style="flex:1">${fld(W, `priorities.${i}`, wk.priorities[i], `Prioridad ${i + 1}`)}</div></div>`).join('')}</section>
    <section class="mod"><span class="washi w-blue"></span><div class="mod-h"><h2>Tareas de la semana</h2></div>
      ${wk.tasks.map((t, i) => `<div class="todo ${t.done ? 'done' : ''}">${chk(W, `tasks.${i}.done`, t.done, 'Hecha')}${fld(W, `tasks.${i}.t`, t.t, 'Tarea')}<button class="x" data-a="del" data-doc="${W}" data-l="tasks" data-i="${i}" aria-label="Eliminar">×</button></div>`).join('')}
      <button class="add" data-a="add" data-doc="${W}" data-l="tasks" data-tpl="todos">+ Agregar tarea</button></section>
    <section class="mod wide"><span class="washi w-sand"></span><div class="mod-h"><h2>Mis metas del mes</h2></div>
      ${goals.length ? goals.map(x => `<div class="pri"><span class="n">✿</span><div style="flex:1"><b style="font-weight:500">${esc(x.g.obj)}</b> <span class="small muted">· ${x.a.n}</span><div class="pbar" style="margin-top:6px"><i style="width:${+x.g.progress || 0}%"></i></div></div><span class="status">${esc(x.g.status)}</span></div>`).join('') : `<p class="small muted">Escribe tus metas en <a href="#mes-${months[0] + 1}">Planeando mi mes</a> y las verás aquí cada semana.</p>`}</section>
  </div>
  ${pager(w > 1 ? [`#semana-${w - 1}`, 'Semana anterior'] : null, w < 53 ? [`#semana-${w + 1}`, 'Semana siguiente'] : null)}`;
}
/* ---------- Finanzas del año (fase 5) ---------- */
function yearFinance() {
    const months = MONTHS.map((mo, m) => { const md = store.get(monthId(m)); const ds = dailySpend(m, peekDay), di = dailyIncome(m, peekDay); return { m, mo, md: md ?? (ds.total || di.total ? monthDoc(m) : undefined), ds, t: md || ds.total || di.total ? financeTotals(monthDoc(m).fin, ds.total, di.total) : null }; });
    const used = months.filter(x => x.t && (x.t.incomeReceived || x.t.expenses || x.t.saved || x.t.debtPaid || x.t.incomeExpected));
    const tot = used.reduce((a, x) => ({ inc: a.inc + x.t.incomeReceived, exp: a.exp + x.t.expenses, debt: a.debt + x.t.debtPaid, saved: a.saved + x.t.saved, avail: a.avail + x.t.available, diff: a.diff + x.t.budgetDiff }), { inc: 0, exp: 0, debt: 0, saved: 0, avail: 0, diff: 0 });
    const cats = new Map();
    const savings = new Map();
    const debts = new Map();
    used.forEach(x => {
        const f = x.md.fin;
        x.ds.byCat.forEach(([c, v]) => cats.set(c, (cats.get(c) || 0) + v));
        [...f.fixed, ...f.variable].forEach(l => { const k = (l.cat || 'Sin categoría').trim(); if (+l.real)
            cats.set(k, (cats.get(k) || 0) + (+l.real || 0)); });
        f.savings.forEach(sv => { if (!sv.name.trim())
            return; const cur = savings.get(sv.name) || { goal: 0, saved: 0 }; cur.saved += +sv.saved || 0; if (+sv.goal)
            cur.goal = +sv.goal; savings.set(sv.name, cur); });
        f.debts.forEach(d => { if (!d.name.trim() || d.balance === '')
            return; debts.set(d.name, { balance: (+d.balance || 0) - (d.paid ? +d.fee || 0 : 0), m: x.m }); });
    });
    return { months, used, tot, cats: [...cats].sort((a, b) => b[1] - a[1]), savings: [...savings].filter(([, v]) => v.saved || v.goal), debts: [...debts] };
}
function viewFinance() {
    const y = yearFinance(), T = y.tot;
    const kp = [['Ingresos del año', money(T.inc), `${y.used.length} ${y.used.length === 1 ? 'mes registrado' : 'meses registrados'}`], ['Gastos del año', money(T.exp), 'fijos, variables y compras del día a día'], ['Deudas pagadas', money(T.debt), 'cuotas marcadas como pagadas'], ['Total ahorrado', money(T.saved), 'suma de tus aportes'], ['Presupuesto vs. real', money(Math.abs(T.diff)), T.diff >= 0 ? 'a tu favor en el año' : 'por encima del presupuesto'], ['Disponible acumulado', (T.avail < 0 ? '−' : '') + money(Math.abs(T.avail)), 'lo que quedó libre mes a mes']];
    // Gráfico: ingresos y gastos por mes, con el ahorro como puntos
    const max = Math.max(1, ...y.months.map(x => x.t ? Math.max(x.t.incomeReceived, x.t.expenses + x.t.debtPaid) : 0));
    const W = 720, H = 230, L = 46, B = 196, colW = (W - L - 10) / 12, bw = colW * .3;
    const yv = (v) => B - (v / max) * 166;
    const ticks = [0, .5, 1].map(f => max * f);
    const bars = y.months.map((x, i) => {
        const cx = L + colW * i + colW / 2, t = x.t;
        return `<g><title>${x.mo.n}: ingresos ${money(t?.incomeReceived || 0)}, gastos ${money(t?.expenses || 0)}, deudas ${money(t?.debtPaid || 0)}, ahorro ${money(t?.saved || 0)}</title>
      ${t ? `<rect x="${cx - bw - 1}" y="${yv(t.incomeReceived)}" width="${bw}" height="${B - yv(t.incomeReceived)}" rx="3" fill="#23395B"/>
      <rect x="${cx + 1}" y="${yv(t.expenses)}" width="${bw}" height="${B - yv(t.expenses)}" rx="3" fill="#C48F9B"/>
      <rect x="${cx + 1}" y="${yv(t.expenses + t.debtPaid)}" width="${bw}" height="${B - yv(t.debtPaid) - (B - B)}" rx="3" fill="#E6C9CF" style="display:${t.debtPaid ? 'block' : 'none'}" transform="translate(0 0)"/>
      ${t.saved ? `<circle cx="${cx}" cy="${yv(t.saved)}" r="4.5" fill="#fff" stroke="#6E9B83" stroke-width="2"/>` : ''}` : ''}
      <a href="#mes-${i + 1}"><text x="${cx}" y="${B + 18}" text-anchor="middle" font-size="11" fill="#5E6B80" font-family="Jost">${x.mo.n.slice(0, 3)}</text></a></g>`;
    }).join('');
    const chart = `<svg viewBox="0 0 ${W} ${H}" class="fchart" role="img" aria-label="Ingresos y gastos de cada mes">
    ${ticks.map(v => `<line x1="${L}" x2="${W - 10}" y1="${yv(v)}" y2="${yv(v)}" stroke="#EFE8DF"/><text x="${L - 6}" y="${yv(v) + 4}" text-anchor="end" font-size="10" fill="#5E6B80" font-family="Jost">${v >= 1e6 ? (v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M' : v >= 1e3 ? Math.round(v / 1e3) + ' mil' : '0'}</text>`).join('')}
    ${bars}</svg>
    <div class="legendday"><span><i style="background:#23395B"></i>Ingresos recibidos</span><span><i style="background:#C48F9B"></i>Gastos</span><span><i style="background:#E6C9CF"></i>Cuotas de deudas</span><span><i style="background:#fff;border:2px solid #6E9B83;border-radius:50%"></i>Ahorro</span></div>`;
    const catMax = Math.max(1, ...y.cats.map(c => c[1]));
    return `<header class="mhero two"><div><div class="eyebrow">Mis finanzas del año</div><h1 style="font-size:clamp(40px,6vw,66px)">Mi mayordomía 2027</h1><div class="theme">Todo lo que planeaste mes a mes, en un solo lugar</div></div>
    <aside class="promise"><div class="ref">Proverbios 21:5</div><p>Los planes bien pensados llevan al provecho; la prisa lleva a la escasez.</p><div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div></aside></header>
  ${y.used.length ? '' : `<div class="proto-note" style="margin-top:18px">Aún no hay números. Llena la planeación financiera de cualquier mes en <a href="#mes-${currentMonth() + 1}">Planeando mi mes</a> (módulo E) y aquí verás el año completo.</div>`}
  <div class="kpis" style="margin-top:20px">${kp.map(([k, v, s], i) => `<div class="kpi ${i === 5 ? 'hl' : ''}"><div class="k">${k}</div><div class="v">${v}</div><div class="k" style="font-size:11px">${s}</div></div>`).join('')}</div>
  <div class="mods" style="margin-top:20px">
    <section class="mod wide"><span class="washi w-rose"></span><div class="mod-h"><h2>Mes a mes</h2><span class="hint">Toca un mes para abrirlo</span></div>${y.used.length ? `<div class="fwrap">${chart}</div>` : ''}
      <div class="tblwrap" style="margin-top:14px"><table class="tbl"><thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Deudas pagadas</th><th>Ahorro</th><th>Disponible</th></tr></thead><tbody>
      ${y.months.map(x => `<tr><td><a href="#mes-${x.m + 1}">${x.mo.n}</a></td>${x.t ? `<td class="num">${money(x.t.incomeReceived)}</td><td class="num">${money(x.t.expenses)}</td><td class="num">${money(x.t.debtPaid)}</td><td class="num">${money(x.t.saved)}</td><td class="num" style="color:${x.t.available < 0 ? 'var(--bad)' : 'inherit'}">${x.t.available < 0 ? '−' : ''}${money(Math.abs(x.t.available))}</td>` : '<td colspan="5" class="small muted">Sin planear</td>'}</tr>`).join('')}
      </tbody><tfoot><tr><td>Total</td><td class="num">${money(T.inc)}</td><td class="num">${money(T.exp)}</td><td class="num">${money(T.debt)}</td><td class="num">${money(T.saved)}</td><td class="num">${T.avail < 0 ? '−' : ''}${money(Math.abs(T.avail))}</td></tr></tfoot></table></div></section>
    <section class="mod"><span class="washi w-blue"></span><div class="mod-h"><h2>Mis ahorros</h2></div>
      ${y.savings.length ? y.savings.map(([n, v]) => { const pct = v.goal ? Math.min(100, v.saved / v.goal * 100) : 0; return `<div class="sv"><div class="svh"><b>${esc(n)}</b><span>${money(v.saved)}${v.goal ? ` de ${money(v.goal)}` : ''}</span></div>${v.goal ? `<div class="pbar navy" style="height:8px"><i style="width:${pct}%"></i></div><div class="small muted">${Math.round(pct)}% de la meta</div>` : '<div class="small muted">Escribe una meta total para ver el avance</div>'}</div>`; }).join('') : '<p class="small muted">Tus aportes a cada objetivo de ahorro se suman aquí durante el año.</p>'}</section>
    <section class="mod"><span class="washi w-sand"></span><div class="mod-h"><h2>Mis deudas</h2></div>
      ${y.debts.length ? y.debts.map(([n, v]) => `<div class="sv"><div class="svh"><b>${esc(n)}</b><span>${money(v.balance)}</span></div><div class="small muted">Saldo actualizado en ${MONTHS[v.m].n.toLowerCase()}</div></div>`).join('') : '<p class="small muted">Si registras deudas en tus meses, aquí ves su último saldo actualizado.</p>'}</section>
    <section class="mod wide"><span class="washi w-rose"></span><div class="mod-h"><h2>¿En qué se va mi dinero?</h2><span class="hint">Gastos reales del año por categoría</span></div>
      ${y.cats.length ? `<div class="bars">${y.cats.slice(0, 10).map(([n, v]) => `<div class="b"><span>${esc(n)}</span><div class="pbar" style="height:10px"><i style="width:${v / catMax * 100}%"></i></div><span class="small">${money(v)}</span></div>`).join('')}</div>` : '<p class="small muted">Cuando anotes gastos reales, verás aquí tus categorías más grandes.</p>'}
      <div class="steward" style="margin-top:16px"><div style="width:70px">${bouquet(1)}</div><div><div class="eyebrow">Para reflexionar</div><p class="small" style="margin:6px 0 0">Mirar los números del año no es para juzgarte, sino para administrar con paz lo que Dios te ha confiado. ¿Qué categoría quieres cuidar mejor el próximo mes?</p></div></div></section>
  </div>
  ${pager(['#inicio', 'Inicio'], ['#metas', 'Panel de metas'])}`;
}
/* ---------- Stickers, colores, buscador y recordatorios (fase 6) ---------- */
const THEMES = [
    ['original', 'Original BLOOM', ['#23395B', '#D8A7B1', '#A9BCD6', '#EADCCB']],
    ['rosa', 'Rosa empolvado', ['#23395B', '#C48F9B', '#E8BFC7', '#F3E1E4']],
    ['salvia', 'Salvia', ['#23395B', '#8FA88C', '#C9D8C5', '#E7E3D6']],
    ['lavanda', 'Lavanda', ['#23395B', '#9C88B8', '#CFC3E2', '#ECE6F2']]
];
const applyTheme = () => { document.body.dataset.theme = settings().theme || 'original'; };
/* Stickers pegados en la página actual */
let curView = 'inicio', stCat = 0, selSticker = -1;
const stickerDoc = () => (/^[a-z0-9-]{1,40}$/.test(curView) ? `stickers:${curView}` : 'stickers:inicio');
const placed = () => store.getOr(stickerDoc(), () => ({ items: [] })).items;
function renderStickers() {
    const layer = document.getElementById('stlayer');
    if (!layer)
        return;
    layer.innerHTML = placed().map((s, i) => {
        const def = stickerById(s.sticker);
        if (!def)
            return '';
        const base = def.wide ? 112 : 64, sc = s.s ?? 1;
        return `<div class="stk ${i === selSticker ? 'sel' : ''}" data-i="${i}" style="left:${s.x}%;top:${s.y}px;width:${base * sc}px;transform:rotate(${s.r}deg)">${def.svg}
      <div class="stk-ctl"><button data-a="stk-rot" data-i="${i}" aria-label="Girar">↻</button><button data-a="stk-size" data-d="-1" data-i="${i}" aria-label="Más pequeño">−</button><button data-a="stk-size" data-d="1" data-i="${i}" aria-label="Más grande">+</button><button data-a="stk-del" data-i="${i}" aria-label="Quitar sticker">×</button></div></div>`;
    }).join('');
}
function renderTray() {
    const tray = document.getElementById('tray');
    if (!tray)
        return;
    tray.innerHTML = `<div class="tray-h"><h4>Mis stickers</h4><button class="iconbtn" data-a="decor-done">Listo</button></div>
    <div class="small muted">Toca uno para pegarlo. Arrástralo para moverlo. Al tocar «Listo» ya no estorban para escribir.</div>
    <div class="tray-cats">${STICKER_CATS.map((c, i) => `<button class="${i === stCat ? 'on' : ''}" data-a="stk-cat" data-i="${i}">${c.n}</button>`).join('')}</div>
    <div class="tg">${STICKER_CATS[stCat].items.map(s => `<button data-a="stk-add" data-id="${s.id}" class="${s.wide ? 'w' : ''}" aria-label="Sticker ${s.id}">${s.svg}</button>`).join('')}</div>`;
}
function addSticker(id) {
    const book = document.getElementById('book'), rect = book.getBoundingClientRect();
    const y = Math.max(90, -rect.top + 160 + Math.random() * 120);
    placed().push({ id: uid(), sticker: id, x: 50 + Math.random() * 30, y: Math.round(y), r: Math.round(Math.random() * 20 - 10) });
    selSticker = placed().length - 1;
    store.touch(stickerDoc());
    renderStickers();
}
let drag = null;
document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.stk');
    if (!el || !document.body.classList.contains('decor') || e.target.closest('.stk-ctl'))
        return;
    const r = el.getBoundingClientRect();
    drag = { el, i: +el.dataset.i, ox: e.clientX - r.left, oy: e.clientY - r.top };
    if (selSticker !== drag.i) {
        selSticker = drag.i;
        document.querySelectorAll('.stk').forEach(x => x.classList.toggle('sel', x === el));
    }
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
});
document.addEventListener('pointermove', e => {
    if (!drag)
        return;
    const b = document.getElementById('book').getBoundingClientRect();
    drag.el.style.left = Math.max(0, Math.min(94, (e.clientX - b.left - drag.ox) / b.width * 100)) + '%';
    drag.el.style.top = Math.max(0, e.clientY - b.top - drag.oy) + 'px';
});
document.addEventListener('pointerup', () => {
    if (!drag)
        return;
    const s = placed()[drag.i];
    if (s) {
        s.x = parseFloat(drag.el.style.left);
        s.y = parseFloat(drag.el.style.top);
        store.touch(stickerDoc());
    }
    drag = null;
});
function viewStickers() {
    return `<header class="mhero two"><div><div class="eyebrow">Para decorar</div><h1 style="font-size:clamp(40px,6vw,66px)">Mi biblioteca de stickers</h1><div class="theme">Flores, mariposas, washi tapes y frases para tus páginas</div></div>
    <aside class="promise"><div class="ref">Cómo se usan</div><p style="font-size:17px">Abre cualquier página y toca <b>✿ Decorar</b>. Elige un sticker, arrástralo, gíralo o cambia su tamaño. Toca <b>Listo</b> y vuelve a escribir sin que estorben.</p></aside></header>
  ${STICKER_CATS.map((c, i) => `<section class="mod" style="margin-top:18px"><div class="mod-h"><h2>${c.n}</h2><span class="hint">${c.items.length}</span></div><div class="lib">${c.items.map(s => `<button class="${s.wide ? 'w' : ''}" data-a="stk-try" data-cat="${i}" aria-label="Probar sticker">${s.svg}</button>`).join('')}</div></section>`).join('')}
  ${pager(['#inicio', 'Inicio'], null)}`;
}
/* Buscador */
function searchAll(q) {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2)
        return [];
    const out = [];
    const hit = (text, where, href) => { const t = String(text ?? ''); if (t.toLowerCase().includes(needle))
        out.push({ where, text: t, href }); };
    for (const d of store.all()) {
        const id = d.id, x = d.data;
        if (id.startsWith('day:')) {
            const k = id.slice(4), dt = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8)), w = `${WEEKDAYS[dt.getDay()]} ${dt.getDate()} de ${MONTHS[dt.getMonth()].n.toLowerCase()}`, h = `#dia-${k}`;
            hit(x.priority, `${w} · prioridad`, h);
            (x.incomes || []).forEach((p) => hit(p.what, `${w} · ingreso${p.amount ? ' · ' + money(+p.amount) : ''}`, h));
            (x.purchases || []).forEach((p) => hit(p.what, `${w} · compra${p.amount ? ' · ' + money(+p.amount) : ''}`, h));
            (x.todos || []).forEach((t) => hit(t.t, `${w} · pendiente`, h));
            Object.entries(x.hours || {}).forEach(([hr, v]) => hit(v?.t, `${w} · ${hourLabel(+hr)}`, h));
            hit(x.grateful, `${w} · gratitud`, h);
            hit(x.intention, `${w} · intención`, h);
        }
        else if (id.startsWith('month:')) {
            const m = +id.slice(11, 13) - 1, n = MONTHS[m].n, h = `#mes-${m + 1}`;
            Object.entries(x.focus || {}).forEach(([, v]) => hit(v, `${n} · enfoque`, h));
            Object.entries(x.goals || {}).forEach(([a, g]) => { hit(g.obj, `${n} · meta`, h); hit(g.actions, `${n} · acciones de ${AREAS.find(z => z.id === a)?.n.toLowerCase()}`, h); });
            (x.habits || []).forEach((v) => hit(v, `${n} · hábito`, h));
            (x.growth || []).forEach((v) => hit(v, `${n} · trabajando en mí`, h));
            (x.family || []).forEach((v) => hit(v.what, `${n} · familia${v.date ? ' · ' + v.date.slice(8) + '/' + v.date.slice(5, 7) : ''}`, h));
            (x.work || []).forEach((v) => hit(v.what, `${n} · trabajo${v.date ? ' · ' + v.date.slice(8) + '/' + v.date.slice(5, 7) : ''}`, h));
            (x.fin?.bills || []).forEach((v) => hit(v.what, `${n} · factura`, h));
            hit(x.reading?.book, `${n} · lectura`, h);
            hit(x.reading?.quote, `${n} · frase`, h);
            Object.entries(x.closing || {}).forEach(([, v]) => hit(v, `${n} · cierre`, h));
        }
        else if (id === 'year') {
            Object.entries(x.vision || {}).forEach(([, v]) => hit(v, 'Mi año · visión', '#mi-anio'));
            (x.goals || []).forEach((g) => { hit(g.name, 'Mi año · meta', '#mi-anio'); hit(g.description, 'Mi año · descripción de meta', '#mi-anio'); });
        }
        else if (id === 'prayers') {
            (x.items || []).forEach((p) => { hit(p.req, `Oración · ${p.who || 'petición'}`, '#oracion'); hit(p.who, 'Oración', '#oracion'); hit(p.answer, 'Oración · respuesta', '#oracion'); });
        }
        else if (id === 'notes') {
            (x.sheets || []).forEach((n) => { hit(n.title, 'Mis hojitas', '#hojitas'); hit(n.text, `Mis hojitas · ${n.title || 'hojita'}`, '#hojitas'); });
        }
        else if (id === 'shopping') {
            (x.items || []).forEach((i) => hit(i.t, `Lista de compras · ${i.sec}`, '#compras'));
        }
        else if (id === 'projects') {
            (x.items || []).forEach((p) => { hit(p.name, 'Proyecto', '#proyectos'); hit(p.desc, `Proyecto · ${p.name}`, '#proyectos'); (p.tasks || []).forEach((t) => hit(t.t, `Proyecto · ${p.name}`, '#proyectos')); });
        }
        else if (id === 'studio') {
            (x.pieces || []).forEach((p) => { hit(p.title, `Mi Estudio · ${p.platform}`, '#estudio'); hit(p.script, `Mi Estudio · guion de «${p.title}»`, '#estudio'); hit(p.tags, `Mi Estudio · hashtags de «${p.title}»`, '#estudio'); });
            (x.ideas || []).forEach((i) => hit(i.text, 'Mi Estudio · banco de ideas', '#estudio'));
        }
        else if (id.startsWith('week:')) {
            const w = +id.slice(-2);
            (x.priorities || []).forEach((v) => hit(v, `Semana ${w} · prioridad`, `#semana-${w}`));
            (x.tasks || []).forEach((t) => hit(t.t, `Semana ${w} · tarea`, `#semana-${w}`));
        }
    }
    return out;
}
let lastQuery = '';
function searchResults(q) {
    const r = searchAll(q), mark = (t) => { const i = t.toLowerCase().indexOf(q.trim().toLowerCase()); if (i < 0)
        return esc(t); const s = Math.max(0, i - 40); return (s ? '…' : '') + esc(t.slice(s, i)) + '<mark>' + esc(t.slice(i, i + q.trim().length)) + '</mark>' + esc(t.slice(i + q.trim().length, i + 80)); };
    if (q.trim().length < 2)
        return '<p class="small muted">Escribe al menos dos letras: una cita, una tarea, una persona, un gasto…</p>';
    return r.length ? `<p class="small muted">${r.length} ${r.length === 1 ? 'resultado' : 'resultados'}</p>${r.slice(0, 80).map(x => `<a class="sres" href="${x.href}"><span class="where">${esc(x.where)}</span><span>${mark(x.text)}</span></a>`).join('')}` : '<p class="small muted">No encontré nada con esa palabra.</p>';
}
function viewSearch() {
    return `<header class="mhero" style="grid-template-columns:1fr;border:none"><div><div class="eyebrow">Buscador</div><h1 style="font-size:clamp(40px,6vw,64px)">Buscar en mi agenda</h1></div></header>
  <input class="inp search" id="q" type="search" placeholder="Por ejemplo: colegio, consulta, Ana…" value="${esc(lastQuery)}" autocomplete="off">
  <div id="sres">${searchResults(lastQuery)}</div>`;
}
/* Recordatorios y avisos */
function reminders(days = 14) {
    const t0 = todayInYear(), out = [];
    for (let i = 0; i <= days; i++) {
        const dt = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + i);
        if (dt.getFullYear() !== YEAR)
            break;
        const key = dkey(dt), md = store.get(monthId(dt.getMonth()));
        if (md) {
            md.fin.bills.forEach(b => { if (b.due === key && !b.paid && b.what)
                out.push({ date: key, t: `Pagar ${b.what}${b.amount !== '' ? ' · ' + money(+b.amount) : ''}`, k: 'Factura', href: `#mes-${dt.getMonth() + 1}` }); });
            md.fin.debts.forEach(b => { if (b.day === key && !b.paid && b.name)
                out.push({ date: key, t: `Cuota de ${b.name}`, k: 'Deuda', href: `#mes-${dt.getMonth() + 1}` }); });
            AREAS.forEach(a => { const g = md.goals[a.id]; if (g?.due === key && g.obj.trim() && g.status !== 'Lograda')
                out.push({ date: key, t: g.obj, k: 'Meta del mes', href: `#mes-${dt.getMonth() + 1}` }); });
            md.family.forEach(x => { if (x.date === key && x.what)
                out.push({ date: key, t: x.what, k: x.kind || 'Familia', href: `#dia-${key}` }); });
            md.work.forEach(x => { if (x.date === key && x.what)
                out.push({ date: key, t: x.what, k: x.kind || 'Trabajo', href: `#dia-${key}` }); });
        }
        year().goals.forEach(g => { if (g.targetDate === key && g.name.trim() && g.status !== 'Lograda')
            out.push({ date: key, t: g.name, k: 'Meta del año', href: '#mi-anio' }); });
        projectTasksOn(key).forEach(x => out.push({ date: key, t: x.t, k: x.k, href: '#proyectos' }));
        studioOn(key).filter(x => x.p.status !== 'Publicado').forEach(x => out.push({ date: key, t: x.t + (x.f === 'pub' && x.p.pubTime ? ' · ' + x.p.pubTime : ''), k: 'Mi Estudio', href: '#estudio' }));
        if (i <= 1) {
            const dd = store.get(`day:${key}`);
            if (dd)
                Object.entries(dd.hours || {}).forEach(([h, x]) => { if (x?.t.trim())
                    out.push({ date: key, t: `${hourLabel(+h)} · ${x.t}`, k: x.k, href: `#dia-${key}` }); });
        }
    }
    return out;
}
const relDay = (key) => { const t = dkey(todayInYear()), tm = dkey(new Date(todayInYear().getTime() + 864e5)); if (key === t)
    return 'Hoy'; if (key === tm)
    return 'Mañana'; const dt = new Date(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8)); return `${WEEKDAYS[dt.getDay()]} ${dt.getDate()} de ${MONTHS[dt.getMonth()].n.toLowerCase()}`; };
function updateBell() { const b = document.getElementById('bellCount'); if (!b)
    return; const soon = reminders(3).length; b.textContent = soon ? String(soon) : ''; b.hidden = !soon; }
function viewReminders() {
    const r = reminders(14), s = settings(), perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const groups = [...new Set(r.map(x => x.date))];
    return `<header class="mhero" style="grid-template-columns:1fr;border:none"><div><div class="eyebrow">Centro de recordatorios</div><h1 style="font-size:clamp(40px,6vw,64px)">Lo que viene</h1><div class="theme">Los próximos 14 días de tu agenda</div></div></header>
  <section class="mod"><div class="mod-h"><h2>Avisos en este dispositivo</h2></div>
    ${perm === 'unsupported' ? '<p class="small muted">Este navegador no permite avisos. En iPhone funcionan cuando BLOOM está instalada en la pantalla de inicio.</p>'
        : perm === 'granted' && s.notify ? '<p class="small">✓ Activados. Cada día, al abrir BLOOM, te aviso lo que tienes para hoy.</p>'
            : perm === 'denied' ? '<p class="small muted">Los avisos están bloqueados en este navegador. Puedes permitirlos en la configuración del navegador.</p>'
                : '<p class="small muted">Te aviso lo que tienes para hoy cada vez que abras BLOOM.</p><button class="btn primary" data-a="notify-on">Activar avisos</button>'}
    <p class="small muted" style="margin-top:8px">Los avisos con la app cerrada llegarán cuando BLOOM esté publicada en internet (fase 8).</p></section>
  <section class="mod" style="margin-top:18px">${groups.length ? groups.map(g => `<h3 class="serif rgh">${relDay(g)}</h3>${r.filter(x => x.date === g).map(x => `<a class="sres" href="${x.href}"><span class="where">${esc(x.k)}</span><span>${esc(x.t)}</span></a>`).join('')}`).join('')
        : '<p class="muted">Nada pendiente en los próximos 14 días. Las facturas, metas con fecha, citas de familia y trabajo, y las horas de hoy y mañana aparecen aquí.</p>'}</section>`;
}
async function notifyToday() {
    const s = settings(), today = dkey(new Date());
    if (!s.notify || !('Notification' in window) || Notification.permission !== 'granted' || s.lastNotified === today)
        return;
    const r = reminders(0);
    if (!r.length)
        return;
    const body = r.slice(0, 4).map(x => x.t).join(' · ') + (r.length > 4 ? ` y ${r.length - 4} más` : '');
    try {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg)
            await reg.showNotification('BLOOM · Hoy', { body, icon: 'icon-192.png' });
        else
            new Notification('BLOOM · Hoy', { body, icon: 'icon-192.png' });
        s.lastNotified = today;
        store.touch('settings');
    }
    catch { /* sin avisos */ }
}
/* ---------- Mi Estudio Creativo (fase 6B) ---------- */
const STUDIO_STATES = ['Idea', 'Planeado', 'Pendiente de grabar', 'Grabado', 'Pendiente de editar', 'En edición', 'Listo para publicar', 'Programado', 'Publicado'];
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'WhatsApp', 'Blog', 'Podcast', 'Otra'];
const FORMATS = ['Reel', 'Carrusel', 'Foto', 'Historia', 'Video largo', 'En vivo', 'Artículo', 'Episodio'];
const METRICS = [['reach', 'Alcance'], ['views', 'Visualizaciones'], ['inter', 'Interacciones'], ['comm', 'Comentarios'], ['shares', 'Compartidos'], ['saves', 'Guardados'], ['clicks', 'Clics']];
const studio = () => { const s = store.getOr('studio', () => ({ pieces: [], ideas: [], states: STUDIO_STATES.slice() })); s.states || (s.states = STUDIO_STATES.slice()); s.ideas || (s.ideas = []); s.pieces || (s.pieces = []); return s; };
const pieceById = (id) => studio().pieces.find(p => p.id === id);
const stUi = { tab: 'cal', month: 0, plat: 'Todas', proj: 'Todos', state: 'Todos', open: '' };
const STAGES = [['rec', 'Grabar', 'g'], ['edit', 'Editar', 'e'], ['pub', 'Publicar', 'p']];
/** Fechas de Mi Estudio que caen en un día (para la agenda, la semana y el calendario). */
function studioOn(key) {
    if (!settings().studioEnabled)
        return [];
    const s = store.get('studio');
    if (!s)
        return [];
    return s.pieces.flatMap(p => STAGES.filter(([f]) => p[f] === key && p.title.trim()).map(([f, l, c]) => ({ t: `${l}: ${p.title}`, c, f, p: p, h: f === 'pub' && p.pubTime ? +p.pubTime.slice(0, 2) : undefined })));
}
function studioFiltered() {
    return studio().pieces.filter(p => (stUi.plat === 'Todas' || p.platform === stUi.plat) && (stUi.proj === 'Todos' || (p.project || '') === stUi.proj) && (stUi.state === 'Todos' || p.status === stUi.state));
}
function pieceEditor(p) {
    const P = (k) => `pieces.#${p.id}.${k}`, S = 'studio', st = studio().states;
    const gl = p.pub ? gcalLink(p.pub, p.pubTime ? +p.pubTime.slice(0, 2) : 9, `Publicar: ${p.title} (${p.platform})`) : '';
    return `<details class="piece" data-piece="${p.id}" ${stUi.open === p.id ? 'open' : ''}><summary>
      <span class="pt"><b>${esc(p.title) || 'Sin título'}</b><span class="small muted"> · ${esc(p.platform)} · ${esc(p.format)}${p.pub ? ` · publica ${+p.pub.slice(8)}/${+p.pub.slice(5, 7)}${p.pubTime ? ' ' + p.pubTime : ''}` : ' · sin fecha'}</span></span>
      <span class="status st-${st.indexOf(p.status)}">${esc(p.status)}</span></summary>
    <div class="pbody">
      <div class="grid3">${lab('Título o idea', fld(S, P('title'), p.title))}${lab('Tema', fld(S, P('topic'), p.topic))}${lab('Proyecto o campaña', fld(S, P('project'), p.project ?? '', 'Lanzamiento, programa…'))}
        ${lab('Objetivo', fld(S, P('goal'), p.goal, 'Educar, inspirar, vender…'))}${lab('Plataforma', sel(S, P('platform'), p.platform, PLATFORMS))}${lab('Formato', sel(S, P('format'), p.format, FORMATS))}
        ${lab('Fecha de grabación', fld(S, P('rec'), p.rec, '', 'date', `min="${YEAR}-01-01" max="${YEAR}-12-31"`))}${lab('Fecha de edición', fld(S, P('edit'), p.edit, '', 'date', `min="${YEAR}-01-01" max="${YEAR}-12-31"`))}${lab('Estado de producción', sel(S, P('status'), p.status, st))}
        ${lab('Fecha de publicación', fld(S, P('pub'), p.pub, '', 'date', `min="${YEAR}-01-01" max="${YEAR}-12-31"`))}${lab('Hora de publicación', fld(S, P('pubTime'), p.pubTime, '', 'time', 'step="900"'))}${lab('Enlace a archivos', fld(S, P('link'), p.link, 'Drive, Canva…'))}</div>
      <div class="grid2">${lab('Guion o texto', ta(S, P('script'), p.script, '', 4))}${lab('Descripción', ta(S, P('desc'), p.desc, '', 4))}${lab('Llamado a la acción', fld(S, P('cta'), p.cta, 'Escríbeme, guarda, comparte…'))}${lab('Hashtags', fld(S, P('tags'), p.tags, '#psicologia #fe'))}</div>
      <div class="eyebrow" style="margin:10px 0 6px">Resultados · los anotas tú desde la app de cada red</div>
      <div class="mgrid4">${METRICS.map(([k, l]) => lab(l, `<input class="inp" type="number" min="0" inputmode="numeric" data-doc="studio" data-p="${P('metrics.' + k)}" data-t="money" value="${esc(p.metrics?.[k] ?? '')}">`)).join('')}</div>
      ${lab('Observaciones y aprendizajes', ta(S, P('notes'), p.notes))}
      <div class="quick">${gl ? `<a class="chip" target="_blank" rel="noopener" href="${gl}">↗ Añadir la publicación a Google Calendar</a>` : ''}<button class="rm" data-a="piece-del" data-id="${p.id}">Eliminar esta pieza</button></div>
    </div></details>`;
}
function viewStudio() {
    const s = studio();
    if (!settings().studioEnabled)
        return `<div class="soon"><h1>Mi Estudio Creativo</h1><p class="muted">Este módulo está oculto. Puedes activarlo en <a href="#ajustes">Ajustes</a> si creas contenido digital.</p></div>`;
    const list = studioFiltered(), projects = [...new Set(s.pieces.map(p => (p.project || '').trim()).filter(Boolean))];
    const tabs = [['cal', 'Calendario editorial'], ['flujo', 'Flujo de producción'], ['ideas', `Banco de ideas${s.ideas.length ? ' · ' + s.ideas.length : ''}`], ['resultados', 'Resultados'], ['estados', 'Mis estados']];
    const filters = `<div class="sfilters"><label>Plataforma <select class="inp" data-a="st-filter" data-k="plat">${['Todas', ...PLATFORMS].map(x => `<option ${stUi.plat === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label>Proyecto <select class="inp" data-a="st-filter" data-k="proj">${['Todos', ...projects].map(x => `<option ${stUi.proj === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
    <label>Estado <select class="inp" data-a="st-filter" data-k="state">${['Todos', ...s.states].map(x => `<option ${stUi.state === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label></div>`;
    let body = '';
    if (stUi.tab === 'cal') {
        const m = stUi.month, first = new Date(YEAR, m, 1), lead = (first.getDay() + 6) % 7;
        let cells = WD.map(w => `<div class="dh">${w}</div>`).join('') + '<div class="blank"></div>'.repeat(lead);
        for (let d = 1; d <= daysInMonth(m); d++) {
            const key = `${YEAR}-${pad(m + 1)}-${pad(d)}`;
            const ev = list.flatMap(p => STAGES.filter(([f]) => p[f] === key).map(([, l, c]) => `<span class="ev sc-${c} ${p.status === 'Publicado' ? 'done' : ''}">${l}: ${esc(p.title)}</span>`));
            cells += `<a href="#dia-${key}" class="${ev.length ? 'has' : ''}"><span class="d">${d}</span>${ev.slice(0, 3).join('')}${ev.length > 3 ? `<span class="small muted">+${ev.length - 3}</span>` : ''}</a>`;
        }
        const inMonth = list.filter(p => STAGES.some(([f]) => String(p[f]).slice(5, 7) === pad(m + 1)));
        const pend = inMonth.filter(p => p.status !== 'Publicado'), done = inMonth.filter(p => p.status === 'Publicado');
        body = `${filters}<div class="mstrip" style="margin:6px 0 12px">${MONTHS.map((x, i) => `<a href="#" class="${i === m ? 'on' : ''}" data-a="st-month" data-i="${i}">${x.n.slice(0, 3).toUpperCase()}</a>`).join('')}</div>
      <div class="legendday" style="margin-bottom:8px"><span><i class="sc-g"></i>Grabar</span><span><i class="sc-e"></i>Editar</span><span><i class="sc-p"></i>Publicar</span><span>Tocando un día abres su página: allí también aparecen.</span></div>
      <div class="cal">${cells}</div>
      <div class="kpis" style="grid-template-columns:repeat(3,1fr);margin-top:16px"><div class="kpi"><div class="k">Piezas en ${MONTHS[m].n.toLowerCase()}</div><div class="v">${inMonth.length}</div></div><div class="kpi"><div class="k">Pendientes</div><div class="v">${pend.length}</div></div><div class="kpi hl"><div class="k">Publicadas</div><div class="v">${done.length}</div></div></div>
      <h3 class="serif" style="font-weight:500;font-size:23px;margin:18px 0 8px">Piezas de ${MONTHS[m].n.toLowerCase()}</h3>${inMonth.length ? inMonth.map(pieceEditor).join('') : '<p class="small muted">No hay piezas con fechas en este mes.</p>'}`;
    }
    else if (stUi.tab === 'flujo') {
        body = `${filters}<div class="board">${s.states.map((st, i) => { const ps = list.filter(p => p.status === st); return `<div class="col"><div class="colh"><span class="status st-${i}">${esc(st)}</span><span class="small muted">${ps.length}</span></div>${ps.map(p => `<div class="kcard"><b>${esc(p.title) || 'Sin título'}</b><div class="small muted">${esc(p.platform)} · ${esc(p.format)}${p.pub ? ` · ${+p.pub.slice(8)}/${+p.pub.slice(5, 7)}` : ''}</div><div class="kmove">${i > 0 ? `<button data-a="piece-move" data-id="${p.id}" data-d="-1" aria-label="Estado anterior">←</button>` : '<span></span>'}<button data-a="piece-open" data-id="${p.id}">Abrir</button>${i < s.states.length - 1 ? `<button data-a="piece-move" data-id="${p.id}" data-d="1" aria-label="Siguiente estado">→</button>` : '<span></span>'}</div></div>`).join('')}</div>`; }).join('')}</div>
      <h3 class="serif" style="font-weight:500;font-size:23px;margin:20px 0 8px">Todas mis piezas</h3>${list.length ? list.map(pieceEditor).join('') : '<p class="small muted">Aún no hay piezas.</p>'}`;
    }
    else if (stUi.tab === 'ideas') {
        body = `<p class="small muted">Ideas sin fecha, referencias, temas, campañas y proyectos futuros. Cuando una esté lista, conviértela en pieza.</p>
      <div class="ideaadd"><input class="inp" id="ideaText" placeholder="Escribe una idea…"><button class="btn primary" data-a="idea-add">Guardar idea</button></div>
      ${s.ideas.map((x, i) => `<div class="idea"><span class="n">✿</span>${fld('studio', `ideas.${i}.text`, x.text)}<button class="chip" data-a="idea-piece" data-i="${i}">Convertir en pieza</button><button class="x" data-a="del" data-doc="studio" data-l="ideas" data-i="${i}" aria-label="Eliminar idea">×</button></div>`).join('') || '<p class="small muted">Tu banco de ideas está vacío.</p>'}`;
    }
    else if (stUi.tab === 'resultados') {
        const pub = s.pieces.filter(p => p.status === 'Publicado');
        const tot = (k) => pub.reduce((t, p) => t + (+(p.metrics?.[k] ?? 0) || 0), 0);
        const best = pub.slice().sort((a, b) => (+(b.metrics?.inter ?? 0)) - (+(a.metrics?.inter ?? 0))).filter(p => +(p.metrics?.inter ?? 0) > 0).slice(0, 5);
        const byPlat = PLATFORMS.map(pl => { const ps = pub.filter(p => p.platform === pl); return { pl, n: ps.length, inter: ps.reduce((t, p) => t + (+(p.metrics?.inter ?? 0) || 0), 0), reach: ps.reduce((t, p) => t + (+(p.metrics?.reach ?? 0) || 0), 0) }; }).filter(x => x.n);
        const nf = (n) => n.toLocaleString('es-CO');
        body = `<p class="small muted">Los números los anotas tú en cada pieza publicada, desde las estadísticas de cada red. BLOOM no se conecta a tus redes ni inventa cifras.</p>
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">${[['Piezas publicadas', nf(pub.length)], ...METRICS.slice(0, 3).map(([k, l]) => [l, nf(tot(k))]), ...METRICS.slice(3).map(([k, l]) => [l, nf(tot(k))])].map(([k, v], i) => `<div class="kpi ${i === 0 ? 'hl' : ''}"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>
      ${byPlat.length ? `<h3 class="serif" style="font-weight:500;font-size:23px;margin:18px 0 8px">Por plataforma</h3><table class="tbl"><thead><tr><th>Plataforma</th><th>Piezas</th><th>Alcance</th><th>Interacciones</th></tr></thead><tbody>${byPlat.map(x => `<tr><td>${x.pl}</td><td>${x.n}</td><td>${nf(x.reach)}</td><td>${nf(x.inter)}</td></tr>`).join('')}</tbody></table>` : ''}
      <h3 class="serif" style="font-weight:500;font-size:23px;margin:18px 0 8px">Lo que más conectó</h3>
      ${best.length ? best.map((p, i) => `<div class="pri"><span class="n">${i + 1}</span><div style="flex:1"><b style="font-weight:500">${esc(p.title)}</b><div class="small muted">${esc(p.platform)} · ${nf(+(p.metrics?.inter ?? 0))} interacciones${p.notes ? ' · ' + esc(p.notes.slice(0, 90)) : ''}</div></div></div>`).join('') : '<p class="small muted">Marca piezas como «Publicado» y anota sus interacciones para ver aquí lo que mejor funciona.</p>'}`;
    }
    else {
        body = `<p class="small muted">Cambia los nombres de tus estados o agrega los tuyos. Las piezas conservan su estado.</p>
      ${s.states.map((st, i) => `<div class="habit"><span class="num">${i + 1}</span>${fld('studio', `states.${i}`, st)}${s.states.length > 2 ? `<button class="x" data-a="state-del" data-i="${i}" aria-label="Quitar estado">×</button>` : ''}</div>`).join('')}
      <button class="add" data-a="state-add">+ Agregar estado</button> <button class="add" data-a="state-reset">Volver a los estados de BLOOM</button>`;
    }
    return `<header class="mhero two"><div><div class="eyebrow">Módulo opcional</div><h1 style="font-size:clamp(40px,6vw,64px)">Mi Estudio Creativo</h1><div class="theme">Planear, producir, publicar y aprender</div></div>
    <aside class="promise"><div class="ref">Colosenses 3:23</div><p>Todo lo que hagas, hazlo de corazón, como para el Señor.</p><div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div></aside></header>
  <section class="mod" style="margin-top:18px"><div class="mod-h"><h2>Nueva pieza de contenido</h2></div>
    <div class="grid3 newpiece">${lab('Título o idea', '<input class="inp" id="npTitle" placeholder="3 señales de ansiedad">')}${lab('Plataforma', `<select class="inp" id="npPlat">${PLATFORMS.map(x => `<option>${x}</option>`).join('')}</select>`)}${lab('Formato', `<select class="inp" id="npFmt">${FORMATS.map(x => `<option>${x}</option>`).join('')}</select>`)}
      ${lab('Grabar', `<input class="inp" type="date" id="npRec" min="${YEAR}-01-01" max="${YEAR}-12-31">`)}${lab('Editar', `<input class="inp" type="date" id="npEdit" min="${YEAR}-01-01" max="${YEAR}-12-31">`)}${lab('Publicar', `<input class="inp" type="date" id="npPub" min="${YEAR}-01-01" max="${YEAR}-12-31">`)}</div>
    <button class="btn primary" data-a="piece-add">Guardar pieza</button> <span class="small muted">Sin fechas queda como «Idea».</span></section>
  <nav class="ftabs" style="margin:18px 0 10px">${tabs.map(([k, t]) => `<button class="${stUi.tab === k ? 'on' : ''}" data-a="st-tab" data-k="${k}">${t}</button>`).join('')}</nav>
  <section class="mod">${body}</section>
  ${pager(['#inicio', 'Inicio'], null)}`;
}
const cycleDoc = () => store.getOr('cycle', () => ({ days: [], notes: {} }));
const shopDoc = () => store.getOr('shopping', () => ({ items: [] }));
const notesDoc = () => store.getOr('notes', () => ({ sheets: [] }));
const prayerDoc = () => store.getOr('prayers', () => ({ items: [] }));
const projDoc = () => store.getOr('projects', () => ({ items: [] }));
const parseKey = (k) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8));
const daysBetween = (a, b) => Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 864e5);
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
/* Mi ciclo */
const SYMPTOMS = ['Cólicos', 'Cansancio', 'Dolor de cabeza', 'Antojos', 'Ánimo bajo', 'Sensible', 'Con energía', 'Hinchazón'];
const cycleOn = () => settings().cycleEnabled !== false;
function cycleStats() {
    const days = [...new Set(cycleDoc().days)].sort(), starts = [], lens = [];
    let run = 0;
    days.forEach((d, i) => { if (i === 0 || daysBetween(days[i - 1], d) > 1) {
        if (run)
            lens.push(run);
        starts.push(d);
        run = 1;
    }
    else
        run++; });
    if (run)
        lens.push(run);
    const gaps = starts.slice(1).map((s, i) => daysBetween(starts[i], s)).filter(g => g >= 15 && g <= 60);
    const avgCycle = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;
    const avgLen = lens.length ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 0;
    const last = starts[starts.length - 1] ?? '';
    const cyc = avgCycle || 28, next = last ? addDays(last, cyc) : '';
    const irregular = gaps.length >= 2 && Math.max(...gaps) - Math.min(...gaps) > 9;
    return { days: new Set(days), starts, avgCycle, avgLen: avgLen || 5, next, estimatedFromDefault: !avgCycle, irregular };
}
function cycleHint(key) {
    if (!cycleOn())
        return '';
    const st = cycleStats();
    if (!st.next)
        return '';
    const left = daysBetween(key, st.next);
    if (st.days.has(key))
        return 'Estás en tus días.';
    return left >= 0 && left <= 5 ? (left === 0 ? 'Tu periodo podría llegar hoy.' : `Tu periodo podría llegar en unos ${left} ${left === 1 ? 'día' : 'días'}.`) : '';
}
function cycleCard(key) {
    if (!cycleOn())
        return '';
    const on = cycleDoc().days.includes(key), notes = cycleDoc().notes[key] || [], hint = cycleHint(key);
    return `<div class="card cyc-card"><h3>Mi ciclo <a class="small" href="#ciclo" style="margin-left:auto;font-family:var(--sans);font-size:12.5px">Ver mi ciclo</a></h3>
    ${hint ? `<p class="small" style="margin:-4px 0 8px;color:#9A6070">${hint}</p>` : ''}
    <label class="cyc-toggle ${on ? 'on' : ''}"><input type="checkbox" data-a="cyc-day" data-k="${key}" ${on ? 'checked' : ''}><span>${on ? 'Hoy tengo mi periodo' : 'Marcar: hoy tengo mi periodo'}</span></label>
    <div class="feel" style="margin-top:8px">${SYMPTOMS.map(s => `<button class="${notes.includes(s) ? 'on' : ''}" data-a="cyc-sym" data-k="${key}" data-v="${s}">${s}</button>`).join('')}</div></div>`;
}
let cycMonth = -1;
function viewCycle() {
    const st = cycleStats(), today = dkey(todayInYear());
    if (cycMonth < 0)
        cycMonth = todayInYear().getMonth();
    const m = cycMonth, first = new Date(YEAR, m, 1), lead = (first.getDay() + 6) % 7;
    const predicted = new Set();
    if (st.next)
        for (let i = 0; i < st.avgLen; i++)
            predicted.add(addDays(st.next, i));
    if (st.next)
        for (let k = 1; k <= 2; k++)
            for (let i = 0; i < st.avgLen; i++)
                predicted.add(addDays(st.next, i + k * (st.avgCycle || 28)));
    let cells = WD.map(w => `<div class="dh">${w}</div>`).join('') + '<div class="blank"></div>'.repeat(lead);
    for (let d = 1; d <= daysInMonth(m); d++) {
        const key = `${YEAR}-${pad(m + 1)}-${pad(d)}`, on = st.days.has(key), pr = !on && predicted.has(key), n = cycleDoc().notes[key]?.length;
        cells += `<button class="cday ${on ? 'on' : ''} ${pr ? 'pred' : ''} ${key === today ? 'today' : ''}" data-a="cyc-day" data-k="${key}" aria-pressed="${on}" aria-label="${d} de ${MONTHS[m].n}${on ? ', periodo' : pr ? ', periodo estimado' : ''}"><span>${d}</span>${on ? '<i>●</i>' : pr ? '<i>○</i>' : ''}${n ? '<em>✎</em>' : ''}</button>`;
    }
    const fmt = (k) => `${parseKey(k).getDate()} de ${MONTHS[parseKey(k).getMonth()].n.toLowerCase()}`;
    return `<header class="mhero two"><div><div class="eyebrow">Solo para ti</div><h1 style="font-size:clamp(40px,6vw,64px)">Mi ciclo</h1><div class="theme">Conocer tu cuerpo también es cuidarte</div></div>
    <aside class="promise"><div class="ref">Salmo 139:14</div><p>Te alabo porque soy una creación admirable; tus obras son maravillosas.</p><div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div></aside></header>
  <div class="kpis" style="grid-template-columns:repeat(3,1fr);margin-top:18px">
    <div class="kpi hl"><div class="k">Próximo periodo (estimado)</div><div class="v">${st.next ? fmt(st.next) : '—'}</div><div class="k" style="font-size:11px">${st.next ? (st.estimatedFromDefault ? 'con un ciclo de 28 días; se ajusta al marcar más meses' : `según tu promedio de ${st.avgCycle} días`) : 'marca los días de tu periodo'}</div></div>
    <div class="kpi"><div class="k">Duración de tu ciclo</div><div class="v">${st.avgCycle ? st.avgCycle + ' días' : '—'}</div><div class="k" style="font-size:11px">${st.starts.length} ${st.starts.length === 1 ? 'periodo registrado' : 'periodos registrados'}</div></div>
    <div class="kpi"><div class="k">Duración de tu periodo</div><div class="v">${st.starts.length ? st.avgLen + ' días' : '—'}</div><div class="k" style="font-size:11px">promedio</div></div></div>
  ${st.irregular ? '<div class="proto-note" style="margin-top:14px">Tus ciclos han variado bastante entre un mes y otro. Puede ser normal, pero vale la pena comentarlo con tu médica o tu ginecóloga.</div>' : ''}
  <section class="mod" style="margin-top:18px"><div class="mod-h"><h2>${MONTHS[m].n}</h2><span class="hint">Toca un día para marcarlo o desmarcarlo</span></div>
    <div class="mstrip" style="margin:0 0 12px">${MONTHS.map((x, i) => `<a href="#" class="${i === m ? 'on' : ''}" data-a="cyc-month" data-i="${i}">${x.n.slice(0, 3).toUpperCase()}</a>`).join('')}</div>
    <div class="ccal">${cells}</div>
    <div class="legendday"><span><i style="background:var(--rose-dust)"></i>Periodo</span><span><i style="background:#fff;border:2px dashed var(--rose-dust)"></i>Periodo estimado</span><span>✎ anotaste cómo te sentiste (en la página del día)</span></div></section>
  <div class="proto-note" style="margin-top:14px"><b>Importante:</b> las fechas estimadas son solo orientativas. <b>No sirven como método anticonceptivo</b> ni reemplazan la consulta médica. Esta información es privada: solo tú la ves. Puedes ocultar Mi ciclo en Ajustes.</div>
  ${pager(['#inicio', 'Inicio'], null)}`;
}
/* Lista de compras */
const SHOP_SECS = ['Mercado', 'Frutas y verduras', 'Aseo', 'Hogar', 'Colegio', 'Farmacia', 'Mascotas', 'Otros'];
function viewShopping() {
    const items = shopDoc().items, done = items.filter(x => x.done).length;
    return `<header class="mhero" style="grid-template-columns:1fr;border:none"><div><div class="eyebrow">Para no olvidar nada</div><h1 style="font-size:clamp(40px,6vw,64px)">Mi lista de compras</h1></div></header>
  <section class="mod"><div class="shopadd"><input class="inp" id="shopT" placeholder="¿Qué necesitas comprar?"><input class="inp" id="shopQ" placeholder="Cantidad" style="max-width:110px"><select class="inp" id="shopS">${SHOP_SECS.map(s => `<option>${s}</option>`).join('')}</select><button class="btn primary" data-a="shop-add">Agregar</button></div>
    <p class="small muted">${items.length ? `${done} de ${items.length} en el carrito` : 'Tu lista está vacía.'}</p>
    ${SHOP_SECS.map(sec => { const xs = items.filter(x => x.sec === sec); return xs.length ? `<h3 class="serif rgh">${sec}</h3>${xs.map(x => `<div class="todo ${x.done ? 'done' : ''}"><input type="checkbox" data-a="shop-tick" data-id="${x.id}" ${x.done ? 'checked' : ''} aria-label="En el carrito">${fld('shopping', `items.#${x.id}.t`, x.t)}<span class="small muted" style="white-space:nowrap">${esc(x.qty)}</span><button class="x" data-a="shop-del" data-id="${x.id}" aria-label="Quitar">×</button></div>`).join('')}` : ''; }).join('')}
    ${items.length ? `<div class="quick" style="margin-top:14px"><button class="chip" data-a="shop-reset">Desmarcar todo para la próxima compra</button><button class="chip" data-a="shop-clear">Borrar lo ya comprado</button><a class="chip" href="#dia-${dkey(todayInYear())}">Anotar el gasto en «Mis compras de hoy»</a></div>` : ''}</section>
  ${pager(['#inicio', 'Inicio'], null)}`;
}
/* Mis hojitas */
const PAPERS = [['rayada', 'Rayada'], ['cuadricula', 'Cuadriculada'], ['puntos', 'De puntos'], ['kraft', 'Kraft'], ['rosa', 'Rosada'], ['azul', 'Azul']];
const WASHIS = ['', 'washi-puntos', 'washi-rayas', 'washi-flores', 'washi-arena', 'washi-azul'];
function viewNotes() {
    const sheets = notesDoc().sheets;
    return `<header class="mhero" style="grid-template-columns:1fr;border:none"><div><div class="eyebrow">Espacio libre</div><h1 style="font-size:clamp(40px,6vw,64px)">Mis hojitas</h1><div class="theme">Ideas, recetas, frases, sueños… lo que quieras</div></div></header>
  <button class="btn primary" data-a="note-add">+ Agregar hojita</button> <span class="small muted">Con ✿ Decorar le pones stickers.</span>
  <div class="hojas">${sheets.map(s => `<article class="hoja p-${s.paper}" data-sheet="${s.id}">${s.washi ? `<div class="hoja-washi">${stickerById(s.washi)?.svg ?? ''}</div>` : ''}
      <input class="hoja-t" data-doc="notes" data-p="sheets.#${s.id}.title" value="${esc(s.title)}" placeholder="Título">
      <textarea class="hoja-x" rows="8" data-doc="notes" data-p="sheets.#${s.id}.text" placeholder="Escribe aquí…">${esc(s.text)}</textarea>
      <div class="hoja-tools"><select data-a="note-paper" data-id="${s.id}" aria-label="Papel">${PAPERS.map(([k, n]) => `<option value="${k}" ${s.paper === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <select data-a="note-washi" data-id="${s.id}" aria-label="Washi tape">${WASHIS.map(w => `<option value="${w}" ${s.washi === w ? 'selected' : ''}>${w ? 'Washi ' + w.slice(6) : 'Sin washi'}</option>`).join('')}</select>
        <button class="x" data-a="note-del" data-id="${s.id}" aria-label="Eliminar hojita">×</button></div></article>`).join('')}</div>
  ${sheets.length ? '' : '<p class="muted" style="margin-top:14px">Aún no tienes hojitas. Toca «Agregar hojita».</p>'}
  ${pager(['#inicio', 'Inicio'], null)}`;
}
/* Peticiones de oración */
let prayTab = 'orando';
function viewPrayers() {
    const items = prayerDoc().items, open = items.filter(x => !x.answered), ans = items.filter(x => x.answered);
    const list = prayTab === 'orando' ? open : ans;
    return `<header class="mhero two"><div><div class="eyebrow">Mi vida de oración</div><h1 style="font-size:clamp(40px,6vw,64px)">Mis peticiones de oración</h1></div>
    <aside class="promise"><div class="ref">Filipenses 4:6</div><p>No se inquieten por nada; más bien, en toda ocasión, presenten sus peticiones a Dios con oración y gratitud.</p><div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div></aside></header>
  <section class="mod" style="margin-top:18px"><div class="grid3 newpray">${lab('¿Por quién o por qué oro?', '<input class="inp" id="prWho" placeholder="Mi hija, mi salud, mi negocio…">')}${lab('Mi petición', '<input class="inp" id="prReq" placeholder="Escribe tu petición">')}<div style="align-self:end"><button class="btn primary" data-a="pray-add">Guardar petición</button></div></div></section>
  <nav class="ftabs" style="margin:16px 0 10px"><button class="${prayTab === 'orando' ? 'on' : ''}" data-a="pray-tab" data-k="orando">Estoy orando · ${open.length}</button><button class="${prayTab === 'respondidas' ? 'on' : ''}" data-a="pray-tab" data-k="respondidas">Dios respondió · ${ans.length}</button></nav>
  <section class="mod">${list.length ? list.map(x => `<div class="prayer ${x.answered ? 'ans' : ''}">
      <div class="pr-h"><b>${esc(x.who) || 'Petición'}</b><span class="small muted">desde el ${parseKey(x.date).getDate()} de ${MONTHS[parseKey(x.date).getMonth()].n.toLowerCase()}${x.answered && x.adate ? ` · respondida el ${parseKey(x.adate).getDate()} de ${MONTHS[parseKey(x.adate).getMonth()].n.toLowerCase()}` : ''}</span></div>
      ${ta('prayers', `items.#${x.id}.req`, x.req, 'Mi petición', 2)}
      ${x.answered ? lab('¿Cómo respondió Dios?', ta('prayers', `items.#${x.id}.answer`, x.answer, 'Escribe tu testimonio', 2)) : ''}
      <div class="quick">${x.answered ? `<button class="chip" data-a="pray-toggle" data-id="${x.id}">Volver a «Estoy orando»</button>` : `<button class="chip on" data-a="pray-toggle" data-id="${x.id}">✿ ¡Dios respondió!</button>`}<button class="rm" data-a="pray-del" data-id="${x.id}">Eliminar</button></div></div>`).join('')
        : `<p class="muted">${prayTab === 'orando' ? 'Escribe arriba por quién o por qué estás orando.' : 'Cuando Dios responda una petición, márcala y quedará aquí como testimonio.'}</p>`}</section>
  ${pager(['#inicio', 'Inicio'], null)}`;
}
/* Proyectos */
const STAGES_P = ['Por iniciar', 'En marcha', 'En pausa', 'Terminado'];
const PROJ_AREAS = ['Personal', 'Familia', 'Hogar', 'Profesión', 'Negocio', 'Ministerio', 'Estudio', 'Sueños'];
function viewProjects() {
    const items = projDoc().items;
    return `<header class="mhero" style="grid-template-columns:1fr;border:none"><div><div class="eyebrow">Paso a paso</div><h1 style="font-size:clamp(40px,6vw,64px)">Mis proyectos</h1><div class="theme">Sin complicaciones: un nombre, una fecha y los pasos</div></div></header>
  <button class="btn primary" data-a="proj-add">+ Nuevo proyecto</button>
  ${items.map(p => {
        const done = p.tasks.filter(t => t.done).length, pct = p.tasks.length ? Math.round(done / p.tasks.length * 100) : 0, P = `items.#${p.id}`;
        return `<section class="mod" style="margin-top:16px" data-proj="${p.id}"><span class="washi w-${['rose', 'blue', 'sand'][items.indexOf(p) % 3]}"></span>
      <div class="grid3">${lab('Nombre del proyecto', fld('projects', P + '.name', p.name, 'Mi libro, mi programa, remodelar la cocina…'))}${lab('Área', sel('projects', P + '.area', p.area, PROJ_AREAS))}${lab('Estado', sel('projects', P + '.stage', p.stage, STAGES_P))}${lab('Fecha límite', fld('projects', P + '.due', p.due, '', 'date', `min="${YEAR}-01-01" max="${YEAR}-12-31"`))}</div>
      ${lab('¿De qué se trata?', ta('projects', P + '.desc', p.desc))}
      <div style="display:flex;align-items:center;gap:10px;margin:6px 0"><div class="pbar navy" style="flex:1;height:8px"><i style="width:${pct}%"></i></div><span class="small">${done} de ${p.tasks.length} pasos · ${pct}%</span></div>
      ${p.tasks.map((t, i) => `<div class="todo ${t.done ? 'done' : ''}">${chk('projects', `${P}.tasks.${i}.done`, t.done, 'Hecho')}${fld('projects', `${P}.tasks.${i}.t`, t.t, 'Paso')}<input class="inp" type="date" style="max-width:150px" data-doc="projects" data-p="${P}.tasks.${i}.date" value="${esc(t.date)}" aria-label="Fecha del paso"><button class="x" data-a="del" data-doc="projects" data-l="${P}.tasks" data-i="${i}" aria-label="Quitar paso">×</button></div>`).join('')}
      <button class="add" data-a="add" data-doc="projects" data-l="${P}.tasks" data-tpl="ptask">+ Agregar paso</button> <button class="rm" data-a="proj-del" data-id="${p.id}">Eliminar proyecto</button></section>`;
    }).join('')}
  ${items.length ? '<p class="small muted" style="margin-top:12px">Los pasos con fecha aparecen en la página de ese día, en tu semana y en los recordatorios.</p>' : '<p class="muted" style="margin-top:14px">Aún no tienes proyectos.</p>'}
  ${pager(['#inicio', 'Inicio'], null)}`;
}
function projectTasksOn(key) {
    const d = store.get('projects');
    if (!d)
        return [];
    return d.items.flatMap(p => [...p.tasks.filter(t => t.date === key && t.t.trim() && !t.done).map(t => ({ t: `${t.t} (${p.name || 'proyecto'})`, k: 'Proyecto' })), ...(p.due === key && p.name && p.stage !== 'Terminado' ? [{ t: `Fecha límite: ${p.name}`, k: 'Proyecto' }] : [])]);
}
/* Mi lectura del año */
function viewReading() {
    const rows = MONTHS.map((mo, m) => ({ m, mo, r: store.get(monthId(m))?.reading })).filter(x => x.r && (x.r.book.trim() || x.r.quote.trim()));
    const pages = rows.reduce((t, x) => t + (+(x.r.read || 0)), 0), finished = rows.filter(x => +x.r.total && +(x.r.read || 0) >= +x.r.total).length;
    return `<header class="mhero two"><div><div class="eyebrow">Mi año de lectura</div><h1 style="font-size:clamp(40px,6vw,64px)">Mi lectura</h1><div class="theme">Los libros que me hicieron florecer</div></div>
    <aside class="promise"><div class="ref">Proverbios 1:5</div><p>La persona sabia escucha y aumenta su saber.</p><div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div></aside></header>
  <div class="kpis" style="grid-template-columns:repeat(3,1fr);margin-top:18px"><div class="kpi"><div class="k">Libros del año</div><div class="v">${rows.filter(x => x.r.book.trim()).length}</div></div><div class="kpi"><div class="k">Libros terminados</div><div class="v">${finished}</div></div><div class="kpi hl"><div class="k">Páginas leídas</div><div class="v">${pages.toLocaleString('es-CO')}</div></div></div>
  <section class="mod" style="margin-top:18px"><div class="mod-h"><h2>Mes a mes</h2></div>
    ${rows.length ? rows.map(x => { const r = x.r, pct = +r.total ? Math.min(100, Math.round((+(r.read || 0)) / +r.total * 100)) : 0; return `<div class="rbook"><a href="#mes-${x.m + 1}" class="small">${x.mo.n}</a><div><b>${esc(r.book) || 'Sin título'}</b>${+r.total ? `<div class="pbar" style="height:6px;margin:6px 0"><i style="width:${pct}%"></i></div><span class="small muted">${pct}% · ${r.read || 0} de ${r.total} páginas</span>` : ''}${r.quote.trim() ? `<blockquote class="bq">«${esc(r.quote)}»</blockquote>` : ''}</div></div>`; }).join('')
        : '<p class="muted">Escribe tu libro de cada mes en Planeando mi mes (módulo H) y aquí se reúnen todos, con tus frases favoritas.</p>'}</section>
  ${pager(['#inicio', 'Inicio'], null)}`;
}
const prepDoc = () => docOf('prep');
function prepBanner() {
    const n = new Date();
    if (n.getFullYear() >= YEAR)
        return '';
    const done = store.get('prep')?.done.filter(Boolean).length ?? 0;
    const dec = n.getMonth() === 11 ? n.getDate() : 0;
    return `<a class="prepbanner" href="#preparar${dec ? '-' + dec : ''}"><span class="pb-ic">${ART.sprig ? ART.sprig() : ''}</span><span><span class="eyebrow">Diciembre 2026 · Antes de empezar</span><b>31 días para florecer</b><span class="small">${dec ? `Hoy es el día ${dec}` : 'Prepara tu corazón y tu año, un día a la vez'}${done ? ` · llevas ${done} de 31` : ''}</span></span><span class="pb-go">→</span></a>`;
}
function viewPrepare(d) {
    const doc = prepDoc();
    if (!d) {
        const done = doc.done.filter(Boolean).length;
        let i = 0;
        return `<header class="mhero two"><div><div class="eyebrow">Diciembre 2026 · Regalo antes de empezar</div><h1 style="font-size:clamp(40px,6vw,64px)">31 días para florecer</h1><div class="theme">Un día a la vez: agradecer, soltar, soñar y preparar tu 2027 con Dios</div></div>
      <aside class="promise"><div class="ref">${CENTRAL.ref} · NVI</div><p>${CENTRAL.text}</p></aside></header>
    <div style="display:flex;align-items:center;gap:10px;margin:18px 0"><div class="pbar navy" style="flex:1;height:8px"><i style="width:${Math.round(done / 31 * 100)}%"></i></div><span class="small">${done} de 31 días</span></div>
    ${PREP_WEEKS.map(w => `<section class="mod" style="margin-top:16px"><div class="mod-h"><h2>${w.n}</h2><span class="hint">${w.sub}</span></div><div class="prepgrid">${w.days.map(x => { const k = ++i; return `<a class="prepday ${doc.done[k - 1] ? 'done' : ''}" href="#preparar-${k}"><span class="n">${k}</span><span>${esc(x.t)}</span>${doc.done[k - 1] ? '<i>✓</i>' : ''}</a>`; }).join('')}</div></section>`).join('')}
    <p class="small muted" style="margin-top:14px">Empieza cuando quieras: no importa si te saltas días. Lo que escribas queda guardado en tu agenda.</p>
    ${pager(['#inicio', 'Inicio'], ['#preparar-1', 'Día 1'])}`;
    }
    const x = PREP_DAYS[d - 1], wk = PREP_WEEKS.find(w => w.days.includes(x)), lit = x.ref === CENTRAL.ref;
    return `<header class="mhero two"><div><div class="eyebrow">31 días para florecer · ${wk.n}</div><h1 style="font-size:clamp(36px,5.5vw,58px)"><span class="dnum">Día ${d}</span> ${esc(x.t)}</h1><div class="theme">${d} de diciembre de 2026</div></div>
    <aside class="promise"><div class="ref">${x.ref}${lit ? ' · NVI' : ''}</div><p>${lit ? CENTRAL.text : x.p}</p>${lit ? '' : '<div class="tag">Paráfrasis Bloom · lee el texto completo en tu Biblia</div>'}</aside></header>
  <section class="mod" style="margin-top:18px"><div class="mod-h"><h2>Para escribir</h2></div>
    <p class="serif" style="font-size:22px;color:var(--navy);margin:0 0 10px">${esc(x.q)}</p>
    ${ta('prep', `notes.${d - 1}`, doc.notes[d - 1] || '', 'Escribe aquí con calma…', 7)}
    <div class="proto-note" style="margin-top:12px"><b>Un paso pequeño:</b> ${esc(x.a)}${x.link ? ` <a href="${x.link[0]}">${x.link[1]} →</a>` : ''}</div>
    <label class="cyc-toggle ${doc.done[d - 1] ? 'on' : ''}" style="margin-top:12px"><input type="checkbox" data-doc="prep" data-p="done.${d - 1}" data-t="b" ${doc.done[d - 1] ? 'checked' : ''}><span>${doc.done[d - 1] ? '¡Día completado! 🌸' : 'Marcar este día como completado'}</span></label></section>
  ${pager(d > 1 ? [`#preparar-${d - 1}`, `Día ${d - 1}`] : ['#preparar', 'Los 31 días'], d < 31 ? [`#preparar-${d + 1}`, `Día ${d + 1}`] : ['#mes-1', 'Enero 2027'])}`;
}
/* ===================== Mi cuenta y la nube (fase 8) ===================== */
let cloudTimer = 0, pendingRender = false;
function cloudSoon() { if (!C.user())
    return; clearTimeout(cloudTimer); cloudTimer = window.setTimeout(() => C.sync(store), 6000); }
/** Al entrar: decide qué pasa con lo que ya había en este dispositivo y trae la agenda de la nube. */
async function cloudStart(justSignedIn) {
    if (C.ownerMismatch()) {
        const ok = confirm('Este dispositivo tiene la agenda de otra cuenta de Google. Para proteger su privacidad, se borrará de aquí (si la sincronizó, sigue en su propio Drive) y se cargará la tuya. ¿Continuar?');
        if (!ok) {
            await C.signOut(store, false);
            render(true);
            return;
        }
        await store.clearLocal();
    }
    C.claimDevice();
    await C.sync(store);
    if (justSignedIn) {
        render(true);
        toast(store.hasContent() ? `¡Hola${C.user().name ? ', ' + C.user().name.split(' ')[0] : ''}! Tu agenda ya está en tu Google Drive.` : '¡Bienvenida! Tu agenda se guardará en tu Google Drive.');
    }
}
/** Llegaron cambios de otro dispositivo: se muestran sin interrumpir si estás escribiendo. */
function cloudRemote(ids) {
    updateBell();
    if (ids.includes('settings')) {
        applyTheme();
        renderFrame(route());
        buildMore();
    }
    const a = document.activeElement;
    if (a && a.closest('#view') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) {
        // Estás escribiendo: se actualizan los demás campos sin tocar el que tienes abierto.
        document.querySelectorAll('#view [data-doc][data-p]').forEach(el => {
            if (el === a || el.dataset.t === 'money' || !ids.includes(el.dataset.doc))
                return;
            const v = getAt(store.get(el.dataset.doc), el.dataset.p);
            if (el.type === 'checkbox')
                el.checked = !!v;
            else if (v !== undefined && el.value !== String(v ?? ''))
                el.value = String(v ?? '');
        });
        refreshComputed();
        pendingRender = true;
        return;
    }
    render(true);
}
document.addEventListener('focusout', () => { if (pendingRender)
    setTimeout(() => { const a = document.activeElement; if (!(a && a.closest('#view') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) {
        pendingRender = false;
        render(true);
    } }, 50); });
function cloudStatusText() {
    const st = C.getState(), t = C.lastSyncAt();
    const when = t ? ' · ' + new Date(t).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '';
    return st === 'needs-tap' ? 'Para seguir guardando en tu Drive, toca «Sincronizar ahora» (Google pide confirmarlo cada vez que abres BLOOM).' : st === 'syncing' ? 'Sincronizando…' : st === 'synced' ? `✓ Tu agenda está al día en todos tus dispositivos${when}` : st === 'offline' ? 'Sin internet: lo que escribas se guarda aquí y se envía solo cuando vuelva la conexión.' : st === 'error' ? 'No pude conectar con la nube. Tu agenda está guardada en este dispositivo; lo intento de nuevo en un momento.' : '';
}
function accountSettings() {
    if (!C.available())
        return `<section class="mod"><div class="mod-h"><h2>Mi cuenta</h2></div>
    <p class="small">Muy pronto podrás entrar con tu cuenta de Google y tener tu agenda en el celular, la tablet y el computador al mismo tiempo.</p>
    <p class="small muted">Mientras tanto, tu agenda se guarda en este dispositivo. Descarga tu copia de vez en cuando.</p></section>`;
    const u = C.user();
    if (!u)
        return `<section class="mod"><div class="mod-h"><h2>Mi cuenta</h2></div>
    <p class="small">Entra con tu cuenta de Google y tu agenda se guardará en <b>tu propio Google Drive</b>: la verás igual en tu celular, tu tablet y tu computador, y si cambias o pierdes el celular no pierdes nada.</p>
    <div class="quick"><button class="btn primary gbtn" data-a="c-in"><span class="g">G</span> Entrar con Google</button></div>
    <p class="small muted">BLOOM la guarda en una carpeta privada de tu Drive que no se mezcla con tus archivos. Psicóloga Marha no guarda ni puede ver nada de lo que escribes: tu agenda solo está en tus dispositivos y en tu Drive. <a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a>.</p></section>`;
    return `<section class="mod"><div class="mod-h"><h2>Mi cuenta</h2></div>
    <p class="small">Entraste como <b>${esc(u.name || u.email)}</b>${u.name ? ` · ${esc(u.email)}` : ''}</p>
    <p class="small" id="cloudstatus">${cloudStatusText()}</p>
    <div class="quick"><button class="btn primary" data-a="c-sync">Sincronizar ahora</button><button class="btn" data-a="c-out">Cerrar sesión</button></div>
    <p class="small muted">Tu agenda se guarda en tu propio Google Drive. Para usarla en otro dispositivo, abre bloom.psicologamarha.com y entra con esta misma cuenta de Google.</p>
    <details class="danger"><summary class="small">Borrar mi agenda</summary>
      <p class="small">Se borra para siempre tu agenda de tu Google Drive y de este dispositivo. Antes, si quieres, descarga tu copia.</p>
      ${lab('Para confirmar, escribe ELIMINAR', '<input class="inp" id="delConfirm" autocomplete="off">')}
      <button class="rm" data-a="c-delete">Borrar mi agenda para siempre</button></details></section>`;
}
function cloudBanner() {
    if (!C.available() || C.user())
        return '';
    return `<div class="proto-note cloudnote" style="margin:0 0 18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:220px"><b>Guarda tu agenda en tu Google Drive.</b> Entra con Google y tenla en el celular, la tablet y el computador.</span><button class="btn primary gbtn" data-a="c-in"><span class="g">G</span> Entrar con Google</button></div>`;
}
const G_SEND = [['horas', 'Mis horas del día (citas, reuniones, consultas…)'], ['familia', 'Fechas de familia y de trabajo'], ['pagos', 'Pagos y facturas'], ['metas', 'Fechas de mis metas'], ['proyectos', 'Pasos de mis proyectos'], ['estudio', 'Grabaciones y publicaciones de Mi Estudio']];
const gset = () => { const s = settings(); if (!s.google)
    s.google = { read: false, send: { horas: true, familia: true, pagos: true, metas: true, proyectos: true, estudio: true } }; return s.google; };
const gOn = () => !!settings().googleConnected && G.available();
const G_COLOR = { Cita: '4', Consulta: '4', Reunión: '9', Trabajo: '9', Personal: '3', Familia: '5', Compromiso: '11', Proyecto: '7', 'Mi Estudio': '1' };
const shortHash = (t) => { let h = 5381; for (const c of t)
    h = (h * 33 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
function gCategory(e) {
    if (e.h !== undefined)
        return 'horas';
    if (e.k === 'Familia' || e.k === 'Trabajo')
        return 'familia';
    if (e.k === 'Compromiso')
        return e.t.startsWith('Pagar:') ? 'pagos' : 'metas';
    if (e.k === 'Proyecto')
        return 'proyectos';
    return 'estudio';
}
/** Todo lo que la agenda tiene con fecha y que ella eligió enviar a Google. Mi ciclo y el dinero nunca se envían. */
function gWanted() {
    const send = gset().send, out = [];
    for (let m = 0; m < 12; m++)
        for (let d = 1; d <= daysInMonth(m); d++) {
            const key = `${YEAR}-${pad(m + 1)}-${pad(d)}`;
            eventsOn(key).forEach(e => {
                const cat = gCategory(e);
                if (!send[cat])
                    return;
                const t = e.t.trim().slice(0, 200);
                out.push(e.h !== undefined
                    ? { key: `h:${key}:${e.h}`, summary: t, date: key, hour: e.h, colorId: G_COLOR[e.k] }
                    : { key: `d:${key}:${shortHash(e.k + '|' + t)}`, summary: `${e.k === 'Compromiso' ? '' : e.k + ' · '}${t}`, date: key, colorId: G_COLOR[e.k] });
            });
        }
    return out;
}
const G_ERR = { 'sin-proyecto': 'La conexión con Google se activa cuando publiquemos BLOOM.', 'sin-internet': 'Parece que no hay internet. Intenta de nuevo en un momento.', cancelado: 'Se cerró la ventana de Google; no se cambió nada.', 'sin-permiso': 'Para sincronizar, BLOOM necesita permiso para crear su propio calendario. Intenta de nuevo y marca la casilla.', 'sin-sesion': 'Toca «Sincronizar ahora» para volver a conectar con Google.', popup_failed_to_open: 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes para BLOOM.' };
const gMsg = (e) => G_ERR[e.message] || 'Google no respondió. Tus datos están a salvo en BLOOM; intenta más tarde.';
let gBusy = false, gTimer = 0, gProgress = '';
async function gSync(quiet = false) {
    if (gBusy || !gOn())
        return;
    gBusy = true;
    gUpdate();
    try {
        if (!G.hasToken())
            await G.connect(gset().read, true);
        const g = gset();
        g.calId = await G.ensureCalendar(g.calId);
        const r = await G.syncAll(g.calId, gWanted(), (d, t) => { gProgress = t ? `${d} de ${t}` : ''; gUpdate(); });
        g.lastSync = Date.now();
        g.last = r.created + r.updated + r.removed ? `${r.created} nuevas, ${r.updated} cambiadas, ${r.removed} quitadas` : 'todo estaba al día';
        store.touch('settings');
        if (!quiet)
            toast(`Google Calendar al día: ${g.last}.`);
    }
    catch (e) {
        if (!quiet)
            toast(gMsg(e));
        else if (e.message !== 'sin-sesion')
            console.warn(e);
    }
    finally {
        gBusy = false;
        gProgress = '';
        gUpdate();
    }
}
/** Después de cada cambio, si la sesión con Google está abierta, sincroniza sola. */
function gSchedule() { if (!gOn() || !G.hasToken())
    return; clearTimeout(gTimer); gTimer = window.setTimeout(() => gSync(true), 5000); }
function gUpdate() { const el = document.getElementById('gstatus'); if (el)
    el.innerHTML = gStatusText(); const b = document.querySelector('[data-a="g-sync"]'); if (b)
    b.disabled = gBusy; }
function gStatusText() {
    const g = gset();
    if (gBusy)
        return `Sincronizando con Google… ${gProgress}`;
    const when = g.lastSync ? new Date(g.lastSync).toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) : '';
    return `${G.hasToken() ? '<b>Conectada</b>' : 'Conectada (toca «Sincronizar ahora» al abrir BLOOM)'}${when ? ` · última vez: ${when} · ${esc(g.last || '')}` : ''}`;
}
function googleSettings() {
    const g = gset();
    const what = `<div class="small muted" style="margin:10px 0 4px">¿Qué quieres ver en Google Calendar?</div><div class="checks">${G_SEND.map(([k, n]) => `<label><input type="checkbox" data-a="g-send" data-k="${k}" ${g.send[k] ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>`;
    const privacy = '<p class="small muted" style="margin-top:10px">BLOOM crea su propio calendario, «BLOOM 2027», y solo escribe ahí: nunca cambia ni borra tus otros calendarios. Mi ciclo, tus oraciones, tus hojitas y tu dinero nunca se envían a Google.</p>';
    if (!G.available())
        return `<section class="mod"><div class="mod-h"><h2>Google Calendar</h2></div>
    <p class="small">Muy pronto: tus citas de BLOOM aparecerán solas en un calendario «BLOOM 2027» de tu Google Calendar, y podrás ver tus citas de Google dentro de BLOOM.</p>
    <p class="small muted">Se activa cuando publiquemos BLOOM en su dirección propia. Mientras tanto, en cada hora del día está el botón ↗ para guardar esa cita en Google Calendar.</p>${privacy}</section>`;
    if (!gOn())
        return `<section class="mod"><div class="mod-h"><h2>Google Calendar</h2></div>
    <p class="small">Conecta tu cuenta de Google y lo que anotes en BLOOM aparecerá solo en tu Google Calendar, en un calendario aparte llamado «BLOOM 2027».</p>
    ${what}
    <label class="checks" style="display:block;margin-top:8px"><label><input type="checkbox" id="gReadOpt" ${g.read ? 'checked' : ''}><span>Ver también mis citas de Google dentro de BLOOM (solo para leerlas)</span></label></label>
    <div class="quick"><button class="btn primary" data-a="g-connect">Conectar con Google Calendar</button></div>${privacy}
    <p class="small muted">Google te mostrará una ventana para dar permiso. Puedes desconectar cuando quieras.</p></section>`;
    return `<section class="mod"><div class="mod-h"><h2>Google Calendar</h2></div>
    <p class="small" id="gstatus">${gStatusText()}</p>
    <div class="quick"><button class="btn primary" data-a="g-sync" ${gBusy ? 'disabled' : ''}>Sincronizar ahora</button></div>
    ${what}
    <label class="checks" style="display:block;margin-top:8px"><label><input type="checkbox" data-a="g-read" ${g.read ? 'checked' : ''}><span>Ver también mis citas de Google dentro de BLOOM (en la página de cada día)</span></label></label>
    ${privacy}
    <p class="small muted">Si cambias una cita del calendario «BLOOM 2027» desde Google, BLOOM la vuelve a dejar como está en tu agenda: los cambios se hacen aquí.</p>
    <div class="quick"><button class="rm" data-a="g-off">Desconectar Google</button></div></section>`;
}
/* Mis citas de Google en la página del día (solo lectura) */
const gCache = new Map();
function gMonthKey(key) { return key.slice(0, 7); }
function gLoadMonth(mk) {
    if (gCache.has(mk) || !G.canRead())
        return;
    gCache.set(mk, 'loading');
    const [y, mo] = mk.split('-').map(Number), next = mo === 12 ? `${y + 1}-01-01` : `${y}-${pad(mo + 1)}-01`;
    G.readRange(`${mk}-01`, next).then(items => { gCache.set(mk, items); }).catch(() => gCache.set(mk, 'error')).finally(() => {
        const el = document.getElementById('gday');
        if (el)
            el.outerHTML = googleDayCard(el.dataset.k);
    });
}
function googleDayCard(key) {
    if (!gOn() || !gset().read)
        return '';
    const head = '<h3>Mis citas de Google <span class="small muted" style="margin-left:auto;font-family:var(--sans);font-size:12px">solo lectura</span></h3>';
    if (!G.canRead())
        return `<div class="card" id="gday" data-k="${key}">${head}<p class="small muted">Para verlas, conecta tu sesión de Google.</p><button class="chip" data-a="g-sync">Ver mis citas de Google</button></div>`;
    const mk = gMonthKey(key);
    gLoadMonth(mk);
    const c = gCache.get(mk);
    if (c === 'loading' || !c)
        return `<div class="card" id="gday" data-k="${key}">${head}<p class="small muted">Buscando tus citas…</p></div>`;
    if (c === 'error')
        return `<div class="card" id="gday" data-k="${key}">${head}<p class="small muted">No pude traer tus citas de Google en este momento.</p></div>`;
    const items = c.filter(x => x.date === key);
    return `<div class="card" id="gday" data-k="${key}">${head}${items.length ? items.map(x => `<div class="todo"><span class="status">${x.allDay ? 'Todo el día' : `${x.start}–${x.end}`}</span><span>${esc(x.title)}</span></div>`).join('') : '<p class="small muted">Hoy no tienes citas en Google.</p>'}</div>`;
}
function viewSoon(s) {
    const [t, ph, desc] = SOON[s];
    return `<div class="soon"><div style="width:70px;margin:0 auto">${ART.butterfly()}</div><span class="pill">Se construye en la ${ph}</span><h1>${t}</h1><p class="muted">${desc}</p>
  <div class="proto-note" style="text-align:left"><b>¿Por qué está vacía esta página?</b> BLOOM se construye por partes. Esta sección sí estará en tu agenda y llega en la ${ph}. El separador ya está aquí para que veas cómo será la navegación completa.</div>
  <div class="quick" style="justify-content:center"><a class="chip" href="#inicio">Volver a la portada</a><a class="chip" href="#mi-anio">Ir a Mi año</a></div></div>`;
}
function viewSettings() {
    const s = settings();
    return `<header class="mhero" style="grid-template-columns:1fr;border:none"><div><div class="eyebrow">Ajustes</div><h1 style="font-size:clamp(40px,6vw,64px)">Mi BLOOM</h1></div></header>
  <div class="mods settings" style="grid-template-columns:1fr">
  ${accountSettings()}
  <section class="mod"><div class="mod-h"><h2>Personalizar</h2></div>
    ${lab('¿Cómo te llamas? (aparece en la bienvenida)', fld('settings', 'name', s.name, 'Tu nombre'))}
    <label class="checks" style="display:block"><label><input type="checkbox" data-doc="settings" data-p="studioEnabled" data-t="b" ${s.studioEnabled ? 'checked' : ''}><span>Mostrar Mi Estudio Creativo (para quienes crean contenido digital)</span></label><label><input type="checkbox" data-doc="settings" data-p="cycleEnabled" data-t="b" ${s.cycleEnabled !== false ? 'checked' : ''}><span>Mostrar Mi ciclo</span></label></label>
  </section>
  <section class="mod"><div class="mod-h"><h2>Colores de mi agenda</h2></div>
    <div class="themes">${THEMES.map(([id, n, cs]) => `<button class="themeopt ${(s.theme || 'original') === id ? 'on' : ''}" data-a="theme" data-v="${id}"><span class="sw">${cs.map(c => `<i style="background:${c}"></i>`).join('')}</span>${n}</button>`).join('')}</div>
    <p class="small muted">El logo y el azul de Psicóloga Marha se mantienen; cambian los acentos, los separadores y los fondos.</p></section>
  ${googleSettings()}
  <section class="mod"><div class="mod-h"><h2>Mi copia de seguridad</h2></div>
    <p class="small muted">Tu agenda se guarda sola en este dispositivo. Descarga una copia de vez en cuando y guárdala en tu Drive o tu correo: con ella recuperas todo en otro celular o computador.</p>
    <div class="quick"><button class="btn primary" data-a="backup">Descargar mi copia</button><label class="btn">Restaurar desde una copia<input id="restore" type="file" accept=".json,application/json" hidden></label></div>
  </section>
  <section class="mod"><div class="mod-h"><h2>Empezar de cero</h2></div>
    <p class="small muted">Borra todo lo que has escrito en BLOOM en este dispositivo, por ejemplo después de probarla, para empezar tu año limpia. Si entraste con Google, también se borra la copia de tu Drive. No se puede deshacer: si quieres, descarga antes tu copia.</p>
    <details class="danger"><summary class="small">Borrar todo y empezar de cero</summary>
      ${lab('Para confirmar, escribe BORRAR', '<input class="inp" id="resetConfirm" autocomplete="off">')}
      <button class="rm" data-a="reset-all">Borrar todo lo que escribí</button></details></section>
  <section class="mod"><div class="mod-h"><h2>Créditos</h2></div>
    <p class="small">BLOOM 2027 es un regalo de Psicóloga Marha · www.psicologamarha.com · @psicologamarha</p>
    <p class="small muted">${NVI_NOTICE}</p>
    <p class="small muted">Las citas marcadas como «Paráfrasis Bloom» son resúmenes propios de la agenda, no texto bíblico literal.</p>
  </section>
  <section class="mod" id="install-box"><div class="mod-h"><h2>Instalar BLOOM</h2></div>
    <p class="small muted" id="install-text">En Android y computador: usa el botón de abajo o el menú del navegador, «Instalar aplicación». En iPhone o iPad: abre BLOOM en Safari, toca Compartir y luego «Agregar a inicio».</p>
    <button class="btn primary" data-a="install" id="install" hidden>Instalar BLOOM en este dispositivo</button>
  </section></div>`;
}
/* ---------- Tapa de la agenda ---------- */
function viewTapa() {
    const name = settings().name;
    return `<div class="tapa-book" id="tapaBook">
    <div class="tapa-scatter" aria-hidden="true">${[[8, 34, 18], [80, 12, 14], [14, 70, 12], [70, 58, 10], [30, 90, 16], [60, 84, 12], [86, 40, 12], [40, 6, 10]].map(([x, y, s], i) => `<span style="left:${x}%;top:${y}%;width:${s}px">${i % 2 ? daisy('#F5E6E9', '#D8A7B1') : rose('#D8A7B1', '#C48F9B')}</span>`).join('')}</div>
    <div class="tapa-deco tl">${bouquet(0)}</div><div class="tapa-deco br">${bouquet(1)}</div>
    <div class="tapa-deco bf">${ART.butterfly('#D8A7B1', '#A9BCD6')}</div>
    <div class="tapa-in">
      <div class="tapa-medalwrap"><div class="tapa-wreath">${wreath()}</div><div class="tapa-medal"><img src="${LOGO}" alt="Logo de Psicóloga Marha"></div></div>
      <h1 class="tapa-title">BLOOM</h1>
      <div class="tapa-by">by Psicóloga Marha</div>
      <div class="tapa-concept">Florecer en Dios</div>
      <div class="tapa-year">2027</div>
      <figure class="tapa-verse"><blockquote>${CENTRAL.text}</blockquote><figcaption>${CENTRAL.ref} · NVI</figcaption></figure>
      <label class="tapa-owner"><span>Esta agenda pertenece a</span><input data-doc="settings" data-p="name" value="${esc(name)}" placeholder="tu nombre" autocomplete="given-name" maxlength="40"></label>
      <button class="tapa-open" data-a="open-book">Abrir mi agenda</button>
    </div>
    <div class="tapa-band" aria-hidden="true"></div>
  </div>`;
}
/* ---------- Portada de cada mes ---------- */
const MONTH_BG = ['#23395B', '#C48F9B', '#5B7397', '#B89B7E', '#8FA6C6', '#C9A0A9'];
function viewMonthCover(m) {
    const mo = MONTHS[m], bg = MONTH_BG[m % 6], dark = m % 6 === 0 || m % 6 === 2;
    const goals = year().goals.filter(g => g.month === m && g.name.trim()).length;
    const first = new Date(YEAR, m, 1), lead = (first.getDay() + 6) % 7;
    let mini = WD.map(w => `<span class="h">${w[0]}</span>`).join('') + '<span></span>'.repeat(lead);
    for (let d = 1; d <= daysInMonth(m); d++)
        mini += `<a href="#dia-${YEAR}-${pad(m + 1)}-${pad(d)}">${d}</a>`;
    const deco = [ART.flower('#F5E6E9', '#23395B'), ART.butterfly('#F5E6E9', '#A9BCD6'), ART.flower('#A9BCD6', '#F5E6E9')];
    return `<div class="mcover">
    <section class="mc-panel ${dark ? 'dark' : ''}" style="background:${bg}">
      <div class="mc-branch">${ART.branch(dark ? '#A9BCD6' : '#FFFDF9')}</div>
      <div class="mc-bq">${bouquet(m % 2)}</div><div class="mc-f2">${deco[(m + 1) % 3]}</div>
      <div class="mc-num">${pad(m + 1)}</div>
      <h1 class="mc-name">${mo.n}</h1>
      <div class="mc-year">${YEAR}</div>
    </section>
    <section class="mc-side">
      <div class="eyebrow">Tema de florecimiento</div>
      <h2 class="serif mc-t">${mo.t}</h2>
      <div class="prom" style="margin:14px 0"><div class="ref">Mi promesa del mes · ${mo.ref}</div><p>${mo.p}</p><div class="para">Paráfrasis Bloom · lee el texto completo en tu Biblia</div></div>
      <p class="mc-r">${mo.r}</p>
      <div class="mc-mini" aria-label="Días de ${mo.n}">${mini}</div>
      <div class="small muted" style="margin:10px 0 16px">${goals ? `${goals} ${goals === 1 ? 'meta del año' : 'metas del año'} para este mes` : 'Un mes nuevo para florecer'}</div>
      <a class="mc-go" href="#mes-${m + 1}">Abrir ${mo.n.toLowerCase()} →</a>
    </section>
  </div>
  ${pager(m > 0 ? [`#portada-${m}`, MONTHS[m - 1].n] : ['#inicio', 'Inicio'], m < 11 ? [`#portada-${m + 2}`, MONTHS[m + 1].n] : ['#metas', 'Panel de metas'])}`;
}
/* ---------- Pintar ---------- */
let installPrompt = null;
function render(keepScroll = false) {
    const y = window.scrollY, r = route();
    const tapa = $('#tapa');
    document.body.classList.toggle('closed', r.v === 'tapa');
    if (r.v === 'tapa') {
        document.body.classList.remove('decor');
        tapa.innerHTML = viewTapa();
        document.title = 'BLOOM 2027 · Psicóloga Marha';
        return;
    }
    tapa.innerHTML = '';
    renderFrame(r);
    const v = $('#view');
    v.innerHTML = (r.v === 'preparar' ? viewPrepare(r.d) : r.v === 'ciclo' ? viewCycle() : r.v === 'compras' ? viewShopping() : r.v === 'hojitas' ? viewNotes() : r.v === 'oracion' ? viewPrayers() : r.v === 'proyectos' ? viewProjects() : r.v === 'lectura' ? viewReading() : r.v === 'estudio' ? viewStudio() : r.v === 'stickers' ? viewStickers() : r.v === 'buscar' ? viewSearch() : r.v === 'recordatorios' ? viewReminders() : r.v === 'finanzas' ? viewFinance() : r.v === 'portada' ? viewMonthCover(r.m) : r.v === 'anio' ? viewYear() : r.v === 'metas' ? viewGoals() : r.v === 'mes' ? viewMonth(r.m) : r.v === 'dia' ? viewDay(r.m, r.d) : r.v === 'semana' ? viewWeek(r.w) : r.v === 'pronto' ? viewSoon(r.s) : r.v === 'ajustes' ? viewSettings() : viewCover())
        + (r.v !== 'inicio' && r.v !== 'portada' ? '' : '') + (r.v !== 'inicio' ? `<div class="page-sign"><img src="${LOGO}" alt="Psicóloga Marha"><span>BLOOM by Psicóloga Marha</span></div>` : '');
    if (installPrompt) {
        const b = document.getElementById('install');
        if (b)
            b.hidden = false;
    }
    document.title = 'BLOOM 2027 · ' + (r.v === 'preparar' ? '31 días para florecer' : r.v === 'ciclo' ? 'Mi ciclo' : r.v === 'compras' ? 'Compras' : r.v === 'hojitas' ? 'Mis hojitas' : r.v === 'oracion' ? 'Oración' : r.v === 'proyectos' ? 'Proyectos' : r.v === 'lectura' ? 'Mi lectura' : r.v === 'estudio' ? 'Mi Estudio Creativo' : r.v === 'stickers' ? 'Stickers' : r.v === 'buscar' ? 'Buscar' : r.v === 'recordatorios' ? 'Recordatorios' : r.v === 'finanzas' ? 'Finanzas' : r.v === 'anio' ? 'Mi año' : r.v === 'metas' ? 'Metas' : r.v === 'mes' || r.v === 'portada' ? MONTHS[r.m].n : r.v === 'dia' ? `${r.d} de ${MONTHS[r.m].n}` : r.v === 'semana' ? `Semana ${r.w}` : r.v === 'pronto' ? SOON[r.s][0] : r.v === 'ajustes' ? 'Ajustes' : 'Portada');
    refreshComputed();
    const nv = (location.hash || '#inicio').slice(1) || 'inicio';
    if (nv !== curView) {
        curView = nv;
        selSticker = -1;
    }
    renderStickers();
    updateBell();
    applyTheme();
    if (keepScroll)
        window.scrollTo(0, y);
}
/* ---------- Eventos ---------- */
function resolvePath(doc, p) {
    // "goals.#<id>.campo" apunta a la meta por id (no por posición), así borrar una no mueve las otras.
    return [doc, p];
}
function onField(e) {
    const el = e.target;
    if (!el.dataset?.doc || !el.dataset.p)
        return;
    if (e.type === 'input' && (el.type === 'checkbox' || el.tagName === 'SELECT'))
        return;
    const id = el.dataset.doc;
    let val = el.dataset.t === 'b' ? el.checked : el.value;
    if (el.dataset.t === 'n')
        val = Number(el.value) || 0;
    if (el.dataset.t === 'month')
        val = el.value === '' ? null : Number(el.value);
    if (el.dataset.t === 'money')
        val = el.value === '' ? '' : Math.max(0, Number(el.value) || 0);
    if (el.dataset.t === 'null')
        val = el.value === '' ? null : el.value;
    const [target, path] = resolvePath(docOf(id), el.dataset.p);
    if (!target)
        return;
    setPath(target, path, val);
    store.touch(id);
    // Actualizaciones en vivo sin perder el foco
    const card = el.closest('[data-goal]');
    if (card) {
        const g = goalById(card.dataset.goal);
        card.querySelector('.gn').textContent = g.name || 'Nueva meta';
        card.querySelector('summary .pbar i').style.width = (+g.progress || 0) + '%';
        card.querySelector('summary .status').textContent = g.status;
        const pct = card.querySelector('[data-live=pct]');
        if (pct)
            pct.textContent = (+g.progress || 0) + '%';
        const dimEl = card.closest('.dim');
        if (dimEl) {
            const gs = year().goals.filter(x => x.dimension === g.dimension);
            dimEl.querySelector('h3 .pbar i').style.width = (gs.reduce((t, x) => t + (+x.progress || 0), 0) / gs.length) + '%';
        }
    }
    const b = document.getElementById('board');
    if (b && id === 'year')
        b.innerHTML = board();
    if (id === 'settings' && el.dataset.p === 'cycleEnabled') {
        renderFrame(route());
        buildMore();
    }
    if (id === 'settings' && el.dataset.p === 'studioEnabled') {
        renderFrame(route());
        updateBell();
    }
    if (id.startsWith('month:')) {
        const m = Number(id.slice(11, 13)) - 1;
        if (/^(habits|growth)\.\d$/.test(el.dataset.p)) {
            const k = el.dataset.p.split('.')[0];
            const box = document.querySelector(`[data-trk="${k}"]`);
            if (box && e.type === 'change')
                box.innerHTML = tracker(m, k);
        }
        if (el.dataset.p === 'focus.theme') {
            const t = document.getElementById('mtheme');
            if (t)
                t.textContent = 'Tema de florecimiento: ' + (el.value || MONTHS[m].t);
        }
        if (/^(family|work|fin\.bills)\./.test(el.dataset.p) && e.type === 'change') {
            const c = document.getElementById('mcal');
            if (c)
                c.innerHTML = monthCal(m);
        }
    }
    if (id.startsWith('day:')) {
        const hm = el.dataset.p.match(/^hours\.(\d+)\.(t|k)$/);
        if (hm) {
            const row = el.closest('.hr'), x = docOf(id).hours[+hm[1]];
            if (row) {
                row.className = `hr ${x.t.trim() ? 'busy' : ''} k-${x.k}`;
                const gc = row.querySelector('.gc');
                if (gc)
                    gc.href = gcalLink(id.slice(4), +hm[1], x.t);
            }
        }
        if (/^(habits|growth)\.\d$/.test(el.dataset.p))
            el.closest('label')?.classList.toggle('done', el.checked);
        if (/^todos\.\d+\.done$/.test(el.dataset.p))
            el.closest('.todo')?.classList.toggle('done', el.checked);
    }
    if (e.type === 'change')
        updateBell();
    if (id === 'studio') {
        const pm = el.dataset.p.match(/^pieces\.#([^.]+)\./);
        if (pm) {
            stUi.open = pm[1];
            const card = document.querySelector(`[data-piece="${pm[1]}"]`), p = pieceById(pm[1]);
            if (card && p) {
                card.querySelector('.pt b').textContent = p.title || 'Sin título';
                const stEl = card.querySelector('summary .status');
                stEl.textContent = p.status;
                stEl.className = `status st-${studio().states.indexOf(p.status)}`;
            }
        }
        const sm = el.dataset.p.match(/^states\.(\d+)$/);
        if (sm && e.type === 'input') { /* el nombre nuevo se aplica a las piezas al salir del campo */ }
        if (sm && e.type === 'change') {
            const prevName = el.defaultValue, i = +sm[1];
            studio().pieces.forEach(p => { if (p.status === prevName)
                p.status = studio().states[i]; });
            el.defaultValue = el.value;
            store.touch('studio');
        }
    }
    if (e.type === 'change' && el.dataset.p === 'fin.dailyBudget') {
        render(true);
        return;
    }
    if (e.type === 'change' && id === 'prep') {
        render(true);
        return;
    }
    if (e.type === 'change' && id === 'projects' && /\.(done|stage)$/.test(el.dataset.p)) {
        render(true);
        return;
    }
    if (id.startsWith('week:') && /^tasks\.\d+\.done$/.test(el.dataset.p))
        el.closest('.todo')?.classList.toggle('done', el.checked);
    refreshComputed();
}
document.addEventListener('input', onField);
document.addEventListener('change', () => gSchedule());
document.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a && !a.startsWith('g-'))
    gSchedule(); });
document.addEventListener('input', e => { const el = e.target; if (el.id === 'q') {
    lastQuery = el.value;
    document.getElementById('sres').innerHTML = searchResults(lastQuery);
} });
document.addEventListener('change', async (e) => {
    const el = e.target;
    if (el.dataset?.a === 'g-send') {
        gset().send[el.dataset.k] = el.checked;
        store.touch('settings');
        gSchedule();
        return;
    }
    if (el.dataset?.a === 'g-read') {
        const g = gset();
        g.read = el.checked;
        store.touch('settings');
        gCache.clear();
        if (el.checked && !G.canRead())
            G.connect(true).then(() => toast('Listo: verás tus citas de Google en cada día.')).catch(err => { g.read = false; store.touch('settings'); toast(gMsg(err)); render(true); });
        return;
    }
    if (el.dataset?.a === 'note-paper' || el.dataset?.a === 'note-washi') {
        const sh = notesDoc().sheets.find(x => x.id === el.dataset.id);
        if (sh) {
            if (el.dataset.a === 'note-paper')
                sh.paper = el.value;
            else
                sh.washi = el.value;
            store.touch('notes');
            render(true);
        }
        return;
    }
    if (el.dataset?.a === 'st-filter') {
        stUi[el.dataset.k] = el.value;
        render(true);
        return;
    }
    if (el.id === 'restore') {
        const f = el.files?.[0];
        if (!f)
            return;
        try {
            const n = await store.importBackup(await f.text());
            toast(`Copia restaurada: ${n} ${n === 1 ? 'página recuperada' : 'páginas recuperadas'}`);
            render(true);
        }
        catch (err) {
            toast(err.message);
        }
        el.value = '';
        return;
    }
    onField(e);
});
document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-a],[data-open]');
    const sheet = e.target.classList.contains('sheet');
    if (sheet || e.target.closest('.sheet a')) {
        document.querySelectorAll('.sheet').forEach(s => s.classList.remove('open'));
        return;
    }
    if (!t)
        return;
    if (t.dataset.open) {
        document.getElementById(t.dataset.open).classList.add('open');
        return;
    }
    const a = t.dataset.a;
    if (a === 'open-book') {
        const book = document.getElementById('tapaBook');
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (book && !reduce) {
            book.classList.add('opening');
            setTimeout(() => { location.hash = 'inicio'; }, 650);
        }
        else
            location.hash = 'inicio';
        return;
    }
    if (a === 'jump') {
        e.preventDefault();
        document.getElementById(t.dataset.to)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (a === 'add') {
        const arr = getAt(docOf(t.dataset.doc), t.dataset.l);
        arr.push(TPL[t.dataset.tpl]());
        store.touch(t.dataset.doc);
        render(true);
        const first = document.querySelector(`[data-doc="${t.dataset.doc}"][data-p^="${t.dataset.l}.${arr.length - 1}."]:not([type=date]):not([type=number])`);
        first?.focus({ preventScroll: true });
        return;
    }
    if (a === 'del') {
        e.preventDefault();
        const arr = getAt(docOf(t.dataset.doc), t.dataset.l);
        arr.splice(+t.dataset.i, 1);
        store.touch(t.dataset.doc);
        render(true);
        return;
    }
    if (a === 'decor') {
        document.body.classList.toggle('decor');
        document.getElementById('decorBtn')?.classList.toggle('on');
        renderTray();
        return;
    }
    if (a === 'decor-done') {
        document.body.classList.remove('decor');
        document.getElementById('decorBtn')?.classList.remove('on');
        selSticker = -1;
        renderStickers();
        return;
    }
    if (a === 'stk-cat') {
        stCat = +t.dataset.i;
        renderTray();
        return;
    }
    if (a === 'stk-add') {
        addSticker(t.dataset.id);
        return;
    }
    if (a === 'stk-try') {
        stCat = +t.dataset.cat;
        document.body.classList.add('decor');
        document.getElementById('decorBtn')?.classList.add('on');
        renderTray();
        toast('Elige un sticker en el panel y pégalo en la página que quieras');
        return;
    }
    if (a === 'stk-rot' || a === 'stk-size' || a === 'stk-del') {
        const i = +t.dataset.i, list = placed(), sk = list[i];
        if (!sk)
            return;
        if (a === 'stk-rot')
            sk.r = (sk.r + 15) % 360;
        if (a === 'stk-size')
            sk.s = Math.min(2.4, Math.max(.5, (sk.s ?? 1) + .2 * +t.dataset.d));
        if (a === 'stk-del') {
            list.splice(i, 1);
            selSticker = -1;
        }
        store.touch(stickerDoc());
        renderStickers();
        return;
    }
    if (a === 'theme') {
        settings().theme = t.dataset.v;
        store.touch('settings');
        render(true);
        return;
    }
    if (a === 'notify-on') {
        try {
            const p = await Notification.requestPermission();
            if (p === 'granted') {
                settings().notify = true;
                store.touch('settings');
                toast('Avisos activados');
                notifyToday();
            }
        }
        catch {
            toast('Este navegador no permite avisos');
        }
        render(true);
        return;
    }
    if (a === 'cyc-day') {
        if (t.tagName === 'BUTTON')
            e.preventDefault();
        const c = cycleDoc(), k = t.dataset.k;
        c.days = c.days.includes(k) ? c.days.filter(x => x !== k) : [...c.days, k];
        store.touch('cycle');
        render(true);
        return;
    }
    if (a === 'cyc-sym') {
        const c = cycleDoc(), k = t.dataset.k, v = t.dataset.v;
        const l = c.notes[k] || [];
        c.notes[k] = l.includes(v) ? l.filter(x => x !== v) : [...l, v];
        store.touch('cycle');
        render(true);
        return;
    }
    if (a === 'cyc-month') {
        e.preventDefault();
        cycMonth = +t.dataset.i;
        render(true);
        return;
    }
    if (a === 'shop-add') {
        const g = (id) => document.getElementById(id).value.trim();
        if (!g('shopT'))
            return;
        shopDoc().items.push({ id: uid(), t: g('shopT'), qty: g('shopQ'), sec: g('shopS'), done: false });
        store.touch('shopping');
        const sec = g('shopS');
        render(true);
        document.getElementById('shopS').value = sec;
        document.getElementById('shopT')?.focus({ preventScroll: true });
        return;
    }
    if (a === 'shop-tick') {
        const it = shopDoc().items.find(x => x.id === t.dataset.id);
        if (it) {
            it.done = !it.done;
            store.touch('shopping');
            render(true);
        }
        return;
    }
    if (a === 'shop-del') {
        const d = shopDoc();
        d.items = d.items.filter(x => x.id !== t.dataset.id);
        store.touch('shopping');
        render(true);
        return;
    }
    if (a === 'shop-reset') {
        shopDoc().items.forEach(x => { x.done = false; });
        store.touch('shopping');
        render(true);
        return;
    }
    if (a === 'shop-clear') {
        const d = shopDoc();
        d.items = d.items.filter(x => !x.done);
        store.touch('shopping');
        render(true);
        return;
    }
    if (a === 'note-add') {
        notesDoc().sheets.unshift({ id: uid(), title: '', text: '', paper: PAPERS[notesDoc().sheets.length % PAPERS.length][0], washi: WASHIS[1 + notesDoc().sheets.length % (WASHIS.length - 1)] });
        store.touch('notes');
        render(true);
        document.querySelector('.hoja .hoja-t')?.focus({ preventScroll: true });
        return;
    }
    if (a === 'note-del') {
        const card = t.closest('.hoja');
        if (!card.classList.contains('confirm')) {
            card.classList.add('confirm');
            toast('Toca otra vez la × para eliminar la hojita');
            return;
        }
        const d = notesDoc();
        d.sheets = d.sheets.filter(x => x.id !== t.dataset.id);
        store.touch('notes');
        render(true);
        return;
    }
    if (a === 'pray-add') {
        const g = (id) => document.getElementById(id).value.trim();
        if (!g('prReq') && !g('prWho'))
            return;
        prayerDoc().items.unshift({ id: uid(), who: g('prWho'), req: g('prReq'), date: dkey(new Date().getFullYear() === YEAR ? new Date() : todayInYear()), answered: false, adate: '', answer: '' });
        prayTab = 'orando';
        store.touch('prayers');
        render(true);
        return;
    }
    if (a === 'pray-tab') {
        prayTab = t.dataset.k;
        render(true);
        return;
    }
    if (a === 'pray-toggle') {
        const it = prayerDoc().items.find(x => x.id === t.dataset.id);
        if (it) {
            it.answered = !it.answered;
            it.adate = it.answered ? dkey(new Date().getFullYear() === YEAR ? new Date() : todayInYear()) : '';
            store.touch('prayers');
            if (it.answered) {
                prayTab = 'respondidas';
                toast('¡Gloria a Dios! Quedó en tus oraciones respondidas');
            }
            render(true);
        }
        return;
    }
    if (a === 'pray-del') {
        const card = t.closest('.prayer');
        if (!card.classList.contains('confirm')) {
            card.classList.add('confirm');
            t.textContent = '¿Segura? Toca otra vez';
            return;
        }
        const d = prayerDoc();
        d.items = d.items.filter(x => x.id !== t.dataset.id);
        store.touch('prayers');
        render(true);
        return;
    }
    if (a === 'proj-add') {
        projDoc().items.unshift({ id: uid(), name: '', area: 'Personal', stage: 'Por iniciar', due: '', desc: '', tasks: [] });
        store.touch('projects');
        render(true);
        document.querySelector('[data-proj] input')?.focus({ preventScroll: true });
        return;
    }
    if (a === 'proj-del') {
        const card = t.closest('[data-proj]');
        if (!card.classList.contains('confirm')) {
            card.classList.add('confirm');
            t.textContent = '¿Segura? Toca otra vez para eliminar';
            return;
        }
        const d = projDoc();
        d.items = d.items.filter(x => x.id !== t.dataset.id);
        store.touch('projects');
        render(true);
        return;
    }
    if (a === 'st-tab') {
        stUi.tab = t.dataset.k;
        render(true);
        return;
    }
    if (a === 'st-month') {
        e.preventDefault();
        stUi.month = +t.dataset.i;
        render(true);
        return;
    }
    if (a === 'piece-add') {
        const g = (id) => document.getElementById(id).value, title = g('npTitle').trim();
        if (!title) {
            toast('Escribe el título o la idea');
            return;
        }
        const p = { id: uid(), title, topic: '', goal: '', platform: g('npPlat'), format: g('npFmt'), rec: g('npRec'), edit: g('npEdit'), pub: g('npPub'), pubTime: '', script: '', desc: '', cta: '', tags: '', link: '', status: '', metrics: {}, notes: '', project: '' };
        const st = studio().states;
        p.status = p.pub ? st[Math.min(1, st.length - 1)] : st[0];
        if (studio().pieces.some(x => x.title.trim().toLowerCase() === title.toLowerCase() && x.platform === p.platform && x.pub === p.pub)) {
            toast('Esa pieza ya existe con la misma fecha y plataforma');
            return;
        }
        studio().pieces.push(p);
        store.touch('studio');
        const when = p.pub || p.rec || p.edit;
        if (when)
            stUi.month = +when.slice(5, 7) - 1;
        stUi.open = p.id;
        render(true);
        toast('Pieza guardada');
        return;
    }
    if (a === 'piece-del') {
        const card = t.closest('.piece');
        if (!card.classList.contains('confirm')) {
            card.classList.add('confirm');
            t.textContent = '¿Segura? Toca otra vez para eliminar';
            return;
        }
        const s2 = studio();
        s2.pieces = s2.pieces.filter(x => x.id !== t.dataset.id);
        store.touch('studio');
        render(true);
        toast('Pieza eliminada');
        return;
    }
    if (a === 'piece-move') {
        const p = pieceById(t.dataset.id), st = studio().states, i = Math.max(0, st.indexOf(p.status));
        p.status = st[Math.min(st.length - 1, Math.max(0, i + +t.dataset.d))];
        store.touch('studio');
        render(true);
        return;
    }
    if (a === 'piece-open') {
        stUi.open = t.dataset.id;
        render(true);
        document.querySelector(`[data-piece="${t.dataset.id}"]`)?.scrollIntoView({ block: 'center' });
        return;
    }
    if (a === 'idea-add') {
        const el = document.getElementById('ideaText');
        if (!el.value.trim())
            return;
        studio().ideas.unshift({ id: uid(), text: el.value.trim() });
        store.touch('studio');
        render(true);
        return;
    }
    if (a === 'idea-piece') {
        const i = +t.dataset.i, idea = studio().ideas[i];
        const st = studio().states;
        studio().pieces.push({ id: uid(), title: idea.text, topic: '', goal: '', platform: 'Instagram', format: 'Reel', rec: '', edit: '', pub: '', pubTime: '', script: '', desc: '', cta: '', tags: '', link: '', status: st[0], metrics: {}, notes: '' });
        studio().ideas.splice(i, 1);
        store.touch('studio');
        stUi.tab = 'flujo';
        render(true);
        toast('La idea ahora es una pieza');
        return;
    }
    if (a === 'state-add') {
        studio().states.push('Nuevo estado');
        store.touch('studio');
        render(true);
        return;
    }
    if (a === 'state-del') {
        const s2 = studio(), i = +t.dataset.i, gone = s2.states[i];
        s2.states.splice(i, 1);
        s2.pieces.forEach(p => { if (p.status === gone)
            p.status = s2.states[Math.max(0, i - 1)]; });
        store.touch('studio');
        render(true);
        return;
    }
    if (a === 'state-reset') {
        const s2 = studio();
        s2.pieces.forEach(p => { if (!STUDIO_STATES.includes(p.status))
            p.status = STUDIO_STATES[0]; });
        s2.states = STUDIO_STATES.slice();
        store.touch('studio');
        render(true);
        return;
    }
    if (a === 'feel') {
        const dd = docOf(t.dataset.doc);
        dd.feel = dd.feel === t.dataset.v ? '' : t.dataset.v;
        store.touch(t.dataset.doc);
        render(true);
        return;
    }
    if (a === 'fin-diario') {
        finTab = 'diario';
        return;
    }
    if (a === 'fin-ingresos') {
        finTab = 'ingresos';
        return;
    }
    if (a === 'ftab') {
        finTab = t.dataset.k;
        render(true);
        return;
    }
    if (a === 'grow' || a === 'grow-clear') {
        const m = +t.dataset.m, mo = monthDoc(m), id = monthId(m);
        if (a === 'grow-clear')
            mo.growth[+t.dataset.i] = '';
        else {
            const v = t.dataset.v, at = mo.growth.findIndex(g => g.trim().toLowerCase() === v.toLowerCase());
            if (at >= 0)
                mo.growth[at] = '';
            else {
                const free = mo.growth.findIndex(g => !g.trim());
                if (free < 0) {
                    toast('Ya elegiste tres. Quita uno para cambiarlo.');
                    return;
                }
                mo.growth[free] = v;
            }
        }
        store.touch(id);
        render(true);
        return;
    }
    if (a === 'goal-add') {
        const g = { id: uid(), dimension: t.dataset.dim, name: '', description: '', targetDate: '', actions: '', progress: 0, status: 'Por iniciar', month: null, verseRef: '' };
        year().goals.push(g);
        store.touch('year');
        render(true);
        document.querySelector(`[data-goal="${g.id}"] input`)?.focus({ preventScroll: true });
        return;
    }
    if (a === 'goal-del') {
        const g = goalById(t.dataset.id);
        if (!g)
            return;
        const card = t.closest('.goal');
        if (!card.classList.contains('confirm')) {
            card.classList.add('confirm');
            t.textContent = '¿Segura? Toca otra vez para eliminar';
            return;
        }
        year().goals = year().goals.filter(x => x.id !== g.id);
        store.touch('year');
        render(true);
        toast('Meta eliminada');
        return;
    }
    if (a === 'open-goal') {
        e.preventDefault();
        const g = goalById(t.dataset.id);
        location.hash = 'mi-anio';
        setTimeout(() => { const c = document.querySelector(`[data-goal="${g?.id}"]`); if (c) {
            c.open = true;
            c.scrollIntoView({ block: 'center' });
        } }, 50);
        return;
    }
    if (a === 'reset-all') {
        if (document.getElementById('resetConfirm')?.value.trim().toUpperCase() !== 'BORRAR') {
            toast('Escribe BORRAR para confirmar.');
            return;
        }
        (C.user() ? C.deleteAccount(store) : store.clearLocal()).then(() => { G.disconnect(); applyTheme(); renderFrame(route()); buildMore(); updateBell(); location.hash = '#tapa'; render(); toast('Listo: tu agenda está en blanco, lista para empezar.'); }).catch(() => toast('No se pudo borrar todo ahora. Revisa tu internet e intenta de nuevo.'));
        return;
    }
    if (a === 'c-in') {
        store.flushAll().then(() => C.signIn()).then(() => cloudStart(true)).catch(err => toast(gMsg(err)));
        return;
    }
    if (a === 'c-resume') {
        C.resume().then(() => C.sync(store)).then(() => render(true)).catch(err => toast(gMsg(err)));
        return;
    }
    if (a === 'c-sync') {
        (C.getState() === 'needs-tap' ? C.resume() : Promise.resolve()).then(() => C.sync(store)).then(() => { toast(C.getState() === 'synced' ? 'Tu agenda está al día.' : cloudStatusText()); render(true); });
        return;
    }
    if (a === 'c-out') {
        if (!t.classList.contains('confirm')) {
            t.classList.add('confirm');
            t.textContent = '¿Cerrar sesión? Toca otra vez';
            t.closest('.quick').insertAdjacentHTML('afterend', '<label class="small" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" id="cWipe"> Borrar también mi agenda de este dispositivo (recomendado si no es tuyo)</label>');
            return;
        }
        const wipe = !!document.getElementById('cWipe')?.checked;
        C.sync(store).finally(async () => { if (wipe && store.pending().length && C.getState() !== 'synced') {
            toast('No pude enviar tus últimos cambios. Conéctate a internet antes de borrar este dispositivo.');
            return;
        } await C.signOut(store, wipe); G.disconnect(); render(true); toast(wipe ? 'Sesión cerrada y agenda borrada de este dispositivo.' : 'Sesión cerrada. Tu agenda sigue en este dispositivo.'); });
        return;
    }
    if (a === 'c-delete') {
        if (document.getElementById('delConfirm')?.value.trim().toUpperCase() !== 'ELIMINAR') {
            toast('Escribe ELIMINAR para confirmar.');
            return;
        }
        C.deleteAccount(store).then(() => { G.disconnect(); location.hash = '#tapa'; render(); toast('Tu agenda fue borrada de tu Drive y de este dispositivo.'); }).catch(() => toast('No se pudo eliminar ahora. Revisa tu internet e intenta de nuevo.'));
        return;
    }
    if (a === 'g-connect') {
        const g = gset();
        g.read = !!document.getElementById('gReadOpt')?.checked;
        G.connect(g.read).then(async () => { settings().googleConnected = true; store.touch('settings'); render(true); await gSync(); render(true); }).catch(err => toast(gMsg(err)));
        return;
    }
    if (a === 'g-sync') {
        if (!G.hasToken() || (gset().read && !G.canRead())) {
            G.connect(gset().read, true).then(() => { gCache.clear(); render(true); gSync(); }).catch(err => toast(gMsg(err)));
            return;
        }
        gSync();
        return;
    }
    if (a === 'g-off') {
        if (!t.classList.contains('confirm')) {
            t.classList.add('confirm');
            t.textContent = '¿Desconectar? Toca otra vez';
            t.insertAdjacentHTML('afterend', '<label class="small" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" id="gDelCal"> Borrar también el calendario «BLOOM 2027» de mi Google</label>');
            return;
        }
        const del = document.getElementById('gDelCal')?.checked, g = gset(), cal = g.calId;
        (del && cal && G.hasToken() ? G.deleteCalendar(cal) : Promise.resolve()).catch(() => undefined).finally(() => {
            G.disconnect();
            settings().googleConnected = false;
            g.calId = del ? undefined : g.calId;
            g.lastSync = undefined;
            g.last = '';
            gCache.clear();
            store.touch('settings');
            render(true);
            toast(del ? 'Listo: desconectada y calendario BLOOM borrado de Google.' : 'Listo: desconectada. Tu calendario «BLOOM 2027» quedó en Google por si lo quieres.');
        });
        return;
    }
    if (a === 'backup') {
        const blob = new Blob([store.exportBackup()], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bloom-2027-copia-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
        return;
    }
    if (a === 'install' && installPrompt) {
        await installPrompt.prompt();
        installPrompt = null;
        t.hidden = true;
    }
});
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2600); }
const STATE_TEXT = { saved: '✓ Guardado', saving: 'Guardando…', 'memory-only': 'Sin guardado: descarga tu copia', error: 'No se pudo guardar' };
function buildMore() {
    $('#sheetMoreList').innerHTML = [['tapa', 'Cerrar agenda'], ['preparar', '31 días para florecer'], ['buscar', 'Buscar'], ['recordatorios', 'Recordatorios'], ['oracion', 'Oración'], ['hojitas', 'Mis hojitas'], ['compras', 'Lista de compras'], ['ciclo', 'Mi ciclo'], ['metas', 'Metas'], ['finanzas', 'Finanzas'], ['proyectos', 'Proyectos'], ['lectura', 'Mi lectura'], ['estudio', 'Mi Estudio'], ['stickers', 'Stickers'], ['ajustes', 'Ajustes y copia']].filter(([h]) => h !== 'ciclo' || cycleOn()).map(([h, t]) => `<a href="#${h}">${t}</a>`).join('');
}
async function main() {
    await store.open();
    const status = $('#status');
    const show = () => {
        const s = store.state, c = C.getState();
        const cloud = s !== 'saved' ? '' : c === 'needs-tap' ? '↻ Toca para guardar en tu Drive' : c === 'syncing' ? 'Sincronizando…' : c === 'synced' ? '✓ En tu Drive' : c === 'offline' ? '✓ Guardado aquí · sin internet' : c === 'error' ? '✓ Guardado aquí' : '';
        status.textContent = cloud || STATE_TEXT[s];
        status.dataset.state = s;
        status.title = c === 'synced' ? 'Guardado en este dispositivo y en tu Google Drive' : c === 'signed-out' ? 'Guardado solo en este dispositivo' : '';
        const cs = document.getElementById('cloudstatus');
        if (cs)
            cs.innerHTML = cloudStatusText();
    };
    store.onState(s => { show(); if (s === 'saved')
        cloudSoon(); });
    C.onState(show);
    show();
    if (C.user())
        cloudStart(false);
    status.addEventListener('click', () => { if (C.getState() === 'needs-tap')
        C.resume().then(() => C.sync(store)).catch(e => toast(gMsg(e))); });
    store.onRemote(ids => { cloudRemote(ids); });
    window.addEventListener('online', () => C.sync(store));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible')
        C.sync(store); });
    setInterval(() => { if (document.visibilityState === 'visible')
        C.sync(store); }, 60000);
    $('#sheetMonthsGrid').innerHTML = MONTHS.map((x, i) => `<a href="#portada-${i + 1}">${x.n}</a>`).join('');
    buildMore();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden')
        store.flushAll(); });
    window.addEventListener('pagehide', () => { store.flushAll(); });
    const net = () => document.body.classList.toggle('offline', !navigator.onLine);
    window.addEventListener('online', net);
    window.addEventListener('offline', net);
    net();
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; const b = document.getElementById('install'); if (b)
        b.hidden = false; });
    window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
    if ('serviceWorker' in navigator)
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    render();
    notifyToday();
    window.bloom = { store, cloud: C };
}
main();
