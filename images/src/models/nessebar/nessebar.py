# A cartoon Nessebar for the country maps, built in the set's shared look (../toon.py): the old town
# on its rocky peninsula in the Black Sea, its Byzantine churches banded in red brick and white
# stone with their drums and tiled domes, the timber-upstairs houses under red roofs, and the old
# wooden windmill on the causeway. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nessebar.py -- nessebar-1024.png 1024 nessebar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'rock': toon('rock', '#b0a28a', shadow_mul=(0.82, 0.8, 0.86)),
    'paving': toon('paving', '#d8ccb0', lift=0.2),
    'brick': toon('brick', '#b8603e', shadow_mul=(0.86, 0.76, 0.72)),
    'stone': toon('stone', '#e8dcc0', shadow_mul=(0.82, 0.8, 0.86), lift=0.15),
    'tile': toon('tile', '#c4573a'),
    'roundel': toon('roundel', '#3f9a7a'),
    'timber': toon('timber', '#8a5a3a'),
    'window': flat('window', '#3a3640'),
    'mill': toon('mill', '#9a6a46'),
    'sail': toon('sail', '#e8dcc0', lift=0.2),
    'tree': toon('tree', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1297)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the peninsula: a rocky rim, the town's paving on top ----------
PX, PY = -0.12, 0.2
rim = loft('rim', M['rock'], [ring(PX, PY, 0.98, 0.72, -0.01, 1), ring(PX, PY, 0.94, 0.69, 0.1, 1)], outline=0.016)
rim.visible_shadow = False
top = loft('town', M['paving'], [ring(PX, PY, 0.94, 0.69, 0.095, 1), ring(PX, PY, 0.92, 0.67, 0.11, 1)], outline=0.006)
top.visible_shadow = False
T = G + 0.11
for k in range(14):
    a = math.radians(160 + k * 16)
    ball(f'surf{k}', M['surf'], PX + 0.99 * math.cos(a), PY + 0.73 * math.sin(a), G + 0.005, rng.uniform(0.025, 0.035), outline=0.004)


# ---------- the churches: banded brick and stone ----------
def banded(name, x, y, w, d, h, bands):
    for i in range(bands):
        z0 = T - 0.005 + i * h / bands
        box(f'{name}band{i}', M['brick' if i % 2 == 0 else 'stone'], x, y, z0, w, d, h / bands + 0.002, outline=0.01 if i == 0 else 0.004, bevel=0)


def church(name, x, y, w, d, h, dome_r, drum_h):
    banded(name, x, y, w, d, h, 6)
    loft(f'{name}roof', M['tile'], [[(x - w / 2 - 0.01, y - d / 2 - 0.01, T + h - 0.006), (x + w / 2 + 0.01, y - d / 2 - 0.01, T + h - 0.006),
                                     (x + w / 2 + 0.01, y + d / 2 + 0.01, T + h - 0.006), (x - w / 2 - 0.01, y + d / 2 + 0.01, T + h - 0.006)],
                                    [(x - w / 2 - 0.01, y - 0.004, T + h + 0.06), (x + w / 2 + 0.01, y - 0.004, T + h + 0.06), (x + w / 2 + 0.01, y + 0.004, T + h + 0.06),
                                     (x - w / 2 - 0.01, y + 0.004, T + h + 0.06)]], outline=0.008)
    for i in range(3):
        lathe(f'{name}drum{i}', M['brick' if i % 2 == 0 else 'stone'], ((dome_r, 0), (dome_r, drum_h / 3 + 0.002)), T + h + 0.03 + i * drum_h / 3, x, y, segs=8,
              outline=0.006 if i == 0 else 0.003)
    lathe(f'{name}dome', M['tile'], ((dome_r * 1.1, 0), (dome_r * 0.9, dome_r * 0.5), (dome_r * 0.4, dome_r * 0.9), (0.004, dome_r * 1.05)), T + h + 0.03 + drum_h, x, y,
          segs=16, outline=0.008)
    for j in range(4):
        u = -w / 2 + (j + 0.5) * w / 4
        box(f'{name}arch{j}', M['window'], x + u, y - d / 2 - 0.004, T + h * 0.35, 0.025, 0.008, h * 0.4, outline=0, bevel=0)
        ball(f'{name}roundel{j}', M['roundel'], x + u, y - d / 2 - 0.006, T + h * 0.85, 0.011, outline=0)


church('pantocrator', -0.2, 0.25, 0.38, 0.24, 0.2, 0.075, 0.1)
church('stjohn', 0.42, 0.42, 0.26, 0.18, 0.16, 0.055, 0.07)


# ---------- the old houses: stone below, timber upstairs, red roofs ----------
def house(name, x, y, w, d):
    box(name, M['stone'], x, y, T - 0.005, w, d, 0.06, outline=0.007, bevel=0)
    box(f'{name}upper', M['timber'], x, y - 0.01, T + 0.055, w + 0.02, d + 0.02, 0.06, outline=0.007, bevel=0)
    pyramid(f'{name}roof', M['tile'], x, y - 0.01, T + 0.115, max(w, d) + 0.05, 0.06, outline=0.006)
    box(f'{name}win', M['window'], x, y - d / 2 - 0.022, T + 0.075, 0.03, 0.006, 0.025, outline=0, bevel=0)


for k, (x, y) in enumerate(((-0.75, 0.0), (-0.55, -0.22), (0.12, -0.15), (0.38, 0.05), (-0.8, 0.45), (0.6, 0.15), (-0.25, -0.28))):
    house(f'house{k}', x, y, 0.13, 0.11)
for k, (x, y) in enumerate(((-0.45, 0.6), (0.15, 0.7), (0.65, 0.6))):
    ball(f'tree{k}', M['tree'], x, y, T + 0.07, 0.07, outline=0.01)

# ---------- the causeway and the old windmill ----------
box('causeway', M['rock'], 0.72, -0.6, G - 0.01, 0.16, 0.7, 0.1, rot_z=-0.6, outline=0.01, bevel=0)
WX, WY = 0.82, -0.75
box('millbase', M['rock'], WX, WY, G + 0.09, 0.12, 0.12, 0.04, outline=0.006, bevel=0)
box('millbody', M['mill'], WX, WY, G + 0.13, 0.1, 0.1, 0.14, outline=0.008, bevel=0)
loft('millroof', M['mill'], [[(WX - 0.06, WY - 0.06, G + 0.27), (WX + 0.06, WY - 0.06, G + 0.27), (WX + 0.06, WY + 0.06, G + 0.27), (WX - 0.06, WY + 0.06, G + 0.27)],
                             [(WX - 0.06, WY - 0.003, G + 0.32), (WX + 0.06, WY - 0.003, G + 0.32), (WX + 0.06, WY + 0.003, G + 0.32), (WX - 0.06, WY + 0.003, G + 0.32)]],
     outline=0.006)
HUB = (WX, WY - 0.07, G + 0.24)
for j in range(4):
    a = math.pi / 4 + j * math.pi / 2
    tip = (WX + 0.17 * math.cos(a), WY - 0.075, G + 0.24 + 0.17 * math.sin(a))
    bar(f'millarm{j}', M['timber'], HUB, tip, 0.012, outline=0.002)
    mid = tuple(HUB[i] + (tip[i] - HUB[i]) * 0.6 for i in range(3))
    bar(f'millsail{j}', M['sail'], mid, tip, 0.04, outline=0.003)

turn(before, -20)
render(G)
