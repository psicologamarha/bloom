/**
 * BLOOM 2027 · Modelo de datos
 *
 * Cada usuaria tiene un conjunto de "documentos". Cada documento es una pieza
 * independiente de su agenda que se guarda y se sincroniza por separado:
 *
 *   settings            Ajustes (tema de color, módulos activos, Google conectado)
 *   year                Mi año 2027 (visión y metas globales)
 *   month:2027-01       Planeando mi mes (módulos A a I, hábitos, finanzas, cierre)
 *   week:2027-W01       Mi semana (tres prioridades, tareas)
 *   day:2027-01-05      Página diaria (hábitos marcados, horas, pendientes…)
 *   studio              Mi Estudio Creativo (piezas, banco de ideas)
 *   stickers:<vista>    Stickers pegados en una página
 *
 * Así, escribir en el 5 de enero nunca toca el 6 de enero, y dos dispositivos
 * solo entran en conflicto si editan exactamente la misma página.
 */
export const YEAR = 2027;
export const SCHEMA_VERSION = 1;
/* ---------- Valores iniciales ---------- */
export const AREA_IDS = ['dios', 'pers', 'salud', 'fam', 'hogar', 'prof', 'neg', 'fin', 'sue'];
const FIXED = ['Vivienda', 'Servicios', 'Alimentación', 'Transporte', 'Educación', 'Salud', 'Suscripciones', 'Obligaciones financieras', 'Otros gastos'];
const SAVINGS = ['Fondo de emergencia', 'Viajes', 'Educación', 'Vivienda', 'Vehículo', 'Otros objetivos'];
export function newMonth() {
    const goals = Object.fromEntries(AREA_IDS.map(a => [a, { obj: '', actions: '', due: '', progress: 0, status: 'Por iniciar', yearGoalId: null }]));
    return {
        focus: { theme: '', cultivate: '', improve: '', release: '', prioritize: '', declaration: '', myPromise: '' },
        goals,
        habits: ['', '', '', '', '', '', '', ''],
        growth: ['', '', ''],
        pri: { p1: '', p2: '', p3: '', decision: '', postponed: '', forMe: '' },
        fin: {
            income: [{ src: '', exp: '', date: '', rec: '', status: 'Pendiente' }],
            fixed: FIXED.map(cat => ({ cat, budget: '', real: '' })),
            variable: [], debts: [],
            savings: SAVINGS.map(name => ({ name, goal: '', saved: '' })),
            bills: []
        },
        family: [], work: [],
        reading: { book: '', read: '', total: '', start: '', end: '', quote: '' },
        prep: [false, false, false, false, false, false],
        closing: { achieved: '', learned: '', grateful: '', hard: '', habit: '', bloomed: '', adjust: '', money: '', carry: '' }
    };
}
export function newDay() {
    return { habits: [false, false, false, false, false, false, false, false], growth: [false, false, false], purchases: [], incomes: [], todos: [], priority: '', hours: {}, feel: '', grateful: '', intention: '' };
}
export function newSettings() { return { theme: 'original', studioEnabled: true, googleConnected: false, name: '' }; }
/* ---------- Ayudas de fechas ---------- */
const pad = (n) => String(n).padStart(2, '0');
export const monthId = (m) => `month:${YEAR}-${pad(m + 1)}`;
export const dayId = (m, d) => `day:${YEAR}-${pad(m + 1)}-${pad(d)}`;
export const daysInMonth = (m) => new Date(YEAR, m + 1, 0).getDate();
/** Valida que un id de documento sea uno de los permitidos (mismo patrón que la base de datos). */
export function isValidDocId(id) {
    return /^(settings|year|studio|prep|cycle|shopping|notes|prayers|projects|month:2027-(0[1-9]|1[0-2])|week:2027-W(0[1-9]|[1-4]\d|5[0-3])|day:2027-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])|stickers:[a-z0-9-]{1,40})$/.test(id);
}
/* ---------- Cálculos (los mismos que verifica el control de calidad) ---------- */
const n = (v) => Number(v) || 0;
/** Totales del mes. `daily` = compras del día a día registradas en las páginas diarias. */
export function financeTotals(f, daily = 0, dailyIn = 0) {
    const sum = (a, k) => a.reduce((t, x) => t + n(x[k]), 0);
    const incomeExpected = sum(f.income, 'exp'), incomeReceived = sum(f.income, 'rec') + dailyIn;
    const fixedBudget = sum(f.fixed, 'budget'), fixedReal = sum(f.fixed, 'real');
    const varBudget = sum(f.variable, 'budget'), varReal = sum(f.variable, 'real');
    const debtPaid = f.debts.filter(d => d.paid).reduce((t, d) => t + n(d.fee), 0);
    const saved = sum(f.savings, 'saved');
    const dailyBudget = n(f.dailyBudget);
    const expenses = fixedReal + varReal + daily;
    return {
        incomeExpected, incomeReceived, fixedBudget, fixedReal, varBudget, varReal, dailyReal: daily, dailyBudget, dailyIncome: dailyIn, plannedReceived: incomeReceived - dailyIn, debtPaid, saved, expenses,
        available: incomeReceived - expenses - debtPaid - saved,
        budgetDiff: (fixedBudget + varBudget + dailyBudget) - expenses
    };
}
export function habitProgress(month, m, getDay) {
    const days = daysInMonth(m);
    const per = month.habits.map((name, i) => {
        let done = 0;
        for (let d = 1; d <= days; d++)
            if (getDay(dayId(m, d))?.habits[i])
                done++;
        return { name, done, pct: done / days };
    });
    const named = per.filter(h => h.name.trim());
    return { per, total: named.length ? named.reduce((t, h) => t + h.done, 0) / (named.length * days) : 0 };
}
/** Completa campos que falten en documentos guardados con versiones anteriores. */
export function normalizeMonth(x) {
    const base = newMonth();
    for (const k of Object.keys(base))
        if (x[k] === undefined)
            x[k] = base[k];
    return x;
}
export function normalizeDay(x) {
    const base = newDay();
    for (const k of Object.keys(base))
        if (x[k] === undefined)
            x[k] = base[k];
    return x;
}
/** Cumplimiento de "Trabajando en mí" en el mes. */
export function growthProgress(month, m, getDay) {
    const days = daysInMonth(m);
    const per = month.growth.map((name, i) => { let done = 0; for (let d = 1; d <= days; d++)
        if (getDay(dayId(m, d))?.growth?.[i])
            done++; return { name, done, pct: done / days }; });
    const named = per.filter(h => h.name.trim());
    return { per, total: named.length ? named.reduce((t, h) => t + h.done, 0) / (named.length * days) : 0 };
}
/** Compras del día a día de un mes, leídas de sus páginas diarias. */
export function dailySpend(m, getDay) {
    const items = [];
    for (let d = 1; d <= daysInMonth(m); d++)
        (getDay(dayId(m, d))?.purchases ?? []).forEach(p => { const a = Number(p.amount) || 0; if (a || p.what.trim())
            items.push({ d, what: p.what, amount: a, cat: p.cat || 'Otros' }); });
    const byCat = new Map();
    items.forEach(i => byCat.set(i.cat, (byCat.get(i.cat) || 0) + i.amount));
    return { items, total: items.reduce((t, i) => t + i.amount, 0), byCat: [...byCat].sort((a, b) => b[1] - a[1]) };
}
/** Ingresos recibidos día a día en un mes (pagos diarios, quincenas, clientes…). */
export function dailyIncome(m, getDay) {
    const items = [];
    for (let d = 1; d <= daysInMonth(m); d++)
        (getDay(dayId(m, d))?.incomes ?? []).forEach(p => { const a = Number(p.amount) || 0; if (a || p.what.trim())
            items.push({ d, what: p.what, amount: a, src: p.src || 'Otro' }); });
    const bySrc = new Map();
    items.forEach(i => bySrc.set(i.src, (bySrc.get(i.src) || 0) + i.amount));
    const q1 = items.filter(i => i.d <= 15).reduce((t, i) => t + i.amount, 0), total = items.reduce((t, i) => t + i.amount, 0);
    return { items, total, q1, q2: total - q1, bySrc: [...bySrc].sort((a, b) => b[1] - a[1]) };
}
