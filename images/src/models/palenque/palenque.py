# A cartoon Palenque for the country maps, built in the set's shared look (../toon.py): the Temple
# of the Inscriptions on its nine-stepped pyramid, the temple on top with its sloping roof and
# doorways, the Palace's four-storey tower beside it, the grey limestone streaked with moss, and the
# rainforest of Chiapas closing in all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P palenque.py -- palenque-1024.png 1024 palenque.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('limestone', '#b8b0a2', shadow_mul=(0.84, 0.84, 0.9)),
    'stoneDark': toon('limestoneDark', '#9a9286', shadow_mul=(0.84, 0.84, 0.9)),
    'moss': toon('moss', '#7a9a5a', shadow_mul=(0.74, 0.8, 0.74)),
    'window': flat('window', '#2e2a28'),
    'jungle': toon('jungle', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'jungleLight': toon('jungleLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1823)

# ---------- the jungle all round ----------
for k in range(30):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.95, 1.25)
    x, y = r * math.cos(a), r * math.sin(a)
    if y < -0.5:
        continue
    ball(f'jungle{k}', M['jungle' if k % 2 else 'jungleLight'], x, y, G + 0.1, rng.uniform(0.1, 0.14), outline=0.012)

# ---------- the Temple of the Inscriptions ----------
TX, TY = -0.15, 0.2
z = G - 0.005
w, d = 0.8, 0.5
for i in range(9):
    loft(f'step{i}', M['stone' if i % 2 == 0 else 'stoneDark'],
         [[(TX - w / 2, TY - d / 2, z), (TX + w / 2, TY - d / 2, z), (TX + w / 2, TY + d / 2, z), (TX - w / 2, TY + d / 2, z)],
          [(TX - w / 2 + 0.015, TY - d / 2 + 0.015, z + 0.04), (TX + w / 2 - 0.015, TY - d / 2 + 0.015, z + 0.04), (TX + w / 2 - 0.015, TY + d / 2 - 0.015, z + 0.04),
           (TX - w / 2 + 0.015, TY + d / 2 - 0.015, z + 0.04)]], outline=0.008)
    z += 0.04
    w -= 0.05
    d -= 0.03
for i in range(14):
    box(f'stair{i}', M['stone'], TX, TY - 0.25 + i * 0.012, G - 0.005, 0.14, 0.03, 0.026 * (i + 1), outline=0.002, bevel=0)
box('temple', M['stone'], TX, TY, z - 0.005, 0.36, 0.2, 0.08, outline=0.01, bevel=0)
for j in range(5):
    box(f'templedoor{j}', M['window'], TX - 0.14 + j * 0.07, TY - 0.103, z, 0.035, 0.006, 0.06, outline=0, bevel=0)
loft('templeroof', M['stoneDark'], [[(TX - 0.19, TY - 0.11, z + 0.075), (TX + 0.19, TY - 0.11, z + 0.075), (TX + 0.19, TY + 0.11, z + 0.075), (TX - 0.19, TY + 0.11, z + 0.075)],
                                    [(TX - 0.15, TY - 0.03, z + 0.15), (TX + 0.15, TY - 0.03, z + 0.15), (TX + 0.15, TY + 0.03, z + 0.15), (TX - 0.15, TY + 0.03, z + 0.15)]],
     outline=0.008)
for k in range(5):
    bar(f'mossstreak{k}', M['moss'], (TX - 0.3 + k * 0.15, TY - 0.24, G + 0.02), (TX - 0.25 + k * 0.12, TY - 0.15, G + 0.3), 0.03, outline=0)

# ---------- the Palace and its tower ----------
PX, PY = 0.6, -0.15
box('palace', M['stone'], PX, PY, G - 0.005, 0.5, 0.4, 0.1, outline=0.01, bevel=0)
for i in range(4):
    w2 = 0.12 - i * 0.015
    box(f'palacetower{i}', M['stone' if i % 2 else 'stoneDark'], PX + 0.05, PY + 0.05, G + 0.095 + i * 0.07, w2, w2, 0.07, outline=0.006, bevel=0)
    box(f'palacetowerwin{i}', M['window'], PX + 0.05, PY + 0.05 - w2 / 2 - 0.004, G + 0.115 + i * 0.07, 0.025, 0.006, 0.03, outline=0, bevel=0)
pyramid('palacetowerroof', M['stoneDark'], PX + 0.05, PY + 0.05, G + 0.375, 0.08, 0.05, outline=0.004)
for j in range(6):
    box(f'palacedoor{j}', M['window'], PX - 0.2 + j * 0.08, PY - 0.203, G + 0.01, 0.035, 0.006, 0.06, outline=0, bevel=0)

turn(before, -20)
render(G)
