# A cartoon Jongmyo for the country maps, built in the set's shared look (../toon.py): the royal ancestral
# shrine of the Joseon kings in Seoul, the Jeongjeon hall stretching very long and low behind its row
# of red pillars under one great grey tiled roof, raised on its broad stone terrace, the wide court of
# rough granite in front with the raised spirit path running across it, the side halls closing the
# court, and the old trees round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P jongmyo.py -- jongmyo-1024.png 1024 jongmyo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'granite': toon('granite', '#c8c4bc', shadow_mul=(0.82, 0.84, 0.9), lift=0.18),
    'graniteDark': toon('graniteDark', '#a8a49c'),
    'red': toon('red', '#b8402e', lift=0.12),
    'wood': toon('wood', '#8a3a2a'),
    'green': toon('green', '#4a8a6a', lift=0.12),
    'roof': toon('roof', '#4a4e56', shadow_mul=(0.8, 0.82, 0.9)),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the court and the terrace ----------
box('court', M['granite'], 0.0, -0.12, G - 0.005, 1.7, 0.7, 0.03, outline=0.004, bevel=0)
box('spiritpath', M['graniteDark'], 0.0, -0.3, G + 0.02, 0.1, 0.6, 0.02, outline=0.002, bevel=0)
box('terrace', M['granite'], 0.0, 0.33, G - 0.005, 1.6, 0.36, 0.1, outline=0.005, bevel=0)
for s in (-1, 0, 1):
    for i in range(3):
        box(f'terracestair{s}{i}', M['graniteDark'], s * 0.5, 0.15 - i * 0.025, G + 0.02, 0.1, 0.025, 0.075 - i * 0.025, outline=0.001, bevel=0)

# ---------- the Jeongjeon hall ----------
HY, HZ = 0.38, G + 0.095
L = 1.44
box('backwall', M['wood'], 0.0, HY + 0.04, HZ, L, 0.12, 0.14, outline=0.006, bevel=0)
for k in range(19):
    x = -L / 2 + 0.03 + k * (L - 0.06) / 18
    rod(f'pillar{k}', M['red'], (x, HY - 0.07, HZ), (x, HY - 0.07, HZ + 0.14), 0.012, segs=10, outline=0.002)
    if k < 18:
        box(f'door{k}', M['dark'], x + (L - 0.06) / 36, HY - 0.022, HZ + 0.01, 0.05, 0.006, 0.11, outline=0, bevel=0)
box('bracketband', M['green'], 0.0, HY - 0.01, HZ + 0.135, L + 0.04, 0.16, 0.025, outline=0.002, bevel=0)
RZ = HZ + 0.155
loft('roof', M['roof'], [[(-L / 2 - 0.08, HY - 0.15, RZ), (L / 2 + 0.08, HY - 0.15, RZ), (L / 2 + 0.08, HY + 0.17, RZ), (-L / 2 - 0.08, HY + 0.17, RZ)],
                         [(-L / 2 - 0.05, HY - 0.08, RZ + 0.06), (L / 2 + 0.05, HY - 0.08, RZ + 0.06), (L / 2 + 0.05, HY + 0.1, RZ + 0.06), (-L / 2 - 0.05, HY + 0.1, RZ + 0.06)],
                         [(-L / 2 - 0.03, HY + 0.005, RZ + 0.13), (L / 2 + 0.03, HY + 0.005, RZ + 0.13), (L / 2 + 0.03, HY + 0.015, RZ + 0.13), (-L / 2 - 0.03, HY + 0.015, RZ + 0.13)]], outline=0.006)
box('ridge', M['dark'], 0.0, HY + 0.01, RZ + 0.125, L + 0.06, 0.025, 0.02, outline=0.002, bevel=0)
for k in range(30):
    x = -L / 2 - 0.06 + k * (L + 0.12) / 29
    bar(f'tileline{k}', M['dark'], (x, HY - 0.15, RZ + 0.003), (x * 0.99, HY - 0.08, RZ + 0.063), 0.004, outline=0)

# ---------- the side halls closing the court ----------
for s in (-1, 1):
    x = s * 0.72
    box(f'sidehall{s}', M['wood'], x, -0.25, G + 0.02, 0.12, 0.4, 0.1, outline=0.004, bevel=0)
    for k in range(5):
        rod(f'sidepillar{s}{k}', M['red'], (x - s * 0.07, -0.42 + k * 0.085, G + 0.02), (x - s * 0.07, -0.42 + k * 0.085, G + 0.12), 0.009, segs=8, outline=0.001)
    loft(f'sideroof{s}', M['roof'], [[(x - 0.1, -0.47, G + 0.12), (x + 0.1, -0.47, G + 0.12), (x + 0.1, -0.03, G + 0.12), (x - 0.1, -0.03, G + 0.12)],
                                     [(x - 0.004, -0.45, G + 0.2), (x + 0.004, -0.45, G + 0.2), (x + 0.004, -0.05, G + 0.2), (x - 0.004, -0.05, G + 0.2)]], outline=0.004)

# ---------- the old trees round the shrine ----------
for k, (x, y) in enumerate(((-0.5, 0.8), (0.0, 0.9), (0.5, 0.82), (-0.95, 0.35), (0.95, 0.35), (-0.4, -0.75), (0.45, -0.75))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.13, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
