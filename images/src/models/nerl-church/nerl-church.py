# A cartoon Church of the Intercession on the Nerl for the country maps, built in the set's shared
# look (../toon.py): the little white limestone church of the twelfth century standing alone on its
# grassy mound in the water meadows by the river, its tall slender walls divided by pilasters into
# arched bays, the three round apses, the drum with its narrow windows and the single gilded onion
# dome with its cross, the river curving past with willows. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nerl-church.py -- nerl-church-1024.png 1024 nerl-church.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#8ac85a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'whiteDark': toon('whiteDark', '#dcd8cc'),
    'gold': toon('gold', '#f0c040', shadow_mul=(0.86, 0.76, 0.6), lift=0.3),
    'lead': toon('lead', '#8a929e'),
    'dark': flat('dark', '#2e3040'),
    'willow': toon('willow', '#8ab84a', shadow_mul=(0.72, 0.8, 0.74)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)

# ---------- the river curving across the front ----------
pts = [(-1.3 + 2.6 * k / 16, -0.75 + 0.18 * math.sin(k / 16 * math.pi * 1.6)) for k in range(17)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:])):
    if math.hypot(x0, y0) > 1.32 or math.hypot(x1, y1) > 1.32:
        continue
    quad = [(x0, y0 - 0.12), (x1, y1 - 0.12), (x1, y1 + 0.12), (x0, y0 + 0.12)]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.006) for x, y in quad]], outline=0)

# ---------- the mound and the church ----------
lathe('mound', M['meadow'], ((0.68, 0), (0.62, 0.04), (0.5, 0.08), (0.0, 0.09)), G - 0.005, 0.0, 0.2, segs=32, outline=0.005)
T = G + 0.085
CX, CY = 0.0, 0.22
church = set(bpy.data.objects)
S, H = 0.28, 0.42
box('church', M['white'], CX, CY, T - 0.005, S, S, H, outline=0.008, bevel=0)
# the walls in three bays each, with pilasters and the round-arched tops (zakomari)
for face in range(4):
    a = face * math.pi / 2 - math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    tx, ty = -ny, nx
    for j in range(4):
        o = -S / 2 + j * S / 3
        x, y = CX + nx * (S / 2 + 0.003) + tx * o, CY + ny * (S / 2 + 0.003) + ty * o
        box(f'pilaster{face}{j}', M['whiteDark'], x, y, T, 0.012 if abs(nx) < 0.5 else 0.006, 0.006 if abs(nx) < 0.5 else 0.012, H - 0.01, outline=0, bevel=0)
    for j in range(3):
        o = -S / 2 + (j + 0.5) * S / 3
        x, y = CX + nx * (S / 2) + tx * o, CY + ny * (S / 2) + ty * o
        cyl(f'zakomara{face}{j}', M['white'], S / 6, 0.03, segs=14, outline=0.003, matrix=Matrix.Translation((x, y, T + H - 0.005)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        if face == 0 or face == 3:
            box(f'win{face}{j}', M['dark'], x + nx * 0.003, y + ny * 0.003, T + 0.24, 0.016 if abs(nx) < 0.5 else 0.006, 0.006 if abs(nx) < 0.5 else 0.016, 0.07, outline=0, bevel=0)
    # the carved band halfway up
    box(f'band{face}', M['whiteDark'], CX + nx * (S / 2 + 0.004), CY + ny * (S / 2 + 0.004), T + 0.18, S if abs(nx) < 0.5 else 0.006, 0.006 if abs(nx) < 0.5 else S, 0.025, outline=0, bevel=0)
box('door', M['dark'], CX, CY - S / 2 - 0.004, T - 0.005, 0.05, 0.006, 0.12, outline=0, bevel=0)
cyl('doortop', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((CX, CY - S / 2 - 0.004, T + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the three apses at the back
for k in range(3):
    x = CX - 0.09 + k * 0.09
    lathe(f'apse{k}', M['white'], ((0.045, 0), (0.045, H - 0.08)), T - 0.005, x, CY + S / 2, segs=14, outline=0.004)
    lathe(f'apseroof{k}', M['lead'], ((0.05, 0), (0.003, 0.03)), T + H - 0.085, x, CY + S / 2, segs=14, outline=0.002)
# the roof, the drum and the onion dome
box('roof', M['lead'], CX, CY, T + H + 0.03, S - 0.02, S - 0.02, 0.02, outline=0.003, bevel=0)
lathe('drum', M['white'], ((0.075, 0), (0.075, 0.17)), T + H + 0.04, CX, CY, segs=16, outline=0.005)
for k in range(8):
    a = 2 * math.pi * k / 8
    box(f'drumwin{k}', M['dark'], CX + 0.077 * math.cos(a), CY + 0.077 * math.sin(a), T + H + 0.09, 0.012, 0.012, 0.06, rot_z=a, outline=0, bevel=0)
lathe('onion', M['gold'], ((0.075, 0), (0.09, 0.04), (0.08, 0.08), (0.04, 0.12), (0.012, 0.15), (0.004, 0.17)), T + H + 0.205, CX, CY, segs=20, outline=0.005)
rod('cross', M['gold'], (CX, CY, T + H + 0.37), (CX, CY, T + H + 0.45), 0.004, segs=4, outline=0)
bar('crossbar', M['gold'], (CX - 0.02, CY, T + H + 0.425), (CX + 0.02, CY, T + H + 0.425), 0.006, outline=0)
bar('crossfoot', M['gold'], (CX - 0.014, CY, T + H + 0.39), (CX + 0.014, CY, T + H + 0.4), 0.005, outline=0)

bpy.context.view_layer.update()
# the church, built at 1, grown so it reads on the map
grow = Matrix.Translation((CX, CY, T)) @ Matrix.Scale(1.5, 4) @ Matrix.Translation((-CX, -CY, -T))
for o in set(bpy.data.objects) - church:
    o.matrix_world = grow @ o.matrix_world

# ---------- willows by the river ----------
for k, (x, y) in enumerate(((-0.7, -0.4), (0.75, -0.45), (-0.95, 0.2), (0.9, 0.35))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.014, segs=6, outline=0.002)
    w = ball(f'willow{k}', M['willow'], 0, 0, 0, 0.1, outline=0.01)
    w.scale = (1.0, 1.0, 1.25)
    w.location = (x, y, G + 0.18)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
