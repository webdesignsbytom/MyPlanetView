# A cartoon Odesa for the country maps, built in the set's shared look (../toon.py): the historic
# centre on its bluff over the Black Sea harbour, the Potemkin Stairs running down from the
# boulevard to the quay, widening as they go, with the Duc de Richelieu on his pedestal at the top,
# and on the boulevard behind the baroque Opera House: its round cream front, the green roof and
# little lantern, the portico with its statues and the stage house behind; a ship in the harbour
# and the boulevard's trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P odesa.py -- odesa-1024.png 1024 odesa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'bluff': toon('bluff', '#cfc4ac', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'stone': toon('stone', '#ece2cc', lift=0.15),
    'cream': toon('cream', '#f2e0b4', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'white': toon('white', '#f8f4ec', lift=0.22),
    'copper': toon('copper', '#5a8a78', lift=0.12),
    'water': toon('water', '#3f8fc0', lift=0.3),
    'hull': toon('hull', '#2e4a6e'),
    'bronze': toon('bronze', '#6a5a3a'),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    """The part of a disc of radius r between y0 and y1, counter-clockwise from above."""
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the harbour, the bluff and the boulevard on top ----------
loft('harbour', M['water'], [strip(-1.31, -0.72, 1.32, G - 0.004), strip(-1.31, -0.72, 1.32, G + 0.008)], outline=0.002)
PZ = G + 0.22
bluff = loft('bluff', M['bluff'], [strip(0.0, 1.31, 1.32, G - 0.01), strip(0.0, 1.31, 1.32, PZ)], outline=0.006)

# ---------- the Potemkin Stairs, widening towards the quay ----------
SX = 0.3
N = 10
for i in range(N):
    top = PZ - (i + 1) * (PZ - G) / (N + 1)
    w = 0.22 + 0.16 * i / (N - 1)
    box(f'step{i}', M['stone'], SX, -0.031 - i * 0.062, G - 0.005, w, 0.062, top - G + 0.005, outline=0.002, bevel=0)
for s in (-1, 1):
    bar(f'parapet{s}', M['stone'], (SX + s * 0.115, 0.0, PZ + 0.02), (SX + s * 0.195, -0.62, G + 0.04), 0.022, outline=0.002)
# the Duc de Richelieu at the top
box('pedestal', M['stone'], SX, 0.1, PZ - 0.005, 0.06, 0.06, 0.08, outline=0.002, bevel=0)
rod('duc', M['bronze'], (SX, 0.1, PZ + 0.075), (SX, 0.1, PZ + 0.14), 0.015, r2=0.01, segs=8, outline=0.002)
ball('duchead', M['bronze'], SX, 0.1, PZ + 0.15, 0.012, outline=0.001)

# ---------- the Opera House ----------
OX, OY = -0.3, 0.6
lathe('auditorium', M['cream'], ((0.24, 0), (0.24, 0.2)), PZ - 0.005, OX, OY, segs=28, outline=0.006)
lathe('cornice', M['white'], ((0.25, 0), (0.25, 0.02)), PZ + 0.18, OX, OY, segs=28, outline=0.002)
for row in range(2):
    for k in range(9):
        a = math.radians(-160 + k * 17.5)
        box(f'operawin{row}{k}', M['dark'], OX + 0.242 * math.cos(a), OY + 0.242 * math.sin(a), PZ + 0.03 + row * 0.08, 0.025, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('operaroof', M['copper'], ((0.25, 0), (0.22, 0.05), (0.15, 0.09), (0.06, 0.11), (0.0, 0.115)), PZ + 0.195, OX, OY, segs=28, outline=0.004)
lathe('lantern', M['white'], ((0.035, 0), (0.035, 0.05)), PZ + 0.3, OX, OY, segs=12, outline=0.002)
lathe('lanterncap', M['copper'], ((0.04, 0), (0.03, 0.025), (0.003, 0.05)), PZ + 0.345, OX, OY, segs=12, outline=0.002)
# the portico at the front, with its columns and statues
PY = OY - 0.27
box('portico', M['cream'], OX, PY, PZ - 0.005, 0.26, 0.08, 0.24, outline=0.005, bevel=0)
box('porticodoor', M['dark'], OX, PY - 0.043, PZ - 0.005, 0.1, 0.006, 0.1, outline=0, bevel=0)
for j in range(4):
    rod(f'porticocol{j}', M['white'], (OX - 0.09 + j * 0.06, PY - 0.05, PZ), (OX - 0.09 + j * 0.06, PY - 0.05, PZ + 0.17), 0.011, segs=8, outline=0.002)
box('porticobeam', M['white'], OX, PY - 0.01, PZ + 0.17, 0.27, 0.1, 0.03, outline=0.003, bevel=0)
for j in range(3):
    rod(f'statue{j}', M['bronze'], (OX - 0.08 + j * 0.08, PY - 0.03, PZ + 0.2), (OX - 0.08 + j * 0.08, PY - 0.03, PZ + 0.26), 0.012, r2=0.007, segs=8, outline=0.002)
    ball(f'statuehead{j}', M['bronze'], OX - 0.08 + j * 0.08, PY - 0.03, PZ + 0.27, 0.01, outline=0.001)
# the stage house behind
box('stagehouse', M['cream'], OX, OY + 0.24, PZ - 0.005, 0.42, 0.2, 0.27, outline=0.006, bevel=0)
loft('stageroof', M['copper'], [[(OX - 0.22, OY + 0.13, PZ + 0.26), (OX + 0.22, OY + 0.13, PZ + 0.26), (OX + 0.22, OY + 0.35, PZ + 0.26), (OX - 0.22, OY + 0.35, PZ + 0.26)],
                                [(OX - 0.18, OY + 0.235, PZ + 0.33), (OX + 0.18, OY + 0.235, PZ + 0.33), (OX + 0.18, OY + 0.245, PZ + 0.33), (OX - 0.18, OY + 0.245, PZ + 0.33)]], outline=0.004)

# ---------- the boulevard's trees and a ship in the harbour ----------
for k, x in enumerate((-1.05, -0.8, 0.65, 0.9, 1.1)):
    rod(f'trunk{k}', M['bronze'], (x, 0.12, PZ), (x, 0.12, PZ + 0.06), 0.012, segs=6, outline=0.001)
    ball(f'tree{k}', M['tree'], x, 0.12, PZ + 0.12, 0.1, outline=0.01)
HX, HY = -0.45, -0.95
loft('hull', M['hull'], [[(HX - 0.22, HY - 0.05, G + 0.0), (HX + 0.2, HY - 0.05, G + 0.0), (HX + 0.24, HY, G + 0.0), (HX + 0.2, HY + 0.05, G + 0.0), (HX - 0.22, HY + 0.05, G + 0.0)],
                         [(HX - 0.24, HY - 0.07, G + 0.06), (HX + 0.22, HY - 0.07, G + 0.06), (HX + 0.3, HY, G + 0.06), (HX + 0.22, HY + 0.07, G + 0.06), (HX - 0.24, HY + 0.07, G + 0.06)]], outline=0.004)
box('cabin', M['white'], HX - 0.05, HY, G + 0.055, 0.2, 0.1, 0.06, outline=0.003, bevel=0)
rod('funnel', M['dark'], (HX - 0.05, HY, G + 0.11), (HX - 0.05, HY, G + 0.17), 0.02, segs=10, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
