# A cartoon Golden Temple for the country maps, built in the set's shared look (../toon.py):
# Harmandir Sahib in Amritsar, its gilded temple with the fluted lotus dome and little domed kiosks
# standing in the middle of the Amrit Sarovar, the white marble causeway to the Darshani Deori
# gateway, and the white buildings and walkway round the pool. Turned a little towards the camera.
# Run: blender -b --factory-startup -P golden-temple.py -- golden-temple-1024.png 1024 golden-temple.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'marble': toon('marble', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.12),
    'inlay': toon('inlay', '#c8b8a0'),
    'pool': toon('pool', '#3a8a9a', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'gold': toon('gold', '#f0b828', shadow_mul=(0.9, 0.78, 0.6), lift=0.35),
    'goldDark': toon('goldDark', '#d8961e', shadow_mul=(0.9, 0.78, 0.6), lift=0.25),
    'window': flat('window', '#5a3a1e'),
    'door': flat('door', '#3a2a24'),
})

G = tile(M['marble'])
before = set(bpy.data.objects)


def gold_dome(name, x, y, z, r, flutes=12):
    lathe(name, M['gold'], ((r, 0), (r * 1.05, r * 0.4), (r * 0.85, r * 0.85), (r * 0.4, r * 1.15), (0.004, r * 1.5)), z, x, y, segs=flutes * 2, outline=0.006, smooth=False)
    rod(f'{name}finial', M['goldDark'], (x, y, z + r * 1.45), (x, y, z + r * 1.45 + max(0.04, r * 0.5)), 0.006, segs=5, outline=0)


# ---------- the pool and its walkway ----------
box('walkway', M['inlay'], 0.0, 0.0, G - 0.004, 1.9, 1.5, 0.01, outline=0.004, bevel=0)
box('pool', M['pool'], 0.0, 0.0, G - 0.003, 1.6, 1.2, 0.016, outline=0.004, bevel=0)

# ---------- the causeway and the temple ----------
box('causeway', M['marble'], -0.42, 0.0, G - 0.002, 0.7, 0.14, 0.04, outline=0.005, bevel=0)
for j in range(8):
    rod(f'lamp{j}', M['goldDark'], (-0.72 + j * 0.08, -0.07, G + 0.04), (-0.72 + j * 0.08, -0.07, G + 0.1), 0.006, segs=5, outline=0)
TX, TY = 0.15, 0.0
box('templebase', M['marble'], TX, TY, G - 0.002, 0.42, 0.42, 0.08, outline=0.008, bevel=0)
box('temple', M['gold'], TX, TY, G + 0.075, 0.34, 0.34, 0.22, outline=0.01, bevel=0)
for s in (-1, 1):
    for j in range(3):
        box(f'templewin{s}{j}', M['window'], TX - 0.1 + j * 0.1, TY - 0.172, G + 0.11 + (s + 1) * 0.045, 0.045, 0.006, 0.06, outline=0, bevel=0)
box('templecornice', M['goldDark'], TX, TY, G + 0.29, 0.38, 0.38, 0.025, outline=0.005, bevel=0)
box('templeupper', M['gold'], TX, TY, G + 0.31, 0.2, 0.2, 0.08, outline=0.008, bevel=0)
gold_dome('maindome', TX, TY, G + 0.385, 0.12)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = TX + sx * 0.16, TY + sy * 0.16
        lathe(f'kiosk{sx}{sy}', M['gold'], ((0.035, 0), (0.035, 0.05)), G + 0.31, x, y, segs=8, outline=0.004, smooth=False)
        gold_dome(f'kioskdome{sx}{sy}', x, y, G + 0.355, 0.035, flutes=8)

# ---------- the Darshani Deori gateway and the buildings round the pool ----------
DX, DY = -0.88, 0.0
box('gateway', M['marble'], DX, DY, G - 0.005, 0.16, 0.36, 0.26, outline=0.009, bevel=0)
box('gatewayarch', M['door'], DX + 0.081, DY, G - 0.005, 0.006, 0.1, 0.16, outline=0, bevel=0)
box('gatewaygold', M['gold'], DX, DY, G + 0.25, 0.18, 0.3, 0.06, outline=0.006, bevel=0)
gold_dome('gatewaydome', DX, DY, G + 0.305, 0.06, flutes=8)
for k, (x, y, w, d) in enumerate(((0.0, 0.9, 1.7, 0.14), (0.0, -0.88, 1.2, 0.12), (0.98, 0.0, 0.14, 1.3))):
    box(f'surround{k}', M['marble'], x, y, G - 0.005, w, d, 0.16, outline=0.008, bevel=0)
    n = int(max(w, d) / 0.14)
    for j in range(n):
        if w > d:
            box(f'surroundarch{k}{j}', M['inlay'], x - w / 2 + 0.07 + j * 0.14, y - d / 2 - 0.004, G + 0.03, 0.06, 0.006, 0.09, outline=0, bevel=0)
            if j % 3 == 1:
                gold_dome(f'surrounddome{k}{j}', x - w / 2 + 0.07 + j * 0.14, y, G + 0.155, 0.03, flutes=6)
        else:
            box(f'surroundarch{k}{j}', M['inlay'], x - w / 2 - 0.004, y - d / 2 + 0.07 + j * 0.14, G + 0.03, 0.006, 0.06, 0.09, outline=0, bevel=0)

turn(before, -20)
render(G)
