# Cartoon Sundarbans for the country maps, built in the set's shared look (../toon.py): the mangrove
# forest along a tidal river, the trees standing on their arching stilt roots over the mud with
# their breathing roots poking up round them, a Bengal tiger padding along the bank, and a wooden
# country boat with its boatman on the water. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sundarbans.py -- sundarbans-1024.png 1024 sundarbans.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'mud': toon('mud', '#9a8466', shadow_mul=(0.82, 0.78, 0.8), lift=0.25),
    'river': toon('river', '#6aa7a0', shadow_mul=(0.75, 0.82, 0.86), lift=0.3),
    'root': toon('root', '#7a6048'),
    'leaf': toon('leaf', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'leafLight': toon('leafLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'tiger': toon('tiger', '#ec8a2e', shadow_mul=(0.84, 0.7, 0.58), lift=0.3),
    'stripe': flat('stripe', '#2a2228'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'nose': flat('nose', '#d07a8a'),
    'boat': toon('boat', '#8a5a3c'),
    'boatTrim': toon('boatTrim', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'shirt': toon('shirt', '#f6f3ec', lift=0.2),
    'lungi': toon('lungi', '#2f8a6a', shadow_mul=(0.7, 0.78, 0.8)),
    'skin': toon('skin', '#8a5a3c'),
})

G = tile(M['mud'])
before = set(bpy.data.objects)
rng = random.Random(307)


def place(made_before, degrees, x, y, scale=1.0):
    """Turns what was made since `made_before` (built facing +X at the origin, its feet on G), sizes it and moves it to (x, y)."""
    m = (Matrix.Translation((x, y, G)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z') @ Matrix.Scale(scale, 4)
         @ Matrix.Translation((0, 0, -G)))
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


# ---------- the tidal river across the tile ----------
KNOTS = [(-1.38, 0.25), (-0.8, 0.05), (-0.2, 0.12), (0.35, -0.12), (0.85, -0.05), (1.38, -0.3)]
path = []
for (x0, y0), (x1, y1), (x2, y2) in zip(KNOTS, KNOTS[1:], KNOTS[2:]):
    ax, ay, bx, by = (x0 + x1) / 2, (y0 + y1) / 2, (x1 + x2) / 2, (y1 + y2) / 2
    for j in range(8):
        t = j / 8
        path.append(((1 - t) ** 2 * ax + 2 * (1 - t) * t * x1 + t * t * bx, (1 - t) ** 2 * ay + 2 * (1 - t) * t * y1 + t * t * by))
path = [KNOTS[0]] + path + [KNOTS[-1]]
bm = bmesh.new()
left, right = [], []
for k, (x, y) in enumerate(path):
    (xa, ya), (xb, yb) = path[max(0, k - 1)], path[min(len(path) - 1, k + 1)]
    d = math.hypot(xb - xa, yb - ya) or 1
    px, py = -(yb - ya) / d, (xb - xa) / d
    w = 0.26
    edge = 1.4 - 0.02
    lx, ly = x + px * w, y + py * w
    rx, ry = x - px * w, y - py * w
    for name, (vx, vy) in (('l', (lx, ly)), ('r', (rx, ry))):
        r = math.hypot(vx, vy)
        if r > edge:
            vx, vy = vx * edge / r, vy * edge / r
        (left if name == 'l' else right).append(bm.verts.new((vx, vy, G + 0.006)))
for k in range(len(path) - 1):
    bm.faces.new((left[k], right[k], right[k + 1], left[k + 1]))
finish('river', bm, M['river'], outline=0.012)


# ---------- mangroves on their stilt roots ----------
def mangrove(name, x, y, h, r):
    trunk_base = G + h * 0.35
    rod(f'{name}trunk', M['root'], (x, y, trunk_base), (x, y, G + h), 0.022, r2=0.016, segs=8, outline=0.008)
    for k in range(6):
        a = 2 * math.pi * k / 6 + rng.uniform(-0.2, 0.2)
        mid = Vector((x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), trunk_base + 0.03))
        foot = Vector((x + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G - 0.005))
        rod(f'{name}rootA{k}', M['root'], (x, y, trunk_base), mid, 0.01, segs=6, outline=0.004)
        rod(f'{name}rootB{k}', M['root'], mid, foot, 0.01, segs=6, outline=0.004)
    crown = ball(f'{name}crown', M['leaf' if rng.random() < 0.5 else 'leafLight'], 0, 0, 0, r, outline=0.02)
    crown.scale = (1, 1, 0.7)
    crown.location = (x, y, G + h + r * 0.35)
    for k in range(5):
        a = rng.uniform(0, 2 * math.pi)
        d = rng.uniform(0.16, 0.24)
        px, py = x + d * math.cos(a), y + d * math.sin(a)
        rod(f'{name}pneumato{k}', M['root'], (px, py, G - 0.005), (px, py, G + 0.04), 0.006, r2=0.002, segs=4, outline=0)


TREES = [(-1.0, 0.75, 0.42, 0.2), (-0.55, 0.85, 0.5, 0.22), (-0.1, 0.75, 0.46, 0.2), (0.35, 0.65, 0.5, 0.22), (0.8, 0.55, 0.44, 0.2), (0.3, 1.05, 0.4, 0.18),
         (-0.3, 1.1, 0.38, 0.17), (-1.1, -0.3, 0.38, 0.18), (-0.95, -0.72, 0.42, 0.2), (0.75, -0.7, 0.4, 0.19), (1.05, -0.85, 0.34, 0.16)]
for k, (x, y, h, r) in enumerate(TREES):
    mangrove(f'mangrove{k}', x, y, h, r)

# ---------- the Bengal tiger on the bank ----------
made = set(bpy.data.objects)
for dx in (-0.08, 0.08):
    for s in (-1, 1):
        rod(f'tigerleg{dx}{s}', M['tiger'], (dx + (0.02 if s > 0 else -0.01), s * 0.035, G), (dx, s * 0.035, G + 0.12), 0.02, segs=8, outline=0.006)
body = ball('tigerbody', M['tiger'], 0, 0, 0, 0.1, outline=0.016)
body.scale = (1.35, 0.6, 0.6)
body.location = (0, 0, G + 0.14)
for k in range(5):
    # a thin slice of the body's own oval, a little bigger, so the stripe wraps round it
    x = -0.09 + k * 0.045
    f = math.sqrt(1 - (x / 0.135) ** 2) * 1.07
    stripe = ball(f'tigerstripe{k}', M['stripe'], 0, 0, 0, 0.1, outline=0)
    stripe.scale = (0.2, 0.6 * f, 0.6 * f)
    stripe.location = (x, 0, G + 0.14)
head = ball('tigerhead', M['tiger'], 0.15, 0, G + 0.18, 0.055, outline=0.012)
ball('tigermuzzle', M['white'], 0.195, 0, G + 0.165, 0.03, outline=0.006)
ball('tigernose', M['nose'], 0.222, 0, G + 0.175, 0.009, outline=0)
for s in (-1, 1):
    ball(f'tigerear{s}', M['tiger'], 0.14, s * 0.035, G + 0.23, 0.018, outline=0.004)
    ball(f'tigereye{s}', M['stripe'], 0.195, s * 0.022, G + 0.195, 0.007, outline=0)
    box(f'tigerheadstripe{s}', M['stripe'], 0.13, s * 0.05, G + 0.18, 0.04, 0.008, 0.01, outline=0, bevel=0)
for k, ((x0, z0), (x1, z1)) in enumerate((((-0.13, 0.16), (-0.22, 0.13)), ((-0.22, 0.13), (-0.27, 0.18)))):
    rod(f'tigertail{k}', M['tiger'], (x0, 0, G + z0), (x1, 0, G + z1), 0.014, r2=0.012, segs=8, outline=0.005)
rod('tigertailtip', M['stripe'], (-0.27, 0, G + 0.18), (-0.28, 0, G + 0.2), 0.012, segs=8, outline=0.004)
place(made, -150, -0.25, -0.45, scale=1.7)

# ---------- a country boat and its boatman ----------
made = set(bpy.data.objects)
hull = [(-0.24, 0, G + 0.06), (-0.12, -0.06, G - 0.005), (0.12, -0.06, G - 0.005), (0.24, 0, G + 0.06), (0.12, 0.06, G - 0.005), (-0.12, 0.06, G - 0.005)]
loft('boat', M['boat'], [[(x, y * 0.6, z) for x, y, z in hull], [(x * 1.03, y, z + 0.05) for x, y, z in hull]], outline=0.012)
box('boattrim', M['boatTrim'], 0, -0.062, G + 0.035, 0.24, 0.006, 0.01, outline=0, bevel=0)
loft('awning', M['root'], [[(x, 0.07 * math.cos(math.pi * k / 8), G + 0.07 + 0.08 * math.sin(math.pi * k / 8)) for k in range(9)] for x in (-0.08, 0.08)],
     outline=0.008)
rod('boatman', M['lungi'], (0.16, 0, G + 0.04), (0.16, 0, G + 0.1), 0.02, segs=8, outline=0.005)
rod('boatmantop', M['shirt'], (0.16, 0, G + 0.1), (0.16, 0, G + 0.15), 0.02, segs=8, outline=0.005)
ball('boatmanhead', M['skin'], 0.16, 0, G + 0.17, 0.018, outline=0.004)
bar('pole', M['root'], (0.15, -0.02, G + 0.22), (0.24, -0.08, G - 0.005), 0.007, outline=0)
place(made, 15, 0.55, -0.02)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
