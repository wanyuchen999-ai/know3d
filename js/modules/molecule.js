/* ============ 化学分子模块(球棍模型) ============ */
window.Modules = window.Modules || {};
(function () {
  'use strict';
  const CPK = {
    H: { c: 0xf2f2f2, r: 0.30, name: '氢', z: 1, mass: '1.008', note: '最轻的元素,宇宙中丰度最高' },
    C: { c: 0x5a5a5a, r: 0.44, name: '碳', z: 6, mass: '12.011', note: '有机物的骨架,可形成4个共价键' },
    N: { c: 0x3050f8, r: 0.42, name: '氮', z: 7, mass: '14.007', note: '空气中含量最多的元素(78%)' },
    O: { c: 0xe34f4f, r: 0.42, name: '氧', z: 8, mass: '15.999', note: '地壳中丰度最高的元素' },
    S: { c: 0xe3d43f, r: 0.52, name: '硫', z: 16, mass: '32.06', note: '常见价态 -2、+4、+6' },
    P: { c: 0xe08a2e, r: 0.52, name: '磷', z: 15, mass: '30.974', note: '核酸与ATP的重要组成' },
    Cl: { c: 0x3fce3f, r: 0.50, name: '氯', z: 17, mass: '35.45', note: '卤族元素,常见价态 -1' }
  };
  const BOND_INFO = { 1: '单键(σ键)', 2: '双键(1σ+1π)', 3: '三键(1σ+2π)' };

  Modules.molecule = async function (ctx) {
    const molId = ctx.entry.mol;
    const data = await (await fetch('data/chem/' + molId + '.json')).json();
    ctx.setLoading('构建分子模型…', 60);

    const group = new THREE.Group();
    const atomMeshes = [];
    // 原子
    data.atoms.forEach((a, i) => {
      const el = CPK[a.el] || CPK.C;
      const m = new THREE.Mesh(new THREE.SphereGeometry(el.r, 36, 36),
        new THREE.MeshStandardMaterial({ color: el.c, roughness: 0.35, metalness: 0.1 }));
      m.position.set(a.x, a.y, a.z);
      m.userData.atom = { i, el: a.el };
      group.add(m); ctx.pickables.push(m); atomMeshes.push(m);
    });
    // 键
    const bondMeshes = [];
    (data.bonds || []).forEach(bd => {
      const [i, j, order] = bd;
      const p1 = atomMeshes[i].position, p2 = atomMeshes[j].position;
      const r1 = CPK[data.atoms[i].el].r, r2 = CPK[data.atoms[j].el].r;
      const n = order >= 3 ? 3 : Math.max(1, order);
      for (let k = 0; k < n; k++) {
        const off = n === 1 ? 0 : (k - (n - 1) / 2) * 0.13;
        const cyl = bondCyl(p1, p2, r1, r2, off);
        cyl.userData.bond = { i, j, order: order || 1, len: p1.distanceTo(p2) };
        group.add(cyl); ctx.pickables.push(cyl); bondMeshes.push(cyl);
      }
    });
    ctx.root.add(group);

    function bondCyl(p1, p2, r1, r2, offset) {
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      // 每根键分两段,从原子表面开始
      const geo = new THREE.CylinderGeometry(0.085, 0.085, len - r1 - r2, 12);
      const mid = new THREE.Vector3().addVectors(
        p1.clone().addScaledVector(dir.clone().normalize(), r1),
        p2.clone().addScaledVector(dir.clone().normalize(), -r2)
      ).multiplyScalar(0.5);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xb9c2cc, roughness: 0.5, metalness: 0.25 }));
      m.position.copy(mid);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      // 侧面偏移(双键/三键)
      if (offset) {
        const perp = new THREE.Vector3(0, 0, 1).cross(dir).normalize();
        if (perp.lengthSq() < 0.01) perp.set(1, 0, 0);
        m.position.addScaledVector(perp.normalize(), offset);
      }
      return m;
    }

    ctx.onPick = hit => {
      if (hit.object.userData.atom) {
        const a = hit.object.userData.atom;
        const el = CPK[a.el] || CPK.C;
        ctx.setInfo({
          title: el.name + ' 原子(' + a.el + ')', latin: 'Element #' + el.z,
          cat: ['化学元素'],
          html: ctx.kbSection('元素信息', `<ul>
            <li><b>元素符号</b>:${a.el}</li><li><b>原子序数</b>:${el.z}</li>
            <li><b>相对原子质量</b>:${el.mass}</li><li><b>说明</b>:${el.note}</li></ul>`) +
            ctx.kbSection('在这个分子中', `<p>该分子共有 ${data.atoms.length} 个原子、${(data.bonds || []).length} 个化学键(不含氢键)。${data.angles ? data.angles : ''}</p>`)
        });
        ctx.aiContext = { model: data.name + ' ' + data.formula, part: { term: a.el + ' 原子', kb: el.note } };
      } else if (hit.object.userData.bond) {
        const b = hit.object.userData.bond;
        const e1 = data.atoms[b.i].el, e2 = data.atoms[b.j].el;
        ctx.setInfo({
          title: e1 + '—' + e2 + ' 化学键', latin: BOND_INFO[b.order] || '化学键',
          cat: ['化学键'],
          html: ctx.kbSection('键信息', `<ul>
            <li><b>类型</b>:${BOND_INFO[b.order] || '共价键'}</li>
            <li><b>连接原子</b>:${e1} 与 ${e2}</li>
            <li><b>键长(模型)</b>:${b.len.toFixed(2)} Å</li></ul>`) +
            ctx.kbSection('小知识', '<p>共价键通过共用电子对形成。双键、三键中含 π 键,较易发生加成反应;键长越短、键能越大,越稳定。</p>')
        });
        ctx.aiContext = { model: data.name, part: { term: e1 + '—' + e2 + ' 键', kb: BOND_INFO[b.order] } };
      }
      return true;
    };

    ctx.setInfo({
      title: data.name + ' ' + data.formula, latin: data.en, cat: ['分子'],
      html: ctx.kbSection('简介', `<p>${data.note || ''}</p>`) +
        ctx.kbSection('操作', '<ul><li>点击<b>原子</b>查看元素信息</li><li>点击<b>棍(键)</b>查看键级与键长</li><li>可继续在 AI 面板追问(如"它有什么化学性质")</li></ul>')
    });
    ctx.aiContext = { model: data.name + ' ' + data.formula, part: { term: data.name, kb: data.note } };
    ctx.defaultDir = [0.5, 0.3, 1]; ctx.defaultDist = 7; ctx.resetView();
    ctx.hideLoading();
  };
})();
