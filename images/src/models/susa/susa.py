# A cartoon Susa for the country maps, built in the set's shared look (../toon.py): the ancient Elamite
# and Persian capital in Khuzestan, the shrine of the Tomb of Daniel with its tall white ribbed cone
# rising in tiers like a pine cone over its arcaded court, and behind it on the ancient mound the
# brick castle the French archaeologists built, with its battlements and tall tower; date palms by
# the river. Turned a little towards the camera.
# Run: blender -b --factory-startup -P susa.py -- susa-1024.png 1024 susa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a0', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'mound': toon('mound', '#c8b080', shadow_mul=(0.8, 0.78, 0.82)),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.8, 0.82, 0.9), lift=0.22),
    'cream': toon('cream', '#ecdcb8', lift=0.18),
    'tileBlue': toon('tileBlue', '#2e7aa8', lift=0.15),
    'brick': toon('brick', '#b88a5e', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'water': toon('water', '#4a9ab0', lift=0.3),
    'dark': flat('dark', '#2e2a2a'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the river along the left ----------
river = [(-1.25, -0.4), (-0.85, -0.95), (-0.72, -0.9), (-1.1, -0.3)]
loft('river', M['water'], [[(x, y, G - 0.004) for x, y in river], [(x, y, G + 0.008) for x, y in river]], outline=0.002)

# ---------- the castle on its mound ----------
KX, KY = 0.35, 0.6
md = lathe('mound', M['mound'], ((0.55, 0), (0.45, 0.08), (0.36, 0.13), (0.0, 0.14)), G - 0.01, KX, KY, segs=32, outline=0.006)
md.visible_shadow = False
T = G + 0.13
box('castle', M['brick'], KX, KY, T - 0.005, 0.5, 0.34, 0.13, outline=0.006, bevel=0)
for k in range(12):
    box(f'merlon{k}', M['brick'], KX - 0.23 + k * 0.042, KY - 0.165, T + 0.12, 0.024, 0.02, 0.025, outline=0.001, bevel=0)
box('keep', M['brick'], KX + 0.15, KY + 0.05, T - 0.005, 0.12, 0.12, 0.3, outline=0.005, bevel=0)
for k in range(3):
    box(f'keepmerlon{k}', M['brick'], KX + 0.11 + k * 0.04, KY - 0.012, T + 0.29, 0.024, 0.02, 0.025, outline=0.001, bevel=0)
for s in (-1, 1):
    lathe(f'castleturret{s}', M['brick'], ((0.045, 0), (0.045, 0.18)), T - 0.005, KX + s * 0.25, KY - 0.17, segs=12, outline=0.003)
box('castlegate', M['dark'], KX - 0.08, KY - 0.173, T - 0.005, 0.045, 0.006, 0.07, outline=0, bevel=0)

# ---------- the Tomb of Daniel ----------
DX, DY = -0.25, -0.15
box('shrine', M['cream'], DX, DY, G - 0.005, 0.42, 0.34, 0.15, outline=0.006, bevel=0)
for j in range(5):
    x = DX - 0.16 + j * 0.08
    box(f'arcade{j}', M['dark'], x, DY - 0.173, G - 0.005, 0.045, 0.006, 0.08, outline=0, bevel=0)
    loft(f'arcadepoint{j}', M['dark'], [[(x - 0.0225, DY - 0.176, G + 0.075), (x + 0.0225, DY - 0.176, G + 0.075), (x + 0.001, DY - 0.176, G + 0.105), (x - 0.001, DY - 0.176, G + 0.105)],
                                        [(x - 0.0225, DY - 0.17, G + 0.075), (x + 0.0225, DY - 0.17, G + 0.075), (x + 0.001, DY - 0.17, G + 0.105), (x - 0.001, DY - 0.17, G + 0.105)]], outline=0)
box('tileband', M['tileBlue'], DX, DY, G + 0.12, 0.424, 0.344, 0.02, outline=0.001, bevel=0)
box('drumbase', M['white'], DX, DY, G + 0.145, 0.2, 0.2, 0.06, outline=0.004, bevel=0)
# the ribbed cone in its tiers
TIERS = 11
z = G + 0.2
for k in range(TIERS):
    r0 = 0.1 * (1 - k / (TIERS + 1)) + 0.012
    h = 0.04
    lathe(f'cone{k}', M['white'], ((r0, 0), (r0 * 0.96, h * 0.6), (r0 * 0.86, h)), z, DX, DY, segs=16, outline=0.003, smooth=False)
    z += h * 0.92
lathe('conetop', M['white'], ((0.018, 0), (0.003, 0.05)), z, DX, DY, segs=10, outline=0.002, smooth=False)
rod('finial', M['tileBlue'], (DX, DY, z + 0.04), (DX, DY, z + 0.09), 0.004, segs=4, outline=0)

for k, (x, y) in enumerate(((-0.85, -0.05), (-0.6, -0.6), (0.45, -0.55), (0.8, -0.15), (-0.7, 0.45))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.02 + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.29)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
