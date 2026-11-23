# A cartoon Regensburg for the country maps, built in the set's shared look (../toon.py): the
# Stone Bridge striding across the Danube on its many arches and cutwaters, the bridge tower gate at
# its city end and the great Salzstadel's steep roof beside it, the old town's houses and medieval
# tower houses, and St Peter's Cathedral behind with its two openwork Gothic spires. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P regensburg.py -- regensburg-1024.png 1024 regensburg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bank': toon('bank', '#cfc6b4', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'grass': toon('grass2', '#7cb85a'),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'stone': toon('stone', '#b8a888', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'stoneDark': toon('stoneDark', '#8a7a64'),
    'cathedral': toon('cathedral', '#c8c0aa', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'spire': toon('spire', '#9aa49a'),
    'slate': toon('slate', '#4a4e56'),
    'roof': toon('roof', '#c4603e'),
    'ochre': toon('ochre', '#ecc888', lift=0.1),
    'cream': toon('cream', '#f0e6cc', lift=0.12),
    'window': flat('window', '#3a3a42'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['bank'])
before = set(bpy.data.objects)
rng = random.Random(2467)


def vstrip(x0, x1, r, z, n=8):
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, G + z) for x, y in pts]


loft('danube', M['river'], [vstrip(-0.82, -0.28, 1.33, -0.004), vstrip(-0.82, -0.28, 1.33, 0.006)], outline=0.004)
box('farbank', M['grass'], -1.0, -0.1, G - 0.003, 0.3, 0.9, 0.008, outline=0, bevel=0)

# ---------- the Stone Bridge ----------
BY, D, H = -0.25, 0.1, 0.1
box('bridge', M['stone'], -0.6, BY, G - 0.005, 0.8, D, H, outline=0.008, bevel=0)
for k in range(5):
    x = -0.9 + k * 0.13
    box(f'arch{k}', M['window'], x, BY - D / 2 - 0.003, G - 0.005, 0.08, 0.006, 0.04, outline=0, bevel=0)
    cyl(f'archtop{k}', M['window'], 0.04, 0.006, segs=14, outline=0, matrix=Matrix.Translation((x, BY - D / 2 - 0.003, G + 0.035)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k in range(4):
    pyramid(f'cutwater{k}', M['stoneDark'], -0.835 + k * 0.13, BY - D / 2 - 0.018, G - 0.005, 0.04, 0.05, outline=0.002)
for s in (-1, 1):
    box(f'parapet{s}', M['stone'], -0.6, BY + s * (D / 2 - 0.007), G + H - 0.005, 0.8, 0.014, 0.025, outline=0.001, bevel=0)
TX = -0.17
box('bridgetower', M['stone'], TX, BY, G - 0.005, 0.12, 0.13, 0.32, outline=0.007, bevel=0)
box('bridgegate', M['window'], TX, BY - 0.068, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
box('bridgeclock', M['cream'], TX, BY - 0.068, G + 0.22, 0.04, 0.006, 0.04, outline=0, bevel=0)
loft('bridgetowerroof', M['roof'], [[(TX - 0.065, BY - 0.07, G + 0.315), (TX + 0.065, BY - 0.07, G + 0.315), (TX + 0.065, BY + 0.07, G + 0.315), (TX - 0.065, BY + 0.07, G + 0.315)],
                                    [(TX - 0.004, BY - 0.07, G + 0.42), (TX + 0.004, BY - 0.07, G + 0.42), (TX + 0.004, BY + 0.07, G + 0.42), (TX - 0.004, BY + 0.07, G + 0.42)]], outline=0.004)
# the Salzstadel
box('salzstadel', M['cream'], -0.12, -0.55, G - 0.005, 0.24, 0.18, 0.12, outline=0.006, bevel=0)
loft('salzroof', M['roof'], [[(-0.24, -0.64, G + 0.115), (0.0, -0.64, G + 0.115), (0.0, -0.46, G + 0.115), (-0.24, -0.46, G + 0.115)],
                             [(-0.24, -0.554, G + 0.3), (0.0, -0.554, G + 0.3), (0.0, -0.546, G + 0.3), (-0.24, -0.546, G + 0.3)]], outline=0.005)
for j in range(4):
    box(f'salzwin{j}', M['window'], -0.21 + j * 0.06, -0.643, G + 0.05, 0.025, 0.006, 0.03, outline=0, bevel=0)

# ---------- the cathedral ----------
CX, CY = 0.32, 0.35
box('cathedral', M['cathedral'], CX, CY + 0.12, G - 0.005, 0.26, 0.5, 0.26, outline=0.008, bevel=0)
loft('cathedralroof', M['slate'], [[(CX - 0.13, CY - 0.1, G + 0.255), (CX + 0.13, CY - 0.1, G + 0.255), (CX + 0.13, CY + 0.37, G + 0.255), (CX - 0.13, CY + 0.37, G + 0.255)],
                                   [(CX - 0.004, CY - 0.1, G + 0.38), (CX + 0.004, CY - 0.1, G + 0.38), (CX + 0.004, CY + 0.37, G + 0.38), (CX - 0.004, CY + 0.37, G + 0.38)]], outline=0.005)
box('westfront', M['cathedral'], CX, CY - 0.12, G - 0.005, 0.3, 0.06, 0.32, outline=0.007, bevel=0)
box('westportal', M['window'], CX, CY - 0.153, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
for s in (-1, 1):
    tx = CX + s * 0.1
    box(f'tower{s}', M['cathedral'], tx, CY - 0.12, G - 0.005, 0.1, 0.1, 0.48, outline=0.006, bevel=0)
    box(f'towerwin{s}', M['window'], tx, CY - 0.172, G + 0.34, 0.035, 0.006, 0.1, outline=0, bevel=0)
    lathe(f'spire{s}', M['spire'], ((0.05, 0), (0.035, 0.1), (0.018, 0.2), (0.004, 0.28)), G + 0.475, tx, CY - 0.12, segs=8, outline=0.004, smooth=False)
    for k in range(3):
        lathe(f'spirering{s}{k}', M['stoneDark'], ((0.045 - k * 0.012, 0), (0.045 - k * 0.012, 0.008)), G + 0.5 + k * 0.07, tx, CY - 0.12, segs=8, outline=0, smooth=False)

# ---------- old town houses and tower houses ----------
for k in range(10):
    x = rng.uniform(-0.15, 0.85)
    y = rng.uniform(-0.75, 0.0)
    if math.hypot(x, y) > 1.0 or (abs(x - TX) < 0.15 and abs(y - BY) < 0.12) or (x < 0.05 and y < -0.42):
        continue
    h = rng.uniform(0.1, 0.16)
    box(f'house{k}', M[('ochre', 'cream')[k % 2]], x, y, G - 0.005, 0.16, 0.14, h, outline=0.005, bevel=0)
    box(f'housewin{k}', M['window'], x, y - 0.073, G + h * 0.5, 0.1, 0.006, 0.025, outline=0, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + h - 0.01, 0.17, 0.06, outline=0.003)
box('towerhouse', M['cream'], 0.65, 0.05, G - 0.005, 0.08, 0.08, 0.32, outline=0.005, bevel=0)
box('towerhousetop', M['stoneDark'], 0.65, 0.05, G + 0.315, 0.09, 0.09, 0.015, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-1.0, 0.25), (-0.98, -0.45))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.1, outline=0.007)

turn(before, -20)
render(G)
