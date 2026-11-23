# A cartoon Hoi An for the country maps, built in the set's shared look (../toon.py): the Japanese
# Covered Bridge with its little tiled roof over the canal, the old town's yellow shophouses with
# dark tiled roofs along the Thu Bồn river, silk lanterns strung between them, and a lantern boat
# on the water. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hoi-an.py -- hoi-an-1024.png 1024 hoi-an.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'street': toon('street', '#d8c8a8', shadow_mul=(0.86, 0.82, 0.8), lift=0.2),
    'river': toon('river', '#5a9a8a', shadow_mul=(0.76, 0.86, 0.88), lift=0.25),
    'yellow': toon('yellow', '#f0c850', lift=0.2),
    'ochre': toon('ochre', '#e8a848'),
    'roof': toon('roof', '#7a4a3a', shadow_mul=(0.86, 0.8, 0.8)),
    'wood': toon('wood', '#8a4a2e'),
    'bridgeWall': toon('bridgeWall', '#e8a090'),
    'shutter': toon('shutter', '#3f7a6a'),
    'door': flat('door', '#3a2a24'),
    'l0': toon('l0', '#e8402c', lift=0.3), 'l1': toon('l1', '#f8c030', lift=0.35), 'l2': toon('l2', '#b44ad8', lift=0.3), 'l3': toon('l3', '#2f8ad8', lift=0.3),
    'boat': toon('boat', '#6a4a30'),
    'string': flat('string', '#3a2a24'),
})

G = tile(M['street'])
before = set(bpy.data.objects)

box('river', M['river'], 0.0, -0.55, G - 0.004, 2.7, 0.55, 0.01, outline=0.004, bevel=0)

# ---------- the shophouses ----------
for k in range(7):
    x = -0.95 + k * 0.32
    y = 0.4
    h = 0.2 + 0.05 * (k % 2)
    box(f'house{k}', M['yellow' if k % 3 else 'ochre'], x, y, G - 0.005, 0.3, 0.32, h, outline=0.008, bevel=0)
    box(f'housedoor{k}', M['door'], x, y - 0.162, G - 0.005, 0.1, 0.006, 0.11, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'houseshutter{k}{s}', M['shutter'], x + s * 0.09, y - 0.162, G + h * 0.62, 0.05, 0.006, 0.05, outline=0, bevel=0)
    box(f'porchroof{k}', M['roof'], x, y - 0.2, G + h * 0.5, 0.31, 0.09, 0.02, outline=0.004, bevel=0)
    loft(f'roof{k}', M['roof'], [[(x - 0.17, y - 0.18, G + h - 0.005), (x + 0.17, y - 0.18, G + h - 0.005), (x + 0.17, y + 0.18, G + h - 0.005), (x - 0.17, y + 0.18, G + h - 0.005)],
                                 [(x - 0.17, y - 0.004, G + h + 0.1), (x + 0.17, y - 0.004, G + h + 0.1), (x + 0.17, y + 0.004, G + h + 0.1), (x - 0.17, y + 0.004, G + h + 0.1)]],
         outline=0.006)

# ---------- the lanterns along the street ----------
for k in range(9):
    x = -1.0 + k * 0.25
    ball(f'lantern{k}', M[f'l{k % 4}'], x, 0.08, G + 0.24 - 0.02 * (k % 2), 0.035, outline=0.004)
bar('lanternstring', M['string'], (-1.05, 0.08, G + 0.27), (1.05, 0.08, G + 0.27), 0.004, outline=0)

# ---------- the Japanese Covered Bridge ----------
BX, BY = -0.15, -0.55
box('bridgedeck', M['wood'], BX, BY, G + 0.06, 0.18, 0.75, 0.03, outline=0.006, bevel=0)
for s in (-1, 1):
    box(f'bridgeside{s}', M['bridgeWall'], BX + s * 0.08, BY, G + 0.085, 0.025, 0.7, 0.14, outline=0.005, bevel=0)
    for j in range(4):
        box(f'bridgewindow{s}{j}', M['door'], BX + s * 0.094, BY - 0.24 + j * 0.16, G + 0.13, 0.006, 0.06, 0.05, outline=0, bevel=0)
    for j in range(3):
        rod(f'bridgepier{s}{j}', M['wood'], (BX + s * 0.07, BY - 0.25 + j * 0.25, G - 0.005), (BX + s * 0.07, BY - 0.25 + j * 0.25, G + 0.06), 0.018, segs=8, outline=0.003)
loft('bridgeroof', M['roof'], [[(BX - 0.15, BY - 0.42, G + 0.22), (BX + 0.15, BY - 0.42, G + 0.22), (BX + 0.15, BY + 0.42, G + 0.22), (BX - 0.15, BY + 0.42, G + 0.22)],
                               [(BX - 0.004, BY - 0.38, G + 0.33), (BX + 0.004, BY - 0.38, G + 0.33), (BX + 0.004, BY + 0.38, G + 0.33), (BX - 0.004, BY + 0.38, G + 0.33)]],
     outline=0.008)
box('templehut', M['bridgeWall'], BX + 0.16, BY + 0.05, G + 0.075, 0.14, 0.18, 0.12, outline=0.005, bevel=0)
pyramid('templehutroof', M['roof'], BX + 0.16, BY + 0.05, G + 0.19, 0.2, 0.08, outline=0.005)
for j in range(4):
    ball(f'bridgelantern{j}', M[f'l{j % 4}'], BX - 0.1, BY - 0.3 + j * 0.2, G + 0.19, 0.028, outline=0.003)

# ---------- the lantern boat ----------
LX, LY = 0.6, -0.62
box('boat', M['boat'], LX, LY, G, 0.36, 0.1, 0.04, outline=0.005, bevel=0)
box('boatcanopy', M['boat'], LX + 0.03, LY, G + 0.1, 0.18, 0.12, 0.015, outline=0.003, bevel=0)
for s in (-1, 1):
    rod(f'boatpost{s}', M['boat'], (LX + 0.03 + s * 0.08, LY, G + 0.04), (LX + 0.03 + s * 0.08, LY, G + 0.1), 0.005, segs=4, outline=0)
for j in range(4):
    ball(f'boatlantern{j}', M[f'l{(j + 1) % 4}'], LX - 0.06 + j * 0.06, LY - 0.06, G + 0.08, 0.025, outline=0.003)

turn(before, -20)
render(G)
