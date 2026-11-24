# A cartoon Monte Albán for the country maps, built in the set's shared look (../toon.py): the
# Zapotec capital on its levelled mountaintop above the valley of Oaxaca, the grassy Main Plaza
# between the great stepped South and North Platforms with their wide stairs, the row of temple
# mounds down its middle, the arrowhead-shaped Building J, and the I-shaped ball court. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P monte-alban.py -- monte-alban-1024.png 1024 monte-alban.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#9ab860', shadow_mul=(0.72, 0.8, 0.78), lift=0.2),
    'mountain': toon('mountain', '#7a9a50', shadow_mul=(0.76, 0.8, 0.78)),
    'plaza': toon('plaza', '#a8c070'),
    'stone': toon('stone', '#b8b0a0', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'stoneDark': toon('stoneDark', '#948c7c'),
    'dark': flat('dark', '#2e2a26'),
})

G = tile(M['valley'])
before = set(bpy.data.objects)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


mt = loft('mountain', M['mountain'], [rrect(0.0, 0.0, 0.9, 0.82, -0.01, 0.4), rrect(0.0, 0.0, 0.66, 0.6, 0.14, 0.2)], outline=0.01, smooth=True)
mt.visible_shadow = False
loft('plaza', M['plaza'], [rrect(0.0, 0.0, 0.64, 0.58, 0.14, 0.19), rrect(0.0, 0.0, 0.64, 0.58, 0.148, 0.19)], outline=0)
T = G + 0.148


def platform(name, x, y, w, d, tiers, th, stair_side):
    z = T - 0.005
    for i in range(tiers):
        box(f'{name}tier{i}', M['stone'], x, y, z, w - i * 0.05, d - i * 0.05, th, outline=0.004, bevel=0)
        z += th
    sy = y - stair_side * (d / 2 + 0.02)
    for i in range(8):
        t = (i + 1) / 8
        box(f'{name}stair{i}', M['stoneDark'], x, sy + stair_side * t * 0.06 - stair_side * 0.0, T - 0.005, w * 0.45, 0.025, (z - T) * t, outline=0.001, bevel=0)
    return z


platform('south', 0.0, -0.46, 0.4, 0.16, 4, 0.04, -1)
platform('north', 0.0, 0.46, 0.56, 0.14, 3, 0.04, 1)
for k, y in enumerate((-0.15, 0.0, 0.15)):
    platform(f'central{k}', 0.0, y, 0.14, 0.1, 3, 0.03, 1)
for k, (x, y) in enumerate(((-0.48, -0.05), (0.48, 0.05), (-0.48, 0.25), (0.48, -0.25))):
    platform(f'side{k}', x, y, 0.14, 0.16, 2, 0.035, -1 if y < 0 else 1)
# Building J, the arrowhead
JX, JY = 0.0, -0.3
loft('buildingj', M['stone'], [[(JX - 0.06, JY - 0.04, T - 0.005), (JX, JY - 0.1, T - 0.005), (JX + 0.06, JY - 0.04, T - 0.005), (JX + 0.06, JY + 0.06, T - 0.005), (JX - 0.06, JY + 0.06, T - 0.005)],
                               [(JX - 0.05, JY - 0.035, T + 0.07), (JX, JY - 0.085, T + 0.07), (JX + 0.05, JY - 0.035, T + 0.07), (JX + 0.05, JY + 0.05, T + 0.07), (JX - 0.05, JY + 0.05, T + 0.07)]], outline=0.004)
# the ball court
BX, BY = -0.34, 0.35
for s in (-1, 1):
    loft(f'courtwall{s}', M['stone'], [[(BX - 0.12, BY + s * 0.025, T - 0.005), (BX + 0.12, BY + s * 0.025, T - 0.005), (BX + 0.12, BY + s * 0.09, T - 0.005), (BX - 0.12, BY + s * 0.09, T - 0.005)],
                                       [(BX - 0.12, BY + s * 0.06, T + 0.06), (BX + 0.12, BY + s * 0.06, T + 0.06), (BX + 0.12, BY + s * 0.09, T + 0.06), (BX - 0.12, BY + s * 0.09, T + 0.06)]] if s > 0 else
         [[(BX - 0.12, BY - 0.09, T - 0.005), (BX + 0.12, BY - 0.09, T - 0.005), (BX + 0.12, BY - 0.025, T - 0.005), (BX - 0.12, BY - 0.025, T - 0.005)],
          [(BX - 0.12, BY - 0.09, T + 0.06), (BX + 0.12, BY - 0.09, T + 0.06), (BX + 0.12, BY - 0.06, T + 0.06), (BX - 0.12, BY - 0.06, T + 0.06)]], outline=0.003)
    box(f'courtend{s}', M['stone'], BX + s * 0.15, BY, T - 0.005, 0.05, 0.2, 0.04, outline=0.002, bevel=0)

turn(before, -20)
render(G)
