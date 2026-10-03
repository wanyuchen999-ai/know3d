/* ============ AI 问答面板 ============
 * 模式1:内置知识库(离线,零配置)—— 对当前模型/结构的关键词检索 + 预设问答
 * 模式2:云端大模型(用户自己填 OpenAI 兼容接口,可选智谱/DeepSeek/OpenAI 预设)
 * 会话:按账号(本地账号系统 auth.js)自动保存聊天记录,可历史回看/删除/导出
 */
(function () {
  'use strict';
  const PRESETS = {
    zhipu: { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash', label: '智谱 GLM' },
    deepseek: { url: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat', label: 'DeepSeek' },
    openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', label: 'OpenAI' },
    custom: { url: '', model: '', label: '自定义' }
  };
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- 账号感知的存储键 ---------- */
  function userKey(prefix) {
    const u = (window.Auth && Auth.current()) || 'guest';
    return prefix + u;
  }
  let cfg = { preset: 'offline', url: '', model: '', key: '' };
  function loadCfg() {
    // 一次性迁移旧的全局配置
    try {
      const legacy = localStorage.getItem('know3d_ai_cfg');
      if (legacy && !localStorage.getItem(userKey('know3d_ai_cfg_'))) {
        localStorage.setItem(userKey('know3d_ai_cfg_'), legacy);
      }
    } catch (e) { }
    try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(userKey('know3d_ai_cfg_')) || '{}')); } catch (e) { }
  }
  function saveCfg() { try { localStorage.setItem(userKey('know3d_ai_cfg_'), JSON.stringify(cfg)); } catch (e) { } }

  /* ---------- 聊天会话存储 ---------- */
  let sessions = [];        // [{id,title,created,msgs:[{role,content,ts}]}]
  let curSession = null;    // 当前会话(null = 尚未产生消息)
  let history = [];         // 最近消息(供云端上下文)
  let kbLib = null;

  function loadSessions() {
    try { sessions = JSON.parse(localStorage.getItem(userKey('know3d_chat_')) || '[]'); }
    catch (e) { sessions = []; }
  }
  function persistSessions() {
    try { localStorage.setItem(userKey('know3d_chat_'), JSON.stringify(sessions.slice(-40))); } catch (e) { }
  }
  function resetConversationUI() {
    msgs.innerHTML = '';
    history = [];
    bubble('bot', '已开启新对话 ✨ 提问会自动保存到你的账号,可在 🗂 历史里回看。');
  }
  function newConversation(silent) {
    if (curSession) persistSession();   // 收尾保存
    curSession = null;
    resetConversationUI();
    if (!silent) Ctx && Ctx.toast && Ctx.toast('新对话已创建,旧的已自动保存');
  }
  function persistSession() {
    if (!curSession || !curSession.msgs.length) return;
    const i = sessions.findIndex(s => s.id === curSession.id);
    if (i >= 0) sessions[i] = curSession; else sessions.push(curSession);
    persistSessions();
  }
  function ensureSession(firstQ) {
    if (curSession) return;
    curSession = { id: 's' + Date.now(), title: (firstQ || '新对话').slice(0, 18), created: Date.now(), msgs: [] };
  }
  function addMsg(role, content) {
    ensureSession(role === 'user' ? content : '');
    curSession.msgs.push({ role, content, ts: Date.now() });
    if (role === 'user') history.push({ role: 'user', content });
    else history.push({ role: 'assistant', content });
    persistSession();
  }
  function loadSession(id) {
    const s = sessions.find(x => x.id === id);
    if (!s) return;
    if (curSession) persistSession();
    curSession = s;
    msgs.innerHTML = '';
    history = [];
    s.msgs.forEach(m => {
      bubble(m.role === 'user' ? 'user' : 'bot', m.role === 'user' ? esc(m.content) : mdLite(m.content));
      history.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
    });
    msgs.scrollTop = msgs.scrollHeight;
  }
  function deleteSession(id) {
    sessions = sessions.filter(s => s.id !== id);
    persistSessions();
    if (curSession && curSession.id === id) { curSession = null; resetConversationUI(); }
    renderHistList();
  }

  /* ---------- 面板 UI ---------- */
  const drawer = $('aiDrawer'), msgs = $('aiMsgs'), input = $('aiInput');
  let histModal = null;

  function isCloud() { return cfg.preset !== 'offline' && cfg.url && cfg.key; }
  function refreshMode() {
    const b = $('aiMode');
    if (isCloud()) { b.textContent = (PRESETS[cfg.preset] && PRESETS[cfg.preset].label || '自定义') + ' · ' + cfg.model; b.className = 'mode-badge cloud'; }
    else { b.textContent = '内置知识库'; b.className = 'mode-badge'; }
  }

  function toggle(show) {
    const s = show === undefined ? !drawer.classList.contains('show') : show;
    drawer.classList.toggle('show', s);
    if (s && !curSession && sessions.length) {
      loadSession(sessions[sessions.length - 1].id);   // 打开时自动恢复最近会话
      bubble('bot', '已为你恢复上次的对话 💾');
    }
    if (s) { renderChips(); input.focus(); }
  }
  window.AIPanel = { toggle, addKB: lib => { kbLib = lib; }, open: () => toggle(true) };

  function bubble(role, html) {
    const d = document.createElement('div');
    d.className = 'ai-msg ' + (role === 'user' ? 'user' : 'bot');
    d.innerHTML = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  const CHIPS_ANATOMY = ['这块骨的考点有哪些?', '容易和什么结构混淆?', '临床上有什么意义?', '帮我出一个关于它的考题'];
  const CHIPS_GEO = ['这个国家有什么著名的?', '它周边有哪些国家?', '适合什么时候去旅行?'];
  const CHIPS_DEFAULT = ['用通俗的话再解释一遍', '相关考点有哪些?', '出一个自测题考考我'];
  function renderChips() {
    const box = $('aiChips'); box.innerHTML = '';
    const chips = window.Ctx && Ctx.entry.cat === 'medical' ? CHIPS_ANATOMY : (Ctx.entry.cat === 'geo' ? CHIPS_GEO : CHIPS_DEFAULT);
    chips.forEach(c => {
      const b = document.createElement('button');
      b.className = 'ai-chip'; b.textContent = c;
      b.onclick = () => { input.value = c; send(); };
      box.appendChild(b);
    });
  }

  function send() {
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    bubble('user', esc(q));
    addMsg('user', q);
    if (isCloud()) cloudAsk(q); else localAsk(q);
  }
  $('aiSend').onclick = send;
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

  /* ---------- 模式1:内置知识库 ---------- */
  function localAsk(q) {
    const typing = bubble('bot', '<span class="ai-typing">正在检索内置知识库…</span>');
    setTimeout(() => {
      const res = searchKB(q);
      typing.innerHTML = res.html;
      addMsg('assistant', res.plain || res.html.replace(/<[^>]+>/g, ' '));
    }, 260);
  }

  function searchKB(q) {
    const pool = [];
    if (kbLib && kbLib.entries) pool.push(...kbLib.entries);
    const kws = q.toLowerCase().replace(/[?？,。、!！\s]+/g, ' ').split(' ').filter(w => w.length > 1);
    const scored = pool.map(e => {
      const hay = (e.title + ' ' + (e.terms || '') + ' ' + e.text).toLowerCase();
      let s = 0;
      kws.forEach(w => { if (hay.includes(w)) s += w.length; });
      if ((e.title || '').toLowerCase().includes(q.toLowerCase())) s += 20;
      return { e, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
    if (!scored.length) {
      return {
        html: `当前处于<b>内置知识库模式</b>,暂未检索到与「${esc(q)}」直接相关的内容。<br><br>
          可以:<br>① 先点击模型上的某个结构,再问"这个结构有什么作用";<br>
          ② 或在 ⚙️ 设置里填入大模型 API Key(智谱 glm-4-flash 有免费额度),即可无限深入问答。`,
        plain: ''
      };
    }
    let html = '', plain = '';
    scored.forEach((x, i) => {
      html += `<h5>${esc(x.e.title)}</h5><div>${x.e.text}</div>`;
      plain += x.e.title + ':' + x.e.text.replace(/<[^>]+>/g, ' ') + '\n';
      if (i < scored.length - 1) html += '<hr style="border:none;border-top:1px dashed var(--line);margin:10px 0">';
    });
    html += `<div class="src">来源:内置知识库(${scored.map(x => esc(x.e.title)).join('、')})。想继续深挖?在 ⚙️ 里配置大模型后可无限追问。</div>`;
    return { html, plain };
  }

  /* ---------- 模式2:云端大模型 ---------- */
  function buildContext() {
    let sys = '你是一名面向中国本科生的学科助教,擅长系统解剖学/地理/天文/化学/生物教学。请用简体中文、条理清晰地回答,重点突出考点,适当使用序号列表。回答控制在300字以内,除非用户要求更详细。';
    try {
      const ctx = window.Ctx;
      if (ctx) {
        sys += `\n当前用户正在查看的3D模型:「${ctx.aiContext.model}」。`;
        if (ctx.aiContext.part) sys += `\n用户当前选中的结构:「${ctx.aiContext.part.term}」。相关资料:${ctx.aiContext.part.kb || '(无)'}`;
      }
    } catch (e) { }
    return sys;
  }

  async function cloudAsk(q) {
    const typing = bubble('bot', '<span class="ai-typing">' + esc(cfg.model) + ' 思考中…</span>');
    try {
      const messages = [{ role: 'system', content: buildContext() }];
      history.slice(-8).forEach(h => messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }));
      const r = await fetch(cfg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
        body: JSON.stringify({ model: cfg.model, messages, temperature: 0.5 })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 160));
      const j = await r.json();
      const txt = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '(空回复)';
      typing.innerHTML = mdLite(txt);
      addMsg('assistant', txt);
    } catch (err) {
      typing.innerHTML = `❌ 调用失败:<b>${esc(String(err.message || err))}</b><br>
        常见原因:① Key/地址/模型名不对;② 该服务商不允许浏览器跨域直连(换智谱或开代理);③ 余额不足。<br>
        仍可继续使用<b>内置知识库</b>(把预设切回「仅用内置知识库」)。`;
    }
  }

  function mdLite(t) {
    return esc(t)
      .replace(/^### (.+)$/gm, '<h5>$1</h5>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }

  /* ---------- 历史会话弹窗 ---------- */
  function ensureHistModal() {
    if (histModal) return;
    histModal = document.createElement('div');
    histModal.className = 'modal-mask';
    histModal.innerHTML = `
      <div class="modal">
        <h3>🗂 我的聊天记录</h3>
        <div id="histList" style="max-height:52vh;overflow-y:auto"></div>
        <p class="tip">记录保存在本机浏览器、按账号隔离;换设备可在账号面板导出 JSON 迁移。</p>
        <div class="modal-actions"><button class="btn-ghost" id="histClose">关闭</button></div>
      </div>`;
    document.body.appendChild(histModal);
    histModal.addEventListener('click', e => { if (e.target === histModal) histModal.classList.remove('show'); });
    $('histClose').onclick = () => histModal.classList.remove('show');
  }
  function renderHistList() {
    if (!histModal) return;
    const list = $('histList');
    const items = sessions.slice().sort((a, b) => (b.created || 0) - (a.created || 0));
    if (!items.length) { list.innerHTML = '<p style="color:var(--txt-dim);font-size:13px">还没有聊天记录,去问 AI 第一句话吧。</p>'; return; }
    list.innerHTML = items.map(s => `
      <div style="display:flex;align-items:center;gap:8px;padding:9px 4px;border-bottom:1px solid var(--line)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.title || '未命名对话')}</div>
          <div style="font-size:11.5px;color:var(--txt-dim)">${new Date(s.created || Date.now()).toLocaleString('zh-CN')} · ${s.msgs.length} 条</div>
        </div>
        <button class="btn-ghost" data-load="${s.id}" style="padding:5px 12px;font-size:12.5px">打开</button>
        <button class="btn-ghost" data-del="${s.id}" style="padding:5px 10px;font-size:12.5px;color:var(--err)">删</button>
      </div>`).join('');
    list.querySelectorAll('[data-load]').forEach(b => b.onclick = () => {
      loadSession(b.dataset.load); histModal.classList.remove('show'); toggle(true);
    });
    list.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteSession(b.dataset.del));
  }

  /* ---------- 设置 ---------- */
  function openSettings() {
    $('setUrl').value = cfg.url; $('setModel').value = cfg.model; $('setKey').value = cfg.key;
    document.querySelectorAll('#presetRow .preset-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.p === cfg.preset);
      c.onclick = () => {
        document.querySelectorAll('#presetRow .preset-chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        const p = PRESETS[c.dataset.p];
        if (p) { $('setUrl').value = p.url; $('setModel').value = p.model; }
        if (c.dataset.p === 'offline') { $('setUrl').value = ''; $('setModel').value = ''; }
      };
    });
    $('settingsModal').classList.add('show');
  }
  $('setCancel').onclick = () => $('settingsModal').classList.remove('show');
  $('setSave').onclick = () => {
    cfg.url = $('setUrl').value.trim(); cfg.model = $('setModel').value.trim(); cfg.key = $('setKey').value.trim();
    const act = document.querySelector('#presetRow .preset-chip.active');
    cfg.preset = act ? act.dataset.p : (cfg.url && cfg.key ? 'custom' : 'offline');
    if (cfg.preset !== 'offline' && (!cfg.url || !cfg.key)) cfg.preset = 'offline';
    saveCfg();
    $('settingsModal').classList.remove('show');
    refreshMode();
    window.Ctx && Ctx.toast(isCloud() ? '已启用云端大模型 🤖' : '使用内置知识库模式');
  };
  $('btnTestAI').onclick = async () => {
    const res = $('testResult');
    res.textContent = '测试中…'; res.style.color = 'var(--txt-dim)';
    const url = $('setUrl').value.trim(), model = $('setModel').value.trim(), key = $('setKey').value.trim();
    if (!url || !key) { res.textContent = '❌ 请先填 API 地址和 Key'; res.style.color = 'var(--err)'; return; }
    try {
      const r = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: model || 'gpt-3.5-turbo', messages: [{ role: 'user', content: '你好' }], max_tokens: 8 })
      });
      if (r.ok) { res.textContent = '✅ 连接成功'; res.style.color = 'var(--ok)'; }
      else { res.textContent = '❌ HTTP ' + r.status + ':' + (await r.text()).slice(0, 120); res.style.color = 'var(--err)'; }
    } catch (e) { res.textContent = '❌ ' + esc(String(e.message || e)).slice(0, 120); res.style.color = 'var(--err)'; }
  };

  /* ---------- 头部按钮:新对话 / 历史 ---------- */
  (function injectHeadButtons() {
    const head = document.querySelector('.ai-head');
    if (!head) return;
    const btnNew = document.createElement('button');
    btnNew.className = 'icon-btn'; btnNew.title = '新对话(旧对话自动保存)';
    btnNew.textContent = '✚';
    btnNew.onclick = () => newConversation();
    const btnHist = document.createElement('button');
    btnHist.className = 'icon-btn'; btnHist.title = '历史聊天记录';
    btnHist.textContent = '🗂';
    btnHist.onclick = () => { ensureHistModal(); renderHistList(); histModal.classList.add('show'); };
    head.insertBefore(btnHist, $('aiSettingsBtn'));
    head.insertBefore(btnNew, btnHist);
  })();

  /* ---------- 账号切换响应 ---------- */
  window.addEventListener('auth-changed', () => {
    loadCfg(); loadSessions();
    curSession = null;
    msgs.innerHTML = '';
    history = [];
    const u = (window.Auth && Auth.current()) || 'guest';
    bubble('bot', u === 'guest'
      ? '当前以<b>游客</b>身份聊天(记录保存在本机"游客"名下)。点右上角 👤 可注册/登录,记录将归属你的账号。'
      : `欢迎,${esc(u)} 👋 本账号的聊天记录已就绪(${sessions.length} 个历史会话),右上角 🗂 可查看。`);
    refreshMode();
  });

  /* ---------- 初始化 ---------- */
  loadCfg();
  loadSessions();
  refreshMode();
})();
