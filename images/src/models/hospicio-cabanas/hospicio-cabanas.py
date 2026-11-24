# A cartoon Hospicio Cabañas for the country maps, built in the set's shared look (../toon.py): Tolsá's
# great neoclassical hospice in Guadalajara, home of Orozco's murals, its long low front of pale
# stone with the portico of columns and pediment in the middle, the courtyards behind, and the tall
# drum and dome with its lantern rising over the chapel, with the plaza and its fountains in front.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P hospicio-cabanas.py -- hospicio-cabanas-1024.png 1024 hospicio-cabanas.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8cfbc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#ead8b4', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#cbb68e'),
    'white': toon('white', '#f6f2ea', lift=0.22),
    'dome': toon('dome', '#d8d4cc', lift=0.2),
    'court': toon('court', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the long front and the wings round the courtyards ----------
FY = -0.05
W, H = 1.3, 0.18
box('front', M['stone'], 0.0, FY, G - 0.005, W, 0.14, H, outline=0.008, bevel=0)
for j in range(14):
    x = -W / 2 + 0.06 + j * (W - 0.12) / 13
    if abs(x) < 0.14:
        continue
    box(f'frontwin{j}', M['dark'], x, FY - 0.073, G + 0.05, 0.03, 0.006, 0.07, outline=0, bevel=0)
box('frontcornice', M['stoneDark'], 0.0, FY, G + H - 0.01, W + 0.02, 0.16, 0.02, outline=0.002, bevel=0)
for x in (-0.6, 0.6, 0.0):
    box(f'wing{x}', M['stone'], x, FY + 0.32, G - 0.005, 0.1, 0.5, H - 0.02, outline=0.006, bevel=0)
box('backrange', M['stone'], 0.0, FY + 0.6, G - 0.005, W - 0.1, 0.1, H - 0.02, outline=0.006, bevel=0)
for x in (-0.3, 0.3):
    loft(f'court{x}', M['court'], [[(x - 0.24, FY + 0.08, G - 0.004), (x + 0.24, FY + 0.08, G - 0.004), (x + 0.24, FY + 0.54, G - 0.004), (x - 0.24, FY + 0.54, G - 0.004)],
                                   [(x - 0.24, FY + 0.08, G + 0.006), (x + 0.24, FY + 0.08, G + 0.006), (x + 0.24, FY + 0.54, G + 0.006), (x - 0.24, FY + 0.54, G + 0.006)]], outline=0.001)
    ball(f'courttree{x}', M['tree'], x, FY + 0.31, G + 0.09, 0.07, outline=0.008)

# ---------- the portico in the middle ----------
box('porticoback', M['stone'], 0.0, FY - 0.08, G - 0.005, 0.28, 0.04, H + 0.05, outline=0.005, bevel=0)
box('porticodoor', M['dark'], 0.0, FY - 0.102, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
for j in range(6):
    rod(f'porticocol{j}', M['white'], (-0.115 + j * 0.046, FY - 0.13, G), (-0.115 + j * 0.046, FY - 0.13, G + H + 0.02), 0.011, segs=10, outline=0.002)
box('porticobeam', M['white'], 0.0, FY - 0.115, G + H + 0.02, 0.28, 0.07, 0.03, outline=0.003, bevel=0)
loft('pediment', M['white'], [[(-0.14, FY - 0.15, G + H + 0.05), (0.14, FY - 0.15, G + H + 0.05), (0.14, FY - 0.08, G + H + 0.05), (-0.14, FY - 0.08, G + H + 0.05)],
                              [(-0.004, FY - 0.15, G + H + 0.12), (0.004, FY - 0.15, G + H + 0.12), (0.004, FY - 0.08, G + H + 0.12), (-0.004, FY - 0.08, G + H + 0.12)]], outline=0.003)

# ---------- the chapel's drum and dome ----------
DX, DY = 0.0, FY + 0.32
box('chapel', M['stone'], DX, DY, G - 0.005, 0.24, 0.24, H + 0.06, outline=0.006, bevel=0)
lathe('drum', M['stone'], ((0.11, 0), (0.11, 0.16)), G + H + 0.05, DX, DY, segs=24, outline=0.005)
for k in range(12):
    a = 2 * math.pi * k / 12
    box(f'drumpilaster{k}', M['white'], DX + 0.112 * math.cos(a), DY + 0.112 * math.sin(a), G + H + 0.05, 0.014, 0.006, 0.16, rot_z=a + math.pi / 2, outline=0, bevel=0)
    if k in (8, 9, 10):
        b = a + math.pi / 12
        box(f'drumwin{k}', M['dark'], DX + 0.111 * math.cos(b), DY + 0.111 * math.sin(b), G + H + 0.09, 0.025, 0.006, 0.07, rot_z=b + math.pi / 2, outline=0, bevel=0)
lathe('drumcornice', M['white'], ((0.12, 0), (0.12, 0.02)), G + H + 0.2, DX, DY, segs=24, outline=0.002)
lathe('dome', M['dome'], ((0.12, 0), (0.11, 0.06), (0.08, 0.12), (0.04, 0.155), (0.0, 0.165)), G + H + 0.22, DX, DY, segs=24, outline=0.005)
lathe('lantern', M['white'], ((0.03, 0), (0.03, 0.06)), G + H + 0.37, DX, DY, segs=10, outline=0.002)
lathe('lanterncap', M['dome'], ((0.035, 0), (0.025, 0.025), (0.003, 0.06)), G + H + 0.43, DX, DY, segs=10, outline=0.002)

# ---------- the plaza's fountains and trees ----------
for k, x in enumerate((-0.45, 0.45)):
    lathe(f'fountain{k}', M['stoneDark'], ((0.09, 0), (0.09, 0.03), (0.075, 0.03)), G - 0.005, x, -0.55, segs=16, outline=0.003)
    lathe(f'fountainwater{k}', M['water'], ((0.078, 0), (0.078, 0.027)), G - 0.003, x, -0.55, segs=16, outline=0)
    rod(f'jet{k}', M['water'], (x, -0.55, G + 0.02), (x, -0.55, G + 0.1), 0.008, r2=0.002, segs=8, outline=0)
for k, (x, y) in enumerate(((-0.85, -0.5), (0.85, -0.5), (0.0, -0.85))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
