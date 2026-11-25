# Notre-Dame de Paris in the high-quality look (hq.py), restored: the cathedral on the Île de la Cité
# with the Seine either side, its west front facing the camera with the three portals, the gallery of
# kings, the rose window, the open gallery and the two square towers with their tall belfry openings;
# the long nave and choir under lead roofs, the transept with its own rose, the flying buttresses
# round the choir and the apse, the new spire over the crossing with its gilded rooster; the parvis,
# the trees of the square behind, a bridge, and people.
# Run: blender -b --factory-startup -P notre-dame.py -- notre-dame-1024.png 1024 notre-dame.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1163)
M['nd'] = material('ndStone', '#ddd2bb', 0.65, vary='#cdc0a5', vary_scale=20, bump=0.15, bump_scale=150)
M['ndShade'] = material('ndShade', '#bdb198', 0.7, vary='#ada187', vary_scale=20, bump=0.15, bump_scale=150)
M['leadRoof'] = banded(material('leadRoof', '#7f8790', 0.45, vary='#737b84', vary_scale=14, metallic=0.4), 'X', 30.0, strength=0.2)
M['quay'] = material('quay', '#c2b8a4', 0.75, vary='#b0a690', vary_scale=24, bump=0.25, bump_scale=120)
BARS = bmesh.new()
OPEN = []
FY = -0.62           # the west front
CX = 0.0


def member(p0, p1, t, bm=None):
    bm = BARS if bm is None else bm
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t, t, d.length, 1)))


def rose(name, x, y, z, r, nrm):
    """A rose window: a dark round with its stone tracery of spokes and rings."""
    nx, ny = nrm
    m = Matrix(((-ny, 0, nx, x), (nx, 0, ny, y), (0, 1, 0, z), (0, 0, 0, 1)))
    cylinder(name, M['shadow'], r, 0.008, (0, 0, -0.002), segs=40, matrix=m)
    annulus(name + 'Ring', M['nd'], r + 0.008, r - 0.004, 0.0, 0.012, segs=40, matrix=m)
    annulus(name + 'Inner', M['nd'], r * 0.42, r * 0.34, 0.0, 0.01, segs=32, matrix=m)
    for k in range(12):
        a = 2 * math.pi * k / 12
        member(m @ Vector((math.cos(a) * r * 0.38, math.sin(a) * r * 0.38, 0.005)), m @ Vector((math.cos(a) * r, math.sin(a) * r, 0.005)), 0.004)


# ------------------------------------------------------------------ the island, its quays, the trees and a bridge
isle = [(-0.62, -1.35), (0.62, -1.35), (0.7, -0.2), (0.62, 1.0), (0.2, 1.38), (-0.2, 1.38), (-0.62, 1.0), (-0.7, -0.2)]
slab('quayWall', M['quay'], isle, G - 0.004, G + 0.07, bevel=0.004, margin=0.02)
slab('parvis', M['paving'], [(x * 0.97, y * 0.97) for x, y in isle], G + 0.07, G + 0.078, margin=0.03)
slab('squareLawn', M['lawn'], [(-0.5, 0.75), (0.5, 0.75), (0.42, 1.05), (0.15, 1.28), (-0.15, 1.28), (-0.42, 1.05)], G + 0.078, G + 0.082, margin=0.04)
Z = G + 0.078
for k, (x, y) in enumerate(((-0.42, 0.85), (0.42, 0.85), (-0.2, 1.12), (0.2, 1.12), (-0.5, -1.05), (0.5, -1.05), (-0.52, -0.2), (0.52, 0.3))):
    tree(f'tree{k}', x, y, h=0.2, r=0.085, z=Z)
box('bridge', M['quay'], (-0.95, 0.35, G + 0.05), (0.62, 0.14, 0.035), bevel=0.003)
for x in (-0.82, -1.08):
    windows(f'bridgeArch{x}', M['shadow'], [(x, 0.28, G - 0.004, 0.1, 0.05, (0, -1), 'round')], depth=0.01)

# ------------------------------------------------------------------ the west front and its towers
TH = 0.68
for s in (-1, 1):
    tx = CX + s * 0.155
    box(f'tower{s}', M['nd'], (tx, FY + 0.07, Z + TH / 2), (0.14, 0.14, TH), bevel=0.003)
    for nx, ny in ((0, -1), (s, 0)):
        for u in (-0.032, 0.032):
            OPEN.append((tx + nx * 0.07 + (-ny) * u, FY + 0.07 + ny * 0.07 + nx * u, Z + 0.46, 0.028, 0.18, (nx, ny), 'pointed'))
    box(f'towerTop{s}', M['nd'], (tx, FY + 0.07, Z + TH + 0.012), (0.15, 0.15, 0.024), bevel=0.002)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f'towerPinnacle{s}{sx}{sy}', M['nd'], (tx + sx * 0.065, FY + 0.07 + sy * 0.065, Z + TH + 0.04), (0.016, 0.016, 0.04), bevel=0.002)
box('frontCentre', M['nd'], (CX, FY + 0.07, Z + 0.26), (0.17, 0.14, 0.52), bevel=0.003)
box('galleryOfKings', M['ndShade'], (CX, FY - 0.003, Z + 0.25), (0.46, 0.012, 0.035), bevel=0.001)
OPEN += [(CX + u, FY - 0.01, Z + 0.255, 0.012, 0.025, (0, -1), 'rect') for u in [-0.21 + 0.021 * k for k in range(21)]]
for u, w, h in ((0.0, 0.08, 0.2), (-0.155, 0.07, 0.18), (0.155, 0.07, 0.18)):
    OPEN.append((CX + u, FY, Z, w, h, (0, -1), 'pointed'))
rose('westRose', CX, FY - 0.002, Z + 0.37, 0.065, (0, -1))
for s in (-1, 1):
    OPEN.append((CX + s * 0.155, FY - 0.001, Z + 0.3, 0.05, 0.12, (0, -1), 'pointed'))
box('openGallery', M['nd'], (CX, FY + 0.07, Z + 0.5), (0.46, 0.13, 0.012), bevel=0.001)
for k in range(17):
    member((CX - 0.21 + k * 0.026, FY + 0.003, Z + 0.5), (CX - 0.21 + k * 0.026, FY + 0.003, Z + 0.565), 0.006)
box('openGalleryTop', M['nd'], (CX, FY + 0.07, Z + 0.57), (0.46, 0.14, 0.012), bevel=0.001)
OPEN.append((CX, FY + 0.003, Z + 0.505, 0.15, 0.06, (0, -1), 'rect'))

# ------------------------------------------------------------------ the nave, the transept, the choir and the apse
NY0, NY1, NW, NH = FY + 0.14, 0.62, 0.28, 0.36
box('nave', M['nd'], (CX, (NY0 + NY1) / 2, Z + NH / 2), (NW, NY1 - NY0, NH), bevel=0.003)
gable_roof('naveRoof', M['leadRoof'], CX - NW / 2, CX + NW / 2, NY0, NY1, Z + NH, 0.2, over=0.01, along='y')
box('aisles', M['ndShade'], (CX, (NY0 + NY1) / 2 + 0.02, Z + 0.1), (NW + 0.2, NY1 - NY0 - 0.04, 0.2), bevel=0.003)
for s in (-1, 1):
    bm = bmesh.new()
    x0, x1 = CX + s * NW / 2, CX + s * (NW / 2 + 0.1)
    pts = [(x0, NY0 + 0.02, Z + 0.26), (x0, NY1 - 0.02, Z + 0.26), (x1, NY1 - 0.02, Z + 0.2), (x1, NY0 + 0.02, Z + 0.2)]
    add_prism(bm, [bm.verts.new(p) for p in pts], [bm.verts.new((p[0], p[1], p[2] + 0.01)) for p in pts])
    finish(f'aisleRoof{s}', bm, M['leadRoof'], smooth_sides=False)
TY = 0.18
box('transept', M['nd'], (CX, TY, Z + NH / 2), (0.72, 0.16, NH), bevel=0.003)
gable_roof('transeptRoof', M['leadRoof'], CX - 0.36, CX + 0.36, TY - 0.08, TY + 0.08, Z + NH, 0.2, over=0.01)
for s in (-1, 1):
    rose(f'transeptRose{s}', CX + s * 0.362, TY, Z + 0.24, 0.05, (s, 0))
    bm = bmesh.new()
    tri = [(-0.08, Z + NH), (0.08, Z + NH), (0, Z + NH + 0.2)]
    add_prism(bm, [bm.verts.new((CX + s * 0.355, TY + u, z)) for u, z in tri], [bm.verts.new((CX + s * 0.365, TY + u, z)) for u, z in tri])
    finish(f'transeptGable{s}', bm, M['nd'], smooth_sides=False)
lathe('apse', M['nd'], [(NW / 2, 0), (NW / 2, NH)], (CX, NY1, Z), segs=32)
lathe('apseRoof', M['leadRoof'], [(NW / 2 + 0.01, 0), (0.0, 0.2)], (CX, NY1, Z + NH), segs=32)
# clerestory windows and the flying buttresses
for y in [NY0 + 0.06 + k * 0.08 for k in range(9)]:
    if abs(y - TY) < 0.1:
        continue
    for s in (-1, 1):
        OPEN.append((CX + s * NW / 2, y, Z + 0.24, 0.03, 0.1, (s, 0), 'pointed'))
        px = CX + s * (NW / 2 + 0.17)
        box(f'buttressPier{y:.2f}{s}', M['nd'], (px, y, Z + 0.13), (0.03, 0.03, 0.26), bevel=0.002)
        lathe(f'buttressPinnacle{y:.2f}{s}', M['nd'], [(0.018, 0), (0.0, 0.07)], (px, y, Z + 0.26), segs=4)
        member((px, y, Z + 0.25), (CX + s * NW / 2, y, Z + NH - 0.03), 0.014)
        member((px, y, Z + 0.17), (CX + s * (NW / 2 + 0.1), y, Z + 0.22), 0.012)

# ------------------------------------------------------------------ the spire and its rooster
SZ = Z + NH + 0.18
lathe('spireBase', M['leadRoof'], [(0.05, 0), (0.05, 0.08)], (CX, TY, SZ - 0.02), segs=8)
lathe('spire', M['leadRoof'], [(0.048, 0), (0.03, 0.12), (0.012, 0.32), (0.0, 0.38)], (CX, TY, SZ + 0.06), segs=8)
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    for j in range(3):
        cylinder(f'apostle{k}{j}', M['copperGreen'], 0.006, 0.03, (CX + 0.07 * math.cos(a) + 0.02 * j * math.cos(a), TY + 0.07 * math.sin(a) + 0.02 * j * math.sin(a), Z + NH + 0.05 + j * 0.04), segs=6)
lathe('rooster', M['gold'], [(0.0, 0), (0.01, 0.005), (0.008, 0.016), (0.0, 0.022)], (CX, TY, SZ + 0.43), segs=10, smooth=True)
cylinder('spireCross', M['gold'], 0.002, 0.05, (CX, TY, SZ + 0.38), segs=6)

for k, (x, y, shirt) in enumerate(((-0.1, -0.85, 'red'), (0.08, -0.9, 'blue'), (0.25, -0.8, 'yellow'), (-0.3, -1.0, 'green'), (0.05, -1.1, 'red'), (-0.18, -0.75, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z)

windows('openings', M['shadow'], OPEN, depth=0.01)
finish('tracery', BARS, M['nd'], smooth_sides=False)
render('notre-dame')
