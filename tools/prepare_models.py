# -*- coding: utf-8 -*-
"""
prepare_models.py — 从 BodyParts3D 官方 zip 中抽取骨骼 → 清洗/简化 → 导出 GLB + manifest.json
用法: python tools/prepare_models.py [--zip tools/downloads/isa_BP3D_obj.zip]
输出: models/anatomy/<bone-id>.glb   (已居中、归一化尺度、减面)
      models/anatomy/manifest.json
依赖: pip install trimesh fast-simplification numpy
数据许可: BodyParts3D, © DBCLS, CC BY-SA 2.1 JP
"""
import io, json, os, sys, zipfile, argparse, traceback
import numpy as np
import trimesh
import fast_simplification

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, 'models', 'anatomy')
PARTS_URL = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_parts_list_e.txt'
ELEMENT_URL = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_element_parts.txt'

# BP3D 坐标: x=左右, y=前后, z=上下(头侧)。three.js 需 Y 朝上:
# 默认 (-90,0,0) 即绕 X 轴 -90°: z(上)→y(上)。个别骨因解剖学朝向需微调,见 ORIENT。
ORIENT = {}

# ---------------- 单骨导出表 ----------------
# bid: (英文名, 中文名, 减面目标三角形数)
BONES = {
    'frontal-bone':          ('frontal bone',            '额骨',     60000),
    'parietal-bone':         ('parietal bone',           '顶骨',     60000),
    'temporal-bone':         ('temporal bone',           '颞骨',     90000),
    'occipital-bone':        ('occipital bone',          '枕骨',     80000),
    'sphenoid-bone':         ('sphenoid bone',           '蝶骨',     90000),
    'ethmoid-bone':          ('ethmoid',                 '筛骨',     90000),
    'vomer':                 ('vomer',                   '犁骨',     40000),
    'maxilla':               ('maxilla',                 '上颌骨',   90000),
    'mandible':              ('mandible',                '下颌骨',   90000),
    'zygomatic-bone':        ('zygomatic bone',          '颧骨',     40000),
    'nasal-bone':            ('nasal bone',              '鼻骨',     30000),
    'lacrimal-bone':         ('lacrimal bone',           '泪骨',     30000),
    'palatine-bone':         ('palatine bone',           '腭骨',     40000),
    'inferior-nasal-concha': ('inferior nasal concha',   '下鼻甲',   30000),
    'hyoid-bone':            ('hyoid bone',              '舌骨',     30000),
    'atlas':                 ('atlas',                   '寰椎C1',   60000),
    'axis':                  ('axis',                    '枢椎C2',   60000),
    'cervical-vertebra':     ('fourth cervical vertebra','普通颈椎C4', 60000),
    'thoracic-vertebra':     ('sixth thoracic vertebra', '胸椎T6',   70000),
    'lumbar-vertebra':       ('second lumbar vertebra',  '腰椎L2',   70000),
    'sacrum':                ('sacrum',                  '骶骨',     90000),
    'rib':                   ('sixth rib',               '典型肋骨', 60000),
    'clavicle':              ('clavicle',                '锁骨',     50000),
    'scapula':               ('scapula',                 '肩胛骨',   90000),
    'humerus':               ('humerus',                 '肱骨',     90000),
    'radius':                ('radius',                  '桡骨',     70000),
    'ulna':                  ('ulna',                    '尺骨',     70000),
    'scaphoid':              ('scaphoid',                '手舟骨',   40000),
    'lunate':                ('lunate',                  '月骨',     40000),
    'pisiform':              ('pisiform',                '豌豆骨',   30000),
    'trapezium':             ('trapezium',               '大多角骨', 40000),
    'capitate':              ('capitate',                '头状骨',   40000),
    'hamate':                ('hamate',                  '钩骨',     40000),
    'hip-bone':              ('hip bone',                '髋骨',     120000),
    'femur':                 ('femur',                   '股骨',     110000),
    'patella':               ('patella',                 '髌骨',     50000),
    'tibia':                 ('tibia',                   '胫骨',     90000),
    'fibula':                ('fibula',                  '腓骨',     70000),
    'talus':                 ('talus',                   '距骨',     60000),
    'calcaneus':             ('calcaneus',               '跟骨',     70000),
}

# 骨架组装的额外部件 (英文名, 中文名, kb别名, 减面)
SKELETON_EXTRA = [
    ('third cervical vertebra',   '第3颈椎', 'cervical-vertebra', 50000),
    ('fifth cervical vertebra',   '第5颈椎', 'cervical-vertebra', 50000),
    ('sixth cervical vertebra',   '第6颈椎', 'cervical-vertebra', 50000),
    ('seventh cervical vertebra', '第7颈椎', 'cervical-vertebra', 50000),
    ('first thoracic vertebra',   '第1胸椎', 'thoracic-vertebra', 50000),
    ('second thoracic vertebra',  '第2胸椎', 'thoracic-vertebra', 50000),
    ('third thoracic vertebra',   '第3胸椎', 'thoracic-vertebra', 50000),
    ('fourth thoracic vertebra',  '第4胸椎', 'thoracic-vertebra', 50000),
    ('fifth thoracic vertebra',   '第5胸椎', 'thoracic-vertebra', 50000),
    ('seventh thoracic vertebra', '第7胸椎', 'thoracic-vertebra', 50000),
    ('eighth thoracic vertebra',  '第8胸椎', 'thoracic-vertebra', 50000),
    ('ninth thoracic vertebra',   '第9胸椎', 'thoracic-vertebra', 50000),
    ('tenth thoracic vertebra',   '第10胸椎', 'thoracic-vertebra', 50000),
    ('eleventh thoracic vertebra', '第11胸椎', 'thoracic-vertebra', 50000),
    ('twelfth thoracic vertebra', '第12胸椎', 'thoracic-vertebra', 50000),
    ('first lumbar vertebra',     '第1腰椎', 'lumbar-vertebra', 50000),
    ('third lumbar vertebra',     '第3腰椎', 'lumbar-vertebra', 50000),
    ('fourth lumbar vertebra',    '第4腰椎', 'lumbar-vertebra', 50000),
    ('fifth lumbar vertebra',     '第5腰椎', 'lumbar-vertebra', 50000),
]

# 颅(组装,自额至下颌)
SKULL_PARTS = [
    ('frontal-bone', '额骨'), ('parietal-bone', '顶骨'), ('temporal-bone', '颞骨'),
    ('occipital-bone', '枕骨'), ('sphenoid-bone', '蝶骨'), ('ethmoid-bone', '筛骨'),
    ('vomer', '犁骨'), ('maxilla', '上颌骨'), ('zygomatic-bone', '颧骨'),
    ('nasal-bone', '鼻骨'), ('lacrimal-bone', '泪骨'), ('palatine-bone', '腭骨'),
    ('inferior-nasal-concha', '下鼻甲'), ('mandible', '下颌骨'),
]

# 全身骨骼(组装顺序:头→脊柱→胸廓→上肢→下肢→足)
SKELETON_ORDER = [
    ('frontal-bone', '额骨', 'frontal-bone'), ('parietal-bone', '顶骨', 'parietal-bone'),
    ('temporal-bone', '颞骨', 'temporal-bone'), ('occipital-bone', '枕骨', 'occipital-bone'),
    ('sphenoid-bone', '蝶骨', 'sphenoid-bone'), ('ethmoid-bone', '筛骨', 'ethmoid-bone'),
    ('vomer', '犁骨', 'vomer'), ('maxilla', '上颌骨', 'maxilla'),
    ('zygomatic-bone', '颧骨', 'zygomatic-bone'), ('nasal-bone', '鼻骨', 'nasal-bone'),
    ('lacrimal-bone', '泪骨', 'lacrimal-bone'), ('palatine-bone', '腭骨', 'palatine-bone'),
    ('inferior-nasal-concha', '下鼻甲', 'inferior-nasal-concha'),
    ('mandible', '下颌骨', 'mandible'), ('hyoid-bone', '舌骨', 'hyoid-bone'),
    ('atlas', '寰椎C1', 'atlas'), ('axis', '枢椎C2', 'axis'),
]


def load_parts_list(zipf):
    """返回 en2fj: 英文名 → FJ 元件id 列表(同名可能多个元件,全收)"""
    local = os.path.join(HERE, 'downloads', 'isa_parts_list_e.txt')
    local_ep = os.path.join(HERE, 'downloads', 'isa_element_parts.txt')
    if os.path.exists(local):
        data = io.open(local, encoding='utf-8').read()
    else:
        import urllib.request
        print('下载部件列表…')
        req = urllib.request.Request(PARTS_URL, headers={'User-Agent': 'curl/8.21'})
        data = urllib.request.urlopen(req, timeout=90).read().decode('utf-8')
    fma2en = {}
    for line in data.splitlines()[1:]:
        seg = line.split('\t')
        if len(seg) >= 3:
            fma2en[seg[0].strip()] = seg[2].strip()
    if os.path.exists(local_ep):
        ep = io.open(local_ep, encoding='utf-8').read()
    else:
        import urllib.request
        print('下载 element 映射…')
        req = urllib.request.Request(ELEMENT_URL, headers={'User-Agent': 'curl/8.21'})
        ep = urllib.request.urlopen(req, timeout=90).read().decode('utf-8')
    en2fj = {}
    for line in ep.splitlines()[1:]:
        seg = line.split('\t')
        if len(seg) >= 3:
            en = fma2en.get(seg[0].strip())
            if en:
                en2fj.setdefault(en, []).append(seg[2].strip())
    return en2fj


def process_obj(raw_bytes, target_tris):
    m = trimesh.exchange.obj.load_obj(io.BytesIO(raw_bytes))
    mesh = trimesh.Trimesh(**m) if isinstance(m, dict) else m
    mesh.merge_vertices()
    mesh.process(validate=True)
    comps = mesh.split(only_watertight=False)
    if len(comps) > 1:
        comps = [c for c in comps if len(c.faces) >= 30]
        if comps:
            mesh = trimesh.util.concatenate(comps)
    tris0 = len(mesh.faces)
    if tris0 > target_tris:
        try:
            v, f = fast_simplification.simplify(
                mesh.vertices.astype(np.float32), mesh.faces.astype(np.int64),
                target_count=int(target_tris))
            mesh = trimesh.Trimesh(v, f)
            mesh.merge_vertices()
        except Exception as e:
            print('  简化失败,保留原网格:', e)
    bmin, bmax = mesh.bounds
    center = (bmin + bmax) / 2
    scale = 1.0 / float(max(bmax - bmin))
    mesh.apply_translation(-center)
    mesh.apply_scale(scale)
    info = {'tris': int(len(mesh.faces)), 'trisOrig': tris0,
            'size': [round(float(x), 4) for x in (bmax - bmin)]}
    return mesh, info


def obj_to_mesh(raw_bytes):
    m = trimesh.exchange.obj.load_obj(io.BytesIO(raw_bytes))
    geoms = []
    for g in (m.get('geometry') or {}).values():
        if isinstance(g, trimesh.Trimesh) and len(g.faces):
            geoms.append(g)
        elif isinstance(g, dict) and len(g.get('faces', [])):
            geoms.append(trimesh.Trimesh(**{k: v for k, v in g.items()
                                            if k in ('vertices', 'faces')}))
    if not geoms:
        return trimesh.Trimesh()
    return geoms[0] if len(geoms) == 1 else trimesh.util.concatenate(geoms)


def simplify_and_fit(mesh, target_tris):
    """清洗+简化+归一化;返回 (mesh, info)——mesh 为最终应导出的对象"""
    mesh = mesh.copy()
    mesh.merge_vertices()
    mesh.process(validate=True)
    comps = mesh.split(only_watertight=False)
    if len(comps) > 1:
        kept = [c for c in comps if len(c.faces) >= 30]
        if kept and len(kept) < len(comps):
            mesh = trimesh.util.concatenate(kept)
    tris0 = len(mesh.faces)
    if tris0 > target_tris:
        try:
            v, f = fast_simplification.simplify(
                mesh.vertices.astype(np.float32), mesh.faces.astype(np.int64),
                target_count=int(target_tris))
            mesh = trimesh.Trimesh(v, f)
            mesh.merge_vertices()
        except Exception as e:
            print('  简化失败,保留原网格:', e)
    bmin, bmax = mesh.bounds
    center = (bmin + bmax) / 2
    scale = 1.0 / float(max(bmax - bmin))
    mesh.apply_translation(-center)
    mesh.apply_scale(scale)
    info = {'tris': int(len(mesh.faces)), 'trisOrig': tris0,
            'size': [round(float(x), 4) for x in (bmax - bmin)]}
    return mesh, info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--zip', default=os.path.join(HERE, 'downloads', 'isa_BP3D_obj.zip'))
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    zipf = zipfile.ZipFile(args.zip)
    members = {}
    for n in zipf.namelist():
        if n.lower().endswith('.obj'):
            members[os.path.basename(n)[:-4]] = n
    print('zip 内 OBJ 数:', len(members))

    en2fj = load_parts_list(zipf)
    manifest = {'base': 'models/anatomy/', 'source': 'BodyParts3D, (c) DBCLS, CC BY-SA 2.1 JP',
                'bones': {}, 'groups': {}}
    errors, ok = [], 0

    def export_one(bid, en, zh, tris):
        nonlocal ok
        fjs = en2fj.get(en) or []
        fjs = [f for f in fjs if f in members]
        if not fjs:
            errors.append(f'{bid}: 找不到 "{en}" (FJ={en2fj.get(en)})')
            return None
        meshes = []
        for fj in fjs:
            meshes.append(obj_to_mesh(zipf.read(members[fj])))
        meshes = [m for m in meshes if len(m.faces)]
        if not meshes:
            errors.append(f'{bid}: "{en}" 无有效几何')
            return None
        src = meshes[0] if len(meshes) == 1 else trimesh.util.concatenate(meshes)
        mesh, info = simplify_and_fit(src, tris)
        mesh.apply_transform(trimesh.transformations.euler_matrix(
            *[np.radians(a) for a in ORIENT.get(bid, (-90, 0, 0))]))
        data = trimesh.exchange.gltf.export_glb(mesh, include_normals=True)
        open(os.path.join(OUT_DIR, bid + '.glb'), 'wb').write(data)
        manifest['bones'][bid] = {'file': bid + '.glb', 'title': zh, 'en': en,
                                  'tris': info['tris'], 'size': info['size']}
        ok += 1
        print(f'  + {zh:10s} {info["trisOrig"]:>7} -> {info["tris"]:>6} tris ({len(data)//1024} KB)')
        return bid

    print('== 单骨模型 ==')
    for bid, (en, zh, tris) in BONES.items():
        try:
            export_one(bid, en, zh, tris)
        except Exception:
            errors.append(bid + ':\n' + traceback.format_exc(limit=2))

    # (骨架补充部件不再单独导出,直接进入组装模型)

    # ---- 组装清单(单一 GLB,多个命名网格,保留 BP3D 原始解剖位置) ----
    def build_group(gid, entries, scale_to=1.7):
        """entries: [(bid_or_en, zh, kb, fj列表)] — 用原始 BP3D 坐标(先转 Y-up,再统一缩放)"""
        geoms = {}
        all_mesh = []
        for key, zh, kb, fjs in entries:
            fjs = [f for f in fjs if f in members]
            if not fjs:
                errors.append(f'{gid}/{key}: 无元件 {en2fj.get(key) if key in en2fj else fjs}')
                continue
            ms = []
            for fj in fjs:
                raw = zipf.read(members[fj])
                mm = trimesh.exchange.obj.load_obj(io.BytesIO(raw))
                for g in (mm.get('geometry') or {}).values():
                    if isinstance(g, dict) and len(g.get('faces', [])):
                        ms.append(trimesh.Trimesh(vertices=g['vertices'], faces=g['faces']))
                    elif isinstance(g, trimesh.Trimesh) and len(g.faces):
                        ms.append(g)
            if not ms:
                continue
            mesh = ms[0] if len(ms) == 1 else trimesh.util.concatenate(ms)
            mesh.merge_vertices()
            mesh.process(validate=True)   # 统一面法线方向
            mesh.apply_transform(trimesh.transformations.euler_matrix(*[np.radians(a) for a in (-90, 0, 0)]))
            geoms[key] = mesh
            all_mesh.append(mesh)
        if not all_mesh:
            errors.append(f'{gid}: 全部元件缺失')
            return
        whole = trimesh.util.concatenate(all_mesh)
        bmin, bmax = whole.bounds
        center = (bmin + bmax) / 2
        scale = scale_to / float(max(bmax - bmin))
        scene_dict = {}
        for key, mesh in geoms.items():
            mesh.apply_translation(-center)
            mesh.apply_scale(scale)
            scene_dict[key] = mesh
        scene = trimesh.Scene(scene_dict)
        data = trimesh.exchange.gltf.export_glb(scene, include_normals=True)
        fname = f'{gid}.glb'
        open(os.path.join(OUT_DIR, fname), 'wb').write(data)
        print(f'  ★ 组装模型 {gid}: {len(scene_dict)} 件 ({len(data)//1024} KB)')

    # 颅:元件映射
    skull_entries = []
    for bid, zh in SKULL_PARTS:
        en = BONES[bid][0]
        skull_entries.append((bid, zh, bid, en2fj.get(en, [])))
    build_group('skull', skull_entries)
    manifest['groups']['skull'] = {'title': '颅', 'file': 'skull.glb', 'parts': [
        {'id': bid, 'name': zh, 'kb': bid} for bid, zh in SKULL_PARTS]}

    # 全身骨骼
    sk_entries = []
    for bid, zh, kb in SKELETON_ORDER:
        en = BONES[bid][0] if bid in BONES else None
        fjs = en2fj.get(en, []) if en else []
        if not fjs:
            fjs = en2fj.get(next(x[0] for x in SKELETON_EXTRA if x[1] == zh), []) if False else fjs
        sk_entries.append((bid, zh, kb, fjs))
    # 脊柱补充
    for en, zh, kb, tris in SKELETON_EXTRA:
        sk_entries.append(('sk-' + en.replace(' ', '-'), zh, kb, en2fj.get(en, [])))
    # 躯干+四肢
    for en, zh, kb in [
        ('first rib', '第1肋', 'rib'), ('second rib', '第2肋', 'rib'), ('third rib', '第3肋', 'rib'),
        ('fourth rib', '第4肋', 'rib'), ('fifth rib', '第5肋', 'rib'), ('sixth rib', '第6肋', 'rib'),
        ('seventh rib', '第7肋', 'rib'), ('eighth rib', '第8肋', 'rib'), ('ninth rib', '第9肋', 'rib'),
        ('tenth rib', '第10肋', 'rib'), ('eleventh rib', '第11肋', 'rib'),
        ('manubrium', '胸骨柄', 'sternum'), ('body of sternum', '胸骨体', 'sternum'),
        ('xiphoid process', '剑突', 'sternum'),
        ('clavicle', '锁骨', 'clavicle'), ('scapula', '肩胛骨', 'scapula'),
        ('humerus', '肱骨', 'humerus'), ('radius', '桡骨', 'radius'), ('ulna', '尺骨', 'ulna'),
        ('hip bone', '髋骨', 'hip-bone'), ('femur', '股骨', 'femur'), ('patella', '髌骨', 'patella'),
        ('tibia', '胫骨', 'tibia'), ('fibula', '腓骨', 'fibula'),
        ('scaphoid', '手舟骨', 'scaphoid'), ('lunate', '月骨', 'lunate'), ('pisiform', '豌豆骨', 'pisiform'),
        ('trapezium', '大多角骨', 'trapezium'), ('capitate', '头状骨', 'capitate'), ('hamate', '钩骨', 'hamate'),
        ('talus', '距骨', 'talus'), ('calcaneus', '跟骨', 'calcaneus')]:
        bid = next((k for k, v in BONES.items() if v[0] == en), 'sk-' + en.replace(' ', '-'))
        sk_entries.append((bid, zh, kb, en2fj.get(en, [])))
    build_group('skeleton', sk_entries, scale_to=1.9)
    manifest['groups']['skeleton'] = {'title': '全身骨骼', 'file': 'skeleton.glb', 'parts': [
        {'id': k, 'name': zh, 'kb': kb} for k, zh, kb, _ in sk_entries]}

    with open(os.path.join(OUT_DIR, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print(f'\n完成:成功 {ok} 个单骨,组装模型 {len(manifest["groups"])} 个。')
    if errors:
        print('\n'.join('!! ' + e.splitlines()[0] if e else '' for e in errors))
        sys.exit(2)


if __name__ == '__main__':
    main()
