# A cartoon Fort Jesus for the country maps, built in the set's shared look (../toon.py): the
# Portuguese fort at the harbour mouth of Mombasa, its thick ochre coral-stone walls with arrowhead
# bastions at the corners and the old cannons on their ramparts, the gate with its steps, the white
# buildings in the courtyard, a baobab, and the Indian Ocean below the coral cliff. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P fort-jesus.py -- fort-jesus-1024.png 1024 fort-jesus.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a0', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'sea': toon('sea', '#2a8ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'coral': toon('coral', '#d8a868', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'coralDark': toon('coralDark', '#b08448'),
    'white': toon('white', '#f6f2ea', lift=0.15),
    'iron': toon('iron', '#3a3a3e'),
    'dark': flat('dark', '#2e2622'),
    'baobab': toon('baobab', '#6a9a4a', shadow_mul=(0.72, 0.8, 0.74)),
    'bark': toon('bark', '#9a8a78'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def vstrip(x0, x1, r, z, n=8):
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, G + z) for x, y in pts]


loft('sea', M['sea'], [vstrip(0.62, 1.3, 1.33, -0.004), vstrip(0.62, 1.3, 1.33, 0.006)], outline=0.004)

# ---------- the fort ----------
FX, FY, S, H = -0.05, 0.05, 0.5, 0.2
box('courtfill', M['coral'], FX, FY, G - 0.005, S, S, H - 0.04, outline=0.006, bevel=0)
for k in range(4):
    a = k * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    box(f'wall{k}', M['coral'], FX + nx * S / 2, FY + ny * S / 2, G - 0.005, 0.06 if nx else S, S if nx else 0.06, H, outline=0.007, bevel=0)
for k, (sx, sy) in enumerate(((-1, -1), (1, -1), (1, 1), (-1, 1))):
    bx, by = FX + sx * S / 2, FY + sy * S / 2
    a = math.atan2(sy, sx)
    tip = (bx + 0.2 * math.cos(a), by + 0.2 * math.sin(a))
    l = (bx + 0.12 * math.cos(a + 1.2), by + 0.12 * math.sin(a + 1.2))
    r = (bx + 0.12 * math.cos(a - 1.2), by + 0.12 * math.sin(a - 1.2))
    ring = lambda z: [(bx, by, z), (r[0], r[1], z), (tip[0], tip[1], z), (l[0], l[1], z)]
    loft(f'bastion{k}', M['coral'], [ring(G - 0.005), ring(G + H + 0.01)], outline=0.007)
    loft(f'bastiontop{k}', M['coralDark'], [ring(G + H + 0.005), ring(G + H + 0.015)], outline=0.001)
    for j in range(2):
        t = 0.45 + j * 0.25
        cx, cy = bx + (tip[0] - bx) * t, by + (tip[1] - by) * t
        rod(f'cannon{k}{j}', M['iron'], (cx, cy, G + H + 0.03), (cx + 0.07 * math.cos(a + (j - 0.5) * 0.8), cy + 0.07 * math.sin(a + (j - 0.5) * 0.8), G + H + 0.035), 0.01, r2=0.008, segs=8, outline=0.001)
for j in range(8):
    box(f'merlon{j}', M['coralDark'], FX - S / 2 + 0.06 + j * 0.055, FY - S / 2 - 0.02, G + H - 0.005, 0.03, 0.025, 0.03, outline=0.001, bevel=0)
box('gate', M['coralDark'], FX + 0.1, FY - S / 2 - 0.03, G - 0.005, 0.09, 0.03, 0.15, outline=0.003, bevel=0)
box('gatedoor', M['dark'], FX + 0.1, FY - S / 2 - 0.047, G - 0.005, 0.045, 0.006, 0.09, outline=0, bevel=0)
for i in range(4):
    box(f'gatestep{i}', M['coralDark'], FX + 0.1, FY - S / 2 - 0.07 - i * 0.025, G - 0.005, 0.1, 0.03, 0.03 - i * 0.007, outline=0.001, bevel=0)
box('house1', M['white'], FX - 0.08, FY + 0.06, G + H - 0.045, 0.16, 0.12, 0.08, outline=0.004, bevel=0)
box('house2', M['white'], FX + 0.1, FY + 0.12, G + H - 0.045, 0.12, 0.1, 0.06, outline=0.003, bevel=0)

# ---------- a baobab and palms ----------
rod('baobabtrunk', M['bark'], (-0.65, -0.5, G), (-0.65, -0.5, G + 0.2), 0.06, r2=0.045, segs=10, outline=0.004)
for j in range(5):
    a = 2 * math.pi * j / 5
    bar(f'baobabbranch{j}', M['bark'], (-0.65, -0.5, G + 0.19), (-0.65 + 0.08 * math.cos(a), -0.5 + 0.08 * math.sin(a), G + 0.26), 0.02, outline=0.002)
    ball(f'baobableaf{j}', M['baobab'], -0.65 + 0.09 * math.cos(a), -0.5 + 0.09 * math.sin(a), G + 0.28, 0.05, outline=0.004)
for k, (x, y) in enumerate(((-0.7, 0.45), (0.45, -0.6), (-0.2, -0.7))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)
