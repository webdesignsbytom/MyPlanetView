# A cartoon Saint Catherine's Monastery for the country maps, built in the set's shared look
# (../toon.py): the Sinai monastery's high granite fortress walls in the valley under the red
# mountains, the basilica's roof and bell tower and the little white mosque minaret rising inside,
# and the green garden of cypresses and olives outside the walls. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P st-catherines.py -- st-catherines-1024.png 1024 st-catherines.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8b888', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'rock': toon('rock', '#b8805a', shadow_mul=(0.84, 0.8, 0.78)),
    'wall': toon('wall', '#c8a878', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'wallDark': toon('wallDark', '#a88a5e'),
    'roof': toon('roof', '#6a6e76'),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'cypress': toon('cypress', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'olive': toon('olive', '#7a9a50', shadow_mul=(0.72, 0.8, 0.74)),
    'dark': flat('dark', '#3a3028'),
    'gold': toon('gold', '#e0b040', lift=0.3),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

for k, (x, y, r, h) in enumerate(((-0.5, 0.72, 0.36, 0.55), (0.2, 0.85, 0.34, 0.7), (0.72, 0.6, 0.3, 0.45), (-0.9, 0.2, 0.28, 0.35))):
    mt = lathe(f'mountain{k}', M['rock'], ((r, 0), (r * 0.7, h * 0.45), (r * 0.35, h * 0.85), (0.004, h)), G - 0.01, x, y, segs=9, outline=0.008, smooth=False)
    mt.visible_shadow = False

# ---------- the fortress walls ----------
CX, CY, W, D, H = 0.0, 0.05, 0.62, 0.5, 0.24
for name, (x, y, sx, sy) in {'front': (CX, CY - D / 2, W, 0.06), 'back': (CX, CY + D / 2, W, 0.06), 'left': (CX - W / 2, CY, 0.06, D), 'right': (CX + W / 2, CY, 0.06, D)}.items():
    box(f'wall{name}', M['wall'], x, y, G - 0.005, sx + 0.06, sy, H, outline=0.008, bevel=0)
for j in range(10):
    x = CX - W / 2 + 0.03 + j * (W - 0.06) / 9
    box(f'merlon{j}', M['wallDark'], x, CY - D / 2 - 0.02, G + H - 0.005, 0.03, 0.025, 0.03, outline=0.001, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'corner{sx}{sy}', M['wall'], CX + sx * W / 2, CY + sy * D / 2, G - 0.005, 0.1, 0.1, H + 0.04, outline=0.006, bevel=0)
box('gate', M['dark'], CX + 0.15, CY - D / 2 - 0.032, G - 0.005, 0.05, 0.006, 0.07, outline=0, bevel=0)
box('windowslit', M['dark'], CX - 0.1, CY - D / 2 - 0.032, G + 0.15, 0.02, 0.006, 0.04, outline=0, bevel=0)

# ---------- the basilica, bell tower and minaret ----------
box('basilica', M['wall'], CX - 0.02, CY + 0.05, G - 0.005, 0.22, 0.34, 0.27, outline=0.006, bevel=0)
loft('basilicaroof', M['roof'], [[(CX - 0.13, CY - 0.12, G + 0.265), (CX + 0.09, CY - 0.12, G + 0.265), (CX + 0.09, CY + 0.22, G + 0.265), (CX - 0.13, CY + 0.22, G + 0.265)],
                                 [(CX - 0.024, CY - 0.12, G + 0.34), (CX - 0.016, CY - 0.12, G + 0.34), (CX - 0.016, CY + 0.22, G + 0.34), (CX - 0.024, CY + 0.22, G + 0.34)]], outline=0.004)
box('belltower', M['wall'], CX - 0.02, CY - 0.14, G - 0.005, 0.08, 0.08, 0.4, outline=0.005, bevel=0)
box('belfry', M['dark'], CX - 0.02, CY - 0.182, G + 0.31, 0.03, 0.006, 0.05, outline=0, bevel=0)
pyramid('belltowerroof', M['roof'], CX - 0.02, CY - 0.14, G + 0.395, 0.09, 0.07, outline=0.003)
rod('cross', M['gold'], (CX - 0.02, CY - 0.14, G + 0.46), (CX - 0.02, CY - 0.14, G + 0.51), 0.005, segs=4, outline=0)
bar('crossbar', M['gold'], (CX - 0.035, CY - 0.14, G + 0.495), (CX - 0.005, CY - 0.14, G + 0.495), 0.007, outline=0)
lathe('minaret', M['white'], ((0.025, 0), (0.022, 0.3)), G - 0.005, CX + 0.18, CY + 0.12, segs=8, outline=0.003, smooth=False)
lathe('minaretcap', M['white'], ((0.032, 0), (0.032, 0.015), (0.004, 0.06)), G + 0.29, CX + 0.18, CY + 0.12, segs=8, outline=0.002, smooth=False)

# ---------- the garden ----------
for k, (x, y) in enumerate(((-0.55, -0.35), (-0.45, -0.5), (-0.62, -0.6), (0.5, -0.45), (0.6, -0.3))):
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.03, 0.12), (0.004, 0.28)), G - 0.005, x, y, segs=10, outline=0.004)
for k, (x, y) in enumerate(((-0.3, -0.6), (0.35, -0.65), (0.2, -0.45))):
    ball(f'olive{k}', M['olive'], x, y, G + 0.06, 0.065, outline=0.005)

turn(before, -20)
render(G)
