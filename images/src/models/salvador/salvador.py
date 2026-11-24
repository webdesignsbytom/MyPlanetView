# A cartoon Salvador for the country maps, built in the set's shared look (../toon.py): the
# Lacerda Elevator, the white Art Deco tower lifting people from the lower city up the escarpment to
# the upper city, with its bridge on top, the Pelourinho's colonial houses painted in bright colours
# and a white baroque church on the hill above, the Mercado Modelo below, and the Bay of All Saints.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P salvador.py -- salvador-1024.png 1024 salvador.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'street': toon('street', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'cliff': toon('cliff', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'yellow': toon('yellow', '#f0c840', lift=0.15),
    'blue': toon('blue', '#3a8ad0', lift=0.12),
    'pink': toon('pink', '#e87aa0', lift=0.12),
    'green': toon('green', '#5ab87a', lift=0.12),
    'orange': toon('orange', '#f08a40', lift=0.12),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a3a42'),
})

G = tile(M['street'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('bay', M['sea'], [strip(-1.25, -0.6, 1.33, -0.004), strip(-1.25, -0.6, 1.33, 0.006)], outline=0.004)
UZ = 0.34
cl = loft('escarpment', M['cliff'], [strip(0.0, 1.18, 1.24, -0.01), strip(0.12, 1.12, 1.17, UZ)], outline=0.01)
cl.visible_shadow = False
T = G + UZ

# ---------- the Pelourinho in the upper city ----------
colours = ('yellow', 'blue', 'pink', 'green', 'orange')
k = 0
for row, y in enumerate((0.25, 0.45)):
    for j in range(7):
        x = -0.75 + j * 0.2 + (0.1 if row else 0)
        if math.hypot(x, y) > 1.05 or (x > 0.05 and y < 0.35):
            continue
        h = 0.12 + 0.02 * (j % 2)
        box(f'house{k}', M[colours[k % 5]], x, y, T - 0.005, 0.18, 0.14, h, outline=0.004, bevel=0)
        for r in range(2):
            for c in range(3):
                box(f'housewin{k}{r}{c}', M['window'], x - 0.055 + c * 0.055, y - 0.073, T + 0.025 + r * 0.05, 0.025, 0.006, 0.03, outline=0, bevel=0)
        loft(f'houseroof{k}', M['roof'], [[(x - 0.095, y - 0.075, T + h - 0.005), (x + 0.095, y - 0.075, T + h - 0.005), (x + 0.095, y + 0.075, T + h - 0.005), (x - 0.095, y + 0.075, T + h - 0.005)],
                                          [(x - 0.095, y - 0.004, T + h + 0.05), (x + 0.095, y - 0.004, T + h + 0.05), (x + 0.095, y + 0.004, T + h + 0.05), (x - 0.095, y + 0.004, T + h + 0.05)]], outline=0.003)
        k += 1
CX, CY = 0.45, 0.62
box('church', M['white'], CX, CY, T - 0.005, 0.24, 0.2, 0.18, outline=0.006, bevel=0)
box('churchdoor', M['window'], CX, CY - 0.103, T - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)
for s in (-1, 1):
    box(f'churchtower{s}', M['white'], CX + s * 0.1, CY - 0.06, T - 0.005, 0.07, 0.07, 0.28, outline=0.004, bevel=0)
    lathe(f'churchcap{s}', M['white'], ((0.04, 0), (0.03, 0.03), (0.004, 0.06)), T + 0.275, CX + s * 0.1, CY - 0.06, segs=8, outline=0.002, smooth=False)
loft('churchgable', M['white'], [[(CX - 0.065, CY - 0.1, T + 0.175), (CX + 0.065, CY - 0.1, T + 0.175), (CX + 0.065, CY - 0.08, T + 0.175), (CX - 0.065, CY - 0.08, T + 0.175)],
                                 [(CX - 0.004, CY - 0.1, T + 0.24), (CX + 0.004, CY - 0.1, T + 0.24), (CX + 0.004, CY - 0.08, T + 0.24), (CX - 0.004, CY - 0.08, T + 0.24)]], outline=0.003)

# ---------- the Lacerda Elevator ----------
EX, EY = 0.3, -0.05
box('elevator', M['white'], EX, EY, G - 0.005, 0.12, 0.1, UZ + 0.14, outline=0.007, bevel=0)
for k in range(5):
    box(f'elevatorstrip{k}', M['window'], EX - 0.04 + k * 0.02, EY - 0.053, G + 0.08, 0.008, 0.006, UZ, outline=0, bevel=0)
box('elevatortop', M['white'], EX, EY + 0.02, G + UZ + 0.13, 0.16, 0.16, 0.06, outline=0.004, bevel=0)
box('elevatorsign', M['blue'], EX, EY - 0.062, G + UZ + 0.15, 0.1, 0.006, 0.025, outline=0, bevel=0)
box('bridge', M['white'], EX, EY + 0.13, G + UZ + 0.1, 0.06, 0.24, 0.04, outline=0.003, bevel=0)
box('lowerhall', M['white'], EX, EY - 0.08, G - 0.005, 0.16, 0.08, 0.08, outline=0.004, bevel=0)

# ---------- the lower city and the market ----------
box('market', M['yellow'], -0.35, -0.42, G - 0.005, 0.36, 0.18, 0.12, outline=0.006, bevel=0)
for j in range(5):
    box(f'marketarch{j}', M['window'], -0.49 + j * 0.07, -0.513, G + 0.01, 0.035, 0.006, 0.07, outline=0, bevel=0)
loft('marketroof', M['roof'], [[(-0.53, -0.51, G + 0.115), (-0.17, -0.51, G + 0.115), (-0.17, -0.33, G + 0.115), (-0.53, -0.33, G + 0.115)],
                               [(-0.5, -0.43, G + 0.16), (-0.2, -0.43, G + 0.16), (-0.2, -0.41, G + 0.16), (-0.5, -0.41, G + 0.16)]], outline=0.004)

turn(before, -20)
render(G)
