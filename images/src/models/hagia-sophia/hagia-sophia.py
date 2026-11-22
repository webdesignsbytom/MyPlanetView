# A cartoon Hagia Sophia for the country maps, built in the set's shared look (../toon.py):
# the rose-ochre walls with their great corner buttresses, the wide shallow lead-grey dome on
# a drum ringed with windows, the half-domes before and behind it, and the four slender
# Ottoman minarets with their pointed lead caps; cypresses in the garden.
# Run: blender -b --factory-startup -P hagia-sophia.py -- hagia-sophia-1024.png 1024 hagia-sophia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ochre': toon('ochre', '#e0a487', shadow_mul=(0.8, 0.7, 0.74)),
    'ochreDark': toon('ochreDark', '#c98f74', shadow_mul=(0.8, 0.7, 0.74)),
    'lead': toon('lead', '#8e9aab', shadow_mul=(0.75, 0.75, 0.85), lift=0.3),
    'minaret': toon('minaret', '#efe8dc', shadow_mul=(0.82, 0.8, 0.9)),
    'window': flat('window', '#4b3a55'),
    'cypress': toon('cypress', '#3f8a4f', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
box('court', M['path'], 0, 0, G - 0.006, 1.75, 1.75, 0.02, outline=0.015, bevel=0)

# ---------- the walls and the corner buttresses ----------
BODY, BODY_H = 0.84, 0.42
box('body', M['ochre'], 0, 0, G, BODY, BODY, BODY_H, outline=0.035, bevel=0.008)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'buttress{sx}{sy}', M['ochreDark'], sx * 0.36, sy * 0.36, G, 0.2, 0.2, BODY_H + 0.14, outline=0.03, bevel=0.008)
        pyramid(f'buttresscap{sx}{sy}', M['lead'], sx * 0.36, sy * 0.36, G + BODY_H + 0.14, 0.22, 0.06, outline=0.02)


def wall_windows(i, a, at):
    for row, z in enumerate((G + 0.08, G + 0.24)):
        for col in (-0.12, 0.0, 0.12):
            x, y = at(col, -BODY / 2 - 0.006)
            box(f'win{i}{row}{col}', M['window'], x, y, z, 0.05, 0.02, 0.09, rot_z=a, outline=0, bevel=0)
            cyl(f'wintop{i}{row}{col}', M['window'], 0.025, 0.02, segs=10, outline=0,
                matrix=Matrix.Translation((x, y, z + 0.09)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))


each_side(wall_windows)

# ---------- the half-domes before and behind, and the great dome on its drum ----------
TOP = G + BODY_H
HALF = ((0.27, 0.0), (0.25, 0.08), (0.2, 0.15), (0.12, 0.2), (0.004, 0.22))
for sy in (-1, 1):
    # out at the walls' edges, lower than the great dome, as they are
    lathe(f'halfdome{sy}', M['lead'], tuple((r * 0.9, z * 0.9) for r, z in HALF), TOP - 0.02, 0, sy * 0.4, segs=28, outline=0.03)
DRUM_R, DRUM_H = 0.33, 0.1
cyl('drum', M['ochre'], DRUM_R, DRUM_H, segs=32, outline=0.03, smooth=True, matrix=Matrix.Translation((0, 0, TOP + DRUM_H / 2)))
for k in range(20):
    a = 2 * math.pi * k / 20
    box(f'drumwin{k}', M['window'], (DRUM_R + 0.004) * math.cos(a), (DRUM_R + 0.004) * math.sin(a), TOP + 0.025, 0.035, 0.02,
        0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
DOME = ((0.35, 0.0), (0.335, 0.07), (0.29, 0.14), (0.21, 0.2), (0.11, 0.24), (0.004, 0.255))
lathe('dome', M['lead'], DOME, TOP + DRUM_H, segs=36, outline=0.035)
rod('finial', M['gold'], (0, 0, TOP + DRUM_H + 0.25), (0, 0, TOP + DRUM_H + 0.36), 0.012, segs=6, outline=0.01)
ball('finialball', M['gold'], 0, 0, TOP + DRUM_H + 0.3, 0.025, outline=0.01)

# ---------- four pencil minarets ----------
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * 0.68, sy * 0.68
        lathe(f'minaretbase{sx}{sy}', M['minaret'], ((0.07, 0), (0.07, 0.14)), G, x, y, segs=8, outline=0.02, smooth=False)
        rod(f'minaret{sx}{sy}', M['minaret'], (x, y, G + 0.14), (x, y, G + 1.05), 0.042, r2=0.036, segs=14, outline=0.022)
        for h in (0.62, 0.9):
            cyl(f'balcony{sx}{sy}{h}', M['minaret'], 0.062, 0.025, segs=14, outline=0.016, matrix=Matrix.Translation((x, y, G + h)))
        lathe(f'minaretcap{sx}{sy}', M['lead'], ((0.045, 0), (0.004, 0.22)), G + 1.05, x, y, segs=14, outline=0.018)
        rod(f'minaretfin{sx}{sy}', M['gold'], (x, y, G + 1.26), (x, y, G + 1.33), 0.008, segs=6, outline=0.006)

# ---------- cypresses ----------
for k, (x, y) in enumerate(((-1.05, -0.38), (1.08, -0.3), (-0.35, -1.08))):
    rod(f'cypress{k}', M['cypress'], (x, y, G), (x, y, G + 0.36), 0.075, r2=0.0, segs=10, outline=0.025)

render(G)
