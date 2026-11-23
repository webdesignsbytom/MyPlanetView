# A cartoon Sighișoara for the country maps, built in the set's shared look (../toon.py): the clock
# tower of the walled Saxon citadel, its tall body and its steep pyramid roof of coloured glazed
# tiles with four little corner turrets, the clock face, the citadel's pastel houses round it on the
# hill, its wall and towers, and the Church on the Hill. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sighisoara.py -- sighisoara-1024.png 1024 sighisoara.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'tiles': toon('tiles', '#3f8a6a'),
    'tilesYellow': toon('tilesYellow', '#e8b030', lift=0.25),
    'roof': toon('roof', '#c4573a'),
    'clock': toon('clock', '#f8f6f0', lift=0.2),
    'window': flat('window', '#3a3640'),
    'h0': toon('h0', '#f0c050'), 'h1': toon('h1', '#e8806a'), 'h2': toon('h2', '#8ad0c8'), 'h3': toon('h3', '#c8a0e0'), 'h4': toon('h4', '#a8d890'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1997)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


hill = loft('hill', M['hill'], [ring(0.0, 0.2, 1.0, 0.75, -0.01, 1), ring(0.0, 0.22, 0.75, 0.55, 0.12, 1)], outline=0.014, smooth=True)
hill.visible_shadow = False
T = G + 0.12

# ---------- the citadel's houses ----------
for k in range(16):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.3, 0.65)
    x, y = r * math.cos(a), 0.22 + r * 0.72 * math.sin(a)
    if abs(x) < 0.18 and abs(y - 0.0) < 0.2:
        continue
    h = rng.uniform(0.08, 0.12)
    box(f'house{k}', M[f'h{k % 5}'], x, y, T - 0.005, 0.14, 0.12, h, rot_z=a, outline=0.007, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, T + h - 0.005, 0.16, 0.08, outline=0.006)
# the wall round the citadel's edge
for k in range(14):
    a = math.radians(190 + k * 12)
    x, y = 0.74 * math.cos(a), 0.22 + 0.54 * math.sin(a)
    box(f'citadelwall{k}', M['stone'], x, y, T - 0.02, 0.12, 0.04, 0.08, rot_z=a + math.pi / 2, outline=0.004, bevel=0)
for k, a in enumerate((205, 270, 335)):
    a = math.radians(a)
    box(f'walltower{k}', M['stone'], 0.74 * math.cos(a), 0.22 + 0.54 * math.sin(a), T - 0.02, 0.09, 0.09, 0.16, outline=0.007, bevel=0)
    pyramid(f'walltowerroof{k}', M['roof'], 0.74 * math.cos(a), 0.22 + 0.54 * math.sin(a), T + 0.14, 0.11, 0.09, outline=0.005)

# ---------- the clock tower ----------
TX, TY = 0.0, 0.0
box('clocktower', M['stone'], TX, TY, T - 0.005, 0.16, 0.16, 0.42, outline=0.012, bevel=0)
box('gallery', M['stone'], TX, TY, T + 0.41, 0.19, 0.19, 0.03, outline=0.005, bevel=0)
cyl('clockface', M['clock'], 0.04, 0.008, segs=16, outline=0.004, matrix=Matrix.Translation((TX, TY - 0.084, T + 0.33)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('gate', M['window'], TX, TY - 0.084, T - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
z = T + 0.44
loft('towerroof', M['tiles'], [[(TX - 0.1, TY - 0.1, z), (TX + 0.1, TY - 0.1, z), (TX + 0.1, TY + 0.1, z), (TX - 0.1, TY + 0.1, z)],
                               [(TX - 0.05, TY - 0.05, z + 0.12), (TX + 0.05, TY - 0.05, z + 0.12), (TX + 0.05, TY + 0.05, z + 0.12), (TX - 0.05, TY + 0.05, z + 0.12)],
                               [(TX - 0.004, TY - 0.004, z + 0.26), (TX + 0.004, TY - 0.004, z + 0.26), (TX + 0.004, TY + 0.004, z + 0.26), (TX - 0.004, TY + 0.004, z + 0.26)]],
     outline=0.01)
for j in range(3):
    box(f'tileband{j}', M['tilesYellow'], TX, TY - 0.1 + j * 0.025 + 0.012, z + 0.02 + j * 0.04, 0.18 - j * 0.04, 0.006, 0.015, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'cornerturret{sx}{sy}', M['tiles'], ((0.022, 0), (0.004, 0.12)), z, TX + sx * 0.09, TY + sy * 0.09, segs=6, outline=0.003, smooth=False)

# ---------- the Church on the Hill ----------
CX, CY = -0.35, 0.55
box('hillchurch', M['stone'], CX, CY, T - 0.005, 0.32, 0.14, 0.14, outline=0.01, bevel=0)
loft('hillchurchroof', M['roof'], [[(CX - 0.16, CY - 0.07, T + 0.135), (CX + 0.16, CY - 0.07, T + 0.135), (CX + 0.16, CY + 0.07, T + 0.135), (CX - 0.16, CY + 0.07, T + 0.135)],
                                   [(CX - 0.16, CY - 0.004, T + 0.2), (CX + 0.16, CY - 0.004, T + 0.2), (CX + 0.16, CY + 0.004, T + 0.2), (CX - 0.16, CY + 0.004, T + 0.2)]],
     outline=0.008)
box('hillchurchtower', M['stone'], CX + 0.18, CY, T - 0.005, 0.08, 0.08, 0.26, outline=0.008, bevel=0)
pyramid('hillchurchspire', M['roof'], CX + 0.18, CY, T + 0.255, 0.09, 0.14, outline=0.006)

turn(before, -20)
render(G)
