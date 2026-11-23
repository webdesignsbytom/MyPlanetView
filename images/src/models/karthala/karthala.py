# A cartoon Mount Karthala for the country maps, built in the set's shared look (../toon.py): the
# great shield volcano of Grande Comore, its broad forested slopes, the wide caldera at its top with
# a smoking vent in its floor, the white town and mosque of Moroni on the shore, and a dhow on the
# Indian Ocean. Turned a little towards the camera.
# Run: blender -b --factory-startup -P karthala.py -- karthala-1024.png 1024 karthala.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'shore': toon('shore', '#4a4448', shadow_mul=(0.84, 0.84, 0.9)),
    'slope': toon('slope', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'bare': toon('bare', '#7a6e64', shadow_mul=(0.82, 0.8, 0.86)),
    'crater': toon('crater', '#4e4a4c', shadow_mul=(0.84, 0.84, 0.9)),
    'vent': flat('vent', '#ff7a2a'),
    'steam': toon('steam', '#ececf2', shadow_mul=(0.84, 0.84, 0.92), lift=0.15),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'green': toon('greenDome', '#4f9a6a'),
    'window': flat('window', '#3a3640'),
    'dhow': toon('dhow', '#a8744a'),
    'sail': toon('sail', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
})

G = tile(M['slope'])
before = set(bpy.data.objects)
rng = random.Random(821)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.04 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the sea and the black lava shore along the front ----------
R = 1.42
flat_face('shore', M['shore'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(194, 347, 6)], G + 0.002, outline=0.008)
flat_face('sea', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(206, 335, 6)], G + 0.005, outline=0.01)

# ---------- the volcano: forested flanks, bare top, a wide caldera ----------
VX, VY = 0.0, 0.42
flank = loft('flank', M['slope'], [ring(VX, VY, 1.0, 0.62, -0.01, 1), ring(VX, VY, 0.62, 0.4, 0.28, 1)], outline=0.025, smooth=True)
flank.visible_shadow = False
top = loft('top', M['bare'], [ring(VX, VY, 0.62, 0.4, 0.28, 1), ring(VX, VY, 0.4, 0.27, 0.44, 1), ring(VX, VY, 0.33, 0.22, 0.42, 1)], outline=0.022)
top.visible_shadow = False
crater = loft('crater', M['crater'], [ring(VX, VY, 0.33, 0.22, 0.42, 1), ring(VX, VY, 0.26, 0.17, 0.34, 1)], outline=0.012)
crater.visible_shadow = False
cyl('vent', M['vent'], 0.05, 0.01, segs=16, outline=0, matrix=Matrix.Translation((VX + 0.05, VY, G + 0.345)))
for k, (dx, dz, r) in enumerate(((0.05, 0.42, 0.06), (0.08, 0.52, 0.08), (0.13, 0.62, 0.09))):
    ball(f'steam{k}', M['steam'], VX + dx, VY + 0.02, G + dz, r, outline=0.01)
for k in range(22):
    a = 2 * math.pi * k / 22
    s = rng.uniform(0.72, 0.9)
    x, y = VX + s * 1.0 * math.cos(a), VY + s * 0.62 * math.sin(a)
    if y < -0.25 or math.hypot(x, y) > 1.25:
        continue
    z = 0.28 * (1 - (s - 0.62) / 0.38)
    ball(f'forest{k}', M['forest'], x, y, G + z + 0.05, rng.uniform(0.07, 0.09), outline=0.012)

# ---------- Moroni on the shore: white houses and the old Friday mosque ----------
for k, (x, y) in enumerate(((-0.75, -0.32), (-0.55, -0.38), (-0.95, -0.22), (0.62, -0.35), (0.85, -0.25))):
    box(f'house{k}', M['white'], x, y, G - 0.005, 0.12, 0.1, rng.uniform(0.07, 0.11), outline=0.008, bevel=0)
MX, MY = -0.25, -0.38
box('mosque', M['white'], MX, MY, G - 0.005, 0.2, 0.16, 0.1, outline=0.012, bevel=0)
for k in range(4):
    box(f'mosquearch{k}', M['window'], MX - 0.075 + k * 0.05, MY - 0.084, G, 0.025, 0.01, 0.06, outline=0, bevel=0)
lathe('minaret', M['white'], ((0.03, 0), (0.026, 0.24)), G - 0.005, MX + 0.12, MY - 0.03, segs=10, outline=0.008)
lathe('minarettop', M['green'], ((0.035, 0), (0.035, 0.02), (0.004, 0.06)), G + 0.235, MX + 0.12, MY - 0.03, segs=10, outline=0.005)

# ---------- a dhow on the sea ----------
DX, DY = 0.25, -0.9
loft('dhowhull', M['dhow'], [[(DX - 0.12, DY, G + 0.0), (DX + 0.08, DY - 0.03, G + 0.0), (DX + 0.13, DY, G + 0.0), (DX + 0.08, DY + 0.03, G + 0.0)],
                             [(DX - 0.15, DY, G + 0.06), (DX + 0.08, DY - 0.045, G + 0.045), (DX + 0.17, DY, G + 0.07), (DX + 0.08, DY + 0.045, G + 0.045)]], outline=0.008)
rod('dhowmast', M['dhow'], (DX, DY, G + 0.04), (DX, DY, G + 0.3), 0.006, segs=6, outline=0.002)
loft('dhowsail', M['sail'], [[(DX - 0.13, DY - 0.002, G + 0.08), (DX + 0.1, DY - 0.002, G + 0.12), (DX + 0.02, DY - 0.002, G + 0.31)],
                             [(DX - 0.13, DY + 0.002, G + 0.08), (DX + 0.1, DY + 0.002, G + 0.12), (DX + 0.02, DY + 0.002, G + 0.31)]], outline=0.006)

turn(before, -20)
render(G)
