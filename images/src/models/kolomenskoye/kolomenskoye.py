# A cartoon Church of the Ascension for the country maps, built in the set's shared look
# (../toon.py): Kolomenskoye's white stone church on its high bank over the Moskva, the cross-shaped
# body on its terrace of open galleries and stairs, the rows of pointed kokoshnik gables climbing
# round the octagon, and the soaring white tent roof crowned with a small dome and gold cross.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P kolomenskoye.py -- kolomenskoye-1024.png 1024 kolomenskoye.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'bank': toon('bank', '#6aa54a', shadow_mul=(0.72, 0.8, 0.74)),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'whiteDark': toon('whiteDark', '#d8d2c4'),
    'red': toon('red', '#b8503e'),
    'green': toon('green', '#3a6a5a'),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'dark': flat('dark', '#3a3a48'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('moskva', M['river'], [strip(-1.25, -0.72, 1.33, -0.004), strip(-1.25, -0.72, 1.33, 0.006)], outline=0.004)
loft('bank', M['bank'], [strip(-0.72, 0.8, 1.33, -0.004), strip(-0.62, 0.8, 1.28, 0.08)], outline=0.006)
T = G + 0.08

# ---------- the galleries and the cross-shaped body ----------
CX, CY = 0.0, 0.05
box('terrace', M['white'], CX, CY, T - 0.005, 0.5, 0.5, 0.08, outline=0.006, bevel=0)
for side in range(4):
    a = -math.pi / 2 + side * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    for j in range(5):
        u = -0.2 + j * 0.1
        box(f'galleryarch{side}{j}', M['dark'], CX + nx * 0.252 - ny * u, CY + ny * 0.252 + nx * u, T + 0.01, 0.05, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
for s in (-1, 1):
    n = 6
    for i in range(n):
        t = (i + 1) / n
        box(f'stair{s}{i}', M['white'], CX + s * (0.36 - t * 0.1), CY - 0.27, T - 0.085 + 0.0, 0.05, 0.08, 0.08 * t + 0.005, outline=0.001, bevel=0)
box('armx', M['white'], CX, CY, T + 0.07, 0.34, 0.18, 0.18, outline=0.006, bevel=0)
box('army', M['white'], CX, CY, T + 0.07, 0.18, 0.34, 0.18, outline=0.006, bevel=0)
box('door', M['dark'], CX, CY - 0.172, T + 0.075, 0.05, 0.006, 0.09, outline=0, bevel=0)
# kokoshnik gables on the arms
for side in range(4):
    a = -math.pi / 2 + side * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    for j, u in enumerate((-0.05, 0.05)):
        px, py = CX + nx * 0.17 - ny * u, CY + ny * 0.17 + nx * u
        loft(f'kokoshnik{side}{j}', M['whiteDark'], [[(px - ny * 0.045 - nx * 0.01, py + nx * 0.045 - ny * 0.01, T + 0.245), (px + ny * 0.045 - nx * 0.01, py - nx * 0.045 - ny * 0.01, T + 0.245), (px + ny * 0.045 + nx * 0.01, py - nx * 0.045 + ny * 0.01, T + 0.245), (px - ny * 0.045 + nx * 0.01, py + nx * 0.045 + ny * 0.01, T + 0.245)],
                                                      [(px - nx * 0.01, py - ny * 0.01, T + 0.31), (px - nx * 0.01 + 0.001, py - ny * 0.01 + 0.001, T + 0.31), (px + nx * 0.01 + 0.001, py + ny * 0.01 + 0.001, T + 0.31), (px + nx * 0.01, py + ny * 0.01, T + 0.31)]], outline=0.002)

# ---------- the octagon and the tent ----------
Z = T + 0.245
lathe('octagon', M['white'], ((0.11, 0), (0.11, 0.16)), Z, CX, CY, segs=8, outline=0.005, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    if math.sin(a) > 0.3:
        continue
    box(f'octwin{k}', M['dark'], CX + 0.103 * math.cos(a), CY + 0.103 * math.sin(a), Z + 0.05, 0.025, 0.006, 0.07, rot_z=a + math.pi / 2, outline=0, bevel=0)
for row in range(2):
    for k in range(8):
        a = 2 * math.pi * k / 8
        px, py = CX + (0.115 - row * 0.01) * math.cos(a), CY + (0.115 - row * 0.01) * math.sin(a)
        lathe(f'octkokoshnik{row}{k}', M['whiteDark'], ((0.035, 0), (0.004, 0.06)), Z + 0.15 + row * 0.05, px, py, segs=6, outline=0.001, smooth=False)
lathe('tent', M['white'], ((0.115, 0), (0.08, 0.15), (0.04, 0.32), (0.012, 0.42)), Z + 0.24, CX, CY, segs=8, outline=0.006, smooth=False)
for k in range(8):
    a = 2 * math.pi * k / 8
    bar(f'tentrib{k}', M['whiteDark'], (CX + 0.115 * math.cos(a), CY + 0.115 * math.sin(a), Z + 0.245), (CX + 0.012 * math.cos(a), CY + 0.012 * math.sin(a), Z + 0.66), 0.008, outline=0)
lathe('drum', M['white'], ((0.018, 0), (0.018, 0.04)), Z + 0.655, CX, CY, segs=10, outline=0.002)
lathe('dome', M['green'], ((0.022, 0), (0.028, 0.015), (0.012, 0.035), (0.004, 0.05)), Z + 0.69, CX, CY, segs=12, outline=0.002)
rod('cross', M['gold'], (CX, CY, Z + 0.735), (CX, CY, Z + 0.8), 0.005, segs=6, outline=0)
bar('crossbar', M['gold'], (CX - 0.015, CY, Z + 0.78), (CX + 0.015, CY, Z + 0.78), 0.007, outline=0)

for k, (x, y, r) in enumerate(((-0.65, 0.3, 0.1), (0.65, 0.35, 0.1), (-0.5, 0.65, 0.09), (0.5, 0.65, 0.09), (-0.75, -0.25, 0.08), (0.75, -0.3, 0.08))):
    ball(f'tree{k}', M['tree'], x, y, T + r * 1.0, r, outline=0.007)

turn(before, -20)
render(G)
