# The Hassan Tower in the high-quality look (hq.py), laid out in metres: Rabat's unfinished minaret of red
# sandstone, square and massive, its faces carved with panels of interlaced lattice and pierced with
# arched windows, different on every side; before it the esplanade with the rows of column stumps of the
# mosque that was never finished; the white Mausoleum of Mohammed V at its end under its green tiled
# roof; the paving, and people.
# Run: blender -b --factory-startup -P hassan-tower.py -- hassan-tower-1024.png 1024 hassan-tower.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1195)
M['ochre'] = material('hassanStone', '#c27c52', 0.9, vary='#b46f48', vary_scale=20, bump=0.2, bump_scale=200)
M['sebka'] = chequer('sebkaLattice', '#b06d47', '#8a5134', scale=60.0, rough=0.9)
M['column'] = material('hassanColumn', '#e2d6c2', 0.85, vary='#d6c8b2', vary_scale=24, bump=0.15, bump_scale=200)
M['whiteM'] = material('mausoleumWhite', '#f3f0ea', 0.5)
M['greenTile'] = material('greenTiles', '#2f7a56', 0.4, vary='#3a8a63', vary_scale=60)
M['goldH'] = material('hassanGold', '#d9ad48', 0.3, metallic=0.85)
M['esplanade'] = masonry('hassanEsplanade', '#d8cdb8', '#b8ad97', scale=80, rough=0.85, vary='#cfc3ad')
M['recessH'] = material('hassanRecess', '#4a2c1e', 0.9)

S = 0.032               # metres to the tile's units
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


BEFORE = set(bpy.data.objects)
slab('esplanade', M['esplanade'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
WIN = []
# ------------------------------------------------------------------ the tower: square, massive, its carved panels and arched windows
TX, TY, TW, TH = -14.0, 18.0, 16.0, 44.0
box('tower', M['ochre'], P(TX, TY, TH / 2), (TW * S, TW * S, TH * S), bevel=0.002)
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    tx, ty = -ny, nx
    for k, (z0, h) in enumerate(((20.0, 10.0), (32.0, 9.0))):
        c = P(TX + nx * (TW / 2 + 0.06), TY + ny * (TW / 2 + 0.06), z0 + h / 2)
        box(f'panel{nx}{ny}{k}', M['sebka'], c, ((TW - 5.0) * S if nx == 0 else 0.12 * S, 0.12 * S if nx == 0 else (TW - 5.0) * S, h * S), bevel=0)
    for z, w, h in ((6.0, 1.6, 3.4), (12.0, 2.2, 4.4)):
        for u in ((-3.0, 3.0) if z > 10 else (0.0,)):
            c = P(TX + nx * (TW / 2 + 0.05) + tx * u, TY + ny * (TW / 2 + 0.05) + ty * u, 0)
            WIN.append((c.x, c.y, Z0 + z * S, w * S, h * S, (nx, ny), 'pointed'))
    c = P(TX + nx * (TW / 2 + 0.05), TY + ny * (TW / 2 + 0.05), 0)
    WIN.append((c.x, c.y, Z0 + 23.0 * S, 3.2 * S, 5.0 * S, (nx, ny), 'pointed'))
box('towerTop', M['ochre'], P(TX, TY, TH + 0.4), ((TW + 0.6) * S, (TW + 0.6) * S, 0.8 * S), bevel=0)

# ------------------------------------------------------------------ the rows of column stumps
for i in range(14):
    for j in range(8):
        x, y = -26.0 + 4.6 * i, -30.0 + 4.6 * j
        if math.hypot(x, y) * S > 1.33 or (abs(x - TX) < 11.0 and abs(y - TY) < 11.0):
            continue
        h = rng.choice((1.2, 2.0, 2.6, 3.4, 4.0)) if (i + j) % 5 else rng.uniform(5.0, 6.0)
        cylinder(f'stump{i}{j}', M['column'], 0.55 * S, h * S, P(x, y, 0.0), segs=14)
        cylinder(f'stumpBase{i}{j}', M['column'], 0.8 * S, 0.4 * S, P(x, y, 0.0), segs=14)

# ------------------------------------------------------------------ the Mausoleum of Mohammed V: white, the green pyramid roof
MX, MY = 22.0, 22.0
box('mausoleumPlinth', M['whiteM'], P(MX, MY, 1.0), (22.0 * S, 22.0 * S, 2.0 * S), bevel=0)
box('mausoleum', M['whiteM'], P(MX, MY, 2.0 + 6.0), (16.0 * S, 16.0 * S, 12.0 * S), bevel=0)
for nx, ny in ((0, -1), (-1, 0)):
    tx, ty = -ny, nx
    for u in (-4.6, 0.0, 4.6):
        c = P(MX + nx * 8.05 + tx * u, MY + ny * 8.05 + ty * u, 0)
        WIN.append((c.x, c.y, Z0 + 3.0 * S, 2.6 * S, 6.0 * S, (nx, ny), 'pointed'))
pyramid('mausoleumRoof', M['greenTile'], MX * S, MY * S, Z0 + 14.0 * S, 17.4 * S, 7.0 * S, rot=math.pi / 4)
lathe('mausoleumFinial', M['goldH'], [(0.4 * S, 0.0), (0.6 * S, 0.6 * S), (0.3 * S, 1.2 * S), (0.5 * S, 1.8 * S), (0.0, 2.8 * S)], P(MX, MY, 21.0), segs=12)
glazed('openings', WIN, M['ochre'], glass=M['recessH'], depth=0.4 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-4.0, -24.0, 'red'), (2.0, -27.0, 'blue'), (8.0, -12.0, 'yellow'), (-20.0, -6.0, 'green'), (14.0, 8.0, 'red'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.85)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('hassan-tower')
