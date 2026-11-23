# A cartoon Salar de Uyuni for the country maps, built in the set's shared look (../toon.py): the
# world's largest salt flat, white and crazed into hexagons, a sheet of rainwater mirroring the
# sky, Isla Incahuasi's rocky hump with its giant cacti, a 4x4 crossing the salt, and the striped
# volcano Tunupa behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P salar-de-uyuni.py -- salar-de-uyuni-1024.png 1024 salar-de-uyuni.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'salt': toon('salt', '#f8f8f6', shadow_mul=(0.8, 0.86, 0.94), lift=0.12),
    'crack': flat('crack', '#c8d4e0'),
    'mirror': toon('mirror', '#9ad4f0', shadow_mul=(0.8, 0.88, 0.96), lift=0.35),
    'rock': toon('rock', '#8a6a58', shadow_mul=(0.84, 0.8, 0.82)),
    'cactus': toon('cactus', '#5a8a4a', shadow_mul=(0.72, 0.8, 0.78)),
    'volcano': toon('volcano', '#a86a58', shadow_mul=(0.86, 0.78, 0.8)),
    'stripe': toon('stripe', '#d8a050'),
    'snow': toon('snow', '#fbfbfd', lift=0.15),
    'jeep': toon('jeep', '#f6f4ee', lift=0.2),
    'jeepRed': toon('jeepRed', '#d83a2c'),
    'tyre': toon('tyre', '#2e2a30'),
    'glass': toon('glass', '#6a9ac8', lift=0.3),
})

G = tile(M['salt'])
before = set(bpy.data.objects)

# ---------- the hexagons of salt ----------
S = 0.22
for i in range(-6, 7):
    for j in range(-5, 6):
        cx = i * S * 1.5
        cy = j * S * math.sqrt(3) + (S * math.sqrt(3) / 2 if i % 2 else 0)
        if math.hypot(cx, cy) > 1.1:
            continue
        for k in range(3):
            a0, a1 = math.pi / 3 * k, math.pi / 3 * (k + 1)
            bar(f'hex{i}{j}{k}', M['crack'], (cx + S * math.cos(a0), cy + S * math.sin(a0), G + 0.001), (cx + S * math.cos(a1), cy + S * math.sin(a1), G + 0.001), 0.012, outline=0)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


loft('mirror', M['mirror'], [ring(-0.45, -0.5, 0.5, 0.3, 0.0, 1), ring(-0.45, -0.5, 0.5, 0.3, 0.012, 1)], outline=0.003, smooth=True)

# ---------- Tunupa ----------
lathe('tunupa', M['volcano'], ((0.55, 0), (0.3, 0.3), (0.14, 0.48)), G - 0.01, -0.35, 0.85, segs=20, outline=0.012)
lathe('tunupasnow', M['snow'], ((0.17, 0), (0.12, 0.05), (0.004, 0.07)), G + 0.465, -0.35, 0.85, segs=20, outline=0.006)
for j in range(5):
    a = math.radians(225 + j * 22)
    bar(f'tunupastripe{j}', M['stripe'], (-0.35 + 0.18 * math.cos(a), 0.85 + 0.18 * math.sin(a), G + 0.43), (-0.35 + 0.48 * math.cos(a), 0.85 + 0.48 * math.sin(a), G + 0.05), 0.04, outline=0)

# ---------- Isla Incahuasi and its cacti ----------
IX, IY = 0.45, 0.25
b = ball('island', M['rock'], 0, 0, 0, 0.36, outline=0.012)
b.scale = (1.25, 1.0, 0.45)
b.location = (IX, IY, G + 0.03)
for k, (dx, dy, h) in enumerate(((-0.2, -0.12, 0.34), (0.05, -0.18, 0.42), (0.25, -0.05, 0.3), (-0.05, 0.1, 0.36), (0.18, 0.15, 0.28), (-0.3, 0.05, 0.26))):
    x, y = IX + dx, IY + dy
    z0 = G + 0.1
    rod(f'cactus{k}', M['cactus'], (x, y, z0), (x, y, z0 + h), 0.028, segs=10, outline=0.004)
    ball(f'cactustop{k}', M['cactus'], x, y, z0 + h, 0.028, outline=0.004)
    for s in (-1, 1):
        if (k + s) % 2:
            ax = x + s * 0.06
            rod(f'cactusarm{k}{s}', M['cactus'], (x, y, z0 + h * 0.45), (ax, y, z0 + h * 0.45), 0.02, segs=8, outline=0.003)
            rod(f'cactusarmup{k}{s}', M['cactus'], (ax, y, z0 + h * 0.45), (ax, y, z0 + h * 0.72), 0.02, segs=8, outline=0.003)
            ball(f'cactusarmtop{k}{s}', M['cactus'], ax, y, z0 + h * 0.72, 0.02, outline=0.003)

# ---------- the 4x4 ----------
JX, JY = 0.35, -0.55
box('jeepbody', M['jeep'], JX, JY, G + 0.04, 0.3, 0.14, 0.08, outline=0.006, bevel=0)
box('jeepcabin', M['jeep'], JX - 0.03, JY, G + 0.115, 0.2, 0.13, 0.07, outline=0.005, bevel=0)
box('jeepwindows', M['glass'], JX - 0.03, JY - 0.066, G + 0.13, 0.17, 0.006, 0.04, outline=0, bevel=0)
box('jeepstripe', M['jeepRed'], JX, JY - 0.071, G + 0.07, 0.3, 0.006, 0.02, outline=0, bevel=0)
box('jeeproofrack', M['jeepRed'], JX - 0.03, JY, G + 0.18, 0.18, 0.11, 0.03, outline=0.003, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f'tyre{sx}{sy}', M['tyre'], 0.04, 0.03, segs=12, outline=0.003, matrix=Matrix.Translation((JX + sx * 0.1, JY + sy * 0.07 - 0.015 * (sy < 0), G + 0.04)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

bpy.context.view_layer.update()
turn(before, -20)
render(G)
