/* =========================================================================
   Note Spese — versione collegata a Supabase (schema "master")
   -------------------------------------------------------------------------
   Modello a ledger invariato: i bilanci sono una VISTA calcolata lato client
   da spese e saldi. Rispetto alla versione locale e' cambiato SOLO il modulo
   `store`: ora legge/scrive su Supabase invece che su localStorage, quindi i
   dati sono condivisi tra tutti i dispositivi.
   ========================================================================= */

/* ------------------------------ CONFIG ---------------------------------- */
const SUPABASE_URL = 'https://asffddnjsipddojpgawx.supabase.co';
// Chiave pubblica (anon): e' pensata per stare nel client, non e' un segreto.
// La protezione dei dati arriva con RLS + auth (fase successiva).
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmZkZG5qc2lwZGRvanBnYXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDU4MTEsImV4cCI6MjA5OTE4MTgxMX0.E4KCJ9reb-VukldGuBD-YM_KoHodjKvonPzYh3mCF3g';
const DB_SCHEMA = 'master';

let db; // client Supabase, creato al boot
let session = null; // sessione utente (null = non loggato)
let isAdmin = false; // l'utente corrente è amministratore?
function currentEmail() { return (session && session.user && session.user.email) || ''; }

/* ------------------------------ STORE ----------------------------------- */
/* Tiene una copia in memoria (`_state`) usata dal rendering (sincrono).
   Le mutazioni scrivono su Supabase e poi ricaricano la copia.
   La lettura avviene con UNA sola RPC (`bootstrap`) invece di 7 round trip,
   e l'ultimo stato viene messo in cache locale per un'apertura istantanea. */
const CACHE_KEY = 'note-spese/cache-v1';
const store = {
  _state: { groups: [] },
  groups() { return this._state.groups; },
  group(id) { return this._state.groups.find(g => g.id === id); },

  // Mappa la risposta della RPC nel formato usato dalla UI
  _apply(payload) {
    this._state.groups = (payload.groups || []).map(gr => ({
      id: gr.id,
      name: gr.name,
      imageUrl: gr.image_url || null,
      createdAt: gr.created_at,
      members: (gr.members || []).map(x => ({ id: x.id, name: x.name })),
      expenses: (gr.expenses || []).map(x => ({
        id: x.id,
        payerId: x.payer_id,
        amountCents: x.amount_cents,
        description: x.description,
        createdAt: x.created_at,
        splits: (x.splits || []).map(sh => ({ memberId: sh.member_id, shareCents: sh.share_cents })),
      })),
      settlements: (gr.settlements || []).map(x => ({
        id: x.id,
        fromId: x.from_member,
        toId: x.to_member,
        amountCents: x.amount_cents,
        createdAt: x.created_at,
      })),
    }));
  },

  // Carica lo stato dalla cache locale (apertura immediata, senza rete)
  loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const c = JSON.parse(raw);
      if (!c || c.email !== currentEmail()) return false; // cache di un altro utente
      this._state.groups = c.groups || [];
      isAdmin = !!c.isAdmin;
      return this._state.groups.length > 0;
    } catch (_) { return false; }
  },
  saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        email: currentEmail(), isAdmin, groups: this._state.groups, at: Date.now(),
      }));
    } catch (_) {}
  },
  clearCache() { try { localStorage.removeItem(CACHE_KEY); } catch (_) {} },

  // UNA chiamata: permessi + tutti i dati. Ritorna true se l'utente è ammesso.
  async refresh() {
    const { data, error } = await db.rpc('bootstrap');
    if (error) throw error;
    const payload = data || {};
    isAdmin = !!payload.is_admin;
    if (!payload.is_allowed) { this._state.groups = []; this.clearCache(); return false; }
    this._apply(payload);
    this.saveCache();
    return true;
  },

  async addGroup(name, memberNames) {
    const { data: gr, error } = await db.from('groups').insert({ name: name.trim() }).select().single();
    if (error) throw error;
    const rows = memberNames.map(n => ({ group_id: gr.id, name: n.trim() }));
    const { error: e2 } = await db.from('members').insert(rows);
    if (e2) throw e2;
    await this.refresh();
    return this.group(gr.id);
  },

  async addMember(groupId, name) {
    const { error } = await db.from('members').insert({ group_id: groupId, name: name.trim() });
    if (error) throw error;
    await this.refresh();
  },

  async addExpense(groupId, { description, amountCents, payerId, participantIds, createdAt }) {
    // Scrittura SOLO via RPC: spesa + quote in un'unica transazione (invariante).
    const { error } = await db.rpc('add_expense', {
      p_group_id: groupId,
      p_payer_id: payerId,
      p_amount_cents: amountCents,
      p_description: description,
      p_participant_ids: participantIds,
      p_created_at: createdAt || null,
    });
    if (error) throw error;
    await this.refresh();
  },

  async updateExpense(expenseId, { description, amountCents, payerId, participantIds, createdAt }) {
    // Modifica atomica via RPC: aggiorna la spesa e ricalcola le quote (stesso id).
    const { error } = await db.rpc('update_expense', {
      p_expense_id: expenseId,
      p_payer_id: payerId,
      p_amount_cents: amountCents,
      p_description: description,
      p_participant_ids: participantIds,
      p_created_at: createdAt || null,
    });
    if (error) throw error;
    await this.refresh();
  },

  async deleteExpense(groupId, expenseId) {
    const { error } = await db.from('expenses').delete().eq('id', expenseId);
    if (error) throw error;
    await this.refresh();
  },

  async addSettlement(groupId, { fromId, toId, amountCents }) {
    const { error } = await db.from('settlements').insert({
      group_id: groupId, from_member: fromId, to_member: toId, amount_cents: amountCents,
    });
    if (error) throw error;
    await this.refresh();
  },

  async deleteSettlement(settlementId) {
    const { error } = await db.from('settlements').delete().eq('id', settlementId);
    if (error) throw error;
    await this.refresh();
  },

  /* --- Gestione accessi (solo admin; la RLS blocca gli altri) --- */
  async listAllowed() {
    const { data, error } = await db.from('allowed_emails').select('email,is_admin,enabled').order('email');
    if (error) throw error;
    return data;
  },
  async addAllowed(email) {
    const { error } = await db.from('allowed_emails').insert({ email: email.trim().toLowerCase(), enabled: true, is_admin: false });
    if (error) throw error;
  },
  async setEnabled(email, enabled) {
    const { error } = await db.from('allowed_emails').update({ enabled }).eq('email', email);
    if (error) throw error;
  },
  async removeAllowed(email) {
    const { error } = await db.from('allowed_emails').delete().eq('email', email);
    if (error) throw error;
  },

  async deleteMember(memberId) {
    const { error } = await db.from('members').delete().eq('id', memberId);
    if (error) throw error; // spesso FK: la persona ha spese/saldi collegati
    await this.refresh();
  },

  async renameGroup(groupId, name) {
    const { error } = await db.from('groups').update({ name: name.trim() }).eq('id', groupId);
    if (error) throw error;
    await this.refresh();
  },

  async deleteGroup(groupId) {
    // cascade su membri/spese/quote/saldi (FK on delete cascade)
    const { error } = await db.from('groups').delete().eq('id', groupId);
    if (error) throw error;
    await this.refresh();
  },

  async setGroupImage(groupId, dataUrl) {
    const { error } = await db.from('groups').update({ image_url: dataUrl }).eq('id', groupId);
    if (error) throw error;
    await this.refresh();
  },
};

function groupBy(rows, key) {
  const out = {};
  for (const r of rows) (out[r[key]] ||= []).push(r);
  return out;
}

/* ------------------------------ MONEY MATH ------------------------------ */
function parseEuroToCents(str) {
  if (typeof str !== 'string') str = String(str ?? '');
  const clean = str.replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(clean);
  if (!isFinite(val) || val <= 0) return null;
  return Math.round(val * 100);
}
function formatCents(cents) {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}
// Anteprima lato client dello split (il calcolo "vero" e' lato DB nella RPC).
function splitEqual(total, ids) {
  const n = ids.length;
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return ids.map((id, i) => ({ memberId: id, shareCents: base + (i < rem ? 1 : 0) }));
}
function computeBalances(g) {
  const net = {};
  g.members.forEach(m => { net[m.id] = 0; });
  for (const e of g.expenses) {
    if (net[e.payerId] === undefined) continue;
    net[e.payerId] += e.amountCents;
    for (const s of e.splits) if (net[s.memberId] !== undefined) net[s.memberId] -= s.shareCents;
  }
  for (const s of g.settlements) {
    if (net[s.fromId] !== undefined) net[s.fromId] += s.amountCents;
    if (net[s.toId] !== undefined) net[s.toId] -= s.amountCents;
  }
  return net;
}
// Totali del gruppo: quanto ha anticipato ciascuno (paid) e quanto gli e'
// costato (share), piu' il totale delle spese. I rimborsi NON contano: sono
// giri di denaro, non spesa nuova.
function computeTotals(g) {
  const paid = {}, share = {};
  g.members.forEach(m => { paid[m.id] = 0; share[m.id] = 0; });
  let total = 0;
  for (const e of g.expenses) {
    total += e.amountCents;
    if (paid[e.payerId] !== undefined) paid[e.payerId] += e.amountCents;
    for (const s of e.splits) if (share[s.memberId] !== undefined) share[s.memberId] += s.shareCents;
  }
  return { paid, share, total };
}

function simplifyDebts(net) {
  const creditors = [], debtors = [];
  for (const [id, v] of Object.entries(net)) {
    if (v > 0) creditors.push({ id, amt: v });
    else if (v < 0) debtors.push({ id, amt: -v });
  }
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);
  const res = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    res.push({ fromId: debtors[i].id, toId: creditors[j].id, amountCents: pay });
    debtors[i].amt -= pay; creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return res;
}

/* -------------------------------- STATE UI ------------------------------- */
const view = { screen: 'home', groupId: null, tab: 'bilanci' };
const app = document.getElementById('app');

function nameOf(g, id) { return (g.members.find(m => m.id === id) || {}).name || '—'; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function relDate(ts) { return new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }); }
// Date <-> valore di input[type=date] (YYYY-MM-DD), in ora locale.
function toDateInput(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
// Conserva l'ora originale della spesa (se c'era), cambiando solo il giorno.
function fromDateInput(val, originalIso) {
  if (!val) return null;
  const [y, m, d] = val.split('-').map(Number);
  const base = originalIso ? new Date(originalIso) : new Date();
  const out = new Date(y, m - 1, d, base.getHours(), base.getMinutes(), base.getSeconds());
  return out.toISOString();
}
function avatarHtml(g, cls) {
  return g.imageUrl
    ? `<span class="${cls} has-img"><img src="${g.imageUrl}" alt=""></span>`
    : `<span class="${cls}">${esc((g.name[0] || '?').toUpperCase())}</span>`;
}

/* -------------------------------- RENDER --------------------------------- */
function render() {
  if (view.screen === 'home') renderHome();
  else renderGroup();
}

function renderHome() {
  const groups = store.groups();
  const list = groups.length
    ? `<div class="section"><div class="card">${groups.map(g => {
        const open = simplifyDebts(computeBalances(g)).length;
        return `<button class="group-card" data-group="${g.id}">
          ${avatarHtml(g, 'avatar')}
          <span class="gc-body">
            <span class="gc-name">${esc(g.name)}</span>
            <span class="gc-meta">${g.members.length} persone · ${open ? open + ' da saldare' : 'tutto in pari'}</span>
          </span>
          <span class="chev">›</span>
        </button>`;
      }).join('')}</div></div>`
    : `<div class="empty">
        <div class="big">🧾</div>
        <p><strong>Nessun gruppo ancora.</strong></p>
        <p>Crea un gruppo per iniziare a segnare le spese.</p>
      </div>`;

  app.innerHTML = `
    <header class="topbar">
      <h1>Note Spese</h1>
      ${isAdmin ? '<button class="iconbtn" id="access" aria-label="Gestione accessi">👥</button>' : ''}
      <button class="iconbtn" id="reload" aria-label="Aggiorna">↻</button>
      <button class="iconbtn" id="logout" aria-label="Esci">⏻</button>
    </header>
    ${list}
    <div class="fab">
      <button class="btn" id="new-group">Nuovo gruppo</button>
    </div>`;

  document.getElementById('new-group').onclick = openGroupSheet;
  document.getElementById('reload').onclick = reload;
  document.getElementById('logout').onclick = doLogout;
  if (isAdmin) document.getElementById('access').onclick = openAccessSheet;
  app.querySelectorAll('.group-card').forEach(b => {
    const g = store.group(b.dataset.group);
    b.onclick = () => {
      if (Date.now() - lastLongPress < 700) return; // ignora il click dopo un long-press
      view.screen = 'group'; view.groupId = b.dataset.group; render();
    };
    attachLongPress(b, () => {
      actionSheet(g.name, [
        { label: 'Impostazioni gruppo', onClick: () => openGroupSettings(g) },
        { label: 'Rimuovi gruppo', danger: true, onClick: async () => {
          const ok = await confirmDialog({ title: `Rimuovere "${g.name}"?`, message: 'Verranno eliminate tutte le sue spese e i saldi. Non è reversibile.', confirmLabel: 'Rimuovi', danger: true });
          if (!ok) return;
          try { await store.deleteGroup(g.id); view.screen = 'home'; render(); }
          catch (e) { toast(errMsg(e)); }
        } },
      ]);
    });
  });
}

function renderGroup() {
  const g = store.group(view.groupId);
  if (!g) { view.screen = 'home'; return render(); }
  const net = computeBalances(g);
  const settlements = simplifyDebts(net);

  const balances = g.members.map(m => {
    const v = net[m.id];
    const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero';
    const label = v > 0 ? 'a credito' : v < 0 ? 'a debito' : 'in pari';
    const shown = v === 0 ? formatCents(0) : (v > 0 ? '+' : '−') + formatCents(Math.abs(v)).replace('€', '').trim() + ' €';
    return `<div class="balance-row">
      <span class="name">${esc(m.name)}</span>
      <span class="leader"></span>
      <span class="amt ${cls}">${shown}</span>
      <span class="status">${label}</span>
    </div>`;
  }).join('');

  // --- TOTALI: quanto ha anticipato ciascuno e quanto gli è costato ---
  const tot = computeTotals(g);
  const totalsRows = g.members.map(m => `<div class="tot-row">
      <span class="tot-name">${esc(m.name)}</span>
      <span class="tot-num">${formatCents(tot.paid[m.id])}</span>
      <span class="tot-num quota">${formatCents(tot.share[m.id])}</span>
    </div>`).join('');
  const totalsPanel = `
    <div class="tot-head">
      <span class="tot-name"></span>
      <span class="tot-num">Ha pagato</span>
      <span class="tot-num">Sua quota</span>
    </div>
    ${totalsRows}
    <div class="tot-row grand">
      <span class="tot-name">Totale spese</span>
      <span class="tot-num">${formatCents(tot.total)}</span>
      <span class="tot-num quota">${g.expenses.length} ${g.expenses.length === 1 ? 'voce' : 'voci'}</span>
    </div>`;

  const settleList = settlements.length
    ? settlements.map((s, idx) => `<div class="settle-row">
        <span class="flow">
          <span class="who">${esc(nameOf(g, s.fromId))}</span>
          <span class="arrow">→</span>
          <span class="who">${esc(nameOf(g, s.toId))}</span>
          <span class="sum">${formatCents(s.amountCents)}</span>
        </span>
        <button class="chip-btn" data-settle="${idx}">Salda</button>
      </div>`).join('')
    : `<div class="settle-empty">Tutti in pari 🎉</div>`;

  // Movimenti = spese + rimborsi, in ordine cronologico (piu' recenti in alto)
  const movimenti = [
    ...g.expenses.map(e => ({ kind: 'exp', at: e.createdAt, e })),
    ...g.settlements.map(s => ({ kind: 'set', at: s.createdAt, s })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  const expenses = movimenti.length
    ? movimenti.map(it => it.kind === 'exp'
        ? `<div class="expense-row longpress" data-exp="${it.e.id}">
            <span class="exp-icon">🧾</span>
            <span class="exp-body">
              <span class="exp-desc">${esc(it.e.description || 'Spesa')}</span>
              <span class="exp-meta">${esc(nameOf(g, it.e.payerId))} ha pagato · ${it.e.splits.length} persone · ${relDate(it.e.createdAt)}</span>
            </span>
            <span class="exp-amt">${formatCents(it.e.amountCents)}</span>
          </div>`
        : `<div class="expense-row is-settlement longpress" data-set="${it.s.id}">
            <span class="exp-icon">✓</span>
            <span class="exp-body">
              <span class="exp-desc">${esc(nameOf(g, it.s.fromId))} ha saldato ${esc(nameOf(g, it.s.toId))}</span>
              <span class="exp-meta">Rimborso · ${relDate(it.s.createdAt)}</span>
            </span>
            <span class="exp-amt">${formatCents(it.s.amountCents)}</span>
          </div>`
      ).join('')
    : `<div class="settle-empty">Ancora nessun movimento.</div>`;

  app.innerHTML = `
    <header class="topbar">
      <button class="iconbtn" id="back" aria-label="Indietro">‹</button>
      <button class="group-head" id="group-title">
        ${avatarHtml(g, 'avatar-sm')}
        <span class="group-head-txt">
          <span class="group-head-name">${esc(g.name)}</span>
          <span class="sub">${g.members.length} persone</span>
        </span>
      </button>
      <button class="iconbtn" id="group-reload" aria-label="Aggiorna">↻</button>
      <button class="iconbtn" id="group-settings" aria-label="Impostazioni gruppo">⋯</button>
    </header>

    <div class="section">
      <div class="section-title">Chi salda chi</div>
      <div class="card">${settleList}</div>
    </div>

    <div class="section">
      <div class="tabs" role="tablist">
        <button class="tab ${view.tab === 'totali' ? '' : 'active'}" data-tab="bilanci" role="tab">Bilanci</button>
        <button class="tab ${view.tab === 'totali' ? 'active' : ''}" data-tab="totali" role="tab">Totali</button>
      </div>
      <div class="card">${view.tab === 'totali' ? totalsPanel : balances}</div>
    </div>

    <div class="section">
      <div class="section-title">Spese</div>
      <div class="card">${expenses}</div>
    </div>

    <div class="fab">
      <button class="btn" id="new-expense">Aggiungi spesa</button>
    </div>`;

  document.getElementById('back').onclick = () => { view.screen = 'home'; render(); };
  app.querySelectorAll('[data-tab]').forEach(b => {
    b.onclick = () => { view.tab = b.dataset.tab; render(); };
  });
  document.getElementById('group-title').onclick = () => openGroupSettings(g);
  document.getElementById('group-settings').onclick = () => openGroupSettings(g);
  document.getElementById('group-reload').onclick = reload;
  document.getElementById('new-expense').onclick = () => openExpenseSheet(g);

  // Long-press (o tasto destro) su una spesa -> menù azioni
  app.querySelectorAll('[data-exp]').forEach(row => {
    attachLongPress(row, () => {
      const e = g.expenses.find(x => x.id === row.dataset.exp);
      if (!e) return;
      actionSheet(e.description || 'Spesa', [
        { label: 'Modifica spesa', onClick: () => openExpenseSheet(g, e) },
        { label: 'Elimina spesa', danger: true, onClick: async () => {
          const ok = await confirmDialog({ title: 'Eliminare la spesa?', message: `${e.description || 'Spesa'} · ${formatCents(e.amountCents)}`, confirmLabel: 'Elimina', danger: true });
          if (!ok) return;
          try { await store.deleteExpense(g.id, e.id); render(); }
          catch (err) { toast(errMsg(err)); }
        } },
      ]);
    });
  });

  // Long-press su un rimborso -> elimina (annulla un "Salda")
  app.querySelectorAll('[data-set]').forEach(row => {
    attachLongPress(row, () => {
      const s = g.settlements.find(x => x.id === row.dataset.set);
      if (!s) return;
      const who = `${nameOf(g, s.fromId)} ha saldato ${nameOf(g, s.toId)}`;
      actionSheet('Rimborso', [
        { label: 'Elimina rimborso', danger: true, onClick: async () => {
          const ok = await confirmDialog({ title: 'Eliminare il rimborso?', message: `${who} · ${formatCents(s.amountCents)}`, confirmLabel: 'Elimina', danger: true });
          if (!ok) return;
          try { await store.deleteSettlement(s.id); render(); }
          catch (err) { toast(errMsg(err)); }
        } },
      ]);
    });
  });

  app.querySelectorAll('[data-settle]').forEach(b => {
    b.onclick = async () => {
      const s = settlements[+b.dataset.settle];
      const who = `${nameOf(g, s.fromId)} → ${nameOf(g, s.toId)} · ${formatCents(s.amountCents)}`;
      const ok = await confirmDialog({ title: 'Segnare come saldato?', message: who, confirmLabel: 'Salda' });
      if (!ok) return;
      try { await store.addSettlement(g.id, s); render(); }
      catch (err) { toast(errMsg(err)); }
    };
  });
}

/* --------------------------------- SHEET --------------------------------- */
function openSheet(html) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div>${html}</div>`;
  scrim.addEventListener('click', e => { if (e.target === scrim) scrim.remove(); });
  document.body.appendChild(scrim);
  return scrim;
}

/* ---- Long-press (mobile) + tasto destro (desktop) ---- */
let lastLongPress = 0;
function attachLongPress(el, cb) {
  let timer = null, sx = 0, sy = 0;
  const fire = () => { timer = null; lastLongPress = Date.now(); if (navigator.vibrate) navigator.vibrate(12); cb(); };
  const start = (x, y) => { sx = x; sy = y; timer = setTimeout(fire, 500); };
  const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  el.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  el.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) cancel();
  }, { passive: true });
  el.addEventListener('touchend', cancel);
  el.addEventListener('touchcancel', cancel);
  el.addEventListener('contextmenu', e => { e.preventDefault(); lastLongPress = Date.now(); cb(); });
}

/* ---- Menù azioni (action sheet) ---- */
function actionSheet(title, actions) {
  const sheet = openSheet(`
    <h2>${esc(title)}</h2>
    <div class="menu">
      ${actions.map((a, i) => `<button class="menu-item ${a.danger ? 'danger' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}
      <button class="menu-item cancel" data-cancel>Annulla</button>
    </div>`);
  sheet.querySelectorAll('.menu-item').forEach(b => {
    b.onclick = () => { sheet.remove(); if (!b.hasAttribute('data-cancel')) actions[+b.dataset.i].onClick(); };
  });
}

/* ---- Conferma in-app (sostituisce confirm(), inaffidabile su iOS) ---- */
function confirmDialog({ title, message, confirmLabel = 'Conferma', danger = false }) {
  return new Promise(resolve => {
    let done = false;
    const finish = v => { if (done) return; done = true; sheet.remove(); resolve(v); };
    const sheet = openSheet(`
      <h2>${esc(title)}</h2>
      ${message ? `<p style="color:var(--muted);font-size:14.5px;margin-bottom:18px">${esc(message)}</p>` : ''}
      <div class="sheet-actions">
        <button class="btn ghost" data-no>Annulla</button>
        <button class="btn ${danger ? 'danger' : ''}" data-yes>${esc(confirmLabel)}</button>
      </div>`);
    sheet.querySelector('[data-no]').onclick = () => finish(false);
    sheet.querySelector('[data-yes]').onclick = () => finish(true);
    sheet.addEventListener('click', e => { if (e.target === sheet) finish(false); });
  });
}

/* ---- Toast (sostituisce alert()) ---- */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2800);
}

/* ---- Gestione membri del gruppo ---- */
/* ---- Impostazioni gruppo: foto, nome, membri ---- */
function openGroupSettings(g0) {
  const gid = g0.id;
  const build = () => {
    const g = store.group(gid);
    if (!g) return;
    const photoInner = g.imageUrl ? `<img src="${g.imageUrl}" alt="">` : esc((g.name[0] || '?').toUpperCase());
    const sheet = openSheet(`
      <div class="gs-photo-wrap">
        <button class="gs-photo" id="gs-photo" aria-label="Cambia foto">${photoInner}</button>
        <div class="gs-photo-actions">
          <button class="linkbtn" id="gs-change">Cambia foto</button>
          ${g.imageUrl ? '<button class="linkbtn danger" id="gs-remove">Rimuovi</button>' : ''}
        </div>
      </div>
      <div class="field">
        <label>Nome del gruppo</label>
        <div class="inline-add">
          <input type="text" id="gs-name" value="${esc(g.name)}" autocomplete="off">
          <button class="add-mini" id="gs-rename" title="Salva nome">✓</button>
        </div>
      </div>
      <div class="field">
        <label>Membri</label>
        <div class="member-list" id="gs-members"></div>
        <div class="inline-add" style="margin-top:10px">
          <input type="text" id="gs-newm" placeholder="Aggiungi persona" autocomplete="off">
          <button class="add-mini" id="gs-addm">+</button>
        </div>
      </div>
      <div class="err" id="gs-err" hidden></div>
      <div class="sheet-actions"><button class="btn" id="gs-done" style="flex:1">Fatto</button></div>`);

    const err = sheet.querySelector('#gs-err');
    const remount = () => { sheet.remove(); build(); render(); };

    const drawMembers = () => {
      const gg = store.group(gid);
      const el = sheet.querySelector('#gs-members');
      el.innerHTML = gg.members.map(m =>
        `<div class="member-row"><span>${esc(m.name)}</span>
          <button class="exp-del" data-rm="${m.id}" title="Rimuovi">✕</button></div>`).join('')
        || '<div class="settle-empty">Nessun membro.</div>';
      el.querySelectorAll('[data-rm]').forEach(b => {
        b.onclick = async () => {
          const m = gg.members.find(x => x.id === b.dataset.rm);
          const ok = await confirmDialog({ title: `Rimuovere ${m.name}?`, confirmLabel: 'Rimuovi', danger: true });
          if (!ok) return;
          try { await store.deleteMember(m.id); drawMembers(); render(); }
          catch (e) { toast('Non rimovibile: ha spese o saldi collegati.'); }
        };
      });
    };
    drawMembers();

    sheet.querySelector('#gs-photo').onclick = () => pickGroupPhoto(gid, remount);
    sheet.querySelector('#gs-change').onclick = () => pickGroupPhoto(gid, remount);
    const rm = sheet.querySelector('#gs-remove');
    if (rm) rm.onclick = async () => {
      try { await store.setGroupImage(gid, null); remount(); } catch (e) { toast(errMsg(e)); }
    };

    sheet.querySelector('#gs-rename').onclick = (ev) => {
      const name = sheet.querySelector('#gs-name').value.trim();
      if (!name) return showErr(err, 'Il nome non può essere vuoto.');
      withBusy(ev.target, '…', async () => {
        try { await store.renameGroup(gid, name); render(); toast('Nome aggiornato'); }
        catch (e) { showErr(err, errMsg(e)); }
      });
    };

    const addm = async () => {
      const input = sheet.querySelector('#gs-newm');
      const n = input.value.trim(); err.hidden = true;
      if (!n) return;
      try { await store.addMember(gid, n); input.value = ''; input.focus(); drawMembers(); render(); }
      catch (e) { showErr(err, errMsg(e)); }
    };
    sheet.querySelector('#gs-addm').onclick = addm;
    sheet.querySelector('#gs-newm').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addm(); } });
    sheet.querySelector('#gs-done').onclick = () => { sheet.remove(); render(); };
  };
  build();
}

/* ---- Selezione + ridimensionamento foto gruppo ---- */
function pickGroupPhoto(gid, onDone) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 256);
      await store.setGroupImage(gid, dataUrl);
      onDone && onDone();
    } catch (e) { toast('Immagine non valida.'); }
  };
  input.click();
}

// Ritaglia al centro in un quadrato `size`x`size` e comprime in JPEG (~15-30 KB).
function resizeImage(file, size) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load')); };
    img.src = url;
  });
}

// Esegue un'azione async mostrando lo stato "in corso" sul bottone.
async function withBusy(btn, label, fn) {
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = label;
  try { await fn(); }
  finally { btn.disabled = false; btn.textContent = old; }
}

function openGroupSheet() {
  const draft = [];
  const sheet = openSheet(`
    <h2>Nuovo gruppo</h2>
    <div class="field">
      <label>Nome del gruppo</label>
      <input type="text" id="g-name" placeholder="Es. Weekend in montagna" autocomplete="off">
    </div>
    <div class="field">
      <label>Persone</label>
      <div class="inline-add">
        <input type="text" id="g-person" placeholder="Nome" autocomplete="off">
        <button class="add-mini" id="g-add">+</button>
      </div>
      <div class="chiplist" id="g-chips"></div>
    </div>
    <div class="err" id="g-err" hidden></div>
    <div class="sheet-actions">
      <button class="btn ghost" id="g-cancel">Annulla</button>
      <button class="btn" id="g-save">Crea gruppo</button>
    </div>`);

  const chips = sheet.querySelector('#g-chips');
  const input = sheet.querySelector('#g-person');
  const renderChips = () => {
    chips.innerHTML = draft.map((n, i) =>
      `<span class="tag">${esc(n)}<button data-i="${i}" aria-label="Rimuovi">✕</button></span>`).join('');
    chips.querySelectorAll('button').forEach(b => b.onclick = () => { draft.splice(+b.dataset.i, 1); renderChips(); });
  };
  const addPerson = () => {
    const n = input.value.trim();
    if (n) { draft.push(n); input.value = ''; renderChips(); }
    input.focus();
  };
  sheet.querySelector('#g-add').onclick = addPerson;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addPerson(); } });
  sheet.querySelector('#g-cancel').onclick = () => sheet.remove();
  sheet.querySelector('#g-save').onclick = (ev) => {
    const name = sheet.querySelector('#g-name').value.trim();
    const err = sheet.querySelector('#g-err');
    const pending = input.value.trim();
    if (pending) draft.push(pending);
    if (!name) return showErr(err, 'Dai un nome al gruppo.');
    if (draft.length < 2) return showErr(err, 'Servono almeno 2 persone.');
    withBusy(ev.target, 'Creo…', async () => {
      try {
        const g = await store.addGroup(name, draft);
        sheet.remove();
        view.screen = 'group'; view.groupId = g.id; render();
      } catch (e) { showErr(err, errMsg(e)); }
    });
  };
  setTimeout(() => sheet.querySelector('#g-name').focus(), 50);
}

function openPersonSheet(g) {
  const sheet = openSheet(`
    <h2>Aggiungi persona</h2>
    <div class="field">
      <label>Nome</label>
      <input type="text" id="p-name" placeholder="Nome" autocomplete="off">
    </div>
    <div class="err" id="p-err" hidden></div>
    <div class="sheet-actions">
      <button class="btn ghost" id="p-cancel">Annulla</button>
      <button class="btn" id="p-save">Aggiungi</button>
    </div>`);
  sheet.querySelector('#p-cancel').onclick = () => sheet.remove();
  sheet.querySelector('#p-save').onclick = (ev) => {
    const n = sheet.querySelector('#p-name').value.trim();
    const err = sheet.querySelector('#p-err');
    if (!n) return showErr(err, 'Inserisci un nome.');
    withBusy(ev.target, 'Salvo…', async () => {
      try { await store.addMember(g.id, n); sheet.remove(); render(); }
      catch (e) { showErr(err, errMsg(e)); }
    });
  };
  setTimeout(() => sheet.querySelector('#p-name').focus(), 50);
}

function openExpenseSheet(g, existing) {
  const editing = !!existing;
  // In modifica: partecipanti = quelli della spesa; altrimenti tutti.
  const participants = new Set(editing ? existing.splits.map(s => s.memberId) : g.members.map(m => m.id));
  const amtValue = editing ? (existing.amountCents / 100).toFixed(2).replace('.', ',') : '';
  // input[type=date] vuole YYYY-MM-DD in ora locale
  const dateValue = toDateInput(editing ? new Date(existing.createdAt) : new Date());
  const sheet = openSheet(`
    <h2>${editing ? 'Modifica spesa' : 'Nuova spesa'}</h2>
    <div class="field">
      <label>Descrizione</label>
      <input type="text" id="e-desc" placeholder="Es. Cena, spesa, benzina" autocomplete="off" value="${editing ? esc(existing.description || '') : ''}">
    </div>
    <div class="field">
      <label>Importo (€)</label>
      <input type="text" inputmode="decimal" id="e-amt" class="amount-input" placeholder="0,00" autocomplete="off" value="${amtValue}">
    </div>
    <div class="field">
      <label>Data</label>
      <input type="date" id="e-date" value="${dateValue}">
    </div>
    <div class="field">
      <label>Ha pagato</label>
      <select id="e-payer">
        ${g.members.map(m => `<option value="${m.id}"${editing && m.id === existing.payerId ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label>Diviso tra</label>
      <div class="people" id="e-people">
        ${g.members.map(m => `<button type="button" class="person-toggle" data-id="${m.id}" aria-pressed="${participants.has(m.id)}">${esc(m.name)}</button>`).join('')}
      </div>
      <div class="split-hint" id="e-hint"></div>
    </div>
    <div class="err" id="e-err" hidden></div>
    <div class="sheet-actions">
      <button class="btn ghost" id="e-cancel">Annulla</button>
      <button class="btn" id="e-save">${editing ? 'Salva modifiche' : 'Salva spesa'}</button>
    </div>`);

  const amt = sheet.querySelector('#e-amt');
  const hint = sheet.querySelector('#e-hint');
  const updateHint = () => {
    const cents = parseEuroToCents(amt.value);
    if (cents && participants.size) {
      const shares = splitEqual(cents, [...participants]);
      const min = Math.min(...shares.map(s => s.shareCents));
      const max = Math.max(...shares.map(s => s.shareCents));
      hint.textContent = min === max
        ? `${formatCents(min)} a testa (${participants.size})`
        : `${formatCents(min)}–${formatCents(max)} a testa (${participants.size})`;
    } else hint.textContent = '';
  };
  amt.addEventListener('input', updateHint);
  updateHint();

  sheet.querySelectorAll('.person-toggle').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const on = btn.getAttribute('aria-pressed') === 'true';
      if (on) participants.delete(id); else participants.add(id);
      btn.setAttribute('aria-pressed', String(!on));
      updateHint();
    };
  });

  sheet.querySelector('#e-cancel').onclick = () => sheet.remove();
  sheet.querySelector('#e-save').onclick = (ev) => {
    const err = sheet.querySelector('#e-err');
    const description = sheet.querySelector('#e-desc').value.trim();
    const amountCents = parseEuroToCents(amt.value);
    const payerId = sheet.querySelector('#e-payer').value;
    const ids = [...participants];
    if (!amountCents) return showErr(err, 'Inserisci un importo valido.');
    if (!ids.length) return showErr(err, 'Seleziona almeno una persona.');
    withBusy(ev.target, 'Salvo…', async () => {
      try {
        const createdAt = fromDateInput(sheet.querySelector('#e-date').value, editing ? existing.createdAt : null);
        if (editing) {
          await store.updateExpense(existing.id, { description: description || 'Spesa', amountCents, payerId, participantIds: ids, createdAt });
        } else {
          await store.addExpense(g.id, { description: description || 'Spesa', amountCents, payerId, participantIds: ids, createdAt });
        }
        sheet.remove(); render();
      } catch (e) { showErr(err, errMsg(e)); }
    });
  };
  setTimeout(() => sheet.querySelector('#e-desc').focus(), 50);
}

function showErr(el, msg) { el.textContent = msg; el.hidden = false; }
function errMsg(e) { return (e && (e.message || e.error_description)) || 'operazione non riuscita'; }

/* --------------------------------- BOOT ---------------------------------- */
function showLoading(msg) {
  app.innerHTML = `<div class="empty"><div class="big">⏳</div><p>${esc(msg)}</p></div>`;
}
function showFatal(msg) {
  app.innerHTML = `<div class="empty">
    <div class="big">⚠️</div>
    <p><strong>Qualcosa non va.</strong></p>
    <p>${esc(msg)}</p>
    <div class="fab"><button class="btn" id="retry">Riprova</button></div>
  </div>`;
  document.getElementById('retry').onclick = boot;
}

async function reload() {
  try { await store.refresh(); render(); }
  catch (e) { toast('Aggiornamento non riuscito: ' + errMsg(e)); }
}

/* ---- Login (magic link) ---- */
function renderLogin() {
  app.innerHTML = `
    <header class="topbar"><h1>Note Spese</h1></header>
    <div class="section">
      <div class="card" style="padding:22px 18px">
        <div id="step-email">
          <p style="margin-bottom:16px;color:var(--muted);font-size:14.5px">
            Accesso riservato. Inserisci la tua email: ti arriva un codice da inserire, senza password.
          </p>
          <div class="field" style="margin-bottom:12px">
            <label>Email</label>
            <input type="email" id="login-email" inputmode="email" autocomplete="email" placeholder="nome@email.it">
          </div>
          <div class="err" id="login-err" hidden></div>
          <button class="btn" id="login-send" style="width:100%">Invia codice</button>
        </div>
        <div id="step-code" style="display:none">
          <p style="margin-bottom:16px;color:var(--muted);font-size:14.5px">
            Ti ho inviato un codice a <b id="code-dest"></b>. Inseriscilo qui sotto.
          </p>
          <div class="field" style="margin-bottom:12px">
            <label>Codice</label>
            <input type="text" id="login-code" inputmode="numeric" autocomplete="one-time-code" placeholder="Codice ricevuto via email" maxlength="10">
          </div>
          <div class="err" id="code-err" hidden></div>
          <button class="btn" id="code-verify" style="width:100%">Entra</button>
          <button class="linkbtn" id="code-back" style="margin-top:12px">Usa un'altra email</button>
        </div>
      </div>
    </div>`;

  const stepEmail = document.getElementById('step-email');
  const stepCode = document.getElementById('step-code');
  const emailEl = document.getElementById('login-email');
  const sendBtn = document.getElementById('login-send');
  const err = document.getElementById('login-err');
  let email = '';

  sendBtn.onclick = () => {
    email = emailEl.value.trim();
    err.hidden = true;
    if (!email || !email.includes('@')) return showErr(err, 'Inserisci un indirizzo valido.');
    withBusy(sendBtn, 'Invio…', async () => {
      const { error } = await db.auth.signInWithOtp({ email });
      if (error) return showErr(err, errMsg(error));
      document.getElementById('code-dest').textContent = email;
      stepEmail.style.display = 'none';
      stepCode.style.display = 'block';
      setTimeout(() => document.getElementById('login-code').focus(), 50);
    });
  };

  const codeEl = document.getElementById('login-code');
  const verifyBtn = document.getElementById('code-verify');
  const codeErr = document.getElementById('code-err');
  verifyBtn.onclick = () => {
    const token = codeEl.value.trim();
    codeErr.hidden = true;
    if (!/^\d{4,10}$/.test(token)) return showErr(codeErr, 'Inserisci il codice ricevuto via email.');
    withBusy(verifyBtn, 'Verifico…', async () => {
      const { data, error } = await db.auth.verifyOtp({ email, token, type: 'email' });
      if (error) return showErr(codeErr, 'Codice errato o scaduto.');
      session = data.session; route();
    });
  };
  codeEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); verifyBtn.click(); } });
  document.getElementById('code-back').onclick = () => renderLogin();

  setTimeout(() => emailEl.focus(), 50);
}

function renderNotAllowed() {
  app.innerHTML = `<div class="empty">
    <div class="big">🚫</div>
    <p><strong>Email non autorizzata.</strong></p>
    <p>Questo indirizzo non è nella lista di accesso.</p>
    <div class="fab"><button class="btn" id="logout2">Esci</button></div>
  </div>`;
  document.getElementById('logout2').onclick = doLogout;
}

async function doLogout() {
  try { await db.auth.signOut(); } catch (_) {}
  store.clearCache();
  store._state.groups = [];
  session = null; isAdmin = false; view.screen = 'home'; view.groupId = null;
  route();
}

/* ---- Pannello accessi (solo admin) ---- */
function openAccessSheet() {
  const sheet = openSheet(`
    <h2>Gestione accessi</h2>
    <p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">
      Chi può accedere alla app. Disattiva per bloccare senza cancellare.
    </p>
    <div class="member-list" id="acc-list"><div class="settle-empty">Carico…</div></div>
    <div class="field" style="margin-top:16px">
      <label>Aggiungi email</label>
      <div class="inline-add">
        <input type="email" id="acc-new" inputmode="email" placeholder="nome@email.it" autocomplete="off">
        <button class="add-mini" id="acc-add">+</button>
      </div>
    </div>
    <div class="err" id="acc-err" hidden></div>
    <div class="sheet-actions"><button class="btn" id="acc-done" style="flex:1">Fatto</button></div>`);

  const listEl = sheet.querySelector('#acc-list');
  const err = sheet.querySelector('#acc-err');
  const me = currentEmail().toLowerCase();

  const draw = async () => {
    let rows;
    try { rows = await store.listAllowed(); }
    catch (e) { listEl.innerHTML = `<div class="settle-empty">Errore: ${esc(errMsg(e))}</div>`; return; }
    listEl.innerHTML = rows.map(r => {
      const isMe = r.email.toLowerCase() === me;
      const badges = (r.is_admin ? ' <span class="acc-badge">admin</span>' : '') + (isMe ? ' <span class="acc-badge you">tu</span>' : '');
      const actions = isMe ? '' :
        `<button class="pill ${r.enabled ? 'on' : 'off'}" data-tog="${esc(r.email)}" data-en="${r.enabled ? 1 : 0}">${r.enabled ? 'Attivo' : 'Disattivo'}</button>
         <button class="exp-del" data-rm="${esc(r.email)}" title="Rimuovi">✕</button>`;
      return `<div class="acc-row"><span class="acc-email">${esc(r.email)}${badges}</span><div class="acc-actions">${actions}</div></div>`;
    }).join('') || '<div class="settle-empty">Nessuna email.</div>';

    listEl.querySelectorAll('[data-tog]').forEach(b => b.onclick = async () => {
      try { await store.setEnabled(b.dataset.tog, b.dataset.en !== '1'); draw(); }
      catch (e) { toast(errMsg(e)); }
    });
    listEl.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
      const ok = await confirmDialog({ title: `Rimuovere ${b.dataset.rm}?`, confirmLabel: 'Rimuovi', danger: true });
      if (!ok) return;
      try { await store.removeAllowed(b.dataset.rm); draw(); }
      catch (e) { toast(errMsg(e)); }
    });
  };

  const add = async () => {
    const input = sheet.querySelector('#acc-new');
    const em = input.value.trim().toLowerCase();
    err.hidden = true;
    if (!em || !em.includes('@')) return showErr(err, 'Inserisci un indirizzo valido.');
    try { await store.addAllowed(em); input.value = ''; input.focus(); draw(); }
    catch (e) { showErr(err, errMsg(e)); }
  };
  sheet.querySelector('#acc-add').onclick = add;
  sheet.querySelector('#acc-new').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  sheet.querySelector('#acc-done').onclick = () => sheet.remove();
  draw();
}

/* ---- Routing in base alla sessione ---- */
let _routing = false;
async function route() {
  if (_routing) return;
  _routing = true;
  try {
    if (!session) { renderLogin(); return; }

    // 1) Apertura istantanea: se c'è una copia locale, disegnala subito.
    const fromCache = store.loadCache();
    if (fromCache) { render(); showSyncing(true); }
    else showLoading('Carico i dati…');

    // 2) Poi una sola chiamata: permessi + tutti i dati.
    let allowed;
    try { allowed = await store.refresh(); }
    catch (e) {
      if (fromCache) { showSyncing(false); toast('Offline: dati non aggiornati'); return; }
      return showFatal(errMsg(e));
    }
    showSyncing(false);
    if (!allowed) return renderNotAllowed();
    render();
  } catch (e) {
    showFatal(errMsg(e));
  } finally {
    _routing = false;
  }
}

/* Indicatore discreto di sincronizzazione in corso */
function showSyncing(on) {
  let el = document.getElementById('syncing');
  if (on) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'syncing';
      el.className = 'syncing';
      el.textContent = 'Aggiorno…';
      document.body.appendChild(el);
    }
  } else if (el) el.remove();
}

/* ---- Pull-to-refresh (trascina in basso in cima alla pagina) ---- */
function setupPullToRefresh() {
  const ind = document.createElement('div');
  ind.className = 'ptr';
  ind.innerHTML = '<span class="ptr-ic">↻</span>';
  document.body.appendChild(ind);
  let startY = 0, pulling = false, ready = false, busy = false;

  document.addEventListener('touchstart', e => {
    if (busy || window.scrollY > 0 || document.querySelector('.scrim')) { pulling = false; return; }
    startY = e.touches[0].clientY; pulling = true; ready = false;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!pulling) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0 || window.scrollY > 0) { ind.style.height = '0'; ready = false; return; }
    const pull = Math.min(dy * 0.5, 80);
    ind.style.height = pull + 'px';
    ind.style.opacity = String(Math.min(pull / 60, 1));
    ready = pull >= 56;
    ind.classList.toggle('ready', ready);
  }, { passive: true });

  const end = async () => {
    if (!pulling) return;
    pulling = false;
    if (ready && !busy) {
      busy = true;
      ind.classList.add('spin'); ind.style.height = '52px'; ind.style.opacity = '1';
      try { await store.refresh(); render(); } catch (e) { toast('Aggiornamento non riuscito'); }
      ind.classList.remove('spin');
      busy = false;
    }
    ind.style.height = '0'; ind.style.opacity = '0'; ind.classList.remove('ready');
  };
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);
}

async function boot() {
  showLoading('Avvio…');
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    return showFatal('Libreria Supabase non caricata (sei offline o la CDN è bloccata?).');
  }
  db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: DB_SCHEMA },
    // default "logga una volta e resta dentro": sessione persistente + auto-refresh
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  db.auth.onAuthStateChange((_event, s) => { session = s; route(); });
  const { data } = await db.auth.getSession();
  session = data.session;
  route();
}

setupPullToRefresh();
boot();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
