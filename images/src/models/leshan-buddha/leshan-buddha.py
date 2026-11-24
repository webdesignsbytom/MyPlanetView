# A cartoon Leshan Giant Buddha for the country maps, built in the set's shared look (../toon.py):
# the 71-metre Maitreya carved out of the red sandstone cliff where three rivers meet, seated with
# his hands on his knees and his feet at the water, his curled hair and long ears, greenery on the
# cliff top, the stairway carved down beside him, and a tour boat on the river. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P leshan-buddha.py -- leshan-buddha-1024.png 1024 leshan-buddha.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#7a9a8a', shadow_mul=(0.76, 0.86, 0.84), lift=0.25),
    'cliff': toon('cliff', '#b8684a', shadow_mul=(0.86, 0.76, 0.74)),
    'cliffDark': toon('cliffDark', '#8a4a34', shadow_mul=(0.86, 0.76, 0.74)),
    'stone': toon('stone', '#c8886a', shadow_mul=(0.86, 0.8, 0.78), lift=0.08),
    'hair': toon('hair', '#5a4a44'),
    'eye': flat('eye', '#3a2a24'),
    'green': toon('green', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'boat': toon('boat', '#f6f4ee', lift=0.2),
    'boatRoof': toon('boatRoof', '#d83a2c'),
    'temple': toon('temple', '#b8302a'),
    'roof': toon('roof', '#4a4a50'),
})

G = tile(M['river'])
before = set(bpy.data.objects)

# ---------- the cliff with its niche ----------
CY = 0.35
box('cliffleft', M['cliff'], -0.7, CY + 0.15, G - 0.01, 0.6, 0.7, 0.9, outline=0.012, bevel=0)
box('cliffright', M['cliff'], 0.7, CY + 0.15, G - 0.01, 0.6, 0.7, 0.9, outline=0.012, bevel=0)
box('cliffback', M['cliffDark'], 0.0, CY + 0.42, G - 0.01, 0.82, 0.16, 0.9, outline=0.01, bevel=0)
for s in (-1, 1):
    for j in range(4):
        bar(f'streak{s}{j}', M['cliffDark'], (s * (0.5 + j * 0.13), CY - 0.205, G + 0.05), (s * (0.5 + j * 0.13), CY - 0.205, G + 0.85), 0.03, outline=0)
for k, (x, y) in enumerate(((-0.75, CY + 0.25), (-0.45, CY + 0.4), (0.0, CY + 0.45), (0.45, CY + 0.4), (0.75, CY + 0.25), (-0.95, CY + 0.0), (0.95, CY + 0.0))):
    ball(f'green{k}', M['green'], x, y, G + 0.92, 0.12, outline=0.01)
box('temple', M['temple'], 0.7, CY + 0.25, G + 0.885, 0.16, 0.12, 0.08, outline=0.005, bevel=0)
pyramid('templeroof', M['roof'], 0.7, CY + 0.25, G + 0.96, 0.2, 0.06, outline=0.004)
for j in range(10):
    box(f'stair{j}', M['stone'], -0.4, CY - 0.17 + j * 0.0, G + 0.08 * j, 0.06, 0.06, 0.02, outline=0.002, bevel=0)

# ---------- the Buddha ----------
BX, BY = 0.0, CY + 0.15
# legs and lap
for s in (-1, 1):
    b = ball(f'knee{s}', M['stone'], 0, 0, 0, 0.11, outline=0.01)
    b.scale = (0.8, 1.6, 1.0)
    b.location = (BX + s * 0.13, BY - 0.15, G + 0.2)
    rod(f'shin{s}', M['stone'], (BX + s * 0.13, BY - 0.3, G + 0.18), (BX + s * 0.13, BY - 0.3, G), 0.06, segs=10, outline=0.008)
    b = ball(f'foot{s}', M['stone'], 0, 0, 0, 0.06, outline=0.006)
    b.scale = (0.8, 1.3, 0.55)
    b.location = (BX + s * 0.13, BY - 0.33, G + 0.02)
    b = ball(f'hand{s}', M['stone'], 0, 0, 0, 0.05, outline=0.005)
    b.scale = (0.9, 1.2, 0.6)
    b.location = (BX + s * 0.13, BY - 0.22, G + 0.31)
    rod(f'arm{s}', M['stone'], (BX + s * 0.2, BY - 0.02, G + 0.58), (BX + s * 0.15, BY - 0.18, G + 0.32), 0.05, segs=10, outline=0.007)
b = ball('torso', M['stone'], 0, 0, 0, 0.2, outline=0.012)
b.scale = (1.0, 0.7, 1.35)
b.location = (BX, BY, G + 0.45)
b = ball('head', M['stone'], 0, 0, 0, 0.12, outline=0.01)
b.scale = (1.0, 0.9, 1.1)
b.location = (BX, BY - 0.02, G + 0.76)
for j in range(14):
    a = 2 * math.pi * j / 14
    ball(f'curl{j}', M['hair'], BX + 0.1 * math.cos(a), BY - 0.02 + 0.09 * math.sin(a), G + 0.84, 0.03, outline=0.002)
ball('ushnisha', M['hair'], BX, BY - 0.02, G + 0.9, 0.05, outline=0.004)
for s in (-1, 1):
    b = ball(f'ear{s}', M['stone'], 0, 0, 0, 0.04, outline=0.004)
    b.scale = (0.4, 0.6, 1.6)
    b.location = (BX + s * 0.12, BY - 0.02, G + 0.73)
    box(f'eye{s}', M['eye'], BX + s * 0.045, BY - 0.12, G + 0.78, 0.04, 0.004, 0.008, outline=0, bevel=0)
box('mouth', M['eye'], BX, BY - 0.122, G + 0.7, 0.04, 0.004, 0.006, outline=0, bevel=0)

# ---------- the boat ----------
box('boathull', M['boat'], 0.45, -0.65, G - 0.002, 0.32, 0.11, 0.04, outline=0.004, bevel=0)
box('boatroof', M['boatRoof'], 0.45, -0.65, G + 0.075, 0.26, 0.12, 0.015, outline=0.003, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'boatpost{sx}{sy}', M['boat'], (0.45 + sx * 0.11, -0.65 + sy * 0.045, G + 0.035), (0.45 + sx * 0.11, -0.65 + sy * 0.045, G + 0.08), 0.005, segs=4, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
