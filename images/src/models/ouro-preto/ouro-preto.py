# A cartoon Ouro Preto for the country maps, built in the set's shared look (../toon.py): the
# church of São Francisco de Assis on its hilltop, the white baroque front with Aleijadinho's
# soapstone portal and medallion under the curved pediment, its two round bell towers with their
# stone bands and domed caps, and the colonial town's white houses with coloured doors and red roofs
# down the green slopes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ouro-preto.py -- ouro-preto-1024.png 1024 ouro-preto.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.72, 0.8, 0.74)),
    'white': toon('white', '#f6f2ea', lift=0.15),
    'soap': toon('soap', '#8a9a8a', shadow_mul=(0.84, 0.86, 0.88)),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a3430'),
    'blue': toon('blue', '#3a6ab0'),
    'yellow': toon('yellow', '#f0c030', lift=0.2),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2371)

HX, HY = 0.0, 0.05
mnd = lathe('mound', M['grass'], ((0.95, 0), (0.75, 0.08), (0.5, 0.13), (0.35, 0.14)), G - 0.01, HX, HY, segs=32, outline=0.01)
mnd.visible_shadow = False


def ground(rr):
    if rr >= 0.95:
        return G - 0.01
    if rr >= 0.75:
        return G - 0.01 + 0.08 * (0.95 - rr) / 0.2
    if rr >= 0.5:
        return G - 0.01 + 0.08 + 0.05 * (0.75 - rr) / 0.25
    if rr >= 0.35:
        return G - 0.01 + 0.13 + 0.01 * (0.5 - rr) / 0.15
    return G + 0.13


for k, (x, y, r, h) in enumerate(((-0.7, 0.92, 0.3, 0.22), (0.62, 0.95, 0.28, 0.2))):
    bh = lathe(f'backhill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.65), (r * 0.3, h * 0.95), (0.004, h)), G - 0.01, x, y, segs=24, outline=0.008)
    bh.visible_shadow = False

T = G + 0.13
# ---------- the church ----------
mark = set(bpy.data.objects)
box('nave', M['white'], 0.0, 0.23, T - 0.005, 0.3, 0.42, 0.22, outline=0.009, bevel=0)
for s in (-1, 1):
    box(f'quoin{s}', M['soap'], s * 0.15, 0.025, T - 0.005, 0.022, 0.022, 0.22, outline=0.002, bevel=0)
box('portal', M['soap'], 0.0, 0.016, T - 0.005, 0.1, 0.012, 0.17, outline=0.002, bevel=0)
box('door', M['window'], 0.0, 0.008, T - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
cyl('medallion', M['soap'], 0.03, 0.01, segs=16, outline=0.001, matrix=Matrix.Translation((0.0, 0.008, T + 0.135)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    box(f'facadewin{s}', M['window'], s * 0.08, 0.017, T + 0.14, 0.035, 0.006, 0.05, outline=0, bevel=0)
box('frontispiece', M['white'], 0.0, 0.04, T + 0.21, 0.2, 0.05, 0.06, outline=0.004, bevel=0)
cyl('pediment', M['white'], 0.1, 0.05, segs=20, outline=0.004, matrix=Matrix.Translation((0.0, 0.04, T + 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
rod('cross', M['soap'], (0.0, 0.04, T + 0.36), (0.0, 0.04, T + 0.44), 0.008, segs=6, outline=0.001)
bar('crossbar', M['soap'], (-0.025, 0.04, T + 0.415), (0.025, 0.04, T + 0.415), 0.012, outline=0.001)
loft('naveroof', M['roof'], [[(-0.165, 0.06, T + 0.215), (0.165, 0.06, T + 0.215), (0.165, 0.45, T + 0.215), (-0.165, 0.45, T + 0.215)],
                             [(-0.004, 0.06, T + 0.31), (0.004, 0.06, T + 0.31), (0.004, 0.45, T + 0.31), (-0.004, 0.45, T + 0.31)]], outline=0.005)
for s in (-1, 1):
    tx, ty = s * 0.2, 0.07
    lathe(f'tower{s}', M['white'], ((0.06, 0), (0.06, 0.3)), T - 0.005, tx, ty, segs=20, outline=0.006)
    for z in (T + 0.12, T + 0.285):
        lathe(f'towerband{s}{z}', M['soap'], ((0.065, 0), (0.065, 0.016)), z, tx, ty, segs=20, outline=0.002)
    box(f'belfry{s}', M['window'], tx, ty - 0.058, T + 0.19, 0.03, 0.006, 0.06, outline=0, bevel=0)
    lathe(f'towercap{s}', M['soap'], ((0.066, 0), (0.05, 0.04), (0.012, 0.07), (0.004, 0.08)), T + 0.3, tx, ty, segs=20, outline=0.004)
    rod(f'towercross{s}', M['soap'], (tx, ty, T + 0.375), (tx, ty, T + 0.43), 0.006, segs=6, outline=0.001)

bpy.context.view_layer.update()
m = Matrix.Translation((0.0, 0.15, T)) @ Matrix.Scale(1.5, 4) @ Matrix.Translation((0.0, -0.15, -T))
for o in [o for o in bpy.data.objects if o not in mark]:
    o.matrix_world = m @ o.matrix_world

# ---------- the town down the slopes ----------
spots = []
for k in range(80):
    a = rng.uniform(math.pi * 0.85, math.pi * 2.15)
    rr = rng.uniform(0.5, 0.88)
    x, y = HX + rr * math.cos(a), HY + rr * math.sin(a)
    if math.hypot(x, y) > 1.05 or (abs(x) < 0.47 and y > -0.2):
        continue
    if any(math.hypot(x - px, y - py) < 0.16 for px, py in spots):
        continue
    spots.append((x, y))
    z = ground(rr + 0.06)
    h = rng.uniform(0.07, 0.1)
    box(f'house{k}', M['white'], x, y, z - 0.005, 0.13, 0.11, h + (ground(rr) - z), outline=0.004, bevel=0)
    zt = z + h + (ground(rr) - z)
    box(f'housedoor{k}', M[rng.choice(('blue', 'yellow'))], x, y - 0.058, z, 0.03, 0.006, 0.05, outline=0, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, zt - 0.01, 0.14, 0.05, outline=0.003)
    if len(spots) >= 18:
        break
for k, (x, y) in enumerate(((-0.95, -0.1), (0.95, -0.15), (-0.45, -0.85), (0.45, -0.85))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, 0.08, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
