# Tikal in the high-quality look (hq.py), laid out in metres round the Great Plaza and seen from the
# south-west: Temple I, the Temple of the Great Jaguar, rising steeply in nine sloping terraces with its
# stairway up the west face, the temple on top with its one doorway and the tall roof comb above it;
# Temple II's lower bulk across the plaza; the plaza's lawn with its row of stelae and round altars; the
# small temples crowding the North Acropolis and the long palaces of the Central Acropolis; the
# rainforest canopy all round, the temples rising above it, and people.
# Run: blender -b --factory-startup -P tikal.py -- tikal-1024.png 1024 tikal.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(732)
M['mayaStone'] = masonry('mayaStone', '#aaa190', '#7c7465', scale=280, rough=0.9, vary='#9a917f')
M['mayaWeathered'] = material('mayaWeathered', '#8f877a', 0.9, vary='#7f786c', vary_scale=30, bump=0.4, bump_scale=200)
M['plazaLawn'] = material('plazaLawn', '#6f9e48', 0.85, vary='#7caa53', vary_scale=12, bump=0.3, bump_scale=200)
M['canopy'] = material('peténCanopy', '#2f5a2c', 0.85, vary='#3c6b36', vary_scale=14, bump=0.3, bump_scale=90)
M['canopyLight'] = material('peténCanopyLight', '#4a7a35', 0.85, vary='#578842', vary_scale=14, bump=0.3, bump_scale=90)
M['doorDark'] = material('templeDoorway', '#3a332c', 0.9)

S = 0.016               # metres to the tile's units
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


slab('ground', M['plazaLawn'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], G - 0.003, Z0, margin=0.02)
BEFORE = set(bpy.data.objects)


def terraces(name, cx, cy, hx, hy, n, height, inset, setback, front=None):
    """A Maya temple pyramid: n sloping terraces, each a frustum set back on the one below, with an
    apron moulding round its top. Returns the summit's half widths and height."""
    z0 = -0.5
    step = height / n
    for k in range(n):
        z1 = step * (k + 1)
        tx, ty = hx - inset, hy - inset
        bm_ = bmesh.new()
        lo = [bm_.verts.new(P(cx + sx * hx, cy + sy * hy, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        hi = [bm_.verts.new(P(cx + sx * tx, cy + sy * ty, z1)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        add_prism(bm_, lo, hi)
        finish(f'{name}Terrace{k}', bm_, M['mayaStone'], smooth_sides=False)
        block(f'{name}Apron{k}', M['mayaWeathered'], cx - tx - 0.3, cx + tx + 0.3, cy - ty - 0.3, cy + ty + 0.3, z1 - 0.9, z1 - 0.3, bevel=0)
        hx, hy = tx - setback, ty - setback
        z0 = z1 - 0.1
    return hx + setback, hy + setback, height


def stairway(name, x_foot, x_top, cy, half_w, z0, z1):
    """A steep stairway climbing along x from x_foot (at z0) to x_top (at z1)."""
    n = max(6, int((z1 - z0) / 0.8))
    bm_ = bmesh.new()
    for k in range(n):
        t0, t1 = k / n, (k + 1) / n
        xa = x_foot + (x_top - x_foot) * t0
        zt = z0 + (z1 - z0) * t1
        lo, hi = sorted((xa, x_top))
        bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation(P((lo + hi) / 2, cy, (z0 + zt) / 2)) @ Matrix.Diagonal(((hi - lo) * S, 2 * half_w * S, (zt - z0) * S, 1)))
    finish(name, bm_, M['mayaWeathered'], smooth_sides=False)


def temple(name, cx, cy, hx, hy, z, h, comb_h, face):
    """The temple on the summit, its one doorway towards `face` ('east', 'west' or 'south'), the roof comb
    above it, set towards the back."""
    block(name, M['mayaStone'], cx - hx, cx + hx, cy - hy, cy + hy, z - 0.2, z + h)
    block(name + 'Cornice', M['mayaWeathered'], cx - hx - 0.3, cx + hx + 0.3, cy - hy - 0.3, cy + hy + 0.3, z + h - 0.8, z + h)
    if face == 'south':
        dy = cy - hy - 0.02
        block(name + 'Door', M['doorDark'], cx - 1.0, cx + 1.0, dy - 0.15, dy + 0.15, z, z + 2.6, bevel=0)
        cy2 = cy + hy * 0.35
        comb = (cx - hx * 0.85, cx + hx * 0.85, cy2 - 1.2, cy2 + 1.2)
    else:
        fx = 1 if face == 'east' else -1
        dx = cx + fx * (hx + 0.02)
        block(name + 'Door', M['doorDark'], dx - 0.15, dx + 0.15, cy - 1.0, cy + 1.0, z, z + 2.8, bevel=0)
        cx2 = cx - fx * hx * 0.35
        comb = (cx2 - 1.4, cx2 + 1.4, cy - hy * 0.85, cy + hy * 0.85)
    block(name + 'Comb', M['mayaStone'], comb[0], comb[1], comb[2], comb[3], z + h - 0.1, z + h + comb_h)
    for k in range(3 if comb_h > 3.0 else 0):
        zz = z + h + comb_h * (k + 0.5) / 3.4
        block(f'{name}CombBand{k}', M['mayaWeathered'], comb[0] - 0.2, comb[1] + 0.2, comb[2] - 0.2, comb[3] + 0.2, zz, zz + 0.7, bevel=0)


# ------------------------------------------------------------------ Temple I on the plaza's east side, its stairway up the west face
T1X, T1Y = 46.0, 0.0
thx, thy, tz = terraces('templeI', T1X, T1Y, 17.0, 15.0, 9, 32.0, 1.2, 0.0)
stairway('templeIStair', T1X - 17.0, T1X - thx + 0.5, T1Y, 3.6, -0.5, tz)
temple('templeIShrine', T1X + 0.5, T1Y, thx - 0.8, thy - 0.6, tz, 6.0, 12.0, 'west')
# Temple II on the west side, its stairway up the east face
T2X, T2Y = -44.0, 4.0
uhx, uhy, uz = terraces('templeII', T2X, T2Y, 18.0, 17.0, 3, 20.0, 3.0, 1.0)
stairway('templeIIStair', T2X + 18.0, T2X + uhx - 0.5, T2Y, 4.0, -0.5, uz)
temple('templeIIShrine', T2X - 0.5, T2Y, uhx - 1.0, uhy - 1.0, uz, 6.0, 12.0, 'east')

# ------------------------------------------------------------------ the North Acropolis's small temples and the Central Acropolis's palaces
for k, (x, y, hx, h) in enumerate(((-16.0, 46.0, 9.0, 14.0), (2.0, 52.0, 10.0, 18.0), (20.0, 46.0, 9.0, 14.0), (-4.0, 34.0, 7.0, 9.0), (12.0, 34.0, 7.0, 9.0))):
    block(f'acropolisPlatform{k}', M['mayaStone'], x - hx - 3.0, x + hx + 3.0, y - hx - 3.0, y + hx + 3.0, -0.5, 4.0)
    ax, ay, az = terraces(f'northTemple{k}', x, y, hx, hx, 4, h, 1.0, 0.4)
    temple(f'northShrine{k}', x, y + 0.4, ax - 0.6, ax - 0.6, az, 3.6, 5.0 if k == 1 else 0.0, 'south')
for k, (x0, x1, y0, y1, h) in enumerate(((-30.0, 6.0, -44.0, -36.0, 8.0), (10.0, 34.0, -48.0, -40.0, 7.0), (-20.0, 22.0, -60.0, -52.0, 9.0))):
    block(f'palacePlatform{k}', M['mayaStone'], x0 - 2.0, x1 + 2.0, y0 - 2.0, y1 + 2.0, -0.5, 3.0)
    block(f'palace{k}', M['mayaStone'], x0, x1, y0, y1, 3.0, 3.0 + h)
    block(f'palaceCornice{k}', M['mayaWeathered'], x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, 3.0 + h - 1.0, 3.0 + h, bevel=0)
    for j in range(int((x1 - x0) / 5.0)):
        x = x0 + 2.5 + 5.0 * j
        block(f'palaceDoor{k}_{j}', M['doorDark'], x - 0.8, x + 0.8, y1 - 0.05, y1 + 0.05, 3.0, 5.4, bevel=0)
# the stelae and round altars along the plaza's north side
for k in range(7):
    x = -26.0 + 8.0 * k
    block(f'stela{k}', M['mayaWeathered'], x - 0.6, x + 0.6, 22.0, 22.6, 0.0, 3.4, bevel=0.0003)
    cylinder(f'altar{k}', M['mayaWeathered'], 1.0 * S, 0.8 * S, P(x, 20.0, 0.0), segs=16)

# ------------------------------------------------------------------ the rainforest canopy all round, the temples rising above it; people
CANOPY, LIGHT = [], []
CLEARED = ((-32.0, 30.0, -36.0, 30.0), (26.0, 68.0, -21.0, 21.0), (-66.0, -22.0, -18.0, 26.0), (-30.0, 36.0, 26.0, 68.0), (-36.0, 40.0, -66.0, -32.0))
for k in range(1600):
    x, y = rng.uniform(-95.0, 95.0), rng.uniform(-95.0, 95.0)
    r = math.hypot(x, y)
    if r * S > 1.32:
        continue
    rr = rng.uniform(5.0, 8.0)
    if any(x0 - rr < x < x1 + rr and y0 - rr < y < y1 + rr for x0, x1, y0, y1 in CLEARED):      # the forest right up to the plaza and the temples, never over them
        continue
    h = rng.uniform(18.0, 30.0)
    (LIGHT if rng.random() < 0.3 else CANOPY).append((P(x, y, h).to_tuple(), rr * S, 0.75))
    CANOPY.append((P(x, y, h * 0.45).to_tuple(), rr * 0.95 * S, 1.1))     # the understorey beneath, so the forest is solid to the ground
    if len(CANOPY) + len(LIGHT) > 1000:
        break
blob_cloud('canopy', M['canopy'], CANOPY)
blob_cloud('canopyLight', M['canopyLight'], LIGHT)
for k, (x, y, z) in enumerate(((0.0, -10.0, 0.0), (8.0, 6.0, 0.0), (-12.0, 2.0, 0.0), (20.0, -4.0, 0.0), (T1X - 12.0, 0.6, 12.0), (-4.0, 18.0, 0.0))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k % 4], z=c.z, scale=0.7)

R = Matrix.Rotation(math.radians(-32.0 + 35.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('tikal')
