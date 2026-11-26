# The Charles Bridge in the high-quality look (hq.py), drawn to its real proportions (laid out in
# metres): a stretch of Prague's stone bridge striding over the Vltava on its segmental arches and its
# piers with their great cutwaters, the cobbled way between the parapets, the lamps, the baroque saints
# on their pedestals along both sides (the scanned statues of St John of Nepomuk, noe-3d.at, CC0, and
# St Cyril, matousekfoto, CC BY 4.0, in _sources/, in the bridge's blackened sandstone), and the Old
# Town Bridge Tower on the Old Town bank, its pointed gate passage, its gallery, corner turrets and
# steep slate roof; the river, the far bank's trees, and people.
# Run: blender -b --factory-startup -P charles-bridge.py -- charles-bridge-1024.png 1024 charles-bridge.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1357)
M['bohemian'] = material('bohemianSandstone', '#a39783', 0.8, vary='#938772', vary_scale=18, bump=0.25, bump_scale=140)
M['bohemianDark'] = material('bohemianDark', '#7f7667', 0.85, vary='#706859', vary_scale=18, bump=0.25, bump_scale=140)
M['statueBlack'] = material('statueBlackened', '#55504a', 0.75, vary='#47433e', vary_scale=14, bump=0.2, bump_scale=200)
M['vltava'] = material('vltava', '#4e7f86', 0.07, vary='#5a8a90', vary_scale=3, coat=0.5, bump=0.12, bump_scale=40)
M['slateC'] = material('slateCharles', '#4a5058', 0.55, vary='#41474f', vary_scale=14, bump=0.12, bump_scale=200)
M['cobblesC'] = masonry('cobblesC', '#8d867b', '#615c55', scale=160, rough=0.85, vary='#7f786e')
M['embank'] = masonry('embankC', '#8f8677', '#5f5850', scale=55, rough=0.85, vary='#837a6b')
M['lampBlack'] = material('lampBlack', '#222326', 0.45, metallic=0.5)
M['lampGlass'] = material('lampGlass', '#f3e2a8', 0.3)

S = 0.026               # metres to the tile's units
Z0 = G + 0.002          # the river
DZ = 13.0               # the bridge's way above the river
BW = 5.0                # half the bridge's width
LEFT, RIGHT = -36.0, 40.0       # the Old Town bank and the far bank (Kampa), where the river ends


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


# ------------------------------------------------------------------ the river and its banks, the banks level with the bridge
slab('vltava', M['vltava'], [(LEFT * S, -2), (RIGHT * S, -2), (RIGHT * S, 2), (LEFT * S, 2)], G - 0.004, Z0, margin=0.02)
slab('oldTownWall', M['embank'], [(-2, -2), (LEFT * S, -2), (LEFT * S, 2), (-2, 2)], G - 0.004, Z0 + (DZ - 0.3) * S, bevel=0.002, margin=0.02)
slab('oldTownBank', M['cobblesC'], [(-2, -2), ((LEFT - 0.4) * S, -2), ((LEFT - 0.4) * S, 2), (-2, 2)], Z0 + (DZ - 0.35) * S, Z0 + DZ * S, margin=0.026)
for k, (x, y) in enumerate(((-1.05, 0.62), (-0.98, 0.95))):
    tree(f'embankmentTree{k}', x, y, h=0.16, r=0.07, z=Z0 + DZ * S)
slab('kampaWall', M['embank'], [(RIGHT * S, -2), (2, -2), (2, 2), (RIGHT * S, 2)], G - 0.004, Z0 + (DZ - 0.3) * S, bevel=0.002, margin=0.02)
slab('kampa', M['lawn'], [((RIGHT + 0.4) * S, -2), (2, -2), (2, 2), ((RIGHT + 0.4) * S, 2)], Z0 + (DZ - 0.35) * S, Z0 + DZ * S, margin=0.026)
for k, (x, y) in enumerate(((1.2, -0.55), (1.15, 0.6), (1.32, 0.3), (1.1, -0.85))):
    tree(f'kampaTree{k}', x, y, h=0.16, r=0.07, z=Z0 + DZ * S)

# ------------------------------------------------------------------ the bridge: four segmental arches on piers, their cutwaters
ARCHES = [(-25.5, 9.5), (1.5, 9.5), (28.5, 9.5)]     # each arch's middle and half-span: 8 m piers between
PIERS = [(ARCHES[k][0] + ARCHES[k + 1][0]) / 2 for k in range(len(ARCHES) - 1)]
TOP = DZ - 0.05                 # the stone's top, just under the way
prof = [(LEFT - 4, TOP), (LEFT - 4, -0.5)]
for cx, hs in ARCHES:
    prof.append((cx - hs, -0.5))
    for k in range(15):
        t = -1 + 2 * k / 14
        prof.append((cx + t * hs, 3.0 + 6.5 * (1 - t * t) ** 0.5))
    prof.append((cx + hs, -0.5))
prof += [(RIGHT + 4, -0.5), (RIGHT + 4, TOP)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, -BW, z)) for x, z in prof], [bm.verts.new(P(x, BW, z)) for x, z in prof])
finish('bridge', bm, M['bohemian'], bevel=0.002, smooth_sides=False)
# the arch rings, a darker band of voussoirs on both faces
for cx, hs in ARCHES:
    for sy in (-1, 1):
        ring = []
        for k in range(15):
            t = -1 + 2 * k / 14
            ring.append((cx + t * (hs - 0.06), 2.88 + 6.5 * (1 - t * t) ** 0.5))
        bm = bmesh.new()
        outer = [(x, z + 1.1) for x, z in ring]
        front = [bm.verts.new(P(x, sy * (BW + 0.12), z)) for x, z in ring + list(reversed(outer))]
        back = [bm.verts.new(P(x, sy * (BW - 0.2), z)) for x, z in ring + list(reversed(outer))]
        add_prism(bm, front, back)
        finish(f'archRing{cx}{sy}', bm, M['bohemianDark'], smooth_sides=False)
# each pier's cutwater, a pointed prow up to a sloping hood that meets the bridge's face
for k, px in enumerate(PIERS):
    for sy in (-1, 1):
        bm = bmesh.new()
        tri = [(px - 4.0, sy * (BW - 0.4)), (px + 4.0, sy * (BW - 0.4)), (px, sy * (BW + 5.5))]
        low = [bm.verts.new(P(x, y, -0.5)) for x, y in tri]
        high = [bm.verts.new(P(x, y, 6.5)) for x, y in tri]
        apex = bm.verts.new(P(px, sy * (BW - 0.4), 10.5))
        bm.faces.new(low)
        for j in range(3):
            bm.faces.new((low[j], low[(j + 1) % 3], high[(j + 1) % 3], high[j]))
        for j in range(3):
            bm.faces.new((high[j], high[(j + 1) % 3], apex))
        finish(f'cutwater{k}{sy}', bm, M['bohemianDark'], smooth_sides=False)

# ------------------------------------------------------------------ the way, the parapets and their coping, the lamps
slab('way', M['cobblesC'], [(-2, -(BW - 0.5) * S), (2, -(BW - 0.5) * S), (2, (BW - 0.5) * S), (-2, (BW - 0.5) * S)], Z0 + (DZ - 0.1) * S, Z0 + (DZ + 0.15) * S, margin=0.02)
span = (LEFT, RIGHT)
for sy in (-1, 1):
    box(f'parapet{sy}', M['bohemian'], P((span[0] + span[1]) / 2, sy * (BW - 0.2), DZ + 0.5), ((span[1] - span[0]) * S, 0.7 * S, 1.4 * S), bevel=0.0008)
    box(f'coping{sy}', M['bohemianDark'], P((span[0] + span[1]) / 2, sy * (BW - 0.2), DZ + 1.25), ((span[1] - span[0] + 0.4) * S, 0.9 * S, 0.22 * S), bevel=0.0005)
LAMPS = bmesh.new()
for sy in (-1, 1):
    for x in [ARCHES[k][0] for k in range(len(ARCHES))]:
        base = P(x, sy * (BW - 0.2), DZ + 1.36)
        bmesh.ops.create_cone(LAMPS, cap_ends=True, segments=8, radius1=0.14 * S, radius2=0.1 * S, depth=3.6 * S, matrix=Matrix.Translation(base + Vector((0, 0, 1.8 * S))))
        bmesh.ops.create_cone(LAMPS, cap_ends=True, segments=6, radius1=0.05 * S, radius2=0.5 * S, depth=0.4 * S, matrix=Matrix.Translation(base + Vector((0, 0, 3.75 * S))))
        bmesh.ops.create_cone(LAMPS, cap_ends=True, segments=6, radius1=0.55 * S, radius2=0.05 * S, depth=0.6 * S, matrix=Matrix.Translation(base + Vector((0, 0, 5.22 * S))))
    for x in [ARCHES[k][0] for k in range(len(ARCHES))]:
        cylinder(f'lampGlass{sy}{x}', M['lampGlass'], 0.42 * S, 1.0 * S, P(x, sy * (BW - 0.2), DZ + 1.36 + 3.9), segs=6, r2=0.5 * S)
finish('lamps', LAMPS, M['lampBlack'], smooth_sides=False)

# ------------------------------------------------------------------ the saints on their pedestals, over every pier and both abutments
def statue_mesh(folder, cut, turn, height):
    """A scanned statue and its pedestal, cut from the ground it was scanned on, turned to face -y,
    stood `height` metres tall at the origin and thinned to a light mesh every copy shares."""
    src = import_model(folder, folder + 'Source')
    stand_sourced(src, cut=cut, turn=turn, height=height * S, z=0.0, mat=M['statueBlack'], report=False)
    mod = src.modifiers.new('decimate', 'DECIMATE')
    mod.ratio = min(1.0, 60000.0 / len(src.data.polygons))
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(src.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(src, do_unlink=True)
    for p in me.polygons:
        p.use_smooth = True
    return me


SAINTS = [statue_mesh('nepomuk', 0.0, 0.0, 7.6), statue_mesh('st-cyril', 0.05, 180.0, 7.0)]
SPOTS = [LEFT + 3.0] + PIERS + [RIGHT - 3.0]
k = 0
for sy in (1, -1):
    for x in SPOTS:
        ob = bpy.data.objects.new(f'saint{sy}{x}', SAINTS[k % 2])
        bpy.context.scene.collection.objects.link(ob)
        # the saints face the way: those on the far side towards us, the near ones away
        flip = Matrix.Scale(-1, 4, Vector((1, 0, 0))) if k % 4 >= 2 else Matrix.Identity(4)
        ob.matrix_world = Matrix.Translation(P(x, sy * (BW - 0.2), DZ + 1.36)) @ Matrix.Rotation(0.0 if sy > 0 else math.pi, 4, 'Z') @ flip
        k += 1

# ------------------------------------------------------------------ the Old Town Bridge Tower on the bank, the way passing through it
TX, TW, TH = LEFT - 9.5, 13.0, 32.0         # its middle, its width, its walls' height above the bank
GZ = DZ                                      # the bank it stands on


def gate_arch(widen=1.0, lift=0.0):
    """The gate passage's pointed arch in (y, z), springing at 5.5 m, 6 m wide: two arcs of 6 m."""
    pts = []
    for j in range(13):
        u = -3.0 + 6.0 * j / 12
        pts.append((u * widen, GZ + 5.5 + lift + widen * math.sqrt(max(0.0, 36.0 - (abs(u) + 3.0) ** 2))))
    return pts


gate = [(-TW / 2, GZ + 12.0), (-TW / 2, GZ - 0.2), (-3.0, GZ - 0.2)] + gate_arch() + [(3.0, GZ - 0.2), (TW / 2, GZ - 0.2), (TW / 2, GZ + 12.0)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(TX - TW / 2, u, z)) for u, z in gate], [bm.verts.new(P(TX + TW / 2, u, z)) for u, z in gate])
finish('gatehouse', bm, M['bohemian'], smooth_sides=False)
box('towerUpper', M['bohemian'], P(TX, 0, GZ + (11.9 + TH + 0.1) / 2), ((TW + 0.3) * S, (TW + 0.3) * S, (TH + 0.1 - 11.9) * S), bevel=0.0015)
box('stringCourse', M['bohemianDark'], P(TX, 0, GZ + 12.2), ((TW + 0.8) * S, (TW + 0.8) * S, 0.6 * S), bevel=0.0008)
box('gallery', M['bohemianDark'], P(TX, 0, GZ + TH + 0.6), ((TW + 2.0) * S, (TW + 2.0) * S, 1.2 * S), bevel=0.0008)
# the gate's moulded arch on both faces of the tower, its inner edge just inside the wall
for sx in (-1, 1):
    inner, outer = gate_arch(1.04, 0.15), gate_arch(1.3, 0.15)
    bm = bmesh.new()
    front = [bm.verts.new(P(TX + sx * (TW / 2 + 0.25), u, z)) for u, z in inner + list(reversed(outer))]
    back = [bm.verts.new(P(TX + sx * (TW / 2 - 0.1), u, z)) for u, z in inner + list(reversed(outer))]
    add_prism(bm, front, back)
    finish(f'gateMoulding{sx}', bm, M['bohemianDark'], smooth_sides=False)
WIN = []
H = (TW + 0.3) / 2 + 0.05
for nx, ny in ((1, 0), (-1, 0), (0, -1), (0, 1)):
    for z0, h, w in ((GZ + 15.0, 4.6, 2.2), (GZ + 23.0, 5.2, 2.6)):
        WIN.append(((TX + nx * H) * S, ny * H * S, Z0 + z0 * S, w * S, h * S, (nx, ny), 'pointed'))
glazed('towerWindows', WIN, M['bohemianDark'], depth=0.4 * S, bars=False)
# the steep slate roof, its four corner turrets with their spires, and the gilded finial
lathe('towerRoof', M['slateC'], [(r * S, z * S) for r, z in ((8.6, 0.0), (5.4, 5.0), (0.5, 15.5), (0.0, 16.0))], (0, 0, 0), segs=4,
      matrix=Matrix.Translation(P(TX, 0, GZ + TH + 1.15)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
for sx in (-1, 1):
    for sy in (-1, 1):
        cx, cy = TX + sx * (TW / 2 + 0.4), sy * (TW / 2 + 0.4)
        lathe(f'turret{sx}{sy}', M['bohemian'], [(1.0 * S, 0.0), (1.0 * S, 3.45 * S)], P(cx, cy, GZ + TH + 1.15), segs=8)
        lathe(f'turretSpire{sx}{sy}', M['slateC'], [(1.15 * S, 0.0), (0.0, 6.5 * S)], P(cx, cy, GZ + TH + 4.6), segs=8)
lathe('towerFinial', M['gold'], [(0.0, 0.0), (0.45 * S, 0.5 * S), (0.0, 1.8 * S)], P(TX, 0, GZ + TH + 17.0), segs=8, smooth=True)

for k, (x, y, shirt) in enumerate(((-0.45, -0.04, 'red'), (-0.15, 0.05, 'blue'), (0.2, -0.03, 'yellow'), (0.55, 0.04, 'green'), (0.85, -0.05, 'red'), (-1.35, -0.25, 'blue'), (-1.3, 0.3, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0 + (DZ + (0.15 if abs(y) < (BW - 0.5) * S else 0.0)) * S, scale=0.65)

render('charles-bridge')
