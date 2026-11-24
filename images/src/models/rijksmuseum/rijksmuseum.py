# A cartoon Rijksmuseum for the country maps, built in the set's shared look (../toon.py):
# Amsterdam's great red-brick museum, its two tall towers with their slate spires either side of the
# arched passage cyclists ride through, its rows of tall windows and corner towers, the pond and
# lawns of the Museumplein in front, and bicycles. Turned a little towards the camera.
# Run: blender -b --factory-startup -P rijksmuseum.py -- rijksmuseum-1024.png 1024 rijksmuseum.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d8d0c4', lift=0.15),
    'brick': toon('brick', '#b8583a', shadow_mul=(0.86, 0.76, 0.72)),
    'stone': toon('stone', '#e8e0d0', lift=0.15),
    'slate': toon('slate', '#4a5058', shadow_mul=(0.84, 0.84, 0.9)),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#3a4a5a'),
    'door': flat('door', '#2e2a28'),
    'pond': toon('pond', '#5a9ac0', lift=0.3),
    'bike0': toon('bike0', '#2f6fc0'), 'bike1': toon('bike1', '#e8402c'), 'bike2': toon('bike2', '#2e2a30'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

box('square', M['paving'], 0.0, -0.1, G - 0.004, 1.6, 0.5, 0.01, outline=0.004, bevel=0)
box('pond', M['pond'], 0.0, -0.6, G - 0.003, 0.9, 0.22, 0.015, outline=0.004, bevel=0)

# ---------- the museum ----------
MX, MY = 0.0, 0.35
box('main', M['brick'], MX, MY, G - 0.005, 1.5, 0.4, 0.3, outline=0.012, bevel=0)
for r in range(2):
    for j in range(14):
        x = MX - 0.68 + j * 0.105
        if abs(x) < 0.2:
            continue
        box(f'win{r}{j}', M['window'], x, MY - 0.202, G + 0.05 + r * 0.12, 0.045, 0.006, 0.08, outline=0, bevel=0)
box('stoneband', M['stone'], MX, MY - 0.202, G + 0.175, 1.5, 0.006, 0.012, outline=0, bevel=0)
loft('mainroof', M['slate'], [[(MX - 0.76, MY - 0.21, G + 0.295), (MX + 0.76, MY - 0.21, G + 0.295), (MX + 0.76, MY + 0.21, G + 0.295), (MX - 0.76, MY + 0.21, G + 0.295)],
                              [(MX - 0.7, MY - 0.004, G + 0.42), (MX + 0.7, MY - 0.004, G + 0.42), (MX + 0.7, MY + 0.004, G + 0.42), (MX - 0.7, MY + 0.004, G + 0.42)]], outline=0.008)
# the central block with its passage
box('centre', M['brick'], MX, MY - 0.03, G - 0.005, 0.36, 0.48, 0.4, outline=0.01, bevel=0)
box('passage', M['door'], MX, MY - 0.272, G - 0.005, 0.14, 0.006, 0.16, outline=0, bevel=0)
lathe('passagetop', M['door'], ((0.07, 0), (0.05, 0.04), (0.004, 0.06)), G + 0.15, MX, MY - 0.272, segs=8, outline=0, smooth=False)
for s in (-1, 1):
    box(f'centrewin{s}', M['window'], MX + s * 0.11, MY - 0.272, G + 0.22, 0.05, 0.006, 0.12, outline=0, bevel=0)
    TX = MX + s * 0.13
    box(f'tower{s}', M['brick'], TX, MY - 0.2, G - 0.005, 0.12, 0.12, 0.62, outline=0.01, bevel=0)
    box(f'towerwin{s}', M['window'], TX, MY - 0.262, G + 0.44, 0.04, 0.006, 0.1, outline=0, bevel=0)
    box(f'towerband{s}', M['stone'], TX, MY - 0.2, G + 0.4, 0.13, 0.13, 0.02, outline=0.003, bevel=0)
    pyramid(f'towerspire{s}', M['slate'], TX, MY - 0.2, G + 0.61, 0.14, 0.24, outline=0.007)
    rod(f'towerfinial{s}', M['gold'], (TX, MY - 0.2, G + 0.84), (TX, MY - 0.2, G + 0.9), 0.006, segs=5, outline=0)
for s in (-1, 1):
    box(f'cornertower{s}', M['brick'], MX + s * 0.72, MY - 0.15, G - 0.005, 0.12, 0.12, 0.4, outline=0.008, bevel=0)
    pyramid(f'cornerspire{s}', M['slate'], MX + s * 0.72, MY - 0.15, G + 0.395, 0.13, 0.15, outline=0.006)

# ---------- bicycles and trees ----------


def bike(name, x, y, mat):
    for s in (-1, 1):
        cyl(f'{name}wheel{s}', M['bike2'], 0.025, 0.004, segs=12, outline=0.002, matrix=Matrix.Translation((x + s * 0.035, y, G + 0.025)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    bar(f'{name}frame', M[mat], (x - 0.035, y, G + 0.025), (x + 0.02, y, G + 0.05), 0.007, outline=0)
    bar(f'{name}frame2', M[mat], (x + 0.035, y, G + 0.025), (x + 0.02, y, G + 0.05), 0.007, outline=0)
    rod(f'{name}bar', M[mat], (x + 0.025, y, G + 0.05), (x + 0.03, y, G + 0.07), 0.003, segs=4, outline=0)


for k, (x, y) in enumerate(((-0.4, -0.2), (-0.3, -0.25), (0.35, -0.2), (0.45, -0.28), (0.05, -0.15))):
    bike(f'bike{k}', x, y, f'bike{k % 3}')
for k, (x, y) in enumerate(((-0.9, -0.4), (0.9, -0.4), (-0.95, 0.05), (0.95, 0.05))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.11, 0.09, outline=0.008)

turn(before, -20)
render(G)
