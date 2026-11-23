# A cartoon Nelson's Dockyard (the Antigua Naval Dockyard) for the country maps, built in the set's
# shared look (../toon.py): the Georgian dockyard on English Harbour, the brick Copper and Lumber
# Store with its arched windows, the officers' quarters with their veranda, the stone pillars of the
# old boathouse and sail loft standing by the water, the quay, yachts in the harbour, palms, and
# Shirley Heights' green hill behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nelsons-dockyard.py -- nelsons-dockyard-1024.png 1024 nelsons-dockyard.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'hill': toon('hill', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'quay': toon('quay', '#c9bfa8', shadow_mul=(0.8, 0.8, 0.88)),
    'brick': toon('brick', '#a8553c', shadow_mul=(0.84, 0.72, 0.72)),
    'stone': toon('stone', '#d8c8a8', shadow_mul=(0.8, 0.8, 0.86)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'roof': toon('roof', '#5a6068', shadow_mul=(0.78, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'shutter': toon('shutter', '#4f8a6a'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'sail': toon('sail', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'mast': toon('mast', '#b7bcc4'),
    'gun': toon('gun', '#2e2e34'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(607)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- English Harbour across the front, the quay along it ----------
R = 1.42
flat_face('harbour', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(198, 343, 6)], G + 0.004, outline=0.01)
QY = R * math.sin(math.radians(198))          # the shore's line
half = math.sqrt(R * R - QY * QY) - 0.06
box('quay', M['quay'], 0, QY + 0.06, G - 0.005, 2 * half, 0.12, 0.03, outline=0.008, bevel=0)

# ---------- Shirley Heights behind ----------
hill = loft('hill', M['hill'], [[(0.55 + 0.6 * math.cos(t), 0.9 + 0.32 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 18 for j in range(18))],
                                [(0.55 + 0.32 * math.cos(t), 0.95 + 0.18 * math.sin(t), G + 0.28) for t in (2 * math.pi * j / 18 for j in range(18))],
                                [(0.55 + 0.12 * math.cos(t), 0.98 + 0.07 * math.sin(t), G + 0.34) for t in (2 * math.pi * j / 18 for j in range(18))]], outline=0.025)
hill.visible_shadow = False
box('lookout', M['stone'], 0.55, 0.98, G + 0.33, 0.1, 0.06, 0.05, outline=0.006, bevel=0)

# ---------- the Copper and Lumber Store ----------
CX, CY, CW, CD, CH = -0.42, 0.12, 0.62, 0.24, 0.24
box('store', M['brick'], CX, CY, G - 0.005, CW, CD, CH, outline=0.02, bevel=0)
box('storeband', M['stone'], CX, CY, G + 0.11, CW + 0.006, CD + 0.006, 0.014, outline=0.003, bevel=0)
loft('storeroof', M['roof'], [[(CX - CW / 2 - 0.015, CY - CD / 2 - 0.015, G + CH - 0.005), (CX + CW / 2 + 0.015, CY - CD / 2 - 0.015, G + CH - 0.005),
                               (CX + CW / 2 + 0.015, CY + CD / 2 + 0.015, G + CH - 0.005), (CX - CW / 2 - 0.015, CY + CD / 2 + 0.015, G + CH - 0.005)],
                              [(CX - CW / 2 + 0.06, CY - 0.004, G + CH + 0.08), (CX + CW / 2 - 0.06, CY - 0.004, G + CH + 0.08), (CX + CW / 2 - 0.06, CY + 0.004, G + CH + 0.08),
                               (CX - CW / 2 + 0.06, CY + 0.004, G + CH + 0.08)]], outline=0.012)
for row, z in enumerate((0.03, 0.14)):
    for k in range(7):
        x = CX - CW / 2 + 0.06 + k * (CW - 0.12) / 6
        box(f'storearch{row}{k}', M['white'], x, CY - CD / 2 - 0.004, G + z, 0.045, 0.01, 0.07, outline=0, bevel=0)
        box(f'storewin{row}{k}', M['window'], x, CY - CD / 2 - 0.008, G + z + 0.006, 0.032, 0.01, 0.055, outline=0, bevel=0)

# ---------- the officers' quarters with their veranda ----------
OX, OY = 0.42, 0.42
box('quarters', M['stone'], OX, OY, G - 0.005, 0.42, 0.18, 0.12, outline=0.016, bevel=0)
box('quartersupper', M['white'], OX, OY, G + 0.115, 0.42, 0.18, 0.09, outline=0.014, bevel=0)
loft('quartersroof', M['roof'], [[(OX - 0.225, OY - 0.105, G + 0.2), (OX + 0.225, OY - 0.105, G + 0.2), (OX + 0.225, OY + 0.105, G + 0.2), (OX - 0.225, OY + 0.105, G + 0.2)],
                                 [(OX - 0.17, OY - 0.004, G + 0.26), (OX + 0.17, OY - 0.004, G + 0.26), (OX + 0.17, OY + 0.004, G + 0.26), (OX - 0.17, OY + 0.004, G + 0.26)]],
     outline=0.01)
for k in range(6):
    x = OX - 0.18 + k * 0.072
    rod(f'verandapost{k}', M['white'], (x, OY - 0.13, G + 0.115), (x, OY - 0.13, G + 0.2), 0.006, segs=6, outline=0.002)
    box(f'quarterswin{k}', M['shutter'], x, OY - 0.094, G + 0.14, 0.03, 0.01, 0.05, outline=0, bevel=0)
box('verandaroof', M['roof'], OX, OY - 0.12, G + 0.195, 0.44, 0.06, 0.012, outline=0.005, bevel=0)

# ---------- the old boathouse's stone pillars by the water ----------
PX, PY = 0.35, -0.12
for i in range(4):
    for j in range(2):
        x, y = PX - 0.24 + i * 0.16, PY - 0.06 + j * 0.14
        box(f'pillar{i}{j}', M['stone'], x, y, G - 0.005, 0.065, 0.065, 0.2, outline=0.01, bevel=0)
        box(f'pillarcap{i}{j}', M['stone'], x, y, G + 0.19, 0.085, 0.085, 0.025, outline=0.006, bevel=0)

# ---------- a cannon on the quay, palms ----------
box('carriage', M['roof'], -0.75, QY + 0.08, G + 0.02, 0.07, 0.05, 0.03, outline=0.004, bevel=0)
rod('cannon', M['gun'], (-0.75, QY + 0.1, G + 0.055), (-0.75, QY + 0.0, G + 0.06), 0.014, r2=0.011, segs=8, outline=0.003)
for k, (x, y) in enumerate(((-0.95, 0.45), (-0.05, 0.4), (0.95, 0.05), (-0.85, -0.12))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)

# ---------- yachts in the harbour ----------
for k, (x, y) in enumerate(((-0.45, -0.75), (0.1, -0.85), (0.6, -0.7))):
    loft(f'hull{k}', M['boat'], [[(x - 0.09, y, G + 0.002), (x + 0.06, y - 0.025, G + 0.002), (x + 0.1, y, G + 0.002), (x + 0.06, y + 0.025, G + 0.002)],
                                 [(x - 0.1, y, G + 0.035), (x + 0.06, y - 0.035, G + 0.035), (x + 0.12, y, G + 0.035), (x + 0.06, y + 0.035, G + 0.035)]], outline=0.008)
    rod(f'mast{k}', M['mast'], (x, y, G + 0.035), (x, y, G + 0.3), 0.004, segs=6, outline=0)
    if k != 1:
        loft(f'sail{k}', M['sail'], [[(x - 0.08, y - 0.002, G + 0.06), (x - 0.004, y - 0.002, G + 0.06), (x - 0.004, y - 0.002, G + 0.29)],
                                     [(x - 0.08, y + 0.002, G + 0.06), (x - 0.004, y + 0.002, G + 0.06), (x - 0.004, y + 0.002, G + 0.29)]], outline=0.006)

turn(before, -20)
render(G)
