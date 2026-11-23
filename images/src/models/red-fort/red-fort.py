# A cartoon Red Fort for the country maps, built in the set's shared look (../toon.py): the Lahori
# Gate of Delhi's Mughal fort in red sandstone, its great arch between two octagonal towers topped
# with white marble pavilions, the row of little domed kiosks along its top, the crenellated walls
# running off either side, the dry moat, and the flag flying over it. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P red-fort.py -- red-fort-1024.png 1024 red-fort.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'red': toon('fortRed', '#c0543a', shadow_mul=(0.86, 0.74, 0.72)),
    'redDark': toon('fortRedDark', '#a0442e', shadow_mul=(0.86, 0.74, 0.72)),
    'marble': toon('marble', '#f4efe4', lift=0.2),
    'moat': toon('moat', '#a8b878', shadow_mul=(0.8, 0.82, 0.74)),
    'window': flat('window', '#2e2a28'),
    'saffron': toon('saffron', '#f08a2a', lift=0.3), 'white': toon('flagWhite', '#f8f6f0', lift=0.2), 'green': toon('flagGreen', '#2a8a3a'),
    'pole': toon('pole', '#d8d4cc'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the walls either side, the moat in front ----------
box('moat', M['moat'], 0.0, -0.3, G - 0.004, 2.6, 0.14, 0.01, outline=0.004, bevel=0)
for s in (-1, 1):
    box(f'wall{s}', M['red'], s * 0.72, 0.05, G - 0.005, 0.8, 0.14, 0.24, outline=0.012, bevel=0)
    for j in range(12):
        box(f'merlon{s}{j}', M['red'], s * 0.72 - 0.38 + j * 0.068, -0.02, G + 0.235, 0.035, 0.03, 0.04, outline=0.003, bevel=0)
    lathe(f'bastion{s}', M['redDark'], ((0.09, 0), (0.08, 0.28)), G - 0.005, s * 1.1, 0.05, segs=8, outline=0.01)
    lathe(f'bastionkiosk{s}', M['marble'], ((0.05, 0), (0.04, 0.03), (0.004, 0.06)), G + 0.275, s * 1.1, 0.05, segs=12, outline=0.004)

# ---------- the Lahori Gate ----------
GX, GY = 0.0, 0.05
box('gate', M['red'], GX, GY, G - 0.005, 0.42, 0.2, 0.34, outline=0.014, bevel=0)
box('archframe', M['redDark'], GX, GY - 0.103, G - 0.005, 0.16, 0.006, 0.24, outline=0, bevel=0)
box('arch', M['window'], GX, GY - 0.106, G, 0.1, 0.006, 0.18, outline=0, bevel=0)
for j in range(7):
    x = GX - 0.18 + j * 0.06
    lathe(f'chhatri{j}', M['marble'], ((0.022, 0), (0.018, 0.015), (0.004, 0.035)), G + 0.335, x, GY - 0.06, segs=10, outline=0.003)
for s in (-1, 1):
    tx = GX + s * 0.25
    lathe(f'gatetower{s}', M['red'], ((0.08, 0), (0.075, 0.38)), G - 0.005, tx, GY - 0.02, segs=8, outline=0.01)
    for k in range(6):
        a = 2 * math.pi * k / 6
        rod(f'pavilionpost{s}{k}', M['marble'], (tx + 0.055 * math.cos(a), GY - 0.02 + 0.055 * math.sin(a), G + 0.375), (tx + 0.055 * math.cos(a), GY - 0.02 + 0.055 * math.sin(a), G + 0.44),
            0.008, segs=5, outline=0.002)
    lathe(f'pavilionroof{s}', M['marble'], ((0.075, 0), (0.06, 0.03), (0.035, 0.06), (0.004, 0.09)), G + 0.44, tx, GY - 0.02, segs=12, outline=0.006)
# the flag over the gate
rod('flagpole', M['pole'], (GX, GY + 0.05, G + 0.335), (GX, GY + 0.05, G + 0.6), 0.006, segs=6, outline=0.002)
for k, c in enumerate(('saffron', 'white', 'green')):
    box(f'flag{k}', M[c], GX + 0.05, GY + 0.05, G + 0.56 - k * 0.025, 0.09, 0.006, 0.025, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.8, -0.6), (-0.4, -0.7), (0.4, -0.7), (0.8, -0.6), (-0.6, 0.6), (0.6, 0.6))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, 0.075, outline=0.011)

turn(before, -20)
render(G)
