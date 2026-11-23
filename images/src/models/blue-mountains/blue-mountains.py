# Cartoon Blue and John Crow Mountains for the country maps, built in the set's shared look
# (../toon.py): Jamaica's misty blue-green peaks, rows of glossy coffee bushes on the terraced
# slopes with their red cherries, an old plantation great house with its veranda, mist drifting
# over the ridges, and tree ferns. Turned a little towards the camera.
# Run: blender -b --factory-startup -P blue-mountains.py -- blue-mountains-1024.png 1024 blue-mountains.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'peak': toon('peak', '#4a7a8a', shadow_mul=(0.74, 0.8, 0.88)),
    'peakGreen': toon('peakGreen', '#4f8a5a', shadow_mul=(0.7, 0.78, 0.8)),
    'mist': toon('mist', '#f2f4f8', shadow_mul=(0.84, 0.86, 0.94), lift=0.15),
    'coffee': toon('coffee', '#2f6e40', shadow_mul=(0.7, 0.78, 0.8)),
    'cherry': toon('cherry', '#d0302f'),
    'house': toon('house', '#f4efe2', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'roof': toon('roof', '#8a3a2c'),
    'veranda': toon('veranda', '#4f8a6a'),
    'window': flat('window', '#3a3640'),
    'fern': toon('fern', '#6aaa4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'road': toon('road', '#c8b08a', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(797)


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the peaks: green below, blue above, receding into the mist ----------
for k, (cx, cy, rx, ry, h) in enumerate(((-0.55, 0.65, 0.5, 0.38, 0.62), (0.15, 0.85, 0.5, 0.32, 0.72), (0.7, 0.55, 0.42, 0.35, 0.55))):
    rings = [ring(cx, cy, rx, ry, -0.01, k), ring(cx, cy, rx * 0.62, ry * 0.62, h * 0.45, k), ring(cx, cy, rx * 0.3, ry * 0.3, h * 0.8, k), ring(cx, cy, rx * 0.08, ry * 0.08, h, k)]
    lower = loft(f'peaklow{k}', M['peakGreen'], rings[0:2], outline=0.025, smooth=True)
    upper = loft(f'peakhigh{k}', M['peak'], rings[1:4], outline=0.025, smooth=True)
    lower.visible_shadow = upper.visible_shadow = False
for k, (x, y, z, r) in enumerate(((-0.3, 0.6, 0.42, 0.09), (-0.18, 0.62, 0.44, 0.11), (-0.05, 0.6, 0.41, 0.08), (0.42, 0.62, 0.38, 0.1), (0.55, 0.66, 0.4, 0.08))):
    ball(f'mist{k}', M['mist'], x, y, G + z, r, outline=0.01)

# ---------- terraced coffee rows on the slope in front ----------
for r in range(5):
    y = 0.05 - r * 0.14
    for j in range(9):
        x = -0.95 + j * 0.16
        if math.hypot(x, y) > 1.15 or (x > 0.3 and y > -0.35):
            continue
        ball(f'coffee{r}{j}', M['coffee'], x, y, G + 0.05, 0.055, outline=0.008)
        for c in range(2):
            ball(f'cherry{r}{j}{c}', M['cherry'], x + (c - 0.5) * 0.04, y - 0.045, G + 0.04 + c * 0.02, 0.012, outline=0.002)

# ---------- the plantation great house, and the road to it ----------
HX, HY = 0.62, -0.08
box('greathouse', M['house'], HX, HY, G - 0.005, 0.34, 0.2, 0.15, outline=0.016, bevel=0)
pyramid('greathouseroof', M['roof'], HX, HY, G + 0.145, 0.42, 0.12, outline=0.012)
box('verandaroof', M['veranda'], HX, HY - 0.13, G + 0.11, 0.36, 0.08, 0.012, outline=0.004, bevel=0)
for k in range(5):
    x = HX - 0.16 + k * 0.08
    rod(f'verandapost{k}', M['house'], (x, HY - 0.165, G), (x, HY - 0.165, G + 0.11), 0.006, segs=6, outline=0.002)
    box(f'greathousewin{k}', M['window'], x, HY - 0.104, G + 0.04, 0.028, 0.01, 0.05, outline=0, bevel=0)
box('road', M['road'], 0.55, -0.6, G - 0.004, 0.1, 0.8, 0.008, rot_z=-0.2, outline=0.004, bevel=0)

# ---------- tree ferns ----------
for k, (x, y) in enumerate(((-1.05, 0.05), (1.05, -0.3), (0.2, -0.95), (-0.6, -0.95))):
    h = rng.uniform(0.18, 0.24)
    rod(f'fernstem{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['fern'], (x, y, G + h), (x + 0.11 * math.cos(b), y + 0.11 * math.sin(b), G + h - 0.04), 0.022, outline=0.004)

turn(before, -20)
render(G)
