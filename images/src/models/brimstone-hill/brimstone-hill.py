# A cartoon Brimstone Hill Fortress for the country maps, built in the set's shared look (../toon.py):
# St Kitts' "Gibraltar of the West Indies", the citadel of Fort George with its dark basalt walls,
# pale stone parapets, bastions, cannons and flag on the top of its steep green hill, the lower walls
# and the Prince of Wales Bastion on the slope, palms on the beach below, a yacht on the Caribbean
# and Sint Eustatius' volcano out at sea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P brimstone-hill.py -- brimstone-hill-1024.png 1024 brimstone-hill.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'beach': toon('beach', '#f2e2b8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'hill': toon('hill', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'basalt': toon('basalt', '#6e6862', shadow_mul=(0.8, 0.8, 0.88)),
    'mortar': toon('mortar', '#c8c0b0', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'parade': toon('parade', '#d8cba8', lift=0.25),
    'roofGrey': toon('roofGrey', '#7a7f88', shadow_mul=(0.78, 0.8, 0.88)),
    'window': flat('window', '#2e2a30'),
    'gun': toon('gun', '#2e2e34'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'island': toon('island', '#4f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'sail': toon('sail', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'mast': toon('mast', '#b7bcc4'),
    'flagGreen': flat('flagGreen', '#009e49'), 'flagGold': flat('flagGold', '#fcd116'),
    'flagBlack': flat('flagBlack', '#1e1e22'), 'flagRed': flat('flagRed', '#ce1126'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(577)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def ring(cx, cy, rx, ry, z, jitter, sides=22):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the beach and the Caribbean across the front ----------
R = 1.42


def segment(a0, a1):
    return [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(a0, a1 + 1, 6)]


flat_face('beach', M['beach'], segment(192, 348), G + 0.003, outline=0.01)
flat_face('sea', M['sea'], segment(205, 335), G + 0.006, outline=0.01)
bar('surf', M['foam'], (-1.2, -0.625, G + 0.01), (1.2, -0.625, G + 0.01), 0.025, outline=0.003)
lathe('statia', M['island'], ((0.16, 0), (0.1, 0.06), (0.04, 0.12), (0.004, 0.13)), G + 0.004, -0.6, -1.02, segs=16, outline=0.012)
BX, BY = 0.45, -0.95
loft('boathull', M['boat'], [[(BX - 0.09, BY, G + 0.004), (BX + 0.06, BY - 0.025, G + 0.004), (BX + 0.1, BY, G + 0.004), (BX + 0.06, BY + 0.025, G + 0.004)],
                             [(BX - 0.1, BY, G + 0.035), (BX + 0.06, BY - 0.035, G + 0.035), (BX + 0.12, BY, G + 0.035), (BX + 0.06, BY + 0.035, G + 0.035)]], outline=0.008)
rod('boatmast', M['mast'], (BX, BY, G + 0.035), (BX, BY, G + 0.27), 0.004, segs=6, outline=0)
loft('boatsail', M['sail'], [[(BX - 0.08, BY - 0.002, G + 0.055), (BX - 0.004, BY - 0.002, G + 0.055), (BX - 0.004, BY - 0.002, G + 0.26)],
                             [(BX - 0.08, BY + 0.002, G + 0.055), (BX - 0.004, BY + 0.002, G + 0.055), (BX - 0.004, BY + 0.002, G + 0.26)]], outline=0.006)

# ---------- Brimstone Hill ----------
HC = (0.0, 0.42)
hill = loft('hill', M['hill'], [ring(*HC, 0.95, 0.72, -0.01, 0.04), ring(*HC, 0.62, 0.48, 0.32, 0.05), ring(*HC, 0.44, 0.36, 0.5, 0.03), ring(*HC, 0.42, 0.34, 0.52, 0.0)],
            outline=0.03, smooth=True)
hill.visible_shadow = False
for k in range(9):
    a = math.radians(-10 + k * 25)
    ball(f'hillforest{k}', M['forest'], HC[0] + 0.8 * math.cos(a), HC[1] + 0.6 * math.sin(a), G + 0.14, rng.uniform(0.07, 0.09), outline=0.014)

# ---------- the citadel, Fort George, on the top ----------
CX, CY = 0.0, 0.45
FZ, TOPZ = G + 0.5, G + 0.64
box('citadel', M['basalt'], CX, CY, FZ, 0.34, 0.3, 0.14, outline=0.018, bevel=0)
box('parade', M['parade'], CX, CY, TOPZ - 0.004, 0.3, 0.26, 0.008, outline=0, bevel=0)
for k, (x, y) in enumerate([(CX + sx * 0.17, CY + sy * 0.15) for sx in (-1, 1) for sy in (-1, 1)]):
    box(f'bastion{k}', M['basalt'], x, y, FZ, 0.13, 0.13, 0.14, rot_z=math.pi / 4, outline=0.016, bevel=0)
    box(f'bastioncap{k}', M['mortar'], x, y, TOPZ, 0.135, 0.135, 0.02, rot_z=math.pi / 4, outline=0.006, bevel=0)
for k, (x, y, sx, sy) in enumerate(((CX, CY - 0.145, 0.22, 0.02), (CX, CY + 0.145, 0.22, 0.02), (CX - 0.165, CY, 0.02, 0.18), (CX + 0.165, CY, 0.02, 0.18))):
    box(f'parapet{k}', M['mortar'], x, y, TOPZ, sx, sy, 0.03, outline=0.006, bevel=0)
for k in range(3):
    x = CX - 0.06 + 0.06 * k
    box(f'citadelwin{k}', M['window'], x, CY - 0.154, FZ + 0.05, 0.024, 0.01, 0.04, outline=0, bevel=0)
    rod(f'gun{k}', M['gun'], (x, CY - 0.13, TOPZ + 0.018), (x, CY - 0.2, TOPZ + 0.024), 0.01, r2=0.008, segs=8, outline=0.003)
box('barracks', M['mortar'], CX - 0.03, CY + 0.05, TOPZ, 0.16, 0.08, 0.06, outline=0.008, bevel=0)
loft('barracksroof', M['roofGrey'], [[(CX - 0.12, CY + 0.005, TOPZ + 0.058), (CX + 0.06, CY + 0.005, TOPZ + 0.058), (CX + 0.06, CY + 0.095, TOPZ + 0.058),
                                      (CX - 0.12, CY + 0.095, TOPZ + 0.058)],
                                     [(CX - 0.11, CY + 0.046, TOPZ + 0.1), (CX + 0.05, CY + 0.046, TOPZ + 0.1), (CX + 0.05, CY + 0.054, TOPZ + 0.1),
                                      (CX - 0.11, CY + 0.054, TOPZ + 0.1)]], outline=0.008)
FX, FY = CX + 0.17, CY + 0.15
rod('flagpole', M['mortar'], (FX, FY, TOPZ + 0.02), (FX, FY, TOPZ + 0.27), 0.005, segs=6, outline=0)
z = TOPZ + 0.265
for k, (mat, h) in enumerate((('flagGreen', 0.022), ('flagGold', 0.006), ('flagBlack', 0.016), ('flagGold', 0.006), ('flagRed', 0.022))):
    z -= h
    box(f'flag{k}', M[mat], FX + 0.055, FY, z, 0.1, 0.006, h, outline=0, bevel=0)

# ---------- the lower walls and the Prince of Wales Bastion on the slope ----------
LW = [(HC[0] + 0.66 * math.cos(math.radians(a)), HC[1] + 0.52 * math.sin(math.radians(a))) for a in range(195, 346, 10)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(LW, LW[1:])):
    length, a = math.hypot(x1 - x0, y1 - y0), math.atan2(y1 - y0, x1 - x0)
    box(f'lowerwall{k}', M['basalt'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.24, length + 0.01, 0.05, 0.13, rot_z=a, outline=0.01, bevel=0)
    box(f'lowerwallcap{k}', M['mortar'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.37, length + 0.012, 0.06, 0.015, rot_z=a, outline=0.004, bevel=0)
PX, PY = HC[0], HC[1] - 0.55
box('princeofwales', M['basalt'], PX, PY, G + 0.15, 0.17, 0.17, 0.22, rot_z=math.pi / 4, outline=0.014, bevel=0)
box('princeofwalescap', M['mortar'], PX, PY, G + 0.37, 0.175, 0.175, 0.02, rot_z=math.pi / 4, outline=0.005, bevel=0)
for k, dx in enumerate((-0.045, 0.045)):
    rod(f'lowergun{k}', M['gun'], (PX + dx, PY - 0.06, G + 0.4), (PX + dx * 1.6, PY - 0.14, G + 0.405), 0.01, r2=0.008, segs=8, outline=0.003)

# ---------- palms on the beach ----------
for k, (x, y) in enumerate(((-0.95, -0.4), (-0.6, -0.45), (0.65, -0.42), (1.0, -0.35))):
    h = rng.uniform(0.2, 0.26)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.013, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), G + h - 0.05), 0.018, outline=0.005)

turn(before, -20)
render(G)
