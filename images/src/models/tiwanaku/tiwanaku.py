# A cartoon Tiwanaku for the country maps, built in the set's shared look (../toon.py): the ancient
# city on Bolivia's Altiplano, the Kalasasaya's walls of tall standing stones, the Gate of the Sun
# with its carved frieze in its corner and the Ponce monolith in its court, the sunken temple in
# front with stone heads in its walls, the Akapana's stepped mound behind, snowy peaks far off, and
# a llama. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tiwanaku.py -- tiwanaku-1024.png 1024 tiwanaku.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'altiplano': toon('altiplano', '#bfae74', shadow_mul=(0.8, 0.76, 0.68), lift=0.25),
    'andesite': toon('andesite', '#8a8a8e', shadow_mul=(0.8, 0.8, 0.88)),
    'sandstone': toon('sandstone', '#c49a6c', shadow_mul=(0.84, 0.76, 0.74)),
    'stoneLight': toon('stoneLight', '#d8b88a', shadow_mul=(0.84, 0.78, 0.76)),
    'earth': toon('earth', '#a8885a'),
    'mound': toon('mound', '#9aa060', shadow_mul=(0.76, 0.8, 0.78)),
    'snow': toon('snow', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'rock': toon('rock', '#8a7f78', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'llama': toon('llama', '#f4efe2', lift=0.2),
    'llamaDark': toon('llamaDark', '#8a6448'),
    'tuft': toon('tuft', '#a89a58', shadow_mul=(0.8, 0.76, 0.66)),
})

G = tile(M['altiplano'])
before = set(bpy.data.objects)
rng = random.Random(653)

# ---------- snowy peaks far off at the back ----------
for k, (x, y, r, h) in enumerate(((-0.55, 0.92, 0.22, 0.45), (-0.1, 1.0, 0.2, 0.38), (0.4, 0.95, 0.22, 0.5))):
    lathe(f'peak{k}', M['rock'], ((r, 0), (r * 0.55, h * 0.55)), G - 0.01, x, y, segs=7, outline=0.02, smooth=False)
    lathe(f'peaksnow{k}', M['snow'], ((r * 0.55, 0), (0.004, h * 0.45)), G - 0.01 + h * 0.55, x, y, segs=7, outline=0.012, smooth=False)

# ---------- the Akapana's stepped mound behind ----------
for k, (w, z) in enumerate(((0.7, 0.0), (0.56, 0.07), (0.42, 0.14))):
    box(f'akapana{k}', M['mound'] if k == 0 else M['earth'], 0.55, 0.62, G - 0.005 + z, w, w * 0.6, 0.075, outline=0.012, bevel=0)

# ---------- the Kalasasaya: a raised court walled with tall standing stones ----------
KX, KY, KW, KD = -0.25, 0.2, 0.9, 0.7
box('kalasasaya', M['stoneLight'], KX, KY, G - 0.005, KW, KD, 0.05, outline=0.012, bevel=0)
corners = [(KX - KW / 2, KY - KD / 2), (KX + KW / 2, KY - KD / 2), (KX + KW / 2, KY + KD / 2), (KX - KW / 2, KY + KD / 2)]
for k in range(4):
    (x0, y0), (x1, y1) = corners[k], corners[(k + 1) % 4]
    a = math.atan2(y1 - y0, x1 - x0)
    n = int(math.hypot(x1 - x0, y1 - y0) / 0.1)
    for j in range(n + 1):
        t = j / n
        if k == 0 and 0.4 < t < 0.6:
            continue        # the stair up to the court
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        box(f'pillar{k}{j}', M['sandstone'], x, y, G + 0.04, 0.04, 0.05, 0.2, rot_z=a, outline=0.008, bevel=0)
        if j < n:
            box(f'infill{k}{j}', M['stoneLight'], x + (x1 - x0) / n / 2, y + (y1 - y0) / n / 2, G + 0.04, 0.06, 0.035, 0.09, rot_z=a, outline=0.006, bevel=0)
for s in range(4):
    box(f'stair{s}', M['stoneLight'], KX, KY - KD / 2 - 0.05 + s * 0.012, G - 0.005, 0.14, 0.1 - s * 0.02, 0.012 * (s + 1), outline=0.004, bevel=0)

# the Gate of the Sun, in the court's north-west corner, and the Ponce monolith in the middle
GX, GY = KX - 0.28, KY + 0.18
box('gatesun', M['andesite'], GX, GY, G + 0.04, 0.24, 0.05, 0.2, outline=0.012, bevel=0)
box('gatedoor', M['window'], GX, GY - 0.027, G + 0.04, 0.07, 0.01, 0.11, outline=0, bevel=0)
box('gatefrieze', M['rock'], GX, GY - 0.028, G + 0.17, 0.2, 0.01, 0.05, outline=0, bevel=0)
for j in range(7):
    box(f'friezefigure{j}', M['andesite'], GX - 0.09 + j * 0.03, GY - 0.032, G + 0.18, 0.018, 0.01, 0.03, outline=0, bevel=0)
MX, MY = KX + 0.05, KY + 0.05
box('monolithbase', M['stoneLight'], MX, MY, G + 0.04, 0.07, 0.07, 0.02, outline=0.004, bevel=0)
box('monolith', M['sandstone'], MX, MY, G + 0.06, 0.05, 0.04, 0.2, outline=0.008, bevel=0.006)
box('monolithhead', M['sandstone'], MX, MY, G + 0.25, 0.062, 0.05, 0.06, outline=0.008, bevel=0.006)
for sx in (-1, 1):
    box(f'monolitheye{sx}', M['window'], MX + sx * 0.014, MY - 0.026, G + 0.28, 0.012, 0.004, 0.012, outline=0, bevel=0)

# ---------- the sunken temple in front, stone heads in its walls ----------
TX, TY, TS = 0.35, -0.35, 0.42
box('templefloor', M['earth'], TX, TY, G - 0.004, TS, TS, 0.006, outline=0.004, bevel=0)
for k, (dx, dy, w, d) in enumerate(((0, -TS / 2, TS, 0.04), (0, TS / 2, TS, 0.04), (-TS / 2, 0, 0.04, TS), (TS / 2, 0, 0.04, TS))):
    box(f'templewall{k}', M['stoneLight'], TX + dx, TY + dy, G - 0.005, w, d, 0.07, outline=0.008, bevel=0)
for j in range(5):
    x = TX - 0.16 + j * 0.08
    ball(f'stonehead{j}', M['stoneLight'], x, TY + TS / 2 - 0.024, G + 0.04, 0.017, outline=0.004)
    ball(f'stoneheadside{j}', M['stoneLight'], TX - TS / 2 + 0.024, TY - 0.16 + j * 0.08, G + 0.04, 0.017, outline=0.004)

# ---------- a llama, and tufts of ichu grass ----------
LX, LY = -0.6, -0.55
for k, (dx, dy) in enumerate(((-0.04, -0.018), (-0.04, 0.018), (0.04, -0.018), (0.04, 0.018))):
    rod(f'llamaleg{k}', M['llama'], (LX + dx, LY + dy, G), (LX + dx, LY + dy, G + 0.08), 0.008, segs=6, outline=0.002)
box('llamabody', M['llama'], LX, LY, G + 0.075, 0.12, 0.05, 0.05, outline=0.006, bevel=0.016)
rod('llamaneck', M['llama'], (LX + 0.05, LY, G + 0.1), (LX + 0.07, LY, G + 0.19), 0.016, segs=8, outline=0.004)
box('llamahead', M['llama'], LX + 0.085, LY, G + 0.185, 0.05, 0.03, 0.025, outline=0.004, bevel=0.008)
for sy in (-1, 1):
    bar(f'llamaear{sy}', M['llamaDark'], (LX + 0.07, LY + sy * 0.01, G + 0.205), (LX + 0.065, LY + sy * 0.014, G + 0.235), 0.008, outline=0.002)
box('llamablanket', M['llamaDark'], LX, LY, G + 0.12, 0.06, 0.055, 0.012, outline=0.003, bevel=0)
for k in range(22):
    x, y = rng.uniform(-1.2, 1.2), rng.uniform(-1.2, 0.9)
    if math.hypot(x, y) > 1.26 or (abs(x - KX) < 0.55 and abs(y - KY) < 0.45) or (abs(x - TX) < 0.3 and abs(y - TY) < 0.3) or (abs(x - 0.55) < 0.4 and abs(y - 0.62) < 0.25):
        continue
    lathe(f'tuft{k}', M['tuft'], ((0.03, 0), (0.004, 0.06)), G, x, y, segs=6, outline=0.004, smooth=False)

turn(before, -20)
render(G)
