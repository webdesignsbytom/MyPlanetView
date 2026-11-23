# A cartoon Khajuraho for the country maps, built in the set's shared look (../toon.py): the
# Kandariya Mahadeva temple on its high platform, its halls' roofs rising one behind another like
# mountain peaks to the great clustered tower over the shrine, every band carved, the steps up
# its front, a smaller temple beside it, and the lawns with their flowering trees. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P khajuraho.py -- khajuraho-1024.png 1024 khajuraho.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'sandstone': toon('sandstone', '#d8b88a', shadow_mul=(0.86, 0.82, 0.76), lift=0.1),
    'sandstoneDark': toon('sandstoneDark', '#b89468', shadow_mul=(0.86, 0.82, 0.76)),
    'carving': flat('carving', '#9a7a54'),
    'door': flat('door', '#3a2a20'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'bloom': toon('bloom', '#e8602c', lift=0.2),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def spire(name, x, y, z, r, h, mat):
    prof = [(r, 0), (r * 0.95, h * 0.35), (r * 0.8, h * 0.65), (r * 0.5, h * 0.88), (r * 0.15, h)]
    lathe(name, M[mat], prof, z, x, y, segs=12, outline=0.005, smooth=False)
    for j in range(4):
        lathe(f'{name}band{j}', M['carving'], ((r * (1.0 - j * 0.12) + 0.004, 0), (r * (1.0 - j * 0.12) + 0.004, 0.012)), z + h * (0.15 + j * 0.2), x, y, segs=12, outline=0, smooth=False)
    lathe(f'{name}amalaka', M[mat], ((r * 0.25, 0), (r * 0.3, 0.02), (r * 0.2, 0.035)), z + h, x, y, segs=12, outline=0.002)


# ---------- the Kandariya Mahadeva ----------
KX, KY = -0.1, 0.2
box('platform', M['sandstoneDark'], KX, KY, G - 0.005, 0.55, 0.85, 0.12, outline=0.009, bevel=0)
for j in range(6):
    box(f'stairs{j}', M['sandstone'], KX, KY - 0.43 - j * 0.03, G - 0.005, 0.14, 0.03, 0.12 - j * 0.02, outline=0.002, bevel=0)
P = G + 0.115
box('walls', M['sandstone'], KX, KY, P - 0.005, 0.36, 0.7, 0.14, outline=0.008, bevel=0)
for j in range(3):
    box(f'frieze{j}', M['carving'], KX - 0.182, KY, P + 0.02 + j * 0.04, 0.006, 0.66, 0.012, outline=0, bevel=0)
    box(f'friezefront{j}', M['carving'], KX, KY - 0.352, P + 0.02 + j * 0.04, 0.3, 0.006, 0.012, outline=0, bevel=0)
box('entrance', M['door'], KX, KY - 0.353, P, 0.07, 0.006, 0.1, outline=0, bevel=0)
spire('entryroof', KX, KY - 0.25, P + 0.135, 0.1, 0.12, 'sandstone')
spire('mandaparoof', KX, KY - 0.08, P + 0.135, 0.15, 0.22, 'sandstoneDark')
spire('mahamandaparoof', KX, KY + 0.08, P + 0.135, 0.17, 0.3, 'sandstone')
spire('shikhara', KX, KY + 0.22, P + 0.135, 0.2, 0.55, 'sandstoneDark')
for sx in (-1, 1):
    for sy in (0.12, 0.3):
        spire(f'urushringa{sx}{sy}', KX + sx * 0.13, KY + sy, P + 0.135, 0.07, 0.3, 'sandstone')

# ---------- a smaller temple beside it ----------
SX, SY = 0.6, 0.35
box('smallplatform', M['sandstoneDark'], SX, SY, G - 0.005, 0.28, 0.4, 0.08, outline=0.006, bevel=0)
box('smallwalls', M['sandstone'], SX, SY, G + 0.075, 0.2, 0.32, 0.1, outline=0.005, bevel=0)
spire('smallshikhara', SX, SY + 0.05, G + 0.17, 0.1, 0.3, 'sandstoneDark')

for k, (x, y) in enumerate(((-0.85, -0.35), (0.75, -0.4), (-0.85, 0.45), (0.95, 0.0), (0.3, -0.75))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.009)
    for j in range(3):
        ball(f'bloom{k}{j}', M['bloom'], x + 0.06 * math.cos(j * 2.1), y - 0.05, G + 0.12 + 0.03 * math.sin(j * 2.1), 0.016, outline=0)

turn(before, -20)
render(G)
