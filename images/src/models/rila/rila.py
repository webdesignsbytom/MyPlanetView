# A cartoon Rila Monastery for the country maps, built in the set's shared look (../toon.py): the
# Church of the Nativity in the middle of the courtyard, its arcades striped red, white and black
# and its grey lead domes; the stone Hrelyo Tower beside it; the monastery's tall wings round the
# courtyard with their rows of arches and dark wooden balconies under broad roofs; and the forested
# Rila mountains all round. The front wing is left out and the side wings splayed a little, so the
# courtyard and all three wings' arcades show.
# Run: blender -b --factory-startup -P rila.py -- rila-1024.png 1024 rila.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ddd3c0', lift=0.25),
    'white': toon('white', '#f3efe6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'red': toon('red', '#b8463a'),
    'black': flat('black', '#2f2a30'),
    'stone': toon('stone', '#b5ab98', shadow_mul=(0.78, 0.78, 0.86)),
    'lead': toon('lead', '#7f868e', shadow_mul=(0.78, 0.78, 0.88)),
    'roof': toon('roof', '#8a6a52'),
    'wood': toon('wood', '#5a3d2b'),
    'window': flat('window', '#33303d'),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#4f8a52', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(199)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def slab(name, mat, pts, y0, y1):
    loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=0)


def round_arch(name, mat, x, z0, w, h, y0, y1):
    """A round-headed arch shape: posts to h, a half circle above."""
    r = w / 2
    top = [(x + r * math.cos(t), z0 + h + r * math.sin(t)) for t in (math.pi * k / 10 for k in range(11))]
    slab(name, mat, [(x - r, z0), (x + r, z0)] + top, y0, y1)


def striped_arch(name, x, z0, w, h, y):
    """Rila's arches: a red band, a white one inside it, the dark opening."""
    round_arch(name + 'red', M['red'], x, z0, w, h, y - 0.004, y + 0.002)
    round_arch(name + 'white', M['white'], x, z0, w * 0.78, h, y - 0.008, y - 0.002)
    round_arch(name + 'open', M['black'], x, z0, w * 0.55, h, y - 0.012, y - 0.006)


# ---------- the forested mountains all round ----------
def ring(cx, cy, rx, ry, z, jitter, sides=12):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


for k, (cx, cy, r, h) in enumerate(((-0.5, 0.95, 0.36, 0.95), (0.35, 0.98, 0.38, 1.1))):
    mtn = loft(f'mountain{k}', M['mountain'], [ring(cx, cy, r, r * 0.6, -0.01, 0.0), ring(cx, cy, r * 0.6, r * 0.38, h * 0.55, 0.12),
                                               ring(cx, cy, r * 0.25, r * 0.15, h * 0.88, 0.12), ring(cx, cy, 0.02, 0.02, h, 0.0)], outline=0.035)
    mtn.visible_shadow = False
for k in range(14):
    a = math.radians(rng.uniform(-25, 205)) if k < 10 else math.radians(rng.choice((rng.uniform(205, 235), rng.uniform(305, 335))))
    r = rng.uniform(1.05, 1.28)
    x, y = r * math.cos(a), r * math.sin(a) * 0.92
    rod(f'fir{k}', M['forest'], (x, y, G), (x, y, G + rng.uniform(0.28, 0.4)), rng.uniform(0.07, 0.09), r2=0.0, segs=8, outline=0.016)

# ---------- the courtyard ----------
box('courtyard', M['paving'], 0, 0.1, G - 0.005, 1.5, 1.2, 0.012, outline=0.01, bevel=0)


# ---------- the wings round it, each built facing -Y ----------
def wing(name, length, depth=0.22, floors=4):
    fh = 0.1
    h = floors * fh
    box(f'{name}', M['white'], 0, 0, G - 0.005, length, depth, h, outline=0.022, bevel=0)
    bays = int(length / 0.09)
    for f in range(floors):
        for b in range(bays):
            x = -length / 2 + (b + 0.5) * length / bays
            if f < 2:
                striped_arch(f'{name}arch{f}{b}', x, G + f * fh + 0.01, 0.06, 0.04, -depth / 2)
            else:
                box(f'{name}win{f}{b}', M['window'], x, -depth / 2 - 0.004, G + f * fh + 0.025, 0.025, 0.01, 0.045, outline=0, bevel=0)
        if f >= 2:
            box(f'{name}balcony{f}', M['wood'], 0, -depth / 2 - 0.02, G + f * fh, length, 0.04, 0.012, outline=0.006, bevel=0)
            box(f'{name}rail{f}', M['wood'], 0, -depth / 2 - 0.038, G + f * fh + 0.012, length, 0.006, 0.03, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(-length / 2 - 0.02, -depth / 2 - 0.06, G + h), (length / 2 + 0.02, -depth / 2 - 0.06, G + h),
                                     (length / 2 + 0.02, depth / 2 + 0.03, G + h), (-length / 2 - 0.02, depth / 2 + 0.03, G + h)],
                                    [(-length / 2 + 0.02, -0.01, G + h + 0.1), (length / 2 - 0.02, -0.01, G + h + 0.1), (length / 2 - 0.02, 0.01, G + h + 0.1),
                                     (-length / 2 + 0.02, 0.01, G + h + 0.1)]], outline=0.02)


b = set(bpy.data.objects)
wing('backwing', 1.4)
place(b, 0, 0.0, 0.72)
b = set(bpy.data.objects)
wing('leftwing', 0.85)
place(b, 62, -0.78, 0.0)
b = set(bpy.data.objects)
wing('rightwing', 0.85)
place(b, -62, 0.78, 0.0)

# ---------- the Church of the Nativity ----------
CX, CY, CW, CD, CH = -0.05, 0.08, 0.6, 0.4, 0.24
box('church', M['white'], CX, CY, G - 0.005, CW, CD, CH, outline=0.024, bevel=0.003)
box('churchroof', M['lead'], CX, CY, G + CH - 0.005, CW + 0.02, CD + 0.02, 0.03, outline=0.014, bevel=0)
# the open arcade along its front, striped
box('porch', M['white'], CX, CY - CD / 2 - 0.06, G - 0.005, CW, 0.12, 0.17, outline=0.018, bevel=0)
for k in range(7):
    striped_arch(f'porcharch{k}', CX - CW / 2 + 0.045 + k * (CW - 0.09) / 6, G, 0.065, 0.09, CY - CD / 2 - 0.12)
box('porchroof', M['lead'], CX, CY - CD / 2 - 0.06, G + 0.165, CW + 0.02, 0.14, 0.02, outline=0.01, bevel=0)
# its domes on their drums
for k, (dx, dy, r) in enumerate(((0.0, 0.03, 0.09), (-0.2, 0.0, 0.06), (0.2, 0.0, 0.06), (-0.2, 0.12, 0.05), (0.2, 0.12, 0.05))):
    z = G + CH + 0.02
    lathe(f'drum{k}', M['white'], ((r, 0), (r, r * 1.3)), z, CX + dx, CY + dy, segs=12, outline=0.014, smooth=False)
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        box(f'drumwin{k}{j}', M['window'], CX + dx + r * math.cos(a), CY + dy + r * math.sin(a), z + r * 0.4, 0.015, 0.015, r * 0.6, rot_z=a,
            outline=0, bevel=0)
    lathe(f'dome{k}', M['lead'], ((r * 1.08, 0), (r * 1.05, r * 0.45), (r * 0.75, r * 0.85), (r * 0.3, r * 1.05), (0.004, r * 1.1)), z + r * 1.3,
          CX + dx, CY + dy, segs=16, outline=0.012)
    rod(f'cross{k}', M['gold'], (CX + dx, CY + dy, z + r * 2.4), (CX + dx, CY + dy, z + r * 2.4 + 0.05), 0.005, segs=6, outline=0)

# ---------- the Hrelyo Tower ----------
TX, TY = 0.32, 0.3
box('hrelyo', M['stone'], TX, TY, G - 0.005, 0.18, 0.18, 0.62, outline=0.022, bevel=0.003)
for k, z in enumerate((0.25, 0.4, 0.52)):
    box(f'hrelyowin{k}', M['window'], TX, TY - 0.092, G + z, 0.025, 0.01, 0.05, outline=0, bevel=0)
box('hrelyotop', M['stone'], TX, TY, G + 0.615, 0.2, 0.2, 0.04, outline=0.014, bevel=0)
pyramid('hrelyoroof', M['lead'], TX, TY, G + 0.655, 0.16, 0.12, outline=0.014)
rod('hrelyocross', M['gold'], (TX, TY, G + 0.77), (TX, TY, G + 0.82), 0.005, segs=6, outline=0)

turn(before, -32)
render(G)
