# A cartoon Historic Willemstad for the country maps, built in the set's shared look (../toon.py):
# Curaçao's Handelskade, the row of bright Dutch colonial houses with curved and stepped gables
# under red tiles along St Anna Bay, and the Queen Emma Bridge, the swinging pontoon bridge with its
# string of lamp arches, floating across the water, with a tugboat. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P willemstad.py -- willemstad-1024.png 1024 willemstad.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bay': toon('bay', '#2f9ec0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'quay': toon('quay', '#d8ccb4', shadow_mul=(0.8, 0.8, 0.88)),
    'roof': toon('roof', '#c4573a'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'h1': toon('h1', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)), 'h2': toon('h2', '#6ab8e0', shadow_mul=(0.74, 0.8, 0.88)),
    'h3': toon('h3', '#f08a8a', shadow_mul=(0.84, 0.74, 0.8)), 'h4': toon('h4', '#7ac08a', shadow_mul=(0.74, 0.82, 0.78)),
    'h5': toon('h5', '#f2a050', shadow_mul=(0.84, 0.72, 0.6)), 'h6': toon('h6', '#c8a0e0', shadow_mul=(0.8, 0.76, 0.86)),
    'window': flat('window', '#3a3640'),
    'pontoon': toon('pontoon', '#5a6068', shadow_mul=(0.78, 0.8, 0.88)),
    'deck': toon('deck', '#b89a6a'),
    'lamp': toon('lamp', '#f4e8a0', lift=0.3),
    'tug': toon('tug', '#d0402f'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(719)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- St Anna Bay across the front, the Handelskade's quay along it ----------
R = 1.42
flat_face('bay', M['bay'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(196, 345, 6)], G + 0.004, outline=0.01)
QY = R * math.sin(math.radians(196))
half = math.sqrt(R * R - QY * QY) - 0.06
box('quay', M['quay'], 0, QY + 0.06, G - 0.005, 2 * half, 0.12, 0.025, outline=0.008, bevel=0)


# ---------- the gabled houses ----------
def gabled(name, x, y, w, d, h, mat, gable):
    box(name, M[mat], x, y, G - 0.005, w, d, h, outline=0.012, bevel=0)
    # the roof, its ridge running back from the gable
    loft(f'{name}roof', M['roof'], [[(x - w / 2, y - d / 2 + 0.01, G + h - 0.005), (x + w / 2, y - d / 2 + 0.01, G + h - 0.005), (x + w / 2, y + d / 2, G + h - 0.005),
                                     (x - w / 2, y + d / 2, G + h - 0.005)],
                                    [(x - 0.004, y - d / 2 + 0.01, G + h + 0.1), (x + 0.004, y - d / 2 + 0.01, G + h + 0.1), (x + 0.004, y + d / 2, G + h + 0.1),
                                     (x - 0.004, y + d / 2, G + h + 0.1)]], outline=0.01)
    # the gable in front of the roof: a curved one (shoulders, then a round top) or a stepped one
    if gable == 'curved':
        pts = [(x - w / 2, h), (x + w / 2, h), (x + w / 2, h + 0.04), (x + w * 0.3, h + 0.1), (x + w * 0.12, h + 0.15), (x - w * 0.12, h + 0.15),
               (x - w * 0.3, h + 0.1), (x - w / 2, h + 0.04)]
        loft(f'{name}gable', M[mat], [[(px, y - d / 2 - 0.004, G + pz) for px, pz in pts], [(px, y - d / 2 + 0.012, G + pz) for px, pz in pts]], outline=0.008)
    else:
        for s in range(3):
            gw = w * (1 - s * 0.3)
            box(f'{name}step{s}', M[mat], x, y - d / 2 + 0.004, G + h - 0.005 + s * 0.045, gw, 0.016, 0.05, outline=0.005, bevel=0)
    box(f'{name}trim', M['white'], x, y - d / 2 - 0.006, G + h - 0.008, w + 0.006, 0.01, 0.012, outline=0, bevel=0)
    for row, z in enumerate((0.04, 0.12, 0.2)):
        if z + 0.06 > h:
            continue
        for sx in (-1, 1):
            box(f'{name}win{row}{sx}', M['white'], x + sx * w * 0.22, y - d / 2 - 0.004, G + z, 0.034, 0.01, 0.05, outline=0, bevel=0)
            box(f'{name}pane{row}{sx}', M['window'], x + sx * w * 0.22, y - d / 2 - 0.008, G + z + 0.006, 0.022, 0.01, 0.038, outline=0, bevel=0)


ROW = [('h1', 0.2, 0.28, 'curved'), ('h2', 0.17, 0.24, 'stepped'), ('h3', 0.19, 0.3, 'curved'), ('h4', 0.16, 0.22, 'stepped'), ('h5', 0.2, 0.27, 'curved'),
       ('h6', 0.17, 0.25, 'stepped'), ('h2', 0.18, 0.29, 'curved'), ('h1', 0.16, 0.23, 'stepped')]
x = -0.72
for k, (mat, w, h, gable) in enumerate(ROW):
    gabled(f'house{k}', x + w / 2, QY + 0.25, w, 0.3, h, mat, gable)
    x += w + 0.005
for k, (px, py) in enumerate(((-0.95, 0.35), (0.95, 0.4), (-0.4, 0.7), (0.45, 0.75))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (px, py, G), (px + 0.03, py, G + h), 0.013, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (px + 0.03, py, G + h), (px + 0.03 + 0.1 * math.cos(b), py + 0.1 * math.sin(b), G + h - 0.05), 0.019, outline=0.005)

# ---------- the Queen Emma Bridge: pontoons, a deck and a string of lamp arches ----------
BX = 0.6
y0, y1 = QY + 0.02, -1.25
n = 7
for k in range(n):
    y = y0 + (y1 - y0) * (k + 0.5) / n
    box(f'pontoon{k}', M['pontoon'], BX, y, G - 0.005, 0.14, abs(y1 - y0) / n - 0.02, 0.03, outline=0.006, bevel=0)
box('deck', M['deck'], BX, (y0 + y1) / 2, G + 0.025, 0.12, abs(y1 - y0), 0.012, outline=0.006, bevel=0)
for k in range(n + 1):
    y = y0 + (y1 - y0) * k / n
    for sx in (-1, 1):
        rod(f'lamppost{k}{sx}', M['white'], (BX + sx * 0.055, y, G + 0.035), (BX + sx * 0.055, y, G + 0.1), 0.004, segs=5, outline=0.001)
    if k < n:
        ym = y + (y1 - y0) / n / 2
        for sx in (-1, 1):
            bar(f'arch{k}{sx}a', M['lamp'], (BX + sx * 0.055, y, G + 0.1), (BX + sx * 0.055, ym, G + 0.12), 0.008, outline=0.001)
            bar(f'arch{k}{sx}b', M['lamp'], (BX + sx * 0.055, ym, G + 0.12), (BX + sx * 0.055, y + (y1 - y0) / n, G + 0.1), 0.008, outline=0.001)

# ---------- a tugboat ----------
TX, TY = -0.25, -0.85
loft('tughull', M['tug'], [[(TX - 0.1, TY, G + 0.002), (TX + 0.05, TY - 0.04, G + 0.002), (TX + 0.11, TY, G + 0.002), (TX + 0.05, TY + 0.04, G + 0.002)],
                           [(TX - 0.11, TY, G + 0.045), (TX + 0.05, TY - 0.05, G + 0.045), (TX + 0.13, TY, G + 0.045), (TX + 0.05, TY + 0.05, G + 0.045)]], outline=0.008)
box('tugcabin', M['white'], TX - 0.01, TY, G + 0.04, 0.08, 0.06, 0.06, outline=0.006, bevel=0)
rod('tugfunnel', M['pontoon'], (TX - 0.04, TY, G + 0.1), (TX - 0.04, TY, G + 0.15), 0.014, segs=8, outline=0.004)

turn(before, -20)
render(G)
