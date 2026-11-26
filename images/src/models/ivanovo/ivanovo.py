# A cartoon Rock-Hewn Churches of Ivanovo for the country maps, built in the set's shared look
# (../toon.py): the medieval hermits' churches cut high into the limestone cliffs of the Rusenski
# Lom gorge in Bulgaria, their dark doorways and arched openings along the rock face, the
# wooden stairs and walkway up to the Church of the Holy Virgin, the river below, and the
# woods on the clifftop. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ivanovo.py -- ivanovo-1024.png 1024 ivanovo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'cliff': toon('cliff', '#d8c8a4', shadow_mul=(0.8, 0.8, 0.86), lift=0.18),
    'cliffDark': toon('cliffDark', '#b8a882'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'wood': toon('wood', '#7a5236'),
    'fresco': toon('fresco', '#c8784a'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)

def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the river along the front ----------
loft('river', M['water'], [strip(-0.75, -0.45, 1.32, G - 0.004), strip(-0.75, -0.45, 1.32, G + 0.008)], outline=0.002)

# ---------- the cliff ----------
CZ = G + 0.62
cliff = loft('cliff', M['cliff'], [strip(-0.2, 1.31, 1.32, G - 0.01), strip(-0.12, 1.31, 1.32, CZ)], outline=0.008)
cliff.visible_shadow = False
# the church caves high in the face
for k, (x, z, w, h) in enumerate(((-0.55, 0.3, 0.1, 0.12), (-0.25, 0.38, 0.16, 0.14), (0.15, 0.34, 0.08, 0.1), (0.45, 0.28, 0.12, 0.13), (0.75, 0.4, 0.07, 0.09))):
    fy = -0.12 - (CZ - G - z) / (CZ - G) * 0.08
    arch(f'cave{k}', M['dark'], x, fy - 0.004, G + z, w, h)
    if k == 1:
        box('frescopanel', M['fresco'], x, fy - 0.006, G + z + 0.03, w * 0.6, 0.004, h * 0.4, outline=0, bevel=0)
# the stairs and walkway up to the Holy Virgin
for k in range(10):
    t = k / 9
    x, z = -0.75 + 0.5 * t, G + 0.38 * t
    box(f'stair{k}', M['wood'], x, -0.26, z, 0.06, 0.07, 0.012, outline=0.001, bevel=0)
    rod(f'stairpost{k}', M['wood'], (x, -0.29, G), (x, -0.29, z + 0.04), 0.005, segs=6, outline=0)
bar('walkway', M['wood'], (-0.25, -0.26, G + 0.38), (0.15, -0.26, G + 0.33), 0.03, outline=0.001)
bar('handrail', M['wood'], (-0.75, -0.295, G + 0.05), (-0.25, -0.295, G + 0.43), 0.008, outline=0)

# ---------- the woods on the clifftop and the bank ----------
for k, (x, y) in enumerate(((-0.75, 0.6), (-0.3, 0.85), (0.2, 0.7), (0.6, 0.55), (0.9, 0.25), (-0.95, 0.15))):
    b = ball(f'topwood{k}', M['tree'], 0, 0, 0, 0.13, outline=0.008)
    b.scale = (1.2, 1.1, 0.8)
    b.location = (x, y, CZ + 0.06)
for k, (x, y) in enumerate(((-0.6, -0.95), (0.0, -1.05), (0.65, -0.95))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
