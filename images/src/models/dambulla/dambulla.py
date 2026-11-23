# A cartoon Dambulla Cave Temple for the country maps, built in the set's shared look
# (../toon.py): the great dark granite rock with its overhang, the cave temple's long white front
# with its arches and orange eaves built in under it, and the giant golden seated Buddha on his
# lotus at the foot of the hill, with the path between them and trees round. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P dambulla.py -- dambulla-1024.png 1024 dambulla.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#6a6460', shadow_mul=(0.84, 0.84, 0.9), lift=0.08),
    'white': toon('white', '#f6f2ea', lift=0.15),
    'roof': toon('roof', '#d0703e'),
    'dark': flat('dark', '#3a3430'),
    'gold': toon('gold', '#f0c030', lift=0.25),
    'goldDark': toon('goldDark', '#d4a020'),
    'path': toon('path', '#c8b898'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


rk = loft('rock', M['rock'], [rrect(0.0, 0.62, 0.78, 0.36, -0.01, 0.2), rrect(0.0, 0.55, 0.8, 0.43, 0.3, 0.22),
                             rrect(0.0, 0.64, 0.66, 0.32, 0.48, 0.2), rrect(0.0, 0.68, 0.4, 0.2, 0.56, 0.15)], outline=0.012, smooth=True)
rk.visible_shadow = False

# ---------- the cave temple's front ----------
box('templefront', M['white'], 0.0, 0.2, G - 0.005, 1.1, 0.12, 0.17, outline=0.008, bevel=0)
for j in range(9):
    x = -0.44 + j * 0.11
    box(f'arch{j}', M['dark'], x, 0.137, G + 0.02, 0.05, 0.006, 0.08, outline=0, bevel=0)
    cyl(f'archtop{j}', M['dark'], 0.025, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, 0.137, G + 0.1)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('eaves', M['roof'], 0.0, 0.18, G + 0.165, 1.14, 0.16, 0.022, outline=0.003, bevel=0)
loft('entrancegable', M['roof'], [[(-0.12, 0.1, G + 0.185), (0.12, 0.1, G + 0.185), (0.12, 0.24, G + 0.185), (-0.12, 0.24, G + 0.185)],
                                  [(-0.004, 0.1, G + 0.26), (0.004, 0.1, G + 0.26), (0.004, 0.24, G + 0.26), (-0.004, 0.24, G + 0.26)]], outline=0.004)

# ---------- the golden Buddha ----------
BX, BY = 0.5, -0.42
box('pedestal', M['white'], BX, BY, G - 0.005, 0.32, 0.28, 0.08, outline=0.005, bevel=0)
lathe('lotus', M['goldDark'], ((0.12, 0), (0.145, 0.035)), G + 0.075, BX, BY, segs=16, outline=0.003)
Z = G + 0.11
b = ball('lap', M['gold'], 0, 0, 0, 0.5, outline=0.005)
b.scale = (0.25, 0.15, 0.08)
b.location = (BX, BY - 0.015, Z + 0.03)
lathe('torso', M['gold'], ((0.075, 0), (0.07, 0.08), (0.055, 0.15), (0.03, 0.18)), Z + 0.03, BX, BY + 0.01, segs=16, outline=0.005)
for s in (-1, 1):
    rod(f'arm{s}', M['gold'], (BX + s * 0.07, BY + 0.01, Z + 0.17), (BX + s * 0.06, BY - 0.04, Z + 0.06), 0.02, segs=8, outline=0.002)
ball('hands', M['gold'], BX, BY - 0.05, Z + 0.06, 0.025, outline=0.002)
ball('head', M['gold'], BX, BY + 0.01, Z + 0.25, 0.048, outline=0.004)
lathe('ushnisha', M['goldDark'], ((0.022, 0), (0.004, 0.05)), Z + 0.285, BX, BY + 0.01, segs=10, outline=0.002)

# ---------- the path and the trees ----------
for j, (p0, p1) in enumerate((((BX - 0.1, BY + 0.1), (0.2, -0.05)), ((0.2, -0.05), (0.0, 0.12)))):
    bar(f'path{j}', M['path'], (p0[0], p0[1], G + 0.002), (p1[0], p1[1], G + 0.002), 0.06, outline=0)
for k, (x, y, r) in enumerate(((-0.95, 0.1, 0.12), (-0.7, -0.45, 0.13), (-0.25, -0.7, 0.11), (0.95, 0.15, 0.12), (0.9, -0.55, 0.1), (-0.95, 0.55, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
