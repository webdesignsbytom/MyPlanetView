# A cartoon Zytglogge for the country maps, built in the set's shared look (../toon.py): Bern's medieval
# clock tower over the old town's main street, its gateway arch, the great clock face and below it
# the colourful astronomical clock, the steep dark spire roof with its little open belfry, bell and
# gilded figure, and on both sides of the street the grey-green sandstone houses with their arcades
# and red-brown roofs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P zytglogge.py -- zytglogge-1024.png 1024 zytglogge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobbles': toon('cobbles', '#c8c0b0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'sandstone': toon('sandstone', '#b8b898', shadow_mul=(0.82, 0.84, 0.88), lift=0.15),
    'cream': toon('cream', '#eedcb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'roof': toon('roof', '#9a4a36'),
    'spire': toon('spire', '#3e3a3a'),
    'clockface': toon('clockface', '#2a3e6a', lift=0.15),
    'gold': toon('gold', '#e8b848', lift=0.3),
    'red': toon('red', '#c8403a', lift=0.15),
    'blue': toon('blue', '#4a7ab8', lift=0.15),
    'dark': flat('dark', '#2e2a2a'),
})

G = tile(M['cobbles'])
before = set(bpy.data.objects)


def house(name, x, y, rot, w, h):
    """A sandstone house with its arcade to the street, built facing -y, then turned."""
    objs = set(bpy.data.objects)
    box(name, M['sandstone'], 0, 0.13, G - 0.005, w - 0.006, 0.26, h, outline=0.004, bevel=0)
    for j in (-1, 1):
        box(f'{name}arcade{j}', M['dark'], j * w * 0.22, -0.003, G - 0.005, w * 0.3, 0.006, 0.07, outline=0, bevel=0)
        cyl(f'{name}arcadetop{j}', M['dark'], w * 0.15, 0.006, segs=10, outline=0, matrix=Matrix.Translation((j * w * 0.22, -0.003, G + 0.065)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for row in range(2):
        for j in (-1, 0, 1):
            box(f'{name}win{row}{j}', M['dark'], j * w * 0.28, -0.003, G + 0.12 + row * 0.07, 0.022, 0.006, 0.04, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(-w / 2, -0.02, G + h - 0.005), (w / 2, -0.02, G + h - 0.005), (w / 2, 0.28, G + h - 0.005), (-w / 2, 0.28, G + h - 0.005)],
                                    [(-w / 2, 0.126, G + h + 0.1), (w / 2, 0.126, G + h + 0.1), (w / 2, 0.134, G + h + 0.1), (-w / 2, 0.134, G + h + 0.1)]], outline=0.003)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world


# ---------- the arcaded houses along the street, which runs front to back ----------
rng = random.Random(1405)
for side, (x, rot) in enumerate(((-0.3, math.pi / 2), (0.3, -math.pi / 2))):
    for j in range(8):
        y = -0.8 + j * 0.22
        if abs(y - 0.1) < 0.15 or math.hypot(abs(x) + 0.3, y) > 1.24:
            continue
        house(f'house{side}{j}', x, y, rot, 0.21, rng.choice((0.22, 0.25, 0.28)))

# ---------- the clock tower ----------
TX, TY = 0.0, 0.1
W = 0.22
box('tower', M['cream'], TX, TY, G - 0.005, W, W, 0.62, outline=0.007, bevel=0)
box('gate', M['dark'], TX, TY - W / 2 - 0.004, G - 0.005, 0.1, 0.006, 0.1, outline=0, bevel=0)
cyl('gatetop', M['dark'], 0.05, 0.006, segs=12, outline=0, matrix=Matrix.Translation((TX, TY - W / 2 - 0.004, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
FY = TY - W / 2 - 0.006
# the great clock face
cyl('clockgold', M['gold'], 0.075, 0.006, segs=24, outline=0.002, matrix=Matrix.Translation((TX, FY, G + 0.46)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('clockface', M['clockface'], 0.062, 0.006, segs=24, outline=0, matrix=Matrix.Translation((TX, FY - 0.003, G + 0.46)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k in range(12):
    a = k * math.pi / 6
    box(f'numeral{k}', M['gold'], TX + 0.05 * math.cos(a), FY - 0.007, G + 0.455 + 0.05 * math.sin(a), 0.01, 0.004, 0.01, outline=0, bevel=0)
bar('hourhand', M['gold'], (TX, FY - 0.009, G + 0.46), (TX + 0.03, FY - 0.009, G + 0.48), 0.008, outline=0)
bar('minutehand', M['gold'], (TX, FY - 0.009, G + 0.46), (TX - 0.01, FY - 0.009, G + 0.51), 0.006, outline=0)
# the astronomical clock below it
cyl('astrogold', M['gold'], 0.055, 0.006, segs=24, outline=0.002, matrix=Matrix.Translation((TX, FY, G + 0.26)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('astroblue', M['blue'], 0.046, 0.006, segs=24, outline=0, matrix=Matrix.Translation((TX, FY - 0.003, G + 0.26)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('astrored', M['red'], 0.024, 0.006, segs=16, outline=0, matrix=Matrix.Translation((TX, FY - 0.006, G + 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('astroframe', M['red'], TX, FY + 0.002, G + 0.19, 0.14, 0.006, 0.15, outline=0.001, bevel=0)
# the steep spire roof, its belfry, bell and gilded figure
loft('spireroof', M['spire'], [[(TX - W / 2 - 0.015, TY - W / 2 - 0.015, G + 0.615), (TX + W / 2 + 0.015, TY - W / 2 - 0.015, G + 0.615), (TX + W / 2 + 0.015, TY + W / 2 + 0.015, G + 0.615), (TX - W / 2 - 0.015, TY + W / 2 + 0.015, G + 0.615)],
                               [(TX - 0.03, TY - 0.03, G + 0.86), (TX + 0.03, TY - 0.03, G + 0.86), (TX + 0.03, TY + 0.03, G + 0.86), (TX - 0.03, TY + 0.03, G + 0.86)]], outline=0.005)
for s in (-1, 1):
    box(f'dormer{s}', M['spire'], TX + s * 0.06, TY - 0.1, G + 0.65, 0.04, 0.04, 0.05, outline=0.002, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'belfrypost{sx}{sy}', M['spire'], (TX + sx * 0.026, TY + sy * 0.026, G + 0.855), (TX + sx * 0.026, TY + sy * 0.026, G + 0.92), 0.005, segs=4, outline=0.001)
lathe('bell', M['gold'], ((0.02, 0), (0.014, 0.02), (0.008, 0.035)), G + 0.865, TX, TY, segs=10, outline=0.001)
lathe('belfryroof', M['spire'], ((0.04, 0), (0.003, 0.09)), G + 0.915, TX, TY, segs=8, outline=0.002, smooth=False)
rod('figure', M['gold'], (TX, TY, G + 1.0), (TX, TY, G + 1.04), 0.008, segs=6, outline=0.001)
ball('figurehead', M['gold'], TX, TY, G + 1.048, 0.008, outline=0.001)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
