# A cartoon Saint-Émilion for the country maps, built in the set's shared look (../toon.py): the
# wine village on its hill of honey-coloured limestone, the monolithic church's tall Gothic bell
# tower and spire rising from the rock it is carved into, the church's carved doorways in the cliff
# below, the stone houses with their red tiled roofs on the slopes, and the vineyards' rows all
# round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P saint-emilion.py -- saint-emilion-1024.png 1024 saint-emilion.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'soil': toon('soil', '#b89a6a'),
    'vine': toon('vine', '#4f8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'limestone': toon('limestone', '#e0cc9a', shadow_mul=(0.86, 0.84, 0.78), lift=0.08),
    'stone': toon('stone', '#d8c08a', shadow_mul=(0.86, 0.84, 0.78), lift=0.06),
    'roof': toon('roof', '#c06a46'),
    'dark': flat('dark', '#3a3028'),
    'paving': toon('paving', '#d8ccb0'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2489)

# ---------- the vineyards ----------
for s in (-1, 1):
    box(f'vinesoil{s}', M['soil'], s * 0.78, -0.35, G - 0.003, 0.36, 0.55, 0.01, outline=0.002, bevel=0)
    for j in range(6):
        x = s * (0.64 + j * 0.055)
        bar(f'vinerow{s}{j}', M['vine'], (x, -0.6, G + 0.025), (x, -0.1, G + 0.025), 0.03, outline=0.002)

# ---------- the hill and the village ----------
HX, HY = 0.0, 0.3
hl = lathe('hill', M['limestone'], ((0.62, 0), (0.5, 0.1), (0.36, 0.17), (0.26, 0.19)), G - 0.01, HX, HY, segs=28, outline=0.009)
hl.visible_shadow = False


def ground(r):
    if r >= 0.62:
        return G - 0.01
    if r >= 0.5:
        return G - 0.01 + 0.1 * (0.62 - r) / 0.12
    if r >= 0.36:
        return G - 0.01 + 0.1 + 0.07 * (0.5 - r) / 0.14
    if r >= 0.26:
        return G - 0.01 + 0.17 + 0.02 * (0.36 - r) / 0.1
    return G + 0.18


box('square', M['paving'], 0.0, -0.32, G - 0.003, 0.4, 0.2, 0.008, outline=0, bevel=0)
# the church's carved doorways in the face of the rock
for j in range(3):
    box(f'churchdoor{j}', M['dark'], -0.1 + j * 0.1, HY - 0.6, G + 0.0, 0.05, 0.006, 0.08, outline=0, bevel=0)
    cyl(f'churchdoortop{j}', M['dark'], 0.025, 0.006, segs=12, outline=0, matrix=Matrix.Translation((-0.1 + j * 0.1, HY - 0.6, G + 0.08)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('rockface', M['limestone'], 0.0, HY - 0.56, G - 0.005, 0.38, 0.06, 0.14, outline=0.005, bevel=0)
# the bell tower on top
T = G + 0.18
box('belltower', M['stone'], 0.0, HY, T - 0.005, 0.1, 0.1, 0.3, outline=0.006, bevel=0)
for k in range(2):
    box(f'belltowerwin{k}', M['dark'], 0.0, HY - 0.053, T + 0.15 + k * 0.07, 0.03, 0.006, 0.05, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'pinnacle{sx}{sy}', M['stone'], ((0.012, 0), (0.004, 0.07)), T + 0.295, sx * 0.045, HY + sy * 0.045, segs=4, outline=0.001, smooth=False)
lathe('spire', M['stone'], ((0.045, 0), (0.004, 0.24)), T + 0.295, 0.0, HY, segs=8, outline=0.004, smooth=False)
# the houses on the slopes
spots = []
for k in range(80):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.18, 0.55)
    x, y = HX + r * math.cos(a), HY + r * math.sin(a)
    if abs(x) < 0.2 and y < HY - 0.15 or math.hypot(x, y - HY) < 0.12 or any(math.hypot(x - px, y - py) < 0.15 for px, py in spots):
        continue
    spots.append((x, y))
    zb = ground(r + 0.06)
    h = 0.08 + (ground(r) - zb)
    box(f'house{k}', M['stone'], x, y, zb - 0.005, 0.13, 0.11, h, outline=0.004, bevel=0)
    box(f'housewin{k}', M['dark'], x, y - 0.058, zb + h * 0.5, 0.03, 0.006, 0.03, outline=0, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, zb + h - 0.01, 0.14, 0.05, outline=0.003)
    if len(spots) >= 16:
        break

turn(before, -20)
render(G)
