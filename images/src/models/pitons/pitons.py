# Cartoon Pitons for the country maps, built in the set's shared look (../toon.py) on a tile of the
# Caribbean: Saint Lucia's two volcanic spires rising straight from the sea under their rainforest,
# Gros Piton broad and Petit Piton steep, bare rock showing near their tops, the little bay of
# white sand and palms between them, and a sailing boat at anchor. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pitons.py -- pitons-1024.png 1024 pitons.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fb2c9', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'forest': toon('forest', '#3f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forestDark': toon('forestDark', '#2f7f40', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#8a8278', shadow_mul=(0.78, 0.76, 0.86)),
    'beach': toon('beach', '#f4ecd6', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'sail': toon('sail', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'mast': toon('mast', '#b7bcc4'),
    'stripe': flat('stripe', '#2f6fb8'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(181)
SIDES = 16


def ring(cx, cy, rx, ry, z, jitter):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


def piton(name, cx, cy, base, h, mat):
    """A volcanic spire: forest up its steep sides, bare rock showing near the top."""
    body = loft(name, M[mat], [ring(cx, cy, base, base * 0.85, -0.01, 0.04), ring(cx, cy, base * 0.78, base * 0.68, h * 0.25, 0.08),
                               ring(cx, cy, base * 0.52, base * 0.46, h * 0.55, 0.1), ring(cx, cy, base * 0.32, base * 0.28, h * 0.8, 0.1)],
                outline=0.035)
    top = loft(name + 'top', M['rock'], [ring(cx, cy, base * 0.33, base * 0.29, h * 0.79, 0.06), ring(cx, cy, base * 0.18, base * 0.16, h * 0.94, 0.12),
                                         ring(cx, cy, 0.02, 0.02, h, 0.0)], outline=0.025)
    cap = loft(name + 'crown', M[mat], [ring(cx, cy, base * 0.16, base * 0.14, h * 0.93, 0.1), ring(cx, cy, 0.02, 0.02, h + 0.015, 0.0)],
               outline=0.018)
    body.visible_shadow = top.visible_shadow = cap.visible_shadow = False
    # clumps of forest standing out on the slopes
    for k in range(8):
        a = 2 * math.pi * k / 8 + rng.uniform(-0.2, 0.2)
        t = rng.uniform(0.15, 0.6)
        r = base * (1 - 0.8 * t) * 0.95
        ball(f'{name}clump{k}', M['forestDark' if k % 2 else mat], cx + r * math.cos(a), cy + r * 0.85 * math.sin(a), G + h * t, base * 0.16,
             outline=0.018)


# ---------- the land between and behind them ----------
land = loft('land', M['forest'], [ring(0.0, 0.55, 1.18, 0.7, -0.01, 0.02), ring(0.0, 0.6, 1.08, 0.6, 0.08, 0.03)], outline=0.03)
land.visible_shadow = False
# ---------- Petit Piton (steep) and Gros Piton (broad) ----------
piton('petit', -0.6, 0.3, 0.38, 1.25, 'forest')
piton('gros', 0.58, 0.42, 0.55, 1.35, 'forestDark')

# ---------- the bay between them: white sand and palms ----------
bay = [(0.0 + 0.42 * math.cos(a), -0.05 + 0.16 * math.sin(a)) for a in (2 * math.pi * k / 20 for k in range(20))]
loft('beach', M['beach'], [[(x, y, G - 0.005) for x, y in bay], [(x, y, G + 0.03) for x, y in bay]], outline=0.014)
for k, (x, y) in enumerate(((-0.2, 0.08), (0.05, 0.12), (0.25, 0.05), (-0.05, 0.25))):
    h = rng.uniform(0.2, 0.26)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.03), (x + 0.03, y - 0.02, G + 0.03 + h), 0.014, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        a = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y - 0.02, G + 0.03 + h), (x + 0.03 + 0.1 * math.cos(a), y - 0.02 + 0.1 * math.sin(a), G + h - 0.02),
            0.02, outline=0.006)

# ---------- a sailing boat at anchor ----------
SX, SY = -0.35, -0.72
loft('boathull', M['hull'], [[(SX - 0.14, SY, G - 0.005), (SX + 0.1, SY - 0.03, G - 0.005), (SX + 0.16, SY, G - 0.005), (SX + 0.1, SY + 0.03, G - 0.005)],
                             [(SX - 0.15, SY, G + 0.045), (SX + 0.1, SY - 0.05, G + 0.045), (SX + 0.19, SY, G + 0.045), (SX + 0.1, SY + 0.05, G + 0.045)]],
     outline=0.012)
box('boatstripe', M['stripe'], SX, SY - 0.04, G + 0.03, 0.2, 0.006, 0.01, outline=0, bevel=0)
rod('mast', M['mast'], (SX + 0.02, SY, G + 0.045), (SX + 0.02, SY, G + 0.42), 0.006, segs=6, outline=0.003)
loft('mainsail', M['sail'], [[(SX - 0.12, SY - 0.002, G + 0.07), (SX + 0.015, SY - 0.002, G + 0.07), (SX + 0.015, SY - 0.002, G + 0.4)],
                             [(SX - 0.12, SY + 0.002, G + 0.07), (SX + 0.015, SY + 0.002, G + 0.07), (SX + 0.015, SY + 0.002, G + 0.4)]], outline=0.008)
loft('jib', M['sail'], [[(SX + 0.025, SY - 0.002, G + 0.07), (SX + 0.17, SY - 0.002, G + 0.06), (SX + 0.025, SY - 0.002, G + 0.36)],
                        [(SX + 0.025, SY + 0.002, G + 0.07), (SX + 0.17, SY + 0.002, G + 0.06), (SX + 0.025, SY + 0.002, G + 0.36)]], outline=0.008)

turn(before, -20)
render(G)
