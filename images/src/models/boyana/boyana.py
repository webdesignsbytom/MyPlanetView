# A cartoon Boyana Church for the country maps, built in the set's shared look (../toon.py): the little
# medieval church at the foot of Vitosha near Sofia, its three parts side by side (the small
# cross-domed east church with its apse and drum, the taller two-storey middle church and the
# western addition), their walls banded in red brick and pale stone with blind arches, the red tiled
# roofs and the small dome, the tall trees of the churchyard and the wooded mountain behind. Turned
# a little towards the camera.
# Run: blender -b --factory-startup -P boyana.py -- boyana-1024.png 1024 boyana.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mountain': toon('mountain', '#5f8a4c', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#efe4cc', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'brick': toon('brick', '#b8583e'),
    'tiles': toon('tiles', '#c4643e'),
    'dark': flat('dark', '#2e2a2a'),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'fir': toon('fir', '#3a6e3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- Vitosha behind ----------
mt = lathe('vitosha', M['mountain'], ((0.75, 0), (0.62, 0.1), (0.4, 0.26), (0.18, 0.36), (0.0, 0.39)), G - 0.01, 0.1, 0.58, segs=32, outline=0.008)
mt.visible_shadow = False


def banded(name, x, y, w, d, h):
    """A wall block of pale stone with bands of red brick and blind arches on its front."""
    box(name, M['stone'], x, y, G - 0.005, w, d, h, outline=0.006, bevel=0)
    for k in range(int(h / 0.05)):
        box(f'{name}band{k}', M['brick'], x, y, G + 0.03 + k * 0.05, w + 0.008, d + 0.008, 0.016, outline=0.001, bevel=0)
    n = max(2, int(w / 0.08))
    for j in range(n):
        ax = x - w / 2 + (j + 0.5) * w / n
        box(f'{name}arch{j}', M['brick'], ax, y - d / 2 - 0.006, G + 0.05, w / n * 0.55, 0.006, h - 0.1, outline=0, bevel=0)
        cyl(f'{name}archtop{j}', M['brick'], w / n * 0.275, 0.006, segs=10, outline=0, matrix=Matrix.Translation((ax, y - d / 2 - 0.006, G + h - 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        box(f'{name}win{j}', M['dark'], ax, y - d / 2 - 0.01, G + h - 0.12, 0.018, 0.006, 0.045, outline=0, bevel=0)


def gable(name, x, y, z0, hx, hy, z1, along_x):
    top = (hx, 0.004) if along_x else (0.004, hy)
    loft(name, M['tiles'], [[(x - hx, y - hy, z0), (x + hx, y - hy, z0), (x + hx, y + hy, z0), (x - hx, y + hy, z0)],
                            [(x - top[0], y - top[1], z1), (x + top[0], y - top[1], z1), (x + top[0], y + top[1], z1), (x - top[0], y + top[1], z1)]], outline=0.004)


CY = 0.02
# the east church, with its apse and its drum and dome
EX = 0.24
banded('east', EX, CY, 0.22, 0.22, 0.2)
lathe('apse', M['stone'], ((0.08, 0), (0.08, 0.16)), G - 0.005, EX + 0.11, CY, segs=14, outline=0.004)
for k in range(3):
    lathe(f'apseband{k}', M['brick'], ((0.084, 0), (0.084, 0.016)), G + 0.03 + k * 0.05, EX + 0.11, CY, segs=14, outline=0.001)
lathe('apseroof', M['tiles'], ((0.095, 0), (0.003, 0.07)), G + 0.155, EX + 0.11, CY, segs=14, outline=0.003, smooth=False)
loft('eastroof', M['tiles'], [[(EX - 0.13, CY - 0.13, G + 0.195), (EX + 0.13, CY - 0.13, G + 0.195), (EX + 0.13, CY + 0.13, G + 0.195), (EX - 0.13, CY + 0.13, G + 0.195)],
                              [(EX - 0.06, CY - 0.06, G + 0.25), (EX + 0.06, CY - 0.06, G + 0.25), (EX + 0.06, CY + 0.06, G + 0.25), (EX - 0.06, CY + 0.06, G + 0.25)]], outline=0.004)
lathe('drum', M['stone'], ((0.055, 0), (0.055, 0.09)), G + 0.24, EX, CY, segs=12, outline=0.003)
lathe('drumband', M['brick'], ((0.059, 0), (0.059, 0.016)), G + 0.28, EX, CY, segs=12, outline=0.001)
lathe('dome', M['tiles'], ((0.065, 0), (0.06, 0.025), (0.04, 0.05), (0.003, 0.065)), G + 0.325, EX, CY, segs=12, outline=0.003)
rod('cross', M['gold'], (EX, CY, G + 0.385), (EX, CY, G + 0.45), 0.004, segs=4, outline=0.001)
bar('crossbar', M['gold'], (EX - 0.018, CY, G + 0.43), (EX + 0.018, CY, G + 0.43), 0.006, outline=0.001)
# the two-storey middle church, its gable to the front
MX = 0.02
banded('middle', MX, CY, 0.22, 0.26, 0.28)
gable('middleroof', MX, CY, G + 0.275, 0.125, 0.145, G + 0.38, False)
# the western addition, lower, its ridge along the front
WX = -0.22
banded('west', WX, CY, 0.26, 0.24, 0.2)
gable('westroof', WX, CY, G + 0.195, 0.145, 0.135, G + 0.28, True)
box('door', M['dark'], WX, CY - 0.12 - 0.012, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)

# ---------- the churchyard's trees ----------
for k, (x, y, h) in enumerate(((-0.62, 0.05, 0.62), (0.62, -0.3, 0.5), (-0.5, 0.45, 0.7))):
    rod(f'firtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.018, segs=6, outline=0.002)
    lathe(f'fir{k}', M['fir'], ((0.11, 0), (0.07, h * 0.45), (0.003, h)), G + 0.06, x, y, segs=10, outline=0.006, smooth=False)
for k, (x, y) in enumerate(((-0.8, -0.4), (0.85, 0.05), (0.3, -0.75), (-0.25, -0.8))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
