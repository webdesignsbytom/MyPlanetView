# A cartoon Abu Simbel for the country maps, built in the set's shared look (../toon.py): the Great
# Temple of Ramesses II cut into the sandstone cliff, its four seated colossi in their striped
# headdresses either side of the door, the small temple of Nefertari beside it, and Lake Nasser in
# front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P abu-simbel.py -- abu-simbel-1024.png 1024 abu-simbel.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8c88a', shadow_mul=(0.86, 0.78, 0.72), lift=0.25),
    'cliff': toon('cliff', '#d8a868', shadow_mul=(0.86, 0.76, 0.7)),
    'statue': toon('statue', '#e6b878', shadow_mul=(0.86, 0.76, 0.7), lift=0.1),
    'stripe': toon('stripe', '#c8925a'),
    'lake': toon('lake', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'door': flat('door', '#3a2a24'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('lake', M['lake'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(200, 341, 4)], G + 0.004, outline=0.01)

# ---------- the cliff the temples are cut into ----------
cl = loft('cliff', M['cliff'], [[(-1.3, 0.05, G - 0.01), (1.3, 0.05, G - 0.01), (1.0, 0.95, G - 0.01), (-1.0, 0.95, G - 0.01)],
                                [(-1.25, 0.12, G + 0.48), (1.25, 0.12, G + 0.48), (0.95, 0.92, G + 0.48), (-0.95, 0.92, G + 0.48)]], outline=0.018)
cl.visible_shadow = False
FY = 0.04
box('facade', M['cliff'], -0.2, FY, G - 0.005, 0.95, 0.06, 0.5, outline=0.014, bevel=0)
box('door', M['door'], -0.2, FY - 0.032, G, 0.07, 0.006, 0.14, outline=0, bevel=0)
box('falcon', M['statue'], -0.2, FY - 0.03, G + 0.16, 0.05, 0.02, 0.07, outline=0.004, bevel=0)


# ---------- the seated colossi ----------
def colossus(name, x, s=1.0):
    y = FY - 0.07 * s
    box(f'{name}throne', M['statue'], x, y + 0.02, G - 0.005, 0.15 * s, 0.14 * s, 0.13 * s, outline=0.008, bevel=0)
    for side in (-1, 1):
        box(f'{name}shin{side}', M['statue'], x + side * 0.03 * s, y - 0.05 * s, G - 0.005, 0.045 * s, 0.05 * s, 0.12 * s, outline=0.005, bevel=0)
        box(f'{name}thigh{side}', M['statue'], x + side * 0.03 * s, y - 0.02 * s, G + 0.11 * s, 0.045 * s, 0.11 * s, 0.035 * s, outline=0.005, bevel=0)
    loft(f'{name}torso', M['statue'], [[(x - 0.05 * s, y + 0.03 * s, G + 0.14 * s), (x + 0.05 * s, y + 0.03 * s, G + 0.14 * s), (x + 0.05 * s, y + 0.07 * s, G + 0.14 * s),
                                         (x - 0.05 * s, y + 0.07 * s, G + 0.14 * s)],
                                        [(x - 0.07 * s, y + 0.02 * s, G + 0.27 * s), (x + 0.07 * s, y + 0.02 * s, G + 0.27 * s), (x + 0.07 * s, y + 0.07 * s, G + 0.27 * s),
                                         (x - 0.07 * s, y + 0.07 * s, G + 0.27 * s)]], outline=0.007)
    box(f'{name}nemes', M['stripe'], x, y + 0.045 * s, G + 0.255 * s, 0.11 * s, 0.06 * s, 0.07 * s, outline=0.006, bevel=0)
    box(f'{name}face', M['statue'], x, y + 0.012 * s, G + 0.27 * s, 0.05 * s, 0.03 * s, 0.06 * s, outline=0.005, bevel=0)
    for j in range(3):
        box(f'{name}nemesstripe{j}', M['statue'], x, y + 0.014 * s, G + 0.262 * s + j * 0.02 * s, 0.112 * s, 0.006, 0.008 * s, outline=0, bevel=0)
    lathe(f'{name}crown', M['statue'], ((0.03 * s, 0), (0.024 * s, 0.05 * s), (0.012 * s, 0.07 * s)), G + 0.33 * s, x, y + 0.04 * s, segs=10, outline=0.004)
    box(f'{name}beard', M['stripe'], x, y + 0.005 * s, G + 0.235 * s, 0.015 * s, 0.015 * s, 0.035 * s, outline=0.002, bevel=0)


for k, x in enumerate((-0.58, -0.38, -0.02, 0.18)):
    colossus(f'ramesses{k}', x, s=1.3)

# ---------- the temple of Nefertari beside it ----------
box('nefertari', M['cliff'], 0.75, 0.06, G - 0.005, 0.42, 0.06, 0.28, outline=0.012, bevel=0)
box('nefertaridoor', M['door'], 0.75, 0.028, G, 0.05, 0.006, 0.1, outline=0, bevel=0)
for k, x in enumerate((0.58, 0.66, 0.84, 0.92)):
    rod(f'standing{k}', M['statue'], (x, 0.0, G), (x, 0.0, G + 0.2), 0.022, r2=0.018, segs=8, outline=0.004)
    ball(f'standinghead{k}', M['statue'], x, 0.0, G + 0.22, 0.02, outline=0.003)

turn(before, -20)
render(G)
