# A cartoon Paoay Church for the country maps, built in the set's shared look (../toon.py): the
# "earthquake baroque" Church of St Augustine in Ilocos Norte, its thick walls of coral stone and
# brick held up by the row of huge stepped buttresses along each side, the front with its tall
# pilasters, its stepped gable crowned with little finials, and the separate three-storey coral
# bell tower beside it, moss on the old stone. Turned a little towards the camera.
# Run: blender -b --factory-startup -P paoay-church.py -- paoay-church-1024.png 1024 paoay-church.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'coral': toon('coral', '#b8845a', shadow_mul=(0.8, 0.74, 0.78), lift=0.15),
    'coralDark': toon('coralDark', '#946644'),
    'moss': toon('moss', '#6a8a4a'),
    'roof': toon('roof', '#7a5a4a'),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1710)

# ---------- the nave ----------
CX, Y0, Y1 = 0.0, -0.3, 0.5
W, H = 0.32, 0.26
box('nave', M['coral'], CX, (Y0 + Y1) / 2, G - 0.005, W, Y1 - Y0, H, outline=0.008, bevel=0)
loft('naveroof', M['roof'], [[(CX - W / 2 - 0.01, Y0, G + H - 0.005), (CX + W / 2 + 0.01, Y0, G + H - 0.005), (CX + W / 2 + 0.01, Y1, G + H - 0.005), (CX - W / 2 - 0.01, Y1, G + H - 0.005)],
                             [(CX - 0.004, Y0, G + H + 0.1), (CX + 0.004, Y0, G + H + 0.1), (CX + 0.004, Y1, G + H + 0.1), (CX - 0.004, Y1, G + H + 0.1)]], outline=0.005)
# the stepped buttresses down both sides
for s in (-1, 1):
    for k in range(6):
        y = Y0 + 0.08 + k * (Y1 - Y0 - 0.16) / 5
        x0 = CX + s * W / 2
        for st, (out, top) in enumerate(((0.14, 0.1), (0.1, 0.17), (0.06, 0.24))):
            xa, xb = sorted((x0, x0 + s * out))
            box(f'buttress{s}{k}{st}', M['coralDark'] if st == 0 else M['coral'], (xa + xb) / 2, y, G - 0.005, xb - xa, 0.07, top, outline=0.003, bevel=0)
        loft(f'buttressscroll{s}{k}', M['coral'], [[(min(x0, x0 + s * 0.14), y - 0.035, G + 0.095), (max(x0, x0 + s * 0.14), y - 0.035, G + 0.095), (max(x0, x0 + s * 0.14), y + 0.035, G + 0.095), (min(x0, x0 + s * 0.14), y + 0.035, G + 0.095)],
                                                    [(min(x0, x0 + s * 0.1), y - 0.035, G + 0.165), (max(x0, x0 + s * 0.1), y - 0.035, G + 0.165), (max(x0, x0 + s * 0.1), y + 0.035, G + 0.165), (min(x0, x0 + s * 0.1), y + 0.035, G + 0.165)]], outline=0.002)

# ---------- the front ----------
FY = Y0 - 0.02
box('front', M['coral'], CX, FY, G - 0.005, W + 0.12, 0.05, H + 0.04, outline=0.007, bevel=0)
for x in (-0.19, -0.11, 0.11, 0.19):
    box(f'pilaster{x}', M['coralDark'], CX + x, FY - 0.028, G - 0.005, 0.03, 0.01, H + 0.03, outline=0.001, bevel=0)
box('door', M['dark'], CX, FY - 0.027, G - 0.005, 0.07, 0.006, 0.12, outline=0, bevel=0)
cyl('doortop', M['dark'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((CX, FY - 0.027, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    box(f'niche{s}', M['dark'], CX + s * 0.15, FY - 0.027, G + 0.16, 0.025, 0.006, 0.05, outline=0, bevel=0)
box('window', M['dark'], CX, FY - 0.027, G + 0.2, 0.04, 0.006, 0.05, outline=0, bevel=0)
# the stepped gable and its finials
for st in range(4):
    w = W + 0.1 - st * 0.08
    box(f'gable{st}', M['coral'], CX, FY, G + H + 0.035 + st * 0.045, w, 0.05, 0.046, outline=0.003, bevel=0)
    for s in (-1, 1):
        lathe(f'finial{st}{s}', M['coralDark'], ((0.012, 0), (0.012, 0.02), (0.003, 0.045)), G + H + 0.08 + st * 0.045, CX + s * (w / 2 - 0.01), FY - 0.01, segs=6, outline=0.001, smooth=False)
lathe('topfinial', M['coralDark'], ((0.015, 0), (0.003, 0.06)), G + H + 0.215, CX, FY - 0.01, segs=6, outline=0.001, smooth=False)
for k in range(7):
    m = ball(f'moss{k}', M['moss'], 0, 0, 0, 1.0, outline=0.002)
    m.scale = (0.03, 0.012, 0.015)
    m.location = (CX - 0.2 + 0.4 * rng.random(), FY - 0.026, G + 0.02 + 0.25 * rng.random())

# ---------- the separate bell tower ----------
TX, TY = 0.55, -0.2
for st, (w, h) in enumerate(((0.18, 0.18), (0.14, 0.14), (0.11, 0.12))):
    z0 = G - 0.005 + sum(hh for _, hh in ((0.18, 0.18), (0.14, 0.14), (0.11, 0.12))[:st])
    box(f'tower{st}', M['coral'], TX, TY, z0, w, w, h + 0.005, outline=0.005, bevel=0)
    box(f'towerwin{st}', M['dark'], TX, TY - w / 2 - 0.004, z0 + 0.04, 0.03, 0.006, h * 0.5, outline=0, bevel=0)
    box(f'towerledge{st}', M['coralDark'], TX, TY, z0 + h - 0.005, w + 0.02, w + 0.02, 0.016, outline=0.002, bevel=0)
pyramid('towercap', M['roof'], TX, TY, G + 0.435, 0.12, 0.08)

for k, (x, y) in enumerate(((-0.75, -0.55), (-0.85, 0.2), (0.8, 0.4), (0.25, 0.9), (-0.45, 0.85))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
