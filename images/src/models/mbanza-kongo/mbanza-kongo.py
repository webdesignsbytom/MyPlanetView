# A cartoon Mbanza Kongo for the country maps, built in the set's shared look (../toon.py): the old
# capital of the Kingdom of Kongo on its plateau in Angola, the roofless stone walls of
# Kulumbimbi, the first cathedral south of the Sahara, its tall gable end with the window
# arches standing, the sacred yala nkuwu tree beside it, and the red earth and palms round them.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P mbanza-kongo.py -- mbanza-kongo-1024.png 1024 mbanza-kongo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#94c060', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'earth': toon('earth', '#c47c52', lift=0.15),
    'stone': toon('stone', '#c8b08c', shadow_mul=(0.8, 0.78, 0.82), lift=0.15),
    'stoneDark': toon('stoneDark', '#a89070'),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#3e8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the red earth square ----------
box('square', M['earth'], 0.0, 0.0, G - 0.004, 1.3, 1.0, 0.008, outline=0.001, bevel=0)

# ---------- Kulumbimbi's ruined walls ----------
CX, CY, W, D = -0.05, 0.15, 0.4, 0.72
WT = 0.04
for s in (-1, 1):
    for k in range(5):
        y = CY - D / 2 + 0.04 + k * (D - 0.08) / 4
        h = 0.22 - 0.03 * k
        box(f'wall{s}{k}', M['stone'], CX + s * W / 2, y, G - 0.005, WT, (D - 0.08) / 4 + 0.005, h, outline=0.004, bevel=0)
        arch(f'win{s}{k}', M['dark'], CX + s * (W / 2 + WT / 2 + 0.003), y, G + 0.07, 0.04, 0.09, face='x')
# the front gable end standing tall
FY = CY - D / 2
loft('gableend', M['stone'], [[(CX - W / 2 - 0.02, FY - 0.03, G - 0.005), (CX + W / 2 + 0.02, FY - 0.03, G - 0.005), (CX + W / 2 + 0.02, FY + 0.03, G - 0.005), (CX - W / 2 - 0.02, FY + 0.03, G - 0.005)],
                              [(CX - W / 2 - 0.02, FY - 0.03, G + 0.26), (CX + W / 2 + 0.02, FY - 0.03, G + 0.26), (CX + W / 2 + 0.02, FY + 0.03, G + 0.26), (CX - W / 2 - 0.02, FY + 0.03, G + 0.26)],
                              [(CX - 0.01, FY - 0.03, G + 0.42), (CX + 0.01, FY - 0.03, G + 0.42), (CX + 0.01, FY + 0.03, G + 0.42), (CX - 0.01, FY + 0.03, G + 0.42)]], outline=0.006)
arch('frontdoor', M['dark'], CX, FY - 0.033, G - 0.005, 0.1, 0.2)
for s in (-1, 1):
    arch(f'frontwin{s}', M['dark'], CX + s * 0.13, FY - 0.033, G + 0.1, 0.045, 0.1)
arch('roundwin', M['dark'], CX, FY - 0.033, G + 0.27, 0.05, 0.05)
# the back wall, lower and broken
box('backwall', M['stone'], CX, CY + D / 2, G - 0.005, W + 0.04, WT, 0.12, outline=0.004, bevel=0)
for k in range(4):
    box(f'rubble{k}', M['stoneDark'], CX - 0.12 + k * 0.08, CY + 0.05 * (k % 2), G - 0.005, 0.05, 0.04, 0.025, rot_z=0.3 * k, outline=0.002, bevel=0)

# ---------- the sacred tree and the palms ----------
rod('yalatrunk', M['trunk'], (0.55, -0.35, G), (0.55, -0.35, G + 0.18), 0.03, segs=8, outline=0.003)
for k, (dx, dy, dz, r) in enumerate(((0, 0, 0.3, 0.16), (-0.12, 0.05, 0.25, 0.11), (0.12, -0.04, 0.26, 0.11))):
    b = ball(f'yala{k}', M['tree'], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.8)
    b.location = (0.55 + dx, -0.35 + dy, G + dz)
for k, (x, y) in enumerate(((-0.85, -0.45), (0.75, 0.45), (-0.75, 0.6), (0.2, -0.8))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f'frond{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + 0.25), 0.03, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
