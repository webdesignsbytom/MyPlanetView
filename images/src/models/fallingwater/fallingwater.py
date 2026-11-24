# A cartoon Fallingwater for the country maps, built in the set's shared look (../toon.py): Frank
# Lloyd Wright's house in the Pennsylvania woods, its cream concrete terraces cantilevered one over
# another above Bear Run's waterfall, the bands of glass with their Cherokee-red frames, the tall
# sandstone chimney rising through them, the stream on its rock ledge and the pool below, and the
# trees all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P fallingwater.py -- fallingwater-1024.png 1024 fallingwater.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forest': toon('forest', '#5a8a40', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#9a8a70', shadow_mul=(0.84, 0.84, 0.88)),
    'rockDark': toon('rockDark', '#7a6a56'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'foam': toon('foam', '#f4f8fa', lift=0.3),
    'cream': toon('cream', '#f0e4c0', shadow_mul=(0.86, 0.84, 0.8), lift=0.15),
    'stone': toon('stone', '#b89a70', shadow_mul=(0.86, 0.82, 0.78)),
    'stoneDark': toon('stoneDark', '#9a7a54'),
    'glass': flat('glass', '#3a4a5a'),
    'red': toon('red', '#a83a2a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'treeDark': toon('treeDark', '#2f6a34', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['forest'])
before = set(bpy.data.objects)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


def oval(cx, cy, rx, ry, z, sides=26):
    return [(cx + rx * math.cos(2 * math.pi * j / sides), cy + ry * math.sin(2 * math.pi * j / sides), G + z) for j in range(sides)]


loft('pool', M['water'], [oval(-0.05, -0.68, 0.72, 0.3, -0.004), oval(-0.05, -0.68, 0.72, 0.3, 0.006)], outline=0.004, smooth=True)
ld = loft('ledge', M['rock'], [rrect(0.0, 0.15, 0.88, 0.5, -0.01, 0.16), rrect(0.0, 0.17, 0.85, 0.47, 0.17, 0.14)], outline=0.01)
ld.visible_shadow = False
T = G + 0.17

# ---------- the stream and the falls ----------
box('stream', M['water'], -0.12, 0.15, T - 0.004, 0.3, 0.92, 0.012, outline=0.002, bevel=0)
box('falls', M['water'], -0.12, -0.36, G - 0.005, 0.3, 0.02, 0.18, outline=0.003, bevel=0)
for j in range(4):
    box(f'fallstreak{j}', M['foam'], -0.24 + j * 0.08, -0.372, G + 0.02, 0.012, 0.004, 0.14, outline=0, bevel=0)
lathe('foam', M['foam'], ((0.18, 0), (0.15, 0.025), (0.004, 0.035)), G - 0.005, -0.12, -0.44, segs=18, outline=0.003)
for k, (x, y, r) in enumerate(((-0.45, -0.4, 0.06), (0.25, -0.42, 0.05), (0.45, -0.36, 0.07), (-0.6, -0.3, 0.05))):
    ball(f'boulder{k}', M['rockDark'], x, y, G + r * 0.4, r, outline=0.004)

# ---------- the house ----------
box('chimney', M['stone'], 0.18, 0.38, T - 0.005, 0.12, 0.12, 0.58, outline=0.007, bevel=0)
for k in range(8):
    box(f'chimneycourse{k}', M['stoneDark'], 0.18, 0.318, T + 0.04 + k * 0.065, 0.12, 0.004, 0.012, outline=0, bevel=0)
box('stonewall', M['stone'], -0.42, 0.38, T - 0.005, 0.1, 0.22, 0.32, outline=0.006, bevel=0)


def glassband(name, x, y, z, w, d, h):
    box(name, M['glass'], x, y, z, w, d, h, outline=0.004, bevel=0)
    n = max(2, int(w / 0.075))
    for j in range(n + 1):
        box(f'{name}mullion{j}', M['red'], x - w / 2 + j * w / n, y - d / 2 - 0.003, z, 0.01, 0.006, h, outline=0, bevel=0)


glassband('glass1', -0.05, 0.25, T - 0.005, 0.66, 0.26, 0.13)
box('terrace1', M['cream'], -0.08, 0.02, T + 0.12, 0.9, 0.5, 0.07, outline=0.008, bevel=0.012)
glassband('glass2', 0.04, 0.24, T + 0.185, 0.5, 0.24, 0.1)
box('terrace2', M['cream'], 0.12, 0.05, T + 0.28, 0.48, 0.62, 0.06, outline=0.008, bevel=0.012)
glassband('glass3', -0.06, 0.3, T + 0.335, 0.32, 0.18, 0.08)
box('terrace3', M['cream'], -0.06, 0.28, T + 0.41, 0.42, 0.28, 0.05, outline=0.007, bevel=0.01)

# ---------- the woods ----------
for k, (x, y, r) in enumerate(((-1.0, 0.3, 0.15), (-0.7, 0.85, 0.17), (0.0, 0.95, 0.16), (0.65, 0.85, 0.17), (1.0, 0.25, 0.15),
                              (-1.0, -0.22, 0.13), (0.98, -0.25, 0.13), (-0.72, -0.66, 0.12), (0.72, -0.7, 0.12))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + r * 2.3), 0.022, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree' if k % 2 else 'treeDark'], x, y, G + r * 2.5, r, outline=0.009)

turn(before, -20)
render(G)
