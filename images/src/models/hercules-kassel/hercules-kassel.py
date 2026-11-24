# A cartoon Bergpark Wilhelmshöhe for the country maps, built in the set's shared look
# (../toon.py): Kassel's Hercules monument on the hilltop, the massive octagon of rough stone with
# its three storeys of arches, the steep pyramid on top crowned by the copper statue of Hercules
# leaning on his club, and the baroque cascades stepping down the wooded hillside to the Neptune
# basin below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hercules-kassel.py -- hercules-kassel-1024.png 1024 hercules-kassel.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#5a9a44', shadow_mul=(0.72, 0.8, 0.74)),
    'tuff': toon('tuff', '#8a8078', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'tuffDark': toon('tuffDark', '#6a625a'),
    'copper': toon('copper', '#5aa88a', lift=0.12),
    'water': toon('water', '#6ab0d0', lift=0.3),
    'stone': toon('stone', '#b8b0a4'),
    'dark': flat('dark', '#2a2622'),
    'tree': toon('tree', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2459)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


hl = loft('hill', M['hill'], [rrect(0.0, 0.3, 0.85, 0.65, -0.01, 0.3), rrect(0.0, 0.6, 0.32, 0.22, 0.34, 0.12)], outline=0.01, smooth=True)
hl.visible_shadow = False
T = G + 0.335

# ---------- the octagon, pyramid and Hercules ----------
OX, OY = 0.0, 0.62
lathe('octagon', M['tuff'], ((0.24, 0), (0.24, 0.24)), T - 0.005, OX, OY, segs=8, outline=0.008, smooth=False)
for r in range(3):
    for k in range(8):
        a = 2 * math.pi * (k + 0.5) / 8
        if math.sin(a) > 0.3:
            continue
        z = T + 0.02 + r * 0.075
        box(f'octarch{r}{k}', M['dark'], OX + 0.222 * math.cos(a), OY + 0.222 * math.sin(a), z, 0.06, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)
        cyl(f'octarchtop{r}{k}', M['dark'], 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((OX + 0.222 * math.cos(a), OY + 0.222 * math.sin(a), z + 0.04)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('octagontop', M['tuffDark'], ((0.25, 0), (0.25, 0.02)), T + 0.23, OX, OY, segs=8, outline=0.003, smooth=False)
pyramid('pyramid', M['tuff'], OX, OY, T + 0.245, 0.18, 0.24, outline=0.005)
Z = T + 0.48
box('statuebase', M['tuffDark'], OX, OY, Z - 0.005, 0.04, 0.04, 0.02, outline=0.001, bevel=0)
for s in (-1, 1):
    rod(f'herculesleg{s}', M['copper'], (OX + s * 0.012, OY, Z + 0.012), (OX + s * 0.012, OY, Z + 0.07), 0.01, segs=6, outline=0.001)
lathe('herculesbody', M['copper'], ((0.022, 0), (0.026, 0.05), (0.02, 0.07)), Z + 0.065, OX, OY, segs=10, outline=0.002)
ball('herculeshead', M['copper'], OX, OY, Z + 0.15, 0.014, outline=0.001)
bar('club', M['copper'], (OX + 0.035, OY, Z + 0.015), (OX + 0.028, OY, Z + 0.1), 0.012, outline=0.001)
rod('herculesarm', M['copper'], (OX + 0.02, OY, Z + 0.125), (OX + 0.032, OY, Z + 0.1), 0.007, segs=6, outline=0)

# ---------- the cascades ----------
n = 14
y0, y1 = OY - 0.26, -0.3
for i in range(n):
    t = i / n
    y = y0 + (y1 - y0) * (i + 0.5) / n
    zt = 0.335 - 0.335 * (i + 1) / n
    box(f'cascadestep{i}', M['stone'], 0.0, y, G - 0.005, 0.16, (y0 - y1) / n + 0.005, zt + 0.02, outline=0.002, bevel=0)
    box(f'cascadewater{i}', M['water'], 0.0, y, G + zt + 0.012, 0.1, (y0 - y1) / n - 0.01, 0.008, outline=0, bevel=0)
    if i % 4 == 3:
        box(f'cascadebasin{i}', M['stone'], 0.0, y, G + zt + 0.005, 0.22, 0.04, 0.025, outline=0.002, bevel=0)
lathe('neptunebasin', M['stone'], ((0.15, 0), (0.15, 0.04)), G - 0.005, 0.0, -0.42, segs=20, outline=0.004)
lathe('neptunewater', M['water'], ((0.14, 0), (0.14, 0.043)), G - 0.005, 0.0, -0.42, segs=20, outline=0)
lathe('neptunegrotto', M['tuff'], ((0.05, 0), (0.04, 0.06), (0.004, 0.09)), G + 0.03, 0.0, -0.42, segs=8, outline=0.003, smooth=False)

# ---------- the woods ----------
for k in range(30):
    x = rng.uniform(-0.85, 0.85)
    y = rng.uniform(-0.3, 0.85)
    if abs(x) < 0.17 or math.hypot(x, y) > 1.05 or math.hypot(x - OX, y - OY) < 0.3:
        continue
    f = max(0.0, min(1.0, (y + 0.35) / 0.95))
    z = G + 0.335 * f * max(0.0, 1 - max(0.0, abs(x) - 0.3) / 0.55)
    r = rng.uniform(0.05, 0.08)
    ball(f'tree{k}', M['tree'], x, y, z + r * 0.6, r, outline=0.006)

turn(before, -20)
render(G)
