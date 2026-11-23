# A cartoon Bukhara for the country maps, built in the set's shared look (../toon.py): the
# Po-i-Kalyan ensemble, the tall Kalyan Minaret of patterned brick with its lantern rotunda, the
# Kalyan Mosque's great turquoise dome, the Mir-i-Arab Madrasa's twin blue domes and tiled portal
# facing it across the square. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bukhara.py -- bukhara-1024.png 1024 bukhara.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0cca8', shadow_mul=(0.86, 0.8, 0.76), lift=0.2),
    'brick': toon('brick', '#d0a070', shadow_mul=(0.86, 0.8, 0.76)),
    'brickDark': toon('brickDark', '#b88a5a', shadow_mul=(0.86, 0.8, 0.76)),
    'turq': toon('turq', '#2fb8c0', lift=0.25),
    'blue': toon('tileBlue', '#2f5ab0'),
    'door': flat('door', '#3a2a24'),
    'tree': toon('tree', '#5a8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def dome(name, x, y, z, r, mat):
    lathe(f'{name}drum', M['brick'], ((r * 0.85, 0), (r * 0.85, r * 0.55)), z, x, y, segs=18, outline=0.006)
    lathe(f'{name}drumtiles', M['blue'], ((r * 0.86, 0), (r * 0.86, r * 0.15)), z + r * 0.35, x, y, segs=18, outline=0)
    lathe(name, M[mat], ((r, 0), (r * 0.97, r * 0.35), (r * 0.75, r * 0.75), (r * 0.35, r * 1.0), (0.004, r * 1.1)), z + r * 0.55, x, y, segs=22, outline=0.008)


def building(name, x, y, w, d, h, portal_h, side):
    box(name, M['brick'], x, y, G - 0.005, w, d, h, outline=0.01, bevel=0)
    px, py = x, y + side * d / 2
    box(f'{name}portal', M['brickDark'], px, py, G - 0.005, 0.28, 0.06, portal_h, outline=0.008, bevel=0)
    box(f'{name}portaltiles', M['turq'], px, py + side * 0.032, G + portal_h - 0.1, 0.24, 0.006, 0.07, outline=0, bevel=0)
    box(f'{name}iwan', M['blue'], px, py + side * 0.032, G - 0.005, 0.15, 0.006, portal_h - 0.12, outline=0, bevel=0)
    box(f'{name}door', M['door'], px, py + side * 0.036, G - 0.005, 0.08, 0.006, 0.13, outline=0, bevel=0)
    for s in (-1, 1):
        lathe(f'{name}guldasta{s}', M['brickDark'], ((0.03, 0), (0.03, portal_h + 0.05)), G - 0.005, px + s * 0.15, py, segs=10, outline=0.004)
        lathe(f'{name}guldastatop{s}', M['turq'], ((0.035, 0), (0.004, 0.05)), G + portal_h + 0.045, px + s * 0.15, py, segs=10, outline=0.003)


# ---------- the Kalyan Mosque (left, its portal facing right) and the madrasa (back right) ----------
building('mosque', -0.45, 0.35, 0.6, 0.5, 0.22, 0.4, -1)
dome('mosquedome', -0.45, 0.45, G + 0.215, 0.2, 'turq')
building('madrasa', 0.55, 0.35, 0.55, 0.45, 0.22, 0.42, -1)
dome('madrasadomeL', 0.42, 0.5, G + 0.215, 0.12, 'blue')
dome('madrasadomeR', 0.72, 0.5, G + 0.215, 0.12, 'turq')

# ---------- the Kalyan Minaret ----------
KX, KY = 0.05, -0.15
prof = ((0.15, 0), (0.14, 0.12), (0.13, 0.24), (0.12, 0.36), (0.11, 0.48), (0.1, 0.6), (0.092, 0.72), (0.085, 0.84))
for i in range(len(prof) - 1):
    (r0, h0), (r1, h1) = prof[i], prof[i + 1]
    lathe(f'minaret{i}', M['brick' if i % 2 == 0 else 'brickDark'], ((r0, 0), (r1, h1 - h0)), G - 0.005 + h0, KX, KY, segs=24, outline=0.008 if i == 0 else 0.005)
    if i in (2, 5):
        lathe(f'minarettile{i}', M['turq'], ((r1 + 0.004, 0), (r1 + 0.004, 0.025)), G + h1 - 0.03, KX, KY, segs=24, outline=0)
lathe('rotundabase', M['brickDark'], ((0.085, 0), (0.12, 0.05)), G + 0.835, KX, KY, segs=24, outline=0.005)
lathe('rotunda', M['brick'], ((0.12, 0), (0.12, 0.08)), G + 0.885, KX, KY, segs=24, outline=0.006)
for j in range(12):
    a = 2 * math.pi * j / 12
    box(f'arch{j}', M['door'], KX + 0.12 * math.cos(a), KY + 0.12 * math.sin(a), G + 0.9, 0.025, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('rotundacap', M['brickDark'], ((0.125, 0), (0.06, 0.05), (0.004, 0.07)), G + 0.965, KX, KY, segs=24, outline=0.005)

# ---------- mulberry trees ----------
for k, (x, y) in enumerate(((-0.85, -0.4), (0.85, -0.35), (-0.5, -0.75), (0.5, -0.8))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.014, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + 0.17, 0.1, outline=0.012)

turn(before, -20)
render(G)
