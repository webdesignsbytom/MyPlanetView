# A cartoon Colonia del Sacramento for the country maps, built in the set's shared look (../toon.py):
# the old Portuguese quarter on the Río de la Plata, the cobbled Street of Sighs running down to the
# water between low colonial houses in their colours under red tiled roofs, the white lighthouse
# rising from the stone ruins of the San Francisco convent, an old car, plane trees, and the wide
# brown river behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P colonia.py -- colonia-1024.png 1024 colonia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#86c464', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'river': toon('river', '#b89a6a', shadow_mul=(0.82, 0.78, 0.78), lift=0.3),
    'cobble': toon('cobble', '#a8a090', shadow_mul=(0.8, 0.8, 0.86)),
    'gutter': flat('gutter', '#7f786c'),
    'ochre': toon('ochre', '#e0a85a', shadow_mul=(0.84, 0.74, 0.62)),
    'pink': toon('pink', '#e8a8a0', shadow_mul=(0.84, 0.74, 0.8)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'blue': toon('blue', '#8ab4d8', shadow_mul=(0.74, 0.78, 0.88)),
    'yellow': toon('yellow', '#f2d27a', shadow_mul=(0.84, 0.74, 0.62)),
    'roof': toon('roof', '#c4573a'),
    'door': flat('door', '#4a3428'),
    'shutter': flat('shutter', '#2f7a5a'),
    'stone': toon('stone', '#b8ae9a', shadow_mul=(0.8, 0.78, 0.84)),
    'stoneDark': toon('stoneDark', '#9a907c', shadow_mul=(0.8, 0.78, 0.84)),
    'lamp': toon('lamp', '#f4d860', shadow_mul=(0.8, 0.68, 0.55), lift=0.4),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a7a68'),
    'car': toon('car', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'tyre': toon('tyre', '#3a3a40'),
    'glass': flat('glass', '#3f5a72'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(379)

# ---------- the Río de la Plata along the back ----------
R = 1.42
RIVER = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(15, 166, 10)] + [(-1.2, 0.5), (-0.5, 0.72), (0.4, 0.7), (1.25, 0.42)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in RIVER])])
finish('river', bm, M['river'], outline=0.01)

# ---------- the Street of Sighs, cobbled, with its central gutter, running down to the water ----------
box('street', M['cobble'], -0.3, -0.1, G - 0.005, 0.22, 1.5, 0.012, outline=0.008, bevel=0)
box('gutter', M['gutter'], -0.3, -0.1, G + 0.007, 0.03, 1.5, 0.004, outline=0, bevel=0)


# ---------- low colonial houses either side ----------
def house(name, x, y, w, d, h, mat, facing):
    """A low house, its front facing +X (facing=1) or -X (facing=-1) onto the street."""
    box(name, M[mat], x, y, G - 0.005, w, d, h, outline=0.016, bevel=0)
    fx = x + facing * (w / 2 + 0.004)
    box(f'{name}door', M['door'], fx, y, G, 0.01, 0.06, 0.11, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}win{s}', M['shutter'], fx, y + s * d * 0.3, G + 0.05, 0.01, 0.045, 0.06, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.015, y - d / 2 - 0.015, G + h - 0.005), (x + w / 2 + 0.015, y - d / 2 - 0.015, G + h - 0.005),
                                     (x + w / 2 + 0.015, y + d / 2 + 0.015, G + h - 0.005), (x - w / 2 - 0.015, y + d / 2 + 0.015, G + h - 0.005)],
                                    [(x - 0.004, y - d / 2, G + h + 0.07), (x + 0.004, y - d / 2, G + h + 0.07), (x + 0.004, y + d / 2, G + h + 0.07),
                                     (x - 0.004, y + d / 2, G + h + 0.07)]], outline=0.012)


for k, (y, mat) in enumerate(((-0.65, 'ochre'), (-0.38, 'white'), (-0.12, 'pink'), (0.14, 'blue'), (0.38, 'yellow'))):
    house(f'left{k}', -0.55, y, 0.26, 0.24, rng.uniform(0.14, 0.18), mat, 1)
for k, (y, mat) in enumerate(((-0.6, 'blue'), (-0.32, 'yellow'), (-0.05, 'white'), (0.2, 'ochre'))):
    house(f'right{k}', -0.05, y, 0.26, 0.24, rng.uniform(0.14, 0.18), mat, -1)
for k, y in enumerate((-0.5, 0.0, 0.3)):
    rod(f'streetlamp{k}', M['door'], (-0.19, y, G), (-0.19, y, G + 0.2), 0.006, segs=6, outline=0.002)
    lathe(f'lamphead{k}', M['lamp'], ((0.015, 0), (0.02, 0.025), (0.004, 0.04)), G + 0.2, -0.19, y, segs=8, outline=0.004)

# ---------- the lighthouse on the convent ruins ----------
LX, LY = 0.6, 0.15
for k, (x, y, w, d, h) in enumerate(((LX - 0.15, LY - 0.2, 0.45, 0.05, 0.16), (LX - 0.37, LY, 0.05, 0.42, 0.22), (LX + 0.05, LY + 0.2, 0.32, 0.05, 0.12),
                                     (LX - 0.1, LY - 0.05, 0.05, 0.2, 0.1))):
    box(f'ruin{k}', M['stone'], x, y, G - 0.005, w, d, h, outline=0.014, bevel=0)
for k in range(3):
    box(f'ruinwin{k}', M['door'], LX - 0.392, LY - 0.12 + k * 0.12, G + 0.08, 0.01, 0.04, 0.08, outline=0, bevel=0)
lathe('lighthousebase', M['stoneDark'], ((0.09, 0), (0.085, 0.14)), G - 0.005, LX, LY, segs=16, outline=0.016)
lathe('lighthouse', M['white'], ((0.075, 0), (0.06, 0.48)), G + 0.135, LX, LY, segs=16, outline=0.016)
lathe('gallery', M['white'], ((0.085, 0), (0.085, 0.025)), G + 0.61, LX, LY, segs=16, outline=0.01)
lathe('lantern', M['lamp'], ((0.045, 0), (0.045, 0.07)), G + 0.635, LX, LY, segs=12, outline=0.008)
lathe('lanterncap', M['stoneDark'], ((0.055, 0), (0.004, 0.06)), G + 0.705, LX, LY, segs=12, outline=0.008)

# ---------- an old car, plane trees ----------
CX, CY = -0.3, -0.45
car = ball('carbody', M['car'], 0, 0, 0, 0.08, outline=0.012)
car.scale = (0.75, 1.5, 0.55)
car.location = (CX, CY, G + 0.06)
cab = ball('carcab', M['car'], 0, 0, 0, 0.055, outline=0.01)
cab.scale = (1.0, 1.1, 0.85)
cab.location = (CX, CY + 0.02, G + 0.1)
box('carwindow', M['glass'], CX - 0.052, CY + 0.02, G + 0.095, 0.01, 0.08, 0.035, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f'carwheel{sx}{sy}', M['tyre'], 0.026, 0.02, segs=14, outline=0.004, matrix=Matrix.Translation((CX + sx * 0.055, CY + sy * 0.07, G + 0.026)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
for k, (x, y) in enumerate(((0.45, -0.45), (0.85, -0.3), (0.3, -0.85), (-0.95, -0.55), (1.05, 0.15))):
    rod(f'treetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.2), 0.022, segs=8, outline=0.008)
    ball(f'tree{k}', M['tree'], x, y, G + 0.28, rng.uniform(0.11, 0.14), outline=0.018)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
