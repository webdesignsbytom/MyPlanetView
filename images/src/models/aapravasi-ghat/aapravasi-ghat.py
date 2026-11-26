# A cartoon Aapravasi Ghat for the country maps, built in the set's shared look (../toon.py): the
# immigration depot on the harbour of Port Louis, Mauritius, where half a million indentured
# labourers landed from India: the flight of basalt steps up from the sea, the low stone
# buildings of the depot with their arched openings and tin roofs, the hospital's ruined walls,
# the palms, and the mountains behind the town. Turned a little towards the camera.
# Run: blender -b --factory-startup -P aapravasi-ghat.py -- aapravasi-ghat-1024.png 1024 aapravasi-ghat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'basalt': toon('basalt', '#7a7670', shadow_mul=(0.8, 0.8, 0.86), lift=0.12),
    'stone': toon('stone', '#b8b0a2', lift=0.15),
    'roof': toon('roof', '#8a8e92'),
    'water': toon('water', '#2a8ac0', lift=0.3),
    'mountain': toon('mountain', '#4e8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'dark': flat('dark', '#2e2622'),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left

def palm(name, x, y, h=0.3):
    rod(name + "trunk", M["trunk"], (x, y, G), (x + 0.03, y, G + h), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f"{name}frond{j}", M["palm"], (x + 0.03, y, G + h), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + h - 0.05), 0.03, outline=0.002)


loft('harbour', M['water'], [strip(-1.31, -0.6, 1.32, G - 0.004), strip(-1.31, -0.6, 1.32, G + 0.008)], outline=0.002)
for k, (x, y, r, h) in enumerate(((-0.6, 1.0, 0.4, 0.45), (0.35, 1.0, 0.34, 0.55))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.5), (r * 0.2, h * 0.9), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    mt.visible_shadow = False

# ---------- the steps up from the sea ----------
for k in range(8):
    box(f'step{k}', M['basalt'], -0.15, -0.62 + k * 0.035, G - 0.04, 0.5, 0.04, 0.045 + 0.012 * k, outline=0.001, bevel=0)

# ---------- the depot buildings ----------
for k, (x, y, w, d) in enumerate(((-0.4, 0.05, 0.5, 0.22), (0.3, 0.05, 0.4, 0.22), (-0.05, 0.4, 0.7, 0.2))):
    box(f'depot{k}', M['stone'], x, y, G - 0.005, w, d, 0.15, outline=0.006, bevel=0)
    gable(f'depotroof{k}', M['roof'], x, y, G + 0.145, w, d, 0.07, ridge_x=True, over=0.012)
    n = int(w / 0.09)
    for j in range(n):
        arch(f'depotarch{k}{j}', M['dark'], x - w / 2 + (j + 0.5) * w / n, y - d / 2 - 0.003, G - 0.005, 0.045, 0.1)
# the hospital's ruined walls
for k in range(5):
    box(f'ruin{k}', M['basalt'], 0.65 + 0.06 * (k % 2), -0.3 + k * 0.08, G - 0.005, 0.12, 0.03, 0.05 + 0.03 * (k % 3), outline=0.002, bevel=0)

for k, (x, y) in enumerate(((-0.85, -0.25), (0.85, 0.35), (-0.9, 0.35), (0.5, -0.45))):
    palm(f'palm{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
