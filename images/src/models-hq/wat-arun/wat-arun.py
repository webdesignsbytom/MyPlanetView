# Wat Arun in the high-quality look (hq.py), laid out in metres (its terraces drawn closer, to fit):
# Bangkok's Temple of Dawn on the bank of the Chao Phraya; the great central prang rising from its stepped
# terraces with their balustrades and steep stairs, its corn-cob tower ringed and clad in white porcelain
# set with coloured flowers, the trident on its top; the four corner prangs; the little pavilions at the
# foot of the stairs; the river before it with a long-tail boat, and people.
# Run: blender -b --factory-startup -P wat-arun.py -- wat-arun-1024.png 1024 wat-arun.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1851)
M['porcelain'] = mosaic('watArunPorcelain', [(6, '#f1eee6'), (2, '#d8d1c2'), (2, '#e3874a'), (2, '#4f88c4'), (1, '#d4566a'), (1, '#e7c24a'), (1, '#5ea06a')], scale=130, mortar='#a9a294', rough=0.4)
M['porcelainDark'] = mosaic('watArunPorcelainShade', [(10, '#c9c3b5'), (2, '#b8b1a2'), (1, '#c87a44'), (1, '#4878a8')], scale=220, mortar='#9e988a', rough=0.5)
M['goldW'] = material('watArunGold', '#e2b23e', 0.3, metallic=0.85)
M['riverW'] = material('chaoPhraya', '#7a7a52', 0.08, vary='#86865c', vary_scale=6, coat=0.7)
M['bankW'] = masonry('watArunQuay', '#cfc6b4', '#b0a793', scale=100, rough=0.85, vary='#c6bdaa')
M['orangeW'] = material('watArunRoof', '#d9682a', 0.5)
M['greenW'] = material('watArunRoofEdge', '#2f8a4c', 0.5)
M['boatW'] = material('longTail', '#7a4a2a', 0.6)

S = 0.034               # metres to the tile's units
FY = 6.0
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def prang(name, x, y, z, base, height, rings=10):
    """A Khmer prang: a corn-cob tower, ringed, swelling a little then drawn in to its top."""
    prof = []
    for k in range(rings * 2 + 1):
        t = k / (rings * 2)
        r = base * (1.0 - 0.5 * t ** 1.5) * (math.sqrt(max(0.0, 1.0 - ((t - 0.78) / 0.22) ** 2)) if t > 0.78 else 1.0)
        bump = 0.1 * base * (1.0 - 0.6 * t) if k % 2 else 0.0
        prof.append(((r + bump) * S, t * height * S))
    prof[-1] = (0.0, height * S)
    lathe(name, M['porcelain'], prof, P(x, y, z), segs=32)


BEFORE = set(bpy.data.objects)
slab('river', M['riverW'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (-26.0 - FY) * S), (-2.0, (-26.0 - FY) * S)], Z0 - 0.003, Z0 - 0.002, margin=0.02)
slab('quay', M['bankW'], [(-2.0, (-26.0 - FY) * S), (2.0, (-26.0 - FY) * S), (2.0, (-22.0 - FY) * S), (-2.0, (-22.0 - FY) * S)], Z0 - 0.003, Z0 + 1.2 * S, margin=0.02)

# ------------------------------------------------------------------ the stepped terraces, their balustrades, the steep stairs
TERRACES = [(19.0, 0.0, 3.0), (15.0, 3.0, 7.0), (11.5, 7.0, 12.0), (8.5, 12.0, 17.0)]
for k, (h, z0, z1) in enumerate(TERRACES):
    bm = bmesh.new()
    lo = [bm.verts.new(P(sx * h, sy * h, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    hi = [bm.verts.new(P(sx * (h - 0.8), sy * (h - 0.8), z1)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    add_prism(bm, lo, hi)
    finish(f'terrace{k}', bm, M['porcelainDark'] if k % 2 else M['porcelain'], smooth_sides=False)
    for (xa, ya, xb, yb) in ((-1, -1, 1, -1), (1, -1, 1, 1), (1, 1, -1, 1), (-1, 1, -1, -1)):
        tube(f'rail{k}{xa}{ya}', M['porcelainDark'], [P(xa * (h - 1.0), ya * (h - 1.0), z1 + 0.9), P(xb * (h - 1.0), yb * (h - 1.0), z1 + 0.9)], 0.25 * S)
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    for j in range(17):
        z1 = (j + 1) * 1.0
        d = 20.0 - j * 0.68
        cx, cy = nx * d, ny * d
        w = 3.0
        if nx == 0:
            block(f'stair{nx}{ny}{j}', M['porcelainDark'], cx - w, cx + w, cy - 0.35, cy + 0.35, z1 - 1.0, z1, bevel=0)
        else:
            block(f'stair{nx}{ny}{j}', M['porcelainDark'], cx - 0.35, cx + 0.35, cy - w, cy + w, z1 - 1.0, z1, bevel=0)
    # the little pavilion at the stair's foot
    px, py = nx * 24.0, ny * 24.0
    block(f'pavilion{nx}{ny}', M['porcelain'], px - 2.6, px + 2.6, py - 2.6, py + 2.6, 0.0, 4.0)
    for k in range(3):
        w2 = 6.4 - 1.6 * k
        gable_roof(f'pavilionRoof{nx}{ny}{k}', M['orangeW'], (px - w2 / 2) * S, (px + w2 / 2) * S, (py - w2 / 2 - FY) * S, (py + w2 / 2 - FY) * S, Z0 + (4.0 + 1.2 * k) * S, 1.6 * S, over=0.0, along='x' if nx == 0 else 'y')
    lathe(f'pavilionSpire{nx}{ny}', M['goldW'], [(0.5 * S, 0.0), (0.2 * S, 2.0 * S), (0.0, 3.0 * S)], P(px, py, 8.0), segs=8)

# ------------------------------------------------------------------ the central prang, its trident; the four corner prangs
cylinder('prangFoot', M['porcelainDark'], 7.6 * S, 2.0 * S, P(0.0, 0.0, 17.0), segs=32)
prang('centralPrang', 0.0, 0.0, 19.0, 7.0, 50.0, rings=12)
cylinder('tridentPost', M['goldW'], 0.18 * S, 6.0 * S, P(0.0, 0.0, 68.0), segs=8)
for s in (-1, 1):
    bar(f'tridentProng{s}', M['goldW'], P(0.0, 0.0, 72.0), P(s * 1.0, 0.0, 74.0), 0.14 * S)
bar('tridentMid', M['goldW'], P(0.0, 0.0, 73.0), P(0.0, 0.0, 75.2), 0.14 * S)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * 21.0, sy * 21.0
        cylinder(f'cornerBase{sx}{sy}', M['porcelainDark'], 3.6 * S, 4.0 * S, P(x, y, 0.0), segs=24)
        prang(f'cornerPrang{sx}{sy}', x, y, 4.0, 3.0, 20.0, rings=8)

# ------------------------------------------------------------------ the long-tail boat on the river, people
bm = bmesh.new()
hull = [(-9.0, -32.0), (6.0, -32.6), (10.0, -32.0), (6.0, -31.4), (-9.0, -31.4)]
add_prism(bm, [bm.verts.new(P(x, y * 1.0 + (y + 32.0) * 1.5, 0.8)) for x, y in hull], [bm.verts.new(P(x, y * 1.0 + (y + 32.0) * 1.5, -0.2)) for x, y in hull])
finish('longTail', bm, M['boatW'], smooth_sides=False)
box('boatCanopy', M['orangeW'], P(-2.0, -32.0, 2.0), (7.0 * S, 1.6 * S, 0.2 * S), bevel=0)
for k, (x, y, z, shirt) in enumerate(((-2.0, -24.0, 1.2, 'red'), (3.0, -24.6, 1.2, 'blue'), (-12.0, -18.0, 0.0, 'yellow'), (12.0, -17.0, 0.0, 'green'), (1.0, -14.0, 6.0, 'red'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('wat-arun')
