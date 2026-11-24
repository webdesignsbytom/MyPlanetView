# A cartoon Cahokia Mounds for the country maps, built in the set's shared look (../toon.py): the great
# Mississippian city by the Mississippi, Monks Mound, the largest earthwork in the Americas, rising
# in its grassy terraces with the long stair up its front, the little temple on its summit as it
# once stood, the smaller conical and platform mounds round the Grand Plaza, and the reconstructed
# Woodhenge, a circle of tall red cedar posts. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cahokia.py -- cahokia-1024.png 1024 cahokia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#88bc60', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mound': toon('mound', '#6eaa4c', shadow_mul=(0.7, 0.78, 0.8)),
    'plaza': toon('plaza', '#a8c878', lift=0.18),
    'stair': toon('stair', '#c8b48a', lift=0.15),
    'post': toon('post', '#a8603e'),
    'thatch': toon('thatch', '#c8a860'),
    'wood': toon('wood', '#8a5a3e'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def terrace(name, x0, x1, y0, y1, z0, h, inset):
    t = loft(name, M['mound'], [[(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)],
                                [(x0 + inset, y0 + inset, z0 + h), (x1 - inset, y0 + inset, z0 + h), (x1 - inset, y1 - inset, z0 + h), (x0 + inset, y1 - inset, z0 + h)]], outline=0.007)
    t.visible_shadow = False
    return t


# ---------- the Grand Plaza ----------
loft('plaza', M['plaza'], [[(-0.6, -0.85, G - 0.004), (0.25, -0.85, G - 0.004), (0.25, -0.3, G - 0.004), (-0.6, -0.3, G - 0.004)],
                           [(-0.6, -0.85, G + 0.006), (0.25, -0.85, G + 0.006), (0.25, -0.3, G + 0.006), (-0.6, -0.3, G + 0.006)]], outline=0.001)

# ---------- Monks Mound in its terraces ----------
MX, MY = -0.15, 0.25
terrace('mound1', MX - 0.5, MX + 0.42, MY - 0.42, MY + 0.48, G - 0.01, 0.14, 0.06)
terrace('mound2', MX - 0.4, MX + 0.3, MY - 0.1, MY + 0.38, G + 0.125, 0.12, 0.05)
terrace('mound3', MX - 0.28, MX + 0.12, MY + 0.0, MY + 0.3, G + 0.24, 0.1, 0.04)
TOP = G + 0.335
# the long stair up its front
for i in range(14):
    t = (i + 1) / 14
    y = MY - 0.44 + i * 0.03
    box(f'stair{i}', M['stair'], MX - 0.08, y, G - 0.005, 0.07, 0.032, (TOP - G) * t * 0.72 + 0.005, outline=0.001, bevel=0)
# the temple on the summit
box('temple', M['wood'], MX - 0.08, MY + 0.15, TOP - 0.005, 0.2, 0.14, 0.08, outline=0.004, bevel=0)
loft('templeroof', M['thatch'], [[(MX - 0.19, MY + 0.07, TOP + 0.07), (MX + 0.03, MY + 0.07, TOP + 0.07), (MX + 0.03, MY + 0.23, TOP + 0.07), (MX - 0.19, MY + 0.23, TOP + 0.07)],
                                 [(MX - 0.12, MY + 0.146, TOP + 0.16), (MX - 0.04, MY + 0.146, TOP + 0.16), (MX - 0.04, MY + 0.154, TOP + 0.16), (MX - 0.12, MY + 0.154, TOP + 0.16)]], outline=0.004)

# ---------- the smaller mounds round the plaza ----------
for k, (x, y, r, h) in enumerate(((-0.8, -0.45, 0.16, 0.1), (0.5, -0.75, 0.13, 0.08), (-0.35, -1.0, 0.14, 0.07))):
    m = lathe(f'conical{k}', M['mound'], ((r, 0), (r * 0.6, h * 0.7), (0.0, h)), G - 0.01, x, y, segs=24, outline=0.005)
    m.visible_shadow = False

# ---------- Woodhenge ----------
WX, WY = 0.65, -0.1
for k in range(20):
    a = 2 * math.pi * k / 20
    rod(f'post{k}', M['post'], (WX + 0.26 * math.cos(a), WY + 0.26 * math.sin(a), G - 0.005), (WX + 0.26 * math.cos(a), WY + 0.26 * math.sin(a), G + 0.22), 0.011, segs=8, outline=0.002)
rod('centrepost', M['post'], (WX, WY, G - 0.005), (WX, WY, G + 0.26), 0.014, segs=8, outline=0.002)

for k, (x, y) in enumerate(((0.55, 0.65), (0.85, 0.4), (-0.85, 0.55), (-0.95, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
