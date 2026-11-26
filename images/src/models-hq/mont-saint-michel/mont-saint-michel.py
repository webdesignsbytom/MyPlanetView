# Mont-Saint-Michel in the high-quality look (hq.py): the tidal island of granite rising from the
# bay's wet sands with their channels of sea, the ramparts round its foot with their round towers, the
# village's stone houses and slate roofs climbing inside them, La Merveille's tall walls on the north
# side, and the abbey on the summit: the church with its flying buttresses and the slender spire with
# Saint Michael in gold at the top; the causeway bridge across the sands, its shuttle, and walkers.
# Run: blender -b --factory-startup -P mont-saint-michel.py -- mont-saint-michel-1024.png 1024 mont-saint-michel.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='sand')
rng = random.Random(708)
M['wetSand'] = material('wetSand', '#cdbd99', 0.55, vary='#bfae88', vary_scale=3, bump=0.15, bump_scale=200, coat=0.3)
M['msmStone'] = material('msmStone', '#9c9585', 0.8, vary='#888171', vary_scale=24, bump=0.35, bump_scale=150)
M['msmWall'] = material('msmWall', '#b4ad9c', 0.8, vary='#a19a89', vary_scale=24, bump=0.3, bump_scale=150)
M['msmGrass'] = material('msmGrass', '#6da244', 0.85, vary='#5f9339', vary_scale=7, bump=0.2, bump_scale=300)
M['shuttle'] = material('shuttle', '#e8e3d6', 0.4, coat=0.3)
TZ = 0.47      # the summit


K = 1.55        # the island drawn bigger on its sands


def H0(x, y):
    d = math.hypot(x / 1.0, (y - 0.05) / 0.92)
    h = 0.5 * math.exp(-(d / 0.4) ** 2.3) + 0.04 * math.sin(7 * x + 1) * math.cos(6 * y) * math.exp(-(d / 0.5) ** 2)
    return max(0.0, min(h, TZ))


def H(x, y):
    return K * H0(x / K, y / K)


terrain('mount', H, [M['wetSand'], M['msmStone'], M['msmGrass']], lambda z, nz, x, y: 0 if z < 0.008 else (1 if nz < 0.7 or y < 0.1 else 2), rings=80, segs=220)
for k, pts in enumerate((
        [(-1.4, -0.3), (-0.9, -0.42), (-0.6, -0.62), (-0.2, -0.7), (0.3, -0.62), (0.8, -0.5), (1.4, -0.35), (1.4, -0.45), (0.8, -0.58), (0.3, -0.72), (-0.2, -0.8), (-0.6, -0.72), (-0.9, -0.52), (-1.4, -0.4)],
        [(0.6, 0.75), (0.95, 0.6), (1.3, 0.55), (1.3, 0.65), (0.95, 0.72), (0.65, 0.88)],
        [(-1.2, 0.5), (-0.8, 0.75), (-0.55, 1.1), (-0.65, 1.15), (-0.9, 0.85), (-1.25, 0.62)])):
    slab(f'channel{k}', M['water'], pts, G - 0.004, G + 0.004, margin=0.02)

# ------------------------------------------------------------------ the ramparts and their towers
island_from = set(bpy.data.objects)
WZ = G + 0.13
for k in range(15):
    a0 = math.radians(-165 + k * 11)
    a1 = math.radians(-165 + (k + 1) * 11)
    p0 = Vector((0.5 * math.cos(a0), 0.05 + 0.47 * math.sin(a0)))
    p1 = Vector((0.5 * math.cos(a1), 0.05 + 0.47 * math.sin(a1)))
    mid = (p0 + p1) / 2
    seg = p1 - p0
    box_m(f'rampart{k}', M['msmWall'], Matrix.Translation((mid.x, mid.y, (G + WZ) / 2)) @ Matrix.Rotation(math.atan2(seg.y, seg.x), 4, 'Z'), (seg.length + 0.01, 0.035, WZ - G), bevel=0.003)
for k, ang in enumerate((-160, -120, -85, -50, -15, 10)):
    a = math.radians(ang)
    x, y = 0.5 * math.cos(a), 0.05 + 0.47 * math.sin(a)
    cylinder(f'rampartTower{k}', M['msmWall'], 0.045, WZ - G + 0.04, (x, y, G), segs=24)
    spire(f'rampartCap{k}', M['slate'], x, y, WZ + 0.04, 0.05, 0.08, finial=False)
glazed('kingsGate', [(0.0, -0.44, G, 0.05, 0.08, (0, -1), 'round')], M['msmStone'], glass=M['door'], depth=0.04)

# ------------------------------------------------------------------ the village climbing the slope
k = 0
for ring, (rad, n, a0, a1) in enumerate(((0.4, 9, -150, -20), (0.32, 7, -140, -30), (0.25, 5, -125, -45))):
    for j in range(n):
        a = math.radians(a0 + (a1 - a0) * j / max(1, n - 1)) + rng.uniform(-0.05, 0.05)
        x, y = rad * math.cos(a), 0.05 + rad * 0.92 * math.sin(a)
        z = G + H0(x, y) - 0.02
        w, d, h = 0.07, 0.055, 0.07 + 0.02 * rng.random()
        rot = a + math.pi / 2
        box_m(f'house{k}', M['msmWall'] if k % 3 else M['whiteStone'], Matrix.Translation((x, y, z + h / 2)) @ Matrix.Rotation(rot, 4, 'Z'), (w, d, h), bevel=0.003)
        bm = bmesh.new()
        m = Matrix.Translation((x, y, z + h)) @ Matrix.Rotation(rot, 4, 'Z')
        quad = [(-w / 2 - 0.006, -d / 2 - 0.008, 0), (w / 2 + 0.006, -d / 2 - 0.008, 0), (w / 2 + 0.006, d / 2 + 0.008, 0), (-w / 2 - 0.006, d / 2 + 0.008, 0)]
        ridge = [(-w / 2 - 0.006, -0.001, 0.045), (w / 2 + 0.006, -0.001, 0.045), (w / 2 + 0.006, 0.001, 0.045), (-w / 2 - 0.006, 0.001, 0.045)]
        add_prism(bm, [bm.verts.new(m @ Vector(q)) for q in quad], [bm.verts.new(m @ Vector(q)) for q in ridge])
        finish(f'houseRoof{k}', bm, M['slate'], smooth_sides=False)
        nrm = Vector((math.cos(a), math.sin(a)))
        glazed(f'houseWin{k}', [(x + nrm.x * 0.028, y + nrm.y * 0.028, z + 0.025, 0.015, 0.022, (nrm.x, nrm.y), 'rect')], M['whiteStone'], depth=0.004, bars=False)
        k += 1

# ------------------------------------------------------------------ La Merveille and the abbey
Z = G + TZ
box('merveille', M['msmWall'], (-0.02, 0.36, G + 0.3), (0.42, 0.12, 0.36), bevel=0.003)
specs = [(x, 0.42, G + z, 0.025, 0.07, (0, 1), 'pointed') for x in (-0.18, -0.1, -0.02, 0.06, 0.14) for z in (0.22, 0.34)]
glazed('merveilleWindows', specs, M['msmStone'], depth=0.008)
for x in (-0.22, -0.13, -0.04, 0.05, 0.14, 0.2):
    box(f'merveilleButtress{x}', M['msmWall'], (x, 0.43, G + 0.28), (0.022, 0.03, 0.34), bevel=0.003)
gable_roof('merveilleRoof', M['slate'], -0.23, 0.19, 0.3, 0.42, G + 0.48, 0.07, over=0.008)
box('abbeyWest', M['msmWall'], (-0.3, 0.08, Z + 0.03), (0.16, 0.22, 0.1), bevel=0.003)
gable_roof('abbeyWestRoof', M['slate'], -0.38, -0.22, -0.03, 0.19, Z + 0.08, 0.06, over=0.008, along='y')
box('lodging', M['msmWall'], (0.12, -0.12, Z - 0.03), (0.3, 0.08, 0.12), bevel=0.003)
gable_roof('lodgingRoof', M['slate'], -0.03, 0.27, -0.16, -0.08, Z + 0.03, 0.05, over=0.008)
# the church: nave west to east, the choir with flying buttresses, the tower and spire over the crossing
CX0, CX1, CY = -0.24, 0.24, 0.1
box('nave', M['msmWall'], ((CX0 + CX1) / 2, CY, Z + 0.09), (CX1 - CX0, 0.12, 0.18), bevel=0.003)
gable_roof('naveRoof', M['slate'], CX0, CX1, CY - 0.06, CY + 0.06, Z + 0.18, 0.07, over=0.008)
glazed('naveWindows', [(x, CY - 0.061, Z + 0.07, 0.022, 0.08, (0, -1), 'pointed') for x in (-0.18, -0.1, 0.1, 0.18)], M['msmStone'], depth=0.008)
for x in (0.1, 0.16, 0.22):
    for s in (-1, 1):
        box(f'pier{x}{s}', M['msmWall'], (x, CY + s * 0.11, Z + 0.06), (0.02, 0.025, 0.12), bevel=0.002)
        bar(f'flyer{x}{s}', M['msmWall'], (x, CY + s * 0.11, Z + 0.12), (x, CY + s * 0.06, Z + 0.17), 0.014)
box('tower', M['msmWall'], (0.0, CY, Z + 0.24), (0.1, 0.1, 0.13), bevel=0.003)
glazed('towerWindows', [(nx * 0.05, CY + ny * 0.05, Z + 0.22, 0.02, 0.06, (nx, ny), 'pointed') for nx, ny in ((0, -1), (-1, 0), (1, 0))], M['msmStone'], depth=0.006)
for sx in (-1, 1):
    for sy in (-1, 1):
        spire(f'towerPinnacle{sx}{sy}', M['msmWall'], sx * 0.045, CY + sy * 0.045, Z + 0.305, 0.012, 0.06, finial=False)
lathe('spire', M['slate'], [(0.055, 0), (0.05, 0.02), (0.03, 0.15), (0.012, 0.3), (0.004, 0.36)], (0.0, CY, Z + 0.305), segs=8)
# Saint Michael in gold, his sword raised
cylinder('michael', M['gold'], 0.008, 0.035, (0.0, CY, Z + 0.66), segs=10, r2=0.005)
lathe('michaelHead', M['gold'], [(0.0, 0), (0.006, 0.004), (0.005, 0.011), (0.0, 0.014)], (0.0, CY, Z + 0.695), segs=10, smooth=True)
bar('michaelSword', M['gold'], (0.004, CY, Z + 0.69), (0.012, CY, Z + 0.73), 0.003)
for s in (-1, 1):
    box(f'michaelWing{s}', M['gold'], (s * 0.009, CY + 0.004, Z + 0.69), (0.006, 0.003, 0.02))

S_ = Matrix.Translation((0, 0, G)) @ Matrix.Scale(K, 4) @ Matrix.Translation((0, 0, -G))
for ob in bpy.data.objects:
    if ob not in island_from:
        ob.matrix_world = S_ @ ob.matrix_world

# ------------------------------------------------------------------ the causeway bridge, the shuttle and walkers
slab('causeway', M['paving'], rect(0.05, -1.08, 0.12, 0.9), G + 0.03, G + 0.042, margin=0.04)
for k in range(9):
    y = -0.72 - k * 0.09
    if math.hypot(0.05, y) > 1.42:
        continue
    for s in (-1, 1):
        cylinder(f'causewayPier{k}{s}', M['pavingDark'], 0.008, 0.03, (0.05 + s * 0.03, y, G), segs=8)
box('shuttle', M['shuttle'], (0.05, -0.9, G + 0.062), (0.04, 0.12, 0.04), bevel=0.008)
box('shuttleGlass', M['glass'], (0.05, -0.9, G + 0.068), (0.042, 0.1, 0.012))
for k, (x, y, shirt) in enumerate(((0.07, -0.65, 'red'), (0.03, -0.72, 'blue'), (0.06, -1.15, 'yellow'), (0.03, -1.25, 'green'))):
    person(f'p{k}', x, y, math.pi / 2, shirt, z=G + 0.042, scale=0.8)

render('mont-saint-michel')
