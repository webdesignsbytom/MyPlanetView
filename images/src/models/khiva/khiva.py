# A cartoon Khiva for the country maps, built in the set's shared look (../toon.py): Itchan Kala,
# the walled inner town, the stubby Kalta Minor minaret wrapped in bands of turquoise and blue
# tiles, the tall slim Islam Khodja minaret behind, a madrasa's tiled portal and blue dome, and the
# thick mud-brick walls with their rounded bastions and crenels. Turned a little towards the camera.
# Run: blender -b --factory-startup -P khiva.py -- khiva-1024.png 1024 khiva.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e0c898', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'mud': toon('mud', '#c8a070', shadow_mul=(0.86, 0.78, 0.74)),
    'brick': toon('brick', '#d8b080', shadow_mul=(0.86, 0.8, 0.76)),
    'turq': toon('turq', '#2fb0b0', lift=0.2),
    'blue': toon('tileBlue', '#2f5ab0'),
    'white': toon('white', '#f4f0e6', lift=0.2),
    'green': toon('tileGreen', '#3f9a6a'),
    'door': flat('door', '#3a2a24'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def bands(name, x, y, z0, prof, cols):
    for i in range(len(prof) - 1):
        (r0, h0), (r1, h1) = prof[i], prof[i + 1]
        lathe(f'{name}band{i}', M[cols[i % len(cols)]], ((r0, 0), (r1, h1 - h0)), z0 + h0, x, y, segs=24, outline=0.008 if i == 0 else 0.006)


# ---------- the walls and bastions ----------
for k in range(9):
    x0, x1 = -1.0 + k * 0.23, -1.0 + (k + 1) * 0.23
    y0 = 0.85 - 0.35 * (x0 / 1.0) ** 2
    y1 = 0.85 - 0.35 * (x1 / 1.0) ** 2
    a = math.atan2(y1 - y0, x1 - x0)
    loft(f'wall{k}', M['mud'], [[(x0, y0 - 0.07, G - 0.005), (x1, y1 - 0.07, G - 0.005), (x1, y1 + 0.07, G - 0.005), (x0, y0 + 0.07, G - 0.005)],
                                [(x0, y0 - 0.04, G + 0.2), (x1, y1 - 0.04, G + 0.2), (x1, y1 + 0.04, G + 0.2), (x0, y0 + 0.04, G + 0.2)]], outline=0.008)
    for j in range(3):
        t = (j + 0.5) / 3
        lathe(f'crenel{k}{j}', M['mud'], ((0.022, 0), (0.02, 0.025), (0.004, 0.045)), G + 0.195, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, segs=8, outline=0.003)
    if k % 2 == 0:
        lathe(f'bastion{k}', M['mud'], ((0.1, 0), (0.08, 0.24)), G - 0.005, x0, y0, segs=16, outline=0.007)

# ---------- the madrasa ----------
MX, MY = 0.45, 0.25
box('madrasa', M['brick'], MX, MY, G - 0.005, 0.5, 0.3, 0.22, outline=0.01, bevel=0)
box('portal', M['brick'], MX, MY - 0.15, G - 0.005, 0.24, 0.05, 0.34, outline=0.008, bevel=0)
box('portaltiles', M['turq'], MX, MY - 0.177, G + 0.24, 0.2, 0.006, 0.08, outline=0, bevel=0)
box('iwan', M['blue'], MX, MY - 0.177, G - 0.005, 0.13, 0.006, 0.23, outline=0, bevel=0)
box('iwandoor', M['door'], MX, MY - 0.181, G - 0.005, 0.07, 0.006, 0.12, outline=0, bevel=0)
lathe('domedrum', M['brick'], ((0.09, 0), (0.09, 0.06)), G + 0.215, MX + 0.12, MY + 0.05, segs=16, outline=0.005)
lathe('dome', M['turq'], ((0.1, 0), (0.09, 0.06), (0.05, 0.11), (0.004, 0.14)), G + 0.27, MX + 0.12, MY + 0.05, segs=18, outline=0.006)

# ---------- Kalta Minor ----------
KX, KY = -0.25, -0.05
bands('kalta', KX, KY, G - 0.005, ((0.25, 0), (0.25, 0.08), (0.24, 0.14), (0.235, 0.2), (0.23, 0.26), (0.225, 0.32), (0.22, 0.37), (0.215, 0.42), (0.21, 0.48)),
      ['turq', 'blue', 'white', 'green'])
lathe('kaltatop', M['brick'], ((0.2, 0), (0.2, 0.02)), G + 0.47, KX, KY, segs=24, outline=0.005)
box('kaltadoor', M['door'], KX, KY - 0.245, G - 0.005, 0.07, 0.01, 0.12, outline=0, bevel=0)

# ---------- Islam Khodja ----------
IX, IY = 0.0, 0.55
bands('khodja', IX, IY, G - 0.005, ((0.1, 0), (0.095, 0.15), (0.09, 0.25), (0.085, 0.35), (0.08, 0.45), (0.075, 0.55), (0.07, 0.65), (0.065, 0.75), (0.06, 0.85)),
      ['brick', 'turq', 'brick', 'blue'])
lathe('khodjalantern', M['brick'], ((0.075, 0), (0.075, 0.06)), G + 0.845, IX, IY, segs=12, outline=0.005)
lathe('khodjadome', M['turq'], ((0.075, 0), (0.05, 0.04), (0.004, 0.08)), G + 0.905, IX, IY, segs=12, outline=0.004)

turn(before, -20)
render(G)
