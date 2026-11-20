const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const SITE_NAME = process.env.SITE_NAME || 'My Place';
let ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) {
  ADMIN_KEY = crypto.randomBytes(8).toString('hex');
  console.log('No ADMIN_KEY set. Temporary admin link: /admin/' + ADMIN_KEY);
}
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'status.json');

// Edit these to change the choices in the admin page.
const STATUSES = {
  open: { label: "I'm in", line: 'Come on over', dot: '#1D9E75' },
  busy: { label: "I'm here, but slammed", line: 'Come by, but be patient', dot: '#EF9F27' },
  brb: { label: 'Back in a bit', line: 'Stepped out for a moment', dot: '#378ADD' },
  off: { label: 'Not today', line: 'Go cook at home', dot: '#A32D2D' },
  away: { label: 'Gone fishing', line: 'Back soon, ask me later', dot: '#888780' },
};

let state = { key: 'off', comment: '', updated: new Date().toISOString() };
try {
  const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (STATUSES[saved.key]) state = saved;
} catch (e) {}

function save() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(state)); } catch (e) {}
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CSS = `
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#FAEEDA;color:#412402;font-family:Georgia,'Times New Roman',serif;display:flex;align-items:center;justify-content:center;padding:24px;line-height:1.6}
main{width:100%;max-width:440px;text-align:center}
h1{font-size:22px;font-weight:normal;margin:0 0 6px}
.ask{color:#854F0B;margin:0 0 22px;font-size:17px;font-style:italic}
.card{background:#fff;border:1px solid #FAC775;border-radius:18px;padding:34px 24px}
.dot{width:16px;height:16px;border-radius:50%;display:inline-block;margin-bottom:14px}
.status{font-size:34px;line-height:1.2;margin:0;color:#412402}
.line{font-size:18px;color:#854F0B;margin:8px 0 0}
.comment{margin:22px 0 0;padding-top:18px;border-top:1px dashed #FAC775;font-size:18px;white-space:pre-wrap}
.updated{margin-top:18px;font-size:13px;color:#BA7517}
form{text-align:left}
label.opt{display:flex;align-items:center;gap:12px;padding:12px 14px;margin:0 0 8px;background:#fff;border:1px solid #FAC775;border-radius:12px;cursor:pointer;font-size:18px}
label.opt:has(input:checked){border-color:#854F0B;background:#FFF8EC;outline:2px solid #854F0B}
label.opt input{accent-color:#854F0B}
.d{width:12px;height:12px;border-radius:50%;flex:none}
textarea,input[type=password]{width:100%;padding:12px;border:1px solid #FAC775;border-radius:12px;font:inherit;font-size:17px;background:#fff;color:#412402;margin:6px 0 12px}
textarea:focus,input:focus{outline:2px solid #854F0B}
button{font:inherit;font-size:18px;padding:12px 22px;border-radius:12px;border:0;background:#633806;color:#FAEEDA;cursor:pointer}
button:hover{background:#412402}
button.link{background:none;color:#854F0B;text-decoration:underline;padding:8px}
.msg{color:#633806;margin:0 0 12px;text-align:center}
.err{color:#A32D2D}
`;

function page(title, body, script) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${CSS}</style></head><body><main>${body}</main>${script ? '<script>' + script + '</script>' : ''}</body></html>`;
}

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.get('/health', (req, res) => res.send('ok'));

app.get('/api/status', (req, res) => {
  const s = STATUSES[state.key];
  res.set('Cache-Control', 'no-store');
  res.json({ label: s.label, line: s.line, dot: s.dot, comment: state.comment, updated: state.updated });
});

app.get('/', (req, res) => {
  const s = STATUSES[state.key];
  const body = `
<h1>${esc(SITE_NAME)}</h1>
<p class="ask">Wondering if I'm around?</p>
<div class="card">
<span class="dot" id="dot" style="background:${s.dot}"></span>
<p class="status" id="label">${esc(s.label)}</p>
<p class="line" id="line">${esc(s.line)}</p>
<p class="comment" id="comment" ${state.comment ? '' : 'hidden'}>${esc(state.comment)}</p>
<p class="updated">Updated <span id="time" data-t="${esc(state.updated)}"></span></p>
</div>`;
  const script = `
var fmt=function(iso){var d=new Date(iso),n=new Date();var t=d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
return d.toDateString()===n.toDateString()?'today at '+t:d.toLocaleDateString([], {weekday:'short',day:'numeric',month:'short'})+' at '+t};
var tm=document.getElementById('time');tm.textContent=fmt(tm.dataset.t);
function load(){fetch('/api/status',{cache:'no-store'}).then(function(r){return r.json()}).then(function(s){
document.getElementById('dot').style.background=s.dot;
document.getElementById('label').textContent=s.label;
document.getElementById('line').textContent=s.line;
var c=document.getElementById('comment');c.textContent=s.comment;c.hidden=!s.comment;
tm.textContent=fmt(s.updated)}).catch(function(){})}
setInterval(load,30000);`;
  res.send(page(SITE_NAME + ' - status', body, script));
});

const adminOk = (req) => {
  const x = Buffer.from(String(req.params.key));
  const y = Buffer.from(ADMIN_KEY);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

app.get('/admin/:key', (req, res) => {
  if (!adminOk(req)) return res.status(404).send('Not found');
  const action = '/admin/' + encodeURIComponent(ADMIN_KEY);
  const opts = Object.entries(STATUSES).map(([k, s]) => `
<label class="opt"><input type="radio" name="key" value="${k}" ${k === state.key ? 'checked' : ''}><span class="d" style="background:${s.dot}"></span>${esc(s.label)}</label>`).join('');
  const saved = req.query.saved ? '<p class="msg">Saved. Visitors see it now.</p>' : '';
  res.set('Cache-Control', 'no-store');
  res.send(page('Admin', `<h1>${esc(SITE_NAME)}</h1><p class="ask">What should visitors see?</p>${saved}
<form method="post" action="${action}">${opts}
<textarea name="comment" rows="2" maxlength="200" placeholder="Optional note, like: Fresh soup today">${esc(state.comment)}</textarea>
<button type="submit">Save status</button></form>`));
});

app.post('/admin/:key', (req, res) => {
  if (!adminOk(req)) return res.status(404).send('Not found');
  if (!STATUSES[req.body.key]) return res.redirect('/admin/' + encodeURIComponent(ADMIN_KEY));
  state = { key: req.body.key, comment: String(req.body.comment || '').trim().slice(0, 200), updated: new Date().toISOString() };
  save();
  res.redirect('/admin/' + encodeURIComponent(ADMIN_KEY) + '?saved=1');
});

app.listen(PORT, () => console.log('Status site running on port ' + PORT));
