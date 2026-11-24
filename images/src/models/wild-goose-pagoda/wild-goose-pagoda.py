# A cartoon Giant Wild Goose Pagoda for the country maps, built in the set's shared look
# (../toon.py): Xi'an's square brick pagoda of seven storeys, each a little smaller than the one
# below with its arched window on every side and its corbelled cornice, the finial on top, standing
# on its platform behind the Da Ci'en Temple's halls with their red columns and grey tiled roofs,
# and the trees of the temple garden. Turned a little towards the camera.
# Run: blender -b --factory-startup -P wild-goose-pagoda.py -- wild-goose-pagoda-1024.png 1024 wild-goose-pagoda.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'brick': toon('brick', '#c8a87a', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'brickDark': toon('brickDark', '#a8885a'),
    'dark': flat('dark', '#3a3028'),
    'tile': toon('tile', '#5a5e66'),
    'red': toon('red', '#b83a2a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'gold': toon('gold', '#e0b040', lift=0.3),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

PX, PY = 0.05, 0.3
box('platform', M['brickDark'], PX, PY, G - 0.005, 0.46, 0.46, 0.06, outline=0.006, bevel=0)
z = G + 0.055
w = 0.34
for i in range(7):
    h = 0.13 if i == 0 else 0.085
    box(f'storey{i}', M['brick'], PX, PY, z, w, w, h, outline=0.007, bevel=0)
    for side in range(4):
        a = math.pi / 2 * side
        cx, cy = PX + (w / 2 + 0.003) * math.cos(a - math.pi / 2), PY + (w / 2 + 0.003) * math.sin(a - math.pi / 2)
        box(f'win{i}{side}', M['dark'], cx, cy, z + h * 0.25, w * 0.16, 0.006, h * 0.45, rot_z=a, outline=0, bevel=0)
        cyl(f'wintop{i}{side}', M['dark'], w * 0.08, 0.006, segs=10, outline=0, matrix=Matrix.Translation((cx, cy, z + h * 0.7)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'cornice{i}', M['brickDark'], PX, PY, z + h - 0.005, w + 0.04, w + 0.04, 0.02, outline=0.003, bevel=0)
    box(f'cornice2{i}', M['brickDark'], PX, PY, z + h + 0.013, w + 0.02, w + 0.02, 0.012, outline=0.002, bevel=0)
    z += h + 0.025
    w *= 0.9
pyramid('top', M['brickDark'], PX, PY, z - 0.005, w * 0.9, 0.06, outline=0.003)
lathe('finial', M['brickDark'], ((0.03, 0), (0.02, 0.03), (0.03, 0.05), (0.004, 0.11)), z + 0.05, PX, PY, segs=10, outline=0.002)

# ---------- the temple halls ----------
def hall(name, x, y, w, d, h):
    box(name, M['red'], x, y, G - 0.005, w * 0.86, d * 0.7, h, outline=0.005, bevel=0)
    for j in range(5):
        rod(f'{name}col{j}', M['red'], (x - w * 0.4 + j * w * 0.2, y - d * 0.4, G), (x - w * 0.4 + j * w * 0.2, y - d * 0.4, G + h), 0.008, segs=6, outline=0.001)
    loft(f'{name}roof', M['tile'], [[(x - w / 2 - 0.03, y - d / 2 - 0.03, G + h), (x + w / 2 + 0.03, y - d / 2 - 0.03, G + h), (x + w / 2 + 0.03, y + d / 2 + 0.03, G + h), (x - w / 2 - 0.03, y + d / 2 + 0.03, G + h)],
                                    [(x - w * 0.36, y - d * 0.1, G + h + 0.08), (x + w * 0.36, y - d * 0.1, G + h + 0.08), (x + w * 0.36, y + d * 0.1, G + h + 0.08), (x - w * 0.36, y + d * 0.1, G + h + 0.08)]], outline=0.005)
    for sx in (-1, 1):
        bar(f'{name}ridgeend{sx}', M['tile'], (x + sx * w * 0.36, y, G + h + 0.08), (x + sx * w * 0.4, y, G + h + 0.12), 0.016, outline=0.002)


hall('hall1', 0.0, -0.3, 0.4, 0.2, 0.1)
hall('gatehall', 0.0, -0.68, 0.3, 0.14, 0.08)
for s in (-1, 1):
    hall(f'sidehall{s}', s * 0.5, -0.05, 0.22, 0.3, 0.08)

for k, (x, y, r) in enumerate(((-0.6, 0.45, 0.12), (0.65, 0.45, 0.12), (-0.8, -0.35, 0.1), (0.8, -0.4, 0.1), (-0.35, 0.75, 0.1), (0.4, 0.8, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
