# A cartoon Rock of Gibraltar for the country maps, built in the set's shared look (../toon.py):
# the limestone Rock rising from the sea, its sheer north face, green scrub on its western slope and
# bare white cliffs above, the sea caves of Gorham's Cave Complex at its foot, Barbary macaques on
# the top, the town's white houses at the foot, and a ship in the Strait. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P rock-of-gibraltar.py -- rock-of-gibraltar-1024.png 1024 rock-of-gibraltar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'limestone': toon('limestone', '#e8e2d4', shadow_mul=(0.8, 0.8, 0.88), lift=0.15),
    'scrub': toon('scrub', '#6a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'beach': toon('beach', '#e8dcc0', lift=0.2),
    'cave': flat('cave', '#2e2a28'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'roof': toon('roof', '#c4573a'),
    'macaque': toon('macaque', '#a8845a'),
    'face': toon('face', '#e0b0a0'),
    'ship': toon('ship', '#f6f3ec', lift=0.2), 'shipRed': toon('shipRed', '#d0402f'),
    'window': flat('window', '#3a3640'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(751)


def place(made_before, degrees, x, y, z):
    m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


# ---------- the Rock: a long ridge, highest and sheerest at its north (left) end ----------
def section(x, half_w, h, ridge_y):
    """A cross-section of the Rock at x, its foot half_w either side and its crest h up at ridge_y."""
    return [(x, -half_w * 0.9, G - 0.01), (x, half_w * 1.1, G - 0.01), (x, ridge_y + half_w * 0.35, G + h * 0.45), (x, ridge_y + 0.02, G + h),
            (x, ridge_y - 0.02, G + h), (x, ridge_y - half_w * 0.5, G + h * 0.45)]


XS = [(-0.92, 0.32, 0.02), (-0.85, 0.42, 0.62), (-0.6, 0.48, 0.72), (-0.3, 0.5, 0.64), (0.0, 0.5, 0.58), (0.3, 0.46, 0.5), (0.6, 0.38, 0.34), (0.85, 0.3, 0.12),
      (0.98, 0.22, 0.02)]
rings = [section(x, hw, h, 0.05) for x, hw, h in XS]
rock = loft('rock', M['limestone'], rings, outline=0.025)
rock.visible_shadow = False


def slope_y(hw, h, z):
    """Where the Rock's slope facing us is at height z (above its foot), for a section of foot hw and crest h."""
    return -0.9 * hw + z * (0.05 + 0.4 * hw) / max(0.45 * h, 1e-6)


def crest(x):
    for (x0, _, h0), (x1, _, h1) in zip(XS, XS[1:]):
        if x0 <= x <= x1:
            return h0 + (h1 - h0) * (x - x0) / (x1 - x0)
    return 0.0


# the green scrub on the lower slopes facing us: a skin lying just proud of the slope
bm = bmesh.new()
strip = []
for x, hw, h in XS[1:-1]:
    top = 0.8 * 0.45 * h
    strip.append((bm.verts.new((x, slope_y(hw, h, 0) - 0.012, G + 0.002)), bm.verts.new((x, slope_y(hw, h, top) - 0.012, G + top))))
for (a0, a1), (b0, b1) in zip(strip, strip[1:]):
    bm.faces.new((a0, b0, b1, a1))
scrub = finish('scrub', bm, M['scrub'], outline=0.01)
scrub.visible_shadow = False

# ---------- Gorham's Cave Complex: sea caves at the foot, with a beach ----------
loft('cavebeach', M['beach'], [[(0.25, -0.5, G - 0.01), (0.75, -0.42, G - 0.01), (0.75, -0.3, G - 0.01), (0.25, -0.38, G - 0.01)],
                               [(0.25, -0.5, G + 0.015), (0.75, -0.42, G + 0.015), (0.75, -0.3, G + 0.015), (0.25, -0.38, G + 0.015)]], outline=0.006)
for k, (x, w, h) in enumerate(((0.32, 0.07, 0.11), (0.47, 0.09, 0.14), (0.62, 0.06, 0.09))):
    pts = [(x - w / 2, 0.0), (x + w / 2, 0.0)] + [(x + w / 2 * math.cos(t), h - w / 2 + w / 2 * math.sin(t)) for t in (math.pi * j / 8 for j in range(9))]
    hw = next(hw for (x0, hw, _), (x1, _, _) in zip(XS, XS[1:]) if x0 <= x <= x1)
    loft(f'cave{k}', M['cave'], [[(px, slope_y(hw, crest(x), pz) - 0.016, G + pz) for px, pz in pts], [(px, slope_y(hw, crest(x), pz) - 0.006, G + pz) for px, pz in pts]],
         outline=0)

# ---------- the town's white houses at the north-west foot ----------
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in ((-1.1, -0.25), (-0.3, -0.35), (-0.3, -0.72), (-0.95, -0.72))])])
finish('townground', bm, M['beach'], outline=0.008)
for k, (x, y) in enumerate(((-0.85, -0.55), (-0.7, -0.62), (-0.55, -0.58), (-0.98, -0.42), (-0.4, -0.64), (-0.68, -0.48))):
    w = rng.uniform(0.09, 0.12)
    box(f'house{k}', M['white'], x, y, G - 0.005, w, 0.09, rng.uniform(0.07, 0.11), outline=0.008, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.1, w * 1.1, 0.04, outline=0.005)

# ---------- Barbary macaques on the top ----------
for k, (x, deg) in enumerate(((-0.55, -60), (-0.42, -110))):
    made = set(bpy.data.objects)
    ball(f'mbody{k}', M['macaque'], 0, 0, 0.035, 0.03, outline=0.005)
    ball(f'mhead{k}', M['macaque'], 0.03, 0, 0.065, 0.02, outline=0.004)
    ball(f'mface{k}', M['face'], 0.045, 0, 0.062, 0.011, outline=0.002)
    for sy in (-1, 1):
        rod(f'mleg{k}{sy}', M['macaque'], (0.0, sy * 0.015, 0.03), (0.005, sy * 0.018, 0.0), 0.008, segs=5, outline=0.002)
    place(made, deg, x, 0.05, G + crest(x))

# ---------- a ship in the Strait ----------
SX, SY = 0.35, -0.95
loft('shiphull', M['shipRed'], [[(SX - 0.2, SY, G + 0.0), (SX + 0.15, SY - 0.04, G + 0.0), (SX + 0.22, SY, G + 0.0), (SX + 0.15, SY + 0.04, G + 0.0)],
                                [(SX - 0.21, SY, G + 0.05), (SX + 0.15, SY - 0.05, G + 0.05), (SX + 0.25, SY, G + 0.05), (SX + 0.15, SY + 0.05, G + 0.05)]], outline=0.008)
box('shipdeck', M['ship'], SX - 0.08, SY, G + 0.045, 0.12, 0.07, 0.06, outline=0.006, bevel=0)
for k in range(3):
    box(f'shipwin{k}', M['window'], SX - 0.12 + k * 0.04, SY - 0.036, G + 0.075, 0.02, 0.01, 0.015, outline=0, bevel=0)

turn(before, -20)
render(G)
