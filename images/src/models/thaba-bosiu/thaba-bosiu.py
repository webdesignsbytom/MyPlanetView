# A cartoon Thaba-Bosiu for the country maps, built in the set's shared look (../toon.py): the
# flat-topped sandstone mountain where Moshoeshoe I founded the Basotho nation, its cliffs banded
# above grassy slopes; at its foot the cultural village, a great thatched building in the shape of
# the mokorotlo, the Basotho hat, round stone rondavels under thatch, and a horseman in his blanket
# and hat on a Basotho pony. Turned a little towards the camera.
# Run: blender -b --factory-startup -P thaba-bosiu.py -- thaba-bosiu-1024.png 1024 thaba-bosiu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#a8b863', shadow_mul=(0.74, 0.8, 0.74), lift=0.25),
    'slope': toon('slope', '#8aa85a', shadow_mul=(0.72, 0.8, 0.76)),
    'sandstone': toon('sandstone', '#c9a06a', shadow_mul=(0.84, 0.74, 0.7)),
    'sandstoneDark': toon('sandstoneDark', '#a8804e', shadow_mul=(0.84, 0.74, 0.7)),
    'thatch': toon('thatch', '#c9a45a', shadow_mul=(0.84, 0.74, 0.62)),
    'thatchDark': toon('thatchDark', '#a8843e', shadow_mul=(0.84, 0.74, 0.62)),
    'stone': toon('stone', '#b8ae9c', shadow_mul=(0.8, 0.8, 0.88)),
    'door': flat('door', '#3a2a22'),
    'pony': toon('pony', '#6b4a33'),
    'blanket': toon('blanket', '#2f6fb8', shadow_mul=(0.72, 0.72, 0.82)),
    'blanketStripe': flat('blanketStripe', '#f4c83c'),
    'skin': toon('skin', '#6b4a33'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(419)


def ring(cx, cy, rx, ry, z, jitter, sides=18):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the flat-topped mountain ----------
MX, MY = -0.05, 0.62
slopes = loft('slopes', M['slope'], [ring(MX, MY, 1.0, 0.55, -0.01, 0.03), ring(MX, MY + 0.03, 0.78, 0.42, 0.22, 0.05)], outline=0.03)
for k, (z0, z1, s0, s1, mat) in enumerate(((0.2, 0.36, 0.8, 0.74, 'sandstone'), (0.36, 0.42, 0.74, 0.72, 'sandstoneDark'), (0.42, 0.56, 0.72, 0.68, 'sandstone'))):
    band = loft(f'cliff{k}', M[mat], [ring(MX, MY + 0.04, s0, s0 * 0.55, z0, 0.03), ring(MX, MY + 0.04, s1, s1 * 0.55, z1, 0.03)], outline=0.03)
    band.visible_shadow = False
top = loft('top', M['slope'], [ring(MX, MY + 0.04, 0.68, 0.37, 0.555, 0.0), ring(MX, MY + 0.05, 0.62, 0.33, 0.6, 0.05)], outline=0.025)
slopes.visible_shadow = top.visible_shadow = False


# ---------- the great mokorotlo building ----------
def mokorotlo(name, x, y, s):
    """The Basotho hat: a cone in stepped bands of thatch, a knob of woven rings on top."""
    lathe(f'{name}wall', M['stone'], ((0.2 * s, 0), (0.2 * s, 0.06 * s)), G - 0.005, x, y, segs=28, outline=0.014)
    z = G + 0.05 * s
    for k, (r0, r1, h) in enumerate(((0.26, 0.2, 0.08), (0.2, 0.14, 0.08), (0.14, 0.08, 0.07), (0.08, 0.04, 0.06))):
        lathe(f'{name}band{k}', M['thatch' if k % 2 == 0 else 'thatchDark'], ((r0 * s, 0), (r1 * s, h * s)), z, x, y, segs=28, outline=0.012)
        z += h * s
    for k in range(3):
        lathe(f'{name}knob{k}', M['thatchDark' if k % 2 else 'thatch'], ((0.035 * s, 0), (0.04 * s, 0.02 * s), (0.03 * s, 0.035 * s)), z + k * 0.03 * s, x, y, segs=16,
              outline=0.006)
    lathe(f'{name}tip', M['thatch'], ((0.02 * s, 0), (0.004, 0.05 * s)), z + 0.09 * s, x, y, segs=10, outline=0.005)
    box(f'{name}door', M['door'], x, y - 0.2 * s - 0.002, G, 0.06 * s, 0.012, 0.05 * s, outline=0, bevel=0)


mokorotlo('hat', 0.2, -0.3, 1.9)


# ---------- rondavels ----------
def rondavel(name, x, y, r):
    lathe(name, M['stone'], ((r, 0), (r, r * 0.7)), G - 0.005, x, y, segs=18, outline=0.012)
    lathe(f'{name}roof', M['thatch'], ((r * 1.2, 0), (r * 0.6, r * 0.45), (0.004, r * 0.85)), G + r * 0.7 - 0.005, x, y, segs=18, outline=0.012)
    box(f'{name}door', M['door'], x, y - r - 0.002, G, r * 0.35, 0.012, r * 0.5, outline=0, bevel=0)


for k, (x, y, r) in enumerate(((-0.62, -0.25, 0.12), (-0.85, 0.05, 0.1), (0.8, -0.05, 0.11), (0.65, 0.25, 0.09))):
    rondavel(f'rondavel{k}', x, y, r)

# ---------- a horseman in his blanket on a Basotho pony ----------
made = set(bpy.data.objects)
for dx in (-0.06, 0.06):
    for sy in (-1, 1):
        rod(f'ponyleg{dx}{sy}', M['pony'], (dx, sy * 0.025, G), (dx, sy * 0.025, G + 0.12), 0.011, segs=6, outline=0.004)
box('ponybody', M['pony'], 0, 0, G + 0.11, 0.17, 0.07, 0.07, outline=0.009, bevel=0.014)
bar('ponyneck', M['pony'], (0.07, 0, G + 0.16), (0.12, 0, G + 0.23), 0.035, outline=0.006)
box('ponyhead', M['pony'], 0.14, 0, G + 0.21, 0.07, 0.03, 0.035, outline=0.006, bevel=0.008)
bar('ponytail', M['pony'], (-0.085, 0, G + 0.17), (-0.1, 0, G + 0.08), 0.014, outline=0)
rod('rider', M['blanket'], (0.0, 0, G + 0.17), (0.0, 0, G + 0.27), 0.04, r2=0.028, segs=10, outline=0.006)
lathe('blanketstripe', M['blanketStripe'], ((0.034, 0), (0.034, 0.012)), G + 0.22, 0.0, 0, segs=10, outline=0)
ball('riderhead', M['skin'], 0.0, 0, G + 0.29, 0.022, outline=0.004)
lathe('riderhat', M['thatch'], ((0.04, 0), (0.025, 0.02), (0.004, 0.05)), G + 0.295, 0.0, 0, segs=12, outline=0.004)
for sy in (-1, 1):
    rod(f'riderleg{sy}', M['blanket'], (0.0, sy * 0.035, G + 0.17), (0.02, sy * 0.045, G + 0.1), 0.012, segs=6, outline=0.003)
m = Matrix.Translation((-0.25, -0.85, 0)) @ Matrix.Rotation(math.radians(-30), 4, 'Z')
bpy.context.view_layer.update()
for ob in set(bpy.data.objects) - made:
    ob.matrix_world = m @ ob.matrix_world

# ---------- tufts ----------
for k in range(20):
    a = rng.uniform(math.radians(190), math.radians(350))
    r = rng.uniform(0.45, 1.3)
    x, y = r * math.cos(a), r * math.sin(a)
    rod(f'tuft{k}', M['slope'], (x, y, G), (x, y, G + 0.045), 0.018, r2=0.0, segs=6, outline=0.004)

turn(before, -20)
render(G)
