/* Código compartilhado entre o site (index.html) e o painel (admin/index.html) */

// ===== CONFIGURAÇÃO — troque aqui =====
const CONFIG = {
  NAME: "lola Azarias nail designer",
  WHATS: "5516981921475", // 55 + DDD + número
  PIN: "lolaadmindesigner"             // senha do /admin (provisória, veja o aviso no README)
};
// ======================================

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const P = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${P(d.getMonth() + 1)}-${P(d.getDate())}`;
const toMin = t => { const [a, b] = t.split(":"); return +a * 60 + +b; };
const fmt = m => `${P(Math.floor(m / 60))}:${P(m % 60)}`;
const parseDay = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const fdate = k => { const d = parseDay(k); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; };

/* ---------- Camada de dados ----------
   HOJE: localStorage (os dados ficam só no navegador de quem abriu).
   DEPOIS: trocar apenas load() e save() por um banco online (ex.: Supabase);
   o resto do código não muda. */
const DEFAULTS = { duration: 60, blockedDays: [], blockedSlots: {}, weekly: {} };
for (let i = 0; i < 7; i++) DEFAULTS.weekly[i] = { on: i >= 1 && i <= 5, start: "09:00", end: "18:00" };

const Store = {
  KEY: "agenda_v1",
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) return Object.assign(structuredClone(DEFAULTS), JSON.parse(raw));
    } catch (e) { /* storage indisponível: usa o padrão */ }
    return structuredClone(DEFAULTS);
  },
  save(S) {
    try { localStorage.setItem(this.KEY, JSON.stringify(S)); } catch (e) { /* ignora */ }
  }
};

/* ---------- Regras de horário ---------- */
// Todos os horários do dia, conforme a configuração semanal.
function allSlots(S, k) {
  const w = S.weekly[parseDay(k).getDay()], out = [];
  if (!w || !w.on || !S.duration) return out;
  for (let t = toMin(w.start); t + S.duration <= toMin(w.end); t += S.duration) out.push(fmt(t));
  return out;
}
// "free" = livre | "past" = já passou | "blocked" = bloqueado pela admin
function slotState(S, k, s) {
  if (S.blockedDays.includes(k) || (S.blockedSlots[k] || []).includes(s)) return "blocked";
  const now = new Date(), today = iso(now);
  if (k < today) return "past";
  if (k === today && toMin(s) <= now.getHours() * 60 + now.getMinutes()) return "past";
  return "free";
}

/* ---------- Calendário ----------
   info(k) devolve { disabled, cls } para cada dia. */
function calendarHTML(cal, sel, info) {
  const first = new Date(cal.y, cal.m, 1), n = new Date(cal.y, cal.m + 1, 0).getDate(), today = iso(new Date());
  let h = `<div class="calhead"><button class="ic" data-a="prev" aria-label="Mês anterior">‹</button><strong>${MESES[cal.m]} ${cal.y}</strong><button class="ic" data-a="next" aria-label="Próximo mês">›</button></div><div class="grid">`;
  h += DIAS.map(d => `<span class="dow">${d}</span>`).join("");
  for (let i = 0; i < first.getDay(); i++) h += "<span></span>";
  for (let d = 1; d <= n; d++) {
    const k = `${cal.y}-${P(cal.m + 1)}-${P(d)}`, i = info(k);
    const cls = [i.cls || "", k === sel ? "sel" : "", k === today ? "today" : ""].join(" ");
    h += `<button class="day ${cls}" ${i.disabled ? "disabled" : ""} data-a="day" data-k="${k}">${d}</button>`;
  }
  return h + "</div>";
}
function shiftMonth(cal, dir) {
  cal.m += dir;
  if (cal.m < 0) { cal.m = 11; cal.y--; }
  if (cal.m > 11) { cal.m = 0; cal.y++; }
}
