/* ============ 查看器核心 ============ */
(function () {
  'use strict';
  const qs = new URLSearchParams(location.search);
  const modelId = qs.get('model') || 'skull';
  const entry = CATALOG.find(m => m.id === modelId) || CATALOG.find(m => m.id === 'skull');

  /* ---------- 全局上下文 ---------- */
  const Ctx = {
    entry,
    scene: null, camera: null, renderer: null, controls: null,
    root: null,
    pickables: [],           // 可拾取 mesh
    hotspotGroup: null,
    hotspots: [],            // {pos, term, en, desc, sprite, idx}
    sprites: [],             // 可拾取的 sprite
    onTick: [],              // fn(dt, t)
    onPick: null,            // fn(hit) => true 已处理
    onDblPick: null,
    aiContext: { model: entry.title, part: null },
    presetDir: null
  };
  window.Ctx = Ctx;

  /* ---------- 工具 DOM ---------- */
  const $ = id => document.getElementById(id);
  Ctx.$ = $;
  let toastTimer = null;
  Ctx.toast = (msg, ms = 2400) => {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  };
  Ctx.setLoading = (text, pct) => { $('loadText').textContent = text; $('loadBar').style.width = (pct || 0) + '%'; };
  Ctx.hideLoading = () => { $('loadingMask').classList.add('hide'); };

  /* ---------- 三维基础 ---------- */
  const canvas = $('c3d');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1116);
  scene.fog = new THREE.Fog(0x0e1116, 14, 40);
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 200);
  camera.position.set(0, 0.6, 3);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.05;      // 缩放范围放开:可以贴到结构上看
  controls.maxDistance = 60;
  controls.minPolarAngle = 0;       // 全方位旋转:上下不限
  controls.maxPolarAngle = Math.PI;
  controls.rotateSpeed = 0.9;

  /* 灯光 */
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(3, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0x88aaff, 0.35); fill.position.set(-4, 1, -3); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.25); rim.position.set(0, -4, -4); scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);
  Ctx.scene = scene; Ctx.camera = camera; Ctx.renderer = renderer; Ctx.controls = controls; Ctx.root = root;

  /* 背景网格地面(仅提示空间,不抢戏) */
  const grid = new THREE.GridHelper(24, 48, 0x223, 0x1a2230);
  grid.position.y = -1.6; grid.visible = false; scene.add(grid);

  /* ---------- 相机预设 ---------- */
  const presetBar = $('viewPresets');
  Ctx.setPresets = list => {
    presetBar.innerHTML = '';
    (list || []).forEach(v => {
      const b = document.createElement('button');
      b.className = 'vp-btn'; b.textContent = v.name;
      b.onclick = () => {
        Ctx.flyToDir(v.dir, v.dist, v.target, v.up);
        if (Ctx.applyPresetExtras) Ctx.applyPresetExtras(v);
      };
      presetBar.appendChild(b);
    });
    presetBar.style.display = (list && list.length) ? 'flex' : 'none';
  };

  /* 飞行动画 */
  let flyAnim = null;
  Ctx.flyToDir = (dir, dist, target, up) => {
    const d = new THREE.Vector3(...dir).normalize();
    dist = dist || camera.position.distanceTo(controls.target);
    const endPos = new THREE.Vector3().copy(controls.target).addScaledVector(d, dist);
    Ctx.flyTo(endPos, target, up);
  };
  Ctx.flyTo = (endPos, target, up) => {
    flyAnim = {
      t: 0,
      p0: camera.position.clone(), p1: endPos.clone(),
      t0: controls.target.clone(), t1: target ? new THREE.Vector3(...target) : controls.target.clone(),
      u0: camera.up.clone(), u1: up ? new THREE.Vector3(...up) : new THREE.Vector3(0, 1, 0)
    };
  };
  Ctx.resetView = () => {
    controls.target.set(0, 0, 0);
    const d = Ctx.defaultDist || 3;
    Ctx.flyToDir(Ctx.defaultDir || [0.3, 0.25, 1], d, [0, 0, 0]);
  };

  /* ---------- 标注(热点) ---------- */
  Ctx.hotspotGroup = new THREE.Group();
  Ctx.hotspotGroup.visible = true;
  scene.add(Ctx.hotspotGroup);
  Ctx.labelsOn = true;

  function makeSpotTexture(text, color) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2);
    g.fillStyle = color; g.fill();
    g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.stroke();
    g.fillStyle = '#1a1206'; g.font = 'bold 62px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 64, 68);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    return t;
  }

  Ctx.setHotspots = list => {
    Ctx.hotspotGroup.clear();
    Ctx.hotspots = []; Ctx.sprites = [];
    (list || []).forEach((hs, i) => {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeSpotTexture(String(i + 1), hs.color || '#ffb454'),
        depthTest: false, transparent: true
      }));
      spr.position.copy(new THREE.Vector3(...hs.pos));
      spr.scale.setScalar(hs.size || 0.055);
      spr.renderOrder = 10;
      spr.userData.hotspot = hs;
      hs.sprite = spr; hs.idx = i;
      Ctx.hotspotGroup.add(spr);
      Ctx.hotspots.push(hs); Ctx.sprites.push(spr);
    });
  };
  Ctx.showLabels = show => { Ctx.labelsOn = show; Ctx.hotspotGroup.visible = show; refreshPartLabel(); };

  /* 选中结构的浮动文字标签 */
  let partLabelEl = null, labelAnchor = null;
  function refreshPartLabel() {
    if (partLabelEl) { partLabelEl.remove(); partLabelEl = null; }
    if (!labelAnchor || !Ctx.labelsOn) return;
    partLabelEl = document.createElement('div');
    partLabelEl.className = 'part-label';
    partLabelEl.textContent = labelAnchor.text;
    document.body.appendChild(partLabelEl);
  }
  Ctx.setPartLabel = (text, pos3) => {
    if (!text) { labelAnchor = null; refreshPartLabel(); return; }
    labelAnchor = { text, pos: pos3.clone() };
    refreshPartLabel();
  };
  function updatePartLabelPos() {
    if (!partLabelEl || !labelAnchor) return;
    const v = labelAnchor.pos.clone().project(camera);
    const behind = v.z > 1;
    partLabelEl.style.display = behind ? 'none' : 'block';
    if (!behind) {
      partLabelEl.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px';
      partLabelEl.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px';
    }
  }

  /* ---------- 信息面板 ---------- */
  const panel = $('infoPanel');
  Ctx.showInfoPanel = show => { panel.classList.toggle('show', show !== false); };
  Ctx.setInfo = opt => {
    // opt: {title, latin, cat:[], html} 或 null(回到空状态)
    if (!opt) {
      $('infoTitle').textContent = '点击模型上的结构';
      $('infoLatin').textContent = ''; $('infoCat').innerHTML = '';
      $('infoBody').innerHTML = `<div class="info-empty"><div style="font-size:34px">🖱️</div><div><b>操作方法</b><br>左键拖动 = 旋转(可转任意角度,包括上下)<br>滚轮 = 缩放 · 右键拖动 = 平移<br>单击骨头 / 标注圆点 = 查看该结构</div></div>`;
      return;
    }
    $('infoTitle').textContent = opt.title || '';
    $('infoLatin').textContent = opt.latin || '';
    $('infoCat').innerHTML = (opt.cat || []).map(c => `<span>${c}</span>`).join('');
    $('infoBody').innerHTML = opt.html || '';
    $('infoBody').scrollTop = 0;
    panel.classList.add('show');
  };
  Ctx.kbSection = (title, inner) => `<div class="kb-sec"><h4>▍${title}</h4>${inner}</div>`;
  Ctx.kbList = arr => '<ul>' + arr.map(x => `<li>${x}</li>`).join('') + '</ul>';
  $('infoClose').onclick = () => panel.classList.remove('show');

  /* ---------- 拾取 ---------- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = null, downTime = 0;
  canvas.addEventListener('pointerdown', e => {
    downPos = [e.clientX, e.clientY]; downTime = Date.now();
    canvas.classList.add('grabbing');
  });
  addEventListener('pointerup', () => canvas.classList.remove('grabbing'));
  canvas.addEventListener('pointermove', e => {
    // 悬停时提示可点
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hitSpr = raycaster.intersectObjects(Ctx.sprites, false);
    if (hitSpr.length) { canvas.classList.add('pickable'); return; }
    const hits = raycaster.intersectObjects(Ctx.pickables, false);
    canvas.classList.toggle('pickable', hits.length > 0);
  });
  canvas.addEventListener('click', e => {
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
    if (moved > 6 || Date.now() - downTime > 600) return;  // 是拖动不是点击
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    // 1) 热点 sprite
    const hitSpr = raycaster.intersectObjects(Ctx.sprites, false);
    if (hitSpr.length) {
      const hs = hitSpr[0].object.userData.hotspot;
      selectHotspot(hs);
      return;
    }
    // 2) 模块自定义拾取
    if (Ctx.onPick) {
      const hits = raycaster.intersectObjects(Ctx.pickables, false);
      if (hits.length && Ctx.onPick(hits[0]) !== false) return;
    }
  });
  canvas.addEventListener('dblclick', () => {
    if (Ctx.onDblPick) {
      const hits = raycaster.intersectObjects(Ctx.pickables, false);
      Ctx.onDblPick(hits.length ? hits[0] : null);
    }
  });

  Ctx.selectHotspot = selectHotspot;
  function selectHotspot(hs) {
    // 高亮该 sprite
    Ctx.hotspots.forEach(h => { if (h.sprite) h.sprite.material.color.set(h === hs ? 0xffffff : 0xb0b0b0); });
    if (Ctx.onHotspotSelect) { Ctx.onHotspotSelect(hs); return; }
    // 默认行为:热点自带 data 渲染
    if (hs.data) {
      Ctx.setInfo(hs.data);
      Ctx.setPartLabel(hs.term, hs.sprite.position);
      Ctx.aiContext.part = { term: hs.term, kb: hs.data.plain || '' };
    }
  }

  /* ---------- 渲染循环 ---------- */
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (flyAnim) {
      flyAnim.t += dt / 0.8;
      const k = flyAnim.t >= 1 ? 1 : (1 - Math.pow(1 - flyAnim.t, 3)); // easeOutCubic
      camera.position.lerpVectors(flyAnim.p0, flyAnim.p1, k);
      controls.target.lerpVectors(flyAnim.t0, flyAnim.t1, k);
      camera.up.lerpVectors(flyAnim.u0, flyAnim.u1, k).normalize();
      if (flyAnim.t >= 1) flyAnim = null;
    }
    controls.update();
    Ctx.onTick.forEach(f => f(dt, clock.elapsedTime));
    renderer.render(scene, camera);
    updatePartLabelPos();
  })();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ---------- 工具栏 ---------- */
  $('btnReset').onclick = () => Ctx.resetView();
  $('btnSpin').onclick = e => {
    controls.autoRotate = !controls.autoRotate;
    controls.autoRotateSpeed = 2.2;
    e.currentTarget.classList.toggle('on', controls.autoRotate);
  };
  $('btnLabels').onclick = e => {
    Ctx.showLabels(!Ctx.labelsOn);
    e.currentTarget.classList.toggle('on', !Ctx.labelsOn);
  };
  $('btnShot').onclick = () => {
    renderer.render(scene, camera);
    const a = document.createElement('a');
    a.download = (entry.title || 'model') + '.png';
    a.href = renderer.domElement.toDataURL('image/png');
    a.click();
    Ctx.toast('已保存截图 📷(可用于实验报告)');
  };
  $('btnAI').onclick = () => window.AIPanel && window.AIPanel.toggle();

  /* ---------- 拖拽导入 ---------- */
  const dropOv = $('dropOverlay');
  addEventListener('dragover', e => { e.preventDefault(); dropOv.classList.add('show'); });
  addEventListener('dragleave', e => { if (!e.relatedTarget) dropOv.classList.remove('show'); });
  addEventListener('drop', e => {
    e.preventDefault(); dropOv.classList.remove('show');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    const reader = new FileReader();
    if (name.endsWith('.glb') || name.endsWith('.gltf')) {
      reader.onload = () => {
        new THREE.GLTFLoader().parse(reader.result, '', g => {
          Ctx.clearModel && Ctx.clearModel();
          const box = new THREE.Box3().setFromObject(g.scene);
          const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
          const k = 1.6 / Math.max(s.x, s.y, s.z);
          g.scene.position.sub(c).multiplyScalar(k); g.scene.scale.setScalar(k);
          root.add(g.scene);
          g.scene.traverse(o => { if (o.isMesh) { o.userData.partName = o.name || f.name; Ctx.pickables.push(o); } });
          Ctx.setInfo({ title: f.name, latin: '导入的模型', cat: ['本地文件'], html: Ctx.kbSection('说明', '<p>你导入的模型仅在本地浏览器中显示,不会上传。点击模型部件查看名称。</p>') });
          Ctx.hideLoading();
        });
      };
      reader.readAsArrayBuffer(f);
    } else if (name.endsWith('.obj')) {
      reader.onload = () => {
        const obj = new THREE.OBJLoader().parse(reader.result);
        Ctx.clearModel && Ctx.clearModel();
        const box = new THREE.Box3().setFromObject(obj);
        const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
        const k = 1.6 / Math.max(s.x, s.y, s.z);
        obj.position.sub(c); obj.scale.setScalar(k);
        obj.traverse(o => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({ color: 0xd8cfc0, roughness: 0.85 });
            o.userData.partName = o.name || f.name; Ctx.pickables.push(o);
          }
        });
        root.add(obj);
        Ctx.setInfo({ title: f.name, latin: '导入的模型', cat: ['本地文件'], html: Ctx.kbSection('说明', '<p>你导入的模型仅在本地浏览器中显示,不会上传。</p>') });
        Ctx.hideLoading();
      };
      reader.readAsText(f);
    } else {
      Ctx.toast('目前支持 .glb / .gltf / .obj 文件');
    }
  });

  Ctx.clearModel = () => {
    while (root.children.length) root.remove(root.children[0]);
    Ctx.pickables = [];
    Ctx.setHotspots([]);
    Ctx.setPartLabel(null);
  };

  /* ---------- 启动 ---------- */
  $('vTitle').innerHTML = `${entry.icon || ''} ${entry.title}<small>${entry.en || ''}</small>`;
  document.title = entry.title + ' · 智观3D';
  Ctx.defaultDir = [0.3, 0.25, 1];
  const boot = Modules[entry.type] || Modules.import;
  boot(Ctx).catch(err => {
    console.error(err);
    Ctx.hideLoading();
    Ctx.setInfo({ title: '加载失败', cat: ['错误'], html: `<div class="kb-sec"><p>${String(err && err.message || err)}</p><p>请确认已通过「启动.bat」打开本程序(直接双击 html 文件会因浏览器安全限制无法加载数据)。</p></div>` });
  });
  window.Modules = Modules;
})();
