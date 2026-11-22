# A cartoon Borobudur for the country maps, built in the set's shared look (../toon.py): the
# grey stone mountain of terraces: five square terraces with stairs up the middle of each
# side, three round terraces ringed with little bell-shaped stupas, and the great stupa on
# top; jungle round it.
# Run: blender -b --factory-startup -P borobudur.py -- borobudur-1024.png 1024 borobudur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#a19b90', shadow_mul=(0.76, 0.76, 0.86)),
    'stoneDark': toon('stoneDark', '#86817a', shadow_mul=(0.76, 0.76, 0.86)),
    'stairs': toon('stairs', '#c2bcb0'),
    'jungle': toon('jungle', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a5a3c'),
})

G = tile()
BELL = ((0.045, 0), (0.05, 0.02), (0.048, 0.05), (0.036, 0.08), (0.016, 0.1), (0.006, 0.11))

# ---------- five square terraces, each with stairs up the middle of every side ----------
z = G - 0.005
SIDES = (1.5, 1.34, 1.18, 1.02, 0.88)
TERRACE_H = 0.085
for k, side in enumerate(SIDES):
    box(f'terrace{k}', M['stone'] if k % 2 == 0 else M['stoneDark'], 0, 0, z, side, side, TERRACE_H, outline=0.025, bevel=0.006)
    z += TERRACE_H
SQUARE_TOP = z


def stairs(i, a, at):
    for k, side in enumerate(SIDES):
        x, y = at(0, -side / 2 - 0.01)
        box(f'stairs{i}{k}', M['stairs'], x, y, G - 0.005 + k * TERRACE_H, 0.12, 0.05, TERRACE_H + 0.01, rot_z=a, outline=0.012,
            bevel=0)


each_side(stairs)

# ---------- three round terraces ringed with little stupas ----------
for k, (r, count) in enumerate(((0.42, 16), (0.33, 12), (0.24, 8))):
    lathe(f'round{k}', M['stone'], ((r, 0), (r, 0.05)), z, segs=40, outline=0.022, smooth=True)
    z += 0.05
    for j in range(count):
        a = 2 * math.pi * (j + 0.5 * (k % 2)) / count
        x, y = (r - 0.05) * math.cos(a), (r - 0.05) * math.sin(a)
        lathe(f'stupa{k}{j}', M['stone'], BELL, z, x, y, segs=14, outline=0.014)
        box(f'stupatop{k}{j}', M['stoneDark'], x, y, z + 0.105, 0.016, 0.016, 0.03, outline=0, bevel=0)

# ---------- the great stupa on top ----------
lathe('mainstupa', M['stone'], tuple((r * 3.4, h * 3.4) for r, h in BELL), z, segs=32, outline=0.03)
box('harmika', M['stoneDark'], 0, 0, z + 0.36, 0.08, 0.08, 0.05, outline=0.015, bevel=0)
lathe('pinnacle', M['stoneDark'], ((0.025, 0), (0.004, 0.16)), z + 0.41, segs=10, outline=0.014)

# ---------- jungle ----------
for k, (x, y, r) in enumerate(((1.08, -0.4, 0.17), (-1.08, -0.42, 0.16), (-0.98, 0.62, 0.18), (1.0, 0.6, 0.16))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.18), 0.03, segs=8, outline=0.015)
    ball(f'tree{k}', M['jungle'], x, y, G + 0.25, r, outline=0.025)
    ball(f'tree{k}b', M['jungle'], x + r * 0.6, y - r * 0.3, G + 0.2, r * 0.7, outline=0.022)

render(G)
