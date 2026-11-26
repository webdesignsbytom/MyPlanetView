# Castel Sant'Angelo in the high-quality look (hq.py), laid out in metres (the Tiber drawn narrower,
# to fit): Hadrian's great round mausoleum on its square base with round towers at the corners, all
# inside the star of the papal fortress's pentagonal bastions over a dry moat; the drum's crenellated
# brick top, the ochre papal apartments rising on it with the white loggia of Paul III, the Angel's
# terrace on top and the bronze Archangel Michael sheathing his sword (the St Michael scan,
# jiannibang, CC BY 4.0, in _sources/st-michael/, a stand-in); before it the Lungotevere and the Tiber
# in its travertine banks, crossed by the Ponte Sant'Angelo's arches with angels on its parapets
# (the same scan, in marble, stand-ins for Bernini's); plane trees, the park's lawns, and people.
# Run: blender -b --factory-startup -P castel-sant-angelo.py -- castel-sant-angelo-1024.png 1024 castel-sant-angelo.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(139)
M['brickSA'] = material('brickSA', '#a6614a', 0.8, vary='#97553f', vary_scale=24, bump=0.12, bump_scale=220)
M['travSA'] = material('travSA', '#dccfb6', 0.6, vary='#cfc1a5', vary_scale=18, bump=0.08, bump_scale=160)
M['drumSA'] = material('drumSA', '#b59f84', 0.75, vary='#a68f74', vary_scale=14, bump=0.2, bump_scale=200)
M['ochreSA'] = material('ochreSA', '#dfb874', 0.75, vary='#d4ab66', vary_scale=24, bump=0.05, bump_scale=200)
M['roofSA'] = banded(material('roofSA', '#bb6545', 0.7, vary='#a9573a', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 300.0, strength=0.25)
M['tiber'] = material('tiber', '#3f6e60', 0.08, vary='#4a7b6c', vary_scale=6, coat=0.7)
M['road'] = material('lungotevere', '#6a6a6a', 0.8, vary='#616161', vary_scale=40)
M['moat'] = material('moatLawn', '#68b046', 0.85, vary='#73ba4f', vary_scale=10)
M['angelBronze'] = material('angelBronze', '#5e6b52', 0.4, vary='#4d5a44', vary_scale=20, metallic=0.75)
M['planeTree'] = material('planeTree', '#5a9a3c', 0.85, vary='#67a845', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.017               # metres to the tile's units
LAND = 4.0              # the banks above the Tiber's water (metres)
ZW = G + 0.004          # the water
Z0 = ZW + LAND * S      # the park and the street
CY = 18.0               # the castle's middle, back from the tile's middle (metres)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


BEFORE = set(bpy.data.objects)


def star(C, F, K, T):
    """The fortress's outline: a square of half-side C with a pentagonal bastion on each corner (its
    flanks F from the corner's middle, K out, its point at T on the diagonal)."""
    pts = []
    for sx, sy in ((1, -1), (1, 1), (-1, 1), (-1, -1)):
        # arriving along the wall before this corner, then out round the bastion
        if (sx, sy) in ((1, -1), (-1, 1)):
            pts += [(sx * F, sy * C), (sx * F, sy * (C + K)), (sx * T, sy * T), (sx * (C + K), sy * F), (sx * C, sy * F)]
        else:
            pts += [(sx * C, sy * F), (sx * (C + K), sy * F), (sx * T, sy * T), (sx * F, sy * (C + K)), (sx * F, sy * C)]
    return pts


def battered(name, mat, outline, z0, z1, inset, top_mat=None):
    """A wall solid of an outline, sloping in by `inset` as it rises, its top in `top_mat`."""
    bm = bmesh.new()
    n = len(outline)
    cx = sum(x for x, _ in outline) / n
    cy = sum(y for _, y in outline) / n
    low = [bm.verts.new(P(x, y + CY, z0)) for x, y in outline]
    high = []
    for x, y in outline:
        d = math.hypot(x - cx, y - cy)
        k = max(0.0, (d - inset) / d)
        high.append(bm.verts.new(P(cx + (x - cx) * k, cy + (y - cy) * k + CY, z1)))
    add_prism(bm, low, high)
    ob = finish(name, bm, mat, smooth_sides=False)
    if top_mat is not None:
        ob.data.materials.append(top_mat)
        for poly in ob.data.polygons:
            if poly.normal.z > 0.9:
                poly.material_index = 1
    return ob


# ------------------------------------------------------------------ the park, the moat, the Lungotevere, the Tiber and its banks
RY0, RY1 = -72.0, -44.0       # the Tiber between its embankments (absolute metres)
slab('park', M['lawn'], [(-2.0, (RY1 + 9.0) * S), (2.0, (RY1 + 9.0) * S), (2.0, 2.0), (-2.0, 2.0)], G - 0.003, Z0, margin=0.02)
slab('road', M['road'], rect(0.0, (RY1 + 4.5) * S, 4.0, 9.0 * S), G - 0.003, Z0 + 0.05 * S, margin=0.02)
slab('farBank', M['road'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (RY0 - 1.0) * S), (-2.0, (RY0 - 1.0) * S)], G - 0.003, Z0 + 0.05 * S, margin=0.02)
slab('tiber', M['tiber'], rect(0.0, (RY0 + RY1) / 2 * S, 4.0, (RY1 - RY0) * S), G - 0.003, ZW, margin=0.03)
for k, y in enumerate((RY1, RY0)):
    slab(f'embankment{k}', M['travSA'], rect(0.0, y * S, 4.0, 2.0 * S), G - 0.003, Z0 + 1.0 * S, margin=0.03)
TREES = []
for k in range(40):
    x = -90.0 + 4.5 * k
    for y in (RY1 + 7.5,):
        if math.hypot(x * S, y * S) > 1.36 or abs(x) < 24.0:
            continue
        cylinder(f'plane{k}{y:.0f}Trunk', M['trunk'], 0.35 * S, 6.0 * S, P(x, y, 0.0), segs=8)
        TREES.append((P(x + rng.uniform(-0.6, 0.6), y, 9.0 + rng.uniform(-0.6, 0.6)).to_tuple(), rng.uniform(3.2, 4.0) * S, 0.85))
blob_cloud('planeTrees', M['planeTree'], TREES)

# ------------------------------------------------------------------ the fortress: the bastions' star over the dry moat, the square base and its round towers
battered('bastions', M['brickSA'], star(34.0, 21.0, 7.0, 46.0), 0.0, 9.0, 1.4, top_mat=M['moat'])
battered('base', M['brickSA'], [(-30.0, -30.0), (30.0, -30.0), (30.0, 30.0), (-30.0, 30.0)], 8.9, 19.0, 0.8)
for sx in (-1, 1):
    for sy in (-1, 1):
        cylinder(f'roundTower{sx}{sy}', M['brickSA'], 7.0 * S, 13.0 * S, P(sx * 30.0, sy * 30.0 + CY, 8.9), segs=32, r2=6.6 * S)
        cylinder(f'roundTowerBand{sx}{sy}', M['travSA'], 6.9 * S, 0.8 * S, P(sx * 30.0, sy * 30.0 + CY, 21.5), segs=32)
        for j in range(14):
            a = 2 * math.pi * j / 14
            box(f'towerMerlon{sx}{sy}{j}', M['brickSA'], P(sx * 30.0 + 6.4 * math.cos(a), sy * 30.0 + CY + 6.4 * math.sin(a), 23.0), (1.6 * S, 1.0 * S, 2.2 * S), rot_z=a, bevel=0)
# the gate in the base's front, up a ramp from the moat
box('gateRamp', M['brickSA'], P(0.0, -36.0 + CY, 4.5), (8.0 * S, 12.0 * S, 9.0 * S), bevel=0)
DOORS = []
c = P(0.0, -30.4 + CY, 0.0)
DOORS.append((c.x, c.y, Z0 + 9.0 * S, 4.2 * S, 6.4 * S, (0, -1), 'round'))

# ------------------------------------------------------------------ Hadrian's drum, its crenellated top
DR = 29.0
cylinder('drum', M['drumSA'], DR * S, 32.0 * S, P(0.0, CY, 0.0), segs=96)
cylinder('drumBand', M['travSA'], (DR + 0.25) * S, 1.2 * S, P(0.0, CY, 22.0), segs=96)
cylinder('drumTop', M['brickSA'], (DR - 0.2) * S, 3.0 * S, P(0.0, CY, 32.0), segs=96)
for j in range(56):
    a = 2 * math.pi * j / 56
    box(f'drumMerlon{j}', M['brickSA'], P((DR - 0.5) * math.cos(a), CY + (DR - 0.5) * math.sin(a), 36.0), (2.0 * S, 1.0 * S, 2.0 * S), rot_z=a + math.pi / 2, bevel=0)
WIN = []
for j in range(10):
    a = math.radians(205 + 13 * j)
    c = P(DR * math.cos(a) * 1.002, CY + DR * math.sin(a) * 1.002, 0.0)
    WIN.append((c.x, c.y, Z0 + 26.0 * S, 1.4 * S, 2.2 * S, (math.cos(a), math.sin(a)), 'rect'))

# ------------------------------------------------------------------ the papal apartments on the drum, the loggia, the Angel's terrace and the angel
TOP = 35.0
BLOCKS = [(-14.0, 6.0, 12.0, 26.0, 9.0), (14.0, 6.0, 12.0, 26.0, 9.0), (0.0, 14.0, 22.0, 12.0, 11.0), (0.0, -4.0, 18.0, 14.0, 12.0)]
for k, (bx, by, w, d, h) in enumerate(BLOCKS):
    box(f'apartment{k}', M['ochreSA'], P(bx, by + CY, TOP + h / 2), (w * S, d * S, h * S), bevel=0)
    hip_roof(f'apartmentRoof{k}', M['roofSA'], bx * S, (by + CY) * S, Z0 + (TOP + h - 0.05) * S, (w + 1.0) * S, (d + 1.0) * S, 3.0 * S, over=0.0)
    for side in (-1,):
        n = int(w / 3.2)
        for j in range(n):
            x = bx - w / 2 + (j + 0.5) * w / n
            c = P(x, by - d / 2 - 0.05 + CY, 0.0)
            for z in (TOP + 2.0, TOP + 6.0):
                if z + 2.0 < TOP + h:
                    WIN.append((c.x, c.y, Z0 + z * S, 1.2 * S, 2.0 * S, (0, -1), 'rect'))
    n = int(d / 3.2)
    for j in range(n):
        y = by - d / 2 + (j + 0.5) * d / n
        c = P(bx - w / 2 - 0.05, y + CY, 0.0)
        for z in (TOP + 2.0, TOP + 6.0):
            if z + 2.0 < TOP + h:
                WIN.append((c.x, c.y, Z0 + z * S, 1.2 * S, 2.0 * S, (-1, 0), 'rect'))
# the white loggia of Paul III across the front block's face, under its own roof
LY = -4.0 - 7.0 - 1.6
arcade_path('loggia', M['travSA'], [(x * S, (LY + CY) * S) for x in (-9.0, -5.4, -1.8, 1.8, 5.4, 9.0)], 1.6 * S, Z0 + (TOP + 6.0) * S, 3.6 * S, 1.3 * S)
for x in (-9.0, -5.4, -1.8, 1.8, 5.4, 9.0):
    box(f'loggiaPier{x:.0f}', M['travSA'], P(x, LY + 0.8 + CY, TOP + 3.0), (0.8 * S, 1.6 * S, 6.0 * S), bevel=0)
box('loggiaFloor', M['travSA'], P(0.0, LY + 0.8 + CY, TOP + 0.2), (18.6 * S, 1.6 * S, 0.4 * S), bevel=0)
# the Angel's terrace on top, its parapet, and the archangel on his pedestal
AX, AY, AZ = 0.0, 6.0, TOP + 15.0
box('terraceTower', M['ochreSA'], P(AX, AY + CY, TOP + 7.5), (12.0 * S, 12.0 * S, 15.0 * S), bevel=0)
box('terraceFloor', M['travSA'], P(AX, AY + CY, AZ + 0.2), (12.6 * S, 12.6 * S, 0.4 * S), bevel=0)
for e in range(4):
    a = math.pi / 2 * e
    box(f'terraceParapet{e}', M['travSA'], P(AX + 6.0 * math.cos(a), AY + CY + 6.0 * math.sin(a), AZ + 0.9), ((12.4 if e % 2 else 0.5) * S, (0.5 if e % 2 else 12.4) * S, 1.4 * S), bevel=0)
box('pedestal', M['travSA'], P(AX, AY + CY, AZ + 1.6), (2.6 * S, 2.6 * S, 2.8 * S), bevel=0.001)
src = import_model('st-michael', 'stMichaelSource')
stand_sourced(src, cut=0.33, turn=0.0, height=6.0 * S, z=0.0, mat=M['angelBronze'], report=False)
src.matrix_world = Matrix.Translation(P(AX, AY + CY, AZ + 3.0))
glazed('windows', WIN, M['travSA'], depth=0.3 * S)
glazed('gate', DOORS, M['travSA'], glass=M['door'], depth=0.4 * S, bars=False)

# ------------------------------------------------------------------ the Ponte Sant'Angelo: its arches over the Tiber, the angels on its parapets
BW = 4.5
spans = [(RY1 + 0.5, RY1 - 5.0, 2.0), (RY1 - 5.0, RY1 - 14.0, 3.6), (RY1 - 14.0, RY1 - 23.0, 3.6), (RY1 - 23.0, RY0 - 0.5, 2.0)]
ZD = 1.4                      # the deck's top above the park's level
bm = bmesh.new()
for y0, y1, a in spans:
    mid, half = (y0 + y1) / 2, (y0 - y1) / 2
    outline = arch_outline(half, min(a, half * 0.9), -LAND, ZD + LAND, steps=10)
    add_prism(bm, [bm.verts.new(P(-BW, mid - u, z)) for u, z in outline], [bm.verts.new(P(BW, mid - u, z)) for u, z in outline])
finish('bridge', bm, M['travSA'], smooth_sides=False)
box('bridgeDeck', M['road'], P(0.0, (RY0 + RY1) / 2, ZD + 0.05), ((2 * BW - 1.2) * S, (RY1 - RY0 + 1.0) * S, 0.1 * S), bevel=0)
ANGEL_Y = []
for sx in (-1, 1):
    box(f'bridgeParapet{sx}', M['travSA'], P(sx * (BW - 0.3), (RY0 + RY1) / 2, ZD + 0.6), (0.6 * S, (RY1 - RY0 + 1.0) * S, 1.2 * S), bevel=0)
statue = import_model('st-michael', 'bridgeAngelSource')
stand_sourced(statue, cut=0.33, turn=0.0, height=3.4 * S, z=0.0, mat=M['whiteMarble'], report=False)
data = statue.data
bpy.data.objects.remove(statue, do_unlink=True)
for sx in (-1, 1):
    for j, y in enumerate((RY1 - 5.0, RY1 - 14.0, RY1 - 23.0)):
        box(f'angelPlinth{sx}{j}', M['travSA'], P(sx * (BW - 0.3), y, ZD + 1.6), (1.1 * S, 1.1 * S, 2.0 * S), bevel=0)
        ob = bpy.data.objects.new(f'bridgeAngel{sx}{j}', data)
        bpy.context.scene.collection.objects.link(ob)
        ob.matrix_world = Matrix.Translation(P(sx * (BW - 0.3), y, ZD + 2.6)) @ Matrix.Rotation(math.radians(90 * sx), 4, 'Z')

# ------------------------------------------------------------------ people on the bridge and the riverside
for k, (x, y, z, shirt) in enumerate(((-1.5, RY1 - 9.0, ZD, 'red'), (1.8, RY1 - 18.0, ZD, 'blue'), (-0.8, RY1 - 26.0, ZD, 'yellow'), (-24.0, RY1 + 4.0, 0.05, 'green'), (20.0, RY1 + 5.0, 0.05, 'red'), (8.0, RY0 - 4.0, 0.05, 'blue'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.1)

R = Matrix.Rotation(math.radians(-32.0 + 52.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('castel-sant-angelo')
