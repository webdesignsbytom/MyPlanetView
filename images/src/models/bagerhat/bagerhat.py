# A cartoon Bagerhat for the country maps, built in the set's shared look (../toon.py): the Sixty
# Dome Mosque of the mosque city, its long low hall of red terracotta brick with rows upon rows of
# little domes on the roof, the round corner towers with their small cupolas, the eleven arched
# doorways along its front, the great tank of water with its steps before it, and palms. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P bagerhat.py -- bagerhat-1024.png 1024 bagerhat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d0b898'),
    'brick': toon('brick', '#b85a3e', shadow_mul=(0.86, 0.78, 0.76), lift=0.04),
    'brickDark': toon('brickDark', '#94442e'),
    'water': toon('water', '#4a8a9a', lift=0.25),
    'dark': flat('dark', '#2e2222'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

MX, MY, W, D, H = 0.0, 0.25, 0.92, 0.5, 0.13
box('mosque', M['brick'], MX, MY, G - 0.005, W, D, H, outline=0.009, bevel=0)
box('cornice', M['brickDark'], MX, MY, G + H - 0.01, W + 0.01, D + 0.01, 0.018, outline=0.002, bevel=0)
for i in range(7):
    for j in range(11):
        x = MX - W / 2 + (j + 0.5) * W / 11
        y = MY - D / 2 + (i + 0.5) * D / 7
        lathe(f'dome{i}{j}', M['brick'], ((0.034, 0), (0.03, 0.02), (0.016, 0.035), (0.004, 0.04)), G + H - 0.002, x, y, segs=12, outline=0.002)
for j in range(11):
    x = MX - W / 2 + (j + 0.5) * W / 11
    box(f'door{j}', M['dark'], x, MY - D / 2 - 0.003, G - 0.005, 0.035, 0.006, 0.06, outline=0, bevel=0)
    cyl(f'doortop{j}', M['dark'], 0.0175, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, MY - D / 2 - 0.003, G + 0.055)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for sx in (-1, 1):
    for sy in (-1, 1):
        tx, ty = MX + sx * W / 2, MY + sy * D / 2
        lathe(f'tower{sx}{sy}', M['brick'], ((0.055, 0), (0.05, 0.17)), G - 0.005, tx, ty, segs=14, outline=0.004)
        for k in range(3):
            lathe(f'towerband{sx}{sy}{k}', M['brickDark'], ((0.055, 0), (0.055, 0.01)), G + 0.04 + k * 0.045, tx, ty, segs=14, outline=0)
        lathe(f'towerdome{sx}{sy}', M['brick'], ((0.05, 0), (0.04, 0.025), (0.004, 0.05)), G + 0.165, tx, ty, segs=14, outline=0.002)

# ---------- the tank ----------
box('tankrim', M['path'], MX, -0.45, G - 0.005, 0.8, 0.34, 0.015, outline=0.002, bevel=0)
box('tank', M['water'], MX, -0.45, G - 0.002, 0.72, 0.26, 0.016, outline=0, bevel=0)
for i in range(3):
    box(f'ghatstep{i}', M['path'], MX, -0.3 - i * 0.02, G - 0.005, 0.16, 0.03, 0.02 - i * 0.005, outline=0.001, bevel=0)
bar('walk', M['path'], (MX, -0.28, G + 0.002), (MX, MY - D / 2 - 0.02, G + 0.002), 0.1, outline=0)
for k, (x, y) in enumerate(((-0.75, -0.2), (0.75, -0.2), (-0.7, 0.62), (0.7, 0.62), (-0.55, -0.75), (0.55, -0.75))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)
