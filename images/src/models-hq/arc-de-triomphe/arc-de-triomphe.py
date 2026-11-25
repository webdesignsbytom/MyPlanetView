# The Arc de Triomphe in the high-quality look (hq.py): the great arch in the middle of the Étoile,
# its tall central vault with the coffered ceiling and the small arches through its sides, the four
# great sculpted groups on its piers, the reliefs above them, the frieze, the cornice and the attic
# with its row of shields; the French flag hanging in the vault over the tomb's eternal flame; the
# roundabout's cobbles with cars going round, the avenues leading off between their rows of trees,
# the Champs-Élysées towards the camera, and people.
# Run: blender -b --factory-startup -P arc-de-triomphe.py -- arc-de-triomphe-1024.png 1024 arc-de-triomphe.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1836)
M['arc'] = material('arcStone', '#e2d8c2', 0.6, vary='#d3c7ae', vary_scale=22, bump=0.15, bump_scale=150)
M['arcShade'] = material('arcShade', '#c5b99f', 0.7, vary='#b5a98f', vary_scale=22, bump=0.25, bump_scale=150)
M['cobble'] = material('cobble', '#8c8780', 0.8, vary='#7c7770', vary_scale=60, bump=0.35, bump_scale=300)
M['asphalt'] = material('asphalt', '#55545a', 0.8, vary='#4b4a50', vary_scale=40, bump=0.1, bump_scale=300)
M['flagBlue'] = material('flagBlue', '#2b4a9a', 0.7)
M['flagRed'] = material('flagRed', '#d0313a', 0.7)
M['flame'] = material('flame', '#f2b23a', 0.3, emission=('#ffb43a', 3.0))
OPEN = []

# ------------------------------------------------------------------ the Étoile: the roundabout, the avenues and their trees
cylinder('roundabout', M['cobble'], 1.14, 0.008, (0, 0, G - 0.004), segs=96)
annulus('centreKerb', M['paving'], 0.78, 0.72, G - 0.003, G + 0.012, segs=96)
cylinder('centre', M['paving'], 0.72, 0.012, (0, 0, G - 0.002), segs=96)
for k in range(12):
    a = math.radians(-90 + k * 30)
    w = 0.22 if k == 0 else 0.15
    pts = rect(1.36 * math.cos(a), 1.36 * math.sin(a), 0.5, w, rot=a)
    slab(f'avenue{k}', M['asphalt'], pts, G - 0.004, G + 0.005, margin=0.02)
    for s in (-1, 1):
        for j in (1.24,):
            tx, ty = j * math.cos(a) - s * (w / 2 + 0.05) * math.sin(a), j * math.sin(a) + s * (w / 2 + 0.05) * math.cos(a)
            if math.hypot(tx, ty) < 1.38:
                tree(f'avTree{k}{s}{j}', tx, ty, h=0.18, r=0.06)
for k in range(14):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.86, 1.06)
    m = Matrix.Translation((r * math.cos(a), r * math.sin(a), G + 0.004)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z')
    col = rng.choice(('red', 'blue', 'white', 'yellow', 'green', 'denim'))
    box_m(f'car{k}', M[col], m @ Matrix.Translation((0, 0, 0.012)), (0.05, 0.026, 0.018), bevel=0.004)
    box_m(f'carTop{k}', M['glass'], m @ Matrix.Translation((-0.004, 0, 0.026)), (0.028, 0.022, 0.012), bevel=0.003)

# ------------------------------------------------------------------ the arch
arch_from = set(bpy.data.objects)
AW, AD, AH = 0.66, 0.33, 0.72       # width, depth, height to the cornice
VW, VH = 0.2, 0.42                  # the main vault's width and height
PW = (AW - VW) / 2                  # each pier's width
for s in (-1, 1):
    px = s * (VW / 2 + PW / 2)
    box(f'pier{s}', M['arc'], (px, 0, G + VH / 2 + 0.01), (PW, AD, VH + 0.02), bevel=0.003)
    box(f'pierBase{s}', M['arcShade'], (px, 0, G + 0.03), (PW + 0.02, AD + 0.02, 0.06), bevel=0.003)
    OPEN.append((s * (AW / 2), 0, G + 0.02, 0.12, 0.24, (s, 0), 'round'))
    # the great sculpted groups on the front and back of each pier
    for ny in (-1, 1):
        bm = bmesh.new()
        for j in range(14):
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rng.uniform(0.016, 0.026), matrix=Matrix.Translation((px + rng.uniform(-0.06, 0.06), ny * (AD / 2 + 0.012), G + 0.1 + rng.uniform(0.0, 0.17))) @ Matrix.Diagonal((0.9, 0.55, 1.3, 1)))
        finish(f'group{s}{ny}', bm, M['arcShade'], smooth_all=True)
        box(f'groupPanel{s}{ny}', M['arcShade'], (px, ny * (AD / 2 + 0.002), G + 0.19), (PW * 0.8, 0.008, 0.22), bevel=0.002)
        box(f'relief{s}{ny}', M['arcShade'], (px, ny * (AD / 2 + 0.002), G + 0.4), (PW * 0.7, 0.008, 0.07), bevel=0.002)
box('archTop', M['arc'], (0, 0, G + (VH + AH) / 2 + 0.005), (AW - 0.004, AD - 0.004, AH - VH + 0.01), bevel=0.003)   # a hair inside the piers: faces flush and overlapping render black
bm = bmesh.new()
pts = arch_outline(VW / 2, VW / 2, G + VH - VW / 2, 0.012, steps=16)
for ny in (-1, 1):
    add_prism(bm, [bm.verts.new((u, ny * AD / 2, z)) for u, z in pts], [bm.verts.new((u, ny * (AD / 2 - 0.02), z)) for u, z in pts])
for ny in (-1, 1):
    OPEN.append((0, ny * AD / 2, G, VW, VH, (0, ny), 'round'))
box('vaultCeiling', M['arcShade'], (0, 0, G + VH - 0.006), (VW, AD - 0.01, 0.008))   # below the arch's underside, never flush with it
for j in range(5):
    box(f'coffer{j}', M['arc'], (0, -AD / 2 + 0.03 + j * (AD - 0.06) / 4, G + VH - 0.011), (VW - 0.02, 0.012, 0.004))   # just under the vault's ceiling
OPEN += [(0, ny * (AD / 2 + 0.002), G + 0.47, 0.12, 0.03, (0, ny), 'rect') for ny in (-1, 1)]
box('frieze', M['arcShade'], (0, 0, G + AH - 0.06), (AW + 0.008, AD + 0.008, 0.045), bevel=0.002)
box('cornice', M['arc'], (0, 0, G + AH - 0.02), (AW + 0.03, AD + 0.03, 0.03), bevel=0.003)
box('attic', M['arc'], (0, 0, G + AH + 0.06), (AW - 0.01, AD - 0.01, 0.13), bevel=0.003)
box('atticTop', M['arc'], (0, 0, G + AH + 0.13), (AW + 0.005, AD + 0.005, 0.012), bevel=0.002)
SH = []
for ny in (-1, 1):
    for k in range(11):
        SH.append(((k - 5) * 0.055, ny * (AD / 2 + 0.003), G + AH + 0.04, 0.032, 0.032, (0, ny), 'round'))
for nx in (-1, 1):
    for k in range(5):
        SH.append((nx * (AW / 2 + 0.003), (k - 2) * 0.06, G + AH + 0.04, 0.032, 0.032, (nx, 0), 'round'))
windows('shields', M['arcShade'], SH, depth=0.008)
# the flag in the vault, the tomb and its flame
box_m('flagBlue', M['flagBlue'], Matrix.Translation((-0.05, 0.0, G + 0.27)), (0.05, 0.004, 0.27))
box_m('flagWhite', M['white'], Matrix.Translation((0.0, 0.0, G + 0.27)), (0.05, 0.004, 0.27))
box_m('flagRed', M['flagRed'], Matrix.Translation((0.05, 0.0, G + 0.27)), (0.05, 0.004, 0.27))
box('tomb', M['arcShade'], (0, -0.08, G + 0.01), (0.12, 0.07, 0.02), bevel=0.002)
lathe('flame', M['flame'], [(0.0, 0), (0.012, 0.01), (0.01, 0.025), (0.0, 0.045)], (0, -0.12, G + 0.02), segs=12, smooth=True)

windows('openings', M['shadow'], OPEN, depth=0.012)
OPEN = []
S_ = Matrix.Translation((0, 0, G)) @ Matrix.Scale(1.45, 4) @ Matrix.Translation((0, 0, -G))
for ob in bpy.data.objects:
    if ob not in arch_from:
        ob.matrix_world = S_ @ ob.matrix_world
for k, (x, y, shirt) in enumerate(((-0.2, -0.3, 'red'), (0.25, -0.32, 'blue'), (0.32, 0.28, 'yellow'), (-0.35, 0.25, 'green'), (0.05, -0.38, 'red'), (-0.1, 0.35, 'blue'))):
    person(f'p{k}', x * 1.6, y * 1.6, rng.random() * 6, shirt, z=G + 0.01)

windows('openings', M['shadow'], OPEN, depth=0.012)
render('arc-de-triomphe')
