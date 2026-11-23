# A cartoon Komodo for the country maps, built in the set's shared look (../toon.py): Komodo
# dragons, big grey-brown lizards with long tails and yellow forked tongues, on the island's dry
# grassy hills, a ranger with his forked stick, lontar palms, and a pink-sand beach on the
# turquoise sea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P komodo.py -- komodo-1024.png 1024 komodo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'savanna': toon('savanna', '#c8b070', shadow_mul=(0.86, 0.8, 0.72), lift=0.2),
    'hill': toon('hill', '#a8a060', shadow_mul=(0.82, 0.8, 0.72)),
    'sea': toon('sea', '#3ec4cc', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'pink': toon('pinkSand', '#f4b8b0', shadow_mul=(0.86, 0.78, 0.8), lift=0.2),
    'dragon': toon('dragon', '#7a7060', shadow_mul=(0.84, 0.82, 0.8)),
    'tongue': toon('tongue', '#f0c030', lift=0.3),
    'palm': toon('palm', '#6a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a7458'),
    'ranger': toon('ranger', '#4a6a3a'),
    'skin': toon('skin', '#9a6a4a'),
    'eye': flat('eye', '#2e2a30'),
})

G = tile(M['savanna'])
before = set(bpy.data.objects)
rng = random.Random(1601)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the sea and the pink beach at the front ----------
flat_face('beach', M['pink'], [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in range(190, 351, 4)], G + 0.003, outline=0.006)
flat_face('sea', M['sea'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(208, 333, 4)], G + 0.006, outline=0.01)
# ---------- the dry hills behind ----------
h = loft('hills', M['hill'], [segment(0.4, 1.38, -0.01), segment(0.6, 1.26, 0.26), segment(0.82, 1.08, 0.34)], outline=0.016, smooth=True)
h.visible_shadow = False


# ---------- the dragons ----------
def dragon(name, x, y, a, s=1.0):
    c, sn = math.cos(a), math.sin(a)

    def p(u, v, z):
        return (x + (u * c - v * sn) * s, y + (u * sn + v * c) * s, G + z * s)

    b = ball(f'{name}body', M['dragon'], 0, 0, 0, 0.06 * s, outline=0.008)
    b.scale = (1.9, 1.0, 0.6)
    b.rotation_euler = (0, 0, a)
    b.location = p(0, 0, 0.045)
    rod(f'{name}neck', M['dragon'], p(0.1, 0, 0.05), p(0.16, 0, 0.06), 0.03 * s, r2=0.025 * s, segs=8, outline=0.005)
    hd = ball(f'{name}head', M['dragon'], 0, 0, 0, 0.032 * s, outline=0.005)
    hd.scale = (1.6, 1.0, 0.8)
    hd.rotation_euler = (0, 0, a)
    hd.location = p(0.2, 0, 0.06)
    pts = [p(-0.1 - 0.06 * j, 0.03 * math.sin(j * 0.9), 0.04 - 0.008 * j) for j in range(6)]
    for j in range(5):
        rod(f'{name}tail{j}', M['dragon'], pts[j], pts[j + 1], (0.026 - 0.004 * j) * s, segs=8, outline=0.004)
    for u in (0.06, -0.06):
        for v in (-1, 1):
            bar(f'{name}leg{u}{v}', M['dragon'], p(u, v * 0.045, 0.035), p(u + 0.02, v * 0.08, 0.0), 0.02 * s, outline=0.003)
    bar(f'{name}tongue', M['tongue'], p(0.24, 0, 0.055), p(0.29, 0, 0.05), 0.008 * s, outline=0)
    for v in (-1, 1):
        ball(f'{name}eye{v}', M['eye'], *p(0.215, v * 0.022, 0.075), 0.006 * s, outline=0)


dragon('dragon0', -0.4, -0.12, -0.4, s=1.9)
dragon('dragon1', 0.45, 0.12, 2.7, s=1.6)

# ---------- a ranger, lontar palms ----------
RX, RY = 0.15, -0.38
rod('ranger', M['ranger'], (RX, RY, G), (RX, RY, G + 0.12), 0.02, segs=8, outline=0.004)
ball('rangerhead', M['skin'], RX, RY, G + 0.14, 0.02, outline=0.003)
rod('rangerstick', M['trunk'], (RX + 0.03, RY, G), (RX + 0.04, RY, G + 0.17), 0.005, segs=5, outline=0)
for k, (x, y) in enumerate(((-0.9, 0.2), (0.85, 0.3), (-0.6, 0.55), (0.55, 0.6))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.05), (x, y, G + 0.36), 0.014, segs=8, outline=0.004)
    ball(f'palmcrown{k}', M['palm'], x, y, G + 0.38, 0.07, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
