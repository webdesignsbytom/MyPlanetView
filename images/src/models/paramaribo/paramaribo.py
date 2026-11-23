# A cartoon Historic Inner City of Paramaribo for the country maps, built in the set's shared look
# (../toon.py): Suriname's Dutch colonial capital, its white wooden houses with dark roofs and green
# shutters along the waterfront, the great wooden Cathedral of Saints Peter and Paul with its two
# grey-spired towers, royal palms, and a boat on the Suriname River. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P paramaribo.py -- paramaribo-1024.png 1024 paramaribo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#5a96a8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'quay': toon('quay', '#c9bfa8', shadow_mul=(0.8, 0.8, 0.88)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'cream': toon('cream2', '#f0e6cc', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'roof': toon('roof', '#4a4a52', shadow_mul=(0.8, 0.8, 0.88)),
    'spire': toon('spire', '#7a8088', shadow_mul=(0.8, 0.8, 0.88)),
    'shutter': toon('shutter', '#2f6e40'),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#b8b0a0'),
    'boat': toon('boat', '#3f7fc0'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(947)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the Suriname River along the front, its quay ----------
R = 1.42
flat_face('river', M['river'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(196, 345, 6)], G + 0.004, outline=0.01)
QY = R * math.sin(math.radians(196))
box('quay', M['quay'], 0, QY + 0.05, G - 0.005, 2 * (math.sqrt(R * R - QY * QY) - 0.06), 0.1, 0.03, outline=0.008, bevel=0)


# ---------- the white wooden houses ----------
def house(name, x, y, w, d, h):
    box(name, M['white'], x, y, G - 0.005, w, d, h, outline=0.012, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.015, y - d / 2 - 0.015, G + h - 0.005), (x + w / 2 + 0.015, y - d / 2 - 0.015, G + h - 0.005),
                                     (x + w / 2 + 0.015, y + d / 2 + 0.015, G + h - 0.005), (x - w / 2 - 0.015, y + d / 2 + 0.015, G + h - 0.005)],
                                    [(x - w * 0.25, y - 0.004, G + h + 0.09), (x + w * 0.25, y - 0.004, G + h + 0.09), (x + w * 0.25, y + 0.004, G + h + 0.09),
                                     (x - w * 0.25, y + 0.004, G + h + 0.09)]], outline=0.01)
    for row, z in enumerate((0.03, 0.12)):
        if z + 0.06 > h:
            continue
        for j in range(3):
            box(f'{name}shutter{row}{j}', M['shutter'], x - w * 0.3 + j * w * 0.3, y - d / 2 - 0.004, G + z, 0.035, 0.01, 0.06, outline=0, bevel=0)
    box(f'{name}steps', M['cream'], x, y - d / 2 - 0.03, G - 0.005, 0.06, 0.05, 0.025, outline=0.003, bevel=0)


for k, (x, y, w, h) in enumerate(((-0.85, -0.12, 0.26, 0.2), (-0.5, -0.15, 0.24, 0.22), (0.5, -0.15, 0.24, 0.2), (0.85, -0.1, 0.26, 0.18), (-0.75, 0.42, 0.24, 0.2),
                                  (0.72, 0.45, 0.24, 0.22))):
    house(f'house{k}', x, y, w, 0.2, h)

# ---------- the Cathedral of Saints Peter and Paul ----------
CX, CY = 0.0, 0.32
box('cathedral', M['cream'], CX, CY + 0.06, G - 0.005, 0.32, 0.56, 0.26, outline=0.018, bevel=0)
loft('cathedralroof', M['roof'], [[(CX - 0.18, CY - 0.22, G + 0.255), (CX + 0.18, CY - 0.22, G + 0.255), (CX + 0.18, CY + 0.35, G + 0.255), (CX - 0.18, CY + 0.35, G + 0.255)],
                                  [(CX - 0.004, CY - 0.22, G + 0.38), (CX + 0.004, CY - 0.22, G + 0.38), (CX + 0.004, CY + 0.35, G + 0.38), (CX - 0.004, CY + 0.35, G + 0.38)]],
     outline=0.012)
for k in range(4):
    box(f'cathedralwin{k}', M['window'], CX - 0.162, CY - 0.12 + k * 0.12, G + 0.1, 0.01, 0.035, 0.09, outline=0, bevel=0)
box('rosewindow', M['window'], CX, CY - 0.226, G + 0.2, 0.06, 0.01, 0.06, outline=0, bevel=0)
box('cathedraldoor', M['window'], CX, CY - 0.226, G, 0.06, 0.01, 0.12, outline=0, bevel=0)
for s in (-1, 1):
    tx = CX + s * 0.13
    box(f'tower{s}', M['cream'], tx, CY - 0.18, G - 0.005, 0.11, 0.11, 0.42, outline=0.012, bevel=0)
    box(f'belfry{s}', M['window'], tx, CY - 0.237, G + 0.32, 0.035, 0.01, 0.06, outline=0, bevel=0)
    pyramid(f'spire{s}', M['spire'], tx, CY - 0.18, G + 0.415, 0.13, 0.22, outline=0.01)

# ---------- royal palms and a boat ----------
for k, (x, y) in enumerate(((-0.3, -0.25), (0.3, -0.25), (-1.05, 0.2), (1.05, 0.15), (-0.35, 0.75), (0.35, 0.85))):
    h = rng.uniform(0.3, 0.36)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.016, r2=0.013, segs=8, outline=0.006)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x, y, G + h), (x + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.04), 0.02, outline=0.005)
BX, BY = 0.3, -0.85
loft('boat', M['boat'], [[(BX - 0.1, BY, G + 0.002), (BX + 0.06, BY - 0.03, G + 0.002), (BX + 0.11, BY, G + 0.002), (BX + 0.06, BY + 0.03, G + 0.002)],
                         [(BX - 0.11, BY, G + 0.04), (BX + 0.06, BY - 0.04, G + 0.04), (BX + 0.13, BY, G + 0.04), (BX + 0.06, BY + 0.04, G + 0.04)]], outline=0.007)
box('boatcabin', M['white'], BX - 0.02, BY, G + 0.035, 0.07, 0.05, 0.04, outline=0.005, bevel=0)

turn(before, -20)
render(G)
