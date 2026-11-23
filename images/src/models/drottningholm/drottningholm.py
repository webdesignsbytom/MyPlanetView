# A cartoon Drottningholm Palace for the country maps, built in the set's shared look (../toon.py):
# the Swedish royal palace on the shore of Lake Mälaren, its long ochre front under dark mansard
# roofs, the copper-green cupolas of its pavilions, the jetty on the lake, the baroque garden beside
# it with embroidered parterres, a fountain and rows of clipped limes, and the little red-and-green
# Chinese Pavilion. Turned a little towards the camera.
# Run: blender -b --factory-startup -P drottningholm.py -- drottningholm-1024.png 1024 drottningholm.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'lake': toon('lake', '#3f8fc0', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'ochre': toon('ochre', '#e8c47a', shadow_mul=(0.84, 0.76, 0.66)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'mansard': toon('mansard', '#4a4f58', shadow_mul=(0.78, 0.78, 0.86)),
    'copper': toon('copper', '#6fae96', shadow_mul=(0.72, 0.82, 0.84)),
    'window': flat('window', '#3a4a5a'),
    'gravel': toon('gravel', '#e8dcc0', lift=0.25),
    'hedge': toon('hedge', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'lime': toon('lime', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'red': toon('red', '#c8402f'),
    'wood': toon('wood', '#8a6448'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(541)

# ---------- Lake Mälaren along the front left ----------
R = 1.42
LAKE = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(160, 291, 10)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in LAKE])])
finish('lake', bm, M['lake'], outline=0.01)
bar('jetty', M['wood'], (-0.36, -0.36, G + 0.02), (-0.68, -0.68, G + 0.02), 0.07, outline=0.006)

# ---------- the palace ----------
PX, PY, PW, PD, PH = -0.15, 0.4, 1.0, 0.24, 0.22
box('palace', M['ochre'], PX, PY, G - 0.005, PW, PD, PH, outline=0.024, bevel=0.003)
loft('mansardroof', M['mansard'], [[(PX - PW / 2 - 0.01, PY - PD / 2 - 0.01, G + PH - 0.005), (PX + PW / 2 + 0.01, PY - PD / 2 - 0.01, G + PH - 0.005),
                                    (PX + PW / 2 + 0.01, PY + PD / 2 + 0.01, G + PH - 0.005), (PX - PW / 2 - 0.01, PY + PD / 2 + 0.01, G + PH - 0.005)],
                                   [(PX - PW / 2 + 0.03, PY - PD / 2 + 0.04, G + PH + 0.08), (PX + PW / 2 - 0.03, PY - PD / 2 + 0.04, G + PH + 0.08),
                                    (PX + PW / 2 - 0.03, PY + PD / 2 - 0.04, G + PH + 0.08), (PX - PW / 2 + 0.03, PY + PD / 2 - 0.04, G + PH + 0.08)]], outline=0.014)
for row, z in enumerate((0.04, 0.13)):
    for k in range(14):
        x = PX - PW / 2 + 0.05 + k * (PW - 0.1) / 13
        box(f'win{row}{k}', M['white'], x, PY - PD / 2 - 0.004, G + z, 0.035, 0.01, 0.06, outline=0, bevel=0)
        box(f'pane{row}{k}', M['window'], x, PY - PD / 2 - 0.008, G + z + 0.008, 0.024, 0.01, 0.044, outline=0, bevel=0)
# the centre block, a little taller, its copper roof and cupola
box('centre', M['ochre'], PX, PY - 0.02, G - 0.005, 0.26, PD + 0.06, PH + 0.06, outline=0.02, bevel=0)
box('centrepediment', M['white'], PX, PY - 0.02 - (PD + 0.06) / 2 - 0.004, G + PH + 0.02, 0.2, 0.01, 0.03, outline=0, bevel=0)
lathe('centrecupola', M['copper'], ((0.12, 0), (0.1, 0.06), (0.06, 0.12), (0.03, 0.15)), G + PH + 0.055, PX, PY - 0.02, segs=4, outline=0.012, smooth=False)
lathe('centrelantern', M['copper'], ((0.025, 0), (0.025, 0.04), (0.004, 0.08)), G + PH + 0.2, PX, PY - 0.02, segs=8, outline=0.006)
# the pavilions at the ends with their cupolas
for s in (-1, 1):
    x = PX + s * (PW / 2 - 0.08)
    box(f'pavilion{s}', M['ochre'], x, PY - 0.03, G - 0.005, 0.18, PD + 0.08, PH + 0.04, outline=0.02, bevel=0)
    lathe(f'pavilioncupola{s}', M['copper'], ((0.09, 0), (0.08, 0.05), (0.04, 0.1), (0.02, 0.12)), G + PH + 0.035, x, PY - 0.03, segs=4, outline=0.01, smooth=False)
    lathe(f'pavilionlantern{s}', M['copper'], ((0.018, 0), (0.004, 0.06)), G + PH + 0.155, x, PY - 0.03, segs=8, outline=0.005)

# ---------- the baroque garden to the right ----------
GX, GY = 0.6, -0.35
box('gardengravel', M['gravel'], GX, GY, G - 0.005, 0.75, 0.85, 0.012, outline=0.008, bevel=0)
for i in range(2):
    for j in range(2):
        x, y = GX - 0.17 + i * 0.34, GY - 0.2 + j * 0.4
        box(f'parterre{i}{j}', M['lawn'], x, y, G, 0.28, 0.32, 0.015, outline=0.006, bevel=0)
        for a in range(6):
            t = 2 * math.pi * a / 6
            bar(f'embroidery{i}{j}{a}', M['hedge'], (x + 0.06 * math.cos(t), y + 0.07 * math.sin(t), G + 0.02), (x + 0.11 * math.cos(t + 0.6), y + 0.13 * math.sin(t + 0.6), G + 0.02),
                0.02, outline=0.003)
        lathe(f'cone{i}{j}', M['hedge'], ((0.03, 0), (0.004, 0.1)), G + 0.015, x, y, segs=10, outline=0.006)
lathe('fountain', M['white'], ((0.09, 0), (0.09, 0.03)), G, GX, GY, segs=20, outline=0.008)
cyl('fountainwater', M['water'], 0.075, 0.01, segs=20, outline=0, matrix=Matrix.Translation((GX, GY, G + 0.025)))
lathe('fountainjet', M['foam'], ((0.015, 0), (0.008, 0.1), (0.03, 0.12), (0.003, 0.14)), G + 0.03, GX, GY, segs=10, outline=0.005)
for s in (-1, 1):
    for k in range(5):
        lathe(f'clippedlime{s}{k}', M['lime'], ((0.045, 0), (0.05, 0.12), (0.03, 0.2), (0.004, 0.22)), G - 0.005, GX + s * 0.42, GY - 0.36 + k * 0.18, segs=8,
              outline=0.008, smooth=False)

# ---------- the Chinese Pavilion ----------
CX, CY = 0.75, 0.65
box('chinapavilion', M['red'], CX, CY, G - 0.005, 0.2, 0.14, 0.1, outline=0.012, bevel=0)
for k, (w, z) in enumerate(((0.28, 0.095), (0.18, 0.16))):
    loft(f'chinaroof{k}', M['copper'], [[(CX - w / 2, CY - w * 0.4, G + z), (CX + w / 2, CY - w * 0.4, G + z), (CX + w / 2, CY + w * 0.4, G + z), (CX - w / 2, CY + w * 0.4, G + z)],
                                        [(CX - 0.02, CY - 0.004, G + z + 0.06), (CX + 0.02, CY - 0.004, G + z + 0.06), (CX + 0.02, CY + 0.004, G + z + 0.06),
                                         (CX - 0.02, CY + 0.004, G + z + 0.06)]], outline=0.01)
    if k == 0:
        box('chinaupper', M['red'], CX, CY, G + 0.12, 0.1, 0.08, 0.05, outline=0.008, bevel=0)

turn(before, -20)
render(G)
