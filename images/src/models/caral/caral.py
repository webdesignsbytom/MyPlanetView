# A cartoon Caral for the country maps, built in the set's shared look (../toon.py): the oldest city
# of the Americas, in the desert valley of the Supe in Peru, five thousand years old: the great
# stepped pyramid of stone with its stair down the middle to the sunken circular plaza before
# it, the smaller pyramids round the main square, and the green river valley beyond the bare
# desert terrace. Turned a little towards the camera.
# Run: blender -b --factory-startup -P caral.py -- caral-1024.png 1024 caral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#dcc498', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'stone': toon('stone', '#c8ac84', shadow_mul=(0.8, 0.76, 0.8), lift=0.14),
    'stoneLight': toon('stoneLight', '#dcc39c', lift=0.16),
    'green': toon('green', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)



def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the green valley at the back ----------
loft('valley', M['green'], [strip(0.78, 1.36, 1.38, G - 0.006), strip(0.78, 1.36, 1.38, G + 0.004)], outline=0.002)
for k, x in enumerate((-0.7, -0.35, 0.0, 0.35, 0.7)):
    tree(f'tree{k}', x, 1.02 + 0.06 * (k % 2), r=0.08, h=0.1)


def pyramid_tiers(name, x, y, tiers, mat):
    z = G - 0.005
    for k, (w, d, h) in enumerate(tiers):
        box(f'{name}{k}', mat if k % 2 == 0 else M['stoneLight'], x, y, z, w, d, h, outline=0.005, bevel=0)
        z += h
    return z


# ---------- the Pyramid of the Greater Temple ----------
PX, PY = 0.0, 0.25
top = pyramid_tiers('great', PX, PY, ((0.8, 0.56, 0.08), (0.66, 0.46, 0.08), (0.52, 0.36, 0.08), (0.38, 0.26, 0.07), (0.26, 0.18, 0.06)), M['stone'])
for k in range(14):
    box(f'stair{k}', M['stoneLight'], PX, PY - 0.3 - 0.04 + k * 0.022, G - 0.005, 0.1, 0.04, 0.026 * (k + 1), outline=0.001, bevel=0)
box('topshrine', M['stone'], PX, PY + 0.03, top, 0.14, 0.1, 0.05, outline=0.003, bevel=0)
# the sunken circular plaza
SX, SY = PX, PY - 0.55
for k in range(3):
    lathe(f'plazaring{k}', M['stoneLight'] if k % 2 else M['stone'], ((0.2 - k * 0.04, 0), (0.2 - k * 0.04, 0.012 + 0.006 * (2 - k))), G - 0.005 - k * 0.0, SX, SY, segs=32, outline=0.002, smooth=False)
lathe('plazafloor', M['sand'], ((0.08, 0), (0.08, 0.004)), G - 0.005, SX, SY, segs=24, outline=0)

# ---------- the smaller pyramids round the square ----------
pyramid_tiers('east', 0.65, -0.2, ((0.32, 0.28, 0.07), (0.24, 0.2, 0.06), (0.16, 0.13, 0.05)), M['stone'])
pyramid_tiers('west', -0.65, -0.15, ((0.3, 0.3, 0.06), (0.22, 0.22, 0.06), (0.14, 0.14, 0.04)), M['stone'])
pyramid_tiers('amph', -0.45, -0.65, ((0.22, 0.2, 0.05), (0.14, 0.13, 0.04)), M['stone'])

bpy.context.view_layer.update()
turn(before, -20)
render(G)
