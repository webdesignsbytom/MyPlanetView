# A cartoon Historic Town of St George, Bermuda, for the country maps, built in the set's shared
# look (../toon.py): the old colonial town's pastel cottages under stepped white limestone roofs,
# St Peter's Church, white with its tower, the harbour and its quay, the Deliverance (the replica of
# the ship the Sea Venture's castaways built) moored there, and palms. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P st-george-bermuda.py -- st-george-bermuda-1024.png 1024 st-george-bermuda.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'quay': toon('quay', '#d8ccb4', shadow_mul=(0.8, 0.8, 0.88)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'pink': toon('pink', '#f2b8c0', shadow_mul=(0.84, 0.74, 0.82)), 'yellow': toon('yellow', '#f4d882', shadow_mul=(0.84, 0.74, 0.62)),
    'blue': toon('blue', '#9cd0ea', shadow_mul=(0.74, 0.8, 0.88)), 'green': toon('green', '#a8dcaa', shadow_mul=(0.74, 0.82, 0.78)),
    'window': flat('window', '#3a3640'),
    'shutter': toon('shutter', '#4f8a6a'),
    'wood': toon('wood', '#8a5a3a'),
    'sail': toon('sail', '#f4efe2', lift=0.15),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(647)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the harbour ----------
R = 1.42
flat_face('harbour', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(198, 343, 6)], G + 0.004, outline=0.01)
QY = R * math.sin(math.radians(198))
box('quay', M['quay'], 0, QY + 0.05, G - 0.005, 2 * (math.sqrt(R * R - QY * QY) - 0.06), 0.1, 0.03, outline=0.008, bevel=0)


# ---------- cottages under stepped white roofs ----------
def cottage(name, x, y, w, d, h, mat):
    box(name, M[mat], x, y, G - 0.005, w, d, h, outline=0.012, bevel=0)
    steps = 4
    for s in range(steps):
        f = 1 - s / steps
        box(f'{name}roof{s}', M['white'], x, y, G + h - 0.005 + s * 0.022, (w + 0.02) * f + 0.02 * (1 - f), (d + 0.02) * f + 0.02 * (1 - f), 0.024, outline=0.005, bevel=0)
    box(f'{name}door', M['window'], x, y - d / 2 - 0.004, G, 0.03, 0.01, 0.06, outline=0, bevel=0)
    for sx in (-1, 1):
        box(f'{name}win{sx}', M['shutter'], x + sx * w * 0.28, y - d / 2 - 0.004, G + 0.04, 0.03, 0.01, 0.04, outline=0, bevel=0)


for k, (x, y, w, mat) in enumerate(((-0.85, -0.15, 0.2, 'pink'), (-0.6, 0.1, 0.18, 'yellow'), (-0.3, -0.18, 0.2, 'blue'), (0.75, -0.15, 0.2, 'green'),
                                    (0.95, 0.25, 0.18, 'pink'), (-0.85, 0.5, 0.18, 'green'), (0.55, 0.65, 0.2, 'yellow'), (-0.4, 0.8, 0.18, 'pink'),
                                    (0.15, 0.95, 0.18, 'blue'))):
    cottage(f'cottage{k}', x, y, w, 0.15, rng.uniform(0.1, 0.13), mat)

# ---------- St Peter's Church ----------
SX, SY = 0.2, 0.3
box('church', M['white'], SX, SY, G - 0.005, 0.24, 0.42, 0.16, outline=0.016, bevel=0)
loft('churchroof', M['white'], [[(SX - 0.135, SY - 0.22, G + 0.155), (SX + 0.135, SY - 0.22, G + 0.155), (SX + 0.135, SY + 0.22, G + 0.155), (SX - 0.135, SY + 0.22, G + 0.155)],
                                [(SX - 0.004, SY - 0.2, G + 0.26), (SX + 0.004, SY - 0.2, G + 0.26), (SX + 0.004, SY + 0.2, G + 0.26), (SX - 0.004, SY + 0.2, G + 0.26)]],
     outline=0.012)
for s in (-1, 1):
    for k in range(3):
        box(f'churchwin{s}{k}', M['window'], SX + s * 0.124, SY - 0.12 + k * 0.12, G + 0.06, 0.01, 0.03, 0.06, outline=0, bevel=0)
TX, TY = SX, SY - 0.27
box('tower', M['white'], TX, TY, G - 0.005, 0.13, 0.13, 0.36, outline=0.014, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'towerpinnacle{sx}{sy}', M['white'], ((0.014, 0), (0.014, 0.03), (0.003, 0.06)), G + 0.355, TX + sx * 0.055, TY + sy * 0.055, segs=4, outline=0.003,
              smooth=False)
box('towerdoor', M['window'], TX, TY - 0.067, G, 0.04, 0.01, 0.08, outline=0, bevel=0)
box('towerwin', M['window'], TX, TY - 0.067, G + 0.22, 0.03, 0.01, 0.05, outline=0, bevel=0)

# ---------- the Deliverance at the quay ----------
# moored bow out, stern to the quay, so her square sails face the harbour
DX, DY = -0.25, QY - 0.22
loft('shiphull', M['wood'], [[(DX, DY - 0.17, G + 0.0), (DX + 0.05, DY + 0.1, G + 0.0), (DX, DY + 0.18, G + 0.0), (DX - 0.05, DY + 0.1, G + 0.0)],
                             [(DX, DY - 0.2, G + 0.08), (DX + 0.07, DY + 0.1, G + 0.07), (DX, DY + 0.21, G + 0.1), (DX - 0.07, DY + 0.1, G + 0.07)]], outline=0.01)
for k, (my, mh) in enumerate(((-0.06, 0.32), (0.08, 0.38))):
    rod(f'shipmast{k}', M['wood'], (DX, DY + my, G + 0.07), (DX, DY + my, G + mh), 0.007, segs=6, outline=0.002)
    for j, (z, w) in enumerate(((mh - 0.16, 0.13), (mh - 0.06, 0.09))):
        box(f'shipsail{k}{j}', M['sail'], DX, DY + my, G + z, w, 0.012, 0.08, outline=0.004, bevel=0)

# ---------- palms ----------
for k, (x, y) in enumerate(((-1.1, 0.15), (0.45, 0.05), (1.1, -0.05), (-0.1, 0.55))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)

turn(before, -20)
render(G)
