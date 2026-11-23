# A cartoon Cidade Velha for the country maps, built in the set's shared look (../toon.py): Cape
# Verde's first town, the white marble pillory in its square by the bay, the old cathedral's roofless
# ruin, small stone houses under thatch along Rua Banana, Fort Real de São Filipe on the dry hill
# above, palms, and fishing boats drawn up on the shore. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cidade-velha.py -- cidade-velha-1024.png 1024 cidade-velha.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b27a', shadow_mul=(0.82, 0.76, 0.7), lift=0.25),
    'sea': toon('sea', '#2fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'pebbles': toon('pebbles', '#8a8078', shadow_mul=(0.8, 0.8, 0.88)),
    'hill': toon('hill', '#a8945e', shadow_mul=(0.82, 0.78, 0.72)),
    'stone': toon('stone', '#a89c8a', shadow_mul=(0.8, 0.8, 0.86)),
    'stoneDark': toon('stoneDark', '#8a7e70', shadow_mul=(0.8, 0.8, 0.86)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'square': toon('square', '#e0d0a8', lift=0.25),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'b1': toon('b1', '#e0453a'), 'b2': toon('b2', '#3f7fc0'), 'b3': toon('b3', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'flagBlue': flat('flagBlue', '#1f4fa0'), 'flagWhite': flat('flagWhite', '#ffffff'), 'flagRed': flat('flagRed', '#cf2027'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(709)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the bay along the front, a pebble shore ----------
R = 1.42
flat_face('shore', M['pebbles'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(196, 345, 6)], G + 0.002, outline=0.008)
flat_face('sea', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(208, 333, 6)], G + 0.005, outline=0.01)
for k, (x, y, mat, a) in enumerate(((-0.5, -0.4, 'b1', 0.15), (-0.18, -0.42, 'b2', -0.1), (0.3, -0.4, 'b3', 0.05))):
    c, s = math.cos(a), math.sin(a)
    at = lambda dx, dy, z: (x + dx * c - dy * s, y + dx * s + dy * c, z)
    loft(f'boat{k}', M[mat], [[at(-0.1, 0, G + 0.003), at(0.04, -0.03, G + 0.003), at(0.1, 0, G + 0.003), at(0.04, 0.03, G + 0.003)],
                              [at(-0.115, 0, G + 0.05), at(0.04, -0.042, G + 0.045), at(0.125, 0, G + 0.055), at(0.04, 0.042, G + 0.045)]], outline=0.007)

# ---------- the dry hill behind, Fort Real de São Filipe on its top ----------
HC = (0.1, 0.85)
hill = loft('hill', M['hill'], [[(HC[0] + 0.95 * math.cos(t), HC[1] + 0.42 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 20 for j in range(20))],
                                [(HC[0] + 0.55 * math.cos(t), HC[1] + 0.25 * math.sin(t), G + 0.26) for t in (2 * math.pi * j / 20 for j in range(20))],
                                [(HC[0] + 0.4 * math.cos(t), HC[1] + 0.17 * math.sin(t), G + 0.3) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.025)
hill.visible_shadow = False
FX, FY, FZ = 0.1, 0.88, G + 0.29
fort = [(FX - 0.3, FY - 0.1), (FX + 0.3, FY - 0.1), (FX + 0.3, FY + 0.08), (FX - 0.3, FY + 0.08)]
loft('fortwalls', M['stone'], [[(x, y, FZ - 0.01) for x, y in fort], [(x, y, FZ + 0.1) for x, y in fort]], outline=0.014)
for k, (x, y) in enumerate(fort):
    box(f'bastion{k}', M['stoneDark'], x, y, FZ - 0.01, 0.09, 0.09, 0.13, rot_z=math.pi / 4, outline=0.01, bevel=0)
box('fortkeep', M['stone'], FX - 0.05, FY, FZ + 0.09, 0.16, 0.1, 0.07, outline=0.008, bevel=0)
rod('flagpole', M['white'], (FX + 0.18, FY, FZ + 0.1), (FX + 0.18, FY, FZ + 0.34), 0.005, segs=6, outline=0)
z = FZ + 0.33
for k, (mat, h) in enumerate((('flagBlue', 0.03), ('flagWhite', 0.01), ('flagRed', 0.01), ('flagWhite', 0.01), ('flagBlue', 0.02))):
    z -= h
    box(f'flag{k}', M[mat], FX + 0.23, FY, z, 0.1, 0.006, h, outline=0, bevel=0)

# ---------- the square and its pillory ----------
SX, SY = -0.05, -0.12
box('square', M['square'], SX, SY, G - 0.004, 0.5, 0.3, 0.008, outline=0.005, bevel=0)
for k in range(3):
    box(f'pillorystep{k}', M['white'], SX, SY, G + k * 0.015, 0.12 - k * 0.03, 0.12 - k * 0.03, 0.016, outline=0.004, bevel=0)
lathe('pillory', M['white'], ((0.018, 0), (0.016, 0.26)), G + 0.045, SX, SY, segs=10, outline=0.005)
lathe('pillorytop', M['white'], ((0.03, 0), (0.03, 0.02), (0.012, 0.05), (0.004, 0.07)), G + 0.3, SX, SY, segs=8, outline=0.004, smooth=False)

# ---------- the cathedral's roofless ruin ----------
CX, CY = -0.75, 0.15
for k, (dx, dy, w, d, h) in enumerate(((0, -0.17, 0.42, 0.04, 0.2), (0, 0.17, 0.42, 0.04, 0.14), (-0.2, 0, 0.04, 0.34, 0.18), (0.2, 0, 0.04, 0.34, 0.12))):
    box(f'ruinwall{k}', M['stone'], CX + dx, CY + dy, G - 0.005, w, d, h, outline=0.01, bevel=0)
for k in range(3):
    box(f'ruinarch{k}', M['window'], CX - 0.12 + k * 0.12, CY - 0.192, G + 0.05, 0.04, 0.01, 0.09, outline=0, bevel=0)
box('ruinfront', M['stoneDark'], CX - 0.2, CY - 0.17, G - 0.005, 0.07, 0.07, 0.26, outline=0.008, bevel=0)

# ---------- small stone houses under thatch along Rua Banana ----------
for k, (x, y) in enumerate(((0.4, 0.05), (0.62, 0.1), (0.84, 0.15), (0.48, 0.35), (0.72, 0.4))):
    box(f'house{k}', M['stone'], x, y, G - 0.005, 0.15, 0.12, 0.08, outline=0.01, bevel=0)
    loft(f'house{k}roof', M['thatch'], [[(x - 0.09, y - 0.075, G + 0.075), (x + 0.09, y - 0.075, G + 0.075), (x + 0.09, y + 0.075, G + 0.075), (x - 0.09, y + 0.075, G + 0.075)],
                                        [(x - 0.07, y - 0.004, G + 0.15), (x + 0.07, y - 0.004, G + 0.15), (x + 0.07, y + 0.004, G + 0.15), (x - 0.07, y + 0.004, G + 0.15)]],
         outline=0.008)
    box(f'house{k}door', M['window'], x, y - 0.064, G, 0.03, 0.01, 0.055, outline=0, bevel=0)

# ---------- palms ----------
for k, (x, y) in enumerate(((-1.05, -0.2), (-0.35, 0.3), (0.25, 0.25), (1.05, -0.15), (-0.45, -0.25))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.013, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.019, outline=0.005)

turn(before, -20)
render(G)
