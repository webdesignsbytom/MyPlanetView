# A cartoon Dome of the Rock for the country maps, built in the set's shared look (../toon.py): the
# golden dome on its drum, the octagon below faced in blue and turquoise tiles over white marble, its
# porches, on the broad stone platform of the Temple Mount reached by arcaded stairs, with the little
# Dome of the Chain beside it and cypresses and olive trees round the esplanade. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P dome-of-the-rock.py -- dome-of-the-rock-1024.png 1024 dome-of-the-rock.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#e4d6b4', shadow_mul=(0.86, 0.82, 0.78), lift=0.2),
    'stoneDark': toon('stoneDark', '#c8b894', shadow_mul=(0.86, 0.82, 0.78)),
    'marble': toon('marble', '#f2eee4', lift=0.2),
    'tileBlue': toon('tileBlue', '#2a6ab0', shadow_mul=(0.82, 0.86, 0.94), lift=0.15),
    'tileTurq': toon('tileTurq', '#3aa8b8', lift=0.15),
    'gold': toon('gold', '#f0c040', shadow_mul=(0.86, 0.76, 0.6), lift=0.3),
    'lead': toon('lead', '#7a8290'),
    'dark': flat('dark', '#2e2a2e'),
    'olive': toon('olive', '#8aa060', shadow_mul=(0.72, 0.8, 0.76)),
    'cypress': toon('cypress', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['stone'])
before = set(bpy.data.objects)

# ---------- the platform ----------
PZ = G + 0.1
box('platform', M['stoneDark'], 0, 0.05, G - 0.005, 1.3, 1.1, PZ - G + 0.005, outline=0.008, bevel=0)
box('platformtop', M['stone'], 0, 0.05, PZ - 0.004, 1.28, 1.08, 0.008, outline=0, bevel=0)
# the stairs up the front with their arcade (a qanatir) at the top
for i in range(5):
    box(f'stair{i}', M['stone'], 0, -0.5 - 0.03 * (4 - i), G - 0.005, 0.32, 0.03, (PZ - G) * (i + 1) / 5, outline=0.002, bevel=0)
for j in range(4):
    x = -0.12 + j * 0.08
    rod(f'arcadecol{j}', M['marble'], (x, -0.48, PZ), (x, -0.48, PZ + 0.11), 0.01, segs=8, outline=0.002)
box('arcadetop', M['marble'], 0, -0.48, PZ + 0.11, 0.3, 0.03, 0.03, outline=0.003, bevel=0)

# ---------- the octagon ----------
CX, CY = 0.0, 0.1
R, H = 0.36, 0.2


def octagon(name, mat, r, z0, h, outline):
    return lathe(name, mat, ((r, 0), (r, h)), z0, CX, CY, segs=8, outline=outline, smooth=False)


octagon('octagonmarble', M['marble'], R, PZ - 0.005, H * 0.45, 0.008)
octagon('octagontiles', M['tileBlue'], R, PZ + H * 0.45 - 0.006, H * 0.55, 0.008)
lathe('parapet', M['tileTurq'], ((R + 0.008, 0), (R + 0.008, 0.02)), PZ + H - 0.01, CX, CY, segs=8, outline=0.003, smooth=False)
octagon('roof', M['lead'], R - 0.01, PZ + H + 0.005, 0.02, 0.004)
# a window high on each face of the octagon, and its porches on four faces
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    rr = R * math.cos(math.pi / 8) + 0.003
    for j in (-1, 1):
        box(f'win{k}{j}', M['dark'], CX + rr * math.cos(a) + j * 0.05 * -math.sin(a), CY + rr * math.sin(a) + j * 0.05 * math.cos(a), PZ + 0.11, 0.004, 0.03, 0.05, rot_z=a, outline=0, bevel=0)
    if k % 2 == 1:
        px, py = CX + (rr + 0.03) * math.cos(a), CY + (rr + 0.03) * math.sin(a)
        box(f'porch{k}', M['marble'], px, py, PZ - 0.005, 0.06, 0.14, 0.11, rot_z=a, outline=0.003, bevel=0)
        box(f'porchdoor{k}', M['dark'], px + 0.031 * math.cos(a), py + 0.031 * math.sin(a), PZ - 0.005, 0.004, 0.05, 0.07, rot_z=a, outline=0, bevel=0)
# the drum and the golden dome
lathe('drum', M['tileBlue'], ((0.18, 0), (0.18, 0.14)), PZ + H + 0.02, CX, CY, segs=32, outline=0.006)
for k in range(16):
    a = 2 * math.pi * k / 16
    box(f'drumwin{k}', M['dark'], CX + 0.182 * math.cos(a), CY + 0.182 * math.sin(a), PZ + H + 0.06, 0.004, 0.022, 0.05, rot_z=a, outline=0, bevel=0)
lathe('drumband', M['tileTurq'], ((0.185, 0), (0.185, 0.02)), PZ + H + 0.14, CX, CY, segs=32, outline=0.002)
lathe('dome', M['gold'], ((0.19, 0), (0.19, 0.04), (0.17, 0.12), (0.12, 0.19), (0.05, 0.23), (0.004, 0.24)), PZ + H + 0.155, CX, CY, segs=32, outline=0.008)
rod('crescent', M['gold'], (CX, CY, PZ + H + 0.39), (CX, CY, PZ + H + 0.45), 0.004, segs=4, outline=0)
ball('crescenttop', M['gold'], CX, CY, PZ + H + 0.46, 0.01, outline=0.001)

# ---------- the Dome of the Chain ----------
DX, DY = 0.5, 0.05
for k in range(6):
    a = 2 * math.pi * k / 6
    rod(f'chaincol{k}', M['marble'], (DX + 0.06 * math.cos(a), DY + 0.06 * math.sin(a), PZ), (DX + 0.06 * math.cos(a), DY + 0.06 * math.sin(a), PZ + 0.08), 0.007, segs=6, outline=0.001)
lathe('chainroof', M['tileTurq'], ((0.075, 0), (0.075, 0.015)), PZ + 0.08, DX, DY, segs=6, outline=0.002, smooth=False)
lathe('chaindome', M['lead'], ((0.05, 0), (0.045, 0.025), (0.02, 0.045), (0.003, 0.05)), PZ + 0.095, DX, DY, segs=16, outline=0.002)

# ---------- trees on the esplanade ----------
bpy.context.view_layer.update()
# the platform and all on it, grown to fill the tile
grow = Matrix.Translation((0, 0.05, G)) @ Matrix.Scale(1.25, 4) @ Matrix.Translation((0, -0.05, -G))
for o in set(bpy.data.objects) - before:
    o.matrix_world = grow @ o.matrix_world
bpy.context.view_layer.update()
PZ = G + (PZ - G) * 1.25
for k, (x, y) in enumerate(((-0.69, -0.35), (-0.69, 0.6), (0.62, 0.6), (0.69, -0.35))):
    rod(f'cypresstrunk{k}', M['trunk'], (x, y, PZ), (x, y, PZ + 0.04), 0.01, segs=6, outline=0.002)
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.045, 0.06), (0.03, 0.15), (0.004, 0.22)), PZ + 0.03, x, y, segs=10, outline=0.006)
for k, (x, y) in enumerate(((-0.95, -0.75), (0.95, -0.75), (-1.0, 0.55), (1.0, 0.55))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.06), 0.014, segs=6, outline=0.002)
    ball(f'olive{k}', M['olive'], x, y, G + 0.12, 0.09, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
