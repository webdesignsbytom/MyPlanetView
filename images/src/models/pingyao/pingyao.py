# A cartoon Pingyao for the country maps, built in the set's shared look (../toon.py): the ancient
# walled city's grey brick wall with its battlements and square bastions, the gate tower on top in
# two storeys of red columns under grey tiled roofs, and inside, the main street of grey-roofed
# shops with red lanterns leading to the tall Market Building straddling it under its golden
# glazed roofs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pingyao.py -- pingyao-1024.png 1024 pingyao.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8bc98', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'street': toon('street', '#a8a098'),
    'brick': toon('brick', '#8a8a86', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'brickDark': toon('brickDark', '#6a6a68'),
    'red': toon('red', '#a8382a'),
    'tile': toon('tile', '#4a4e56'),
    'gold': toon('gold', '#d8a830', lift=0.2),
    'wood': toon('wood', '#8a5a3a'),
    'lantern': toon('lantern', '#e83a2a', lift=0.3),
    'dark': flat('dark', '#2e2a28'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def pavilion(name, x, y, z, w, d, h, roofmat, rise=0.07):
    box(name, M['red'], x, y, z, w * 0.82, d * 0.7, h, outline=0.004, bevel=0)
    for j in range(4):
        rod(f'{name}col{j}', M['red'], (x - w * 0.42 + j * w * 0.28, y - d * 0.42, z), (x - w * 0.42 + j * w * 0.28, y - d * 0.42, z + h), 0.007, segs=6, outline=0.001)
    loft(f'{name}roof', roofmat, [[(x - w / 2 - 0.03, y - d / 2 - 0.03, z + h), (x + w / 2 + 0.03, y - d / 2 - 0.03, z + h), (x + w / 2 + 0.03, y + d / 2 + 0.03, z + h), (x - w / 2 - 0.03, y + d / 2 + 0.03, z + h)],
                                  [(x - w * 0.34, y - 0.008, z + h + rise), (x + w * 0.34, y - 0.008, z + h + rise), (x + w * 0.34, y + 0.008, z + h + rise), (x - w * 0.34, y + 0.008, z + h + rise)]], outline=0.004)
    for sx in (-1, 1):
        bar(f'{name}tip{sx}', roofmat, (x + sx * (w / 2 + 0.02), y - d / 2 - 0.02, z + h), (x + sx * (w / 2 + 0.06), y - d / 2 - 0.06, z + h + 0.035), 0.012, outline=0.001)
    return z + h + rise


# ---------- the city wall ----------
WY, WH = -0.28, 0.22
box('wall', M['brick'], 0.0, WY, G - 0.005, 1.9, 0.16, WH, outline=0.01, bevel=0)
for j in range(36):
    x = -0.92 + j * 0.0525
    box(f'merlon{j}', M['brickDark'], x, WY - 0.07, G + WH - 0.005, 0.028, 0.025, 0.03, outline=0.001, bevel=0)
for k, x in enumerate((-0.7, 0.7)):
    box(f'bastion{k}', M['brick'], x, WY - 0.06, G - 0.005, 0.14, 0.14, WH + 0.01, outline=0.007, bevel=0)
    pavilion(f'watch{k}', x, WY - 0.06, G + WH + 0.005, 0.12, 0.1, 0.06, M['tile'], 0.05)
box('gatearch', M['dark'], 0.0, WY - 0.083, G - 0.005, 0.1, 0.006, 0.11, outline=0, bevel=0)
cyl('gatearchtop', M['dark'], 0.05, 0.006, segs=16, outline=0, matrix=Matrix.Translation((0.0, WY - 0.083, G + 0.105)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
z = pavilion('gatetower1', 0.0, WY, G + WH - 0.005, 0.34, 0.16, 0.08, M['tile'], 0.05)
pavilion('gatetower2', 0.0, WY, z - 0.01, 0.26, 0.12, 0.07, M['tile'], 0.07)

# ---------- the main street ----------
box('street', M['street'], 0.0, 0.25, G - 0.003, 0.14, 0.9, 0.008, outline=0, bevel=0)
for s in (-1, 1):
    for j in range(4):
        y = -0.05 + j * 0.16
        if j == 3:
            continue
        x = s * 0.17
        box(f'shop{s}{j}', M['wood'], x, y, G - 0.005, 0.18, 0.14, 0.1, outline=0.004, bevel=0)
        box(f'shopfront{s}{j}', M['dark'], x - s * 0.091, y, G - 0.005, 0.006, 0.08, 0.06, outline=0, bevel=0)
        loft(f'shoproof{s}{j}', M['tile'], [[(x - 0.1, y - 0.08, G + 0.095), (x + 0.1, y - 0.08, G + 0.095), (x + 0.1, y + 0.08, G + 0.095), (x - 0.1, y + 0.08, G + 0.095)],
                                            [(x - 0.004, y - 0.08, G + 0.15), (x + 0.004, y - 0.08, G + 0.15), (x + 0.004, y + 0.08, G + 0.15), (x - 0.004, y + 0.08, G + 0.15)]], outline=0.003)
        ball(f'lantern{s}{j}', M['lantern'], x - s * 0.1, y - 0.04, G + 0.085, 0.014, outline=0.001)

# ---------- the Market Building ----------
MY = 0.52
box('marketbase', M['brick'], 0.0, MY, G - 0.005, 0.24, 0.18, 0.12, outline=0.006, bevel=0)
box('marketarch', M['dark'], 0.0, MY - 0.093, G - 0.005, 0.08, 0.006, 0.07, outline=0, bevel=0)
cyl('marketarchtop', M['dark'], 0.04, 0.006, segs=14, outline=0, matrix=Matrix.Translation((0.0, MY - 0.093, G + 0.065)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
z = G + 0.115
for i, (w, h) in enumerate(((0.22, 0.08), (0.18, 0.07), (0.14, 0.06))):
    z = pavilion(f'market{i}', 0.0, MY, z, w, w * 0.8, h, M['gold'], 0.05 if i < 2 else 0.08) - 0.01
ball('marketfinial', M['gold'], 0.0, MY, z + 0.02, 0.015, outline=0)
for k, (x, y) in enumerate(((-0.55, 0.3), (0.55, 0.35), (-0.5, 0.65), (0.5, 0.7))):
    box(f'house{k}', M['brickDark'], x, y, G - 0.005, 0.26, 0.2, 0.1, outline=0.005, bevel=0)
    loft(f'houseroof{k}', M['tile'], [[(x - 0.14, y - 0.11, G + 0.095), (x + 0.14, y - 0.11, G + 0.095), (x + 0.14, y + 0.11, G + 0.095), (x - 0.14, y + 0.11, G + 0.095)],
                                      [(x - 0.14, y - 0.004, G + 0.16), (x + 0.14, y - 0.004, G + 0.16), (x + 0.14, y + 0.004, G + 0.16), (x - 0.14, y + 0.004, G + 0.16)]], outline=0.004)

turn(before, -20)
render(G)
