# A cartoon Schwerin Castle for the country maps, built in the set's shared look (../toon.py): the
# fairy-tale castle on its island in Lake Schwerin, its cream walls and many turrets under slate
# roofs, the great golden dome over the main tower and the little gilded domes on the turrets, and
# the island's garden of lawns and parterres in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P schwerin-castle.py -- schwerin-castle-1024.png 1024 schwerin-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#4a8ab0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'island': toon('island', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'quay': toon('quay', '#c8bca0'),
    'cream': toon('cream', '#ecdcb4', shadow_mul=(0.86, 0.84, 0.8), lift=0.12),
    'creamDark': toon('creamDark', '#c8b48a'),
    'slate': toon('slate', '#4a5662'),
    'gold': toon('gold', '#e8b830', lift=0.3),
    'window': flat('window', '#3a3a48'),
    'hedge': toon('hedge', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lake'])
before = set(bpy.data.objects)


def oval(cx, cy, rx, ry, z, sides=32):
    return [(cx + rx * math.cos(2 * math.pi * j / sides), cy + ry * math.sin(2 * math.pi * j / sides), G + z) for j in range(sides)]


loft('island', M['quay'], [oval(0.0, 0.05, 0.85, 0.72, -0.01), oval(0.0, 0.05, 0.85, 0.72, 0.05)], outline=0.008, smooth=True)
loft('islandlawn', M['island'], [oval(0.0, 0.05, 0.8, 0.67, 0.05), oval(0.0, 0.05, 0.8, 0.67, 0.056)], outline=0, smooth=True)
T = G + 0.056

# ---------- the castle ----------
CX, CY = 0.0, 0.22


def wing(name, x, y, w, d, h, roof=True):
    box(name, M['cream'], x, y, T - 0.005, w, d, h, outline=0.007, bevel=0)
    for r in range(int(h / 0.07)):
        for j in range(max(1, int(w / 0.06))):
            box(f'{name}win{r}{j}', M['window'], x - w / 2 + 0.03 + j * (w - 0.06) / max(1, int(w / 0.06) - 1), y - d / 2 - 0.003, T + 0.03 + r * 0.07, 0.02, 0.006, 0.035, outline=0, bevel=0)
    if roof:
        loft(f'{name}roof', M['slate'], [[(x - w / 2, y - d / 2, T + h - 0.005), (x + w / 2, y - d / 2, T + h - 0.005), (x + w / 2, y + d / 2, T + h - 0.005), (x - w / 2, y + d / 2, T + h - 0.005)],
                                         [(x - w / 2 + 0.03, y - 0.004, T + h + 0.08), (x + w / 2 - 0.03, y - 0.004, T + h + 0.08), (x + w / 2 - 0.03, y + 0.004, T + h + 0.08), (x - w / 2 + 0.03, y + 0.004, T + h + 0.08)]], outline=0.004)


def turret(name, x, y, r, h, cap='slate'):
    lathe(name, M['cream'], ((r, 0), (r, h)), T - 0.005, x, y, segs=12, outline=0.004)
    if cap == 'gold':
        lathe(f'{name}cap', M['gold'], ((r * 1.1, 0), (r * 1.25, r * 0.6), (r * 0.6, r * 1.3), (r * 0.2, r * 1.6), (0.004, r * 2.4)), T + h - 0.005, x, y, segs=12, outline=0.003)
    else:
        lathe(f'{name}cap', M['slate'], ((r * 1.1, 0), (0.004, r * 3.2)), T + h - 0.005, x, y, segs=12, outline=0.003, smooth=False)


wing('front', CX, CY - 0.1, 0.5, 0.16, 0.22)
wing('left', CX - 0.32, CY + 0.08, 0.2, 0.36, 0.2)
wing('right', CX + 0.32, CY + 0.08, 0.2, 0.36, 0.2)
wing('back', CX, CY + 0.2, 0.44, 0.14, 0.24)
# the main tower with the great golden dome
lathe('maintower', M['cream'], ((0.1, 0), (0.1, 0.36)), T - 0.005, CX, CY - 0.16, segs=16, outline=0.006)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    if math.sin(a) > 0.2:
        continue
    box(f'mainwin{k}', M['window'], CX + 0.098 * math.cos(a), CY - 0.16 + 0.098 * math.sin(a), T + 0.25, 0.025, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('maindome', M['gold'], ((0.11, 0), (0.13, 0.06), (0.11, 0.12), (0.06, 0.18), (0.02, 0.22), (0.004, 0.3)), T + 0.355, CX, CY - 0.16, segs=20, outline=0.005)
for k, (x, y, r, h, cap) in enumerate(((-0.25, -0.18, 0.04, 0.3, 'gold'), (0.25, -0.18, 0.04, 0.3, 'gold'), (-0.42, -0.1, 0.035, 0.26, 'slate'),
                                       (0.42, -0.1, 0.035, 0.26, 'slate'), (-0.42, 0.26, 0.04, 0.28, 'gold'), (0.42, 0.26, 0.04, 0.28, 'gold'),
                                       (-0.12, 0.3, 0.03, 0.33, 'slate'), (0.14, 0.3, 0.03, 0.33, 'slate'))):
    turret(f'turret{k}', CX + x, CY + y, r, h, cap)

# ---------- the garden ----------
for s in (-1, 1):
    box(f'parterre{s}', M['hedge'], s * 0.28, -0.4, T - 0.003, 0.3, 0.24, 0.02, outline=0.002, bevel=0)
    box(f'parterrein{s}', M['island'], s * 0.28, -0.4, T - 0.001, 0.22, 0.16, 0.024, outline=0, bevel=0)
    for j in range(2):
        lathe(f'topiary{s}{j}', M['hedge'], ((0.03, 0), (0.004, 0.12)), T - 0.005, s * (0.16 + j * 0.24), -0.56, segs=10, outline=0.003)

turn(before, -20)
render(G)
