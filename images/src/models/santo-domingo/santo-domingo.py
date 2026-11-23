# A cartoon Colonial City of Santo Domingo for the country maps, built in the set's shared look
# (../toon.py): the Alcázar de Colón, the coral-stone palace of Columbus's son, its two storeys of
# open arcades between solid wings, the Plaza de España in front with a fountain, the cathedral's
# bell gable behind, the colourful colonial houses with their balconies along Calle Las Damas,
# and royal palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P santo-domingo.py -- santo-domingo-1024.png 1024 santo-domingo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ddd3c0', lift=0.25),
    'coral': toon('coral', '#d8c094', shadow_mul=(0.84, 0.78, 0.74)),
    'coralDark': toon('coralDark', '#b8a074', shadow_mul=(0.84, 0.78, 0.74)),
    'arch': flat('arch', '#4a3a30'),
    'window': flat('window', '#3a3640'),
    'wood': toon('wood', '#6b4a33'),
    'pink': toon('pink', '#e8a8b8', shadow_mul=(0.84, 0.74, 0.82)),
    'turq': toon('turq', '#6ac0c0', shadow_mul=(0.72, 0.84, 0.86)),
    'yellow': toon('hyellow', '#f2d27a', shadow_mul=(0.84, 0.74, 0.62)),
    'orange': toon('horange', '#f0a060', shadow_mul=(0.84, 0.74, 0.62)),
    'roof': toon('roof', '#c4573a'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#c9bea6', shadow_mul=(0.8, 0.8, 0.86)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(463)


def slab(name, mat, pts, y0, y1):
    loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=0)


def round_arch(name, mat, x, z0, w, h, y):
    r = w / 2
    pts = [(x - r, z0), (x + r, z0)] + [(x + r * math.cos(t), z0 + h + r * math.sin(t)) for t in (math.pi * k / 8 for k in range(9))]
    slab(name, mat, pts, y - 0.004, y + 0.002)


# ---------- the Alcázar de Colón ----------
AX, AY, AW, AD = 0.0, 0.35, 0.9, 0.3
FY = AY - AD / 2
box('alcazar', M['coral'], AX, AY, G - 0.005, AW, AD, 0.38, outline=0.024, bevel=0.003)
box('parapet', M['coralDark'], AX, AY, G + 0.375, AW + 0.02, AD + 0.02, 0.03, outline=0.012, bevel=0)
# the two storeys of open arcades in the middle, set back between the wings
box('loggiaback', M['arch'], AX, FY + 0.003, G + 0.02, 0.5, 0.01, 0.34, outline=0, bevel=0)
for row, (z0, h) in enumerate(((0.0, 0.1), (0.19, 0.08))):
    for k in range(5):
        x = AX - 0.2 + k * 0.1
        rod(f'pillar{row}{k}', M['coral'], (x - 0.05, FY - 0.03, G + z0), (x - 0.05, FY - 0.03, G + z0 + h + 0.05), 0.013, segs=8, outline=0.005)
    rod(f'pillarend{row}', M['coral'], (AX + 0.25, FY - 0.03, G + z0), (AX + 0.25, FY - 0.03, G + z0 + h + 0.05), 0.013, segs=8, outline=0.005)
    box(f'arcadebeam{row}', M['coral'], AX, FY - 0.03, G + z0 + h + 0.04, 0.52, 0.03, 0.04 if row == 0 else 0.07, outline=0.008, bevel=0)
    if row == 1:
        box('balustrade', M['coralDark'], AX, FY - 0.03, G + z0 + 0.05, 0.5, 0.025, 0.02, outline=0, bevel=0)
# the solid wings with their small windows
for s in (-1, 1):
    x = AX + s * 0.36
    for row, z in enumerate((0.08, 0.25)):
        box(f'wingwin{s}{row}', M['window'], x, FY - 0.004, G + z, 0.04, 0.01, 0.06, outline=0, bevel=0)
        box(f'wingshutter{s}{row}', M['wood'], x, FY - 0.006, G + z + 0.065, 0.05, 0.01, 0.01, outline=0, bevel=0)

# ---------- the cathedral's bell gable behind ----------
CX, CY = -0.55, 0.85
box('cathedral', M['coralDark'], CX, CY, G - 0.005, 0.3, 0.22, 0.32, outline=0.018, bevel=0)
slab('bellgable', M['coralDark'], [(CX - 0.08, G + 0.315), (CX + 0.08, G + 0.315), (CX + 0.08, G + 0.43), (CX, G + 0.48), (CX - 0.08, G + 0.43)], CY - 0.11, CY - 0.07)
for s in (-1, 1):
    round_arch(f'bellopening{s}', M['arch'], CX + s * 0.035, G + 0.34, 0.04, 0.04, CY - 0.112)

# ---------- the Plaza de España and its fountain ----------
lathe('fountain', M['coral'], ((0.12, 0), (0.12, 0.04)), G, 0.05, -0.3, segs=24, outline=0.01)
cyl('fountainwater', M['water'], 0.105, 0.01, segs=24, outline=0, matrix=Matrix.Translation((0.05, -0.3, G + 0.035)))
lathe('fountainpost', M['coral'], ((0.02, 0), (0.015, 0.1), (0.04, 0.12), (0.01, 0.14)), G + 0.04, 0.05, -0.3, segs=12, outline=0.005)

# ---------- colourful houses with balconies along Calle Las Damas ----------
for k, (y, mat) in enumerate(((-0.85, 'pink'), (-0.6, 'turq'), (-0.35, 'yellow'), (-0.1, 'orange'))):
    x = 0.85
    box(f'house{k}', M[mat], x, y, G - 0.005, 0.22, 0.22, 0.22, outline=0.014, bevel=0)
    box(f'housecornice{k}', M['paving'], x, y, G + 0.215, 0.23, 0.23, 0.02, outline=0.006, bevel=0)
    box(f'housedoor{k}', M['wood'], x - 0.112, y, G, 0.01, 0.05, 0.1, outline=0, bevel=0)
    box(f'balcony{k}', M['wood'], x - 0.13, y, G + 0.13, 0.04, 0.1, 0.012, outline=0.004, bevel=0)
    box(f'balconyrail{k}', M['wood'], x - 0.148, y, G + 0.142, 0.006, 0.1, 0.03, outline=0, bevel=0)
    box(f'housewin{k}', M['wood'], x - 0.112, y, G + 0.15, 0.01, 0.05, 0.05, outline=0, bevel=0)

# ---------- royal palms ----------
for k, (x, y) in enumerate(((-0.75, -0.25), (-0.95, 0.25), (0.5, -0.75), (-0.4, -0.75), (0.6, 0.55))):
    h = rng.uniform(0.42, 0.5)
    lathe(f'palmtrunk{k}', M['trunk'], ((0.022, 0), (0.016, h * 0.6), (0.02, h * 0.75), (0.014, h)), G, x, y, segs=8, outline=0.006, smooth=False)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x, y, G + h), (x + 0.13 * math.cos(b), y + 0.13 * math.sin(b), G + h - 0.06), 0.024, outline=0.006)

turn(before, -20)
render(G)
