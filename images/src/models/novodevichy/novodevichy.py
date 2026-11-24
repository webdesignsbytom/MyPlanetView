# A cartoon Novodevichy Convent for the country maps, built in the set's shared look (../toon.py):
# Moscow's convent behind its red and white crenellated walls with their tent-roofed towers, the
# white Smolensk Cathedral with its golden central dome and four green domes, the tall red and white
# baroque bell tower rising in octagonal tiers to its golden cupola, and the pond in front where
# swans glide. Turned a little towards the camera.
# Run: blender -b --factory-startup -P novodevichy.py -- novodevichy-1024.png 1024 novodevichy.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'pond': toon('pond', '#4a8ab0', lift=0.3),
    'red': toon('red', '#b8402e', shadow_mul=(0.86, 0.78, 0.76), lift=0.04),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'green': toon('green', '#3a7a5a', lift=0.1),
    'roof': toon('roof', '#4a6a5a'),
    'window': flat('window', '#3a3a48'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def oval(cx, cy, rx, ry, z, sides=28):
    return [(cx + rx * math.cos(2 * math.pi * j / sides), cy + ry * math.sin(2 * math.pi * j / sides), G + z) for j in range(sides)]


loft('pond', M['pond'], [oval(-0.15, -0.72, 0.55, 0.2, -0.004), oval(-0.15, -0.72, 0.55, 0.2, 0.006)], outline=0.004, smooth=True)
for k, (x, y) in enumerate(((-0.3, -0.7), (0.0, -0.75))):
    b = ball(f'swan{k}', M['white'], 0, 0, 0, 0.5, outline=0.001)
    b.scale = (0.04, 0.02, 0.016)
    b.location = (x, y, G + 0.01)
    rod(f'swanneck{k}', M['white'], (x + 0.015, y, G + 0.01), (x + 0.02, y, G + 0.04), 0.005, segs=6, outline=0)

# ---------- the walls ----------
WX, WY0, WY1 = 0.72, -0.42, 0.62
pts = [(-WX, WY0), (WX, WY0), (WX, WY1), (-WX, WY1)]
for k in range(4):
    (x0, y0), (x1, y1) = pts[k], pts[(k + 1) % 4]
    a = math.atan2(y1 - y0, x1 - x0)
    L = math.hypot(x1 - x0, y1 - y0)
    box(f'wall{k}', M['red'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, L, 0.04, 0.13, rot_z=a, outline=0.005, bevel=0)
    box(f'walltrim{k}', M['white'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.1, L, 0.044, 0.012, rot_z=a, outline=0, bevel=0)
    for j in range(int(L / 0.05)):
        t = (j + 0.5) / int(L / 0.05)
        box(f'merlon{k}{j}', M['red'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G + 0.125, 0.024, 0.04, 0.03, rot_z=a, outline=0.001, bevel=0)
    tx, ty = x0, y0
    box(f'tower{k}', M['red'], tx, ty, G - 0.005, 0.1, 0.1, 0.22, outline=0.005, bevel=0)
    box(f'towertrim{k}', M['white'], tx, ty, G + 0.15, 0.104, 0.104, 0.015, outline=0, bevel=0)
    pyramid(f'towertent{k}', M['roof'], tx, ty, G + 0.215, 0.11, 0.12, outline=0.003)
    lathe(f'towercrown{k}', M['gold'], ((0.012, 0), (0.016, 0.015), (0.004, 0.035)), G + 0.33, tx, ty, segs=8, outline=0.001)
box('gatechurch', M['white'], 0.0, WY0, G - 0.005, 0.14, 0.08, 0.2, outline=0.004, bevel=0)
box('gatearch', M['window'], 0.0, WY0 - 0.043, G - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)
lathe('gatedome', M['gold'], ((0.03, 0), (0.035, 0.02), (0.015, 0.05), (0.004, 0.07)), G + 0.195, 0.0, WY0, segs=12, outline=0.002)

# ---------- the Smolensk Cathedral ----------
CX, CY = -0.18, 0.18
box('cathedral', M['white'], CX, CY, G - 0.005, 0.32, 0.28, 0.24, outline=0.007, bevel=0)
for x in (-0.11, 0.0, 0.11):
    cyl(f'zakomara{x}', M['white'], 0.05, 0.28, segs=16, outline=0.003, matrix=Matrix.Translation((CX + x, CY, G + 0.235)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'cathwin{x}', M['window'], CX + x, CY - 0.142, G + 0.1, 0.025, 0.006, 0.07, outline=0, bevel=0)


def onion(name, mat, x, y, z, r):
    lathe(name, mat, ((r, 0), (r * 1.25, r * 0.55), (r * 1.15, r * 1.0), (r * 0.6, r * 1.5), (0.004, r * 2.1)), z, x, y, segs=16, outline=0.003)
    rod(f'{name}cross', M['gold'], (x, y, z + r * 2.05), (x, y, z + r * 2.05 + r * 0.9), max(0.004, r * 0.06), segs=6, outline=0)


lathe('centraldrum', M['white'], ((0.06, 0), (0.06, 0.1)), G + 0.25, CX, CY, segs=14, outline=0.004)
onion('centraldome', M['gold'], CX, CY, G + 0.35, 0.06)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'drum{sx}{sy}', M['white'], ((0.035, 0), (0.035, 0.07)), G + 0.25, CX + sx * 0.1, CY + sy * 0.09, segs=12, outline=0.003)
        onion(f'dome{sx}{sy}', M['green'], CX + sx * 0.1, CY + sy * 0.09, G + 0.32, 0.035)

# ---------- the bell tower ----------
BX, BY = 0.3, 0.25
z = G - 0.005
for i, (r, h) in enumerate(((0.1, 0.16), (0.085, 0.12), (0.07, 0.1), (0.058, 0.09), (0.048, 0.08), (0.038, 0.07))):
    lathe(f'tier{i}', M['red'], ((r, 0), (r, h)), z, BX, BY, segs=8, outline=0.005, smooth=False)
    lathe(f'tiertrim{i}', M['white'], ((r + 0.006, 0), (r + 0.006, 0.014)), z + h - 0.012, BX, BY, segs=8, outline=0.001, smooth=False)
    for k in range(4):
        a = -math.pi / 2 + k * math.pi / 2 + math.pi / 8
        if math.sin(a) > 0.3:
            continue
        box(f'tierwin{i}{k}', M['window'], BX + r * 0.93 * math.cos(a), BY + r * 0.93 * math.sin(a), z + h * 0.25, r * 0.4, 0.006, h * 0.5, rot_z=a + math.pi / 2, outline=0, bevel=0)
    z += h
onion('bellcupola', M['gold'], BX, BY, z - 0.005, 0.035)
for k, (x, y, r) in enumerate(((-0.55, 0.0, 0.08), (0.55, -0.15, 0.08), (0.45, 0.48, 0.07), (-0.5, 0.45, 0.07))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
