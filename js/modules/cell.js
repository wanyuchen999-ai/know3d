/* ============ 动物细胞模式图模块 ============ */
window.Modules = window.Modules || {};
(function () {
  'use strict';
  const ORGANELLES = [
    { term: '细胞膜', en: 'Cell membrane', color: 0x7fc4e8, desc: '磷脂双分子层结构(流动镶嵌模型),把细胞与外界分开,控制物质进出、进行细胞通讯。' },
    { term: '细胞质基质', en: 'Cytosol', color: 0x9fd8ef, desc: '胶状的水性基质,内含各种离子与小分子,是许多代谢反应(如糖酵解)的场所。' },
    { term: '细胞核', en: 'Nucleus', color: 0x9f7fe8, desc: '细胞的"控制中心",由核膜(双层膜,含核孔)包被,内含染色质(DNA+蛋白质),是遗传信息储存与转录的场所。' },
    { term: '核仁', en: 'Nucleolus', color: 0x7a5cd6, desc: '核内的致密区域,是核糖体RNA(rRNA)合成与核糖体亚基组装的场所。' },
    { term: '线粒体', en: 'Mitochondrion', color: 0xe07a5f, desc: '双层膜结构,内膜折叠成嵴。进行有氧呼吸,是细胞的"动力车间",合成ATP。含自己的DNA(半自主性),母系遗传。' },
    { term: '内质网', en: 'Endoplasmic reticulum', color: 0xc9a3cc, desc: '膜性管网系统。粗面内质网(附着核糖体)参与蛋白质合成加工;滑面内质网参与脂质合成与解毒。' },
    { term: '核糖体', en: 'Ribosome', color: 0x64b677, desc: '无膜结构的颗粒(由rRNA和蛋白质构成),是"生产蛋白质的机器",将mRNA翻译成多肽链。' },
    { term: '高尔基体', en: 'Golgi apparatus', color: 0xf2b134, desc: '由扁平囊和囊泡构成,对来自内质网的蛋白质进行加工、分类、包装与运输,是"发送站";也参与溶酶体酶的分选。' },
    { term: '溶酶体', en: 'Lysosome', color: 0xdf6ba0, desc: '内含多种酸性水解酶的单层膜小体,是细胞的"消化车间",分解衰老细胞器和吞入的物质。' },
    { term: '中心体', en: 'Centrosome', color: 0x8a9bb0, desc: '由两个互相垂直的中心粒组成,动物细胞特有的细胞器,参与细胞分裂时纺锤体的形成。' }
  ];

  Modules.cell = async function (ctx) {
    const mat = (c, o = 1, rough = 0.55) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, transparent: o < 1, opacity: o });
    const root = ctx.root;
    const labelSprites = [];

    // 细胞膜(半透明球)
    const membrane = new THREE.Mesh(new THREE.SphereGeometry(1.25, 48, 48), mat(ORGANELLES[0].color, 0.14, 0.3));
    membrane.userData.org = ORGANELLES[0];
    root.add(membrane); ctx.pickables.push(membrane);

    // 细胞质基调
    const cyto = new THREE.Mesh(new THREE.SphereGeometry(1.22, 32, 32), mat(0x2a5f78, 0.28, 0.9));
    cyto.userData.org = ORGANELLES[1];
    root.add(cyto); ctx.pickables.push(cyto);

    // 细胞核 + 核仁
    const nucleus = new THREE.Group();
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 40), mat(ORGANELLES[2].color, 0.92));
    nuc.userData.org = ORGANELLES[2];
    nucleus.add(nuc); ctx.pickables.push(nuc);
    const nucEnv = new THREE.Mesh(new THREE.SphereGeometry(0.435, 32, 32), mat(0xd8d0f0, 0.25));
    nucEnv.userData.org = ORGANELLES[2];
    nucleus.add(nucEnv); ctx.pickables.push(nucEnv);
    const nuc2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), mat(ORGANELLES[3].color, 1, 0.7));
    nuc2.position.set(0.1, 0.08, 0.16);
    nuc2.userData.org = ORGANELLES[3];
    nucleus.add(nuc2); ctx.pickables.push(nuc2);
    // 染色质斑点
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.035 + Math.random() * 0.03, 8, 8), mat(0x5d3fb0, 1, 0.8));
      s.position.setFromSphericalCoords(0.28, Math.acos(2 * Math.random() - 1), Math.random() * Math.PI * 2);
      s.userData.org = ORGANELLES[2]; nucleus.add(s); ctx.pickables.push(s);
    }
    nucleus.position.set(-0.32, 0.1, 0);
    root.add(nucleus);

    // 内质网:环绕核的环结
    const er = new THREE.Mesh(new THREE.TorusKnotGeometry(0.58, 0.055, 120, 12, 1, 3), mat(ORGANELLES[5].color, 0.95, 0.6));
    er.position.set(-0.25, 0.08, 0); er.scale.set(1, 0.72, 1);
    er.userData.org = ORGANELLES[5];
    root.add(er); ctx.pickables.push(er);

    // 核糖体(附着+游离)
    for (let i = 0; i < 36; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), mat(ORGANELLES[6].color, 1, 0.5));
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.75 + Math.random() * 0.35);
      s.position.copy(v);
      s.userData.org = ORGANELLES[6];
      root.add(s); ctx.pickables.push(s);
    }

    // 高尔基体:一叠扁囊
    const golgi = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.19 - i * 0.012, 24, 12), mat(ORGANELLES[7].color, 0.95, 0.55));
      d.scale.set(1.25, 0.18, 1);
      d.position.y = (i - 2) * 0.085;
      d.rotation.z = 0.15 + i * 0.05;
      d.userData.org = ORGANELLES[7];
      golgi.add(d); ctx.pickables.push(d);
    }
    golgi.position.set(0.55, 0.32, 0.25);
    root.add(golgi);

    // 线粒体 ×3(带嵴)
    [[0.62, -0.28, 0.3, 0.5], [0.05, -0.55, -0.35, -0.3], [-0.15, 0.62, 0.42, 0.9]].forEach(([x, y, z, ry]) => {
      const mito = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.26, 8, 20), mat(ORGANELLES[4].color, 0.95, 0.5));
      body.userData.org = ORGANELLES[4];
      mito.add(body); ctx.pickables.push(body);
      for (let k = -2; k <= 2; k++) {
        const crista = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 8, 24), mat(0x9c3f2b, 1, 0.6));
        crista.rotation.x = Math.PI / 2;
        crista.position.y = k * 0.085;
        crista.userData.org = ORGANELLES[4];
        mito.add(crista); ctx.pickables.push(crista);
      }
      mito.position.set(x, y, z); mito.rotation.z = ry;
      root.add(mito);
    });

    // 溶酶体 ×3
    [[0.25, 0.72, -0.2], [-0.7, -0.35, 0.3], [0.45, -0.05, -0.6]].forEach(([x, y, z], i) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.075 + i * 0.02, 20, 20), mat(ORGANELLES[8].color, 0.92, 0.45));
      s.position.set(x, y, z);
      s.userData.org = ORGANELLES[8];
      root.add(s); ctx.pickables.push(s);
    });

    // 中心体(两个垂直的中心粒)
    const centro = new THREE.Group();
    [[0, 0], [Math.PI / 2, 0]].forEach(([rx]) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16, 1, true), mat(ORGANELLES[9].color, 0.95, 0.5));
      c.material.side = THREE.DoubleSide;
      c.rotation.x = rx;
      c.userData.org = ORGANELLES[9];
      centro.add(c); ctx.pickables.push(c);
    });
    centro.position.set(0.18, -0.72, 0.5);
    root.add(centro);

    // 名称标注
    const labelPos = { '细胞膜': [0, 1.42, 0], '细胞核': [-0.32, 0.62, 0], '线粒体': [0.82, -0.2, 0.3], '内质网': [-0.95, 0.35, 0], '高尔基体': [0.72, 0.55, 0.25], '溶酶体': [0.3, 0.92, -0.2], '中心体': [0.25, -0.92, 0.5], '核糖体': [0.15, 0.2, 0.95] };
    Object.entries(labelPos).forEach(([term, pos]) => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 72;
      const g = c.getContext('2d');
      g.font = 'bold 38px system-ui, "Microsoft YaHei"'; g.textAlign = 'center';
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.shadowColor = '#000'; g.shadowBlur = 8;
      g.fillText(term, 128, 48);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
      s.scale.set(0.34, 0.096, 1); s.position.set(...pos); s.renderOrder = 9;
      root.add(s); labelSprites.push(s);
    });

    ctx.onPick = hit => {
      const org = hit.object.userData.org;
      if (!org) return false;
      ctx.setInfo({ title: org.term, latin: org.en, cat: ['细胞生物学'], html: ctx.kbSection('结构与功能', `<p>${org.desc}</p>`) + '<div style="font-size:11.5px;color:var(--txt-dim)">⚠ 本模型为教学模式图,比例与形态做了简化</div>' });
      ctx.aiContext = { model: '动物细胞', part: { term: org.term, kb: org.desc } };
      return true;
    };
    ctx.onHotspotSelect = null;
    document.getElementById('btnLabels').onclick = null;
    document.getElementById('btnLabels').onclick = e => {
      labelSprites.forEach(s => s.visible = !s.visible);
      e.currentTarget.classList.toggle('on', !labelSprites[0].visible);
    };

    ctx.defaultDir = [0.4, 0.3, 1]; ctx.defaultDist = 3.4; ctx.resetView();
    ctx.setInfo(null); ctx.hideLoading(); ctx.showInfoPanel(false);
    ctx.aiContext = { model: '动物细胞(模式图)', part: null };
  };
})();
