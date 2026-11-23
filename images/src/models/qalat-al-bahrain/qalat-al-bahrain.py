# A cartoon Qal'at al-Bahrain for the country maps, built in the set's shared look (../toon.py):
# Bahrain's fort on its tell by the Gulf, the Portuguese fort's sand-coloured curtain walls with
# round corner bastions and a gate, the dig's trenches in the mound round it, date palms, and a dhow
# on the sea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P qalat-al-bahrain.py -- qalat-al-bahrain-1024.png 1024 qalat-al-bahrain.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e6cf9a', shadow_mul=(0.84, 0.76, 0.72), lift=0.25),
    'sea': toon('sea', '#2fa8c0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'tell': toon('tell', '#d4b884', shadow_mul=(0.84, 0.76, 0.72)),
    'dig': toon('dig', '#b08a5a'),
    'fort': toon('fort', '#dcc596', shadow_mul=(0.82, 0.76, 0.78)),
    'fortDark': toon('fortDark', '#c4ab7a', shadow_mul=(0.82, 0.76, 0.78)),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'dhow': toon('dhow', '#a8744a'),
    'sail': toon('sail', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(631)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the Gulf along the front ----------
R = 1.42
flat_face('sea', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(192, 349, 6)], G + 0.004, outline=0.01)
for k in range(2):
    y = -0.48 - k * 0.22
    half = math.sqrt(1.3 ** 2 - y * y)
    bar(f'wave{k}', M['sail'], (-half * 0.7, y, G + 0.01), (half * 0.7, y, G + 0.01), 0.02, outline=0.002)

# ---------- the tell, with the dig's trenches ----------
TC = (0.05, 0.32)
tell = loft('tell', M['tell'], [[(TC[0] + 0.9 * math.cos(t), TC[1] + 0.6 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 20 for j in range(20))],
                                [(TC[0] + 0.72 * math.cos(t), TC[1] + 0.48 * math.sin(t), G + 0.1) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.02)
tell.visible_shadow = False
TZ = G + 0.1
for k, (x, y, w, d) in enumerate(((-0.52, 0.05, 0.14, 0.32), (0.55, 0.45, 0.2, 0.12), (-0.4, 0.55, 0.18, 0.1))):
    box(f'trench{k}', M['dig'], x, y, TZ - 0.005, w, d, 0.01, outline=0.004, bevel=0)
    for j in range(2):
        box(f'trenchwall{k}{j}', M['fortDark'], x - w / 4 + j * w / 2, y, TZ, 0.02, d * 0.8, 0.04, outline=0.004, bevel=0)

# ---------- the fort ----------
FX, FY, S, H = 0.05, 0.22, 0.58, 0.2
corners = [(FX - S / 2, FY - S / 2), (FX + S / 2, FY - S / 2), (FX + S / 2, FY + S / 2), (FX - S / 2, FY + S / 2)]
for k in range(4):
    (x0, y0), (x1, y1) = corners[k], corners[(k + 1) % 4]
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'curtain{k}', M['fort'], (x0 + x1) / 2, (y0 + y1) / 2, TZ - 0.005, S, 0.06, H, rot_z=a, outline=0.016, bevel=0)
    for j in range(5):
        t = -0.2 + j * 0.1
        box(f'merlon{k}{j}', M['fort'], (x0 + x1) / 2 + t * math.cos(a), (y0 + y1) / 2 + t * math.sin(a), TZ + H - 0.005, 0.04, 0.065, 0.03, rot_z=a, outline=0.004,
            bevel=0)
for k, (x, y) in enumerate(corners):
    lathe(f'bastion{k}', M['fortDark'], ((0.1, 0), (0.095, H + 0.03)), TZ - 0.005, x, y, segs=16, outline=0.014)
    lathe(f'bastioncap{k}', M['fort'], ((0.1, 0), (0.1, 0.025)), TZ + H + 0.02, x, y, segs=16, outline=0.006)
box('gate', M['fortDark'], FX, FY - S / 2 - 0.01, TZ - 0.005, 0.14, 0.08, H + 0.04, outline=0.012, bevel=0)
box('gateway', M['window'], FX, FY - S / 2 - 0.052, TZ, 0.05, 0.01, 0.1, outline=0, bevel=0)
box('courtyard', M['tell'], FX, FY, TZ, S - 0.06, S - 0.06, 0.01, outline=0, bevel=0)
box('keep', M['fort'], FX + 0.1, FY + 0.12, TZ - 0.005, 0.16, 0.14, 0.12, outline=0.01, bevel=0)

# ---------- date palms and a dhow ----------
for k, (x, y) in enumerate(((-0.95, 0.1), (-0.8, 0.55), (0.95, 0.15), (0.85, -0.18), (-0.5, -0.2))):
    h = rng.uniform(0.24, 0.3)
    z0 = G
    rod(f'palmtrunk{k}', M['trunk'], (x, y, z0), (x + 0.03, y, z0 + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, z0 + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), z0 + h - 0.05), 0.02, outline=0.005)
DX, DY = 0.45, -0.85
loft('dhowhull', M['dhow'], [[(DX - 0.12, DY, G + 0.0), (DX + 0.08, DY - 0.03, G + 0.0), (DX + 0.13, DY, G + 0.0), (DX + 0.08, DY + 0.03, G + 0.0)],
                             [(DX - 0.15, DY, G + 0.06), (DX + 0.08, DY - 0.045, G + 0.045), (DX + 0.17, DY, G + 0.07), (DX + 0.08, DY + 0.045, G + 0.045)]], outline=0.008)
rod('dhowmast', M['dhow'], (DX, DY, G + 0.04), (DX, DY, G + 0.3), 0.006, segs=6, outline=0.002)
loft('dhowsail', M['sail'], [[(DX - 0.13, DY - 0.002, G + 0.08), (DX + 0.1, DY - 0.002, G + 0.12), (DX + 0.02, DY - 0.002, G + 0.31)],
                             [(DX - 0.13, DY + 0.002, G + 0.08), (DX + 0.1, DY + 0.002, G + 0.12), (DX + 0.02, DY + 0.002, G + 0.31)]], outline=0.006)

turn(before, -20)
render(G)
