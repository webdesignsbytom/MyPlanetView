# A cartoon Sanctuary of Bom Jesus de Matosinhos, Congonhas, for the country maps, built in the set's
# shared look (../toon.py): the white baroque church with its two bell towers and carved soapstone
# doorway on top of its hill, the terrace and the zigzag staircase in front lined with Aleijadinho's
# twelve soapstone prophets on the balustrades, the little chapels of the Passion down the slope among
# palm trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P congonhas.py -- congonhas-1024.png 1024 congonhas.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'soapstone': toon('soapstone', '#8a9a88', shadow_mul=(0.82, 0.86, 0.86), lift=0.1),
    'stone': toon('stone', '#cfc4ae', lift=0.12),
    'blue': toon('blue', '#3a6ab0'),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2a2a'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
    'gold': toon('gold', '#e0b040', lift=0.2),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the hill: the church's terrace high at the back ----------
HZ = 0.26


def ground(y):
    return G + HZ * min(1.0, max(0.0, (y + 0.45) / 0.55))


for j in range(7):
    y0, y1 = -0.45 + j * 0.25, -0.45 + (j + 1) * 0.25
    y1 = min(y1, 1.3)
    if y0 >= 1.3:
        break
    x0, x1 = math.sqrt(max(0.0, 1.32 ** 2 - y0 * y0)), math.sqrt(max(0.0, 1.32 ** 2 - y1 * y1))
    quad = [(-x0, y0), (x0, y0), (x1, y1), (-x1, y1)]
    top = [(quad[0][0], y0, ground(y0)), (quad[1][0], y0, ground(y0)), (quad[2][0], y1, ground(y1)), (quad[3][0], y1, ground(y1))]
    sl = loft(f'hill{j}', M['hill'], [[(x, y, G - 0.01) for x, y in quad], top], outline=0.006)
    sl.visible_shadow = False
T = G + HZ

# ---------- the church ----------
CX, CY = 0.0, 0.42
box('nave', M['white'], CX, CY + 0.12, T - 0.005, 0.3, 0.42, 0.26, outline=0.008, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.16, CY - 0.09, T + 0.255), (CX + 0.16, CY - 0.09, T + 0.255), (CX + 0.16, CY + 0.33, T + 0.255), (CX - 0.16, CY + 0.33, T + 0.255)],
                             [(CX - 0.004, CY - 0.09, T + 0.34), (CX + 0.004, CY - 0.09, T + 0.34), (CX + 0.004, CY + 0.33, T + 0.34), (CX - 0.004, CY + 0.33, T + 0.34)]], outline=0.004)
box('front', M['white'], CX, CY - 0.09, T - 0.005, 0.3, 0.04, 0.3, outline=0.006, bevel=0)
loft('frontgable', M['white'], [[(CX - 0.12, CY - 0.11, T + 0.295), (CX + 0.12, CY - 0.11, T + 0.295), (CX + 0.12, CY - 0.07, T + 0.295), (CX - 0.12, CY - 0.07, T + 0.295)],
                                [(CX - 0.02, CY - 0.11, T + 0.38), (CX + 0.02, CY - 0.11, T + 0.38), (CX + 0.02, CY - 0.07, T + 0.38), (CX - 0.02, CY - 0.07, T + 0.38)]], outline=0.004)
rod('frontcross', M['stone'], (CX, CY - 0.09, T + 0.38), (CX, CY - 0.09, T + 0.43), 0.005, segs=4, outline=0)
box('doorway', M['soapstone'], CX, CY - 0.113, T - 0.005, 0.08, 0.006, 0.16, outline=0, bevel=0)
box('door', M['blue'], CX, CY - 0.116, T - 0.005, 0.05, 0.006, 0.11, outline=0, bevel=0)
for s in (-1, 1):
    box(f'frontwin{s}', M['blue'], CX + s * 0.08, CY - 0.113, T + 0.18, 0.035, 0.006, 0.06, outline=0, bevel=0)
    # the two bell towers with their onion-ish caps
    tx = CX + s * 0.2
    box(f'tower{s}', M['white'], tx, CY - 0.07, T - 0.005, 0.11, 0.11, 0.44, outline=0.006, bevel=0)
    box(f'belfry{s}', M['dark'], tx, CY - 0.127, T + 0.33, 0.04, 0.006, 0.06, outline=0, bevel=0)
    lathe(f'towercap{s}', M['soapstone'], ((0.065, 0), (0.06, 0.03), (0.035, 0.07), (0.01, 0.1), (0.003, 0.13)), T + 0.435, tx, CY - 0.07, segs=8, outline=0.003, smooth=False)
    ball(f'towerknob{s}', M['gold'], tx, CY - 0.07, T + 0.57, 0.01, outline=0.001)

# ---------- the terrace, the staircase and the prophets ----------
box('terrace', M['stone'], CX, CY - 0.2, T - 0.005, 0.7, 0.18, 0.02, outline=0.003, bevel=0)
box('terracewall', M['stone'], CX, CY - 0.29, ground(CY - 0.29) - 0.005 - 0.08, 0.7, 0.03, 0.12, outline=0.003, bevel=0)
# the zigzag flights: a landing in the middle with flights either side down to the bottom landing
for s in (-1, 1):
    for i in range(5):
        y = CY - 0.32 - i * 0.05
        box(f'flight{s}{i}', M['stone'], CX + s * 0.22, y, G - 0.005, 0.12, 0.05, ground(y) - G + 0.01, outline=0.002, bevel=0)
box('lowerlanding', M['stone'], CX, CY - 0.6, G - 0.005, 0.56, 0.1, ground(CY - 0.6) - G + 0.01, outline=0.003, bevel=0)
# the twelve prophets on the balustrades
spots = [(CX + s * x, y) for s in (-1, 1) for x, y in ((0.33, CY - 0.22), (0.12, CY - 0.27), (0.29, CY - 0.38), (0.16, CY - 0.45), (0.29, CY - 0.53), (0.18, CY - 0.6))]
for k, (x, y) in enumerate(spots):
    z = ground(y) + 0.02
    box(f'prophetplinth{k}', M['stone'], x, y, z - 0.02, 0.04, 0.04, 0.03, outline=0.002, bevel=0)
    rod(f'prophet{k}', M['soapstone'], (x, y, z + 0.01), (x, y, z + 0.09), 0.016, r2=0.011, segs=8, outline=0.002)
    ball(f'prophethead{k}', M['soapstone'], x, y, z + 0.1, 0.011, outline=0.001)
    bar(f'prophetarm{k}', M['soapstone'], (x, y, z + 0.07), (x + 0.02 * (1 if k % 2 else -1), y - 0.015, z + 0.1), 0.007, outline=0)

# ---------- the chapels of the Passion and palms down the slope ----------
for k, (x, y) in enumerate(((-0.65, -0.55), (-0.25, -0.85), (0.25, -0.85), (0.65, -0.55))):
    z = ground(y)
    box(f'chapel{k}', M['white'], x, y, z - 0.005, 0.14, 0.12, 0.1, outline=0.004, bevel=0)
    box(f'chapeldoor{k}', M['blue'], x, y - 0.062, z, 0.04, 0.006, 0.06, outline=0, bevel=0)
    loft(f'chapelroof{k}', M['roof'], [[(x - 0.08, y - 0.07, z + 0.095), (x + 0.08, y - 0.07, z + 0.095), (x + 0.08, y + 0.07, z + 0.095), (x - 0.08, y + 0.07, z + 0.095)],
                                       [(x - 0.004, y - 0.07, z + 0.14), (x + 0.004, y - 0.07, z + 0.14), (x + 0.004, y + 0.07, z + 0.14), (x - 0.004, y + 0.07, z + 0.14)]], outline=0.003)
for k, (x, y) in enumerate(((-0.85, 0.0), (0.85, 0.0), (-0.6, 0.65), (0.6, 0.65))):
    z = ground(y)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, z), (x + 0.02, y, z + 0.3), 0.014, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, z + 0.3), (x + 0.02 + 0.1 * math.cos(a), y + 0.1 * math.sin(a), z + 0.25), 0.022, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
