# A cartoon Rideau Canal for the country maps, built in the set's shared look (../toon.py): the
# Ottawa Locks, the canal's staircase of stone-walled lock chambers with their dark wooden gates
# stepping down to the Ottawa River, Parliament Hill on its cliff beside them with the Centre
# Block's green copper roofs and the Peace Tower, and the Château Laurier's turrets across the
# canal. Turned a little towards the camera.
# Run: blender -b --factory-startup -P rideau-canal.py -- rideau-canal-1024.png 1024 rideau-canal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'cliff': toon('cliff', '#8a8a7a', shadow_mul=(0.84, 0.84, 0.88)),
    'river': toon('river', '#3a7aa8', lift=0.3),
    'water': toon('water', '#4a8ab0', lift=0.3),
    'lockstone': toon('lockstone', '#b8b0a0', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'wood': toon('wood', '#4a3424'),
    'sandstone': toon('sandstone', '#d4c098', shadow_mul=(0.86, 0.84, 0.8), lift=0.1),
    'copper': toon('copper', '#5aa88a', lift=0.12),
    'chateau': toon('chateau', '#c8c0b0', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'white': toon('white', '#f6f2ea', lift=0.15),
    'window': flat('window', '#3a3a42'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
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
lh = loft('parliamenthill', M['cliff'], [rrect(-0.6, 0.15, 0.44, 0.52, -0.01, 0.2), rrect(-0.6, 0.17, 0.42, 0.5, 0.26, 0.18)], outline=0.01)
lh.visible_shadow = False
loft('hilltop', M['grass'], [rrect(-0.6, 0.17, 0.41, 0.49, 0.255, 0.17), rrect(-0.6, 0.17, 0.41, 0.49, 0.266, 0.17)], outline=0)
rh = loft('rightbank', M['cliff'], [rrect(0.62, 0.2, 0.38, 0.48, -0.01, 0.18), rrect(0.62, 0.22, 0.36, 0.46, 0.22, 0.16)], outline=0.01)
rh.visible_shadow = False
loft('righttop', M['grass'], [rrect(0.62, 0.22, 0.35, 0.45, 0.215, 0.15), rrect(0.62, 0.22, 0.35, 0.45, 0.226, 0.15)], outline=0)

# ---------- the locks ----------
CXL = 0.02
n = 7
for j in range(n):
    y = -0.52 + j * 0.16
    zw = 0.02 + j * 0.03
    for s in (-1, 1):
        box(f'lockwall{j}{s}', M['lockstone'], CXL + s * 0.1, y, G - 0.005, 0.05, 0.17, zw + 0.045, outline=0.003, bevel=0)
    box(f'lockfloor{j}', M['lockstone'], CXL, y, G - 0.005, 0.16, 0.17, zw - 0.01, outline=0.002, bevel=0)
    box(f'lockwater{j}', M['water'], CXL, y, G + zw - 0.015, 0.15, 0.16, 0.015, outline=0.001, bevel=0)
    gy = y - 0.08
    box(f'lockgate{j}', M['wood'], CXL, gy, G - 0.005, 0.15, 0.02, zw + 0.04, outline=0.002, bevel=0)
    for s in (-1, 1):
        bar(f'balancebeam{j}{s}', M['wood'], (CXL + s * 0.04, gy, G + zw + 0.045), (CXL + s * 0.17, gy - 0.05, G + zw + 0.045), 0.014, outline=0.001)

# ---------- Parliament Hill ----------
T = G + 0.255
PX, PY = -0.6, 0.3
box('centreblock', M['sandstone'], PX, PY, T - 0.005, 0.5, 0.2, 0.14, outline=0.008, bevel=0)
for r in range(2):
    for j in range(8):
        x = PX - 0.21 + j * 0.06
        if abs(x - PX) < 0.06:
            continue
        box(f'cbwin{r}{j}', M['window'], x, PY - 0.102, T + 0.03 + r * 0.05, 0.025, 0.006, 0.035, outline=0, bevel=0)
loft('centreroof', M['copper'], [[(PX - 0.25, PY - 0.1, T + 0.135), (PX + 0.25, PY - 0.1, T + 0.135), (PX + 0.25, PY + 0.1, T + 0.135), (PX - 0.25, PY + 0.1, T + 0.135)],
                                 [(PX - 0.2, PY - 0.03, T + 0.22), (PX + 0.2, PY - 0.03, T + 0.22), (PX + 0.2, PY + 0.03, T + 0.22), (PX - 0.2, PY + 0.03, T + 0.22)]], outline=0.005)
for s in (-1, 1):
    pyramid(f'cbturret{s}', M['copper'], PX + s * 0.23, PY - 0.08, T + 0.13, 0.06, 0.1, outline=0.003)
TX, TY = PX, PY - 0.12
box('peacetower', M['sandstone'], TX, TY, T - 0.005, 0.1, 0.1, 0.44, outline=0.007, bevel=0)
box('peacearch', M['window'], TX, TY - 0.052, T - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)
box('peacewin', M['window'], TX, TY - 0.052, T + 0.24, 0.03, 0.006, 0.08, outline=0, bevel=0)
cyl('peaceclock', M['white'], 0.028, 0.006, segs=16, outline=0.001, matrix=Matrix.Translation((TX, TY - 0.053, T + 0.38)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('peacespire', M['copper'], ((0.07, 0), (0.05, 0.06), (0.03, 0.12), (0.004, 0.22)), T + 0.435, TX, TY, segs=4, outline=0.004, smooth=False)
rod('flagpole', M['white'], (TX, TY, T + 0.65), (TX, TY, T + 0.71), 0.004, segs=4, outline=0)

# ---------- the Château Laurier ----------
T2 = G + 0.215
CX, CY = 0.6, 0.35
box('chateau', M['chateau'], CX, CY, T2 - 0.005, 0.34, 0.2, 0.2, outline=0.008, bevel=0)
for r in range(3):
    for j in range(5):
        box(f'chwin{r}{j}', M['window'], CX - 0.12 + j * 0.06, CY - 0.102, T2 + 0.03 + r * 0.055, 0.025, 0.006, 0.035, outline=0, bevel=0)
loft('chateauroof', M['copper'], [[(CX - 0.17, CY - 0.1, T2 + 0.195), (CX + 0.17, CY - 0.1, T2 + 0.195), (CX + 0.17, CY + 0.1, T2 + 0.195), (CX - 0.17, CY + 0.1, T2 + 0.195)],
                                  [(CX - 0.15, CY - 0.01, T2 + 0.32), (CX + 0.15, CY - 0.01, T2 + 0.32), (CX + 0.15, CY + 0.01, T2 + 0.32), (CX - 0.15, CY + 0.01, T2 + 0.32)]], outline=0.005)
for s in (-1, 1):
    lathe(f'chturret{s}', M['chateau'], ((0.04, 0), (0.04, 0.24)), T2 - 0.005, CX + s * 0.17, CY - 0.1, segs=14, outline=0.004)
    lathe(f'chturretcap{s}', M['copper'], ((0.046, 0), (0.004, 0.13)), T2 + 0.23, CX + s * 0.17, CY - 0.1, segs=14, outline=0.003)

for k, (x, y, r) in enumerate(((-0.95, -0.15, 0.09), (-0.3, -0.25, 0.08), (0.35, -0.2, 0.08), (0.9, -0.1, 0.08), (-0.25, 0.55, 0.09))):
    zb = G + (0.255 if x < -0.15 else 0.215)
    ball(f'tree{k}', M['tree'], x, y, zb + r * 0.8, r, outline=0.007)

turn(before, -20)
render(G)
