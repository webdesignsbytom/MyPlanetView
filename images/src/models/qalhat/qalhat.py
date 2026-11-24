# A cartoon Qalhat for the country maps, built in the set's shared look (../toon.py): the medieval
# port of the kings of Hormuz on the coast of Oman, which Ibn Battuta and Marco Polo saw: the
# mausoleum of Bibi Maryam, a square stone tomb with its broken dome and arched openings
# standing alone on the shore, the low ruins of the city walls and houses round it, the bare
# mountains behind and the sea in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P qalhat.py -- qalhat-1024.png 1024 qalhat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d2bc94', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'mountain': toon('mountain', '#a8927a', shadow_mul=(0.78, 0.76, 0.82)),
    'stone': toon('stone', '#c8b08a', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'stoneDark': toon('stoneDark', '#a8906c'),
    'water': toon('water', '#2a8ac0', lift=0.3),
    'dark': flat('dark', '#2e2420'),
    'shrub': toon('shrub', '#9aa860', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(680322)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('sea', M['water'], [strip(-1.31, -0.62, 1.32, G - 0.004), strip(-1.31, -0.62, 1.32, G + 0.008)], outline=0.002)
for k, (x, y, r, h) in enumerate(((-0.65, 0.95, 0.42, 0.5), (0.2, 1.05, 0.4, 0.58), (0.85, 0.7, 0.32, 0.4))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.5), (r * 0.25, h * 0.9), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    mt.visible_shadow = False

# ---------- Bibi Maryam's tomb ----------
BX, BY = 0.0, -0.05
W = 0.34
box('tomb', M['stone'], BX, BY, G - 0.005, W, W, 0.3, outline=0.008, bevel=0)
arch('tombarch', M['dark'], BX, BY - W / 2 - 0.003, G - 0.005, 0.12, 0.24)
arch('tombarchside', M['dark'], BX + W / 2 + 0.003, BY, G + 0.06, 0.08, 0.16, face='x')
for j in range(2):
    box(f'tombpanel{j}', M['stoneDark'], BX + (j - 0.5) * 0.24, BY - W / 2 - 0.002, G + 0.05, 0.05, 0.004, 0.18, outline=0, bevel=0)
box('tombcornice', M['stoneDark'], BX, BY, G + 0.295, W + 0.02, W + 0.02, 0.02, outline=0.002, bevel=0)
# the broken dome: a drum and half its shell
lathe('drum', M['stone'], ((0.14, 0), (0.14, 0.05)), G + 0.31, BX, BY, segs=24, outline=0.004)
pts = []
for k in range(9):
    a = k * math.pi / 16
    pts.append((0.14 * math.cos(a), 0.12 * math.sin(a)))
objs = set(bpy.data.objects)
lathe('domeshell', M['stone'], pts, G + 0.355, BX, BY, segs=24, outline=0.005)
bpy.context.view_layer.update()
dome = [o for o in set(bpy.data.objects) - objs][0]
import bmesh as _bm
me = dome.data
bm2 = _bm.new()
bm2.from_mesh(me)
cut = [v for v in bm2.verts if v.co.x - BX > 0.02 and v.co.z > G + 0.4]
_bm.ops.delete(bm2, geom=cut, context='VERTS')
bm2.to_mesh(me)
bm2.free()

# ---------- the ruined city round it ----------
for k in range(10):
    x, y = -0.9 + 1.8 * rng.random(), -0.5 + 0.9 * rng.random()
    if math.hypot(x - BX, y - BY) < 0.3 or math.hypot(x, y) > 0.95:
        continue
    box(f'ruin{k}a', M['stone'], x, y, G - 0.005, 0.12, 0.02, 0.03 + 0.04 * rng.random(), outline=0.001, bevel=0)
    box(f'ruin{k}b', M['stone'], x - 0.06, y + 0.05, G - 0.005, 0.02, 0.1, 0.03 + 0.04 * rng.random(), outline=0.001, bevel=0)
for k in range(7):
    x = -0.9 + k * 0.28
    box(f'citywall{k}', M['stoneDark'], x, 0.45 + 0.04 * (k % 2), G - 0.005, 0.24, 0.04, 0.06, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((0.6, -0.4), (-0.6, -0.45), (0.85, 0.2))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
