# A cartoon Telč for the country maps, built in the set's shared look (../toon.py): the long
# triangular market square of the little Moravian town, lined on both sides by Renaissance and baroque
# houses painted in pastel colours, each with its fancy gable (stepped, curved or crowned) to the
# square over its arcade, the Marian column and the fountain in the middle, and the church tower
# behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P telc.py -- telc-1024.png 1024 telc.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobbles': toon('cobbles', '#c8c0b0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'pink': toon('pink', '#e8b0a8', lift=0.12),
    'yellow': toon('yellow', '#f0d890', lift=0.12),
    'green': toon('green', '#a8d0a0', lift=0.12),
    'blue': toon('blue', '#a8c4e0', lift=0.12),
    'cream': toon('cream', '#f2e6cc', lift=0.12),
    'ochre': toon('ochre', '#e8c080', lift=0.12),
    'white': toon('white', '#f6f4ee', lift=0.2),
    'roof': toon('roof', '#b8503e'),
    'dark': flat('dark', '#2e2a2a'),
    'stone': toon('stone', '#d8ccb4', lift=0.12),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'water': toon('water', '#4a9ac8', lift=0.3),
})

G = tile(M['cobbles'])
before = set(bpy.data.objects)
rng = random.Random(1530)
COLS = ('pink', 'yellow', 'green', 'blue', 'cream', 'ochre')


def house(name, x, y, rot, w, h, gable, mat):
    """A narrow house with its arcade and its fancy gable to the square, built facing -y, then turned."""
    objs = set(bpy.data.objects)
    box(name, M[mat], 0, 0.12, G - 0.005, w - 0.004, 0.24, h, outline=0.004, bevel=0)
    box(f'{name}arcade', M['dark'], 0, -0.003, G - 0.005, w * 0.55, 0.006, 0.07, outline=0, bevel=0)
    cyl(f'{name}arcadetop', M['dark'], w * 0.275, 0.006, segs=10, outline=0, matrix=Matrix.Translation((0, -0.003, G + 0.065)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for row in range(2):
        for j in (-1, 1):
            box(f'{name}win{row}{j}', M['dark'], j * w * 0.22, -0.003, G + 0.11 + row * 0.07, 0.022, 0.006, 0.035, outline=0, bevel=0)
    # the gable over the front
    if gable == 'stepped':
        for st in range(3):
            box(f'{name}gable{st}', M[mat], 0, 0.01, G + h - 0.005 + st * 0.035, w - st * 0.05, 0.02, 0.036, outline=0.002, bevel=0)
    elif gable == 'curved':
        cyl(f'{name}gable', M[mat], w / 2, 0.02, segs=14, outline=0.002, matrix=Matrix.Translation((0, 0.01, G + h - 0.005)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        ball(f'{name}finial', M['white'], 0, 0.01, G + h + w / 2, 0.012, outline=0.001)
    else:
        loft(f'{name}gable', M[mat], [[(-w / 2, 0.0, G + h - 0.005), (w / 2, 0.0, G + h - 0.005), (w / 2, 0.02, G + h - 0.005), (-w / 2, 0.02, G + h - 0.005)],
                                      [(-0.02, 0.0, G + h + 0.1), (0.02, 0.0, G + h + 0.1), (0.02, 0.02, G + h + 0.1), (-0.02, 0.02, G + h + 0.1)]], outline=0.002)
        for s in (-1, 1):
            ball(f'{name}gableball{s}', M['white'], s * w * 0.4, 0.01, G + h + 0.01, 0.012, outline=0.001)
    loft(f'{name}roof', M['roof'], [[(-w / 2, 0.02, G + h - 0.005), (w / 2, 0.02, G + h - 0.005), (w / 2, 0.24, G + h - 0.005), (-w / 2, 0.24, G + h - 0.005)],
                                    [(-0.004, 0.02, G + h + 0.08), (0.004, 0.02, G + h + 0.08), (0.004, 0.24, G + h + 0.08), (-0.004, 0.24, G + h + 0.08)]], outline=0.003)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world


# ---------- the two rows of houses facing each other across the square, which runs front to back ----------
k = 0
for side, (x, rot) in enumerate(((-0.42, math.pi / 2), (0.42, -math.pi / 2))):
    for j in range(8):
        y = -0.75 + j * 0.2
        if math.hypot(abs(x) + 0.24, y) > 1.25:
            continue
        house(f'house{k}', x, y, rot, 0.19, rng.choice((0.2, 0.23, 0.26)), rng.choice(('stepped', 'curved', 'pointed')), COLS[k % 6])
        k += 1

# ---------- the Marian column, the fountain and the church tower ----------
lathe('columnbase', M['stone'], ((0.06, 0), (0.06, 0.04), (0.04, 0.05)), G - 0.005, 0.0, 0.25, segs=8, outline=0.003, smooth=False)
rod('column', M['stone'], (0.0, 0.25, G + 0.04), (0.0, 0.25, G + 0.34), 0.016, segs=8, outline=0.002)
rod('mary', M['gold'], (0.0, 0.25, G + 0.34), (0.0, 0.25, G + 0.4), 0.014, r2=0.008, segs=8, outline=0.002)
lathe('fountain', M['stone'], ((0.08, 0), (0.08, 0.04), (0.065, 0.04)), G - 0.005, 0.0, -0.3, segs=8, outline=0.003, smooth=False)
lathe('fountainwater', M['water'], ((0.068, 0), (0.068, 0.035)), G - 0.003, 0.0, -0.3, segs=8, outline=0, smooth=False)
box('churchtower', M['white'], 0.0, 0.98, G - 0.005, 0.12, 0.12, 0.6, outline=0.006, bevel=0)
lathe('churchtowercap', M['roof'], ((0.075, 0), (0.06, 0.05), (0.03, 0.1), (0.003, 0.18)), G + 0.595, 0.0, 0.98, segs=8, outline=0.003, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
