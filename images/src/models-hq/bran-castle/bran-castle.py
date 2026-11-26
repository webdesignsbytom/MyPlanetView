# Bran Castle in the high-quality look (hq.py), laid out in metres on its crag above the Bran pass: the
# white-walled wings round the little courtyard following the rock's edge, on their grey stone footings,
# under steep red-tiled roofs with their small windows; the round tower and its cone, the tall square
# keep, the gate tower and the north tower under their own steep roofs; the bare rock falling to the
# road; the dark pine forest of the Carpathians round it, and people.
# Run: blender -b --factory-startup -P bran-castle.py -- bran-castle-1024.png 1024 bran-castle.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1377)
M['whiteWall'] = material('branWhite', '#efe9dc', 0.8, vary='#e3dccc', vary_scale=18, bump=0.08, bump_scale=200)
M['footing'] = masonry('branFooting', '#9b968b', '#716d65', scale=90, rough=0.9, vary='#8c877c')
M['crag'] = material('branCrag', '#8e8a80', 0.9, vary='#7a766d', vary_scale=14, bump=0.6, bump_scale=60)
M['tilesBr'] = banded(material('branTiles', '#a5482f', 0.7, vary='#923f29', vary_scale=12, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['meadowBr'] = material('branMeadow', '#6c9441', 0.85, vary='#61883b', vary_scale=14, bump=0.2, bump_scale=200)
M['pine'] = material('carpathianPine', '#29452b', 0.85, vary='#335233', vary_scale=16, bump=0.3, bump_scale=90)
M['roadBr'] = material('roadBran', '#5b5a5d', 0.8, vary='#525154', vary_scale=40)

S = 0.0215              # metres to the tile's units
CRAG = 0.36             # the crag's top above the turf
ZT = G + CRAG


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


FOOT = [(-20.0, -13.0), (15.0, -18.0), (22.0, 6.0), (-3.0, 20.0), (-22.0, 9.0)]


def crag_d(x, y):
    """How far (metres) a point lies outside the castle's footprint, roughly (by its widest reach)."""
    a = math.atan2(y, x)
    reach = 22.0 + 3.0 * math.sin(2.0 * a + 0.6) + 2.0 * math.sin(5.0 * a)
    return math.hypot(x, y) - reach


def H(x, y):
    mx, my = x / S, (y - 0.05) / S
    d = crag_d(mx, my)
    rim = smooth((1.47 - math.hypot(x, y)) / 0.2)
    rugged = 0.02 * math.sin(0.45 * mx + 0.3 * my) + 0.014 * math.sin(1.1 * mx - 0.8 * my) + 0.008 * math.sin(2.3 * mx + 1.7 * my)
    rock = CRAG * (1.0 - smooth((d - 1.5) / 17.0) ** 0.8) + rugged * smooth((22.0 - abs(d - 6.0)) / 16.0)
    hills = 0.25 * smooth((y - 0.85) / 0.6)
    return max(0.0, rock, hills) * rim


def pick(z, nz, x, y):
    if z > CRAG * 0.98:
        return 1
    return 0 if nz < 0.72 and z > 0.01 else 1


ground = terrain('crag', H, [M['crag'], M['meadowBr']], pick, rings=230, segs=560)
slab('road', M['roadBr'], [(-2.0, -0.92), (2.0, -0.78), (2.0, -0.7), (-2.0, -0.84)], G - 0.002, G + 0.0015, margin=0.04)
pines = []
for p in scatter_on(ground, 22000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.42 and p.z < ZT - 0.05, seed=9):
    if -0.96 < p.y < -0.66 or crag_d(p.x / S, (p.y - 0.05) / S) < 8.0:
        continue
    r = rng.uniform(0.018, 0.026)
    pines.append(((p.x, p.y, p.z + r * 1.6), r, 2.4))
blob_cloud('pineForest', M['pine'], pines, subdivisions=1)


def P(x, y, z):
    return Vector((x * S, 0.05 + y * S, ZT + z * S))


# ------------------------------------------------------------------ the wings round the courtyard, on the rock's edge
WIN = []
EDGES = list(zip(FOOT, FOOT[1:] + FOOT[:1]))
cx, cy = sum(p[0] for p in FOOT) / len(FOOT), sum(p[1] for p in FOOT) / len(FOOT)
for k, ((ax, ay), (bx, by)) in enumerate(EDGES):
    L = math.hypot(bx - ax, by - ay)
    ang = math.atan2(by - ay, bx - ax)
    nx, ny = -math.sin(ang), math.cos(ang)
    if (cx - ax) * nx + (cy - ay) * ny < 0:
        nx, ny = -nx, -ny
    mx, my = (ax + bx) / 2 + nx * 4.0, (ay + by) / 2 + ny * 4.0
    h = (12.0, 15.0, 13.0, 14.0, 12.0)[k]
    box(f'footing{k}', M['footing'], P(mx, my, -4.0), ((L + 2.0) * S, 8.4 * S, 8.2 * S), rot_z=ang, bevel=0.0006)
    box(f'wing{k}', M['whiteWall'], P(mx, my, (h - 0.1) / 2), (L * S, 8.0 * S, (h + 0.1) * S), rot_z=ang, bevel=0.0006)
    m = Matrix.Translation(P(mx, my, h - 0.05)) @ Matrix.Rotation(ang, 4, 'Z')
    bm = bmesh.new()
    hw, hd, rise = L / 2 * S, 4.6 * S, 6.5 * S
    v = [bm.verts.new(m @ Vector(p)) for p in ((-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0), (-hw + hd, 0, rise), (hw - hd, 0, rise))]
    for f in ((v[0], v[1], v[5], v[4]), (v[2], v[3], v[4], v[5]), (v[3], v[0], v[4]), (v[1], v[2], v[5]), (v[3], v[2], v[1], v[0])):
        bm.faces.new(f)
    finish(f'wingRoof{k}', bm, M['tilesBr'], smooth_sides=False)
    out = Vector((-nx, -ny, 0))
    for j in range(max(1, int(L / 5.0))):
        u = -L / 2 + (j + 0.5) * L / max(1, int(L / 5.0))
        for z in (4.0, 8.5) if h > 12.5 else (4.5,):
            p = P((ax + bx) / 2 + math.cos(ang) * u + out.x * 0.05, (ay + by) / 2 + math.sin(ang) * u + out.y * 0.05, z)
            WIN.append((p.x, p.y, p.z, 1.0 * S, 1.6 * S, (out.x, out.y), 'rect'))

# ------------------------------------------------------------------ the towers
def round_tower(name, x, y, r, h, cone):
    cylinder(name, M['whiteWall'], r * S, (h + 6.0) * S, P(x, y, -6.0), segs=28)
    lathe(name + 'Cone', M['tilesBr'], [((r + 0.6) * S, 0.0), ((r + 0.3) * S, 0.7 * S), (0.0, cone * S)], P(x, y, h - 0.05), segs=28)
    lathe(name + 'Finial', M['iron'], [(0.0, 0.0), (0.3 * S, 0.3 * S), (0.0, 2.0 * S)], P(x, y, h + cone - 0.3), segs=8)


def square_tower(name, x, y, w, d, h, rise, ang=0.0):
    box(name, M['whiteWall'], P(x, y, (h - 6.0) / 2), (w * S, d * S, (h + 6.0) * S), rot_z=ang, bevel=0.0006)
    lathe(name + 'Roof', M['tilesBr'], [((max(w, d) / 2 + 0.7) * math.sqrt(2) * S, 0.0), (0.0, rise * S)], (0, 0, 0), segs=4,
          matrix=Matrix.Translation(P(x, y, h - 0.05)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((w / max(w, d), d / max(w, d), 1.0, 1)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
    for nx, ny in ((0, -1), (-1, 0)):
        c = P(x + nx * (w / 2 + 0.05), y + ny * (d / 2 + 0.05), 0)
        for z in (h - 8.0, h - 15.0):
            WIN.append((c.x, c.y, ZT + z * S, 1.2 * S, 1.8 * S, (nx, ny), 'rect'))


round_tower('roundTower', 15.0, -18.0, 6.2, 24.0, 11.0)
square_tower('keep', -19.0, -11.0, 9.0, 9.0, 32.0, 11.0, ang=0.1)
square_tower('gateTower', -22.0, 9.0, 7.0, 7.0, 22.0, 8.0, ang=-0.3)
square_tower('northTower', -3.0, 20.0, 9.0, 7.0, 26.0, 9.0, ang=0.45)
round_tower('eastTower', 22.0, 6.0, 4.4, 19.0, 9.0)
glazed('windows', WIN, M['footing'], depth=0.25 * S)

for k, (x, y, shirt) in enumerate(((-0.5, -0.8, 'red'), (-0.3, -0.78, 'blue'), (0.2, -0.74, 'yellow'), (0.55, -0.73, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.0015, scale=0.85)

render('bran-castle')
