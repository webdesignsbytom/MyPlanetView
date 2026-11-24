# A cartoon Stralsund for the country maps, built in the set's shared look (../toon.py): the Hanseatic
# town hall on the Old Market, its red brick show front rising to a crest of slender pinnacles with
# round windows cut through the wall between them, the arcade at its foot, the twin towers of St
# Nicholas' Church behind it, and the gabled merchants' houses round the square. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P stralsund.py -- stralsund-1024.png 1024 stralsund.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobbles': toon('cobbles', '#b8b0a4', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'brick': toon('brick', '#b8503a', shadow_mul=(0.86, 0.76, 0.76), lift=0.06),
    'brickDark': toon('brickDark', '#963e2e'),
    'glaze': toon('glaze', '#2a3a3a'),
    'copper': toon('copper', '#4a8a6a', lift=0.12),
    'white': toon('white', '#f0e8d8', lift=0.15),
    'ochre': toon('ochre', '#e0b070', lift=0.1),
    'roof': toon('roof', '#b8503e'),
    'dark': flat('dark', '#2e2622'),
    'sky': flat('sky', '#c8dcec'),
})

G = tile(M['cobbles'])
before = set(bpy.data.objects)

# ---------- St Nicholas' behind ----------
NX, NY = 0.05, 0.6
box('stnicholas', M['brick'], NX, NY + 0.15, G - 0.005, 0.4, 0.4, 0.36, outline=0.007, bevel=0)
loft('stnicholasroof', M['roof'], [[(NX - 0.21, NY - 0.05, G + 0.355), (NX + 0.21, NY - 0.05, G + 0.355), (NX + 0.21, NY + 0.35, G + 0.355), (NX - 0.21, NY + 0.35, G + 0.355)],
                                   [(NX - 0.004, NY - 0.05, G + 0.5), (NX + 0.004, NY - 0.05, G + 0.5), (NX + 0.004, NY + 0.35, G + 0.5), (NX - 0.004, NY + 0.35, G + 0.5)]], outline=0.005)
for s in (-1, 1):
    tx = NX + s * 0.12
    box(f'nicholastower{s}', M['brick'], tx, NY - 0.05, G - 0.005, 0.14, 0.14, 0.62, outline=0.006, bevel=0)
    box(f'nicholaswin{s}', M['dark'], tx, NY - 0.123, G + 0.45, 0.035, 0.006, 0.08, outline=0, bevel=0)
    lathe(f'nicholascap{s}', M['copper'], ((0.08, 0), (0.07, 0.04), (0.04, 0.08), (0.02, 0.1), (0.025, 0.12), (0.003, 0.2)), G + 0.615, tx, NY - 0.05, segs=8, outline=0.003, smooth=False)

# ---------- the town hall's show front ----------
TX, TY = 0.0, 0.05
W, H = 0.66, 0.3
box('townhall', M['brick'], TX, TY + 0.15, G - 0.005, W, 0.3, H, outline=0.008, bevel=0)
# the arcade along the ground floor
for j in range(6):
    x = TX - W / 2 + 0.06 + j * (W - 0.12) / 5
    box(f'arcade{j}', M['dark'], x, TY - 0.003, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
    pyramid(f'arcadetop{j}', M['dark'], x, TY - 0.003, G + 0.095, 0.06, 0.04, outline=0)
for j in range(6):
    x = TX - W / 2 + 0.06 + j * (W - 0.12) / 5
    box(f'thwin{j}', M['glaze'], x, TY - 0.003, G + 0.17, 0.04, 0.006, 0.08, outline=0, bevel=0)
# the show front rising above the roof: a screen wall with pinnacles, open round windows between them
SZ = G + H - 0.005
box('screen', M['brick'], TX, TY + 0.01, SZ, W, 0.04, 0.22, outline=0.006, bevel=0)
for j in range(7):
    x = TX - W / 2 + 0.01 + j * (W - 0.02) / 6
    box(f'pinnacle{j}', M['brickDark'], x, TY + 0.0, SZ, 0.04, 0.05, 0.3, outline=0.003, bevel=0)
    lathe(f'pinnaclecap{j}', M['copper'], ((0.024, 0), (0.003, 0.08)), SZ + 0.295, x, TY, segs=6, outline=0.002, smooth=False)
for j in range(6):
    x = TX - W / 2 + 0.01 + (j + 0.5) * (W - 0.02) / 6
    cyl(f'roundwindow{j}', M['sky'], 0.028, 0.05, segs=14, outline=0, matrix=Matrix.Translation((x, TY + 0.01, SZ + 0.15)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'gothicwin{j}', M['glaze'], x, TY - 0.012, SZ + 0.03, 0.025, 0.006, 0.07, outline=0, bevel=0)
loft('townhallroof', M['roof'], [[(TX - W / 2, TY + 0.03, G + H - 0.005), (TX + W / 2, TY + 0.03, G + H - 0.005), (TX + W / 2, TY + 0.3, G + H - 0.005), (TX - W / 2, TY + 0.3, G + H - 0.005)],
                                 [(TX - W / 2, TY + 0.165, G + H + 0.1), (TX + W / 2, TY + 0.165, G + H + 0.1), (TX + W / 2, TY + 0.175, G + H + 0.1), (TX - W / 2, TY + 0.175, G + H + 0.1)]], outline=0.004)

# ---------- the gabled merchants' houses round the Old Market ----------
colours = ('white', 'ochre', 'brick')
for k, (x, y) in enumerate(((-0.75, -0.15), (-0.72, 0.25), (0.72, -0.2), (0.74, 0.2), (-0.4, -0.7), (0.4, -0.72))):
    w = 0.2
    h = 0.22 + 0.04 * (k % 2)
    mat = M[colours[k % 3]]
    box(f'house{k}', mat, x, y, G - 0.005, w, 0.2, h, outline=0.005, bevel=0)
    for row in range(2):
        box(f'housewin{k}{row}', M['dark'], x, y - 0.103, G + 0.06 + row * 0.07, 0.04, 0.006, 0.04, outline=0, bevel=0)
    # the stepped gable to the square
    for st in range(3):
        box(f'gable{k}{st}', mat, x, y - 0.09, G + h - 0.005 + st * 0.035, w - st * 0.06, 0.02, 0.036, outline=0.002, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - w / 2, y - 0.08, G + h - 0.005), (x + w / 2, y - 0.08, G + h - 0.005), (x + w / 2, y + 0.1, G + h - 0.005), (x - w / 2, y + 0.1, G + h - 0.005)],
                                      [(x - 0.004, y - 0.08, G + h + 0.1), (x + 0.004, y - 0.08, G + h + 0.1), (x + 0.004, y + 0.1, G + h + 0.1), (x - 0.004, y + 0.1, G + h + 0.1)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
