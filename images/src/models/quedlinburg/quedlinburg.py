# A cartoon Quedlinburg for the country maps, built in the set's shared look (../toon.py): the
# castle hill's sandstone rock with the Romanesque collegiate church of St Servatius and its two
# towers and the castle's long buildings on top, and below it the old town's half-timbered houses,
# their white walls criss-crossed with dark timbers under steep red roofs. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P quedlinburg.py -- quedlinburg-1024.png 1024 quedlinburg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'rock': toon('rock', '#c8a878', shadow_mul=(0.86, 0.82, 0.76)),
    'grass': toon('grass2', '#7cb85a'),
    'stone': toon('stone', '#d8c8a0', shadow_mul=(0.86, 0.84, 0.8), lift=0.08),
    'white': toon('white', '#f4ecd8', lift=0.12),
    'ochre': toon('ochre', '#ecc888', lift=0.1),
    'pink': toon('pink', '#e8b0a0', lift=0.1),
    'timber': toon('timber', '#5a3a28'),
    'roof': toon('roof', '#b8503e'),
    'slate': toon('slate', '#4a4e56'),
    'window': flat('window', '#3a3a42'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2473)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


rk = loft('castlehill', M['rock'], [rrect(0.0, 0.58, 0.7, 0.32, -0.01, 0.2), rrect(0.0, 0.6, 0.6, 0.24, 0.22, 0.16)], outline=0.01)
rk.visible_shadow = False
loft('hilltop', M['grass'], [rrect(0.0, 0.6, 0.58, 0.22, 0.22, 0.15), rrect(0.0, 0.6, 0.58, 0.22, 0.228, 0.15)], outline=0)
T = G + 0.225

# ---------- St Servatius and the castle ----------
CX, CY = -0.1, 0.62
box('church', M['stone'], CX, CY, T - 0.005, 0.4, 0.16, 0.17, outline=0.007, bevel=0)
loft('churchroof', M['slate'], [[(CX - 0.2, CY - 0.08, T + 0.165), (CX + 0.2, CY - 0.08, T + 0.165), (CX + 0.2, CY + 0.08, T + 0.165), (CX - 0.2, CY + 0.08, T + 0.165)],
                                [(CX - 0.2, CY - 0.004, T + 0.24), (CX + 0.2, CY - 0.004, T + 0.24), (CX + 0.2, CY + 0.004, T + 0.24), (CX - 0.2, CY + 0.004, T + 0.24)]], outline=0.004)
for j in range(5):
    box(f'churchwin{j}', M['window'], CX - 0.14 + j * 0.07, CY - 0.083, T + 0.08, 0.02, 0.006, 0.05, outline=0, bevel=0)
for s in (-1, 1):
    tx = CX - 0.24
    ty = CY + s * 0.05
    box(f'tower{s}', M['stone'], tx, ty, T - 0.005, 0.08, 0.08, 0.32, outline=0.005, bevel=0)
    box(f'towerwin{s}', M['window'], tx, ty - 0.043, T + 0.24, 0.025, 0.006, 0.04, outline=0, bevel=0)
    pyramid(f'towerroof{s}', M['slate'], tx, ty, T + 0.315, 0.09, 0.14, outline=0.003)
box('castle', M['white'], 0.3, 0.6, T - 0.005, 0.36, 0.18, 0.15, outline=0.006, bevel=0)
for j in range(5):
    box(f'castlewin{j}', M['window'], 0.18 + j * 0.06, 0.507, T + 0.06, 0.02, 0.006, 0.04, outline=0, bevel=0)
loft('castleroof', M['roof'], [[(0.12, 0.51, T + 0.145), (0.48, 0.51, T + 0.145), (0.48, 0.69, T + 0.145), (0.12, 0.69, T + 0.145)],
                               [(0.12, 0.596, T + 0.23), (0.48, 0.596, T + 0.23), (0.48, 0.604, T + 0.23), (0.12, 0.604, T + 0.23)]], outline=0.004)

# ---------- the half-timbered town ----------
def fachwerk(name, x, y, w, h, mat):
    box(name, M[mat], x, y, G - 0.005, w, 0.14, h, outline=0.005, bevel=0)
    fy = y - 0.073
    n = max(2, int(w / 0.045))
    for j in range(n + 1):
        xx = x - w / 2 + j * w / n
        bar(f'{name}post{j}', M['timber'], (xx, fy, G), (xx, fy, G + h - 0.01), 0.008, outline=0)
    for zz in (G + 0.005, G + h * 0.5, G + h - 0.01):
        bar(f'{name}rail{zz}', M['timber'], (x - w / 2, fy, zz), (x + w / 2, fy, zz), 0.008, outline=0)
    for j in range(n):
        xx = x - w / 2 + j * w / n
        bar(f'{name}brace{j}', M['timber'], (xx, fy, G + h * 0.5), (xx + w / n, fy, G + h - 0.01), 0.006, outline=0)
        box(f'{name}win{j}', M['window'], xx + w / n / 2, fy - 0.001, G + h * 0.15, w / n * 0.45, 0.004, h * 0.22, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.01, y - 0.08, G + h - 0.005), (x + w / 2 + 0.01, y - 0.08, G + h - 0.005), (x + w / 2 + 0.01, y + 0.08, G + h - 0.005), (x - w / 2 - 0.01, y + 0.08, G + h - 0.005)],
                                    [(x - w / 2 - 0.01, y - 0.004, G + h + 0.1), (x + w / 2 + 0.01, y - 0.004, G + h + 0.1), (x + w / 2 + 0.01, y + 0.004, G + h + 0.1), (x - w / 2 - 0.01, y + 0.004, G + h + 0.1)]], outline=0.004)


k = 0
for row, y in enumerate((-0.6, -0.32, -0.04)):
    x = -0.8 + 0.06 * row
    while x < 0.8:
        w = rng.uniform(0.14, 0.2)
        if math.hypot(x + w / 2, y) < 1.0 and math.hypot(x, y) < 1.0:
            fachwerk(f'house{k}', x + w / 2, y, w, rng.uniform(0.12, 0.17), ('white', 'ochre', 'pink')[k % 3])
            k += 1
        x += w + 0.03
for kk, (x, y) in enumerate(((-0.85, 0.3), (0.85, 0.3))):
    ball(f'tree{kk}', M['tree'], x, y, G + 0.1, 0.1, outline=0.007)

turn(before, -20)
render(G)
