# A cartoon Notre-Dame de Paris for the country maps, built in the set's shared look (../toon.py):
# the cathedral on the Île de la Cité, its west front with the three portals, the gallery of kings,
# the rose window and the two square towers, the long nave and transept under their lead roofs with
# the slender spire over the crossing, the flying buttresses down the sides, and the Seine flowing
# round the island's stone quays. Turned a little towards the camera.
# Run: blender -b --factory-startup -P notre-dame.py -- notre-dame-1024.png 1024 notre-dame.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#4a8ab0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'quay': toon('quay', '#c8bca0', shadow_mul=(0.84, 0.84, 0.88)),
    'parvis': toon('parvis', '#d8d0c0'),
    'lawn': toon('lawn', '#7cb85a'),
    'stone': toon('stone', '#e4dcc6', shadow_mul=(0.84, 0.84, 0.88), lift=0.12),
    'stoneDark': toon('stoneDark', '#c8bea4'),
    'lead': toon('lead', '#6a7480', shadow_mul=(0.84, 0.86, 0.92)),
    'window': flat('window', '#3a3a48'),
    'rose': flat('rose', '#4a5a9a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['river'])
before = set(bpy.data.objects)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


loft('island', M['quay'], [rrect(0.0, 0.1, 0.55, 0.82, -0.01, 0.3), rrect(0.0, 0.1, 0.55, 0.82, 0.05, 0.3)], outline=0.01)
T = G + 0.05
box('parvis', M['parvis'], 0.0, -0.5, T - 0.004, 0.8, 0.36, 0.008, outline=0, bevel=0)
box('garden', M['lawn'], 0.0, 0.78, T - 0.004, 0.6, 0.18, 0.008, outline=0, bevel=0)

# ---------- the nave, transept, apse ----------
NY0, NY1 = -0.22, 0.6
box('aisles', M['stone'], 0.0, (NY0 + NY1) / 2, T - 0.005, 0.42, NY1 - NY0, 0.14, outline=0.008, bevel=0)
box('nave', M['stone'], 0.0, (NY0 + NY1) / 2, T - 0.005, 0.24, NY1 - NY0, 0.3, outline=0.008, bevel=0)
loft('naveroof', M['lead'], [[(-0.125, NY0, T + 0.295), (0.125, NY0, T + 0.295), (0.125, NY1, T + 0.295), (-0.125, NY1, T + 0.295)],
                             [(-0.004, NY0, T + 0.43), (0.004, NY0, T + 0.43), (0.004, NY1, T + 0.43), (-0.004, NY1, T + 0.43)]], outline=0.006)
box('transept', M['stone'], 0.0, 0.26, T - 0.005, 0.52, 0.14, 0.3, outline=0.008, bevel=0)
loft('transeptroof', M['lead'], [[(-0.26, 0.19, T + 0.295), (0.26, 0.19, T + 0.295), (0.26, 0.33, T + 0.295), (-0.26, 0.33, T + 0.295)],
                                 [(-0.26, 0.256, T + 0.43), (0.26, 0.256, T + 0.43), (0.26, 0.264, T + 0.43), (-0.26, 0.264, T + 0.43)]], outline=0.005)
cyl('transeptrose', M['rose'], 0.06, 0.006, segs=20, outline=0, matrix=Matrix.Translation((-0.262, 0.26, T + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
lathe('apse', M['stone'], ((0.12, 0), (0.12, 0.3)), T - 0.005, 0.0, NY1, segs=10, outline=0.007, smooth=False)
lathe('apseroof', M['lead'], ((0.125, 0), (0.004, 0.14)), T + 0.295, 0.0, NY1, segs=10, outline=0.005, smooth=False)
lathe('spire', M['lead'], ((0.04, 0), (0.035, 0.08), (0.02, 0.2), (0.004, 0.36)), T + 0.4, 0.0, 0.26, segs=8, outline=0.004, smooth=False)
for s in (-1, 1):
    for j in range(6):
        y = NY0 + 0.1 + j * 0.13
        if abs(y - 0.26) < 0.08:
            continue
        box(f'buttress{s}{j}', M['stoneDark'], s * 0.2, y, T - 0.005, 0.03, 0.03, 0.17, outline=0.002, bevel=0)
        bar(f'flyer{s}{j}', M['stoneDark'], (s * 0.2, y, T + 0.16), (s * 0.12, y, T + 0.27), 0.022, outline=0.002)
        lathe(f'pinnacle{s}{j}', M['stoneDark'], ((0.015, 0), (0.004, 0.06)), T + 0.16, s * 0.2, y, segs=4, outline=0.001, smooth=False)
        box(f'clerestory{s}{j}', M['window'], s * 0.122, y - 0.06, T + 0.18, 0.006, 0.04, 0.08, outline=0, bevel=0)

# ---------- the west front ----------
FY = NY0 - 0.04
box('front', M['stone'], 0.0, FY, T - 0.005, 0.38, 0.08, 0.34, outline=0.008, bevel=0)
for x, w in ((-0.12, 0.06), (0.0, 0.07), (0.12, 0.06)):
    box(f'portal{x}', M['window'], x, FY - 0.042, T - 0.005, w, 0.006, 0.08, outline=0, bevel=0)
    cyl(f'portaltop{x}', M['window'], w / 2, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, FY - 0.042, T + 0.075)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(14):
    lathe(f'king{j}', M['stoneDark'], ((0.008, 0), (0.006, 0.03)), T + 0.125, -0.16 + j * 0.0246, FY - 0.044, segs=6, outline=0)
cyl('rosering', M['stoneDark'], 0.065, 0.008, segs=24, outline=0.002, matrix=Matrix.Translation((0.0, FY - 0.042, T + 0.23)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('rose', M['rose'], 0.055, 0.008, segs=24, outline=0, matrix=Matrix.Translation((0.0, FY - 0.046, T + 0.23)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('gallery', M['stoneDark'], 0.0, FY - 0.04, T + 0.32, 0.38, 0.012, 0.03, outline=0.001, bevel=0)
for s in (-1, 1):
    tx = s * 0.12
    box(f'tower{s}', M['stone'], tx, FY + 0.01, T + 0.33, 0.13, 0.12, 0.17, outline=0.007, bevel=0)
    for j in range(2):
        box(f'belfry{s}{j}', M['window'], tx - 0.03 + j * 0.06, FY - 0.052, T + 0.36, 0.025, 0.006, 0.11, outline=0, bevel=0)
    box(f'towertop{s}', M['stoneDark'], tx, FY + 0.01, T + 0.495, 0.14, 0.13, 0.015, outline=0.002, bevel=0)

for k, (x, y, r) in enumerate(((-0.3, 0.75, 0.08), (0.3, 0.78, 0.08), (-0.35, -0.55, 0.07), (0.35, -0.55, 0.07))):
    ball(f'tree{k}', M['tree'], x, y, T + r * 0.9, r, outline=0.006)

turn(before, -20)
render(G)
