# -*- coding: utf-8 -*-
"""gen_molecules.py — 生成常见分子的球棍模型数据 data/chem/*.json
坐标按标准键长/键角计算(Å),教育用途。"""
import json, io, os, math
import numpy as np

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'chem')
os.makedirs(OUT, exist_ok=True)


def tet_dirs():
    """正四面体四个方向"""
    return [np.array(v) for v in [
        (1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)]]


def norm(v):
    v = np.array(v, dtype=float)
    return v / np.linalg.norm(v)


class Mol:
    def __init__(self, mid, name, formula, en, note):
        self.mid, self.name, self.formula, self.en, self.note = mid, name, formula, en, note
        self.atoms, self.bonds = [], []

    def add(self, el, pos):
        self.atoms.append({'el': el, 'x': round(float(pos[0]), 4),
                           'y': round(float(pos[1]), 4), 'z': round(float(pos[2]), 4)})
        return len(self.atoms) - 1

    def bond(self, i, j, order=1):
        self.bonds.append([i, j, order])

    def save(self):
        json.dump({'id': self.mid, 'name': self.name, 'formula': self.formula,
                   'en': self.en, 'note': self.note,
                   'atoms': self.atoms, 'bonds': self.bonds},
                  io.open(os.path.join(OUT, self.mid + '.json'), 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        print('  +', self.name, self.formula, len(self.atoms), 'atoms')


CH = 1.09; CC = 1.54; CO = 1.43; OH = 0.96; NH = 1.01; CN = 1.47; CD = 1.33
COb = 1.22; ARO = 1.39; CH3 = 1.09


def h_positions(center, existing_dirs, length, ref=None):
    """在 center 原子上放置 H:避开 existing_dirs 已占用方向"""
    dirs = []
    if not existing_dirs:          # 自由选择 4 个四面体方向
        dirs = tet_dirs()
    elif len(existing_dirs) == 1:  # 三叉
        ax = norm(existing_dirs[0])
        e1 = norm(np.cross(ax, [1, 0, 0.13] if abs(ax[0]) < 0.9 else [0, 1, 0.3]))
        e2 = norm(np.cross(ax, e1))
        for ang in (109.5, -109.5 + 360):
            d = -math.cos(math.radians(109.5)) * ax + math.sin(math.radians(109.5)) * (
                math.cos(math.radians(ang if ang <= 180 else 0)) * e1 +
                math.sin(math.radians(ang if ang <= 180 else 0)) * e2)
            dirs.append(norm(d))
        # 修正为对称三叉
        dirs = []
        for k in range(3):
            a = math.radians(120 * k + 60)
            d = -math.cos(math.radians(70.5)) * ax + math.sin(math.radians(70.5)) * (
                math.cos(a) * e1 + math.sin(a) * e2)
            dirs.append(norm(d))
    elif len(existing_dirs) == 2:
        ax = norm(existing_dirs[0]); bx = norm(existing_dirs[1])
        bis = norm(ax + bx)
        e1 = norm(np.cross(bis, np.cross(ax, bx)))
        for ang in (107, -107):
            dirs.append(norm(-math.cos(math.radians(104.5)) * bis +
                             math.sin(math.radians(104.5)) * (math.cos(math.radians(ang)) * e1 +
                                                              math.sin(math.radians(ang)) * np.cross(bis, e1))))
    return [np.array(center, dtype=float) + d * length for d in dirs]


def build_water():
    m = Mol('water', '水', 'H₂O', 'Water', 'V形分子,键角104.5°,氢键赋予其高沸点;极性分子。')
    o = m.add('O', (0, 0, 0))
    a = math.radians(104.5) / 2
    for sgn in (1, -1):
        m.add('H', (sgn * OH * math.sin(a), OH * math.cos(a), 0))
        m.bond(o, len(m.atoms) - 1)
    m.save()


def build_methane():
    m = Mol('methane', '甲烷', 'CH₄', 'Methane', '最简单的有机物,正四面体结构,键角109°28′,非极性。')
    c = m.add('C', (0, 0, 0))
    for d in tet_dirs():
        m.add('H', np.array(d) * CH / math.sqrt(3))
        m.bond(c, len(m.atoms) - 1)
    m.save()


def build_ammonia():
    m = Mol('ammonia', '氨', 'NH₃', 'Ammonia', '三角锥形(键角107°),N上有一对孤对电子,极易溶于水。')
    n = m.add('N', (0, 0, 0))
    ang = math.radians(107) / 2
    # 孤对朝上,三个H朝下张开
    for k in range(3):
        a = math.radians(120 * k)
        v = (math.sin(ang) * math.cos(a), -math.cos(ang), math.sin(ang) * math.sin(a))
        m.add('H', np.array(v) * NH)
        m.bond(n, len(m.atoms) - 1)
    m.save()


def build_co2():
    m = Mol('co2', '二氧化碳', 'CO₂', 'Carbon dioxide', '直线形分子(sp杂化),非极性;温室气体。')
    c = m.add('C', (0, 0, 0))
    o1 = m.add('O', (-COb, 0, 0)); o2 = m.add('O', (COb, 0, 0))
    m.bond(c, o1, 2); m.bond(c, o2, 2)
    m.save()


def build_h2(mol_id, name, formula, en, note, el='H'):
    m = Mol(mol_id, name, formula, en, note)
    a = m.add(el, (-0.55, 0, 0)); b = m.add(el, (0.55, 0, 0))
    m.bond(a, b)
    m.save()


def chain_carbon(m, positions_carbons, substituents):
    """按给定碳坐标连链;substituents: {碳idx: [(元素,方向索引)]} 由 tet 方向补 H"""
    ids = [m.add('C', p) for p in positions_carbons]
    for i in range(len(ids) - 1):
        m.bond(ids[i], ids[i + 1])
    return ids


def build_methanol():
    m = Mol('methanol', '甲醇', 'CH₃OH', 'Methanol', '最简单的一元醇,有剧毒(可致失明),工业酒精禁饮。')
    c = m.add('C', (0, 0, 0))
    d = tet_dirs()
    o = m.add('O', np.array(d[0]) * CO)
    m.bond(c, o)
    for k in range(1, 4):
        m.add('H', np.array(d[k]) * CH); m.bond(c, len(m.atoms) - 1)
    # O-H
    d2 = [v for v in tet_dirs() if np.dot(v, d[0]) < 0][0]
    m.add('H', np.array(o) + np.array(d2) * OH / math.sqrt(3))
    m.bond(o, len(m.atoms) - 1)
    m.save()


def build_ethanol():
    m = Mol('ethanol', '乙醇', 'C₂H₅OH', 'Ethanol', '酒的主要成分,羟基亲水;常用消毒剂(75%)。')
    c1 = np.array((0, 0, 0)); c2 = c1 + np.array((CC, 0, 0))
    o = c2 + np.array((CC * math.cos(math.radians(70.5)), CC * math.sin(math.radians(70.5)), 0))
    d = tet_dirs()
    cA = m.add('C', c1); cB = m.add('C', c2)
    m.bond(cA, cB)
    O = m.add('O', o); m.bond(cB, O)
    # c1 的三个 H
    dirs_used = norm(c2 - c1)
    for v in h_positions(c1, [dirs_used], CH):
        m.add('H', v); m.bond(cA, len(m.atoms) - 1)
    # c2 的两个 H + O 上的 H
    for v in h_positions(c2, [norm(c1 - c2), norm(o - c2)], CH):
        m.add('H', v); m.bond(cB, len(m.atoms) - 1)
    vh = h_positions(o, [norm(c2 - o)], OH)
    m.add('H', vh[0]); m.bond(O, len(m.atoms) - 1)
    m.save()


def build_acetic():
    m = Mol('acetic-acid', '乙酸', 'CH₃COOH', 'Acetic acid', '食醋主要成分(约3-5%),羧基电离出H⁺显酸性。')
    c1 = np.array((0, 0, 0)); c2 = c1 + np.array((CC, 0, 0))
    o1 = c2 + np.array((CO / 2 * math.cos(math.radians(120)), CO / 2 * math.sin(math.radians(120)), 0))  # C=O
    o2 = c2 + np.array((CO * math.cos(math.radians(-120)) * 1.0, CO * math.sin(math.radians(-120)) * 0.0 + 0, 0))
    o2 = c2 + np.array((CO * math.cos(math.radians(-60)) * 0.7, -CO * math.sin(math.radians(60)) * 0.7, 0))
    o1 = c2 + np.array((CO * math.cos(math.radians(60)) * 0.9, CO * math.sin(math.radians(60)) * 0.9, 0))
    cA = m.add('C', c1); cB = m.add('C', c2)
    m.bond(cA, cB)
    O1 = m.add('O', o1); m.bond(cB, O1, 2)      # 羰基
    O2 = m.add('O', o2); m.bond(cB, O2)          # 羟基 O
    for v in h_positions(c1, [norm(c2 - c1)], CH):
        m.add('H', v); m.bond(cA, len(m.atoms) - 1)
    m.add('H', np.array(o2) + np.array((OH * math.cos(math.radians(60)), -OH * math.sin(math.radians(60)), 0)))
    m.bond(O2, len(m.atoms) - 1)
    m.save()


def build_acetone():
    m = Mol('acetone', '丙酮', 'CH₃COCH₃', 'Acetone', '最简单的酮,优良溶剂;洗甲水主要成分。')
    c2 = np.array((0, 0, 0)); c1 = c2 + np.array((CC, 0, 0)); c3 = c2 + np.array((-CC, 0, 0))
    o = c2 + np.array((0, COb, 0))
    a = m.add('C', c1); b = m.add('C', c2); c = m.add('C', c3)
    m.bond(a, b); m.bond(b, c)
    O = m.add('O', o); m.bond(b, O, 2)
    for cid, cc in ((a, c1), (c, c3)):
        ref = norm(c2 - cc)
        for v in h_positions(cc, [ref], CH):
            m.add('H', v); m.bond(cid, len(m.atoms) - 1)
    m.save()


def build_ethene():
    m = Mol('ethene', '乙烯', 'C₂H₄', 'Ethylene', '平面分子,含碳碳双键;植物催熟剂,制聚乙烯的原料。')
    a = m.add('C', (-CD / 2, 0, 0)); b = m.add('C', (CD / 2, 0, 0))
    m.bond(a, b, 2)
    for x, cid in ((-1, a), (1, b)):
        for y in (1, -1):
            m.add('H', (x * CD / 2 + x * CH * math.cos(math.radians(60)), y * CH * math.sin(math.radians(60)), 0))
            m.bond(cid, len(m.atoms) - 1)
    m.save()


def build_benzene():
    m = Mol('benzene', '苯', 'C₆H₆', 'Benzene', '正六边形平面分子,大π键(芳香性);重要化工原料,有毒。')
    ids = []
    for k in range(6):
        a = math.radians(60 * k)
        ids.append(m.add('C', (ARO * math.cos(a), ARO * math.sin(a), 0)))
    for k in range(6):
        m.bond(ids[k], ids[(k + 1) % 6], 2 if k % 2 == 0 else 1)   # 交替表达(实际为离域大π键)
    for k in range(6):
        a = math.radians(60 * k)
        r = ARO + CH
        m.add('H', (r * math.cos(a), r * math.sin(a), 0))
        m.bond(ids[k], len(m.atoms) - 1)
    m.save()


def build_cyclohexane():
    m = Mol('cyclohexane', '环己烷', 'C₆H₁₂', 'Cyclohexane', '椅式构象(键角109.5°,无角张力);由苯加氢制得。')
    # 标准椅式坐标(近似)
    R = 1.46
    pts = [
        (R, 0, 0.25), (R / 2, R * math.sqrt(3) / 2, -0.25), (-R / 2, R * math.sqrt(3) / 2, 0.25),
        (-R, 0, -0.25), (-R / 2, -R * math.sqrt(3) / 2, 0.25), (R / 2, -R * math.sqrt(3) / 2, -0.25)]
    ids = [m.add('C', p) for p in pts]
    for k in range(6):
        m.bond(ids[k], ids[(k + 1) % 6])
    for k in range(6):
        p = np.array(pts[k]); n1 = np.array(pts[(k + 1) % 6]); n2 = np.array(pts[(k - 1) % 6])
        ref = norm((n1 - p) + (n2 - p))
        for v in h_positions(p, [ref], CH):
            m.add('H', v); m.bond(ids[k], len(m.atoms) - 1)
    m.save()


def build_glucose():
    m = Mol('glucose', '葡萄糖', 'C₆H₁₂O₆', 'Glucose', '吡喃型葡萄糖(椅式),细胞最重要能源;含5个羟基+1个醛基(开链式)。')
    # 环上 5C + 1O
    R = 1.48
    ring = []
    for k in range(5):
        a = math.radians(72 * k - 90)
        ring.append(('C', np.array((R * math.cos(a), R * math.sin(a), 0.12 * (1 if k % 2 else -1)))))
    a0 = math.radians(72 * 5 - 90)
    ring.append(('O', np.array((R * math.cos(a0), R * math.sin(a0), 0.12))))
    ids = [m.add(el, p) for el, p in ring]
    for k in range(6):
        m.bond(ids[k], ids[(k + 1) % 6])
    # C6 羟甲基
    c5 = np.array(ring[0][1])   # 与 O 相邻的碳
    c6 = c5 + np.array((0.9, -1.05, 0.35))
    C6 = m.add('C', c6); m.bond(ids[0], C6)
    for v in h_positions(c6, [norm(c5 - c6)], CH):
        m.add('H', v); m.bond(C6, len(m.atoms) - 1)
    o6 = c6 + np.array((0.5, 0.75, -0.6))
    O6 = m.add('O', o6); m.bond(C6, O6)
    m.add('H', o6 + np.array((0.6, 0.55, -0.35))); m.bond(O6, len(m.atoms) - 1)
    # 环上其余 C 各连一个 OH(近似交替朝上/下)+ 一个H
    for idx in (1, 2, 3, 4):
        el, p = ring[idx]
        p = np.array(p)
        center_dir = norm(-p)        # 背离环心
        up = np.array((0, 0, 1)) * (1 if idx % 2 == 0 else -1)
        oh_dir = norm(center_dir * 0.6 + up)
        o = p + oh_dir * CO
        O = m.add('O', o); m.bond(ids[idx], O)
        m.add('H', o + oh_dir * OH); m.bond(O, len(m.atoms) - 1)
        # H(异侧)
        hdir = norm(center_dir * 0.9 - up)
        m.add('H', p + hdir * CH); m.bond(ids[idx], len(m.atoms) - 1)
    m.save()


def build_urea():
    m = Mol('urea', '尿素', 'CO(NH₂)₂', 'Urea', '第一种人工合成的有机物(维勒,1828年),蛋白质代谢的含氮终产物。')
    c = m.add('C', (0, 0, 0))
    o = m.add('O', (0, COb, 0)); m.bond(c, o, 2)
    for sgn in (1, -1):
        n = m.add('N', (sgn * CN * math.cos(math.radians(30)), -CN * math.sin(math.radians(30)), 0))
        m.bond(c, n)
        # 每个N两个H(近平面)
        for k, dy in ((0, 0.9), (1, -0.4)):
            v = np.array((sgn * (CN + NH * 0.7), -CN * math.sin(math.radians(30)) + dy * 0.55 * NH / 1.01, 0.15 if k else -0.15))
            m.add('H', v); m.bond(n, len(m.atoms) - 1)
    m.save()


if __name__ == '__main__':
    print('生成分子数据 →', OUT)
    build_water(); build_methane(); build_ammonia(); build_co2()
    build_h2('oxygen', '氧气', 'O₂', 'Oxygen', '双原子分子,具顺磁性;支持呼吸与燃烧。', 'O')
    build_h2('nitrogen', '氮气', 'N₂', 'Nitrogen', '含N≡N三键(键能945 kJ/mol),化学性质稳定。', 'N')
    build_h2('hydrogen', '氢气', 'H₂', 'Hydrogen', '最小的分子,清洁能源载体,可燃。', 'H')
    build_methanol(); build_ethanol(); build_acetic(); build_acetone()
    build_ethene(); build_benzene(); build_cyclohexane(); build_glucose(); build_urea()
    print('完成')
