# A cartoon Kaiping Diaolou for the country maps, built in the set's shared look (../toon.py): the
# tall fortified tower houses of Guangdong's villages, built by emigrants come home, each a plain
# concrete tower with small barred windows rising to a top storey of Western fancy: columned loggias,
# corner turrets, a little dome or a pavilion; standing among green rice paddies with a pond and the
# low grey-roofed village houses. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kaiping-diaolou.py -- kaiping-diaolou-1024.png 1024 kaiping-diaolou.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paddy': toon('paddy', '#8ac85a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'paddyDark': toon('paddyDark', '#6aa84a'),
    'water': toon('water', '#6aaab0', lift=0.3),
    'concrete': toon('concrete', '#e8e0cc', shadow_mul=(0.84, 0.84, 0.9), lift=0.18),
    'concreteDark': toon('concreteDark', '#cfc6b0'),
    'ochre': toon('ochre', '#e8c890', lift=0.12),
    'window': flat('window', '#2e2a2a'),
    'tile': toon('tile', '#5a5e66'),
    'green': toon('green', '#5a9a7a', lift=0.12),
    'dome': toon('dome', '#c8b090', lift=0.12),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paddy'])
before = set(bpy.data.objects)

# the paddies' dykes and a pond
for k in range(5):
    y = -0.85 + k * 0.42
    box(f'dyke{k}', M['paddyDark'], 0, y, G - 0.002, 2 * math.sqrt(1.38 ** 2 - y * y), 0.03, 0.012, outline=0, bevel=0)
box('pond', M['water'], -0.55, -0.65, G - 0.002, 0.45, 0.3, 0.012, outline=0.002, bevel=0)


def diaolou(name, x, y, w, h, top):
    """A fortified tower: plain shaft with small windows, then a fancy top storey."""
    box(name, M['concrete'], x, y, G - 0.005, w, w, h, outline=0.007, bevel=0)
    for row in range(int(h / 0.1)):
        for j in (-1, 1):
            box(f'{name}win{row}{j}', M['window'], x + j * w * 0.22, y - w / 2 - 0.003, G + 0.06 + row * 0.1, 0.022, 0.006, 0.035, outline=0, bevel=0)
    Z = G + h
    box(f'{name}cornice', M['concreteDark'], x, y, Z - 0.01, w + 0.03, w + 0.03, 0.02, outline=0.002, bevel=0)
    if top == 'loggia':
        box(f'{name}loggia', M['ochre'], x, y, Z + 0.005, w - 0.02, w - 0.02, 0.1, outline=0.004, bevel=0)
        for j in range(3):
            rod(f'{name}col{j}', M['concrete'], (x - w * 0.3 + j * w * 0.3, y - w / 2 - 0.005, Z + 0.01), (x - w * 0.3 + j * w * 0.3, y - w / 2 - 0.005, Z + 0.1), 0.008, segs=6, outline=0.001)
        box(f'{name}loggiaroof', M['concreteDark'], x, y, Z + 0.1, w + 0.02, w + 0.02, 0.02, outline=0.002, bevel=0)
        lathe(f'{name}dome', M['dome'], ((w * 0.3, 0), (w * 0.28, 0.03), (w * 0.15, 0.07), (0.004, 0.09)), Z + 0.115, x, y, segs=16, outline=0.003)
    elif top == 'turrets':
        for sx in (-1, 1):
            for sy in (-1, 1):
                lathe(f'{name}turret{sx}{sy}', M['concrete'], ((0.025, 0), (0.025, 0.08)), Z, x + sx * w / 2, y + sy * w / 2, segs=10, outline=0.002)
                lathe(f'{name}turretcap{sx}{sy}', M['green'], ((0.03, 0), (0.02, 0.025), (0.003, 0.05)), Z + 0.08, x + sx * w / 2, y + sy * w / 2, segs=10, outline=0.002)
        box(f'{name}top', M['ochre'], x, y, Z, w - 0.04, w - 0.04, 0.08, outline=0.004, bevel=0)
        for j in range(4):
            box(f'{name}battlement{j}', M['concreteDark'], x - w * 0.3 + j * w * 0.2, y - w / 2 + 0.02, Z + 0.08, 0.025, 0.02, 0.03, outline=0.001, bevel=0)
    else:
        box(f'{name}pavilion', M['ochre'], x, y, Z + 0.005, w - 0.04, w - 0.04, 0.08, outline=0.004, bevel=0)
        loft(f'{name}pavroof', M['tile'], [[(x - w / 2 - 0.02, y - w / 2 - 0.02, Z + 0.08), (x + w / 2 + 0.02, y - w / 2 - 0.02, Z + 0.08), (x + w / 2 + 0.02, y + w / 2 + 0.02, Z + 0.08), (x - w / 2 - 0.02, y + w / 2 + 0.02, Z + 0.08)],
                                           [(x - 0.02, y - 0.02, Z + 0.15), (x + 0.02, y - 0.02, Z + 0.15), (x + 0.02, y + 0.02, Z + 0.15), (x - 0.02, y + 0.02, Z + 0.15)]], outline=0.003)


diaolou('ruishilou', -0.05, 0.25, 0.2, 0.72, 'loggia')
diaolou('tower2', 0.42, 0.05, 0.16, 0.5, 'turrets')
diaolou('tower3', -0.48, 0.35, 0.15, 0.44, 'pavilion')
diaolou('tower4', 0.3, 0.6, 0.14, 0.4, 'loggia')

# ---------- the village's low houses and trees ----------
for k, (x, y) in enumerate(((-0.75, -0.15), (-0.45, -0.25), (0.15, -0.3), (0.45, -0.35), (0.75, 0.35), (-0.25, 0.75))):
    box(f'house{k}', M['concreteDark'], x, y, G - 0.005, 0.22, 0.16, 0.1, outline=0.004, bevel=0)
    loft(f'houseroof{k}', M['tile'], [[(x - 0.12, y - 0.09, G + 0.095), (x + 0.12, y - 0.09, G + 0.095), (x + 0.12, y + 0.09, G + 0.095), (x - 0.12, y + 0.09, G + 0.095)],
                                      [(x - 0.12, y - 0.004, G + 0.15), (x + 0.12, y - 0.004, G + 0.15), (x + 0.12, y + 0.004, G + 0.15), (x - 0.12, y + 0.004, G + 0.15)]], outline=0.003)
for k, (x, y) in enumerate(((-0.85, 0.5), (0.85, -0.1), (0.6, -0.75), (-0.1, -0.7))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.17, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
