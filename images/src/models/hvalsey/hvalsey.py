# A cartoon Hvalsey Church for the country maps, built in the set's shared look (../toon.py): the
# best-kept Norse ruin in Greenland, at Kujataa, where the last written record of the Norse
# settlers, a wedding in 1408, was made: the roofless stone church with its gables standing
# and its small windows, the turf walls of the farm round it, the sheep of today's Inuit
# farmers grazing, the fjord in front and the bare mountains behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hvalsey.py -- hvalsey-1024.png 1024 hvalsey.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#94bc5c', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'mountain': toon('mountain', '#8a8a86', shadow_mul=(0.78, 0.78, 0.84)),
    'snow': toon('snow', '#f4f4f0', lift=0.3),
    'stone': toon('stone', '#9a948a', shadow_mul=(0.8, 0.8, 0.86), lift=0.14),
    'turf': toon('turf', '#7aa050', shadow_mul=(0.72, 0.78, 0.8)),
    'water': toon('water', '#3a7ab0', lift=0.3),
    'wool': toon('wool', '#f2eee4', lift=0.25),
    'dark': flat('dark', '#2e2622'),
})

G = tile()
before = set(bpy.data.objects)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('fjord', M['water'], [strip(-1.31, -0.6, 1.32, G - 0.004), strip(-1.31, -0.6, 1.32, G + 0.008)], outline=0.002)
for k, (x, y, r, h) in enumerate(((-0.6, 1.0, 0.45, 0.55), (0.35, 1.02, 0.42, 0.65))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.25, h * 0.85), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    mt.visible_shadow = False
    lathe(f'snowcap{k}', M['snow'], ((r * 0.25 + 0.004, 0), (0.0, h * 0.15 + 0.004)), G - 0.01 + h * 0.85, x, y, segs=20, outline=0.003)

# ---------- the roofless church ----------
CX, CY = 0.0, 0.05
W, D, H = 0.3, 0.5, 0.2
for s in (-1, 1):
    box(f'sidewall{s}', M['stone'], CX + s * (W / 2 - 0.02), CY, G - 0.005, 0.04, D, H, outline=0.005, bevel=0)
    gable(f'gableend{s}', M['stone'], CX, CY + s * (D / 2 - 0.02), G + H - 0.005, W, 0.04, 0.16, outline=0.005)
    box(f'endwall{s}', M['stone'], CX, CY + s * (D / 2 - 0.02), G - 0.005, W, 0.04, H, outline=0.005, bevel=0)
arch('door', M['dark'], CX, CY - D / 2 - 0.003, G - 0.005, 0.06, 0.12)
arch('gablewin', M['dark'], CX, CY - D / 2 - 0.003, G + 0.22, 0.04, 0.08)
for j in range(3):
    box(f'sidewin{j}', M['dark'], CX + W / 2 + 0.003, CY - 0.15 + j * 0.15, G + 0.1, 0.006, 0.025, 0.05, outline=0, bevel=0)
box('floor', M['turf'], CX, CY, G - 0.004, W - 0.08, D - 0.08, 0.008, outline=0, bevel=0)

# ---------- the turf walls of the farm ----------
for k, (x, y, sx, sy) in enumerate(((-0.55, 0.1, 0.3, 0.2), (0.55, -0.1, 0.25, 0.28), (-0.45, -0.35, 0.22, 0.16))):
    for j, (dx, dy, wx, wy) in enumerate(((0, -sy / 2, sx, 0.05), (0, sy / 2, sx, 0.05), (-sx / 2, 0, 0.05, sy), (sx / 2, 0, 0.05, sy))):
        box(f'turfwall{k}{j}', M['turf'], x + dx, y + dy, G - 0.005, wx, wy, 0.06, outline=0.003, bevel=0)

# ---------- sheep ----------
for k, (x, y) in enumerate(((0.35, -0.45), (0.5, -0.38), (-0.2, -0.45), (0.7, 0.35), (-0.7, 0.45))):
    b = ball(f'sheep{k}', M['wool'], 0, 0, 0, 0.035, outline=0.003)
    b.scale = (1.4, 1.0, 0.9)
    b.location = (x, y, G + 0.045)
    ball(f'sheephead{k}', M['dark'], x + 0.045, y, G + 0.055, 0.016, outline=0.001)
    for dx in (-0.025, 0.025):
        rod(f'sheepleg{k}{dx}', M['dark'], (x + dx, y, G), (x + dx, y, G + 0.025), 0.005, segs=6, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
