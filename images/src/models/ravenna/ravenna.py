# A cartoon Ravenna for the country maps, built in the set's shared look (../toon.py): the Basilica
# of San Vitale, its plain brick octagon rising in two stages to the tiled roof over its dome, the
# apse and the narthex, the round brick bell tower (campanile) of Sant'Apollinare beside it with its
# rows of arched windows, the little Mausoleum of Galla Placidia, and the cloister's lawn and
# cypresses. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ravenna.py -- ravenna-1024.png 1024 ravenna.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d8ccb4', lift=0.15),
    'brick': toon('brick', '#c4805a', shadow_mul=(0.86, 0.8, 0.76), lift=0.08),
    'brickDark': toon('brickDark', '#a8684a'),
    'roof': toon('roof', '#b8603e'),
    'dark': flat('dark', '#2e2622'),
    'cypress': toon('cypress', '#2f5a34', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
box('square', M['paving'], 0, -0.1, G - 0.004, 1.4, 0.7, 0.01, outline=0.001, bevel=0)

# ---------- San Vitale ----------
VX, VY = -0.15, 0.15
lathe('octagon1', M['brick'], ((0.34, 0), (0.34, 0.24)), G - 0.005, VX, VY, segs=8, outline=0.008, smooth=False)
lathe('roof1', M['roof'], ((0.35, 0), (0.24, 0.07)), G + 0.235, VX, VY, segs=8, outline=0.004, smooth=False)
lathe('octagon2', M['brick'], ((0.22, 0), (0.22, 0.16)), G + 0.28, VX, VY, segs=8, outline=0.006, smooth=False)
lathe('roof2', M['roof'], ((0.235, 0), (0.12, 0.08), (0.003, 0.12)), G + 0.435, VX, VY, segs=8, outline=0.005, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    for lv, (r, z, h) in enumerate(((0.34, G + 0.08, 0.1), (0.22, G + 0.32, 0.08))):
        rr = r * math.cos(math.pi / 8) + 0.003
        for j in (-1, 1):
            off = j * r * 0.18
            box(f'win{lv}{k}{j}', M['dark'], VX + rr * math.cos(a) - off * math.sin(a), VY + rr * math.sin(a) + off * math.cos(a), z, 0.004, r * 0.15, h, rot_z=a, outline=0, bevel=0)
    # the buttresses at the corners
    b = 2 * math.pi * k / 8
    box(f'buttress{k}', M['brickDark'], VX + 0.345 * math.cos(b), VY + 0.345 * math.sin(b), G - 0.005, 0.04, 0.04, 0.24, rot_z=b, outline=0.002, bevel=0)
# the narthex at the front and the apse at the back
box('narthex', M['brick'], VX, VY - 0.4, G - 0.005, 0.36, 0.12, 0.18, outline=0.005, bevel=0)
box('narthexdoor', M['dark'], VX, VY - 0.463, G - 0.005, 0.06, 0.006, 0.11, outline=0, bevel=0)
for s in (-1, 1):
    lathe(f'narthextower{s}', M['brick'], ((0.05, 0), (0.05, 0.26)), G - 0.005, VX + s * 0.2, VY - 0.4, segs=12, outline=0.004)
    lathe(f'narthextowercap{s}', M['roof'], ((0.055, 0), (0.003, 0.06)), G + 0.255, VX + s * 0.2, VY - 0.4, segs=12, outline=0.002, smooth=False)
loft('narthexroof', M['roof'], [[(VX - 0.18, VY - 0.46, G + 0.175), (VX + 0.18, VY - 0.46, G + 0.175), (VX + 0.18, VY - 0.34, G + 0.175), (VX - 0.18, VY - 0.34, G + 0.175)],
                                [(VX - 0.18, VY - 0.402, G + 0.22), (VX + 0.18, VY - 0.402, G + 0.22), (VX + 0.18, VY - 0.398, G + 0.22), (VX - 0.18, VY - 0.398, G + 0.22)]], outline=0.003)
lathe('apse', M['brick'], ((0.14, 0), (0.14, 0.2)), G - 0.005, VX, VY + 0.38, segs=6, outline=0.005, smooth=False)

# ---------- the round campanile ----------
CX, CY = 0.5, 0.15
lathe('campanile', M['brick'], ((0.09, 0), (0.085, 0.72)), G - 0.005, CX, CY, segs=20, outline=0.006)
for row in range(5):
    n = 1 + row // 2
    z = G + 0.2 + row * 0.1
    for j in range(n):
        a = -math.pi / 2 + (j - (n - 1) / 2) * 0.55
        box(f'campwin{row}{j}', M['dark'], CX + 0.088 * math.cos(a), CY + 0.088 * math.sin(a), z, 0.03, 0.02, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('campcap', M['roof'], ((0.095, 0), (0.003, 0.1)), G + 0.715, CX, CY, segs=20, outline=0.004, smooth=False)

# ---------- the Mausoleum of Galla Placidia ----------
GX, GY = 0.45, -0.45
box('mausoleumarm1', M['brick'], GX, GY, G - 0.005, 0.26, 0.1, 0.12, outline=0.004, bevel=0)
box('mausoleumarm2', M['brick'], GX, GY, G - 0.005, 0.1, 0.26, 0.12, outline=0.004, bevel=0)
box('mausoleumtower', M['brick'], GX, GY, G - 0.005, 0.12, 0.12, 0.2, outline=0.004, bevel=0)
lathe('mausoleumroof', M['roof'], ((0.085, 0), (0.003, 0.06)), G + 0.195, GX, GY, segs=4, outline=0.002, smooth=False)
for k, (x, y) in enumerate(((-0.75, -0.5), (-0.85, 0.3), (0.85, -0.2), (0.85, 0.55), (-0.55, 0.75), (0.15, 0.75))):
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.045, 0.06), (0.03, 0.2), (0.004, 0.3)), G - 0.005, x, y, segs=10, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
