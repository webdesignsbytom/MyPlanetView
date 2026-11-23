# A cartoon Taputapuātea for the country maps, built in the set's shared look (../toon.py): the
# great marae on Raiatea in French Polynesia, its paved courtyards and long ahu platform of coral and
# basalt slabs with upright stones, by the lagoon, coconut palms, a banyan, and a double-hulled
# voyaging canoe under sail. Turned a little towards the camera.
# Run: blender -b --factory-startup -P taputapuatea.py -- taputapuatea-1024.png 1024 taputapuatea.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#4ac0c8', shadow_mul=(0.74, 0.84, 0.9), lift=0.35),
    'sand': toon('sand', '#f2e6c8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'coral': toon('coral', '#d8d0c0', shadow_mul=(0.8, 0.8, 0.88)),
    'basalt': toon('basalt', '#4e4a4c', shadow_mul=(0.84, 0.84, 0.9)),
    'paving': toon('paving', '#a8a090', shadow_mul=(0.8, 0.8, 0.88)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'banyan': toon('banyan', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'canoe': toon('canoe', '#8a5a3a'),
    'sail': toon('sail', '#e8d8b0', lift=0.15),
    'hill': toon('hill', '#4f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(883)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the lagoon in front, the beach, the island's green hills behind ----------
R = 1.42
flat_face('beach', M['sand'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(192, 349, 6)], G + 0.002, outline=0.008)
flat_face('lagoon', M['lagoon'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(206, 335, 6)], G + 0.005, outline=0.01)
hl = loft('hills', M['hill'], [[(0.1 + 0.95 * math.cos(t), 1.05 + 0.3 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 20 for j in range(20))],
                              [(0.1 + 0.55 * math.cos(t), 1.08 + 0.15 * math.sin(t), G + 0.3) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.022, smooth=True)
hl.visible_shadow = False

# ---------- the marae: a paved court and the long ahu of slabs ----------
MX, MY = -0.1, 0.15
box('court', M['paving'], MX, MY, G - 0.005, 0.95, 0.55, 0.03, outline=0.01, bevel=0)
for k in range(10):
    for j in range(5):
        if rng.random() < 0.55:
            box(f'slab{k}{j}', M['coral'], MX - 0.42 + k * 0.094, MY - 0.22 + j * 0.11, G + 0.024, 0.08, 0.09, 0.008, outline=0, bevel=0)
AY = MY + 0.24
box('ahu', M['coral'], MX, AY, G + 0.02, 0.85, 0.09, 0.12, outline=0.012, bevel=0)
for k in range(12):
    box(f'ahuslab{k}', M['basalt' if k % 3 == 0 else 'coral'], MX - 0.4 + k * 0.073, AY - 0.047, G + 0.03, 0.06, 0.012, 0.1, outline=0.003, bevel=0)
for k in range(7):
    box(f'upright{k}', M['basalt'], MX - 0.33 + k * 0.11, MY - 0.12, G + 0.02, 0.03, 0.02, rng.uniform(0.07, 0.11), outline=0.004, bevel=0.006)
box('smallmarae', M['paving'], 0.62, -0.1, G - 0.005, 0.3, 0.24, 0.03, outline=0.008, bevel=0)
box('smallahu', M['coral'], 0.62, 0.0, G + 0.02, 0.26, 0.06, 0.08, outline=0.008, bevel=0)

# ---------- coconut palms and a banyan ----------
for k, (x, y) in enumerate(((-0.75, -0.3), (-0.95, 0.35), (0.85, 0.35), (0.3, -0.35), (-0.4, -0.38))):
    h = rng.uniform(0.26, 0.32)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.04, y, G + h), 0.013, r2=0.01, segs=8, outline=0.005)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.04, y, G + h), (x + 0.04 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)
BX, BY = 0.45, 0.6
for k in range(5):
    a = 2 * math.pi * k / 5
    rod(f'banyanroot{k}', M['trunk'], (BX + 0.08 * math.cos(a), BY + 0.06 * math.sin(a), G), (BX, BY, G + 0.16), 0.01, segs=5, outline=0.003)
rod('banyantrunk', M['trunk'], (BX, BY, G), (BX, BY, G + 0.18), 0.03, segs=8, outline=0.006)
for k, (dx, dy, dz, r) in enumerate(((0, 0, 0.25, 0.14), (-0.12, 0.02, 0.22, 0.1), (0.12, -0.01, 0.23, 0.1))):
    ball(f'banyan{k}', M['banyan'], BX + dx, BY + dy, G + dz, r, outline=0.014)

# ---------- a double-hulled voyaging canoe under sail ----------
VX, VY = 0.05, -0.85
for k, dy in enumerate((-0.05, 0.05)):
    loft(f'hull{k}', M['canoe'], [[(VX - 0.18, VY + dy, G + 0.0), (VX, VY + dy - 0.022, G + 0.0), (VX + 0.18, VY + dy, G + 0.0), (VX, VY + dy + 0.022, G + 0.0)],
                                  [(VX - 0.2, VY + dy, G + 0.04), (VX, VY + dy - 0.028, G + 0.035), (VX + 0.21, VY + dy, G + 0.045), (VX, VY + dy + 0.028, G + 0.035)]], outline=0.006)
box('deck', M['canoe'], VX, VY, G + 0.035, 0.18, 0.12, 0.012, outline=0.004, bevel=0)
rod('mast', M['canoe'], (VX, VY, G + 0.04), (VX, VY, G + 0.3), 0.006, segs=6, outline=0.002)
loft('sail', M['sail'], [[(VX - 0.12, VY - 0.002, G + 0.07), (VX + 0.03, VY - 0.002, G + 0.06), (VX + 0.0, VY - 0.002, G + 0.31)],
                         [(VX - 0.12, VY + 0.002, G + 0.07), (VX + 0.03, VY + 0.002, G + 0.06), (VX + 0.0, VY + 0.002, G + 0.31)]], outline=0.006)

turn(before, -20)
render(G)
