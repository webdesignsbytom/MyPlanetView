# Cartoon Galápagos Islands for the country maps, built in the set's shared look (../toon.py) on a
# tile of the Pacific: a volcanic island, black lava along its shore and a white beach, a volcano
# behind, tree cactuses, and its famous animals: a giant tortoise in the middle, a blue-footed
# booby on a rock, a marine iguana on the lava, and a sea lion asleep on the sand.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P galapagos.py -- galapagos-1024.png 1024 galapagos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3fa3d6', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'lava': toon('lava', '#4f4a48', shadow_mul=(0.8, 0.8, 0.88)),
    'scrub': toon('scrub', '#a3b05e', shadow_mul=(0.74, 0.8, 0.76), lift=0.25),
    'beach': toon('beach', '#f4ecd6', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'slope': toon('slope', '#7f8a52', shadow_mul=(0.74, 0.8, 0.76)),
    'shell': toon('shell', '#6b5a3c', shadow_mul=(0.8, 0.76, 0.8)),
    'scute': toon('scute', '#836f4a', shadow_mul=(0.8, 0.76, 0.8)),
    'tortoise': toon('tortoiseSkin', '#8a8478', shadow_mul=(0.8, 0.8, 0.86)),
    'eye': flat('eye', '#2a2530'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'wing': toon('wing', '#8a6a4a'),
    'blueFoot': toon('blueFoot', '#3fb0e8', shadow_mul=(0.72, 0.8, 0.9), lift=0.35),
    'beak': toon('beak', '#7f97a8', shadow_mul=(0.78, 0.8, 0.9)),
    'iguana': toon('iguana', '#4a4242', shadow_mul=(0.8, 0.78, 0.86)),
    'sealion': toon('sealion', '#8a7464', shadow_mul=(0.8, 0.76, 0.84)),
    'cactusTrunk': toon('cactusTrunk', '#9a6b43'),
    'pad': toon('pad', '#6aa452', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(139)


def place(made_before, degrees, x, y, z=0.0):
    """Turns what was made since `made_before` (built facing +X at the origin) and moves it to (x, y), z higher."""
    m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the island: a lava shore, scrub inland, a white beach at the front ----------
SIDES = 30
IX, IY = 0.0, 0.18
OUT = [1 + 0.07 * math.sin(3 * a + 0.5) + 0.05 * math.sin(5 * a + 1.3) for a in (2 * math.pi * k / SIDES for k in range(SIDES))]


def shore(scale, z):
    return [(IX + 1.05 * scale * n * math.cos(2 * math.pi * k / SIDES), IY + 0.88 * scale * n * math.sin(2 * math.pi * k / SIDES), G + z)
            for k, n in enumerate(OUT)]


loft('lava', M['lava'], [shore(1.0, -0.01), shore(0.97, 0.05)], outline=0.025)
loft('scrub', M['scrub'], [shore(0.9, 0.04), shore(0.88, 0.065)], outline=0.02)
beach = [(IX + 0.55 * math.cos(a) - 0.05, -0.5 + 0.2 * math.sin(a), 0) for a in (2 * math.pi * k / 20 for k in range(20))]
loft('beach', M['beach'], [[(x, y, G + 0.03) for x, y, _ in beach], [(x, y, G + 0.07) for x, y, _ in beach]], outline=0.014)

# ---------- the volcano behind ----------


def cone_ring(cx, cy, r, z, jitter, sides=16):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + r * 0.8 * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


VX, VY = 0.4, 0.72
volcano = loft('volcano', M['slope'], [cone_ring(VX, VY, 0.55, 0.04, 0.03), cone_ring(VX, VY, 0.34, 0.35, 0.08), cone_ring(VX, VY, 0.2, 0.62, 0.06)],
               outline=0.03)
top = loft('volcanotop', M['lava'], [cone_ring(VX, VY, 0.205, 0.615, 0.0), cone_ring(VX, VY, 0.15, 0.7, 0.05), cone_ring(VX, VY, 0.1, 0.65, 0.0)],
           outline=0.022)
volcano.visible_shadow = top.visible_shadow = False

# ---------- tree cactuses ----------
for k, (x, y, h) in enumerate(((-0.6, 0.55, 0.32), (0.92, 0.05, 0.26), (-0.15, 0.78, 0.28))):
    rod(f'cactustrunk{k}', M['cactusTrunk'], (x, y, G + 0.06), (x, y, G + 0.06 + h), 0.03, r2=0.022, segs=8, outline=0.01)
    for j in range(6):
        a = 2 * math.pi * j / 6 + k
        pad = squashed(f'pad{k}{j}', M['pad'], x + 0.07 * math.cos(a), y + 0.07 * math.sin(a), G + 0.06 + h + 0.03 * (j % 3), 0.06, 1, 0.3, 1.3,
                       outline=0.01)
        pad.rotation_euler = (0, 0.35 * math.cos(a), a + math.pi / 2)

# ---------- the giant tortoise ----------
made = set(bpy.data.objects)
for dx in (-0.13, 0.13):
    for dy in (-0.11, 0.11):
        cyl(f'tortoiseleg{dx}{dy}', M['tortoise'], 0.05, 0.1, segs=12, outline=0.012, matrix=Matrix.Translation((dx, dy, G + 0.115)))
shell = lathe('shell', M['shell'], ((0.25, 0), (0.26, 0.05), (0.23, 0.14), (0.15, 0.22), (0.05, 0.255), (0.004, 0.26)), G + 0.09, segs=28,
              outline=0.022)
shell.scale = (1, 0.82, 1)
lathe('shellrim', M['scute'], ((0.265, 0), (0.265, 0.03)), G + 0.09, segs=28, outline=0.012).scale = (1, 0.82, 1)
for k, (x, y, z) in enumerate(((0.0, 0.0, 0.34), (0.11, 0.0, 0.31), (-0.11, 0.0, 0.31), (0.05, 0.1, 0.27), (-0.05, -0.1, 0.27), (0.05, -0.1, 0.27),
                               (-0.05, 0.1, 0.27))):
    squashed(f'scute{k}', M['scute'], x, y, G + z, 0.045, 1, 1, 0.4, outline=0.006)
rod('neck', M['tortoise'], (0.2, 0, G + 0.15), (0.4, 0, G + 0.27), 0.04, r2=0.035, segs=12, outline=0.012)
ball('head', M['tortoise'], 0.43, 0, G + 0.29, 0.055, outline=0.012)
for s in (-1, 1):
    ball(f'eye{s}', M['eye'], 0.46, s * 0.04, G + 0.31, 0.011, outline=0)
place(made, -165, 0.0, -0.12)

# ---------- a blue-footed booby on a rock ----------
RX, RY = 0.72, -0.32
squashed('boobyrock', M['lava'], RX, RY, G + 0.06, 0.13, 1.2, 1, 0.7, outline=0.018).visible_shadow = False
made = set(bpy.data.objects)
Z = G + 0.15
squashed('boobybody', M['white'], 0, 0, Z + 0.07, 0.055, 0.9, 0.8, 1.25, outline=0.012)
for s in (-1, 1):
    squashed(f'boobywing{s}', M['wing'], -0.01, s * 0.04, Z + 0.075, 0.045, 1.2, 0.35, 1.1, outline=0.008)
    box(f'boobyfoot{s}', M['blueFoot'], 0.03, s * 0.025, Z, 0.07, 0.035, 0.016, outline=0.006, bevel=0)
ball('boobyhead', M['white'], 0.01, 0, Z + 0.17, 0.035, outline=0.01)
rod('boobybeak', M['beak'], (0.035, 0, Z + 0.17), (0.09, 0, Z + 0.155), 0.012, r2=0.002, segs=8, outline=0.005)
ball('boobyeye', M['eye'], 0.03, 0.025, Z + 0.18, 0.007, outline=0)
place(made, -120, RX, RY)

# ---------- a marine iguana on the lava ----------
squashed('iguanarock', M['lava'], -0.78, -0.25, G + 0.05, 0.17, 1.4, 1, 0.42, outline=0.018).visible_shadow = False
made = set(bpy.data.objects)
box('iguanabody', M['iguana'], 0, 0, G + 0.06, 0.15, 0.06, 0.045, outline=0.01, bevel=0.01)
box('iguanahead', M['iguana'], 0.1, 0, G + 0.07, 0.06, 0.045, 0.04, outline=0.008, bevel=0.008)
rod('iguanatail', M['iguana'], (-0.07, 0, G + 0.075), (-0.24, 0.05, G + 0.06), 0.02, r2=0.004, segs=8, outline=0.006)
for k in range(6):
    rod(f'crest{k}', M['iguana'], (0.1 - k * 0.035, 0, G + 0.1), (0.1 - k * 0.035, 0, G + 0.125), 0.008, r2=0.0, segs=4, outline=0)
for dx in (-0.05, 0.05):
    for s in (-1, 1):
        bar(f'iguanaleg{dx}{s}', M['iguana'], (dx, s * 0.03, G + 0.07), (dx + 0.02, s * 0.06, G + 0.04), 0.014, outline=0.004)
place(made, -60, -0.78, -0.25, 0.065)

# ---------- a sea lion asleep on the beach ----------
made = set(bpy.data.objects)
squashed('sealionbody', M['sealion'], 0, 0, G + 0.1, 0.09, 1.9, 0.9, 0.55, outline=0.014)
ball('sealionhead', M['sealion'], 0.17, 0, G + 0.11, 0.05, outline=0.01)
for s in (-1, 1):
    box(f'flipper{s}', M['sealion'], 0.07, s * 0.08, G + 0.07, 0.06, 0.04, 0.012, rot_z=s * 0.5, outline=0.006, bevel=0)
box('tailflippers', M['sealion'], -0.19, 0, G + 0.07, 0.06, 0.08, 0.012, outline=0.006, bevel=0)
place(made, 15, 0.12, -0.55)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
