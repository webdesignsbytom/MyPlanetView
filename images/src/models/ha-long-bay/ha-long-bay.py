# A cartoon Ha Long Bay for the country maps, built in the set's shared look (../toon.py) on a
# tile of emerald water: the limestone towers rising steep from the bay, grey cliffs under
# green crowns, and a junk in front with its red-orange batwing sails, side-on.
# Run: blender -b --factory-startup -P ha-long-bay.py -- ha-long-bay-1024.png 1024 ha-long-bay.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bay': toon('bay', '#3fb5a6', shadow_mul=(0.72, 0.82, 0.86), lift=0.3),
    'limestone': toon('limestone', '#b6b2a4', shadow_mul=(0.76, 0.76, 0.86)),
    'jungle': toon('jungle', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'hull': toon('hull', '#8a5a3c'),
    'sail': toon('sail', '#e2673a', shadow_mul=(0.8, 0.66, 0.62)),
    'batten': toon('batten', '#5a3a28'),
})

G = tile(M['bay'])
rng = random.Random(8)


def ring(cx, cy, r, z, jitter, sides=11):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + r * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def karst(name, cx, cy, r, h):
    """A limestone tower: steep grey sides, bulging a little, under a green crown."""
    rock = loft(name, M['limestone'], [ring(cx, cy, r, -0.01, 0.05), ring(cx, cy, r * 1.06, h * 0.35, 0.1),
                                       ring(cx, cy, r * 0.98, h * 0.7, 0.1), ring(cx, cy, r * 0.86, h * 0.86, 0.06)],
                outline=0.035)
    crown = loft(name + 'crown', M['jungle'], [ring(cx, cy, r * 0.9, h * 0.8, 0.08), ring(cx, cy, r * 0.82, h * 0.93, 0.1),
                                               ring(cx, cy, r * 0.5, h, 0.1), ring(cx, cy, r * 0.12, h + 0.04, 0.0)],
                 outline=0.03)
    rock.visible_shadow = crown.visible_shadow = False


for k, (x, y, r, h) in enumerate(((-0.55, 0.42, 0.3, 0.95), (0.18, 0.62, 0.26, 0.8), (0.78, 0.22, 0.24, 0.66),
                                  (-1.0, -0.15, 0.2, 0.52), (0.5, -0.32, 0.16, 0.44), (-0.15, 0.05, 0.14, 0.38))):
    karst(f'karst{k}', x, y, r, h)

# ---------- a junk, side-on ----------
before = set(bpy.data.objects)
JX, JY = -0.25, -0.78
outline_pts = [(-0.26, 0), (-0.2, -0.065), (0.18, -0.065), (0.28, 0), (0.18, 0.065), (-0.2, 0.065)]
loft('hull', M['hull'], [[(JX + x * 0.8, JY + y * 0.8, G - 0.005) for x, y in outline_pts],
                         [(JX + x, JY + y, G + 0.07) for x, y in outline_pts]], outline=0.02)
box('stern', M['hull'], JX - 0.2, JY, G + 0.07, 0.1, 0.12, 0.05, outline=0.015, bevel=0.005)
for k, (dx, h, w) in enumerate(((-0.12, 0.3, 0.17), (0.05, 0.38, 0.2), (0.2, 0.26, 0.14))):
    mx = JX + dx
    rod(f'mast{k}', M['batten'], (mx, JY, G + 0.07), (mx, JY, G + 0.08 + h), 0.008, segs=6, outline=0.006)
    # a batwing sail: from the mast out to its curved trailing edge
    pts = [(mx, G + 0.1), (mx, G + 0.08 + h)]
    for i in range(1, 6):
        t = i / 5
        pts.append((mx + w * (0.55 + 0.45 * math.sin(math.pi * t)), G + 0.08 + h - (h - 0.02) * t))
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((x, JY - 0.004, z)) for x, z in pts])
    bmesh.ops.triangulate(bm, faces=[face])
    finish(f'sail{k}', bm, M['sail'], outline=0.012)
    for i in range(1, 5):
        z = G + 0.08 + h - (h - 0.02) * i / 5
        x1 = mx + w * (0.55 + 0.45 * math.sin(math.pi * i / 5))
        rod(f'batten{k}{i}', M['batten'], (mx, JY - 0.01, z), (x1, JY - 0.01, z), 0.004, segs=4, outline=0)
turn(before, -32, about=(JX, JY))

render(G)
