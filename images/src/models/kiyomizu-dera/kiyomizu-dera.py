# A cartoon Kiyomizu-dera for the country maps, built in the set's shared look (../toon.py): the
# great wooden stage jutting out from the main hall over the wooded hillside on its forest of tall
# pillars and cross beams, the hall's huge sweeping cypress-bark roof, the vermilion three-storey
# pagoda and gate on the slope beside it, and the maples in autumn red. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P kiyomizu-dera.py -- kiyomizu-dera-1024.png 1024 kiyomizu-dera.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'wood': toon('wood', '#9a6a44', shadow_mul=(0.86, 0.8, 0.78), lift=0.06),
    'woodDark': toon('woodDark', '#6a4a30'),
    'deck': toon('deck', '#c49a6a', lift=0.1),
    'roof': toon('roof', '#5a4234', shadow_mul=(0.86, 0.84, 0.86)),
    'vermilion': toon('vermilion', '#e0503a', lift=0.12),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'tile': toon('tile', '#4a4a52'),
    'maple': toon('maple', '#e0502e', shadow_mul=(0.86, 0.76, 0.74), lift=0.1),
    'mapleGold': toon('mapleGold', '#f0a030', lift=0.1),
    'pine': toon('pine', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(778)

# ---------- the hillside: high at the back, falling to the front ----------
HZ = 0.42


def ground(y):
    return G + HZ * min(1.0, max(0.0, (y + 0.15) / 0.55))


# the hill as slices from the front edge (y = -0.15) up to the back of the tile
for j in range(6):
    y0, y1 = -0.15 + j * 0.25, -0.15 + (j + 1) * 0.25
    y1 = min(y1, 1.25)
    if y0 >= 1.25:
        break
    x0, x1 = math.sqrt(1.3 ** 2 - min(y0 * y0, 1.69)), math.sqrt(max(0.0, 1.3 ** 2 - y1 * y1))
    quad = [(-x0, y0), (x0, y0), (x1, y1), (-x1, y1)]
    z0, z1 = ground(y0), ground(y1)
    sl = loft(f'hill{j}', M['hill'], [[(x, y, G - 0.01) for x, y in quad], [(quad[0][0], y0, z0), (quad[1][0], y0, z0), (quad[2][0], y1, z1), (quad[3][0], y1, z1)]], outline=0.006)
    sl.visible_shadow = False

# ---------- the main hall on the hilltop ----------
HX, HY = -0.1, 0.55
T = ground(HY)
box('hall', M['wood'], HX, HY, T - 0.005, 0.56, 0.4, 0.16, outline=0.008, bevel=0)
for j in range(7):
    box(f'hallpanel{j}', M['white'], HX - 0.24 + j * 0.08, HY - 0.203, T + 0.04, 0.05, 0.006, 0.07, outline=0, bevel=0)
# the great sweeping roof: a hip roof with eaves curling up at the corners
x0, y0 = 0.36, 0.28
loft('hallroof', M['roof'], [[(HX - x0, HY - y0, T + 0.15), (HX + x0, HY - y0, T + 0.15), (HX + x0, HY + y0, T + 0.15), (HX - x0, HY + y0, T + 0.15)],
                             [(HX - x0 + 0.06, HY - y0 + 0.06, T + 0.2), (HX + x0 - 0.06, HY - y0 + 0.06, T + 0.2), (HX + x0 - 0.06, HY + y0 - 0.06, T + 0.2), (HX - x0 + 0.06, HY + y0 - 0.06, T + 0.2)],
                             [(HX - 0.18, HY - 0.02, T + 0.32), (HX + 0.18, HY - 0.02, T + 0.32), (HX + 0.18, HY + 0.02, T + 0.32), (HX - 0.18, HY + 0.02, T + 0.32)]], outline=0.007)
for sx in (-1, 1):
    for sy in (-1, 1):
        bar(f'eavecurl{sx}{sy}', M['roof'], (HX + sx * (x0 - 0.04), HY + sy * (y0 - 0.04), T + 0.155), (HX + sx * (x0 + 0.02), HY + sy * (y0 + 0.02), T + 0.18), 0.03, outline=0.002)

# ---------- the stage out over the slope on its pillars ----------
SX, SY0, SY1 = HX, HY - 0.2, HY - 0.6
SW = 0.5
box('stage', M['deck'], SX, (SY0 + SY1) / 2, T - 0.02, SW, SY0 - SY1, 0.03, outline=0.006, bevel=0)
for s in (-1, 1):
    bar(f'stagerail{s}', M['woodDark'], (SX + s * SW / 2, SY1, T + 0.04), (SX + s * SW / 2, SY0, T + 0.04), 0.012, outline=0.001)
bar('stagerailfront', M['woodDark'], (SX - SW / 2, SY1, T + 0.04), (SX + SW / 2, SY1, T + 0.04), 0.012, outline=0.001)
for i in range(5):
    y = SY1 + 0.02 + i * (SY0 - SY1 - 0.04) / 4
    gz = ground(y)
    for j in range(5):
        x = SX - SW / 2 + 0.02 + j * (SW - 0.04) / 4
        rod(f'pillar{i}{j}', M['wood'], (x, y, gz - 0.01), (x, y, T - 0.02), 0.012, segs=6, outline=0.002)
    for z in (gz + 0.06, gz + 0.16, gz + 0.26):
        if z < T - 0.04:
            bar(f'beam{i}{z:.2f}', M['woodDark'], (SX - SW / 2, y, z), (SX + SW / 2, y, z), 0.012, outline=0.001)

# ---------- the pagoda and the gate ----------
PX, PY = 0.55, 0.35
PZ = ground(PY)
for k in range(3):
    w = 0.16 - k * 0.025
    z = PZ + k * 0.12
    box(f'pagodastorey{k}', M['vermilion'], PX, PY, z - 0.005, w, w, 0.08, outline=0.004, bevel=0)
    loft(f'pagodaroof{k}', M['tile'], [[(PX - w / 2 - 0.05, PY - w / 2 - 0.05, z + 0.075), (PX + w / 2 + 0.05, PY - w / 2 - 0.05, z + 0.075), (PX + w / 2 + 0.05, PY + w / 2 + 0.05, z + 0.075), (PX - w / 2 - 0.05, PY + w / 2 + 0.05, z + 0.075)],
                                        [(PX - w / 2 + 0.01, PY - w / 2 + 0.01, z + 0.12), (PX + w / 2 - 0.01, PY - w / 2 + 0.01, z + 0.12), (PX + w / 2 - 0.01, PY + w / 2 - 0.01, z + 0.12), (PX - w / 2 + 0.01, PY + w / 2 - 0.01, z + 0.12)]], outline=0.003)
rod('pagodaspire', M['vermilion'], (PX, PY, PZ + 0.355), (PX, PY, PZ + 0.48), 0.008, segs=6, outline=0.001)
for k in range(5):
    lathe(f'spirering{k}', M['tile'], ((0.016, 0), (0.016, 0.008)), PZ + 0.37 + k * 0.02, PX, PY, segs=8, outline=0)
GX, GYY = 0.45, -0.25
GZ = ground(GYY)
box('gate', M['vermilion'], GX, GYY, GZ - 0.005, 0.2, 0.1, 0.12, outline=0.005, bevel=0)
box('gatepassage', M['woodDark'], GX, GYY - 0.051, GZ - 0.005, 0.07, 0.006, 0.09, outline=0, bevel=0)
loft('gateroof', M['tile'], [[(GX - 0.14, GYY - 0.09, GZ + 0.115), (GX + 0.14, GYY - 0.09, GZ + 0.115), (GX + 0.14, GYY + 0.09, GZ + 0.115), (GX - 0.14, GYY + 0.09, GZ + 0.115)],
                             [(GX - 0.08, GYY - 0.01, GZ + 0.18), (GX + 0.08, GYY - 0.01, GZ + 0.18), (GX + 0.08, GYY + 0.01, GZ + 0.18), (GX - 0.08, GYY + 0.01, GZ + 0.18)]], outline=0.004)

# ---------- autumn maples and pines on the slope ----------
for k in range(16):
    x = rng.uniform(-1.0, 1.0)
    y = rng.uniform(-0.9, 0.9)
    if math.hypot(x, y) > 1.12 or (abs(x - SX) < 0.32 and -0.15 < y < 0.8) or math.hypot(x - PX, y - PY) < 0.15 or math.hypot(x - GX, y - GYY) < 0.18:
        continue
    gz = ground(y)
    mat = M[rng.choice(('maple', 'maple', 'mapleGold', 'pine'))]
    rod(f'treetrunk{k}', M['trunk'], (x, y, gz), (x, y, gz + 0.06), 0.012, segs=6, outline=0.002)
    ball(f'tree{k}', mat, x, y, gz + 0.12, rng.uniform(0.07, 0.1), outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
