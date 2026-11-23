# A cartoon Bran Castle for the country maps, built in the set's shared look (../toon.py): "Dracula's
# castle" on its crag above the Bran pass, its white-walled towers and wings under steep red-tiled
# roofs, the round tower with its cone, the tall square keep, and the dark pine forest of the
# Carpathians round the rock. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bran-castle.py -- bran-castle-1024.png 1024 bran-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#9a9088', shadow_mul=(0.84, 0.84, 0.9)),
    'rockDark': toon('rockDark', '#7a7068', shadow_mul=(0.84, 0.84, 0.9)),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.84, 0.9), lift=0.12),
    'roof': toon('roof', '#c4573a', shadow_mul=(0.86, 0.74, 0.72)),
    'wood': toon('wood', '#7a4a2e'),
    'window': flat('window', '#2e2a30'),
    'pine': toon('pine', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2153)

# ---------- the crag ----------
CX, CY = 0.0, 0.2
lathe('crag', M['rock'], ((0.62, 0), (0.55, 0.12), (0.46, 0.26), (0.42, 0.32)), G - 0.01, CX, CY, segs=9, outline=0.014, smooth=False)
for j in range(5):
    a = math.radians(210 + j * 30)
    bar(f'cragstreak{j}', M['rockDark'], (CX + 0.6 * math.cos(a), CY + 0.6 * math.sin(a), G + 0.02), (CX + 0.44 * math.cos(a), CY + 0.44 * math.sin(a), G + 0.3), 0.05, outline=0)
T = G + 0.315


def windows(name, x, y, z, w, rows, cols, face=-1):
    for r in range(rows):
        for c in range(cols):
            box(f'{name}win{r}{c}', M['window'], x - w / 2 + (c + 0.5) * w / cols, y + face * 0.001, z + 0.04 + r * 0.08, 0.025, 0.006, 0.04, outline=0, bevel=0)


# ---------- the wings round the courtyard ----------
box('wingfront', M['white'], CX - 0.02, CY - 0.17, T - 0.005, 0.5, 0.16, 0.22, outline=0.01, bevel=0)
windows('wingfront', CX - 0.02, CY - 0.25, T, 0.4, 2, 5)
loft('wingfrontroof', M['roof'], [[(CX - 0.28, CY - 0.26, T + 0.215), (CX + 0.24, CY - 0.26, T + 0.215), (CX + 0.24, CY - 0.08, T + 0.215), (CX - 0.28, CY - 0.08, T + 0.215)],
                                  [(CX - 0.28, CY - 0.174, T + 0.33), (CX + 0.24, CY - 0.174, T + 0.33), (CX + 0.24, CY - 0.166, T + 0.33), (CX - 0.28, CY - 0.166, T + 0.33)]], outline=0.008)
box('wingback', M['white'], CX + 0.05, CY + 0.15, T - 0.005, 0.46, 0.16, 0.3, outline=0.01, bevel=0)
windows('wingback', CX + 0.05, CY + 0.07, T + 0.05, 0.36, 2, 4)
loft('wingbackroof', M['roof'], [[(CX - 0.2, CY + 0.06, T + 0.295), (CX + 0.3, CY + 0.06, T + 0.295), (CX + 0.3, CY + 0.24, T + 0.295), (CX - 0.2, CY + 0.24, T + 0.295)],
                                 [(CX - 0.2, CY + 0.146, T + 0.42), (CX + 0.3, CY + 0.146, T + 0.42), (CX + 0.3, CY + 0.154, T + 0.42), (CX - 0.2, CY + 0.154, T + 0.42)]], outline=0.008)
box('galleryfront', M['wood'], CX - 0.02, CY - 0.258, T + 0.12, 0.3, 0.02, 0.06, outline=0.003, bevel=0)

# ---------- the round tower, the keep and the little towers ----------
RX, RY = CX - 0.3, CY - 0.05
lathe('roundtower', M['white'], ((0.12, 0), (0.12, 0.42)), T - 0.005, RX, RY, segs=18, outline=0.009)
for j in range(3):
    a = math.radians(240 + j * 30)
    box(f'roundwin{j}', M['window'], RX + 0.12 * math.cos(a), RY + 0.12 * math.sin(a), T + 0.25, 0.025, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('roundcone', M['roof'], ((0.15, 0), (0.004, 0.28)), T + 0.41, RX, RY, segs=18, outline=0.008)
KX, KY = CX + 0.27, CY + 0.0
box('keep', M['white'], KX, KY, T - 0.005, 0.16, 0.16, 0.56, outline=0.01, bevel=0)
windows('keep', KX, KY - 0.08, T + 0.2, 0.12, 3, 2)
box('keepgallery', M['wood'], KX, KY, T + 0.53, 0.2, 0.2, 0.06, outline=0.005, bevel=0)
pyramid('keeproof', M['roof'], KX, KY, T + 0.585, 0.24, 0.24, outline=0.008)
lathe('turret', M['white'], ((0.05, 0), (0.05, 0.16)), T + 0.2, CX + 0.0, CY + 0.25, segs=12, outline=0.005)
lathe('turretcone', M['roof'], ((0.065, 0), (0.004, 0.14)), T + 0.355, CX + 0.0, CY + 0.25, segs=12, outline=0.005)

# ---------- the pine forest ----------
for k in range(16):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.72, 1.12)
    x, y = r * math.cos(a), 0.15 + r * math.sin(a) * 0.9
    if math.hypot(x, y) > 1.2 or (y < -0.3 and abs(x) < 0.35):
        continue
    h = rng.uniform(0.24, 0.36)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.012, segs=6, outline=0.003)
    lathe(f'pine{k}', M['pine'], ((0.07, 0), (0.05, h * 0.4), (0.004, h)), G + 0.04, x, y, segs=8, outline=0.006)

turn(before, -20)
render(G)
