# A cartoon Fatehpur Sikri for the country maps, built in the set's shared look (../toon.py): Akbar's
# red sandstone city, the towering Buland Darwaza at the top of its great flight of steps, its arch
# framed in white marble and its row of little domed kiosks, and behind it the Panch Mahal's five
# storeys of open columned pavilions narrowing to the top. Turned a little towards the camera.
# Run: blender -b --factory-startup -P fatehpur-sikri.py -- fatehpur-sikri-1024.png 1024 fatehpur-sikri.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8b888', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'sandstone': toon('sandstone', '#c0583a', shadow_mul=(0.86, 0.74, 0.72)),
    'sandstoneLight': toon('sandstoneLight', '#d0704a', shadow_mul=(0.86, 0.74, 0.72)),
    'marble': toon('marble', '#f8f6f0', lift=0.15),
    'door': flat('door', '#2e2420'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def chhatri(name, x, y, z, r):
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        rod(f'{name}col{j}', M['sandstoneLight'], (x + r * 0.7 * math.cos(a), y + r * 0.7 * math.sin(a), z), (x + r * 0.7 * math.cos(a), y + r * 0.7 * math.sin(a), z + r * 1.1), r * 0.13, segs=5, outline=0.002)
    lathe(f'{name}dome', M['sandstoneLight'], ((r * 0.95, 0), (r * 0.85, r * 0.45), (r * 0.45, r * 0.85), (0.004, r * 1.05)), z + r * 1.1, x, y, segs=10, outline=0.004)


# ---------- the Buland Darwaza and its steps ----------
BX, BY = -0.25, -0.05
for j in range(6):
    box(f'step{j}', M['sandstone'], BX, BY - 0.42 + j * 0.05, G - 0.005 + j * 0.03, 0.62 - j * 0.03, 0.12, 0.035, outline=0.004, bevel=0)
S0 = G + 0.17
box('gatewaybody', M['sandstone'], BX, BY, S0 - 0.005, 0.6, 0.24, 0.56, outline=0.012, bevel=0)
box('archframe', M['marble'], BX, BY - 0.122, S0 + 0.02, 0.36, 0.006, 0.44, outline=0, bevel=0)
box('archrecess', M['sandstoneLight'], BX, BY - 0.124, S0 + 0.04, 0.3, 0.006, 0.38, outline=0, bevel=0)
box('archdoor', M['door'], BX, BY - 0.126, S0 + 0.04, 0.12, 0.006, 0.16, outline=0, bevel=0)
lathe('archpoint', M['door'], ((0.06, 0), (0.004, 0.07)), S0 + 0.195, BX, BY - 0.126, segs=4, outline=0, smooth=False)
for s in (-1, 1):
    lathe(f'flanktower{s}', M['sandstoneLight'], ((0.05, 0), (0.045, 0.6)), S0 - 0.005, BX + s * 0.29, BY - 0.1, segs=8, outline=0.006, smooth=False)
    chhatri(f'flankchhatri{s}', BX + s * 0.29, BY - 0.1, S0 + 0.595, 0.045)
for j in range(7):
    chhatri(f'roofchhatri{j}', BX - 0.24 + j * 0.08, BY - 0.02, S0 + 0.555, 0.03)
chhatri('topchhatri', BX, BY + 0.05, S0 + 0.555, 0.06)

# ---------- the Panch Mahal ----------
PX, PY = 0.5, 0.35
z = G - 0.005
for t, (w, h) in enumerate(((0.5, 0.11), (0.4, 0.1), (0.3, 0.09), (0.2, 0.08), (0.11, 0.07))):
    box(f'floor{t}', M['sandstoneLight'], PX, PY, z, w + 0.04, w * 0.75 + 0.04, 0.02, outline=0.004, bevel=0)
    n = max(2, int(w / 0.07))
    for i in range(n):
        for jj in (0, 1):
            x = PX - w / 2 + i * w / (n - 1)
            y = PY - w * 0.375 + jj * w * 0.75
            rod(f'col{t}{i}{jj}', M['sandstone'], (x, y, z + 0.02), (x, y, z + h), 0.008, segs=5, outline=0.002)
    z += h
box('roofslab', M['sandstoneLight'], PX, PY, z, 0.15, 0.12, 0.02, outline=0.004, bevel=0)
chhatri('panchtop', PX, PY, z + 0.02, 0.05)

for k, (x, y) in enumerate(((-0.9, 0.3), (0.95, -0.25), (0.75, -0.55))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.008)

turn(before, -20)
render(G)
