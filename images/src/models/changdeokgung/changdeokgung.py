# A cartoon Changdeokgung for the country maps, built in the set's shared look (../toon.py): the
# Joseon palace's Injeongjeon throne hall on its two-tiered stone terrace, its red columns and green
# and red painted brackets under the sweeping double roof of grey tiles, the courtyard's stone paving
# and rank stones, the Donhwamun gate, and the Secret Garden's Buyongji pond with its pavilion on
# stilts and the wooded hills behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P changdeokgung.py -- changdeokgung-1024.png 1024 changdeokgung.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'court': toon('court', '#d4ccbc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#c8c0b0'),
    'red': toon('red', '#b8402e', shadow_mul=(0.86, 0.76, 0.76), lift=0.08),
    'green': toon('green', '#3a9a7a', lift=0.12),
    'tile': toon('tile', '#5a5e66', shadow_mul=(0.86, 0.86, 0.92)),
    'white': toon('white', '#f0ece2'),
    'pond': toon('pond', '#3a8a8a', lift=0.3),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'maple': toon('maple', '#e0602e', lift=0.1),
    'dark': flat('dark', '#2e2a2a'),
})

G = tile(M['court'])
before = set(bpy.data.objects)


def hall(name, x, y, z, w, d, h, roof_h, double):
    """A Korean hall: red columns, green bracket band, a hip-and-gable roof (or two)."""
    box(f'{name}body', M['white'], x, y, z, w - 0.03, d - 0.03, h, outline=0.004, bevel=0)
    for j in range(7):
        cx = x - w / 2 + 0.015 + j * (w - 0.03) / 6
        rod(f'{name}col{j}', M['red'], (cx, y - d / 2 + 0.005, z), (cx, y - d / 2 + 0.005, z + h), 0.012, segs=8, outline=0.002)
    for j in range(6):
        box(f'{name}door{j}', M['red'], x - w / 2 + 0.05 + j * (w - 0.1) / 5, y - d / 2 + 0.012, z + 0.01, (w - 0.1) / 6, 0.006, h * 0.75, outline=0, bevel=0)
    box(f'{name}brackets', M['green'], x, y, z + h, w + 0.02, d + 0.02, 0.03, outline=0.003, bevel=0)
    levels = ((z + h + 0.025, w + 0.16, d + 0.16, roof_h),) if not double else ((z + h + 0.025, w + 0.16, d + 0.16, roof_h * 0.5), (z + h + 0.025 + roof_h * 0.6, w * 0.85, d * 0.8, roof_h * 0.7))
    for k, (zz, ww, dd, rh) in enumerate(levels):
        if k:
            box(f'{name}upper', M['white'], x, y, zz - roof_h * 0.15, ww - 0.1, dd - 0.08, roof_h * 0.18, outline=0.003, bevel=0)
            box(f'{name}upperbrackets', M['green'], x, y, zz - 0.02, ww - 0.08, dd - 0.06, 0.025, outline=0.002, bevel=0)
        loft(f'{name}roof{k}', M['tile'], [[(x - ww / 2, y - dd / 2, zz), (x + ww / 2, y - dd / 2, zz), (x + ww / 2, y + dd / 2, zz), (x - ww / 2, y + dd / 2, zz)],
                                           [(x - ww / 2 + 0.05, y - dd / 2 + 0.05, zz + rh * 0.3), (x + ww / 2 - 0.05, y - dd / 2 + 0.05, zz + rh * 0.3), (x + ww / 2 - 0.05, y + dd / 2 - 0.05, zz + rh * 0.3), (x - ww / 2 + 0.05, y + dd / 2 - 0.05, zz + rh * 0.3)],
                                           [(x - ww * 0.3, y - 0.01, zz + rh), (x + ww * 0.3, y - 0.01, zz + rh), (x + ww * 0.3, y + 0.01, zz + rh), (x - ww * 0.3, y + 0.01, zz + rh)]], outline=0.005)
        box(f'{name}ridge{k}', M['white'], x, y, zz + rh - 0.008, ww * 0.6 + 0.02, 0.025, 0.02, outline=0.002, bevel=0)
        for sx in (-1, 1):
            for sy in (-1, 1):
                bar(f'{name}curl{k}{sx}{sy}', M['tile'], (x + sx * (ww / 2 - 0.04), y + sy * (dd / 2 - 0.04), zz + 0.005), (x + sx * (ww / 2 + 0.02), y + sy * (dd / 2 + 0.02), zz + 0.04), 0.025, outline=0.002)


# ---------- Injeongjeon on its terrace ----------
HX, HY = -0.1, 0.25
for k, (w, d, z) in enumerate(((0.9, 0.62, 0.0), (0.78, 0.52, 0.04))):
    box(f'terrace{k}', M['stone'], HX, HY, G - 0.005 + z, w, d, 0.045, outline=0.004, bevel=0)
box('terracestair', M['stone'], HX, HY - 0.34, G - 0.005, 0.12, 0.08, 0.06, outline=0.002, bevel=0)
hall('injeongjeon', HX, HY, G + 0.08, 0.62, 0.36, 0.2, 0.26, True)
# the courtyard's rank stones in two rows
for s in (-1, 1):
    for j in range(5):
        rod(f'rankstone{s}{j}', M['stone'], (HX + s * 0.1, HY - 0.45 - j * 0.1, G), (HX + s * 0.1, HY - 0.45 - j * 0.1, G + 0.04), 0.012, segs=6, outline=0.001)
box('royalpath', M['stone'], HX, HY - 0.65, G - 0.004, 0.08, 0.5, 0.01, outline=0.001, bevel=0)

# ---------- the gate on the left ----------
hall('donhwamun', -0.75, -0.3, G - 0.005, 0.34, 0.16, 0.14, 0.14, False)

# ---------- the Secret Garden's pond and pavilion on the right ----------
PX, PY = 0.68, -0.25
box('pondrim', M['stone'], PX, PY, G - 0.005, 0.44, 0.44, 0.02, outline=0.002, bevel=0)
box('pond', M['pond'], PX, PY, G + 0.002, 0.4, 0.4, 0.02, outline=0, bevel=0)
lathe('pondisland', M['tree'], ((0.07, 0), (0.06, 0.02)), G + 0.01, PX, PY, segs=16, outline=0.002)
ball('islandtree', M['tree'], PX, PY, G + 0.08, 0.05, outline=0.006)
for j in range(4):
    rod(f'buyongpost{j}', M['red'], (PX - 0.05 + (j % 2) * 0.1, PY - 0.22 - (j // 2) * 0.06, G), (PX - 0.05 + (j % 2) * 0.1, PY - 0.22 - (j // 2) * 0.06, G + 0.1), 0.008, segs=6, outline=0.001)
hall('buyongjeong', PX, PY - 0.25, G + 0.08, 0.14, 0.1, 0.06, 0.08, False)

# ---------- the wooded hills behind ----------
for k, (x, y) in enumerate(((-0.75, 0.6), (-0.45, 0.85), (0.4, 0.8), (0.7, 0.5), (0.85, 0.15), (-0.9, 0.2))):
    ball(f'tree{k}', M['maple'] if k % 3 == 0 else M['tree'], x, y, G + 0.14, 0.13, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
