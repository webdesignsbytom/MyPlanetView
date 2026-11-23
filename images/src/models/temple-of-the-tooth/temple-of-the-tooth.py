# A cartoon Temple of the Tooth for the country maps, built in the set's shared look (../toon.py):
# Kandy's Sri Dalada Maligawa, its white walls under red-tiled roofs, the octagonal Pattirippuwa
# pavilion at the front, the moat with its wave-patterned wall, Kandy Lake in front, palms, and an
# elephant. Turned a little towards the camera.
# Run: blender -b --factory-startup -P temple-of-the-tooth.py -- temple-of-the-tooth-1024.png 1024 temple-of-the-tooth.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'lake': toon('lake', '#4a8aa0', lift=0.3),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#c4573a'),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'elephant': toon('elephant', '#8a8682', shadow_mul=(0.84, 0.84, 0.9)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1753)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('lake', M['lake'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(200, 341, 4)], G + 0.004, outline=0.01)
box('moat', M['lake'], 0.0, -0.2, G - 0.003, 1.3, 0.1, 0.01, outline=0.003, bevel=0)
for j in range(14):
    box(f'wavewall{j}', M['white'], -0.62 + j * 0.095, -0.26, G - 0.005, 0.05, 0.03, 0.04, outline=0.003, bevel=0)


def wing(name, x, y, w, d, h):
    box(name, M['white'], x, y, G - 0.005, w, d, h, outline=0.01, bevel=0)
    for j in range(int(w / 0.07)):
        box(f'{name}win{j}', M['window'], x - w / 2 + 0.035 + j * 0.07, y - d / 2 - 0.004, G + h * 0.4, 0.025, 0.006, 0.04, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.03, y - d / 2 - 0.03, G + h - 0.005), (x + w / 2 + 0.03, y - d / 2 - 0.03, G + h - 0.005), (x + w / 2 + 0.03, y + d / 2 + 0.03, G + h - 0.005),
                                     (x - w / 2 - 0.03, y + d / 2 + 0.03, G + h - 0.005)],
                                    [(x - w * 0.35, y - 0.006, G + h + 0.08), (x + w * 0.35, y - 0.006, G + h + 0.08), (x + w * 0.35, y + 0.006, G + h + 0.08),
                                     (x - w * 0.35, y + 0.006, G + h + 0.08)]], outline=0.008)


wing('mainhall', 0.1, 0.4, 0.7, 0.3, 0.16)
wing('sidewing', -0.55, 0.3, 0.3, 0.24, 0.12)
wing('frontwing', 0.45, 0.05, 0.36, 0.16, 0.12)
box('goldencanopy', M['gold'], 0.1, 0.4, G + 0.25, 0.08, 0.08, 0.03, outline=0.004, bevel=0)

# ---------- the octagonal Pattirippuwa ----------
PX, PY = -0.15, 0.0
lathe('pattirippuwa', M['white'], ((0.13, 0), (0.13, 0.16)), G - 0.005, PX, PY, segs=8, outline=0.012, smooth=False)
lathe('pattiupper', M['white'], ((0.115, 0), (0.115, 0.08)), G + 0.155, PX, PY, segs=8, outline=0.008, smooth=False)
for j in range(8):
    a = math.pi / 8 + j * math.pi / 4
    box(f'pattiwin{j}', M['window'], PX + 0.116 * math.cos(a), PY + 0.116 * math.sin(a), G + 0.17, 0.03, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('pattiroof', M['roof'], ((0.16, 0), (0.1, 0.05), (0.004, 0.11)), G + 0.235, PX, PY, segs=8, outline=0.008, smooth=False)
lathe('pattifinial', M['gold'], ((0.012, 0), (0.004, 0.04)), G + 0.34, PX, PY, segs=8, outline=0.002)

# ---------- palms and an elephant ----------
for k, (x, y) in enumerate(((-0.95, 0.0), (0.95, 0.35), (-0.85, 0.6), (0.75, 0.75))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.32), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.32), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.27), 0.019, outline=0.005)
EX, EY = 0.75, -0.35
for fx in (-0.05, 0.05):
    for side in (-1, 1):
        rod(f'eleleg{fx}{side}', M['elephant'], (EX + fx, EY + side * 0.03, G), (EX + fx, EY + side * 0.03, G + 0.07), 0.018, segs=8, outline=0.004)
b = ball('elebody', M['elephant'], 0, 0, 0, 0.06, outline=0.008)
b.scale = (1.4, 0.9, 0.9)
b.location = (EX, EY, G + 0.11)
ball('elehead', M['elephant'], EX + 0.09, EY, G + 0.13, 0.04, outline=0.006)
rod('eletrunk', M['elephant'], (EX + 0.12, EY, G + 0.12), (EX + 0.14, EY, G + 0.03), 0.012, r2=0.008, segs=6, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
