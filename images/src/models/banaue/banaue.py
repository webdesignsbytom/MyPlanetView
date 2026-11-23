# Cartoon Banaue Rice Terraces for the country maps, built in the set's shared look (../toon.py):
# a mountainside carved into terraces that curve round the valley in steps, each tier bright with
# rice (some flooded and shining, one ripening gold) behind its earth wall, Ifugao houses on
# stilts under their tall thatched roofs, the forest on the summit, and a stream down the valley.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P banaue.py -- banaue-1024.png 1024 banaue.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'rice': toon('rice', '#8cc63f', shadow_mul=(0.7, 0.8, 0.75), lift=0.3),
    'riceLight': toon('riceLight', '#a9d65a', shadow_mul=(0.7, 0.8, 0.75), lift=0.3),
    'riceRipe': toon('riceRipe', '#d6c95a', shadow_mul=(0.82, 0.76, 0.62), lift=0.3),
    'paddy': toon('paddy', '#7cc2b8', shadow_mul=(0.75, 0.84, 0.88), lift=0.35),
    'wall': toon('wall', '#8a6a48', shadow_mul=(0.8, 0.74, 0.78)),
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'thatch': toon('thatch', '#b08a4a', shadow_mul=(0.84, 0.74, 0.62)),
    'hutWood': toon('hutWood', '#6b4a33'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'trunk': toon('trunk', '#7a5238'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(131)

CX, CY, RX, RY = 0.0, 0.38, 1.22, 0.88
TIERS, STEP = 11, 0.075
SIDES = 48
FRONT = -math.pi / 2
ANGLES = [2 * math.pi * k / SIDES for k in range(SIDES)]
# the valley cutting into the front of the mountain, so the terraces curve round it
SHAPE = []
for a in ANGLES:
    gap = math.atan2(math.sin(a - FRONT), math.cos(a - FRONT))
    SHAPE.append(1 - 0.5 * math.exp(-(gap / 0.6) ** 2) + 0.04 * math.sin(4 * a + 0.7))


def contour(k, z):
    s = 1 - k * 0.077
    wobble = [1 + 0.015 * math.sin(5 * a + k) for a in ANGLES]
    return [(CX + RX * s * n * w * math.cos(a), CY + RY * s * n * w * math.sin(a), G + z) for a, n, w in zip(ANGLES, SHAPE, wobble)]


def terrace(name, ring, top_mat, height):
    """An earth wall round the ring, `height` tall, with its field on top (two materials, one outline)."""
    bm = bmesh.new()
    low = [bm.verts.new(p) for p in ring]
    high = [bm.verts.new((x, y, z + height)) for x, y, z in ring]
    n = len(ring)
    for i in range(n):
        f = bm.faces.new((low[i], low[(i + 1) % n], high[(i + 1) % n], high[i]))
        f.material_index = 0
    bm.faces.new(list(reversed(low))).material_index = 0
    top = bm.faces.new(high)
    top.material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (M['wall'], top_mat, toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.02, 1.0, True, False, 2
    ob.visible_shadow = False
    return ob


# ---------- the terraces, tier on tier ----------
FIELDS = ('rice', 'riceLight', 'paddy', 'rice', 'riceRipe', 'riceLight', 'paddy', 'rice', 'riceLight', 'rice', 'forest')
for k in range(TIERS):
    terrace(f'tier{k}', contour(k, k * STEP - 0.01), M[FIELDS[k]], STEP + (0.01 if k == 0 else 0))
TOPZ = G + TIERS * STEP


def spot(k, a):
    """A point in the middle of tier k's field at angle a (radians round from +X), and its height."""
    i = round(a / (2 * math.pi) * SIDES) % SIDES
    s = 1 - (k + 0.5) * 0.077
    return CX + RX * s * SHAPE[i] * math.cos(a), CY + RY * s * SHAPE[i] * math.sin(a), G + (k + 1) * STEP


# ---------- the forest on the summit ----------
for k in range(8):
    a = math.radians(-50 + k * 280 / 7)
    x, y, _ = spot(TIERS - 1, a)
    ball(f'summit{k}', M['forest'], x, y, TOPZ + 0.05, 0.09, outline=0.018)


# ---------- Ifugao houses on stilts under tall thatched roofs ----------
for k, (tier, deg) in enumerate(((2, -150), (4, -35), (6, -125), (1, -20))):
    x, y, z = spot(tier, math.radians(deg))
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f'stilt{k}{sx}{sy}', M['hutWood'], (x + sx * 0.03, y + sy * 0.03, z), (x + sx * 0.03, y + sy * 0.03, z + 0.06), 0.007, segs=6, outline=0)
    box(f'hut{k}', M['hutWood'], x, y, z + 0.06, 0.08, 0.08, 0.04, outline=0.008, bevel=0)
    pyramid(f'hutroof{k}', M['thatch'], x, y, z + 0.09, 0.15, 0.15, outline=0.012)

# ---------- the stream down the valley and trees at its foot ----------
x0, y0, _ = spot(0, FRONT)
STREAM = [(x0, y0 + 0.05), (x0 - 0.06, y0 - 0.25), (x0 + 0.05, y0 - 0.55), (x0 - 0.02, -1.42)]
for k, ((ax, ay), (bx, by)) in enumerate(zip(STREAM, STREAM[1:])):
    box(f'stream{k}', M['water'], (ax + bx) / 2, (ay + by) / 2, G, math.hypot(bx - ax, by - ay) + 0.08, 0.09, 0.008,
        rot_z=math.atan2(by - ay, bx - ax), outline=0.008, bevel=0)
for k, (x, y) in enumerate(((-0.45, -0.85), (0.4, -0.9), (-0.85, -0.6), (0.85, -0.6), (0.2, -1.2), (-0.25, -1.2))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.02, segs=8, outline=0.01)
    ball(f'tree{k}', M['forest'], x, y, G + 0.2, 0.1, outline=0.018)

turn(before, -20)
render(G)
