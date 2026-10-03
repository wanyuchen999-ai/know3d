/* ============ 骨的构造(长骨剖面 · 模式图)模块 ============
 * 对应系统解剖学"骨学总论":骨质(骨密质/骨松质)、骨膜、骨髓(红/黄)、骨髓腔、关节软骨、骺线、滋养孔
 */
window.Modules = window.Modules || {};
(function () {
  'use strict';
  /* 长骨外形半径函数(与剖面绘制共用) */
  function radiusAt(y) {           // y ∈ [-1.4, 1.4]
    const a = Math.abs(y);
    if (a > 1.05) {                // 骨骺膨大
      const t = (a - 1.05) / 0.35;
      return 0.21 + Math.sin(t * Math.PI * 0.72) * 0.155 - t * t * 0.05;
    }
    return 0.16 + Math.pow(1 - Math.min(a / 1.05, 1), 3) * 0.05;  // 骨干(两端略粗)
  }
  const CORTEX = y => Math.max(0.022, radiusAt(y) * 0.16);       // 骨密质厚度

  const HS = [
    { term: '关节软骨', en: 'Articular cartilage', pos: [0, 1.36, 0.12], desc: '覆盖在骨关节面上的透明软骨,表面光滑,能减少摩擦、缓冲震荡。关节软骨没有血管,靠滑液营养,损伤后极难自愈。', point: '骨的构造考点:关节软骨属于透明软骨,不参与骨的生长(骺软骨才负责长长)。' },
    { term: '骨松质', en: 'Spongy bone', pos: [0.12, 1.02, 0.2], desc: '由针状或片状的骨小梁交织而成,呈海绵状,分布在长骨两端(骨骺)、扁骨板障等处。骨小梁排列方向与受力线一致,既轻又坚固。', point: '骨松质由骨小梁构成,红骨髓位于骨松质间隙内(髂骨、胸骨、椎骨等处终生保留红骨髓,是骨髓穿刺常用部位)。' },
    { term: '骺线', en: 'Epiphyseal line', pos: [0, 0.9, 0.28], desc: '成年后骺软骨骨化遗留的致密线痕,标志骨的长度增长停止。儿童时期此处为骺软骨(骺板),不断骨化使骨变长。', point: '考点:骺软骨保留→骨仍能长长;骺软骨完全骨化形成骺线→骨不能再长长。X光片上骺线存在与否可用于判断年龄。' },
    { term: '骨密质', en: 'Compact bone', pos: [0.02, 0.2, 0.3], desc: '质地致密坚硬,分布于长骨骨干和骨骺外层,抗压抗扭曲能力强,由规则排列的骨板(哈弗斯系统)构成。', point: '骨密质在骨干最厚,是长骨承重的主体结构;颅盖骨的密质分为内板和外板。' },
    { term: '骨髓腔', en: 'Medullary cavity', pos: [0, 0.1, 0.02], desc: '骨干中空的腔隙,内充填骨髓。骨髓腔的存在使骨在保证强度的同时大大减轻重量。', point: '胎儿及幼儿的骨髓腔内全是红骨髓,5岁以后逐渐被黄骨髓(脂肪组织)代替。' },
    { term: '黄骨髓', en: 'Yellow marrow', pos: [0, -0.35, 0.02], desc: '脂肪组织,失去造血能力,但大出血时可部分转化为红骨髓恢复造血。', point: '考点:黄骨髓位于成人长骨骨髓腔,成分为脂肪,正常时无造血功能。' },
    { term: '红骨髓', en: 'Red marrow', pos: [0.1, 1.18, 0.1], desc: '造血组织,位于骨松质间隙(椎骨、髂骨、肋骨、胸骨、颅骨等),终生保持造血功能。', point: '考点:红骨髓是造血器官(红细胞、白细胞、血小板都由它产生)。临床骨髓穿刺常选髂前/髂后上棘或胸骨。' },
    { term: '骨膜', en: 'Periosteum', pos: [-0.28, -0.1, 0.18], desc: '除关节面外,骨表面覆有的致密结缔组织膜,分外层(纤维层,固定保护)与内层(成骨层,含成骨细胞与破骨细胞)。', point: '考点:骨膜内层参与骨的增粗与骨折修复——骨膜保留则骨可再生;骨膜感觉神经丰富,骨折时剧痛。' },
    { term: '滋养孔', en: 'Nutrient foramen', pos: [0.16, -0.55, 0.06], desc: '骨干表面的细小孔道,滋养血管由此进入骨内,营养骨密质与骨髓。', point: '长骨滋养孔多位于骨干中段,血流方向"向骺端走行"——骨折若断离滋养动脉可致骨坏死(如股骨颈骨折)。' }
  ];

  Modules['bone-structure'] = async function (ctx) {
    const group = new THREE.Group();
    const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);  // 保留 x<=0 的一半

    /* 外形(车削面) */
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const y = -1.4 + i / 80 * 2.8;
      pts.push(new THREE.Vector2(Math.max(radiusAt(y), 0.02), y));
    }
    const boneGeo = new THREE.LatheGeometry(pts, 96);
    const boneMesh = new THREE.Mesh(boneGeo, new THREE.MeshStandardMaterial({
      color: 0xe6dcc8, roughness: 0.75, side: THREE.DoubleSide, clippingPlanes: [clipPlane]
    }));
    group.add(boneMesh);

    /* 剖面(canvas 绘制切面) */
    const cutTex = drawCutFace();
    const cutH = 2.8 * 1.0, cutW = 2 * 0.37;
    const cut = new THREE.Mesh(new THREE.PlaneGeometry(cutW, cutH), new THREE.MeshBasicMaterial({
      map: cutTex, side: THREE.DoubleSide
    }));
    cut.rotation.y = Math.PI / 2;      // 位于 x=0 平面,法线朝 ±x
    cut.position.x = -0.001;
    group.add(cut);

    /* 关节软骨(两端半透明壳帽) */
    [1.335, -1.335].forEach(sy => {
      const pts2 = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const y = sy + (sy > 0 ? (t - 1) : (1 - t)) * 0.13;
        pts2.push(new THREE.Vector2(Math.max(radiusAt(y) + 0.018, 0.03), y));
      }
      const cap = new THREE.Mesh(new THREE.LatheGeometry(pts2, 64), new THREE.MeshStandardMaterial({
        color: 0xbfe3ef, roughness: 0.25, transparent: true, opacity: 0.85, clippingPlanes: [clipPlane]
      }));
      group.add(cap);
    });

    /* 骨膜(半透明薄套,骨干部分) */
    const periPts = [];
    for (let i = 0; i <= 30; i++) {
      const y = -0.98 + i / 30 * 1.96;
      periPts.push(new THREE.Vector2(radiusAt(y) + 0.012, y));
    }
    const peri = new THREE.Mesh(new THREE.LatheGeometry(periPts, 96), new THREE.MeshStandardMaterial({
      color: 0xd8b4a0, roughness: 0.6, transparent: true, opacity: 0.42, clippingPlanes: [clipPlane]
    }));
    group.add(peri);

    /* 骺线(两端细环) */
    [0.9, -0.9].forEach(sy => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(sy) - 0.008, 0.006, 8, 64), new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.8 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = sy;
      group.add(ring);
    });

    /* 滋养孔(骨干表面小暗点) */
    const nf = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), new THREE.MeshStandardMaterial({ color: 0x3a2f22 }));
    nf.position.set(radiusAt(-0.55) * Math.cos(0.3), -0.55, radiusAt(-0.55) * Math.sin(0.3) + 0.0);
    nf.scale.set(1, 0.6, 0.6);
    group.add(nf);

    ctx.root.add(group);

    /* 剖面贴图 */
    function drawCutFace() {
      const W = 512, H = 2048;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      const y2px = y => (0.5 - y / 2.8) * H;
      const r2px = r => r / 0.37 * (W / 2);
      // 整体轮廓(骨密质区域)
      function outline(inset) {
        g.beginPath();
        for (let i = 0; i <= 100; i++) {
          const y = -1.4 + i / 100 * 2.8;
          const r = Math.max(radiusAt(y) - inset, 0.004);
          const px = W / 2 + r2px(r);
          const py = y2px(y);
          i ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        for (let i = 100; i >= 0; i--) {
          const y = -1.4 + i / 100 * 2.8;
          const r = Math.max(radiusAt(y) - inset, 0.004);
          g.lineTo(W / 2 - r2px(r), y2px(y));
        }
        g.closePath();
      }
      // 外层:骨密质
      outline(0); g.fillStyle = '#ddd0b6'; g.fill();
      // 内部
      outline(CORTEX(0.2));
      g.save(); g.clip();
      // 骨干内部:骨髓腔(黄骨髓)
      g.fillStyle = '#e8c15a'; g.fillRect(0, y2px(0.85), W, y2px(-0.85) - y2px(0.85));
      // 两端内部:骨松质 + 红骨髓
      g.fillStyle = '#b0453f';
      g.fillRect(0, 0, W, y2px(0.85));
      g.fillRect(0, y2px(-0.85), W, H - y2px(-0.85));
      // 骨小梁纹理
      g.fillStyle = 'rgba(232,220,196,0.85)';
      for (let i = 0; i < 700; i++) {
        const top = Math.random() < 0.5;
        const py = top ? Math.random() * y2px(0.85) : y2px(-0.85) + Math.random() * (H - y2px(-0.85));
        const px = Math.random() * W;
        g.save(); g.translate(px, py);
        g.rotate((Math.random() - 0.5) * 1.2 + (Math.random() < 0.5 ? 0 : Math.PI / 2));
        g.fillRect(-14, -3, 28, 6);
        g.restore();
      }
      g.restore();
      // 骺线
      g.strokeStyle = 'rgba(90,70,40,0.9)'; g.lineWidth = 7;
      [0.9, -0.9].forEach(sy => {
        g.beginPath();
        g.moveTo(W / 2 - r2px(radiusAt(sy) - CORTEX(sy)), y2px(sy));
        g.lineTo(W / 2 + r2px(radiusAt(sy) - CORTEX(sy)), y2px(sy));
        g.stroke();
      });
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
      return t;
    }

    /* 热点与交互 */
    ctx.setHotspots(HS.map(h => ({ term: h.term, en: h.en, pos: h.pos, viewDir: [0.35, 0.2, 1], data: { desc: h.desc, point: h.point } })));
    ctx.onHotspotSelect = hs => {
      ctx.setInfo({
        title: hs.term, latin: hs.en, cat: ['骨学总论', '模式图'],
        html: ctx.kbSection('解释', `<p>${hs.data.desc}</p>`) + ctx.kbSection('★ 考点', ctx.kbList([hs.data.point])) +
          `<div style="font-size:11.5px;color:var(--txt-dim)">⚠ 模式图(教学示意),实际形态因骨而异</div>`
      });
      ctx.setPartLabel(hs.term, hs.sprite.position);
      ctx.aiContext = { model: '骨的构造(模式图)', part: { term: hs.term, kb: hs.data.desc } };
    };
    ctx.onPick = () => {
      ctx.setInfo({
        title: '骨的构造(长骨剖面 · 模式图)', latin: 'Structure of a long bone', cat: ['骨学总论'],
        html: ctx.kbSection('总览', `<p>骨由<b>骨质</b>(骨密质+骨松质)、<b>骨膜</b>、<b>骨髓</b>(红骨髓/黄骨髓)以及血管神经构成,两端覆有<b>关节软骨</b>。转动模型查看剖面,点击编号标注学习各结构。</p>`) +
          ctx.kbSection('★ 本节考点', ctx.kbList([
            '<b>骨的分类</b>:长骨、短骨、扁骨、不规则骨',
            '<b>骨的构造</b>:骨质(密质/松质)、骨膜、骨髓',
            '<b>红骨髓</b>:终生造血;<b>黄骨髓</b>:脂肪,可应急转化',
            '<b>骺软骨</b>(生长)与<b>骺线</b>(停止生长)的区别',
            '<b>骨膜</b>内层的成骨作用与骨折愈合'
          ])) + '<div style="font-size:11.5px;color:var(--txt-dim)">提示:点击编号 ①-⑨ 查看每个结构的解释与考点</div>'
      });
      ctx.aiContext = { model: '骨的构造(模式图)', part: null };
      return true;
    };
    if (window.AIPanel) {
      AIPanel.addKB({
        entries: HS.map(h => ({ id: h.term, title: h.term + '(' + h.en + ')', terms: h.term, text: h.desc.replace(/\n/g, '') + '<br>考点:' + h.point }))
      });
    }
    // 自测也用热点
    ctx.quizAnswer = null;
    ctx.defaultDir = [0.55, 0.25, 1]; ctx.defaultDist = 4.2; ctx.resetView();
    ctx.setInfo(null); ctx.hideLoading(); ctx.showInfoPanel(false);
    ctx.aiContext = { model: '骨的构造(模式图)', part: null };
  };
})();
