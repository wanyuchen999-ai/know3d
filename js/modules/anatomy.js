/* ============ 解剖模块:单骨 / 组装骨骼 ============ */
window.Modules = window.Modules || {};
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const BONE_MAT = () => new THREE.MeshStandardMaterial({ color: 0xe6dcc8, roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide });
  const SEL_MAT = () => new THREE.MeshStandardMaterial({ color: 0xffd27a, roughness: 0.6, emissive: 0x664411, emissiveIntensity: 0.55, side: THREE.DoubleSide });

  /* 各骨推荐视角(方向 = 从观察目标指向相机) */
  const PRESET_VIEW = {
    'skull': [
      { name: '前面观', dir: [0, 0.05, 1] }, { name: '侧面观', dir: [1, 0.05, 0.1] },
      { name: '上面观', dir: [0.001, 1, 0.25], up: [0.001, 0.3, -1] },
      { name: '后面观', dir: [0, 0.05, -1] },
      { name: '颅底内面(自动隐藏颅顶)', dir: [0.001, 1, 0.12], up: [0.001, 0.35, -1], hide: ['frontal-bone', 'parietal-bone'] },
      { name: '颅底外面', dir: [0.001, -1, 0.1], up: [0.001, 0.35, -1] }
    ],
    'mandible': [{ name: '外侧面观', dir: [1, 0.1, 0.4] }, { name: '前面观', dir: [0, 0, 1] }, { name: '后面观', dir: [0, 0.2, -1] }],
    'thoracic-vertebra': [{ name: '侧面观', dir: [1, 0.05, 0.35] }, { name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '后面观', dir: [0, 0.05, -1] }],
    'lumbar-vertebra': [{ name: '侧面观', dir: [1, 0.05, 0.35] }, { name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '后面观', dir: [0, 0.05, -1] }],
    'cervical-vertebra': [{ name: '侧面观', dir: [1, 0.05, 0.35] }, { name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '后面观', dir: [0, 0.05, -1] }],
    'atlas': [{ name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '下面观', dir: [0.001, -1, 0.2], up: [0, 0.3, -1] }, { name: '前面观', dir: [0, 0, 1] }],
    'axis': [{ name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '侧面观', dir: [1, 0.05, 0.35] }, { name: '前面观', dir: [0, 0, 1] }],
    'sacrum': [{ name: '前面观(盆面)', dir: [0, -0.1, 1] }, { name: '后面观(背面)', dir: [0, 0.1, -1] }, { name: '侧面观', dir: [1, 0, 0.3] }],
    'sternum': [{ name: '前面观', dir: [0, 0, 1] }, { name: '侧面观', dir: [1, 0, 0.3] }],
    'rib': [{ name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '下面观', dir: [0.001, -1, 0.2], up: [0, 0.3, -1] }],
    'hip-bone': [{ name: '外面观', dir: [1, 0.05, 0.3] }, { name: '内面观', dir: [-1, 0.05, 0.3] }],
    'humerus': [{ name: '前面观', dir: [0, 0, 1] }, { name: '后面观', dir: [0, 0, -1] }],
    'femur': [{ name: '前面观', dir: [0, 0, 1] }, { name: '后面观', dir: [0, 0, -1] }],
    'radius': [{ name: '前面观', dir: [0, 0, 1] }, { name: '后面观', dir: [0, 0, -1] }],
    'ulna': [{ name: '前面观', dir: [0, 0, 1] }, { name: '后面观', dir: [0, 0, -1] }],
    'tibia': [{ name: '前面观', dir: [0, 0, 1] }, { name: '后面观', dir: [0, 0, -1] }],
    'fibula': [{ name: '前面观', dir: [0, 0, 1] }, { name: '后面观', dir: [0, 0, -1] }],
    'clavicle': [{ name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '下面观', dir: [0.001, -1, 0.2], up: [0, 0.3, -1] }],
    'scapula': [{ name: '前面观(肋面)', dir: [0, 0, 1] }, { name: '后面观', dir: [0, 0, -1] }, { name: '外侧面观', dir: [1, 0, 0.2] }],
    'patella': [{ name: '前面观', dir: [0, 0, 1] }, { name: '后面观(关节面)', dir: [0, 0, -1] }],
    'sphenoid-bone': [{ name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '后面观', dir: [0, 0.1, -1] }],
    'ethmoid-bone': [{ name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '外侧面观', dir: [1, 0, 0.2] }],
    'temporal-bone': [{ name: '外侧面观', dir: [1, 0, 0.2] }, { name: '内侧面观', dir: [-1, 0, 0.2] }, { name: '下面观', dir: [0.001, -1, 0.2], up: [0, 0.3, -1] }],
    'occipital-bone': [{ name: '内面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '外面观', dir: [0.001, -1, 0.2], up: [0, 0.3, -1] }],
    'maxilla': [{ name: '外侧面观', dir: [1, 0, 0.2] }, { name: '腭面观', dir: [0.001, -1, 0.2], up: [0, 0.3, -1] }],
    'calcaneus': [{ name: '外侧面观', dir: [1, 0, 0.2] }, { name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }],
    'talus': [{ name: '上面观', dir: [0.001, 1, 0.2], up: [0, 0.3, -1] }, { name: '外侧面观', dir: [1, 0, 0.2] }]
  };

  let MANIFEST = null, KB = null;
  async function loadData() {
    if (!MANIFEST) {
      MANIFEST = await (await fetch('models/anatomy/manifest.json')).json();
    }
    if (!KB) {
      try { KB = await (await fetch('data/anatomy/kb.json')).json(); } catch (e) { KB = {}; }
    }
  }
  async function loadJSON(url, fallback) {
    try { return await (await fetch(url)).json(); } catch (e) { return fallback; }
  }

  /* ---------- 渲染知识卡 ---------- */
  function renderKBCard(ctx, kb, opts = {}) {
    const html = [];
    if (kb.summary) html.push(ctx.kbSection('简介', `<p>${kb.summary}</p>`));
    if (kb.basic && kb.basic.length) html.push(ctx.kbSection('基本信息', ctx.kbList(kb.basic)));
    if (kb.structures && kb.structures.length) {
      html.push(ctx.kbSection('主要结构(点击可定位)', '<ul>' + kb.structures.map((s, i) => {
        const canLocate = opts.hotspotIndex && opts.hotspotIndex.has(s.term);
        return `<li class="${canLocate ? 'clickable' : ''}" ${canLocate ? `data-loc="${i}"` : ''}><b>${s.term}</b>${s.en ? ' <i style="color:var(--txt-dim)">' + s.en + '</i>' : ''} — ${s.desc}</li>`;
      }).join('') + '</ul>'));
    }
    if (kb.points && kb.points.length) html.push(ctx.kbSection('★ 考点(本科要求)', ctx.kbList(kb.points)));
    if (kb.clinical) html.push(ctx.kbSection('临床联系', `<div class="clinical">${kb.clinical}</div>`));
    if (kb.mnemonic) html.push(ctx.kbSection('记忆口诀', `<div class="mnemo">${kb.mnemonic}</div>`));
    if (kb.source) html.push(`<div style="font-size:11px;color:var(--txt-dim);margin-top:10px">${kb.source}</div>`);
    return html.join('');
  }

  function bindStructureLocate(ctx, kb, hotspotIndex) {
    document.querySelectorAll('#infoBody li[data-loc]').forEach(li => {
      li.onclick = () => {
        const s = kb.structures[+li.dataset.loc];
        const hs = hotspotIndex.get(s.term);
        if (hs) {
          ctx.selectHotspot(hs);
          const dist = ctx.camera.position.length() * 0.55;
          ctx.flyToDir(hs.viewDir || [0.4, 0.3, 1], dist);
        }
      };
    });
  }

  /* ---------- 自测模式 ---------- */
  function makeQuiz(ctx) {
    let qs = [], cur = null, score = 0, total = 0;
    function start() {
      qs = ctx.hotspots.slice();
      if (!qs.length) { ctx.toast('本模型暂无标注考点,可点击结构直接学习'); return; }
      score = 0; total = 0;
      $('quizHud').classList.add('show');
      $('hintBar').textContent = '自测模式:按题目点击对应的标注圆点';
      next();
    }
    function next() {
      if (!qs.length) qs = ctx.hotspots.slice();
      cur = qs.splice(Math.floor(Math.random() * qs.length), 1)[0];
      $('quizQ').textContent = cur.term;
      updateScore();
    }
    function updateScore() { $('quizScore').textContent = `得分 ${score}/${total}`; }
    function answer(hs) {
      total++;
      const ok = hs.term === cur.term;   // 双侧同名结构均算正确
      if (ok) score++;
      updateScore();
      flash(ok);
      if (ok) setTimeout(next, 700); else {
        // 答错:高亮正确位置
        cur.sprite.material.color.set(0x3ecf8e);
        setTimeout(() => { cur.sprite.material.color.set(0xffffff); next(); }, 1200);
      }
    }
    function flash(ok) {
      const f = $('quizFlash');
      f.textContent = ok ? '✔ 答对了!' : '✘ 答错了,绿色的是正确答案:' + cur.term;
      f.className = 'quiz-flash show ' + (ok ? 'ok' : 'bad');
      setTimeout(() => f.classList.remove('show'), 1100);
    }
    function stop() {
      $('quizHud').classList.remove('show');
      $('hintBar').textContent = '左键拖动旋转(全方位) · 滚轮缩放 · 右键平移 · 点击结构查看知识卡';
      if (total) ctx.toast(`自测结束:得分 ${score}/${total}` , 4000);
      ctx.quizAnswer = null;
    }
    $('quizNext').onclick = next;
    $('quizExit').onclick = stop;
    return { start, answer, stop };
  }

  /* ---------- 骨块列表 ---------- */
  function buildBoneList(ctx, parts) {
    // parts: [{id, name, group, meshes:[], visible}]
    const wrap = $('boneListWrap'), chips = $('boneChips');
    if (!parts.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    chips.innerHTML = '';
    parts.forEach(p => {
      const b = document.createElement('button');
      b.className = 'bone-chip'; b.textContent = p.name; b.title = '点击隔离显示 · 再次点击恢复';
      b.onclick = () => isolate(ctx, parts, p);
      p.chip = b;
      chips.appendChild(b);
    });
  }
  function isolate(ctx, parts, target) {
    if (target.isolated) {  // 取消隔离,全部显示
      parts.forEach(p => { p.visible = true; p.isolated = false; p.meshes.forEach(m => m.visible = true);
        if (p.chip) { p.chip.classList.remove('hidden-bone'); p.chip.style.background = ''; } });
      return;
    }
    parts.forEach(p => {
      p.isolated = p === target;
      p.visible = p === target;
      p.meshes.forEach(m => m.visible = p === target);
      if (p.chip) { p.chip.classList.toggle('hidden-bone', p !== target);
        p.chip.style.background = p === target ? 'rgba(255,180,84,0.25)' : ''; }
    });
    ctx.toast('已隔离「' + target.name + '」,再次点击该骨或列表恢复全部');
  }

  /* ---------- 组装模型加载(单一 GLB,多个命名网格,保留解剖位置) ---------- */
  async function loadGroup(ctx, groupId) {
    const g = MANIFEST.groups[groupId];
    if (!g || !g.file) throw new Error('模型清单中缺少 ' + groupId);
    ctx.setLoading('加载 ' + (g.title || groupId) + ' …', 20);
    const loader = new THREE.GLTFLoader();
    const gltf = await new Promise((res, rej) => loader.load(MANIFEST.base + g.file, res, undefined, rej));
    ctx.setLoading('构建场景…', 70);
    const parts = [];
    gltf.scene.traverse(o => {
      if (o.isMesh) {
        if (!o.geometry.getAttribute('normal')) o.geometry.computeVertexNormals();
        o.material = BONE_MAT();
        const bp = (g.parts || []).find(p => p.id === o.name) || {};
        o.userData.boneId = o.name;
        o.userData.partName = bp.name || o.name;
        ctx.pickables.push(o);
        let part = parts.find(p => p.id === o.name);
        if (!part) { part = { id: o.name, name: bp.name || o.name, kb: bp.kb || o.name, visible: true, isolated: false, meshes: [] }; parts.push(part); }
        part.meshes.push(o);
      }
    });
    ctx.root.add(gltf.scene);
    buildBoneList(ctx, parts);

    // 点击:按骨高亮 + 显示 KB
    const selMat = SEL_MAT();
    ctx.onPick = hit => {
      parts.forEach(p => p.meshes.forEach(m => {
        m.material = (p.id === hit.object.userData.boneId) ? selMat : BONE_MAT();
      }));
      const id = hit.object.userData.boneId;
      const bpRow = (g.parts || []).find(p => p.id === id) || {};
      const kbKey = KB[id] ? id : bpRow.kb;
      const kb = kbKey ? KB[kbKey] : null;
      const name = hit.object.userData.partName;
      if (kb) {
        const hi = new Map((ctx.hotspots || []).map(h => [h.term, h]));
        const card = renderKBCard(ctx, kb, { hotspotIndex: hi });
        ctx.setInfo({ title: kb.name || name, latin: [kb.la, kb.en].filter(Boolean).join(' · '), cat: kb.cat || [g.title], html: card });
        ctx.aiContext = { model: ctx.entry.title, part: { term: kb.name || name, kb: (kb.summary || '') + ' 考点:' + (kb.points || []).join(';') } };
        if (window.AIPanel) AIPanel.addKB(kbToLib([kbKey]));
      } else {
        ctx.setInfo({ title: name, cat: [g.title], html: ctx.kbSection('说明', '<p>该骨的详细知识卡编写中。试试点击其他结构,或在 AI 面板提问。</p>') });
        ctx.aiContext = { model: ctx.entry.title, part: { term: name, kb: '' } };
      }
      ctx.setPartLabel(null);
    };
    ctx.onDblPick = hit => {
      if (!hit) { parts.forEach(p => { p.visible = true; p.isolated = false; p.meshes.forEach(m => m.visible = true); if (p.chip) { p.chip.classList.remove('hidden-bone'); p.chip.style.background = ''; } }); return; }
      const p = parts.find(x => x.id === hit.object.userData.boneId);
      if (p) isolate(ctx, parts, p);
    };
    ctx.onHotspotSelect = hs => {
      // 热点知识卡
      const data = hs.data || {};
      ctx.setInfo({
        title: hs.term, latin: hs.en || '', cat: [g.title, '标注结构'],
        html: (data.desc ? ctx.kbSection('解释', `<p>${data.desc}</p>`) : '') +
          (data.point ? ctx.kbSection('★ 考点', ctx.kbList([data.point])) : '') +
          `<div style="font-size:11.5px;color:var(--txt-dim)">编号 ${hs.idx + 1} 号标注 · 可在 AI 面板继续追问</div>`
      });
      ctx.setPartLabel(hs.term, hs.sprite.position);
      ctx.aiContext = { model: ctx.entry.title, part: { term: hs.term, kb: data.desc || '' } };
    };

    // 颅底内面预设在隐藏颅顶
    const presets = (PRESET_VIEW[groupId] || []).slice();
    Ctx.setPresets(presets);
    Ctx.applyPresetExtras = pv => {
      if (pv.hide) parts.forEach(p => {
        p.visible = !pv.hide.includes(p.id);
        p.isolated = false;
        p.meshes.forEach(m => m.visible = p.visible);
        if (p.chip) p.chip.classList.toggle('hidden-bone', !p.visible);
      });
      else parts.forEach(p => {
        p.visible = true; p.isolated = false;
        p.meshes.forEach(m => m.visible = true);
        if (p.chip) p.chip.classList.remove('hidden-bone');
      });
    };
  }

  function kbToLib(ids) {
    // 给 AI 面板注入知识库条目
    const entries = [];
    ids.forEach(id => {
      const kb = KB[id]; if (!kb) return;
      const txt = [kb.summary, ...(kb.structures || []).map(s => s.term + ':' + s.desc), ...(kb.points || []), kb.clinical, kb.mnemonic].filter(Boolean).join('\n');
      entries.push({ id, title: kb.name || id, terms: (kb.structures || []).map(s => s.term).join(' '), text: txt.replace(/\n/g, '<br>') });
    });
    return { entries };
  }

  /* ---------- 单骨加载 ---------- */
  async function loadSingle(ctx, entry) {
    const b = MANIFEST.bones[entry.file];
    if (!b) throw new Error('模型清单中缺少 ' + entry.file + '(请先运行 tools/prepare_models.py)');
    ctx.setLoading('加载 ' + (b.title || entry.title) + ' …', 30);
    const loader = new THREE.GLTFLoader();
    const gltf = await new Promise((res, rej) => loader.load(MANIFEST.base + b.file, res, undefined, rej));
    ctx.setLoading('构建场景…', 70);
    const meshes = [];
    gltf.scene.traverse(o => {
      if (o.isMesh) {
        if (!o.geometry.getAttribute('normal')) o.geometry.computeVertexNormals();
        o.material = BONE_MAT();
        o.userData.partName = o.name || b.title;
        ctx.pickables.push(o); meshes.push(o);
        ctx.root.add(o);
      }
    });
    // 多侧(左/右)自动命名:+x = 患者左侧(解剖学位置面向观察者)
    if (meshes.length > 1) {
      meshes.sort((a, b2) => a.userData.cx - b2.userData.cx);
      const c0 = new THREE.Box3().setFromObject(meshes[0]).getCenter(new THREE.Vector3());
      const c1 = new THREE.Box3().setFromObject(meshes[1]).getCenter(new THREE.Vector3());
      const n = b.title || entry.title;
      const left = c0.x > c1.x ? meshes[0] : meshes[1];
      const right = left === meshes[0] ? meshes[1] : meshes[0];
      left.userData.partName = '左' + n; right.userData.partName = '右' + n;
    }
    const kb = KB[entry.id] || KB[entry.file] || null;

    // 热点
    const hsList = await loadJSON('data/anatomy/hotspots/' + entry.id + '.json', []);
    if (hsList.length) ctx.setHotspots(hsList.map(h => ({ term: h.term, en: h.en, pos: h.pos, viewDir: h.viewDir, data: { desc: h.desc, point: h.point } })));
    else ctx.setHotspots([]);

    const hi = new Map(ctx.hotspots.map(h => [h.term, h]));
    const selMat = SEL_MAT();
    let selected = null;
    ctx.onPick = hit => {
      if (selected) selected.material = BONE_MAT();
      selected = hit.object; selected.material = selMat;
      const kbS = kb || { name: hit.object.userData.partName, en: entry.en, cat: ['骨学'] };
      const card = renderKBCard(ctx, kbS, { hotspotIndex: hi });
      ctx.setInfo({ title: hit.object.userData.partName, latin: [kbS.la, kbS.en].filter(Boolean).join(' · '), cat: kbS.cat || ['骨学'], html: card });
      ctx.aiContext = { model: entry.title, part: { term: hit.object.userData.partName, kb: (kbS.summary || '') + ' 考点:' + (kbS.points || []).join(';') } };
      ctx.setPartLabel(null);
      if (window.AIPanel) AIPanel.addKB(kbToLib([entry.id]));
    };
    ctx.onHotspotSelect = hs => {
      const data = hs.data || {};
      ctx.setInfo({
        title: hs.term, latin: hs.en || '', cat: [entry.title, '标注结构'],
        html: (data.desc ? ctx.kbSection('解释', `<p>${data.desc}</p>`) : '') +
          (data.point ? ctx.kbSection('★ 考点', ctx.kbList([data.point])) : '') +
          (kb && kb.points && kb.points.length ? ctx.kbSection('本骨其他考点', ctx.kbList(kb.points)) : '') +
          `<div style="font-size:11.5px;color:var(--txt-dim)">编号 ${hs.idx + 1} 号标注 · 可在 AI 面板继续追问</div>`
      });
      ctx.setPartLabel(hs.term, hs.sprite.position);
      ctx.aiContext = { model: entry.title, part: { term: hs.term, kb: data.desc || '' } };
      if (window.AIPanel) AIPanel.addKB(kbToLib([entry.id]));
    };
    if (window.AIPanel) AIPanel.addKB(kbToLib([entry.id]));
    ctx.setInfo(null);
    Ctx.setPresets(PRESET_VIEW[entry.id] || []);
    Ctx.applyPresetExtras = null;
  }

  /* ---------- 模块入口 ---------- */
  Modules.anatomy = Modules['anatomy-group'] = async function (ctx) {
    await loadData();
    const entry = ctx.entry;
    if (entry.type === 'anatomy-group') {
      await loadGroup(ctx, entry.id);
      if (entry.id === 'skull') {
        const hs = await loadJSON('data/anatomy/hotspots/skull.json', []);
        if (hs.length) ctx.setHotspots(hs.map(h => ({
          term: h.term + (h.side ? '(' + h.side + ')' : ''), en: h.en,
          pos: h.pos, viewDir: h.viewDir, data: { desc: h.desc, point: h.point }
        })));
      }
    } else {
      await loadSingle(ctx, entry);
    }
    ctx.defaultDir = [0.35, 0.3, 1];
    ctx.defaultDist = 2.6;
    ctx.resetView();
    const quiz = makeQuiz(ctx);
    ctx.quizAnswer = hs => quiz.answer(hs);
    // 拦截热点选择 → quiz
    const oldSel = ctx.selectHotspot;
    // 简化:quiz HUD 显示时优先判题
    const hud = document.getElementById('quizHud');
    ctx.selectHotspot = hs => { if (hud.classList.contains('show')) quiz.answer(hs); else oldSel(hs); };
    document.getElementById('btnQuiz').onclick = () => quiz.start();
    Ctx.hideLoading();
    ctx.showInfoPanel(false);
  };

  Modules.import = async function (ctx) {
    ctx.hideLoading();
    ctx.setInfo({
      title: '导入自己的模型', cat: ['本地'], html:
        ctx.kbSection('方法', ctx.kbList([
          '把 <b>.glb / .gltf / .obj</b> 文件直接拖进本页面即可加载',
          '推荐从 <b>Sketchfab(选可下载免费模型)</b>、NIH 3D Print 等网站获取解剖模型',
          '模型全程只在你的浏览器里处理,<b>不会上传</b>',
          '加载后同样支持全方位旋转、点击部件、截图'
        ])) +
        ctx.kbSection('推荐下载源', ctx.kbList([
          'BodyParts3D 完整数据(本应用模型来源):dbarchive.biosciencedbc.jp',
          'NIH 3D:3d.nih.gov(美国政府开放数据)',
          'Z-Anatomy(开源全身解剖,CC BY-SA)'
        ]))
    });
    ctx.defaultDist = 3; ctx.resetView();
    return Promise.resolve();
  };
})();
