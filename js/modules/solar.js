/* ============ 太阳系模块 ============ */
window.Modules = window.Modules || {};
(function () {
  'use strict';
  const SUN = {
    name: '太阳', en: 'Sun', color: 0xffce4d, r: 0.55, dist: 0,
    facts: ['直径 139.2 万公里(约为地球109倍)', '质量占整个太阳系的 99.86%', '表面温度约 5500℃,核心约 1500 万℃', '能量来源:氢核聚变'],
    intro: '太阳是太阳系的中心天体,一颗 G 型主序星(黄矮星),约占太阳系总质量的 99.86%。它通过核心的氢核聚变持续发光发热,是地球上几乎所有能量的最终来源。'
  };
  const PLANETS = [
    { name: '水星', en: 'Mercury', color: 0x9d928c, r: 0.05, dist: 1.15, period: 88, rot: 58.6, size: '直径 4,879 km', moons: 0, temp: '-173 ~ 427℃', intro: '距太阳最近的行星,没有真正的大气层,昼夜温差是八大行星中最大的。表面布满环形山,与月球相似。', facts: ['公转周期约 88 天,是公转最快的行星', '无卫星、无大气保温,温差极大'] },
    { name: '金星', en: 'Venus', color: 0xe8c46e, r: 0.075, dist: 1.6, period: 225, rot: -243, size: '直径 12,104 km', moons: 0, temp: '约 464℃', intro: '大小与地球接近,但拥有以二氧化碳为主的浓密大气,温室效应使它成为太阳系最热的行星。它自转方向与其他行星相反,在金星上太阳西升东落。', facts: ['自转方向独特(逆向自转)', '一天比一年还长(自转243天 > 公转225天)'] },
    { name: '地球', en: 'Earth', color: 0x4d7cc7, r: 0.08, dist: 2.1, period: 365.25, rot: 1, size: '直径 12,742 km', moons: 1, temp: '平均约 15℃', intro: '目前已知唯一存在生命的行星。71% 的表面被海洋覆盖,拥有氮氧为主的大气和磁场保护。', facts: ['唯一液态水大量存在的行星', '拥有1颗卫星——月球'] },
    { name: '火星', en: 'Mars', color: 0xc1603e, r: 0.062, dist: 2.65, period: 687, rot: 1.03, size: '直径 6,779 km', moons: 2, temp: '平均约 -63℃', intro: '因氧化铁表面呈红色。拥有太阳系最高的火山奥林帕斯山(约21km)和最大的峡谷水手号峡谷,是人类行星探测与移民设想的热门目标。', facts: ['有2颗小卫星:火卫一、火卫二', '两极有水冰和干冰构成的极冠'] },
    { name: '木星', en: 'Jupiter', color: 0xc9a06e, r: 0.24, dist: 3.8, period: 4333, rot: 0.41, size: '直径 139,820 km', moons: 95, temp: '约 -108℃', intro: '太阳系最大的行星,质量是其他七颗行星总和的2.5倍。标志性的大红斑是持续了数百年的巨型风暴。拥有众多卫星,其中木卫二(欧罗巴)冰下海洋是生命探索热点。', facts: ['自转最快(约10小时)', '大红斑:直径大于地球的风暴'] },
    { name: '土星', en: 'Saturn', color: 0xdbb877, r: 0.2, dist: 5.0, period: 10759, rot: 0.45, size: '直径 116,460 km', moons: 146, temp: '约 -139℃', intro: '以壮丽的光环闻名,光环主要由冰粒与岩石碎块组成。平均密度小于水——如果有足够大的水池,土星可以浮起来。卫星土卫六(泰坦)拥有浓厚大气和液态甲烷湖。', facts: ['确认卫星数最多的行星(146颗)', '密度 0.687 g/cm³,比水还小'] },
    { name: '天王星', en: 'Uranus', color: 0x7fd4d9, r: 0.12, dist: 6.0, period: 30687, rot: -0.72, size: '直径 50,724 km', moons: 28, temp: '约 -197℃', intro: '自转轴几乎躺倒在轨道面上(倾角约98°),像"滚动"着绕太阳公转,可能源于早期一次巨大撞击。大气中的甲烷吸收红光,使它呈青蓝色。', facts: ['"躺着"自转的行星', '大气温度为行星中最低'] },
    { name: '海王星', en: 'Neptune', color: 0x4666e0, r: 0.115, dist: 6.9, period: 60190, rot: 0.67, size: '直径 49,244 km', moons: 16, temp: '约 -201℃', intro: '距太阳最远的行星,先由数学计算预言、后经观测证实(1846年)。拥有太阳系最强的风暴,风速可达每小时2100公里。', facts: ['第一颗"笔尖上发现"的行星', '风速为太阳系之最'] }
  ];

  Modules.solar = async function (ctx) {
    ctx.scene.fog = null;
    // 星空
    const starGeo = new THREE.BufferGeometry(); const sp = [];
    for (let i = 0; i < 1500; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(28 + Math.random() * 14); sp.push(v.x, v.y, v.z); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    ctx.root.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaab8d0, size: 0.05 })));

    const orbitGroup = new THREE.Group(); ctx.root.add(orbitGroup);
    const bodies = [];

    function labelSprite(text) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 80;
      const g = c.getContext('2d');
      g.font = 'bold 44px system-ui, "Microsoft YaHei", sans-serif';
      g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.92)';
      g.shadowColor = '#000'; g.shadowBlur = 8;
      g.fillText(text, 128, 54);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
      s.scale.set(0.42, 0.13, 1); s.renderOrder = 9;
      return s;
    }

    // 太阳
    const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN.r, 48, 48),
      new THREE.MeshBasicMaterial({ color: SUN.color }));
    ctx.root.add(sun);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTex(), color: 0xffd76e, transparent: true, opacity: 0.55, depthWrite: false
    }));
    glow.scale.setScalar(SUN.r * 5); ctx.root.add(glow);
    const sunLabel = labelSprite('太阳'); sunLabel.position.y = SUN.r + 0.18; ctx.root.add(sunLabel);
    sun.userData.body = SUN; ctx.pickables.push(sun);

    PLANETS.forEach((p, i) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 40, 40),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.75, metalness: 0.05 }));
      mesh.userData.body = p;
      ctx.pickables.push(mesh);
      const pivot = new THREE.Group();      // 公转轴
      mesh.position.x = p.dist;
      pivot.add(mesh);
      // 轨道线
      const ring = new THREE.Mesh(new THREE.RingGeometry(p.dist - 0.004, p.dist + 0.004, 128),
        new THREE.MeshBasicMaterial({ color: 0x3a4a66, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      orbitGroup.add(ring); pivot.addRing = ring;
      const lb = labelSprite(p.name); lb.position.y = p.r + 0.14; mesh.add(lb);
      if (p.name === '土星') {
        const tr = new THREE.Mesh(new THREE.RingGeometry(p.r * 1.4, p.r * 2.2, 64),
          new THREE.MeshStandardMaterial({ color: 0xd8c08a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, roughness: 0.8 }));
        tr.rotation.x = -Math.PI / 2 + 0.35;
        mesh.add(tr);
      }
      orbitGroup.add(pivot);
      bodies.push({ p, mesh, pivot, angle: Math.random() * Math.PI * 2, speed: 0.16 * 365.25 / p.period });
    });

    let paused = false;
    ctx.onTick.push((dt) => {
      if (paused) return;
      bodies.forEach(b => {
        b.angle += b.speed * dt;
        b.pivot.rotation.y = b.angle;
        b.mesh.rotation.y += dt * 0.6;
      });
    });

    function card(body, isSun) {
      const b = body;
      const rows = [];
      if (b.size) rows.push('<li><b>大小</b>:' + b.size + '</li>');
      if (!isSun) {
        rows.push('<li><b>距太阳</b>:' + (b.dist / 2.1).toFixed(2) + ' 天文单位(约' + (b.dist / 2.1 * 1.496).toFixed(0) + ' 亿公里)</li>');
        rows.push('<li><b>公转周期</b>:' + (b.period >= 1000 ? (b.period / 365.25).toFixed(1) + ' 年' : b.period + ' 天') + '</li>');
        rows.push('<li><b>卫星数</b>:' + b.moons + '</li>');
        rows.push('<li><b>表面温度</b>:' + b.temp + '</li>');
      } else {
        rows.push('<li><b>类型</b>:G型主序星(黄矮星)</li>');
      }
      (b.facts || []).forEach(f => rows.push('<li>' + f + '</li>'));
      ctx.setInfo({
        title: b.name, latin: b.en, cat: [isSun ? '恒星' : '行星'],
        html: ctx.kbSection('简介', `<p>${b.intro}</p>`) + ctx.kbSection('数据与看点', '<ul>' + rows.join('') + '</ul>') +
          `<div style="font-size:11.5px;color:var(--txt-dim)">⚠ 行星大小与轨道距离经过压缩以便观察,非真实比例;真实比例下太阳直径约为此处地球显示大小的50倍。</div>`
      });
      ctx.aiContext = { model: '太阳系', part: { term: b.name, kb: b.intro + (b.facts || []).join(';') } };
      // 聚焦:暂停公转,相机从行星外侧上方观察
      const cur = b.mesh ? b.mesh.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
      if (!isSun) {
        paused = true;
        const btn = document.querySelector('.vp-btn');
        if (btn && btn.textContent.includes('暂停')) btn.textContent = '▶ 继续公转';
        const d = Math.max(b.r * 4.5, 0.75);
        const radial = cur.clone().setY(0).normalize();               // 日→行星方向
        const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), radial).normalize();
        const end = cur.clone().addScaledVector(side, d * 0.9).addScaledVector(radial, d * 0.55).add(new THREE.Vector3(0, d * 0.5, 0));
        ctx.flyTo(end, cur.toArray());
      } else {
        ctx.flyTo(new THREE.Vector3(1.6, 1.1, 1.9), [0, 0, 0]);
      }
    }

    ctx.onPick = hit => { card(hit.object.userData.body, hit.object.userData.body === SUN); return true; };
    ctx.onTick.push(() => { /* 选中行星实时跟随省略:模型动、相机目标静态,视觉可接受 */ });

    // 控制条
    ctx.setPresets([{ name: '俯视全景', dir: [0.001, 1, 0.45], up: [0, 0.4, -1], dist: 11 }, { name: '斜视全景', dir: [0.7, 0.5, 1], dist: 10 }]);
    Ctx.applyPresetExtras = null;
    ctx.defaultDir = [0.7, 0.55, 1]; ctx.defaultDist = 9.5;
    ctx.resetView();
    const btn = document.createElement('button');
    btn.className = 'vp-btn'; btn.textContent = '⏸ 暂停公转';
    btn.onclick = () => { paused = !paused; btn.textContent = paused ? '▶ 继续公转' : '⏸ 暂停公转'; };
    document.getElementById('viewPresets').appendChild(btn);
    ctx.setInfo(null); ctx.hideLoading(); ctx.showInfoPanel(false);
    ctx.aiContext = { model: '太阳系', part: null };

    function radialTex() {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,220,120,1)'); gr.addColorStop(0.35, 'rgba(255,190,80,0.35)'); gr.addColorStop(1, 'rgba(255,180,60,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
  };
})();
