# A cartoon Maulbronn Monastery for the country maps, built in the set's shared look (../toon.py): the
# Cistercian abbey church's long Romanesque nave with its plain gable front and the little ridge
# turret, the Gothic narthex ("Paradise") before its door, the cloister's arcades and the well house
# with its fountain, and the walled courtyard's half-timbered farm buildings with their steep roofs.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P maulbronn.py -- maulbronn-1024.png 1024 maulbronn.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'court': toon('court', '#c8bca8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'stone': toon('stone', '#d8c8a8', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#b8a684'),
    'roof': toon('roof', '#b8503a'),
    'timber': toon('timber', '#5a3a28'),
    'plaster': toon('plaster', '#f0e8d8', lift=0.15),
    'dark': flat('dark', '#2e2a26'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['court'])
before = set(bpy.data.objects)

# ---------- the church: its nave runs left to right along the back ----------
NY, NX0, NX1 = 0.4, -0.75, 0.5
NW, NH = 0.3, 0.3
box('nave', M['stone'], (NX0 + NX1) / 2, NY, G - 0.005, NX1 - NX0, NW, NH, outline=0.009, bevel=0)
loft('naveroof', M['roof'], [[(NX0, NY - NW / 2, G + NH - 0.005), (NX1, NY - NW / 2, G + NH - 0.005), (NX1, NY + NW / 2, G + NH - 0.005), (NX0, NY + NW / 2, G + NH - 0.005)],
                             [(NX0, NY - 0.004, G + NH + 0.2), (NX1, NY - 0.004, G + NH + 0.2), (NX1, NY + 0.004, G + NH + 0.2), (NX0, NY + 0.004, G + NH + 0.2)]], outline=0.006)
# the west gable end, facing left, and its round-arched windows
loft('westgable', M['stone'], [[(NX0 - 0.002, NY - NW / 2, G + NH - 0.005), (NX0 - 0.002, NY + NW / 2, G + NH - 0.005), (NX0 + 0.02, NY + NW / 2, G + NH - 0.005), (NX0 + 0.02, NY - NW / 2, G + NH - 0.005)],
                               [(NX0 - 0.002, NY - 0.004, G + NH + 0.2), (NX0 - 0.002, NY + 0.004, G + NH + 0.2), (NX0 + 0.02, NY + 0.004, G + NH + 0.2), (NX0 + 0.02, NY - 0.004, G + NH + 0.2)]], outline=0.004)
for j in range(7):
    x = NX0 + 0.15 + j * 0.16
    box(f'navewin{j}', M['dark'], x, NY - NW / 2 - 0.003, G + 0.15, 0.03, 0.006, 0.08, outline=0, bevel=0)
    cyl(f'navewintop{j}', M['dark'], 0.015, 0.006, segs=8, outline=0, matrix=Matrix.Translation((x, NY - NW / 2 - 0.003, G + 0.23)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the ridge turret
RX = NX0 + 0.55
box('ridgeturret', M['timber'], RX, NY, G + NH + 0.15, 0.05, 0.05, 0.1, outline=0.003, bevel=0)
lathe('ridgespire', M['roof'], ((0.04, 0), (0.003, 0.14)), G + NH + 0.245, RX, NY, segs=8, outline=0.002, smooth=False)
# the narthex ("Paradise") before the west door
box('paradise', M['stone'], NX0 + 0.1, NY - NW / 2 - 0.1, G - 0.005, 0.2, 0.2, 0.2, outline=0.006, bevel=0)
for j in range(2):
    box(f'paradisearch{j}', M['dark'], NX0 + 0.05 + j * 0.1, NY - NW / 2 - 0.203, G + 0.02, 0.05, 0.006, 0.12, outline=0, bevel=0)
    cyl(f'paradisearchtop{j}', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((NX0 + 0.05 + j * 0.1, NY - NW / 2 - 0.203, G + 0.14)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('paradiseroof', M['roof'], [[(NX0, NY - NW / 2 - 0.21, G + 0.195), (NX0 + 0.2, NY - NW / 2 - 0.21, G + 0.195), (NX0 + 0.2, NY - NW / 2, G + 0.195), (NX0, NY - NW / 2, G + 0.195)],
                                 [(NX0 + 0.096, NY - NW / 2 - 0.21, G + 0.3), (NX0 + 0.104, NY - NW / 2 - 0.21, G + 0.3), (NX0 + 0.104, NY - NW / 2, G + 0.3), (NX0 + 0.096, NY - NW / 2, G + 0.3)]], outline=0.004)

# ---------- the cloister and its well house, east of the narthex ----------
CX0, CX1 = -0.3, 0.45
CY0, CY1 = NY - NW / 2 - 0.42, NY - NW / 2
box('cloistergarth', M['lawn'], (CX0 + CX1) / 2, (CY0 + CY1) / 2, G - 0.004, CX1 - CX0 - 0.14, CY1 - CY0 - 0.14, 0.012, outline=0.002, bevel=0)
for side, (x0, y0, x1, y1) in enumerate(((CX0, CY0, CX1, CY0), (CX0, CY0, CX0, CY1), (CX1, CY0, CX1, CY1))):
    length = math.hypot(x1 - x0, y1 - y0)
    n = int(length / 0.07)
    for j in range(n + 1):
        t = j / n
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        rod(f'cloistercol{side}{j}', M['stoneDark'], (x, y, G), (x, y, G + 0.1), 0.01, segs=6, outline=0.001)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w, d = (abs(x1 - x0) + 0.06, 0.08) if y0 == y1 else (0.08, abs(y1 - y0) + 0.06)
    box(f'cloisterroof{side}', M['roof'], cx, cy, G + 0.1, w, d, 0.03, outline=0.003, bevel=0)
# the well house with its three-tiered fountain
WX, WY = CX0 + 0.08, CY0 + 0.08
lathe('wellhouse', M['stone'], ((0.08, 0), (0.08, 0.14)), G - 0.005, WX, WY, segs=9, outline=0.004, smooth=False)
lathe('wellroof', M['roof'], ((0.09, 0), (0.003, 0.12)), G + 0.135, WX, WY, segs=9, outline=0.003, smooth=False)

# ---------- the farm buildings round the front courtyard ----------


def timbered(name, x, y, w, d, h, roof_h):
    box(name, M['plaster'], x, y, G - 0.005, w, d, h, outline=0.005, bevel=0)
    for j in range(int(w / 0.06) + 1):
        bx = x - w / 2 + j * w / int(w / 0.06)
        bar(f'{name}post{j}', M['timber'], (bx, y - d / 2 - 0.003, G), (bx, y - d / 2 - 0.003, G + h - 0.01), 0.008, outline=0)
    for z in (G + 0.005, G + h * 0.5, G + h - 0.012):
        bar(f'{name}beam{z:.2f}', M['timber'], (x - w / 2, y - d / 2 - 0.003, z), (x + w / 2, y - d / 2 - 0.003, z), 0.01, outline=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2, y - d / 2 - 0.01, G + h - 0.005), (x + w / 2, y - d / 2 - 0.01, G + h - 0.005), (x + w / 2, y + d / 2 + 0.01, G + h - 0.005), (x - w / 2, y + d / 2 + 0.01, G + h - 0.005)],
                                    [(x - w / 2, y - 0.004, G + h + roof_h), (x + w / 2, y - 0.004, G + h + roof_h), (x + w / 2, y + 0.004, G + h + roof_h), (x - w / 2, y + 0.004, G + h + roof_h)]], outline=0.004)


timbered('farm1', 0.75, 0.0, 0.3, 0.2, 0.16, 0.14)
timbered('farm2', -0.75, -0.3, 0.3, 0.2, 0.15, 0.13)
timbered('farm3', 0.6, -0.65, 0.34, 0.2, 0.14, 0.13)
timbered('farm4', -0.45, -0.85, 0.3, 0.18, 0.13, 0.12)
for k, (x, y) in enumerate(((0.05, -0.75), (0.9, 0.55), (-0.95, 0.2))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
