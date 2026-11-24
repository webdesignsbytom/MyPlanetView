# A cartoon D.F. Wouda Steam Pumping Station for the country maps, built in the set's shared look
# (../toon.py): the biggest steam pumping station ever built, at Lemmer in Friesland, its yellow and
# red brick Amsterdam School hall with the tall arched windows, the stepped tower over the entrance,
# the tall square chimney, the outlet into the IJsselmeer and the flat green polder with its ditch
# and a windmill on the horizon. Turned a little towards the camera.
# Run: blender -b --factory-startup -P wouda.py -- wouda-1024.png 1024 wouda.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'polder': toon('polder', '#8ac85a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'water': toon('water', '#4a8ab0', lift=0.3),
    'yellow': toon('yellow', '#e0c070', shadow_mul=(0.86, 0.8, 0.72), lift=0.1),
    'brick': toon('brick', '#a84e36', lift=0.06),
    'roof': toon('roof', '#4a5060'),
    'window': flat('window', '#2e3238'),
    'white': toon('white', '#f6f4ee', lift=0.15),
    'mill': toon('mill', '#5a4a3a'),
})

G = tile(M['polder'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


# the IJsselmeer in front, the polder ditch behind
loft('lake', M['water'], [strip(-1.41, -0.7, 1.42, -0.004), strip(-1.41, -0.7, 1.42, 0.004)], outline=0)
box('dyke', M['polder'], 0, -0.62, G - 0.005, 2.3, 0.14, 0.05, outline=0.004, bevel=0)
box('ditch', M['water'], 0, 0.7, G - 0.003, 2.0, 0.1, 0.01, outline=0, bevel=0)

# ---------- the hall ----------
HX, HY = 0.0, 0.05
W, D, H = 0.7, 0.34, 0.26
box('hall', M['yellow'], HX, HY, G - 0.005, W, D, H, outline=0.009, bevel=0)
box('plinth', M['brick'], HX, HY, G - 0.005, W + 0.01, D + 0.01, 0.06, outline=0.003, bevel=0)
for j in range(5):
    x = HX - W / 2 + 0.08 + j * (W - 0.16) / 4
    box(f'hallwin{j}', M['window'], x, HY - D / 2 - 0.003, G + 0.07, 0.06, 0.006, 0.15, outline=0, bevel=0)
    cyl(f'hallwintop{j}', M['window'], 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, HY - D / 2 - 0.003, G + 0.22)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'pilaster{j}', M['brick'], x + 0.07, HY - D / 2 - 0.004, G - 0.005, 0.03, 0.008, H, outline=0, bevel=0)
loft('hallroof', M['roof'], [[(HX - W / 2 - 0.01, HY - D / 2 - 0.01, G + H - 0.005), (HX + W / 2 + 0.01, HY - D / 2 - 0.01, G + H - 0.005), (HX + W / 2 + 0.01, HY + D / 2 + 0.01, G + H - 0.005), (HX - W / 2 - 0.01, HY + D / 2 + 0.01, G + H - 0.005)],
                             [(HX - W / 2 + 0.05, HY - 0.004, G + H + 0.14), (HX + W / 2 - 0.05, HY - 0.004, G + H + 0.14), (HX + W / 2 - 0.05, HY + 0.004, G + H + 0.14), (HX - W / 2 + 0.05, HY + 0.004, G + H + 0.14)]], outline=0.005)
# the stepped entrance tower on the left end
EX = HX - W / 2 - 0.06
for k, (w, z, h) in enumerate(((0.16, 0.0, 0.32), (0.13, 0.32, 0.08), (0.1, 0.4, 0.06))):
    box(f'entrancetower{k}', M['yellow'] if k % 2 == 0 else M['brick'], EX, HY - 0.05, G - 0.005 + z, w, w, h, outline=0.004, bevel=0)
box('entrancedoor', M['window'], EX, HY - 0.05 - 0.083, G - 0.005, 0.05, 0.006, 0.12, outline=0, bevel=0)
box('entranceclock', M['white'], EX, HY - 0.05 - 0.083, G + 0.24, 0.05, 0.006, 0.05, outline=0, bevel=0)

# ---------- the chimney ----------
box('chimney', M['brick'], HX + W / 2 - 0.08, HY + 0.12, G - 0.005, 0.08, 0.08, 0.72, outline=0.006, bevel=0)
box('chimneytop', M['yellow'], HX + W / 2 - 0.08, HY + 0.12, G + 0.7, 0.1, 0.1, 0.04, outline=0.003, bevel=0)
# the outlet sluices into the lake
for k in range(4):
    box(f'outlet{k}', M['brick'], HX - 0.2 + k * 0.13, HY - D / 2 - 0.15, G - 0.005, 0.1, 0.25, 0.06, outline=0.003, bevel=0)
    box(f'outletmouth{k}', M['window'], HX - 0.2 + k * 0.13, HY - D / 2 - 0.276, G + 0.0, 0.06, 0.006, 0.04, outline=0, bevel=0)

# ---------- a windmill on the polder ----------
MX, MY = 0.75, 0.55
lathe('windmill', M['mill'], ((0.06, 0), (0.04, 0.24)), G - 0.005, MX, MY, segs=8, outline=0.004, smooth=False)
lathe('windmillcap', M['roof'], ((0.045, 0), (0.003, 0.06)), G + 0.235, MX, MY, segs=8, outline=0.002, smooth=False)
for k in range(4):
    a = k * math.pi / 2 + 0.3
    bar(f'sail{k}', M['white'], (MX, MY - 0.05, G + 0.24), (MX + 0.18 * math.cos(a), MY - 0.05, G + 0.24 + 0.18 * math.sin(a)), 0.03, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
