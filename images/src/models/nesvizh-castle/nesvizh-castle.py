# A cartoon Nesvizh Castle for the country maps, built in the set's shared look (../toon.py): the
# Radziwiłł palace on its island in the moat, its ochre and white wings round the courtyard under
# dark roofs, the corner towers and the gate tower with its clock and baroque spire, the bridge
# over the moat, and the park's trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nesvizh-castle.py -- nesvizh-castle-1024.png 1024 nesvizh-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'moat': toon('moat', '#4a8a9a', shadow_mul=(0.74, 0.84, 0.88), lift=0.3),
    'island': toon('island', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'ochre': toon('ochre', '#ecc878', shadow_mul=(0.86, 0.8, 0.74), lift=0.15),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#5a5654', shadow_mul=(0.8, 0.8, 0.88)),
    'spire': toon('spire', '#4a7a6a', shadow_mul=(0.8, 0.84, 0.86)),
    'clock': toon('clock', '#f0c030', lift=0.3),
    'window': flat('window', '#3a3640'),
    'bridge': toon('bridge', '#c8bca4', shadow_mul=(0.82, 0.8, 0.86)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'treeLight': toon('treeLight', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1319)

# ---------- the moat round the island ----------
IX, IY = 0.0, 0.15
cyl('moat', M['moat'], 0.82, 0.012, segs=40, outline=0.006, matrix=Matrix.Translation((IX, IY, G - 0.004)) @ Matrix.Scale(0.9, 4, Vector((0, 1, 0))))
isle = loft('island', M['island'], [[(IX + 0.62 * math.cos(t), IY + 0.5 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 32 for j in range(32))],
                                    [(IX + 0.6 * math.cos(t), IY + 0.48 * math.sin(t), G + 0.05) for t in (2 * math.pi * j / 32 for j in range(32))]], outline=0.012)
isle.visible_shadow = False
T = G + 0.05


# ---------- the palace: four wings round the courtyard ----------
def wing(name, x, y, w, d, h, mat='ochre'):
    box(name, M[mat], x, y, T - 0.005, w, d, h, outline=0.012, bevel=0)
    box(f'{name}cornice', M['white'], x, y, T + h - 0.012, w + 0.008, d + 0.008, 0.014, outline=0.004, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2, y - d / 2, T + h), (x + w / 2, y - d / 2, T + h), (x + w / 2, y + d / 2, T + h), (x - w / 2, y + d / 2, T + h)],
                                    [(x - w / 2 + 0.03, y - 0.004, T + h + 0.07), (x + w / 2 - 0.03, y - 0.004, T + h + 0.07), (x + w / 2 - 0.03, y + 0.004, T + h + 0.07),
                                     (x - w / 2 + 0.03, y + 0.004, T + h + 0.07)]] if w >= d else
         [[(x - w / 2, y - d / 2, T + h), (x + w / 2, y - d / 2, T + h), (x + w / 2, y + d / 2, T + h), (x - w / 2, y + d / 2, T + h)],
          [(x - 0.004, y - d / 2 + 0.03, T + h + 0.07), (x + 0.004, y - d / 2 + 0.03, T + h + 0.07), (x + 0.004, y + d / 2 - 0.03, T + h + 0.07),
           (x - 0.004, y + d / 2 - 0.03, T + h + 0.07)]], outline=0.008)


wing('frontleft', IX - 0.22, IY - 0.22, 0.3, 0.12, 0.13)
wing('frontright', IX + 0.22, IY - 0.22, 0.3, 0.12, 0.13)
wing('back', IX, IY + 0.24, 0.74, 0.14, 0.15)
wing('left', IX - 0.32, IY + 0.02, 0.12, 0.36, 0.13)
wing('right', IX + 0.32, IY + 0.02, 0.12, 0.36, 0.13)
for s in (-1, 1):
    for j in range(3):
        box(f'frontwin{s}{j}', M['window'], IX + s * (0.12 + j * 0.08), IY - 0.283, T + 0.05, 0.025, 0.006, 0.045, outline=0, bevel=0)
for j in range(7):
    box(f'backwin{j}', M['window'], IX - 0.3 + j * 0.1, IY + 0.168, T + 0.07, 0.025, 0.006, 0.045, outline=0, bevel=0)
# the corner towers with their domes
for k, (x, y) in enumerate(((IX - 0.38, IY - 0.22), (IX + 0.38, IY - 0.22), (IX - 0.38, IY + 0.26), (IX + 0.38, IY + 0.26))):
    lathe(f'tower{k}', M['white'], ((0.06, 0), (0.06, 0.2)), T - 0.005, x, y, segs=12, outline=0.01)
    lathe(f'towerdome{k}', M['spire'], ((0.068, 0), (0.05, 0.04), (0.02, 0.07), (0.015, 0.1), (0.003, 0.14)), T + 0.195, x, y, segs=12, outline=0.006)
# the gate tower with its clock and baroque spire
box('gatetower', M['white'], IX, IY - 0.24, T - 0.005, 0.14, 0.14, 0.26, outline=0.012, bevel=0)
box('gatearch', M['window'], IX, IY - 0.313, T, 0.06, 0.006, 0.09, outline=0, bevel=0)
cyl('clock', M['clock'], 0.03, 0.008, segs=16, outline=0.004, matrix=Matrix.Translation((IX, IY - 0.314, T + 0.19)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('gatespire', M['spire'], ((0.085, 0), (0.06, 0.04), (0.03, 0.08), (0.04, 0.11), (0.018, 0.15), (0.012, 0.2), (0.003, 0.26)), T + 0.255, IX, IY - 0.24, segs=12,
      outline=0.008)

# ---------- the bridge over the moat, the park's trees ----------
box('bridge', M['bridge'], IX, IY - 0.6, G + 0.02, 0.1, 0.3, 0.03, outline=0.006, bevel=0)
for s in (-1, 1):
    box(f'bridgerail{s}', M['bridge'], IX + s * 0.05, IY - 0.6, G + 0.05, 0.012, 0.3, 0.025, outline=0.003, bevel=0)
for k in range(12):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(1.02, 1.25)
    x, y = r * math.cos(a), r * math.sin(a) * 0.95 + 0.08
    if abs(x) < 0.15 and y < -0.3:
        continue
    ball(f'tree{k}', M['tree' if k % 2 else 'treeLight'], x, y, G + 0.08, rng.uniform(0.08, 0.1), outline=0.012)

turn(before, -20)
render(G)
