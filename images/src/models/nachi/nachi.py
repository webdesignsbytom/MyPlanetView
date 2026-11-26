# A cartoon Nachi for the country maps, built in the set's shared look (../toon.py): the shrines
# of the Kumano Kodō pilgrimage in the Kii mountains of Japan, the bright red three-storey
# pagoda of Seiganto-ji standing among the cedars in front of Nachi Falls, Japan's tallest
# single drop, plunging down the forested cliff behind, with the stone lanterns and the steps
# up to the temple. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nachi.py -- nachi-1024.png 1024 nachi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7ab450', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'cliff': toon('cliff', '#4a7a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#8a8680'),
    'falls': toon('falls', '#e8f4fa', shadow_mul=(0.86, 0.9, 0.96), lift=0.35),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'red': toon('red', '#d0402e', shadow_mul=(0.8, 0.7, 0.72), lift=0.18),
    'white': toon('white', '#f4f0e6', lift=0.22),
    'roof': toon('roof', '#3a3a42'),
    'gold': toon('gold2', '#e8b848', shadow_mul=(0.78, 0.66, 0.6), lift=0.35),
    'stone': toon('stone', '#b8b0a0'),
    'cedar': toon('cedar', '#2e5e36', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the forested cliff and the falls ----------
cl = loft('cliff', M['cliff'], [strip(0.35, 1.31, 1.32, G - 0.01), strip(0.5, 1.31, 1.32, G + 0.6)], outline=0.008)
cl.visible_shadow = False
FX = 0.35
loft('falls', M['falls'], [[(FX - 0.06, 0.32, G), (FX + 0.06, 0.32, G), (FX + 0.06, 0.36, G), (FX - 0.06, 0.36, G)],
                           [(FX - 0.05, 0.47, G + 0.6), (FX + 0.05, 0.47, G + 0.6), (FX + 0.05, 0.51, G + 0.6), (FX - 0.05, 0.51, G + 0.6)]], outline=0.003)
lathe('plungepool', M['water'], ((0.14, 0), (0.14, 0.01)), G - 0.004, FX, 0.25, segs=20, outline=0.002)
for k in range(4):
    ball(f'mist{k}', M['falls'], FX - 0.08 + k * 0.055, 0.27, G + 0.03, 0.035, outline=0)

# ---------- the pagoda ----------
PX, PY = -0.3, -0.05
z = G - 0.005
for k, (w, h) in enumerate(((0.24, 0.13), (0.2, 0.11), (0.16, 0.1))):
    box(f'storey{k}', M['red'], PX, PY, z, w, w, h, outline=0.005, bevel=0)
    for s in (-1, 1):
        box(f'window{k}{s}', M['white'], PX + s * w * 0.25, PY - w / 2 - 0.003, z + h * 0.3, w * 0.2, 0.006, h * 0.4, outline=0, bevel=0)
    rr = [[(PX - w / 2 - 0.06, PY - w / 2 - 0.06, z + h + 0.015), (PX + w / 2 + 0.06, PY - w / 2 - 0.06, z + h + 0.015), (PX + w / 2 + 0.06, PY + w / 2 + 0.06, z + h + 0.015), (PX - w / 2 - 0.06, PY + w / 2 + 0.06, z + h + 0.015)],
          [(PX - w / 2, PY - w / 2, z + h + 0.04), (PX + w / 2, PY - w / 2, z + h + 0.04), (PX + w / 2, PY + w / 2, z + h + 0.04), (PX - w / 2, PY + w / 2, z + h + 0.04)]]
    loft(f'eave{k}', M['roof'], rr, outline=0.004)
    z += h + 0.04
hip('toproof', M['roof'], PX, PY, z, 0.18, 0.18, 0.08, over=0.03)
rod('spire', M['gold'], (PX, PY, z + 0.07), (PX, PY, z + 0.24), 0.008, segs=8, outline=0.001)
for k in range(5):
    lathe(f'ring{k}', M['gold'], ((0.018, 0), (0.018, 0.01)), z + 0.1 + k * 0.025, PX, PY, segs=10, outline=0)

# ---------- the stone lanterns, steps and cedars ----------
for k, x in enumerate((-0.6, 0.0)):
    lathe(f'lantern{k}', M['stone'], ((0.03, 0), (0.015, 0.06), (0.03, 0.065), (0.03, 0.1), (0.04, 0.11), (0.0, 0.14)), G - 0.005, x, -0.45, segs=6, outline=0.002, smooth=False)
for k in range(6):
    box(f'step{k}', M['stone'], -0.3, -0.75 + k * 0.04, G - 0.005, 0.16, 0.04, 0.01 + 0.012 * k, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.8, -0.3), (-0.75, 0.2), (0.15, -0.35), (0.8, -0.2), (0.65, -0.65), (-0.95, -0.65))):
    lathe(f'cedar{k}', M['cedar'], ((0.08, 0), (0.0, 0.42)), G + 0.05, x, y, segs=10, outline=0.005, smooth=False)
    rod(f'cedartrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.06), 0.014, segs=6, outline=0.001)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
