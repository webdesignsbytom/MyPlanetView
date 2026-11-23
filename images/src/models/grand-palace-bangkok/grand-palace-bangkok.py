# A cartoon Grand Palace for the country maps, built in the set's shared look (../toon.py): Bangkok's
# palace and Wat Phra Kaew, the golden bell-shaped Phra Si Rattana Chedi, the Phra Mondop's tall
# gilded spire, the ordination hall's stacked roofs of orange and green tiles with gold finials, all
# inside the white crenellated wall. Turned a little towards the camera.
# Run: blender -b --factory-startup -P grand-palace-bangkok.py -- grand-palace-bangkok-1024.png 1024 grand-palace-bangkok.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e8e0d0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.12),
    'gold': toon('gold', '#f0c030', shadow_mul=(0.9, 0.78, 0.6), lift=0.35),
    'goldDark': toon('goldDark', '#d89a20', shadow_mul=(0.9, 0.78, 0.6), lift=0.25),
    'orange': toon('roofOrange', '#e8702c'),
    'green': toon('roofGreen', '#2f8a5a'),
    'red': toon('red', '#b8302a'),
    'door': flat('door', '#3a2a24'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the wall ----------
for s in (-1, 1):
    box(f'sidewall{s}', M['white'], s * 1.0, 0.1, G - 0.005, 0.05, 1.3, 0.12, outline=0.006, bevel=0)
box('backwall', M['white'], 0.0, 0.75, G - 0.005, 2.0, 0.05, 0.12, outline=0.006, bevel=0)
for s in (-1, 1):
    box(f'frontwall{s}', M['white'], s * 0.62, -0.55, G - 0.005, 0.76, 0.05, 0.12, outline=0.006, bevel=0)
for k in range(18):
    x = -0.95 + k * 0.112
    if abs(x) > 0.24:
        lathe(f'crenel{k}', M['white'], ((0.018, 0), (0.016, 0.03), (0.004, 0.05)), G + 0.115, x, -0.55, segs=8, outline=0.002)
box('gatehouse', M['white'], 0.0, -0.55, G - 0.005, 0.2, 0.08, 0.2, outline=0.006, bevel=0)
box('gatedoor', M['door'], 0.0, -0.592, G - 0.005, 0.08, 0.006, 0.12, outline=0, bevel=0)
lathe('gatespire', M['gold'], ((0.05, 0), (0.004, 0.16)), G + 0.195, 0.0, -0.55, segs=8, outline=0.004, smooth=False)

# ---------- the golden chedi ----------
CX, CY = -0.55, 0.3
for j in range(3):
    box(f'chedistep{j}', M['white'], CX, CY, G - 0.005 + j * 0.04, 0.42 - j * 0.08, 0.42 - j * 0.08, 0.045, outline=0.006, bevel=0)
lathe('chedi', M['gold'], ((0.13, 0), (0.15, 0.04), (0.15, 0.08), (0.13, 0.16), (0.08, 0.23), (0.05, 0.27)), G + 0.125, CX, CY, segs=24, outline=0.009)
lathe('chedispire', M['goldDark'], ((0.05, 0), (0.045, 0.05), (0.03, 0.1), (0.02, 0.2), (0.004, 0.36)), G + 0.39, CX, CY, segs=16, outline=0.005)
for j in range(5):
    lathe(f'chediring{j}', M['gold'], ((0.035 - j * 0.004, 0), (0.035 - j * 0.004, 0.012)), G + 0.46 + j * 0.035, CX, CY, segs=16, outline=0)

# ---------- the Phra Mondop's spire ----------
PX, PY = 0.0, 0.38
box('mondopbase', M['white'], PX, PY, G - 0.005, 0.3, 0.3, 0.08, outline=0.007, bevel=0)
box('mondop', M['green'], PX, PY, G + 0.075, 0.22, 0.22, 0.16, outline=0.008, bevel=0)
for j in range(4):
    box(f'mondopdoor{j}', M['gold'], PX - 0.06 + j * 0.04, PY - 0.111, G + 0.09, 0.025, 0.006, 0.12, outline=0, bevel=0)
for j in range(6):
    w = 0.25 - j * 0.035
    box(f'mondoptier{j}', M['gold' if j % 2 else 'goldDark'], PX, PY, G + 0.23 + j * 0.05, w, w, 0.05, outline=0.004, bevel=0)
lathe('mondopspire', M['gold'], ((0.035, 0), (0.025, 0.12), (0.004, 0.32)), G + 0.53, PX, PY, segs=12, outline=0.004)

# ---------- the ordination hall ----------
HX, HY = 0.55, 0.15
box('hall', M['white'], HX, HY, G - 0.005, 0.32, 0.56, 0.18, outline=0.009, bevel=0)
for j in range(4):
    rod(f'hallcol{j}', M['white'], (HX - 0.12 + j * 0.08, HY - 0.3, G), (HX - 0.12 + j * 0.08, HY - 0.3, G + 0.17), 0.012, segs=8, outline=0.003)
box('halldoor', M['gold'], HX, HY - 0.282, G - 0.005, 0.08, 0.006, 0.13, outline=0, bevel=0)
for t, (w, d, z, h, mat) in enumerate(((0.44, 0.7, 0.17, 0.1, 'orange'), (0.34, 0.62, 0.24, 0.1, 'green'), (0.24, 0.54, 0.31, 0.12, 'orange'))):
    loft(f'hallroof{t}', M[mat], [[(HX - w / 2, HY - d / 2, G + z), (HX + w / 2, HY - d / 2, G + z), (HX + w / 2, HY + d / 2, G + z), (HX - w / 2, HY + d / 2, G + z)],
                                  [(HX - 0.004, HY - d / 2, G + z + h), (HX + 0.004, HY - d / 2, G + z + h), (HX + 0.004, HY + d / 2, G + z + h), (HX - 0.004, HY + d / 2, G + z + h)]], outline=0.007)
    for s in (-1, 1):
        bar(f'hallbarge{t}{s}', M['gold'], (HX + s * w / 2, HY - d / 2 - 0.006, G + z), (HX, HY - d / 2 - 0.006, G + z + h), 0.015, outline=0.002)
    lathe(f'chofa{t}', M['gold'], ((0.012, 0), (0.004, 0.07)), G + z + h - 0.01, HX, HY - d / 2, segs=4, outline=0.002, smooth=False)

# ---------- trees ----------
for k, (x, y) in enumerate(((-0.85, -0.3), (0.85, -0.35), (-0.25, -0.25), (0.3, -0.3))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.012, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.07, outline=0.01)

turn(before, -20)
render(G)
