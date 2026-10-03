/* ============ 地球仪模块:点击国家 ============ */
window.Modules = window.Modules || {};
(function () {
  'use strict';
  let features = [], CINFO = {}, painted = null, tex = null, sphere = null;
  const W = 4096, H = 2048;
  let selectedId = null;

  function proj(lon, lat) { return [(lon + 180) / 360 * W, (90 - lat) / 180 * H]; }

  async function loadData() {
    const topo = await (await fetch('data/geo/countries-110m.json')).json();
    features = topojson.feature(topo, topo.objects.countries).features;
    try { CINFO = await (await fetch('data/geo/countries.json')).json(); } catch (e) { CINFO = {}; }
  }

  function infoOf(f) {
    const id = String(f.id);
    const base = CINFO[id] || {};
    return {
      id,
      zh: base.zh || f.properties.name || '未知地区',
      en: base.en || f.properties.name || '',
      capital: base.capital || '', capitalZh: base.capitalZh || '',
      pop: base.pop || '', area: base.area || '', region: base.region || '',
      intro: base.intro || '', flag: base.flag || ''
    };
  }

  function paint() {
    const c = painted || (painted = document.createElement('canvas'));
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    // 海洋
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d2438'); grad.addColorStop(0.5, '#123049'); grad.addColorStop(1, '#0d2438');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // 经纬网
    g.strokeStyle = 'rgba(140,180,220,0.10)'; g.lineWidth = 1.5;
    for (let lon = -180; lon <= 180; lon += 30) { g.beginPath(); g.moveTo(...proj(lon, 90)); g.lineTo(...proj(lon, -90)); g.stroke(); }
    for (let lat = -80; lat <= 80; lat += 20) { g.beginPath(); g.moveTo(...proj(-180, lat)); g.lineTo(...proj(180, lat)); g.stroke(); }
    g.strokeStyle = 'rgba(140,180,220,0.22)';
    g.beginPath(); g.moveTo(...proj(-180, 0)); g.lineTo(...proj(180, 0)); g.stroke();
    // 国家
    const path = d3.geoPath(d3.geoEquirectangular().translate([W / 2, H / 2]).scale(W / (2 * Math.PI)));
    features.forEach(f => {
      const sel = String(f.id) === selectedId;
      g.beginPath(); path.context(g)(f);
      g.fillStyle = sel ? '#ffd166' : landColor(f);
      g.fill();
      g.strokeStyle = sel ? '#ff9f1c' : 'rgba(10,16,24,0.85)';
      g.lineWidth = sel ? 4 : 2;
      g.stroke();
    });
    if (tex) tex.needsUpdate = true;
  }

  function landColor(f) {
    const pal = ['#3f7a52', '#48855c', '#3c7450', '#528a5e', '#468058', '#5b8f63'];
    let h = 0; const s = String(f.id) + (f.properties.name || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return pal[h % pal.length];
  }

  function uvToLonLat(uv) { return [uv.x * 360 - 180, uv.y * 180 - 90]; }

  function pickCountry(lonlat) {
    for (const f of features) {
      if (d3.geoContains(f, lonlat)) return f;
    }
    return null;
  }

  function centroid3D(f) {
    const [lon, lat] = d3.geoCentroid(f);
    const phi = (lon + 180) / 360 * Math.PI * 2;
    const theta = (90 - lat) / 180 * Math.PI;
    return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
  }

  Modules.globe = async function (ctx) {
    ctx.setLoading('加载世界地图数据…', 30);
    await loadData();
    ctx.setLoading('绘制地球…', 60);
    paint();
    tex = new THREE.CanvasTexture(painted);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 8;
    sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 96),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 })
    );
    ctx.root.add(sphere);
    ctx.pickables.push(sphere);
    // 大气光晕
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.045, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, depthWrite: false,
        vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.,0.,1.)), 2.6); gl_FragColor = vec4(0.35,0.62,1.0, 1.0) * i; }'
      })
    );
    ctx.root.add(atmo);
    // 星空
    const starGeo = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 1200; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(24 + Math.random() * 10);
      sp.push(v.x, v.y, v.z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    ctx.root.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9db4d0, size: 0.06, sizeAttenuation: true })));
    ctx.scene.fog = null;

    // 交互
    ctx.onPick = hit => {
      if (!hit.uv) return false;
      const f = pickCountry(uvToLonLat(hit.uv));
      if (!f) return false;
      selectedId = String(f.id);
      paint();
      const info = infoOf(f);
      const [lon, lat] = d3.geoCentroid(f);
      const capitalLine = (info.capitalZh || info.capital) ? `<li><b>首都</b>:${esc(info.capitalZh || '')} ${esc(info.capital || '')}</li>` : '';
      ctx.setInfo({
        title: (info.flag ? info.flag + ' ' : '') + info.zh,
        latin: info.en, cat: [info.region || '地理'].filter(Boolean),
        html:
          `<div class="kb-sec"><h4>▍基本信息</h4><ul>
            ${capitalLine}
            ${info.region ? `<li><b>大洲/地区</b>:${esc(info.region)}</li>` : ''}
            ${info.pop ? `<li><b>人口</b>:${esc(info.pop)}</li>` : ''}
            ${info.area ? `<li><b>面积</b>:${fmtArea(info.area)} 平方公里</li>` : ''}
            <li><b>地理坐标(几何中心)</b>:${lat.toFixed(1)}°, ${lon.toFixed(1)}°</li>
          </ul></div>` +
          (info.intro ? ctx.kbSection('简介', `<p>${info.intro}</p>`) : '') +
          `<div style="font-size:11.5px;color:var(--txt-dim)">在右侧 AI 面板可以继续深入提问(如"它的邻国有哪些")</div>`
      });
      ctx.aiContext = { model: '地球仪 · ' + info.zh, part: { term: info.zh, kb: `${info.en};首都${info.capitalZh || info.capital};人口${info.pop};面积${info.area}km²。${info.intro || ''}` } };
      // 相机飞向该国
      const dir = centroid3D(f);
      const end = dir.clone().multiplyScalar(2.35);
      ctx.flyTo(end, [0, 0, 0]);
      return true;
    };

    // 悬停显示国名
    let hoverId = null, lastMove = 0;
    canvasMove(ctx);
    function canvasMove(ctx) {
      const el = document.getElementById('c3d');
      el.addEventListener('pointermove', async e => {
        if (Date.now() - lastMove < 60) return; lastMove = Date.now();
        const pointer = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
        const ray = new THREE.Raycaster();
        ray.setFromCamera(pointer, ctx.camera);
        const hits = ray.intersectObject(sphere);
        if (!hits.length || !hits[0].uv) { ctx.setPartLabel(null); hoverId = null; return; }
        const f = pickCountry(uvToLonLat(hits[0].uv));
        if (!f) { ctx.setPartLabel(null); hoverId = null; return; }
        const info = infoOf(f);
        // 标签定位到交点
        ctx.setPartLabel(info.zh + (info.capitalZh ? ' · ' + info.capitalZh : ''), hits[0].point);
      });
    }

    ctx.setPresets([
      { name: '亚洲', dir: [0.9, 0.45, 0.6] },
      { name: '欧洲', dir: [0.7, 0.55, -0.75] },
      { name: '非洲', dir: [-0.1, 0.2, 1.05] },
      { name: '北美洲', dir: [-1.15, 0.5, 0.35] },
      { name: '南美洲', dir: [-0.95, -0.5, 0.55] },
      { name: '大洋洲', dir: [0.85, -0.75, 0.5] },
      { name: '南极洲', dir: [0, -1.2, 0.2], up: [0, 0.4, 1] }
    ]);
    ctx.defaultDir = [0.75, 0.4, 0.95];
    ctx.defaultDist = 2.6;
    ctx.controls.autoRotate = true; ctx.controls.autoRotateSpeed = 0.55;
    ctx.controls.addEventListener('start', () => { ctx.controls.autoRotate = false; });
    ctx.resetView();
    ctx.aiContext = { model: '地球仪', part: null };
    if (window.AIPanel) AIPanel.addKB({ entries: [] });
    ctx.setInfo(null);
    ctx.hideLoading();
    ctx.showInfoPanel(false);
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function fmtArea(a) { return Number(a).toLocaleString('zh-CN'); }
})();
