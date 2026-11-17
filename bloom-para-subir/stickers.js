/**
 * BLOOM 2027 · Biblioteca de stickers (ilustraciones originales de BLOOM)
 */
import { ART, rose, daisy, bud, leaf } from './content.js';
const N = '#23395B', R = '#D8A7B1', RD = '#C48F9B', RM = '#F5E6E9', B = '#A9BCD6', BM = '#E4EAF3', S = '#E6D3BD', SD = '#B89B7E', G = '#9DB0A0', W = '#FFFDF9';
const svg = (vb, body) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
/** Etiqueta con texto (frases, rótulos). */
const pill = (t, bg, fg, border = '') => {
    const w = Math.max(70, t.length * 9 + 30);
    return svg(`0 0 ${w} 40`, `<rect x="2" y="4" width="${w - 4}" height="32" rx="16" fill="${bg}" ${border ? `stroke="${border}" stroke-width="2"` : ''}/><text x="${w / 2}" y="26" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-style="italic" font-size="18" font-weight="600" fill="${fg}">${t}</text>`);
};
const tag = (t, bg) => {
    const w = Math.max(80, t.length * 8.5 + 40);
    return svg(`0 0 ${w} 40`, `<path d="M14 5H${w - 4}V35H14L3 20z" fill="${bg}"/><circle cx="15" cy="20" r="3.5" fill="${W}"/><text x="${(w + 18) / 2}" y="25" text-anchor="middle" font-family="Jost,system-ui,sans-serif" font-size="13" font-weight="500" letter-spacing=".5" fill="${W}">${t}</text>`);
};
const washi = (body) => svg('0 0 120 40', `<g transform="rotate(-4 60 20)"><clipPath id="c"><path d="M6 10h108l-3 5 3 5-3 5 3 5H6l3-5-3-5 3-5-3-5z"/></clipPath><g clip-path="url(#c)">${body}</g></g>`);
const flag = (c) => svg('0 0 64 64', `<path d="M14 8v50" stroke="${N}" stroke-width="2.5" stroke-linecap="round"/><path d="M16 10h34l-8 10 8 10H16z" fill="${c}"/>`);
const marker = (c) => svg('0 0 120 30', `<path d="M4 8q56-4 112 0v14q-56 4-112 0z" fill="${c}" opacity=".55"/>`);
export const STICKER_CATS = [
    { n: 'Flores', items: [
            { id: 'rosa', svg: rose() }, { id: 'rosa-azul', svg: rose(B, '#8FA6C6') }, { id: 'margarita', svg: daisy() },
            { id: 'margarita-rosa', svg: daisy(RM, R) }, { id: 'flor', svg: ART.flower() }, { id: 'flor-azul', svg: ART.flower(B, RD) },
            { id: 'capullo', svg: bud() }, { id: 'ramita', svg: ART.sprig() }, { id: 'hoja', svg: leaf(G, -30) }
        ] },
    { n: 'Mariposas', items: [{ id: 'mariposa', svg: ART.butterfly() }, { id: 'mariposa-rosa', svg: ART.butterfly(R, B) }, { id: 'mariposa-arena', svg: ART.butterfly(S, R) }] },
    { n: 'Corazones', items: [
            { id: 'corazon', svg: svg('0 0 64 64', `<path d="M32 54C10 40 6 28 10 19c4-9 16-11 22-2 6-9 18-7 22 2 4 9 0 21-22 35z" fill="${R}"/><path d="M20 22c-3 1-5 4-5 7" stroke="${W}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`) },
            { id: 'corazon-azul', svg: svg('0 0 64 64', `<path d="M32 54C10 40 6 28 10 19c4-9 16-11 22-2 6-9 18-7 22 2 4 9 0 21-22 35z" fill="${B}"/>`) },
            { id: 'corazones', svg: svg('0 0 64 64', `<path d="M24 46C8 36 5 27 8 20c3-7 12-8 16-1 4-7 13-6 16 1 3 7 0 16-16 26z" fill="${RD}"/><path d="M46 34C37 28 35 23 37 19c2-4 7-5 9-1 2-4 7-3 9 1 2 4 0 9-9 15z" fill="${R}"/>`) }
        ] },
    { n: 'Libros', items: [
            { id: 'libro', svg: svg('0 0 64 64', `<path d="M32 16c-8-5-16-5-24-2v36c8-3 16-3 24 2 8-5 16-5 24-2V14c-8-3-16-3-24 2z" fill="${BM}" stroke="${N}" stroke-width="2" stroke-linejoin="round"/><path d="M32 16v36" stroke="${N}" stroke-width="2"/><path d="M14 24c4-1 8-1 12 1M14 31c4-1 8-1 12 1M38 25c4-2 8-2 12-1" stroke="${B}" stroke-width="1.6" stroke-linecap="round"/>`) },
            { id: 'biblia', svg: svg('0 0 64 64', `<rect x="14" y="8" width="36" height="48" rx="4" fill="${N}"/><rect x="18" y="8" width="32" height="48" rx="3" fill="${N}" stroke="${RM}" stroke-width="1"/><path d="M34 18v20M27 25h14" stroke="${R}" stroke-width="3" stroke-linecap="round"/><path d="M44 56v6l3-2 3 2v-6" fill="${RD}"/>`) },
            { id: 'pila-libros', svg: svg('0 0 64 64', `<rect x="10" y="40" width="44" height="10" rx="2" fill="${RD}"/><rect x="14" y="30" width="38" height="10" rx="2" fill="${B}"/><rect x="12" y="20" width="40" height="10" rx="2" fill="${S}"/><path d="M16 45h30M18 35h26M16 25h28" stroke="${W}" stroke-width="1.4" opacity=".7"/>`) }
        ] },
    { n: 'Café y té', items: [
            { id: 'cafe', svg: svg('0 0 64 64', `<path d="M12 26h32v14a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12z" fill="${RM}" stroke="${N}" stroke-width="2"/><path d="M44 30h4a6 6 0 0 1 0 12h-5" stroke="${N}" stroke-width="2" fill="none"/><path d="M22 20c0-4 4-4 4-8M32 20c0-4 4-4 4-8" stroke="${RD}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M8 56h40" stroke="${N}" stroke-width="2" stroke-linecap="round"/>`) },
            { id: 'te', svg: svg('0 0 64 64', `<path d="M10 30h36v6a16 16 0 0 1-16 16h-4a16 16 0 0 1-16-16z" fill="${BM}" stroke="${N}" stroke-width="2"/><path d="M46 33h3a5 5 0 0 1 0 10h-4" stroke="${N}" stroke-width="2" fill="none"/><path d="M30 30V14" stroke="${SD}" stroke-width="1.4"/><rect x="25" y="8" width="10" height="9" rx="1.5" fill="${R}"/>`) },
            { id: 'taza-flor', svg: svg('0 0 64 64', `<path d="M12 24h34v16a13 13 0 0 1-13 13h-8a13 13 0 0 1-13-13z" fill="${W}" stroke="${N}" stroke-width="2"/><path d="M46 28h4a6 6 0 0 1 0 12h-5" stroke="${N}" stroke-width="2" fill="none"/><circle cx="29" cy="38" r="5" fill="${R}"/><circle cx="29" cy="38" r="2" fill="${N}"/>`) }
        ] },
    { n: 'Lazos', items: [
            { id: 'lazo', svg: svg('0 0 64 64', `<path d="M32 30C22 18 8 18 8 28s14 12 24 2zM32 30c10-12 24-12 24-2s-14 12-24 2z" fill="${R}" stroke="${RD}" stroke-width="1.5"/><path d="M30 32l-8 22 6-3 4 5M34 32l8 22-6-3-4 5" fill="${R}" stroke="${RD}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="32" cy="30" r="5" fill="${RD}"/>`) },
            { id: 'lazo-azul', svg: svg('0 0 64 64', `<path d="M32 30C22 18 8 18 8 28s14 12 24 2zM32 30c10-12 24-12 24-2s-14 12-24 2z" fill="${B}" stroke="#8FA6C6" stroke-width="1.5"/><path d="M30 32l-8 22 6-3 4 5M34 32l8 22-6-3-4 5" fill="${B}" stroke="#8FA6C6" stroke-width="1.5" stroke-linejoin="round"/><circle cx="32" cy="30" r="5" fill="${N}"/>`) }
        ] },
    { n: 'Estrellas', items: [
            { id: 'estrella', svg: svg('0 0 64 64', `<path d="M32 6l7 17 18 1-14 11 5 18-16-10-16 10 5-18L7 24l18-1z" fill="${S}" stroke="${SD}" stroke-width="1.5" stroke-linejoin="round"/>`) },
            { id: 'destellos', svg: svg('0 0 64 64', `<path d="M24 8c2 12 6 16 18 18-12 2-16 6-18 18-2-12-6-16-18-18 12-2 16-6 18-18z" fill="${R}"/><path d="M48 34c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10z" fill="${B}"/>`) },
            { id: 'estrella-azul', svg: svg('0 0 64 64', `<path d="M32 6l7 17 18 1-14 11 5 18-16-10-16 10 5-18L7 24l18-1z" fill="${B}"/>`) }
        ] },
    { n: 'Frases cristianas', items: [
            { id: 'fe', svg: pill('Fe', N, RM), wide: true }, { id: 'gracias-dios', svg: pill('Gracias, Dios', RM, N, R), wide: true },
            { id: 'dios-es-fiel', svg: pill('Dios es fiel', N, W), wide: true }, { id: 'bendecida', svg: pill('Bendecida', R, N), wide: true },
            { id: 'ora', svg: pill('Ora sin cesar', BM, N, B), wide: true }, { id: 'florezco', svg: pill('Florezco en Dios', RM, N, RD), wide: true }
        ] },
    { n: 'Citas y reuniones', items: [
            { id: 'calendario', svg: svg('0 0 64 64', `<rect x="8" y="12" width="48" height="44" rx="8" fill="${W}" stroke="${N}" stroke-width="2"/><path d="M8 24h48" stroke="${N}" stroke-width="2"/><path d="M20 8v8M44 8v8" stroke="${RD}" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="40" r="7" fill="${R}"/>`) },
            { id: 'reloj', svg: svg('0 0 64 64', `<circle cx="32" cy="34" r="22" fill="${W}" stroke="${N}" stroke-width="2"/><path d="M32 20v14l9 6" stroke="${RD}" stroke-width="3" stroke-linecap="round"/><path d="M14 12l-6 6M50 12l6 6" stroke="${N}" stroke-width="3" stroke-linecap="round"/>`) },
            { id: 'cita', svg: tag('Cita', RD), wide: true }, { id: 'reunion', svg: tag('Reunión', '#5B7397'), wide: true }
        ] },
    { n: 'Cumpleaños', items: [
            { id: 'torta', svg: svg('0 0 64 64', `<rect x="12" y="30" width="40" height="22" rx="4" fill="${RM}" stroke="${RD}" stroke-width="2"/><path d="M12 38q5 5 10 0t10 0 10 0 10 0" stroke="${R}" stroke-width="3" fill="none"/><path d="M22 30v-8M32 30v-8M42 30v-8" stroke="${B}" stroke-width="3"/><path d="M22 18c-2-3 2-5 0-8 3 2 3 5 0 8zM32 18c-2-3 2-5 0-8 3 2 3 5 0 8zM42 18c-2-3 2-5 0-8 3 2 3 5 0 8z" fill="${SD}"/><path d="M8 54h48" stroke="${N}" stroke-width="2" stroke-linecap="round"/>`) },
            { id: 'globos', svg: svg('0 0 64 64', `<ellipse cx="24" cy="22" rx="11" ry="13" fill="${R}"/><ellipse cx="42" cy="26" rx="10" ry="12" fill="${B}"/><path d="M24 35q-2 10 6 24M42 38q2 10-10 21" stroke="${N}" stroke-width="1.2" fill="none"/>`) },
            { id: 'regalo', svg: svg('0 0 64 64', `<rect x="12" y="26" width="40" height="30" rx="3" fill="${B}"/><rect x="9" y="18" width="46" height="10" rx="2" fill="${N}"/><path d="M32 18v38" stroke="${R}" stroke-width="5"/><path d="M32 18c-6-10-16-8-12-2 3 3 12 2 12 2zM32 18c6-10 16-8 12-2-3 3-12 2-12 2z" fill="${R}"/>`) },
            { id: 'feliz-cumple', svg: pill('¡Feliz cumpleaños!', RM, N, R), wide: true }
        ] },
    { n: 'Finanzas', items: [
            { id: 'alcancia', svg: svg('0 0 64 64', `<ellipse cx="32" cy="36" rx="22" ry="16" fill="${R}"/><circle cx="50" cy="32" r="5" fill="${R}"/><path d="M20 50v6M42 50v6" stroke="${RD}" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="31" r="2" fill="${N}"/><path d="M28 22h10" stroke="${N}" stroke-width="2.5" stroke-linecap="round"/><circle cx="33" cy="12" r="6" fill="${S}" stroke="${SD}" stroke-width="1.5"/>`) },
            { id: 'moneda', svg: svg('0 0 64 64', `<circle cx="32" cy="32" r="22" fill="${S}" stroke="${SD}" stroke-width="2"/><circle cx="32" cy="32" r="16" fill="none" stroke="${SD}" stroke-width="1.2"/><text x="32" y="40" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="22" font-weight="600" fill="${N}">$</text>`) },
            { id: 'pagar', svg: tag('Pagar', N), wide: true }, { id: 'ahorro', svg: tag('Ahorro', '#6E9B83'), wide: true }
        ] },
    { n: 'Trabajo', items: [
            { id: 'portatil', svg: svg('0 0 64 64', `<rect x="12" y="14" width="40" height="28" rx="3" fill="${BM}" stroke="${N}" stroke-width="2"/><path d="M6 46h52l-4 6H10z" fill="${N}"/><path d="M26 28l4 4 8-8" stroke="${RD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`) },
            { id: 'maletin', svg: svg('0 0 64 64', `<rect x="8" y="20" width="48" height="32" rx="5" fill="${N}"/><path d="M24 20v-6h16v6" stroke="${N}" stroke-width="3" fill="none"/><path d="M8 32h48" stroke="${RM}" stroke-width="1.4"/><rect x="28" y="28" width="8" height="8" rx="2" fill="${R}"/>`) },
            { id: 'entrega', svg: tag('Entrega', RD), wide: true }, { id: 'enfoque', svg: tag('Enfoque', '#5B7397'), wide: true }
        ] },
    { n: 'Familia', items: [
            { id: 'casa', svg: svg('0 0 64 64', `<path d="M8 30L32 10l24 20" stroke="${N}" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M14 26v28h36V26" fill="${RM}" stroke="${N}" stroke-width="2"/><rect x="27" y="38" width="10" height="16" rx="1" fill="${R}"/><path d="M32 30c-3-4-9-1-5 3l5 4 5-4c4-4-2-7-5-3z" fill="${RD}"/>`) },
            { id: 'mama-hija', svg: svg('0 0 64 64', `<circle cx="24" cy="18" r="8" fill="${S}"/><path d="M10 54c0-14 6-24 14-24s14 10 14 24z" fill="${R}"/><circle cx="44" cy="30" r="6" fill="${S}"/><path d="M34 56c0-10 4-17 10-17s10 7 10 17z" fill="${B}"/>`) },
            { id: 'familia', svg: pill('Familia', B, N), wide: true }
        ] },
    { n: 'Autocuidado', items: [
            { id: 'vela', svg: svg('0 0 64 64', `<rect x="20" y="28" width="24" height="28" rx="4" fill="${RM}" stroke="${RD}" stroke-width="2"/><path d="M32 28v-6" stroke="${N}" stroke-width="2"/><path d="M32 22c-5-5 0-10 0-14 4 5 6 9 0 14z" fill="${S}" stroke="${SD}" stroke-width="1.2"/>`) },
            { id: 'agua', svg: svg('0 0 64 64', `<path d="M22 10h20l-2 44a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="${BM}" stroke="${N}" stroke-width="2"/><path d="M23 26h18l-1 26a3 3 0 0 1-3 3h-10a3 3 0 0 1-3-3z" fill="${B}"/>`) },
            { id: 'me-cuido', svg: pill('Me cuido', RM, N, R), wide: true }, { id: 'descanso', svg: pill('Hoy descanso', BM, N, B), wide: true }
        ] },
    { n: 'Viajes', items: [
            { id: 'avion', svg: svg('0 0 64 64', `<path d="M6 34l52-20-14 40-10-14-12 8 2-14z" fill="${B}" stroke="${N}" stroke-width="1.8" stroke-linejoin="round"/><path d="M34 40l24-26" stroke="${N}" stroke-width="1.5"/>`) },
            { id: 'maleta', svg: svg('0 0 64 64', `<rect x="12" y="18" width="40" height="36" rx="6" fill="${R}"/><path d="M24 18v-6h16v6" stroke="${N}" stroke-width="3" fill="none"/><path d="M24 26v20M40 26v20" stroke="${RD}" stroke-width="3"/><circle cx="20" cy="58" r="3" fill="${N}"/><circle cx="44" cy="58" r="3" fill="${N}"/>`) },
            { id: 'ubicacion', svg: svg('0 0 64 64', `<path d="M32 58S12 38 12 24a20 20 0 0 1 40 0c0 14-20 34-20 34z" fill="${RD}"/><circle cx="32" cy="24" r="8" fill="${W}"/>`) }
        ] },
    { n: 'Recordatorios', items: [
            { id: 'chinche', svg: svg('0 0 64 64', `<circle cx="32" cy="22" r="14" fill="${R}"/><circle cx="27" cy="17" r="4" fill="${W}" opacity=".6"/><path d="M32 36v22" stroke="${N}" stroke-width="2.5" stroke-linecap="round"/>`) },
            { id: 'campana', svg: svg('0 0 64 64', `<path d="M16 44c4-4 4-10 4-16a12 12 0 0 1 24 0c0 6 0 12 4 16z" fill="${S}" stroke="${SD}" stroke-width="2"/><circle cx="32" cy="50" r="5" fill="${RD}"/><path d="M32 12v4" stroke="${SD}" stroke-width="3" stroke-linecap="round"/>`) },
            { id: 'no-olvidar', svg: tag('No olvidar', RD), wide: true }, { id: 'importante', svg: tag('Importante', N), wide: true }
        ] },
    { n: 'Celebraciones', items: [
            { id: 'confeti', svg: svg('0 0 64 64', `<path d="M10 56l12-34 22 22z" fill="${S}" stroke="${SD}" stroke-width="2" stroke-linejoin="round"/><circle cx="44" cy="14" r="3" fill="${R}"/><circle cx="54" cy="28" r="3" fill="${B}"/><rect x="34" y="22" width="5" height="5" fill="${RD}" transform="rotate(30 36 24)"/><path d="M48 8l4-4M56 18l6-2M40 6v-4" stroke="${N}" stroke-width="2" stroke-linecap="round"/>`) },
            { id: 'lo-logre', svg: pill('¡Lo logré!', N, RM), wide: true }, { id: 'gracias', svg: pill('Gracias', R, N), wide: true }
        ] },
    { n: 'Washi tapes', items: [
            { id: 'washi-puntos', svg: washi(`<rect width="120" height="40" fill="#F2D9DE"/>${[14, 30, 46, 62, 78, 94, 110].map(x => `<circle cx="${x}" cy="20" r="3.5" fill="${R}"/>`).join('')}`), wide: true },
            { id: 'washi-rayas', svg: washi(`<rect width="120" height="40" fill="#D6E0EE"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<path d="M${i * 13} 6l10 30" stroke="${B}" stroke-width="4"/>`).join('')}`), wide: true },
            { id: 'washi-flores', svg: washi(`<rect width="120" height="40" fill="${RM}"/>${[18, 48, 78, 108].map(x => `<g transform="translate(${x} 20)">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="3" ry="5" cy="-4" fill="${R}" transform="rotate(${a})"/>`).join('')}<circle r="2" fill="${N}"/></g>`).join('')}`), wide: true },
            { id: 'washi-arena', svg: washi(`<rect width="120" height="40" fill="#F1E5D6"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<rect x="${i * 10}" y="0" width="5" height="40" fill="${S}"/>`).join('')}`), wide: true },
            { id: 'washi-azul', svg: washi(`<rect width="120" height="40" fill="${N}"/>${[10, 34, 58, 82, 106].map(x => `<path d="M${x} 20l3-6 3 6-3 6z" fill="${R}"/>`).join('')}`), wide: true }
        ] },
    { n: 'Banderitas', items: [{ id: 'bandera-rosa', svg: flag(R) }, { id: 'bandera-azul', svg: flag(B) }, { id: 'bandera-arena', svg: flag(S) }, { id: 'bandera-navy', svg: flag(N) }] },
    { n: 'Etiquetas', items: [{ id: 'urgente', svg: tag('Urgente', '#B5646F'), wide: true }, { id: 'hecho', svg: tag('Hecho', '#6E9B83'), wide: true }, { id: 'pendiente', svg: tag('Pendiente', SD), wide: true }, { id: 'idea', svg: tag('Idea', '#5B7397'), wide: true }] },
    { n: 'Marcadores', items: [{ id: 'marcador-rosa', svg: marker(R), wide: true }, { id: 'marcador-azul', svg: marker(B), wide: true }, { id: 'marcador-arena', svg: marker(S), wide: true }, { id: 'marcador-verde', svg: marker(G), wide: true }] }
];
export const STICKERS = STICKER_CATS.flatMap(c => c.items);
export const stickerById = (id) => STICKERS.find(s => s.id === id);
