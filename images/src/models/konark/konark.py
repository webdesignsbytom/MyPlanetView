# A cartoon Konark Sun Temple for the country maps, built in the set's shared look (../toon.py): the
# temple built as the sun god's chariot, its great stepped pyramid hall on a high plinth carved with
# twelve pairs of stone wheels, the seven stone horses straining in front, and the lawns and palms
# round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P konark.py -- konark-1024.png 1024 konark.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#a88a6a', shadow_mul=(0.86, 0.82, 0.82), lift=0.05),
    'stoneDark': toon('stoneDark', '#8a6e54', shadow_mul=(0.86, 0.82, 0.82)),
    'stoneLight': toon('stoneLight', '#c0a480', shadow_mul=(0.86, 0.82, 0.82)),
    'door': flat('door', '#2e2420'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the chariot: plinth and wheels ----------
TX, TY = 0.1, 0.25
box('plinth', M['stoneDark'], TX, TY, G - 0.005, 0.95, 0.55, 0.16, outline=0.011, bevel=0)
for j in range(5):
    box(f'plinthband{j}', M['stoneLight'], TX, TY - 0.277, G + 0.02 + j * 0.03, 0.95, 0.006, 0.008, outline=0, bevel=0)
for s in (-1, 1):
    for j in range(6):
        x = TX - 0.38 + j * 0.15
        y = TY + s * 0.28
        cyl(f'wheel{s}{j}', M['stoneLight'], 0.065, 0.02, segs=20, outline=0.004, matrix=Matrix.Translation((x, y + (0.0 if s < 0 else -0.02), G + 0.075)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        for k in range(4):
            a = k * math.pi / 4
            bar(f'spoke{s}{j}{k}', M['stoneDark'], (x - 0.055 * math.cos(a), y - s * 0.012, G + 0.075 - 0.055 * math.sin(a)), (x + 0.055 * math.cos(a), y - s * 0.012, G + 0.075 + 0.055 * math.sin(a)), 0.008, outline=0)
P = G + 0.155

# ---------- the stepped pyramid hall ----------
box('hall', M['stone'], TX, TY, P - 0.005, 0.5, 0.42, 0.2, outline=0.01, bevel=0)
box('halldoor', M['door'], TX - 0.252, TY, P + 0.02, 0.006, 0.1, 0.14, outline=0, bevel=0)
z = P + 0.195
for t in range(3):
    for k in range(2):
        w = 0.56 - t * 0.14 - k * 0.04
        d = 0.46 - t * 0.12 - k * 0.035
        box(f'tier{t}{k}', M['stoneLight' if k == 0 else 'stone'], TX, TY, z, w, d, 0.04, outline=0.005, bevel=0)
        z += 0.04
    z += 0.01
lathe('amalaka', M['stoneLight'], ((0.08, 0), (0.1, 0.03), (0.08, 0.06)), z, TX, TY, segs=16, outline=0.004)
lathe('kalasha', M['stoneDark'], ((0.035, 0), (0.004, 0.08)), z + 0.06, TX, TY, segs=10, outline=0.003)
# the dance hall's platform in front (its roof long fallen)
box('natamandir', M['stoneDark'], TX - 0.6, TY, G - 0.005, 0.22, 0.26, 0.12, outline=0.007, bevel=0)

# ---------- the horses ----------
for k in range(4):
    hx, hy = TX - 0.55 + 0.03 * k, TY - 0.36 - 0.08 * (k % 2)
    b = ball(f'horse{k}', M['stone'], 0, 0, 0, 0.045, outline=0.005)
    b.scale = (1.5, 0.75, 0.8)
    b.location = (hx, hy, G + 0.1)
    for fx in (-0.04, 0.04):
        bar(f'horseleg{k}{fx}', M['stone'], (hx + fx, hy, G + 0.08), (hx + fx - 0.01, hy, G), 0.014, outline=0.002)
    bar(f'horseneck{k}', M['stone'], (hx - 0.05, hy, G + 0.11), (hx - 0.08, hy, G + 0.17), 0.025, outline=0.003)
    b = ball(f'horsehead{k}', M['stone'], 0, 0, 0, 0.022, outline=0.003)
    b.scale = (1.6, 0.8, 0.9)
    b.location = (hx - 0.1, hy, G + 0.17)
    box(f'horsebase{k}', M['stoneDark'], hx, hy, G - 0.005, 0.14, 0.07, 0.02, outline=0.003, bevel=0)

for k, (x, y) in enumerate(((-0.95, 0.25), (0.95, -0.25), (0.75, -0.6), (-0.7, 0.75))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
