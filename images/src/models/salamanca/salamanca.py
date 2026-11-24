# A cartoon Salamanca for the country maps, built in the set's shared look (../toon.py): the Old and
# New Cathedrals side by side in golden Villamayor sandstone, the New Cathedral's tall baroque bell
# tower and its dome over the crossing, the Old Cathedral's Torre del Gallo with its scaled
# Romanesque dome, the carved west front with its portals, and the Roman bridge over the Tormes with
# the old city's roofs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P salamanca.py -- salamanca-1024.png 1024 salamanca.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a0', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'river': toon('river', '#5a8aa0', shadow_mul=(0.78, 0.86, 0.9), lift=0.3),
    'sand': toon('sand', '#e8c47a', shadow_mul=(0.86, 0.78, 0.68), lift=0.12),
    'sandDark': toon('sandDark', '#c8a058'),
    'roof': toon('roof', '#c4603e'),
    'lead': toon('lead', '#8a8e96'),
    'dark': flat('dark', '#3a2e24'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
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


# ---------- the Tormes and the Roman bridge in front ----------
loft('tormes', M['river'], [strip(-1.2, -0.75, 1.42, -0.004), strip(-1.2, -0.75, 1.42, 0.004)], outline=0)
box('bridge', M['sandDark'], -0.45, -0.97, G + 0.05, 0.14, 0.5, 0.03, outline=0.004, bevel=0)
for k in range(4):
    box(f'bridgepier{k}', M['sandDark'], -0.45, -1.2 + k * 0.15, G - 0.005, 0.14, 0.04, 0.06, outline=0.002, bevel=0)

# ---------- the New Cathedral ----------
CX, CY = 0.1, 0.15
box('newnave', M['sand'], CX, CY + 0.12, G - 0.005, 0.42, 0.8, 0.36, outline=0.009, bevel=0)
loft('newnaveroof', M['roof'], [[(CX - 0.21, CY - 0.28, G + 0.355), (CX + 0.21, CY - 0.28, G + 0.355), (CX + 0.21, CY + 0.52, G + 0.355), (CX - 0.21, CY + 0.52, G + 0.355)],
                                [(CX - 0.004, CY - 0.28, G + 0.44), (CX + 0.004, CY - 0.28, G + 0.44), (CX + 0.004, CY + 0.52, G + 0.44), (CX - 0.004, CY + 0.52, G + 0.44)]], outline=0.005)
for s in (-1, 1):
    for j in range(6):
        y = CY - 0.2 + j * 0.13
        lathe(f'pinnacle{s}{j}', M['sandDark'], ((0.016, 0), (0.003, 0.08)), G + 0.355, CX + s * 0.21, y, segs=6, outline=0.001, smooth=False)
# the carved west front with its three portals
box('westfront', M['sandDark'], CX, CY - 0.285, G - 0.005, 0.42, 0.012, 0.32, outline=0, bevel=0)
for j, w in enumerate((0.06, 0.1, 0.06)):
    x = CX - 0.13 + j * 0.13
    box(f'portal{j}', M['dark'], x, CY - 0.293, G - 0.005, w, 0.006, 0.14 + 0.03 * (j == 1), outline=0, bevel=0)
    cyl(f'portaltop{j}', M['dark'], w / 2, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, CY - 0.293, G + 0.135 + 0.03 * (j == 1))) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the dome over the crossing
lathe('newdrum', M['sand'], ((0.12, 0), (0.12, 0.12)), G + 0.4, CX, CY + 0.28, segs=8, outline=0.005, smooth=False)
lathe('newdome', M['sand'], ((0.12, 0), (0.11, 0.06), (0.07, 0.12), (0.03, 0.15)), G + 0.52, CX, CY + 0.28, segs=16, outline=0.005)
lathe('newlantern', M['sand'], ((0.03, 0), (0.03, 0.06), (0.004, 0.1)), G + 0.665, CX, CY + 0.28, segs=8, outline=0.002, smooth=False)
# the great bell tower at the front's south-west corner
TX, TY = CX + 0.3, CY - 0.18
box('tower', M['sand'], TX, TY, G - 0.005, 0.18, 0.18, 0.66, outline=0.008, bevel=0)
for fy in (-1, 1):
    box(f'belfry{fy}', M['dark'], TX, TY + fy * 0.093, G + 0.5, 0.06, 0.006, 0.1, outline=0, bevel=0)
lathe('towerlantern', M['sand'], ((0.09, 0), (0.08, 0.08), (0.06, 0.1)), G + 0.655, TX, TY, segs=8, outline=0.004, smooth=False)
lathe('towerdome', M['sand'], ((0.06, 0), (0.055, 0.05), (0.03, 0.1), (0.004, 0.14)), G + 0.755, TX, TY, segs=12, outline=0.003)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'towerpinnacle{sx}{sy}', M['sandDark'], ((0.014, 0), (0.002, 0.08)), G + 0.655, TX + sx * 0.08, TY + sy * 0.08, segs=6, outline=0.001, smooth=False)

# ---------- the Old Cathedral beside it, with the Torre del Gallo ----------
OX, OY = CX - 0.42, CY + 0.25
box('oldnave', M['sand'], OX, OY, G - 0.005, 0.3, 0.6, 0.26, outline=0.007, bevel=0)
loft('oldnaveroof', M['roof'], [[(OX - 0.15, OY - 0.3, G + 0.255), (OX + 0.15, OY - 0.3, G + 0.255), (OX + 0.15, OY + 0.3, G + 0.255), (OX - 0.15, OY + 0.3, G + 0.255)],
                                [(OX - 0.004, OY - 0.3, G + 0.33), (OX + 0.004, OY - 0.3, G + 0.33), (OX + 0.004, OY + 0.3, G + 0.33), (OX - 0.004, OY + 0.3, G + 0.33)]], outline=0.004)
lathe('gallodrum', M['sand'], ((0.08, 0), (0.08, 0.12)), G + 0.3, OX, OY + 0.05, segs=16, outline=0.004)
for k in range(4):
    a = k * math.pi / 2 + math.pi / 4
    lathe(f'galloturret{k}', M['sand'], ((0.022, 0), (0.022, 0.1), (0.003, 0.14)), G + 0.3, OX + 0.085 * math.cos(a), OY + 0.05 + 0.085 * math.sin(a), segs=8, outline=0.002, smooth=False)
lathe('gallodome', M['lead'], ((0.085, 0), (0.07, 0.06), (0.03, 0.13), (0.004, 0.17)), G + 0.415, OX, OY + 0.05, segs=16, outline=0.004, smooth=False)
rod('gallocock', M['sandDark'], (OX, OY + 0.05, G + 0.585), (OX, OY + 0.05, G + 0.63), 0.004, segs=4, outline=0)

# ---------- the old city's roofs and trees ----------
for k, (x, y) in enumerate(((0.7, 0.3), (0.75, -0.2), (0.6, 0.7), (-0.8, -0.2), (-0.75, -0.55), (0.55, -0.55))):
    box(f'house{k}', M['sand'], x, y, G - 0.005, 0.22, 0.2, 0.16, outline=0.005, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.11, y - 0.1, G + 0.155), (x + 0.11, y - 0.1, G + 0.155), (x + 0.11, y + 0.1, G + 0.155), (x - 0.11, y + 0.1, G + 0.155)],
                                      [(x - 0.004, y - 0.1, G + 0.21), (x + 0.004, y - 0.1, G + 0.21), (x + 0.004, y + 0.1, G + 0.21), (x - 0.004, y + 0.1, G + 0.21)]], outline=0.003)
for k, (x, y) in enumerate(((-0.25, -0.5), (0.3, -0.6), (-0.95, 0.4))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
