# The Potala Palace in the high-quality look (hq.py), laid out in metres: the Dalai Lamas' palace climbing
# the Red Hill (Marpo Ri) over Lhasa; the White Palace's battered white walls rising in tiers along the
# hill's face, their rows of windows in black trapezoid frames; the Red Palace in the middle rising above
# them, crimson with its dark frieze under the parapet, and the gilded roofs on its top; the long white
# stairways zigzagging up the hill's face; the walled foot of the hill, the rocky slopes, poplars on the
# plain, and people.
# Run: blender -b --factory-startup -P potala-palace.py -- potala-palace-1024.png 1024 potala-palace.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1645)
M['whitewash'] = material('potalaWhite', '#f1ede3', 0.8, vary='#e6e0d2', vary_scale=30, bump=0.08, bump_scale=200)
M['crimson'] = material('potalaRed', '#8e2b26', 0.8, vary='#7f2420', vary_scale=30, bump=0.06, bump_scale=200)
M['frieze'] = material('penbeFrieze', '#4a2a22', 0.9, vary='#3f241d', vary_scale=60, bump=0.3, bump_scale=300)
M['frame'] = material('windowFrame', '#1d1b1a', 0.6)
M['curtain'] = material('windowCurtain', '#e9e1cf', 0.7)
M['gilt'] = material('giltRoof', '#d8a63a', 0.3, metallic=0.8)
M['hillRock'] = material('marpoRiRock', '#8b7356', 0.9, vary='#7a6449', vary_scale=14, bump=0.4, bump_scale=120)
M['hillGrass'] = material('marpoRiGrass', '#8a8a54', 0.9, vary='#7c7d4b', vary_scale=14, bump=0.3, bump_scale=120)
M['poplar'] = material('poplar', '#5c8c3c', 0.85, vary='#6a9a46', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.0105              # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The Red Hill: rising from the plain in front to its long ridge behind."""
    ridge = 50.0 * smooth((y + 20.0) / 90.0) * smooth((160.0 - abs(x)) / 60.0)
    return ridge + 3.0 * math.sin(x / 23.0) * smooth((y + 10.0) / 40.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.2)
    return ground(x / S, y / S) * S * rim


land = terrain('hill', H, [M['hillGrass'], M['hillRock']], lambda z, nz, x, y: 1 if nz < 0.85 else 0, rings=200, segs=500)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def battered(name, mat, x0, x1, y0, y1, z0, z1, lean):
    """A block whose walls lean in by `lean` metres from foot to top (Tibetan walls)."""
    bm = bmesh.new()
    lo = [bm.verts.new(P(x, y, z0)) for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
    hi = [bm.verts.new(P(x, y, z1)) for x, y in ((x0 + lean, y0 + lean), (x1 - lean, y0 + lean), (x1 - lean, y1), (x0 + lean, y1))]
    add_prism(bm, lo, hi)
    return finish(name, bm, mat, smooth_sides=False)


def windows(x0, x1, y_face, z0, rows, step, lean_per_m):
    """Rows of windows on a battered front: black trapezoid frames with pale curtains."""
    for r in range(rows):
        z = z0 + 2.4 + r * 3.4
        inset = (z - z0) * lean_per_m
        n = int((x1 - x0 - 2 * inset - 3.0) / step)
        for k in range(n):
            x = x0 + inset + 1.5 + step * (k + 0.5)
            c = P(x, y_face + inset - 0.05, 0)
            WINS.append((c.x, c.y, Z0 + z * S, 1.3 * S, 1.7 * S, (0, -1), 'rect'))
            bm = bmesh.new()
            trap = [(x - 1.25, z - 0.3), (x + 1.25, z - 0.3), (x + 0.95, z + 2.1), (x - 0.95, z + 2.1)]
            add_prism(bm, [bm.verts.new(P(u, y_face + inset - 0.12, v)) for u, v in trap], [bm.verts.new(P(u, y_face + inset - 0.02, v)) for u, v in trap])
            FRAMES.append(bm)


WINS, FRAMES = [], []
# ------------------------------------------------------------------ the White Palace: tiers of battered white blocks along the hill's face
# each tier stands from the ground in its own band of the hill's face; its windows from what's before it
TIERS = [(-112.0, -42.0, -22.0, 4.0, 30.0, 0.0), (42.0, 110.0, -22.0, 4.0, 30.0, 0.0),
         (-98.0, -42.0, 4.0, 26.0, 52.0, 30.0), (42.0, 96.0, 4.0, 26.0, 52.0, 30.0),
         (-78.0, -42.0, 26.0, 48.0, 70.0, 52.0), (42.0, 76.0, 26.0, 48.0, 70.0, 52.0)]
for k, (x0, x1, y0, y1, top, seen) in enumerate(TIERS):
    lean = top * 0.05
    battered(f'white{k}', M['whitewash'], x0, x1, y0, y1, 0.0, top, lean)
    windows(x0 + seen * 0.05, x1 - seen * 0.05, y0 + seen * 0.05, seen, int((top - seen - 4.0) / 3.4), 4.2, 0.05)
    battered(f'whiteParapet{k}', M['frieze'], x0 + lean, x1 - lean, y0 + lean, y1, top, top + 1.4, 0.0)

# ------------------------------------------------------------------ the Red Palace in the middle: crimson, its frieze, the gilded roofs
RX0, RX1, RY0, RY1 = -40.0, 40.0, 6.0, 60.0
battered('centreWhite', M['whitewash'], RX0 - 2.0, RX1 + 2.0, -22.0, RY0, 0.0, 52.0, 2.6)
windows(RX0 - 2.0, RX1 + 2.0, -22.0, 0.0, 14, 4.2, 0.05)
battered('centreParapet', M['frieze'], RX0 + 0.6, RX1 - 0.6, -19.4, RY0, 52.0, 53.4, 0.0)
battered('redPalace', M['crimson'], RX0, RX1, RY0, RY1, 0.0, 88.0, 1.6)
windows(RX0 + 1.0, RX1 - 1.0, RY0 + 1.0, 53.4, 9, 4.4, 0.018)
battered('redFrieze', M['frieze'], RX0 + 1.6, RX1 - 1.6, RY0 + 1.6, RY1, 88.0, 92.0, 0.0)
battered('redParapet', M['crimson'], RX0 + 1.6, RX1 - 1.6, RY0 + 1.6, RY1, 92.0, 93.2, 0.0)
for k, (x, y, w) in enumerate(((-24.0, 30.0, 12.0), (0.0, 36.0, 14.0), (24.0, 30.0, 12.0), (-10.0, 52.0, 10.0), (12.0, 52.0, 10.0))):
    block_z = 93.2
    box(f'roofBase{k}', M['crimson'], P(x, y, block_z + 1.2), (w * S, w * S, 2.4 * S), bevel=0)
    lathe(f'giltRoof{k}', M['gilt'], [((w * 0.78) * S, 0.0), ((w * 0.72) * S, 0.6 * S), ((w * 0.45) * S, 2.6 * S), ((w * 0.2) * S, 3.8 * S), (0.0, 4.2 * S)], (0.0, 0.0, 0.0), segs=4,
          matrix=Matrix.Translation(P(x, y, block_z + 2.4)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
    lathe(f'giltFinial{k}', M['gilt'], [(0.8 * S, 0.0), (1.0 * S, 1.0 * S), (0.4 * S, 2.4 * S), (0.0, 3.4 * S)], P(x, y, block_z + 6.6), segs=12)

# ------------------------------------------------------------------ the zigzag stairways up the face, the wall at the foot, poplars, people
for k, (xa, xb, za, zb) in enumerate(((-128.0, -84.0, 0.0, 15.0), (-84.0, -112.0, 15.0, 29.0), (126.0, 82.0, 0.0, 15.0), (82.0, 110.0, 15.0, 29.0))):
    y = -26.0 - 3.0 * (k % 2)
    bm = bmesh.new()
    sec = [(xa, za), (xb, zb), (xb, zb + 3.0), (xa, za + 3.0)]
    add_prism(bm, [bm.verts.new(P(u, y - 3.0, v)) for u, v in sec], [bm.verts.new(P(u, y + 3.0, v)) for u, v in sec])
    finish(f'stairway{k}', bm, M['whitewash'], smooth_sides=False)
battered('footWall', M['whitewash'], -118.0, 118.0, -40.0, -34.0, 0.0, 6.0, 0.6)
for k in range(0, 236, 8):
    x = -118.0 + k
    box(f'footMerlon{k}', M['frieze'], P(x + 2.0, -37.0, 6.4), (4.0 * S, 5.0 * S, 0.8 * S), bevel=0)
glazed('curtains', WINS, M['frame'], glass=M['curtain'], depth=0.15 * S, bars=False)
fr = bmesh.new()
for bm in FRAMES:
    me = bpy.data.meshes.new('tmp')
    bm.to_mesh(me)
    bm.free()
    fr.from_mesh(me)
    bpy.data.meshes.remove(me)
finish('windowFrames', fr, M['frame'], smooth_sides=False)
POPLARS = []
for k in range(30):
    x, y = rng.uniform(-125.0, 125.0), rng.uniform(-118.0, -52.0)
    if math.hypot(x, y) * S > 1.32:
        continue
    tube(f'poplarTrunk{k}', M['trunk'], [P(x, y, 0.0), P(x, y, 4.0)], 0.4 * S)
    POPLARS.append((P(x, y, 10.0).to_tuple(), 3.2 * S, 2.4))
blob_cloud('poplars', M['poplar'], POPLARS)
for k, (x, y, shirt) in enumerate(((-20.0, -60.0, 'red'), (-8.0, -66.0, 'blue'), (12.0, -58.0, 'yellow'), (30.0, -70.0, 'green'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=1.4)

R = Matrix.Rotation(math.radians(-32.0 + 6.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('potala-palace')
