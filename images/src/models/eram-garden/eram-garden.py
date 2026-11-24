# A cartoon Eram Garden for the country maps, built in the set's shared look (../toon.py): the Persian
# garden in Shiraz, the Qajar palace at its head with its tall columned portico and the colourful
# tiled pediment and panels over it, the long pool on the axis in front reflecting it, the rows of
# tall dark cypresses along both sides, the flower beds and the orange trees. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P eram-garden.py -- eram-garden-1024.png 1024 eram-garden.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#e4dccc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'water': toon('water', '#3a9ac8', lift=0.3),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'tileBlue': toon('tileBlue', '#2a6aa8', lift=0.15),
    'tileYellow': toon('tileYellow', '#f0c040', lift=0.2),
    'tilePink': toon('tilePink', '#e08aa0', lift=0.15),
    'dark': flat('dark', '#2e2a2a'),
    'cypress': toon('cypress', '#2f5e34', shadow_mul=(0.7, 0.78, 0.8)),
    'orange': toon('orange', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'fruit': toon('fruit', '#f09030', lift=0.2),
    'flower': toon('flower', '#e05a6a', lift=0.2),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the axis: paving and the long pool ----------
box('walk', M['paving'], 0.0, -0.2, G - 0.004, 0.36, 1.5, 0.01, outline=0.001, bevel=0)
box('poolrim', M['white'], 0.0, -0.25, G - 0.004, 0.2, 1.08, 0.025, outline=0.002, bevel=0)
box('pool', M['water'], 0.0, -0.25, G + 0.005, 0.17, 1.05, 0.018, outline=0, bevel=0)

# ---------- the palace ----------
PY = 0.55
box('palace', M['white'], 0.0, PY + 0.08, G - 0.005, 0.8, 0.26, 0.26, outline=0.008, bevel=0)
for row in range(2):
    for j in range(8):
        x = -0.35 + j * 0.1
        if abs(x) < 0.15:
            continue
        box(f'palacewin{row}{j}', M['dark'], x, PY - 0.053, G + 0.04 + row * 0.11, 0.035, 0.006, 0.07, outline=0, bevel=0)
        box(f'palacepanel{row}{j}', M['tileBlue'], x, PY - 0.053, G + 0.115 + row * 0.11, 0.05, 0.006, 0.015, outline=0, bevel=0)
# the portico: tall columns, and the tiled pediment over them
box('porticoback', M['white'], 0.0, PY - 0.06, G - 0.005, 0.28, 0.02, 0.3, outline=0.004, bevel=0)
box('porticodoor', M['dark'], 0.0, PY - 0.072, G - 0.005, 0.07, 0.006, 0.13, outline=0, bevel=0)
for j in range(4):
    rod(f'column{j}', M['white'], (-0.105 + j * 0.07, PY - 0.13, G), (-0.105 + j * 0.07, PY - 0.13, G + 0.28), 0.012, segs=10, outline=0.002)
box('porticoroof', M['white'], 0.0, PY - 0.09, G + 0.28, 0.3, 0.1, 0.025, outline=0.003, bevel=0)
box('tilepanel', M['tileYellow'], 0.0, PY - 0.14, G + 0.305, 0.3, 0.012, 0.08, outline=0.002, bevel=0)
for k in range(6):
    box(f'tileflower{k}', M['tilePink'] if k % 2 else M['tileBlue'], -0.11 + k * 0.044, PY - 0.148, G + 0.33, 0.022, 0.004, 0.03, outline=0, bevel=0)
loft('pediment', M['tileBlue'], [[(-0.15, PY - 0.146, G + 0.385), (0.15, PY - 0.146, G + 0.385), (0.15, PY - 0.134, G + 0.385), (-0.15, PY - 0.134, G + 0.385)],
                                 [(-0.004, PY - 0.146, G + 0.47), (0.004, PY - 0.146, G + 0.47), (0.004, PY - 0.134, G + 0.47), (-0.004, PY - 0.134, G + 0.47)]], outline=0.003)
box('palaceroof', M['white'], 0.0, PY + 0.08, G + 0.255, 0.82, 0.28, 0.02, outline=0.003, bevel=0)

# ---------- cypresses, orange trees and flower beds ----------
for s in (-1, 1):
    for k in range(6):
        y = -0.85 + k * 0.22
        x = s * 0.25
        if math.hypot(x, y) > 1.2:
            continue
        lathe(f'cypress{s}{k}', M['cypress'], ((0.035, 0), (0.045, 0.1), (0.035, 0.24), (0.003, 0.34)), G - 0.005, x, y, segs=10, outline=0.004)
    for k in range(3):
        y = -0.7 + k * 0.4
        x = s * 0.6
        ball(f'orange{s}{k}', M['orange'], x, y, G + 0.1, 0.09, outline=0.008)
        for j in range(4):
            a = 2 * math.pi * j / 4 + 0.4
            ball(f'fruit{s}{k}{j}', M['fruit'], x + 0.085 * math.cos(a), y + 0.085 * math.sin(a), G + 0.1 + 0.03 * (j % 2), 0.012, outline=0.001)
        box(f'bed{s}{k}', M['flower'], s * 0.4, y, G - 0.004, 0.06, 0.18, 0.02, outline=0.001, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
