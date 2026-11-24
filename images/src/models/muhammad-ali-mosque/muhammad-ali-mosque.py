# A cartoon Mosque of Muhammad Ali for the country maps, built in the set's shared look
# (../toon.py): the Ottoman-style mosque crowning Cairo's Citadel, its great central dome over the
# cascade of half-domes and small domes, its two pencil-thin minarets, the arcaded courtyard with the
# clock tower and the ablution fountain under its own dome, all in pale alabaster, on the Citadel's
# walls above the city. Turned a little towards the camera.
# Run: blender -b --factory-startup -P muhammad-ali-mosque.py -- muhammad-ali-mosque-1024.png 1024 muhammad-ali-mosque.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a8', shadow_mul=(0.86, 0.82, 0.78), lift=0.2),
    'wall': toon('wall', '#c8ac80', shadow_mul=(0.86, 0.8, 0.76), lift=0.1),
    'wallDark': toon('wallDark', '#a88c60'),
    'alabaster': toon('alabaster', '#f0ece2', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'lead': toon('lead', '#8a96a8', shadow_mul=(0.82, 0.86, 0.94), lift=0.12),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'dark': flat('dark', '#3a3a46'),
    'roof': toon('roof', '#b89a70'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the Citadel's wall and the terrace ----------
TZ = G + 0.18
box('terrace', M['wall'], 0, 0.15, G - 0.005, 1.4, 1.1, TZ - G + 0.005, outline=0.009, bevel=0)
for j in range(14):
    box(f'merlon{j}', M['wallDark'], -0.65 + j * 0.1, 0.15 - 0.555, TZ, 0.05, 0.03, 0.03, outline=0.002, bevel=0)
for s in (-1, 1):
    lathe(f'bastion{s}', M['wall'], ((0.1, 0), (0.1, TZ - G + 0.06)), G - 0.005, s * 0.7, -0.4, segs=16, outline=0.006)
# the city's roofs below the walls, in front
for k, x in enumerate((-0.95, -0.7, -0.45, -0.2, 0.05, 0.3, 0.55, 0.8)):
    y = -0.72 - 0.06 * (k % 2)
    if math.hypot(x, y) > 1.2:
        continue
    box(f'cityhouse{k}', M['roof'], x, y, G - 0.005, 0.18, 0.14, 0.08 + 0.03 * (k % 3), outline=0.004, bevel=0)


def dome(name, x, y, z, r, mat='lead'):
    lathe(name, M[mat], ((r, 0), (r * 0.97, r * 0.3), (r * 0.82, r * 0.62), (r * 0.5, r * 0.88), (0.004, r)), z, x, y, segs=24, outline=0.004)


# ---------- the prayer hall ----------
HX, HY, HS = 0.12, 0.35, 0.5
box('hall', M['alabaster'], HX, HY, TZ - 0.005, HS, HS, 0.2, outline=0.008, bevel=0)
for k in range(4):
    a = k * math.pi / 2
    hx, hy = HX + 0.15 * math.cos(a), HY + 0.15 * math.sin(a)
    lathe(f'halfdomebase{k}', M['alabaster'], ((0.09, 0), (0.09, 0.04)), TZ + 0.195, hx, hy, segs=20, outline=0.003)
    dome(f'halfdome{k}', hx, hy, TZ + 0.235, 0.09)
for sx in (-1, 1):
    for sy in (-1, 1):
        dome(f'cornerdome{sx}{sy}', HX + sx * 0.18, HY + sy * 0.18, TZ + 0.195, 0.055)
lathe('drum', M['alabaster'], ((0.15, 0), (0.15, 0.08)), TZ + 0.24, HX, HY, segs=28, outline=0.005)
for k in range(16):
    a = 2 * math.pi * k / 16
    box(f'drumwin{k}', M['dark'], HX + 0.152 * math.cos(a), HY + 0.152 * math.sin(a), TZ + 0.255, 0.02, 0.02, 0.04, rot_z=a, outline=0, bevel=0)
dome('maindome', HX, HY, TZ + 0.315, 0.17)
rod('maindomefinial', M['gold'], (HX, HY, TZ + 0.485), (HX, HY, TZ + 0.55), 0.005, segs=4, outline=0)
for row in range(2):
    for j in range(4):
        box(f'hallwin{row}{j}', M['dark'], HX - 0.15 + j * 0.1, HY - HS / 2 - 0.003, TZ + 0.04 + row * 0.08, 0.03, 0.006, 0.05, outline=0, bevel=0)

# ---------- the two minarets ----------
for s in (-1, 1):
    mx, my = HX + s * (HS / 2 + 0.04), HY - HS / 2 + 0.02
    lathe(f'minaret{s}', M['alabaster'], ((0.03, 0), (0.03, 0.05), (0.022, 0.06), (0.02, 0.72)), TZ - 0.005, mx, my, segs=12, outline=0.003, smooth=False)
    for k in range(2):
        lathe(f'minaretbalcony{s}{k}', M['alabaster'], ((0.022, 0), (0.034, 0.012), (0.034, 0.02)), TZ + 0.42 + k * 0.16, mx, my, segs=12, outline=0.002)
    lathe(f'minaretcap{s}', M['lead'], ((0.022, 0), (0.003, 0.16)), TZ + 0.715, mx, my, segs=12, outline=0.002)
    rod(f'minaretfinial{s}', M['gold'], (mx, my, TZ + 0.87), (mx, my, TZ + 0.91), 0.003, segs=4, outline=0)

# ---------- the courtyard to the west ----------
CX, CY, CS = HX - 0.5, HY - 0.05, 0.42
for side in range(4):
    a = side * math.pi / 2
    for j in range(4):
        t = -0.15 + j * 0.1
        x = CX + math.cos(a) * CS / 2 - math.sin(a) * t
        y = CY + math.sin(a) * CS / 2 + math.cos(a) * t
        box(f'arcade{side}{j}', M['alabaster'], x, y, TZ - 0.005, 0.06, 0.06, 0.07, outline=0.003, bevel=0)
        dome(f'arcadedome{side}{j}', x, y, TZ + 0.065, 0.03)
lathe('ablution', M['alabaster'], ((0.05, 0), (0.05, 0.06)), TZ - 0.005, CX, CY, segs=8, outline=0.003, smooth=False)
dome('ablutiondome', CX, CY, TZ + 0.055, 0.07)
box('clocktower', M['alabaster'], CX - CS / 2, CY + 0.1, TZ - 0.005, 0.06, 0.06, 0.22, outline=0.003, bevel=0)
lathe('clocktowercap', M['lead'], ((0.04, 0), (0.003, 0.08)), TZ + 0.215, CX - CS / 2, CY + 0.1, segs=8, outline=0.002, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
