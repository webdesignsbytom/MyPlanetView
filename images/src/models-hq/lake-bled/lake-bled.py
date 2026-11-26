# Lake Bled in the high-quality look (hq.py), laid out in metres (the lake shortened): the emerald lake
# and its little island, wooded round its edge, the white Pilgrimage Church of the Assumption on top
# with its tall bell tower and steep red-brown spire, the provost's house beside it, the 99 stone steps up
# from the landing; Bled Castle on its sheer cliff over the north shore, its walls, red roofs and tower;
# the wooded shores; the Julian Alps behind with snow on their tops; the pletna boats under their striped
# awnings rowing out to the island; people.
# Run: blender -b --factory-startup -P lake-bled.py -- lake-bled-1024.png 1024 lake-bled.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1004)
M['emerald'] = material('bledEmerald', '#2f8a78', 0.05, vary='#3b9784', vary_scale=3, coat=0.7, bump=0.08, bump_scale=40)
M['meadowB'] = material('bledMeadow', '#6e9a42', 0.85, vary='#62903c', vary_scale=14, bump=0.2, bump_scale=200)
def streaked(name, light, dark, stretch=0.08, scale=60.0):
    """Rock streaked dark straight down its faces: noise stretched upright."""
    mat = material(name, light, 0.9, bump=0.45, bump_scale=90)
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    coord = n.new('ShaderNodeTexCoord')
    mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale * stretch)
    l.new(coord.outputs['Object'], mp.inputs['Vector'])
    tex = n.new('ShaderNodeTexNoise')
    tex.inputs['Detail'].default_value = 6.0
    l.new(mp.outputs['Vector'], tex.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = lin(dark)
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = lin(light)
    l.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], n['Principled BSDF'].inputs['Base Color'])
    return mat


M['cliffB'] = streaked('castleCliff', '#b0aca1', '#76726a')
M['alpsRock'] = material('juliansRock', '#9a9893', 0.9, vary='#85837e', vary_scale=14, bump=0.5, bump_scale=90)
M['snowB'] = material('snowB', '#f4f6f8', 0.5, vary='#e6eaee', vary_scale=20)
M['woodsB'] = material('bledWoods', '#3f6234', 0.85, vary='#4b703c', vary_scale=16, bump=0.3, bump_scale=90)
M['spireRed'] = material('bledSpire', '#8e4232', 0.6, vary='#7d3a2c', vary_scale=14)
M['tilesB'] = banded(material('bledTiles', '#b05a3c', 0.7, vary='#9e5035', vary_scale=12, bump=0.12, bump_scale=200), 'Z', 300.0, strength=0.25)
M['stepsB'] = material('bledSteps', '#d8d2c4', 0.8, vary='#cbc4b4', vary_scale=40)
M['castleWall'] = material('castleWallB', '#d9cfbb', 0.85, vary='#cbc0aa', vary_scale=18, bump=0.2, bump_scale=150)
M['pletna'] = material('pletnaWood', '#6b4a2f', 0.6, coat=0.3)
M['awning'] = striped('pletnaAwning', ['#c8312c', '#f2ede2'], 'X', 160.0)

S = 0.0088              # metres to the tile's units
LAKE = G + 0.002
ISLAND = (0.12, -0.22)
CASTLE = (-0.72, 0.62)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.16)
    ix, iy = ISLAND
    di = math.hypot((x - ix) / 1.25, y - iy)
    island = 0.11 * smooth((0.3 - di) / 0.18)
    cx, cy = CASTLE
    a = math.atan2(y - cy, x - cx)
    dc = math.hypot((x - cx) / 1.2, y - cy) * (1.0 + 0.12 * math.sin(5.0 * a + 1.0) + 0.06 * math.sin(11.0 * a))
    cliff = 0.62 * smooth((0.26 - dc) / 0.07) + 0.04 * math.sin(23.0 * x + 9.0 * y) * smooth((0.26 - dc) / 0.1)
    coast = 0.62 + 0.07 * math.sin(4.0 * x + 0.8) + 0.03 * math.sin(9.0 * x)
    shore = 0.07 * smooth((y - coast) / 0.12) + 0.06 * smooth((abs(x) - 1.1 - 0.05 * math.sin(6.0 * y)) / 0.12)
    peaks = 0.55 + 0.45 * abs(math.sin(3.4 * x + 0.7)) * (0.6 + 0.4 * abs(math.sin(7.3 * x)))
    alps = 0.72 * smooth((y - 0.95) / 0.3) * peaks + (0.04 * math.sin(17.0 * x) + 0.02 * math.sin(41.0 * x + 5.0 * y)) * smooth((y - 1.0) / 0.2)
    return max(island, cliff, shore, alps) * rim


def pick(z, nz, x, y):
    if z < 0.004:
        return 0
    if y > 0.98 and z > 0.42:
        return 4
    if y > 0.98 and (z > 0.2 or nz < 0.5):
        return 3
    if nz < 0.55:
        return 2
    return 1


ground = terrain('ground', H, [M['emerald'], M['meadowB'], M['cliffB'], M['alpsRock'], M['snowB']], pick, rings=240, segs=600)
slab('lake', M['emerald'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, LAKE + 0.004, margin=0.02)


def GZ(x, y):
    return G + H(x, y)


ix, iy = ISLAND
woods = scatter_on(ground, 26000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.42 and p.z > LAKE + 0.006, seed=11)
trees = []
for p in woods:
    on_island = math.hypot((p.x - ix) / 1.25, p.y - iy) < 0.32
    if on_island and math.hypot((p.x - ix) / 1.25, p.y - iy) < 0.19:
        continue
    if on_island and abs(p.x - ix) < 0.04 and p.y < iy:
        continue
    r = rng.uniform(0.016, 0.024) if on_island else rng.uniform(0.014, 0.022)
    trees.append(((p.x, p.y, p.z + r * 0.8), r, 1.1))
blob_cloud('woods', M['woodsB'], trees)

# ------------------------------------------------------------------ the island: the church, its tower and spire, the provost's house, the 99 steps
top = GZ(ix, iy + 0.03)
box('nave', M['white'], Vector((ix + 0.03, iy + 0.04, top + 4.5 * S)), (22.0 * S, 12.0 * S, 13.0 * S), bevel=0.0008)
gable_roof('naveRoof', M['tilesB'], ix + 0.03 - 11.0 * S, ix + 0.03 + 11.0 * S, iy + 0.04 - 6.0 * S, iy + 0.04 + 6.0 * S, top + 10.95 * S, 5.0 * S, over=0.002)
lathe('apse', M['white'], [(5.6 * S, 0.0), (5.6 * S, 12.0 * S)], (ix + 0.03 + 11.0 * S, iy + 0.04, top - 2.0 * S), segs=20)
lathe('apseRoof', M['tilesB'], [(6.0 * S, 0.0), (0.0, 4.0 * S)], (ix + 0.03 + 11.0 * S, iy + 0.04, top + 9.9 * S), segs=20)
tx, ty = ix + 0.03 - 13.5 * S, iy + 0.04
box('belltower', M['white'], Vector((tx, ty, top + 15.0 * S)), (7.0 * S, 7.0 * S, 34.0 * S), bevel=0.0008)
glazed('belfry', [(tx, ty - 3.53 * S, top + 23.0 * S, 2.2 * S, 4.2 * S, (0, -1), 'round'), (tx - 3.53 * S, ty, top + 23.0 * S, 2.2 * S, 4.2 * S, (-1, 0), 'round')], M['white'], glass=M['spireRed'], depth=0.3 * S)
cylinder('clockFace', M['white'], 1.3 * S, 0.3 * S, (0, 0, 0), segs=16, matrix=Matrix.Translation((tx, ty - 3.6 * S, top + 18.5 * S)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
annulus('clockRing', M['gold'], 1.5 * S, 1.25 * S, -0.2 * S, 0.2 * S, segs=16, matrix=Matrix.Translation((tx, ty - 3.65 * S, top + 18.5 * S)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('spire', M['spireRed'], [(5.2 * S, 0.0), (4.4 * S, 1.0 * S), (0.3 * S, 17.0 * S), (0.0, 17.6 * S)], (0, 0, 0), segs=4, matrix=Matrix.Translation((tx, ty, top + 31.9 * S)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
lathe('spireFinial', M['gold'], [(0.0, 0.0), (0.5 * S, 0.5 * S), (0.0, 1.4 * S)], (tx, ty, top + 49.3 * S), segs=8, smooth=True)
box('provost', M['white'], Vector((ix - 0.06, iy - 0.06, top + 1.0 * S)), (14.0 * S, 10.0 * S, 12.0 * S), bevel=0.0008)
hip_roof('provostRoof', M['tilesB'], ix - 0.06, iy - 0.06, top + 6.95 * S, 14.0 * S, 10.0 * S, 4.0 * S, over=0.002)
STEPS = bmesh.new()
y = iy - 0.26
while y < iy - 0.05:
    z, z2 = GZ(ix, y), GZ(ix, y + 0.008)
    bmesh.ops.create_cube(STEPS, size=1.0, matrix=Matrix.Translation((ix, y + 0.004, (z + z2) / 2 - 0.003)) @ Matrix.Diagonal((0.05, 0.0085, abs(z2 - z) + 0.006, 1)))
    y += 0.008
finish('steps', STEPS, M['stepsB'], smooth_sides=False)
box('landing', M['stepsB'], Vector((ix, iy - 0.275, LAKE + 0.004)), (0.12, 0.035, 0.01), bevel=0.001)

# ------------------------------------------------------------------ Bled Castle on its cliff
cx, cy = CASTLE
ctop = G + 0.62
for k, (dx, dy, w, d, h) in enumerate(((0.0, 0.0, 30.0, 14.0, 12.0), (-0.07, 0.05, 18.0, 12.0, 10.0), (0.08, 0.04, 14.0, 20.0, 9.0))):
    box(f'castle{k}', M['castleWall'], Vector((cx + dx, cy + dy, ctop + (h - 4.0) / 2 * S)), (w * S, d * S, (h + 4.0) * S), bevel=0.0006)
    hip_roof(f'castleRoof{k}', M['tilesB'], cx + dx, cy + dy, ctop + (h - 0.05) * S, w * S, d * S, 4.5 * S, over=0.002)
box('castleTower', M['castleWall'], Vector((cx - 0.1, cy - 0.02, ctop + 9.0 * S)), (7.0 * S, 7.0 * S, 22.0 * S), bevel=0.0006)
lathe('castleTowerRoof', M['tilesB'], [(5.2 * S, 0.0), (0.0, 6.0 * S)], (0, 0, 0), segs=4, matrix=Matrix.Translation((cx - 0.1, cy - 0.02, ctop + 19.95 * S)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
RING = []
for k in range(18):
    a = 2 * math.pi * k / 18
    RING.append((cx + 0.19 * math.cos(a) * 1.15, cy + 0.17 * math.sin(a)))
for k, ((x0, y0), (x1, y1)) in enumerate(zip(RING, RING[1:] + RING[:1])):
    L = math.hypot(x1 - x0, y1 - y0)
    box(f'castleRing{k}', M['castleWall'], Vector(((x0 + x1) / 2, (y0 + y1) / 2, ctop + 1.0 * S)), (L + 0.002, 1.6 * S, 6.0 * S), rot_z=math.atan2(y1 - y0, x1 - x0), bevel=0)
CW = [(cx + u, cy - 7.05 * S, ctop + 5.0 * S, 1.4 * S, 2.0 * S, (0, -1), 'rect') for u in (-0.06, -0.03, 0.0, 0.03, 0.06)]
glazed('castleWindows', CW, M['white'], depth=0.25 * S)

# ------------------------------------------------------------------ the pletna boats, people
for k, (x, y, rot) in enumerate(((0.55, -0.85, 2.3), (-0.35, -0.75, 0.6))):
    m = Matrix.Translation((x, y, LAKE + 0.004)) @ Matrix.Rotation(rot, 4, 'Z')
    bm_ = bmesh.new()
    rings = []
    for j in range(11):
        t = -1 + 2 * j / 10
        w = 0.028 * (1 - abs(t) ** 2.4) + 0.003
        rings.append([bm_.verts.new(m @ Vector((t * 0.1, u * w, v + 0.012 * abs(t) ** 3))) for u, v in ((-1, 0.008), (-0.8, -0.003), (0.8, -0.003), (1, 0.008))])
    for a, b in zip(rings, rings[1:]):
        for i in range(3):
            bm_.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    finish(f'pletna{k}', bm_, M['pletna'], smooth_all=True)
    box_m(f'pletnaAwning{k}', M['awning'], m @ Matrix.Translation((0.01, 0, 0.026)), (0.12, 0.05, 0.004), bevel=0.001)
    for u in (-0.045, 0.06):
        for v in (-0.022, 0.022):
            bar(f'pletnaPost{k}{u}{v}', M['pletna'], m @ Vector((u, v, 0.006)), m @ Vector((u, v, 0.025)), 0.0012)
    p = m @ Vector((-0.085, 0, 0.008))
    person(f'oarsman{k}', p.x, p.y, rot, 'white', z=p.z, scale=0.7)
for k, (x, y, shirt) in enumerate(((ix - 0.02, iy - 0.27, 'red'), (ix + 0.025, iy - 0.265, 'blue'), (ix - 0.015, iy - 0.14, 'yellow'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=GZ(x, y) + 0.004, scale=0.65)

render('lake-bled')
