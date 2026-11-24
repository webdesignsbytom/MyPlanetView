# A cartoon Potosí for the country maps, built in the set's shared look (../toon.py): the silver
# city of Bolivia high in the Andes, the great red cone of Cerro Rico rising behind, the stone
# Casa de la Moneda, the royal mint, with its arched gate and balconies, the cathedral's white
# front between its towers, and the colourful houses with wooden balconies along the steep
# streets. Turned a little towards the camera.
# Run: blender -b --factory-startup -P potosi.py -- potosi-1024.png 1024 potosi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b48e', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'hill': toon('hill', '#b0623e', shadow_mul=(0.78, 0.72, 0.78)),
    'hillLight': toon('hillLight', '#c8865a'),
    'stone': toon('stone', '#c8b08c', shadow_mul=(0.8, 0.78, 0.82), lift=0.15),
    'white': toon('white', '#f2eee4', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'roof': toon('roof', '#b85a36'),
    'ochre': toon('ochre', '#e2b25a', lift=0.18),
    'blue': toon('blue', '#7ea8d0', lift=0.18),
    'pink': toon('pink', '#e09a8a', lift=0.18),
    'wood': toon('wood', '#5e3c24'),
    'dark': flat('dark', '#2e2420'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- Cerro Rico ----------
hill = lathe('cerro', M['hill'], ((0.52, 0), (0.4, 0.22), (0.24, 0.46), (0.08, 0.62), (0.0, 0.66)), G - 0.01, 0.15, 0.78, segs=24, outline=0.007)
hill.visible_shadow = False
for k, (a, z) in enumerate(((0.4, 0.1), (2.2, 0.22), (1.2, 0.35))):
    r = 0.5 - 0.6 * z
    ball(f'spoil{k}', M['hillLight'], 0.15 + r * math.cos(a + 3.6), 0.78 + r * math.sin(a + 3.6), G + z, 0.05, outline=0.004)

# ---------- the Casa de la Moneda ----------
MX, MY = -0.35, 0.0
box('moneda', M['stone'], MX, MY, G - 0.005, 0.66, 0.34, 0.2, outline=0.007, bevel=0)
hip('monedaroof', M['roof'], MX, MY, G + 0.195, 0.66, 0.34, 0.06, over=0.01)
box('monedagate', M['stone'], MX, MY - 0.17, G - 0.005, 0.18, 0.04, 0.27, outline=0.005, bevel=0)
arch('monedadoor', M['dark'], MX, MY - 0.192, G - 0.005, 0.08, 0.16)
box('monedacrest', M['white'], MX, MY - 0.192, G + 0.18, 0.06, 0.006, 0.06, outline=0.001, bevel=0)
for k in range(6):
    x = MX - 0.29 + k * 0.116
    if abs(x - MX) < 0.1:
        continue
    box(f'monedawin{k}', M['dark'], x, MY - 0.172, G + 0.04, 0.035, 0.006, 0.05, outline=0, bevel=0)
    box(f'monedabalcony{k}', M['wood'], x, MY - 0.185, G + 0.11, 0.06, 0.025, 0.055, outline=0.002, bevel=0)

# ---------- the cathedral ----------
CX, CY = 0.42, 0.08
box('cnave', M['white'], CX, CY + 0.22, G - 0.005, 0.3, 0.4, 0.26, outline=0.006, bevel=0)
gable('cnaveroof', M['roof'], CX, CY + 0.22, G + 0.255, 0.3, 0.4, 0.08)
lathe('cdome', M['white'], [(0.08 * math.cos(a), 0.08 * math.sin(a)) for a in [k * math.pi / 16 for k in range(9)]], G + 0.3, CX, CY + 0.3, segs=20, outline=0.004)
box('cfront', M['white'], CX, CY, G - 0.005, 0.3, 0.05, 0.32, outline=0.006, bevel=0)
gable('cpediment', M['white'], CX, CY, G + 0.315, 0.26, 0.05, 0.06)
arch('cdoor', M['dark'], CX, CY - 0.027, G - 0.005, 0.06, 0.13)
arch('cwindow', M['dark'], CX, CY - 0.027, G + 0.19, 0.04, 0.07)
for s in (-1, 1):
    TX = CX + s * 0.2
    box(f'ctower{s}', M['white'], TX, CY, G - 0.005, 0.11, 0.11, 0.48, outline=0.006, bevel=0)
    box(f'ctowerband{s}', M['stone'], TX, CY, G + 0.3, 0.12, 0.12, 0.018, outline=0.001, bevel=0)
    arch(f'cbelfry{s}', M['dark'], TX, CY - 0.058, G + 0.33, 0.045, 0.08)
    lathe(f'ccupola{s}', M['white'], [(0.05 * math.cos(a), 0.06 * math.sin(a)) for a in [k * math.pi / 12 for k in range(7)]], G + 0.475, TX, CY, segs=8, outline=0.003, smooth=False)

# ---------- the colourful houses ----------
rng = random.Random(35045)
x = -0.85
for k, mat in enumerate((M['ochre'], M['blue'], M['pink'], M['white'], M['ochre'], M['blue'], M['pink'])):
    w = 0.18 + 0.04 * rng.random()
    h = 0.14 + 0.06 * rng.random()
    hx, hy = x + w / 2, -0.58 + 0.04 * (k % 2)
    if hx > 0.75:
        break
    box(f'house{k}', mat, hx, hy, G - 0.005, w, 0.22, h, outline=0.004, bevel=0)
    gable(f'houseroof{k}', M['roof'], hx, hy, G + h - 0.005, w, 0.22, 0.06, ridge_x=True, over=0.012)
    box(f'housedoor{k}', M['wood'], hx - w * 0.2, hy - 0.112, G - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)
    box(f'housebalcony{k}', M['wood'], hx + w * 0.15, hy - 0.125, G + h - 0.08, w * 0.45, 0.03, 0.05, outline=0.002, bevel=0)
    x += w + 0.015

bpy.context.view_layer.update()
turn(before, -20)
render(G)
