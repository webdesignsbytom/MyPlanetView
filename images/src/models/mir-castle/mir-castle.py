# A cartoon Mir Castle for the country maps, built in the set's shared look (../toon.py):
# Belarus' red-brick Gothic castle, its square of walls with four corner towers and the gate tower
# in the middle of the front, white plaster bands and blind niches on the brick, dark tented roofs,
# the Renaissance palace and its wing inside the walls under red tiles, the pond in front and the
# park's trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mir-castle.py -- mir-castle-1024.png 1024 mir-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'brick': toon('brick', '#bc5a40', shadow_mul=(0.84, 0.72, 0.72)),
    'plaster': toon('plaster', '#f6f1e6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'roof': toon('roof', '#6e3a30', shadow_mul=(0.8, 0.74, 0.78)),
    'roofRed': toon('roofRed', '#c4573a'),
    'court': toon('court', '#d9c9a8', lift=0.25),
    'lake': toon('lake', '#3f8fc0', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'window': flat('window', '#3a3640'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6048'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(587)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def square_ring(x, y, r, z):
    return [(x - r, y - r, z), (x + r, y - r, z), (x + r, y + r, z), (x - r, y + r, z)]


def tower(name, x, y, w, h):
    box(name, M['brick'], x, y, G - 0.005, w, w, h, outline=0.018, bevel=0)
    for k, z in enumerate((h * 0.38, h * 0.72)):
        box(f'{name}band{k}', M['plaster'], x, y, G + z, w + 0.012, w + 0.012, 0.014, outline=0.004, bevel=0)

    def face(i, a, at):
        for k, (dx, z, sx, sz, mat) in enumerate(((0, h * 0.53, 0.035, 0.06, 'window'), (0, h * 0.84, 0.03, 0.05, 'window'),
                                                  (-w * 0.25, h * 0.12, 0.035, 0.08, 'plaster'), (w * 0.25, h * 0.12, 0.035, 0.08, 'plaster'))):
            ox, oy = at(dx, -w / 2 - 0.004)
            box(f'{name}face{i}{k}', M[mat], x + ox, y + oy, G + z, sx, 0.01, sz, rot_z=a, outline=0, bevel=0)
    each_side(face)


# ---------- the walls round the courtyard ----------
CX, CY, S, WH = 0.05, 0.25, 0.86, 0.26
box('court', M['court'], CX, CY, G - 0.004, S - 0.04, S - 0.04, 0.008, outline=0, bevel=0)
corners = [(CX - S / 2, CY - S / 2), (CX + S / 2, CY - S / 2), (CX + S / 2, CY + S / 2), (CX - S / 2, CY + S / 2)]
for k in range(4):
    (x0, y0), (x1, y1) = corners[k], corners[(k + 1) % 4]
    mx, my, a = (x0 + x1) / 2, (y0 + y1) / 2, math.atan2(y1 - y0, x1 - x0)
    box(f'wall{k}', M['brick'], mx, my, G - 0.005, S, 0.06, WH, rot_z=a, outline=0.016, bevel=0)
    box(f'wallcap{k}', M['plaster'], mx, my, G + WH - 0.01, S, 0.07, 0.016, rot_z=a, outline=0.004, bevel=0)
    nx, ny = math.sin(a), -math.cos(a)          # the wall's outer side
    for j in range(8):
        t = -0.3 + j * 0.6 / 7
        if k == 0 and abs(t) < 0.15:
            continue    # the gate tower
        px, py = mx + t * math.cos(a) + nx * 0.034, my + t * math.sin(a) + ny * 0.034
        box(f'niche{k}{j}', M['plaster'], px, py, G + 0.08, 0.032, 0.01, 0.09, rot_z=a, outline=0, bevel=0)

# ---------- the four corner towers and the gate tower ----------
for k, (x, y) in enumerate(corners):
    tower(f'tower{k}', x, y, 0.2, 0.56)
    pyramid(f'tower{k}roof', M['roof'], x, y, G + 0.555, 0.235, 0.2, outline=0.012)
GX, GY = CX, CY - S / 2 - 0.03
tower('gatetower', GX, GY, 0.22, 0.62)
box('gateway', M['window'], GX, GY - 0.114, G - 0.005, 0.07, 0.01, 0.12, outline=0, bevel=0)
BELL = ((0.13, 0), (0.105, 0.05), (0.055, 0.1), (0.04, 0.13))
loft('gatebell', M['roof'], [square_ring(GX, GY, r, G + 0.615 + z) for r, z in BELL], outline=0.012)
box('gatelantern', M['plaster'], GX, GY, G + 0.74, 0.06, 0.06, 0.05, outline=0.006, bevel=0)
lathe('gatespire', M['roof'], ((0.04, 0), (0.004, 0.1)), G + 0.785, GX, GY, segs=4, outline=0.006, smooth=False)
ball('gateball', M['gold'], GX, GY, G + 0.89, 0.012, outline=0.003)

# ---------- the palace and its wing inside the walls ----------
PX, PY = CX - 0.02, CY + S / 2 - 0.13
box('palace', M['brick'], PX, PY, G - 0.005, S - 0.22, 0.2, 0.36, outline=0.016, bevel=0)
loft('palaceroof', M['roofRed'], [[(PX - 0.33, PY - 0.11, G + 0.355), (PX + 0.33, PY - 0.11, G + 0.355), (PX + 0.33, PY + 0.11, G + 0.355), (PX - 0.33, PY + 0.11, G + 0.355)],
                                  [(PX - 0.3, PY - 0.004, G + 0.45), (PX + 0.3, PY - 0.004, G + 0.45), (PX + 0.3, PY + 0.004, G + 0.45), (PX - 0.3, PY + 0.004, G + 0.45)]],
     outline=0.012)
for row, z in enumerate((0.13, 0.25)):
    for j in range(6):
        x = PX - 0.26 + j * 0.104
        box(f'palacewinframe{row}{j}', M['plaster'], x, PY - 0.104, G + z, 0.045, 0.01, 0.07, outline=0, bevel=0)
        box(f'palacewin{row}{j}', M['window'], x, PY - 0.108, G + z + 0.01, 0.028, 0.01, 0.05, outline=0, bevel=0)
WX, WY = CX + S / 2 - 0.12, CY - 0.02
box('wing', M['brick'], WX, WY, G - 0.005, 0.18, 0.44, 0.32, outline=0.016, bevel=0)
loft('wingroof', M['roofRed'], [[(WX - 0.1, WY - 0.23, G + 0.315), (WX + 0.1, WY - 0.23, G + 0.315), (WX + 0.1, WY + 0.23, G + 0.315), (WX - 0.1, WY + 0.23, G + 0.315)],
                                [(WX - 0.004, WY - 0.21, G + 0.4), (WX + 0.004, WY - 0.21, G + 0.4), (WX + 0.004, WY + 0.21, G + 0.4), (WX - 0.004, WY + 0.21, G + 0.4)]],
     outline=0.012)
for j in range(4):
    y = WY - 0.15 + j * 0.1
    box(f'wingwinframe{j}', M['plaster'], WX - 0.094, y, G + 0.2, 0.01, 0.045, 0.07, outline=0, bevel=0)
    box(f'wingwin{j}', M['window'], WX - 0.098, y, G + 0.21, 0.01, 0.028, 0.05, outline=0, bevel=0)

# ---------- the pond, the path to the gate and the park ----------
flat_face('pond', M['lake'], [(-0.55 + 0.42 * math.cos(t), -0.8 + 0.24 * math.sin(t)) for t in (2 * math.pi * k / 24 for k in range(24))], G + 0.004, outline=0.01)
x0, y0, x1, y1 = GX, GY - 0.12, 0.4, -1.15
box('path', M['path'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.004, math.hypot(x1 - x0, y1 - y0), 0.1, 0.01, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.005, bevel=0)
for k, (x, y) in enumerate(((-1.0, 0.3), (-0.95, -0.15), (-0.75, 0.85), (0.9, 0.72), (1.02, 0.25), (0.88, -0.38), (-0.12, -0.72), (0.95, -0.75), (0.1, 1.08))):
    h = rng.uniform(0.1, 0.16)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.018, segs=8, outline=0.008)
    ball(f'tree{k}', M['tree'], x, y, G + h + 0.06, rng.uniform(0.1, 0.13), outline=0.016)

turn(before, -20)
render(G)
