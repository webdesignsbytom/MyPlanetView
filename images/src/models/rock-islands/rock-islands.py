# Cartoon Rock Islands of Palau for the country maps, built in the set's shared look (../toon.py) on
# a tile of turquoise lagoon: dozens of little limestone islands like green mushrooms, each worn
# away at the waterline under its dome of forest, pale shallows round them, a white beach on the
# biggest, a kayak and a speedboat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P rock-islands.py -- rock-islands-1024.png 1024 rock-islands.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#2fc2c9', shadow_mul=(0.72, 0.84, 0.88), lift=0.35),
    'shallows': toon('shallows', '#7fdcd4', shadow_mul=(0.74, 0.86, 0.88), lift=0.35),
    'lime': toon('lime', '#d6d0c0', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'forest': toon('forest', '#3f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forestDark': toon('forestDark', '#2f7f40', shadow_mul=(0.7, 0.78, 0.8)),
    'beach': toon('beach', '#f4ecd6', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'kayak': toon('kayak', '#f08a3a', shadow_mul=(0.8, 0.68, 0.55)),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'stripe': flat('stripe', '#3c6fc4'),
    'skin': toon('skin', '#c98a5a'),
    'shirt': toon('shirt', '#e0453a'),
})

G = tile(M['lagoon'])
before = set(bpy.data.objects)
rng = random.Random(277)


def islet(name, x, y, r, h, big=False):
    """A mushroom islet: limestone worn in at the waterline, forest heaped on top."""
    cyl(f'{name}shallows', M['shallows'], r * 1.5, 0.006, segs=24, outline=0, matrix=Matrix.Translation((x, y, G + 0.002)))
    rock = lathe(f'{name}rock', M['lime'], ((r * 0.7, 0), (r * 0.62, h * 0.18), (r * 0.8, h * 0.45), (r * 1.0, h * 0.7)), G - 0.01, x, y, segs=16,
                 outline=0.016, smooth=False)
    rock.visible_shadow = False
    crown = lathe(f'{name}crown', M['forestDark' if rng.random() < 0.4 else 'forest'],
                  ((r * 1.04, 0), (r * 1.0, h * 0.25), (r * 0.8, h * 0.55), (r * 0.45, h * 0.8), (r * 0.05, h * 0.88)), G - 0.01 + h * 0.68, x, y, segs=16,
                  outline=0.018)
    crown.visible_shadow = False
    for k in range(3 if big else 1):
        a = rng.uniform(0, 2 * math.pi)
        ball(f'{name}tuft{k}', M['forest'], x + r * 0.5 * math.cos(a), y + r * 0.5 * math.sin(a), G + h * 1.3, r * 0.35, outline=0.014)


# ---------- the islands ----------
ISLETS = [(-0.25, 0.45, 0.42, 0.55, True), (0.55, 0.6, 0.3, 0.45, False), (-0.85, 0.15, 0.24, 0.4, False), (0.7, -0.05, 0.2, 0.34, False),
          (0.1, -0.15, 0.14, 0.28, False), (-0.55, -0.4, 0.16, 0.3, False), (0.95, 0.45, 0.12, 0.24, False), (-0.95, 0.65, 0.14, 0.26, False),
          (0.3, -0.62, 0.1, 0.2, False), (-0.15, -0.75, 0.08, 0.17, False), (0.15, 0.95, 0.16, 0.28, False)]
for k, (x, y, r, h, big) in enumerate(ISLETS):
    islet(f'islet{k}', x, y, r, h, big)
# a white beach at the foot of the biggest
bx, by = -0.25, 0.45 - 0.46
loft('beach', M['beach'], [[(bx + 0.2 * math.cos(a), by + 0.08 * math.sin(a), G - 0.005) for a in (2 * math.pi * k / 16 for k in range(16))],
                           [(bx + 0.18 * math.cos(a), by + 0.065 * math.sin(a), G + 0.02) for a in (2 * math.pi * k / 16 for k in range(16))]], outline=0.01)

# ---------- a kayak and a speedboat ----------
KX, KY = -0.35, -0.95
loft('kayak', M['kayak'], [[(KX - 0.13, KY, G - 0.002), (KX, KY - 0.025, G - 0.002), (KX + 0.13, KY, G - 0.002), (KX, KY + 0.025, G - 0.002)],
                           [(KX - 0.14, KY, G + 0.025), (KX, KY - 0.035, G + 0.025), (KX + 0.14, KY, G + 0.025), (KX, KY + 0.035, G + 0.025)]], outline=0.008)
rod('paddler', M['shirt'], (KX, KY, G + 0.02), (KX, KY, G + 0.08), 0.018, segs=8, outline=0.005)
ball('paddlerhead', M['skin'], KX, KY, G + 0.1, 0.018, outline=0.004)
bar('paddle', M['stripe'], (KX - 0.02, KY - 0.08, G + 0.03), (KX + 0.02, KY + 0.08, G + 0.08), 0.007, outline=0)
SX, SY = 0.65, -0.55
loft('speedboat', M['boat'], [[(SX - 0.13, SY - 0.04, G - 0.002), (SX + 0.08, SY - 0.04, G - 0.002), (SX + 0.15, SY, G - 0.002), (SX + 0.08, SY + 0.04, G - 0.002),
                               (SX - 0.13, SY + 0.04, G - 0.002)],
                              [(SX - 0.14, SY - 0.055, G + 0.04), (SX + 0.08, SY - 0.055, G + 0.04), (SX + 0.18, SY, G + 0.04), (SX + 0.08, SY + 0.055, G + 0.04),
                               (SX - 0.14, SY + 0.055, G + 0.04)]], outline=0.01)
box('boatstripe', M['stripe'], SX, SY - 0.054, G + 0.025, 0.2, 0.006, 0.01, outline=0, bevel=0)
box('boatcanopy', M['stripe'], SX - 0.04, SY, G + 0.1, 0.1, 0.1, 0.012, outline=0.005, bevel=0)
for dx in (-0.08, 0.0):
    for dy in (-0.04, 0.04):
        rod(f'canopypole{dx}{dy}', M['boat'], (SX + dx, SY + dy, G + 0.04), (SX + dx, SY + dy, G + 0.1), 0.004, segs=4, outline=0)

turn(before, -20)
render(G)
