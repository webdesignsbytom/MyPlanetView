# A cartoon Roskilde Cathedral for the country maps, built in the set's shared look (../toon.py):
# Denmark's red-brick Gothic cathedral, the resting place of its kings, its long body under a steep
# copper roof, the two slender green spires over the west front, the royal burial chapels added
# along its sides with their own gables and little domes, and the round apse at the east end.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P roskilde.py -- roskilde-1024.png 1024 roskilde.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'brick': toon('brick', '#b0503a', shadow_mul=(0.86, 0.78, 0.76), lift=0.04),
    'brickDark': toon('brickDark', '#8a3a2a'),
    'copper': toon('copper', '#5aa88a', lift=0.12),
    'window': flat('window', '#3a3a42'),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
box('lawn', M['lawn'], 0.1, -0.55, G - 0.003, 1.1, 0.3, 0.008, outline=0, bevel=0)

Y, X0, X1, W, H = 0.18, -0.38, 0.42, 0.24, 0.27
box('nave', M['brick'], (X0 + X1) / 2, Y, G - 0.005, X1 - X0, W, H, outline=0.009, bevel=0)
loft('naveroof', M['copper'], [[(X0, Y - W / 2 - 0.005, G + H - 0.005), (X1, Y - W / 2 - 0.005, G + H - 0.005), (X1, Y + W / 2 + 0.005, G + H - 0.005), (X0, Y + W / 2 + 0.005, G + H - 0.005)],
                               [(X0, Y - 0.004, G + H + 0.16), (X1, Y - 0.004, G + H + 0.16), (X1, Y + 0.004, G + H + 0.16), (X0, Y + 0.004, G + H + 0.16)]], outline=0.006)
for j in range(7):
    x = X0 + 0.06 + j * 0.11
    box(f'win{j}', M['window'], x, Y - W / 2 - 0.003, G + 0.08, 0.03, 0.006, 0.13, outline=0, bevel=0)
    box(f'buttress{j}', M['brickDark'], x + 0.055, Y - W / 2 - 0.012, G - 0.005, 0.02, 0.024, H - 0.04, outline=0.001, bevel=0)
lathe('apse', M['brick'], ((W / 2, 0), (W / 2, H)), G - 0.005, X1, Y, segs=12, outline=0.007, smooth=False)
lathe('apseroof', M['copper'], ((W / 2 + 0.005, 0), (0.004, 0.16)), G + H - 0.005, X1, Y, segs=12, outline=0.004, smooth=False)

# ---------- the west towers and spires ----------
for s in (-1, 1):
    tx, ty = X0 - 0.05, Y + s * 0.08
    box(f'tower{s}', M['brick'], tx, ty, G - 0.005, 0.1, 0.1, 0.42, outline=0.006, bevel=0)
    box(f'towerwin{s}', M['window'], tx - 0.053, ty, G + 0.3, 0.006, 0.03, 0.06, outline=0, bevel=0)
    lathe(f'spire{s}', M['copper'], ((0.06, 0), (0.035, 0.08), (0.012, 0.3), (0.004, 0.34)), G + 0.415, tx, ty, segs=8, outline=0.004, smooth=False)
    ball(f'spireball{s}', M['gold'], tx, ty, G + 0.76, 0.01, outline=0)
box('westfront', M['brick'], X0 - 0.04, Y, G - 0.005, 0.08, 0.06, 0.34, outline=0.005, bevel=0)
box('westportal', M['window'], X0 - 0.083, Y, G - 0.005, 0.006, 0.04, 0.1, outline=0, bevel=0)

# ---------- the royal chapels ----------
for k, (x, w) in enumerate(((-0.18, 0.14), (0.08, 0.12), (0.28, 0.16))):
    cy = Y - W / 2 - 0.07
    box(f'chapel{k}', M['brick'], x, cy, G - 0.005, w, 0.14, 0.19, outline=0.006, bevel=0)
    for j, (gw, gh) in enumerate(((w, 0.05), (w * 0.65, 0.05), (w * 0.3, 0.04))):
        box(f'chapelgable{k}{j}', M['brick'], x, cy - 0.06, G + 0.185 + j * 0.05, gw, 0.02, gh, outline=0.002, bevel=0)
    box(f'chapelwin{k}', M['window'], x, cy - 0.073, G + 0.05, 0.04, 0.006, 0.1, outline=0, bevel=0)
    if k == 1:
        lathe('chapeldome', M['copper'], ((0.05, 0), (0.045, 0.03), (0.02, 0.06), (0.004, 0.09)), G + 0.185, x, cy + 0.02, segs=12, outline=0.003)
for k, (x, y, r) in enumerate(((-0.8, -0.3, 0.11), (0.82, -0.3, 0.11), (-0.75, 0.5, 0.1), (0.75, 0.55, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
