# Cartoon stone spheres of the Diquís for the country maps, built in the set's shared look
# (../toon.py): the perfectly round granite balls of Costa Rica's pre-Columbian chiefdoms, big and
# small, some still on their low stone platforms, on the green lawn of Finca 6 among banana plants
# and palms, with a thatched rancho, a stone-paved path, and a toucan on a branch.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P stone-spheres.py -- stone-spheres-1024.png 1024 stone-spheres.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'granite': toon('granite', '#9a948c', shadow_mul=(0.8, 0.8, 0.88), lift=0.3),
    'graniteLight': toon('graniteLight', '#b4aea4', shadow_mul=(0.8, 0.8, 0.88), lift=0.3),
    'platform': toon('platform', '#a89a84', shadow_mul=(0.8, 0.78, 0.84)),
    'path': toon('path2', '#c9bea6', lift=0.25),
    'banana': toon('banana', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'thatch': toon('thatch', '#c9a45a', shadow_mul=(0.84, 0.74, 0.62)),
    'wood': toon('wood', '#7a5238'),
    'toucan': toon('toucan', '#2a2628', lift=0.3),
    'bib': toon('bib', '#f4d860', lift=0.3),
    'beakOrange': toon('beakOrange', '#f08a3a'),
    'beakTip': flat('beakTip', '#c8302a'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(421)

# ---------- the path ----------
for k in range(9):
    box(f'path{k}', M['path'], -0.05 + 0.03 * math.sin(k), -1.05 + k * 0.13, G - 0.005, 0.2, 0.11, 0.012, outline=0.005, bevel=0)

# ---------- the spheres, some on their platforms ----------
SPHERES = [(-0.35, 0.25, 0.26, True), (0.4, 0.35, 0.2, True), (0.1, -0.15, 0.13, False), (-0.7, -0.25, 0.1, False), (0.75, -0.2, 0.15, True),
           (-0.25, 0.75, 0.12, False), (0.35, -0.6, 0.08, False)]
for k, (x, y, r, on_platform) in enumerate(SPHERES):
    z = G
    if on_platform:
        lathe(f'platform{k}', M['platform'], ((r * 1.35, 0), (r * 1.25, 0.05)), G - 0.005, x, y, segs=20, outline=0.012, smooth=False)
        z = G + 0.045
    ball(f'sphere{k}', M['granite' if k % 2 == 0 else 'graniteLight'], x, y, z + r * 0.98, r, outline=0.02)

# ---------- banana plants and palms ----------
for k, (x, y) in enumerate(((-1.0, 0.35), (-0.85, 0.75), (1.0, 0.45), (0.85, 0.8), (-1.05, -0.55))):
    rod(f'bananastem{k}', M['banana'], (x, y, G), (x, y, G + 0.2), 0.03, r2=0.022, segs=8, outline=0.008)
    for f in range(5):
        a = 2 * math.pi * f / 5 + k
        leaf = ball(f'bananaleaf{k}{f}', M['banana'], 0, 0, 0, 0.1, outline=0.01)
        leaf.scale = (1.4, 0.35, 0.12)
        leaf.rotation_euler = (0, -0.5, a)
        leaf.location = (x + 0.1 * math.cos(a), y + 0.1 * math.sin(a), G + 0.24)
for k, (x, y) in enumerate(((0.15, 1.05), (-0.6, 1.0), (1.1, -0.55))):
    h = rng.uniform(0.42, 0.52)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.04, y, G + h), 0.018, r2=0.013, segs=8, outline=0.007)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.04, y, G + h), (x + 0.04 + 0.14 * math.cos(b), y + 0.14 * math.sin(b), G + h - 0.07), 0.024, outline=0.006)

# ---------- a thatched rancho ----------
RX_, RY_ = 0.65, -0.75
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'ranchopost{sx}{sy}', M['wood'], (RX_ + sx * 0.12, RY_ + sy * 0.1, G), (RX_ + sx * 0.12, RY_ + sy * 0.1, G + 0.16), 0.012, segs=6, outline=0.004)
loft('ranchoroof', M['thatch'], [[(RX_ - 0.18, RY_ - 0.15, G + 0.16), (RX_ + 0.18, RY_ - 0.15, G + 0.16), (RX_ + 0.18, RY_ + 0.15, G + 0.16), (RX_ - 0.18, RY_ + 0.15, G + 0.16)],
                                 [(RX_ - 0.02, RY_ - 0.004, G + 0.3), (RX_ + 0.02, RY_ - 0.004, G + 0.3), (RX_ + 0.02, RY_ + 0.004, G + 0.3), (RX_ - 0.02, RY_ + 0.004, G + 0.3)]],
     outline=0.012)

# ---------- a toucan on a branch ----------
TX, TY = -0.62, 0.15
rod('perch', M['wood'], (TX - 0.04, TY, G), (TX, TY, G + 0.34), 0.016, segs=6, outline=0.005)
rod('perchbranch', M['wood'], (TX, TY, G + 0.3), (TX + 0.1, TY - 0.02, G + 0.34), 0.01, segs=6, outline=0.004)
tz = G + 0.34
t = ball('toucanbody', M['toucan'], 0, 0, 0, 0.035, outline=0.008)
t.scale = (0.9, 0.9, 1.3)
t.location = (TX + 0.06, TY - 0.01, tz + 0.04)
ball('toucanbib', M['bib'], TX + 0.05, TY - 0.035, tz + 0.06, 0.022, outline=0.004)
ball('toucanhead', M['toucan'], TX + 0.06, TY - 0.015, tz + 0.09, 0.022, outline=0.005)
rod('toucanbeak', M['beakOrange'], (TX + 0.065, TY - 0.035, tz + 0.09), (TX + 0.08, TY - 0.11, tz + 0.08), 0.016, r2=0.006, segs=8, outline=0.004)
ball('toucanbeaktip', M['beakTip'], TX + 0.08, TY - 0.11, tz + 0.08, 0.007, outline=0)
bar('toucantail', M['toucan'], (TX + 0.06, TY + 0.01, tz + 0.01), (TX + 0.065, TY + 0.03, tz - 0.06), 0.016, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
