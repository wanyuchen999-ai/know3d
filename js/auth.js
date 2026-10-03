/* ============ 本地账号系统 ============
 * 纯前端实现(localStorage),配合静态托管(GitHub Pages)无需后端:
 * - 注册/登录(密码加盐 SHA-256 哈希存储,不存明文)
 * - 每个账号独立的 AI 聊天记录与设置(见 ai.js)
 * - 限制:数据保存在当前浏览器;换设备可用「导出记录」迁移
 * 触发 window 事件 'auth-changed' 供其他模块响应登录切换。
 */
(function () {
  'use strict';
  const USERS_KEY = 'know3d_users';
  const SESSION_KEY = 'know3d_session';

  const $id = id => document.getElementById(id);

  function loadUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch (e) { return {}; } }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  async function hashPw(pw, salt) {
    const text = salt + '::' + pw;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // 降级(仅 file:// 直接打开时):简易哈希,推荐通过服务器/https 访问
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < text.length; i++) {
      h1 = ((h1 ^ text.charCodeAt(i)) * 0x01000193) >>> 0;
      h2 = ((h2 * 31) + text.charCodeAt(i)) >>> 0;
    }
    return 'f:' + h1.toString(16) + h2.toString(16);
  }

  function current() { return localStorage.getItem(SESSION_KEY) || null; }

  async function register(username, password) {
    username = (username || '').trim();
    if (!/^[A-Za-z0-9_\u4e00-\u9fa5]{2,16}$/.test(username)) return '用户名需 2~16 位(汉字/字母/数字/下划线)';
    if ((password || '').length < 6) return '密码至少 6 位';
    const users = loadUsers();
    if (users[username]) return '该用户名已被注册(本浏览器内)';
    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    users[username] = { salt, hash: await hashPw(password, salt), created: Date.now() };
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, username);
    notify();
    return null;
  }

  async function login(username, password) {
    const users = loadUsers();
    const u = users[(username || '').trim()];
    if (!u) return '用户不存在(本浏览器内)';
    if (await hashPw(password || '', u.salt) !== u.hash) return '密码错误';
    localStorage.setItem(SESSION_KEY, username.trim());
    notify();
    return null;
  }

  function logout() { localStorage.removeItem(SESSION_KEY); notify(); }

  function notify() {
    refreshButton();
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: current() } }));
  }

  /* ---------- 注入 UI(头部按钮 + 弹窗) ---------- */
  let modalEl = null;

  function ensureUI() {
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.className = 'modal-mask';
      modalEl.id = 'authModal';
      modalEl.innerHTML = `
        <div class="modal">
          <h3>👤 账号</h3>
          <div id="authBody"></div>
          <p class="tip">· 账号与聊天记录保存在<b>本机浏览器</b>中,不上传服务器;<br>
             · 同一台电脑上不同账号的记录互相隔离;<br>
             · 换设备可在「我的记录」里导出聊天文件迁移。</p>
          <div class="modal-actions"><button class="btn-ghost" id="authClose">关闭</button></div>
        </div>`;
      document.body.appendChild(modalEl);
      modalEl.addEventListener('click', e => { if (e.target === modalEl) modalEl.classList.remove('show'); });
      $id('authClose').onclick = () => modalEl.classList.remove('show');
    }
    // 头部按钮
    const btn = document.createElement('button');
    btn.id = 'authBtn';
    btn.className = 'tb-btn';
    btn.onclick = () => { renderModal(); modalEl.classList.add('show'); };
    const header = document.querySelector('.lib-header') || document.querySelector('.v-toolbar .tb-group');
    if (header) {
      btn.style.marginLeft = header.classList.contains('tb-group') ? '0' : 'auto';
      header.appendChild(btn);
    } else {
      btn.style.cssText = 'position:fixed;top:12px;right:14px;z-index:55;';
      document.body.appendChild(btn);
    }
    refreshButton();
    window.addEventListener('auth-changed', renderModal);
  }

  function refreshButton() {
    const btn = $id('authBtn');
    if (btn) btn.textContent = current() ? '👤 ' + current() : '👤 登录 / 注册';
  }

  function renderModal() {
    if (!modalEl) return;
    const body = $id('authBody');
    const user = current();
    if (user) {
      body.innerHTML = `
        <p style="font-size:14px;margin-bottom:12px">当前账号:<b style="color:var(--acc)">${esc(user)}</b></p>
        <div class="modal-actions" style="justify-content:flex-start;gap:8px;flex-wrap:wrap">
          <button class="btn-ghost" id="authExport">📤 导出我的聊天记录</button>
          <button class="btn-ghost" id="authLogout">退出登录</button>
        </div>`;
      $id('authLogout').onclick = () => { logout(); renderModal(); };
      $id('authExport').onclick = exportChats;
    } else {
      body.innerHTML = `
        <div class="form-row"><label>用户名</label><input id="authUser" placeholder="2~16 位,汉字/字母/数字"></div>
        <div class="form-row"><label>密码(至少 6 位)</label><input id="authPass" type="password" placeholder="密码"></div>
        <div class="modal-actions" style="justify-content:flex-start;gap:8px">
          <button class="btn-main" id="authDoLogin">登录</button>
          <button class="btn-ghost" id="authDoRegister">注册并登录</button>
        </div>
        <p class="tip" id="authMsg" style="min-height:18px"></p>`;
      $id('authDoLogin').onclick = async () => {
        const err = await login($id('authUser').value, $id('authPass').value);
        showAuthMsg(err || '✅ 登录成功', err);
        if (!err) setTimeout(() => modalEl.classList.remove('show'), 600);
      };
      $id('authDoRegister').onclick = async () => {
        const err = await register($id('authUser').value, $id('authPass').value);
        showAuthMsg(err || '✅ 注册成功,已自动登录', err);
        if (!err) setTimeout(() => modalEl.classList.remove('show'), 600);
      };
    }
  }
  function showAuthMsg(text, isErr) {
    const el = $id('authMsg');
    if (el) { el.textContent = text; el.style.color = isErr ? 'var(--err)' : 'var(--ok)'; }
  }

  function exportChats() {
    const user = current() || 'guest';
    const data = localStorage.getItem('know3d_chat_' + user) || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '智观3D聊天记录-' + user + '-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
  }

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  window.Auth = { current, register, login, logout, exportChats };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureUI);
  else ensureUI();
})();
