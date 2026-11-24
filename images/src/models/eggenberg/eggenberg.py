# A cartoon Schloss Eggenberg for the country maps, built in the set's shared look (../toon.py): the
# great baroque palace on the edge of Graz, its square plan of four wings round the courtyards with
# a round-roofed tower at each corner and the taller middle tower over the entrance, its pale walls
# with their rows of windows and the red-brown roofs, and the English landscape park round it with
# its lawns and peacocks. Turned a little towards the camera.
# Run: blender -b --factory-startup -P eggenberg.py -- eggenberg-1024.png 1024 eggenberg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'gravel': toon('gravel', '#e0d8c4', lift=0.15),
    'wall': toon('wall', '#efe6d4', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'roof': toon('roof', '#a8503e', shadow_mul=(0.86, 0.8, 0.8)),
    'window': flat('window', '#3a3a46'),
    'copper': toon('copper', '#4a8a6a', lift=0.12),
    'peacock': toon('peacock', '#2a6ab0', lift=0.15),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

S, D, H = 0.84, 0.16, 0.26     # the square's side, each wing's depth, the walls' height
CX, CY = 0.0, 0.12
box('forecourt', M['gravel'], CX, CY - S / 2 - 0.25, G - 0.004, 0.5, 0.4, 0.01, outline=0.001, bevel=0)
for k in range(4):
    a = k * math.pi / 2 - math.pi / 2
    nx, ny = round(math.cos(a)), round(math.sin(a))
    x, y = CX + nx * (S - D) / 2, CY + ny * (S - D) / 2
    w, d = (S, D) if ny else (D, S)
    box(f'wing{k}', M['wall'], x, y, G - 0.005, w, d, H, outline=0.008, bevel=0)
    loft(f'wingroof{k}', M['roof'], [[(x - w / 2, y - d / 2, G + H - 0.005), (x + w / 2, y - d / 2, G + H - 0.005), (x + w / 2, y + d / 2, G + H - 0.005), (x - w / 2, y + d / 2, G + H - 0.005)],
                                      [(x - (w / 2 if ny else 0.004), y - (d / 2 if nx else 0.004), G + H + 0.08), (x + (w / 2 if ny else 0.004), y - (d / 2 if nx else 0.004), G + H + 0.08),
                                       (x + (w / 2 if ny else 0.004), y + (d / 2 if nx else 0.004), G + H + 0.08), (x - (w / 2 if ny else 0.004), y + (d / 2 if nx else 0.004), G + H + 0.08)]], outline=0.004)
    # three floors of windows on the faces the camera sees
    if (nx, ny) in ((0, -1), (-1, 0)):
        n = 12
        for row in range(3):
            for j in range(n):
                t = -S / 2 + 0.06 + j * (S - 0.12) / (n - 1)
                if ny:
                    box(f'win{k}{row}{j}', M['window'], x + t, y - D / 2 - 0.003, G + 0.04 + row * 0.07, 0.025, 0.006, 0.04, outline=0, bevel=0)
                else:
                    box(f'win{k}{row}{j}', M['window'], x - D / 2 - 0.003, y + t, G + 0.04 + row * 0.07, 0.006, 0.025, 0.04, outline=0, bevel=0)
# the four corner towers with their round domed roofs
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = CX + sx * (S / 2 - 0.02), CY + sy * (S / 2 - 0.02)
        box(f'cornertower{sx}{sy}', M['wall'], x, y, G - 0.005, 0.14, 0.14, H + 0.08, outline=0.006, bevel=0)
        lathe(f'cornerroof{sx}{sy}', M['roof'], ((0.1, 0), (0.09, 0.04), (0.05, 0.08), (0.02, 0.1), (0.003, 0.14)), G + H + 0.075, x, y, segs=4, outline=0.004, smooth=False)
# the middle tower over the entrance
box('entrancetower', M['wall'], CX, CY - (S - D) / 2, G - 0.005, 0.16, D + 0.02, H + 0.16, outline=0.006, bevel=0)
box('entrance', M['window'], CX, CY - S / 2 - 0.004, G - 0.005, 0.06, 0.006, 0.11, outline=0, bevel=0)
lathe('entranceroof', M['copper'], ((0.11, 0), (0.09, 0.05), (0.05, 0.1), (0.02, 0.12), (0.003, 0.2)), G + H + 0.155, CX, CY - (S - D) / 2, segs=4, outline=0.004, smooth=False)

# ---------- the park ----------
for k, (x, y) in enumerate(((-0.75, -0.55), (0.75, -0.55), (-0.95, 0.0), (0.95, 0.05), (-0.6, 0.85), (0.6, 0.85))):
    if math.hypot(x, y) > 1.15:
        x, y = x * 0.9, y * 0.9
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.09), 0.015, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.19, 0.13, outline=0.012)
for k, (x, y) in enumerate(((0.35, -0.75), (-0.4, -0.85))):
    body = ball(f'peacock{k}', M['peacock'], 0, 0, 0, 0.02, outline=0.002)
    body.scale = (1.0, 1.5, 1.0)
    body.location = (x, y, G + 0.03)
    tail = ball(f'peacocktail{k}', M['copper'], 0, 0, 0, 0.04, outline=0.002)
    tail.scale = (1.4, 0.4, 1.0)
    tail.location = (x, y + 0.04, G + 0.05)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
