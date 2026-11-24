# A cartoon Bourges Cathedral for the country maps, built in the set's shared look (../toon.py): the
# great Gothic cathedral of Saint-Étienne, its wide west front with five deep portals and the big rose
# window between two unequal towers (the tall Butter Tower on the left), the very long nave and its
# double aisles with no transept, the forest of flying buttresses down both sides and the round apse
# at the east end. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bourges-cathedral.py -- bourges-cathedral-1024.png 1024 bourges-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#e2d6bc', shadow_mul=(0.84, 0.84, 0.88), lift=0.15),
    'stoneDark': toon('stoneDark', '#c4b696'),
    'slate': toon('slate', '#5a6270', shadow_mul=(0.84, 0.86, 0.92)),
    'dark': flat('dark', '#2e2e3a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

Y0, Y1 = -0.3, 0.85
# ---------- the nave and its two levels of aisles ----------
box('nave', M['stone'], 0, (Y0 + Y1) / 2, G - 0.005, 0.26, Y1 - Y0, 0.42, outline=0.008, bevel=0)
loft('naveroof', M['slate'], [[(-0.13, Y0, G + 0.415), (0.13, Y0, G + 0.415), (0.13, Y1, G + 0.415), (-0.13, Y1, G + 0.415)],
                              [(-0.004, Y0, G + 0.52), (0.004, Y0, G + 0.52), (0.004, Y1, G + 0.52), (-0.004, Y1, G + 0.52)]], outline=0.005)
for s in (-1, 1):
    box(f'inneraisle{s}', M['stone'], s * 0.2, (Y0 + Y1) / 2 + 0.03, G - 0.005, 0.14, Y1 - Y0 - 0.06, 0.28, outline=0.006, bevel=0)
    box(f'outeraisle{s}', M['stone'], s * 0.32, (Y0 + Y1) / 2 + 0.03, G - 0.005, 0.1, Y1 - Y0 - 0.1, 0.16, outline=0.005, bevel=0)
    for j in range(9):
        y = Y0 + 0.1 + j * 0.11
        # the flying buttresses: two flights from the outer piers up to the nave wall
        bar(f'flyerlow{s}{j}', M['stoneDark'], (s * 0.38, y, G + 0.17), (s * 0.27, y, G + 0.27), 0.015, outline=0.001)
        bar(f'flyerhigh{s}{j}', M['stoneDark'], (s * 0.27, y, G + 0.3), (s * 0.13, y, G + 0.4), 0.015, outline=0.001)
        box(f'pier{s}{j}', M['stoneDark'], s * 0.38, y, G - 0.005, 0.03, 0.03, 0.2, outline=0.002, bevel=0)
        lathe(f'pinnacle{s}{j}', M['stoneDark'], ((0.014, 0), (0.002, 0.06)), G + 0.195, s * 0.38, y, segs=4, outline=0.001, smooth=False)
        box(f'clerestory{s}{j}', M['dark'], s * 0.133, y + 0.05, G + 0.3, 0.006, 0.035, 0.09, outline=0, bevel=0)
# the round apse at the east end
lathe('apse', M['stone'], ((0.2, 0), (0.2, 0.3)), G - 0.005, 0, Y1, segs=10, outline=0.006, smooth=False)
lathe('apseroof', M['slate'], ((0.205, 0), (0.003, 0.12)), G + 0.29, 0, Y1, segs=10, outline=0.004, smooth=False)

# ---------- the west front ----------
FW = 0.8
box('front', M['stone'], 0, Y0 - 0.03, G - 0.005, FW, 0.08, 0.46, outline=0.008, bevel=0)
for j in range(5):
    x = -0.32 + j * 0.16
    w = 0.1 if j != 2 else 0.13
    box(f'portalframe{j}', M['stoneDark'], x, Y0 - 0.072, G - 0.005, w + 0.03, 0.006, 0.22 + 0.04 * (j == 2), outline=0, bevel=0)
    box(f'portal{j}', M['dark'], x, Y0 - 0.075, G - 0.005, w * 0.6, 0.006, 0.13 + 0.03 * (j == 2), outline=0, bevel=0)
    pyramid(f'portalgable{j}', M['stoneDark'], x, Y0 - 0.075, G + 0.21 + 0.04 * (j == 2), w + 0.03, 0.07, outline=0.002)
cyl('rose', M['dark'], 0.07, 0.006, segs=20, outline=0, matrix=Matrix.Translation((0, Y0 - 0.074, G + 0.36)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('frontgable', M['stone'], [[(-0.13, Y0 - 0.07, G + 0.455), (0.13, Y0 - 0.07, G + 0.455), (0.13, Y0 + 0.01, G + 0.455), (-0.13, Y0 + 0.01, G + 0.455)],
                                [(-0.004, Y0 - 0.07, G + 0.56), (0.004, Y0 - 0.07, G + 0.56), (0.004, Y0 + 0.01, G + 0.56), (-0.004, Y0 + 0.01, G + 0.56)]], outline=0.004)
# the Butter Tower (left, tall) and the unfinished South Tower (right)
box('buttertower', M['stone'], -0.3, Y0 + 0.02, G - 0.005, 0.18, 0.18, 0.78, outline=0.008, bevel=0)
for k in range(2):
    box(f'butterwin{k}', M['dark'], -0.3, Y0 - 0.073, G + 0.52 + k * 0.11, 0.05, 0.006, 0.08, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'butterpinnacle{sx}{sy}', M['stoneDark'], ((0.02, 0), (0.003, 0.1)), G + 0.775, -0.3 + sx * 0.08, Y0 + 0.02 + sy * 0.08, segs=6, outline=0.001, smooth=False)
box('southtower', M['stone'], 0.3, Y0 + 0.02, G - 0.005, 0.18, 0.18, 0.6, outline=0.008, bevel=0)
box('southtowerwin', M['dark'], 0.3, Y0 - 0.073, G + 0.46, 0.05, 0.006, 0.08, outline=0, bevel=0)
box('southpillar', M['stoneDark'], 0.42, Y0 - 0.05, G - 0.005, 0.06, 0.06, 0.5, outline=0.004, bevel=0)

for k, (x, y) in enumerate(((-0.8, -0.4), (0.8, -0.4), (-0.7, 0.6), (0.7, 0.6))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
