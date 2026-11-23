# A cartoon Jesuit Mission of La Santísima Trinidad de Paraná for the country maps, built in the
# set's shared look (../toon.py): the red sandstone ruins on their hill, the great church open to
# the sky, its front with the big arched doorway, the frieze of angels playing music along its
# walls, the arched windows and the apse; the stone bell tower; the arcades of the houses round the
# plaza; and trees on the green. Turned a little towards the camera.
# Run: blender -b --factory-startup -P trinidad-mission.py -- trinidad-mission-1024.png 1024 trinidad-mission.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#86c464', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'sandstone': toon('sandstone', '#b8653e', shadow_mul=(0.84, 0.72, 0.72)),
    'sandstoneDark': toon('sandstoneDark', '#984f30', shadow_mul=(0.84, 0.72, 0.72)),
    'frieze': toon('frieze', '#d08a5e', shadow_mul=(0.84, 0.72, 0.72)),
    'opening': flat('opening', '#5a3a2a'),
    'floor': toon('floor', '#c9a07a', shadow_mul=(0.84, 0.76, 0.74)),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5238'),
    'moss': flat('moss', '#7a8a52'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(433)


def slab(name, mat, pts, y0, y1, outline=0.0):
    return loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=outline)


def round_arch_pts(x, z0, w, h):
    r = w / 2
    return [(x - r, z0), (x + r, z0)] + [(x + r * math.cos(t), z0 + h + r * math.sin(t)) for t in (math.pi * k / 8 for k in range(9))]


# ---------- the church: its floor and the roofless walls ----------
CX, CY, CW, CL, CH = -0.05, 0.25, 0.5, 1.0, 0.36
FY = CY - CL / 2
box('churchfloor', M['floor'], CX, CY, G - 0.005, CW, CL, 0.015, outline=0.008, bevel=0)
for s in (-1, 1):
    x = CX + s * CW / 2
    # the side walls, broken down towards the back
    for k in range(5):
        y0 = FY + k * CL / 5
        h = CH * (1.0 if k < 3 else (0.75 if k == 3 else 0.45))
        box(f'side{s}{k}', M['sandstone'], x, y0 + CL / 10, G - 0.005, 0.05, CL / 5 + 0.002, h, outline=0.014, bevel=0)
    # the frieze of music-making angels: a band of little reliefs near the top
    box(f'frieze{s}', M['frieze'], x - s * 0.028, CY - CL * 0.1, G + CH - 0.07, 0.008, CL * 0.6, 0.04, outline=0, bevel=0)
    for k in range(10):
        y = FY + 0.08 + k * 0.06
        ball(f'angel{s}{k}', M['sandstoneDark'], x - s * 0.033, y, G + CH - 0.05, 0.012, outline=0)
# the window openings, as dark arches set into the side walls
for s in (-1, 1):
    x = CX + s * (CW / 2 + 0.027)
    for k in range(4):
        y = FY + (k + 0.5) * CL / 5
        pts = round_arch_pts(y, G + 0.14, 0.07, 0.06)
        loft(f'window{s}{k}', M['opening'], [[(x - 0.004, py, pz) for py, pz in pts], [(x + 0.004, py, pz) for py, pz in pts]], outline=0)
# the front, with its great arched doorway and side doors, rising to a gable
front = [(CX - CW / 2 - 0.025, G - 0.005), (CX + CW / 2 + 0.025, G - 0.005), (CX + CW / 2 + 0.025, G + CH), (CX + 0.12, G + CH + 0.08), (CX, G + CH + 0.13),
         (CX - 0.12, G + CH + 0.08), (CX - CW / 2 - 0.025, G + CH)]
slab('front', M['sandstone'], front, FY - 0.03, FY + 0.03, outline=0.018)
slab('door', M['opening'], round_arch_pts(CX, G, 0.13, 0.15), FY - 0.034, FY - 0.028)
for s in (-1, 1):
    slab(f'sidedoor{s}', M['opening'], round_arch_pts(CX + s * 0.16, G, 0.07, 0.09), FY - 0.034, FY - 0.028)
    box(f'pilaster{s}', M['sandstoneDark'], CX + s * 0.1, FY - 0.036, G, 0.025, 0.012, CH, outline=0, bevel=0)
slab('rosewindow', M['opening'], [(CX + 0.035 * math.cos(t), G + CH - 0.03 + 0.035 * math.sin(t)) for t in (2 * math.pi * k / 12 for k in range(12))],
     FY - 0.034, FY - 0.028)
# the apse at the back, half fallen: a curved wall, open to the church
AY = CY + CL / 2
outer = [(CX + 0.24 * math.cos(t), AY + 0.24 * math.sin(t)) for t in (math.pi * k / 12 for k in range(13))]
inner = [(CX + 0.2 * math.cos(t), AY + 0.2 * math.sin(t)) for t in (math.pi * (12 - k) / 12 for k in range(13))]
apse = outer + inner
loft('apse', M['sandstone'], [[(x, y, G - 0.005) for x, y in apse], [(x, y, G + CH * 0.45) for x, y in apse]], outline=0.014)

# ---------- the stone bell tower ----------
TX, TY = 0.5, -0.35
box('tower', M['sandstone'], TX, TY, G - 0.005, 0.16, 0.16, 0.5, outline=0.018, bevel=0)
for k, z in enumerate((0.2, 0.36)):
    slab(f'towerarch{k}', M['opening'], round_arch_pts(TX, G + z, 0.06, 0.05), TY - 0.084, TY - 0.078)
box('towertop', M['sandstoneDark'], TX, TY, G + 0.495, 0.18, 0.18, 0.04, outline=0.012, bevel=0)

# ---------- the arcades of the houses round the plaza ----------
for k in range(7):
    x = -0.85 + k * 0.12
    y = -0.8
    for s in (-1, 1):
        box(f'arcpier{k}{s}', M['sandstone'], x + s * 0.045, y, G - 0.005, 0.03, 0.05, 0.15 if k != 4 else 0.08, outline=0.008, bevel=0)
    if k != 4:
        box(f'arclintel{k}', M['sandstoneDark'], x, y, G + 0.145, 0.12, 0.05, 0.03, outline=0.008, bevel=0)
for k in range(6):
    box(f'housewall{k}', M['sandstone'], -0.85 + k * 0.14, -0.95, G - 0.005, 0.12, 0.04, rng.uniform(0.05, 0.11), outline=0.008, bevel=0)

# ---------- moss on the stones, trees on the green ----------
for k in range(6):
    box(f'moss{k}', M['moss'], CX + rng.choice((-1, 1)) * (CW / 2 + 0.026), FY + rng.uniform(0.1, 0.7), G + rng.uniform(0.02, 0.1), 0.01, 0.06, 0.04, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.75, 0.35), (-0.8, -0.3), (0.65, 0.4), (0.9, -0.05), (0.15, 1.05))):
    rod(f'treetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.2), 0.022, segs=8, outline=0.008)
    ball(f'tree{k}', M['tree'], x, y, G + 0.28, rng.uniform(0.12, 0.15), outline=0.018)

turn(before, -20)
render(G)
