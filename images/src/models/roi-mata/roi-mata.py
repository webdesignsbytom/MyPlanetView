# A cartoon Chief Roi Mata's Domain for the country maps, built in the set's shared look
# (../toon.py): Vanuatu's sites of the great chief off Efate, Hat Island (Artok), where he lies,
# its forested crown on a broad rim like a hat's brim, Lelepa island's cliff with the dark mouth of
# Fels Cave, the shore of his residence under a great banyan, and an outrigger canoe. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P roi-mata.py -- roi-mata-1024.png 1024 roi-mata.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'reef': toon('reef', '#7fd0d0', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'sand': toon('sand', '#f2e6c8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'land': toon('land', '#6aaa4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'cliff': toon('cliff', '#b8b0a0', shadow_mul=(0.8, 0.8, 0.88)),
    'cave': flat('cave', '#2e2a28'),
    'trunk': toon('trunk', '#7a6048'),
    'stone': toon('stone', '#8a8478', shadow_mul=(0.8, 0.8, 0.88)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'canoe': toon('canoe', '#8a5a3a'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1019)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- Efate's shore along the front, the chief's residence under a banyan ----------
R = 1.42
flat_face('beach', M['sand'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(200, 341, 6)], G + 0.004, outline=0.008)
flat_face('shoreland', M['land'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(214, 327, 6)], G + 0.007, outline=0.008)
BX, BY = -0.35, -0.95
for k in range(6):
    a = 2 * math.pi * k / 6
    rod(f'banyanroot{k}', M['trunk'], (BX + 0.1 * math.cos(a), BY + 0.07 * math.sin(a), G), (BX, BY, G + 0.18), 0.011, segs=5, outline=0.003)
rod('banyantrunk', M['trunk'], (BX, BY, G), (BX, BY, G + 0.2), 0.035, segs=8, outline=0.006)
for k, (dx, dy, dz, r) in enumerate(((0, 0, 0.28, 0.16), (-0.14, 0.02, 0.24, 0.11), (0.14, -0.01, 0.25, 0.11))):
    ball(f'banyan{k}', M['forest'], BX + dx, BY + dy, G + dz, r, outline=0.014)
for k in range(3):
    box(f'stone{k}', M['stone'], 0.0 + k * 0.08, -0.92, G + 0.005, 0.05, 0.04, 0.05 + 0.02 * k, outline=0.004, bevel=0.008)
for k, (x, y) in enumerate(((0.45, -0.85), (0.75, -0.75), (-0.85, -0.65))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.012, r2=0.009, segs=8, outline=0.005)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), G + h - 0.04), 0.018, outline=0.004)

# ---------- Hat Island: a broad brim and a forested crown ----------
HX, HY = 0.1, 0.15
cyl('hatreef', M['reef'], 1.0, 0.004, segs=32, outline=0, matrix=Matrix.Translation((HX, HY, G + 0.001)) @ Matrix.Scale(0.55, 4, (1, 0, 0)) @ Matrix.Scale(0.4, 4, (0, 1, 0)))
brim = loft('hatbrim', M['land'], [[(HX + 0.45 * math.cos(t), HY + 0.32 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 24 for j in range(24))],
                                  [(HX + 0.44 * math.cos(t), HY + 0.31 * math.sin(t), G + 0.04) for t in (2 * math.pi * j / 24 for j in range(24))]], outline=0.012)
brim.visible_shadow = False
crown = loft('hatcrown', M['forest'], [[(HX + 0.24 * math.cos(t), HY + 0.17 * math.sin(t), G + 0.035) for t in (2 * math.pi * j / 24 for j in range(24))],
                                      [(HX + 0.22 * math.cos(t), HY + 0.16 * math.sin(t), G + 0.2) for t in (2 * math.pi * j / 24 for j in range(24))],
                                      [(HX + 0.12 * math.cos(t), HY + 0.08 * math.sin(t), G + 0.28) for t in (2 * math.pi * j / 24 for j in range(24))]], outline=0.016, smooth=True)
crown.visible_shadow = False
for k in range(10):
    a = 2 * math.pi * k / 10
    ball(f'brimtree{k}', M['forestLight' if k % 2 else 'forest'], HX + 0.36 * math.cos(a), HY + 0.25 * math.sin(a), G + 0.09, 0.055, outline=0.01)

# ---------- Lelepa's cliff and Fels Cave ----------
LX, LY = -0.62, 0.65
lel = loft('lelepa', M['cliff'], [[(LX + 0.45 * math.cos(t), LY + 0.28 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 20 for j in range(20))],
                                 [(LX + 0.4 * math.cos(t), LY + 0.24 * math.sin(t), G + 0.26) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.02)
lel.visible_shadow = False
top = loft('lelepatop', M['land'], [[(LX + 0.4 * math.cos(t), LY + 0.24 * math.sin(t), G + 0.255) for t in (2 * math.pi * j / 20 for j in range(20))],
                                   [(LX + 0.38 * math.cos(t), LY + 0.23 * math.sin(t), G + 0.28) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.008)
top.visible_shadow = False
for k in range(6):
    a = 2 * math.pi * k / 6 + 0.3
    ball(f'lelepatree{k}', M['forest'], LX + 0.24 * math.cos(a), LY + 0.14 * math.sin(a), G + 0.33, 0.07, outline=0.012)
pts = [(LX + 0.05 - 0.08, 0.0), (LX + 0.05 + 0.08, 0.0)] + [(LX + 0.05 + 0.08 * math.cos(t), 0.1 + 0.08 * math.sin(t)) for t in (math.pi * j / 10 for j in range(11))]
loft('felscave', M['cave'], [[(px, LY - 0.275, G + pz) for px, pz in pts], [(px, LY - 0.265, G + pz) for px, pz in pts]], outline=0)

# ---------- an outrigger canoe ----------
CX, CY = 0.55, -0.35
loft('canoe', M['canoe'], [[(CX - 0.13, CY, G + 0.002), (CX, CY - 0.022, G + 0.002), (CX + 0.13, CY, G + 0.002), (CX, CY + 0.022, G + 0.002)],
                           [(CX - 0.15, CY, G + 0.03), (CX, CY - 0.03, G + 0.03), (CX + 0.15, CY, G + 0.03), (CX, CY + 0.03, G + 0.03)]], outline=0.006)
rod('outrigger', M['canoe'], (CX - 0.07, CY + 0.1, G + 0.008), (CX + 0.07, CY + 0.1, G + 0.008), 0.01, segs=6, outline=0.002)
for k, dx in enumerate((-0.04, 0.04)):
    bar(f'boom{k}', M['canoe'], (CX + dx, CY, G + 0.03), (CX + dx, CY + 0.1, G + 0.01), 0.007, outline=0.002)

turn(before, -20)
render(G)
