# A cartoon Wachau for the country maps, built in the set's shared look (../toon.py): Melk Abbey,
# the great baroque monastery in yellow and white along its rock over the Danube, the church's twin
# towers with their green copper helmets and the dome behind them, the long front with its rows of
# windows, the river below with a cruise boat, and terraced vineyards on either side. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P wachau.py -- wachau-1024.png 1024 wachau.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'rock': toon('rock', '#b0a490', shadow_mul=(0.84, 0.84, 0.88)),
    'yellow': toon('yellow', '#f2d070', shadow_mul=(0.88, 0.84, 0.76), lift=0.12),
    'white': toon('white', '#f6f0e0', lift=0.15),
    'roof': toon('roof', '#a8583a'),
    'copper': toon('copper', '#5aa88a', lift=0.12),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'window': flat('window', '#3a4050'),
    'vine': toon('vine', '#4f8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'soil': toon('soil', '#b89a6a'),
    'boat': toon('boat', '#f4f4f0', lift=0.15),
    'stripe': toon('stripe', '#3a6ab0'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


loft('river', M['river'], [strip(-1.25, -0.55, 1.33, -0.004), strip(-1.25, -0.55, 1.33, 0.006)], outline=0.004)
rk = loft('ridge', M['rock'], [rrect(0.0, 0.05, 0.75, 0.4, -0.01, 0.14), rrect(0.0, 0.05, 0.68, 0.33, 0.18, 0.1)], outline=0.01)
rk.visible_shadow = False
T = G + 0.18

# ---------- the abbey ----------
AY = 0.14
box('abbey', M['yellow'], -0.05, AY, T - 0.005, 1.1, 0.2, 0.16, outline=0.009, bevel=0)
for r in range(2):
    for j in range(14):
        x = -0.56 + j * 0.077
        if -0.27 < x < -0.09:
            continue
        box(f'abbeywin{r}{j}', M['window'], x, AY - 0.102, T + 0.03 + r * 0.065, 0.03, 0.006, 0.04, outline=0, bevel=0)
box('abbeyband', M['white'], -0.05, AY - 0.1, T + 0.145, 1.1, 0.008, 0.015, outline=0, bevel=0)
loft('abbeyroof', M['roof'], [[(-0.6, AY - 0.1, T + 0.15), (0.5, AY - 0.1, T + 0.15), (0.5, AY + 0.1, T + 0.15), (-0.6, AY + 0.1, T + 0.15)],
                              [(-0.55, AY - 0.02, T + 0.22), (0.45, AY - 0.02, T + 0.22), (0.45, AY + 0.02, T + 0.22), (-0.55, AY + 0.02, T + 0.22)]], outline=0.006)
# the terrace wing reaching forward at the west end
box('altane', M['yellow'], -0.55, -0.1, T - 0.005, 0.14, 0.3, 0.1, outline=0.006, bevel=0)
box('altanetop', M['white'], -0.55, -0.1, T + 0.09, 0.15, 0.31, 0.015, outline=0.002, bevel=0)

# the church: its front between the twin towers, the dome behind
CX = -0.18
box('churchfront', M['yellow'], CX, AY - 0.1, T - 0.005, 0.14, 0.06, 0.3, outline=0.006, bevel=0)
box('churchdoor', M['window'], CX, AY - 0.131, T - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)
box('churchwin', M['window'], CX, AY - 0.131, T + 0.14, 0.04, 0.006, 0.08, outline=0, bevel=0)
loft('churchgable', M['white'], [[(CX - 0.075, AY - 0.13, T + 0.29), (CX + 0.075, AY - 0.13, T + 0.29), (CX + 0.075, AY - 0.07, T + 0.29), (CX - 0.075, AY - 0.07, T + 0.29)],
                                 [(CX - 0.004, AY - 0.13, T + 0.35), (CX + 0.004, AY - 0.13, T + 0.35), (CX + 0.004, AY - 0.07, T + 0.35), (CX - 0.004, AY - 0.07, T + 0.35)]], outline=0.003)
for s in (-1, 1):
    tx = CX + s * 0.11
    box(f'tower{s}', M['yellow'], tx, AY - 0.09, T - 0.005, 0.09, 0.09, 0.42, outline=0.006, bevel=0)
    box(f'towerwin{s}', M['window'], tx, AY - 0.136, T + 0.3, 0.035, 0.006, 0.06, outline=0, bevel=0)
    box(f'towerclock{s}', M['white'], tx, AY - 0.136, T + 0.23, 0.04, 0.006, 0.04, outline=0, bevel=0)
    lathe(f'helmet{s}', M['copper'], ((0.055, 0), (0.065, 0.03), (0.03, 0.07), (0.045, 0.1), (0.012, 0.14), (0.004, 0.19)), T + 0.41, tx, AY - 0.09, segs=12, outline=0.004)
    ball(f'helmetball{s}', M['gold'], tx, AY - 0.09, T + 0.6, 0.012, outline=0.001)
lathe('drum', M['yellow'], ((0.1, 0), (0.1, 0.1)), T + 0.17, CX, AY + 0.05, segs=16, outline=0.005)
lathe('dome', M['copper'], ((0.11, 0), (0.095, 0.06), (0.05, 0.1), (0.004, 0.12)), T + 0.265, CX, AY + 0.05, segs=16, outline=0.005)
lathe('lantern', M['copper'], ((0.025, 0), (0.02, 0.05), (0.004, 0.08)), T + 0.375, CX, AY + 0.05, segs=8, outline=0.002)

# ---------- the vineyards ----------
for s in (-1, 1):
    box(f'vineyard{s}', M['soil'], s * 0.97, -0.03, G - 0.003, 0.32, 0.72, 0.01, outline=0.002, bevel=0)
    for j in range(5):
        x = s * (0.85 + j * 0.06)
        bar(f'vinerow{s}{j}', M['vine'], (x, -0.34, G + 0.025), (x, 0.28, G + 0.025), 0.03, outline=0.002)

# ---------- a cruise boat on the Danube ----------
box('boat', M['boat'], 0.25, -0.86, G - 0.005, 0.36, 0.08, 0.05, outline=0.004, bevel=0)
box('boatstripe', M['stripe'], 0.25, -0.902, G + 0.015, 0.36, 0.004, 0.012, outline=0, bevel=0)
box('boatdeck', M['boat'], 0.22, -0.86, G + 0.04, 0.22, 0.06, 0.03, outline=0.003, bevel=0)

turn(before, -20)
render(G)
