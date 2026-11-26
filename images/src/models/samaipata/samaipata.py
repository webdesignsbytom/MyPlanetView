# A cartoon Fuerte de Samaipata for the country maps, built in the set's shared look (../toon.py):
# the great carved rock on its ridge in the foothills of the Bolivian Andes, a whole sandstone
# hilltop shaped by the Chané and the Inca into channels, seats and niches, with the twin
# parallel channels running down its spine, the carved circles and the niches of the temple
# walls, the Inca buildings' foundations beside it, and the green hills round. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P samaipata.py -- samaipata-1024.png 1024 samaipata.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'rock': toon('rock', '#d4a882', shadow_mul=(0.8, 0.74, 0.78), lift=0.15),
    'rockDark': toon('rockDark', '#a8805e'),
    'stone': toon('stone', '#c8b898', lift=0.15),
    'path': toon('path2', '#e2d4b4', lift=0.18),
    'dark': flat('dark', '#3a2a22'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(876451)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the carved rock ----------
RX, RY = 0.0, 0.05
RZ = G + 0.2
rock = loft('rock', M['rock'], [[(RX - 0.75, RY - 0.25, G - 0.01), (RX + 0.6, RY - 0.4, G - 0.01), (RX + 0.8, RY + 0.05, G - 0.01), (RX + 0.4, RY + 0.4, G - 0.01), (RX - 0.6, RY + 0.35, G - 0.01)],
                                [(RX - 0.62, RY - 0.18, RZ - 0.04), (RX + 0.5, RY - 0.3, RZ), (RX + 0.66, RY + 0.03, RZ), (RX + 0.32, RY + 0.3, RZ - 0.02), (RX - 0.5, RY + 0.26, RZ - 0.05)]], outline=0.007)
rock.visible_shadow = False
# the twin channels along the spine
for s in (-1, 1):
    bar(f'channel{s}', M['rockDark'], (RX - 0.4, RY + s * 0.04, RZ - 0.03), (RX + 0.45, RY - 0.12 + s * 0.04, RZ + 0.002), 0.02, outline=0)
# carved circles and seats
for k, (x, y, r) in enumerate(((RX + 0.2, RY + 0.12, 0.07), (RX - 0.25, RY + 0.1, 0.05))):
    lathe(f'circle{k}', M['rockDark'], ((r, 0), (r, 0.006)), RZ - 0.02, x, y, segs=20, outline=0)
    lathe(f'circlein{k}', M['rock'], ((r - 0.015, 0), (r - 0.015, 0.008)), RZ - 0.02, x, y, segs=20, outline=0)
for k in range(5):
    box(f'seat{k}', M['rockDark'], RX + 0.1 + k * 0.05, RY - 0.22 - 0.02 * k, RZ - 0.03, 0.03, 0.04, 0.03, outline=0, bevel=0)
# the temple niches along its front face
for k in range(6):
    t = (k + 0.5) / 6
    x = RX - 0.6 + 1.1 * t
    y = RY - 0.25 - 0.15 * t * 0.9 - 0.012
    box(f'niche{k}', M['dark'], x, y, G + 0.05, 0.04, 0.012, 0.07, outline=0, bevel=0)
# the Inca foundations beside it
for k in range(4):
    x, y = -0.55 + 0.3 * (k % 2), -0.65 + 0.2 * (k // 2)
    for j, (dx, dy, sx, sy) in enumerate(((0, -0.06, 0.2, 0.02), (0, 0.06, 0.2, 0.02), (-0.1, 0, 0.02, 0.12), (0.1, 0, 0.02, 0.12))):
        box(f'found{k}{j}', M['stone'], x + dx, y + dy, G - 0.005, sx, sy, 0.04, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((0.6, -0.7), (0.9, -0.3), (1.0, 0.4), (0.4, 0.85), (-0.4, 0.85), (-1.0, 0.25), (-0.95, -0.35))):
    tree(f'tree{k}', x, y, r=0.1, h=0.12)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
