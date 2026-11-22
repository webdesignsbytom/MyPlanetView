# A cartoon Milford Sound for the country maps, built in the set's shared look (../toon.py) on a
# tile of dark fjord water: Mitre Peak rising sheer and pointed from the water, steep green
# mountains either side, a waterfall pouring down a cliff into the sound, and a little white
# cruise boat with a red funnel. Turned a little towards the camera.
# Run: blender -b --factory-startup -P milford-sound.py -- milford-sound-1024.png 1024 milford-sound.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'fjord': toon('fjord', '#2f7f8f', shadow_mul=(0.75, 0.82, 0.9), lift=0.3),
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#7d7a76', shadow_mul=(0.76, 0.76, 0.86)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'foamBlue': toon('foamBlue', '#bfe3f5', shadow_mul=(0.82, 0.86, 0.95), lift=0.15),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.92)),
    'funnel': toon('funnel', '#d8463a'),
    'window': flat('window', '#3f4a66'),
})

G = tile(M['fjord'])
before = set(bpy.data.objects)
rng = random.Random(41)


def ring(cx, cy, r, z, jitter, sides=11, squash=1.0):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + r * squash * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def mountain(name, cx, cy, r, h, snow=False, squash=1.0):
    """Forest on the steep lower slopes, bare rock above, a point at the top."""
    low = loft(name, M['forest'], [ring(cx, cy, r, -0.01, 0.0, squash=squash), ring(cx, cy, r * 0.82, h * 0.3, 0.1, squash=squash),
                                   ring(cx, cy, r * 0.62, h * 0.52, 0.1, squash=squash)], outline=0.035)
    high = loft(name + 'rock', M['rock'], [ring(cx, cy, r * 0.64, h * 0.46, 0.08, squash=squash),
                                           ring(cx, cy, r * 0.36, h * 0.75, 0.12, squash=squash), ring(cx, cy, 0.03, h, 0.0)],
                outline=0.035)
    low.visible_shadow = high.visible_shadow = False
    if snow:
        cap = loft(name + 'snow', M['snow'], [ring(cx, cy, r * 0.2, h * 0.84, 0.12), ring(cx, cy, 0.03, h + 0.01, 0.0)], outline=0.02)
        cap.visible_shadow = False


# ---------- Mitre Peak and the mountains either side of the sound ----------
mountain('mitre', -0.42, 0.55, 0.46, 1.55, snow=True)
mountain('east', 0.78, 0.42, 0.55, 1.0, squash=0.8)
mountain('west', -1.0, -0.15, 0.36, 0.62)
mountain('back', 0.2, 1.05, 0.38, 0.85, snow=True)

# ---------- the waterfall down the east mountain's cliff ----------
FX, FY = 0.42, 0.12
cliff = loft('cliff', M['rock'], [[(FX - 0.12, FY - 0.02, G - 0.01), (FX + 0.12, FY - 0.02, G - 0.01), (FX + 0.14, FY + 0.2, G - 0.01),
                                   (FX - 0.14, FY + 0.2, G - 0.01)],
                                  [(FX - 0.1, FY + 0.02, G + 0.62), (FX + 0.1, FY + 0.02, G + 0.62), (FX + 0.12, FY + 0.22, G + 0.62),
                                   (FX - 0.12, FY + 0.22, G + 0.62)]], outline=0.03)
cliff.visible_shadow = False
for k, (dx, mat) in enumerate(((-0.05, 'foam'), (0.0, 'foamBlue'), (0.05, 'foam'))):
    loft(f'fall{k}', M[mat], [[(FX + dx - 0.025, FY - 0.03, G), (FX + dx + 0.025, FY - 0.03, G), (FX + dx + 0.025, FY - 0.01, G),
                               (FX + dx - 0.025, FY - 0.01, G)],
                              [(FX + dx - 0.022, FY + 0.005, G + 0.6), (FX + dx + 0.022, FY + 0.005, G + 0.6),
                               (FX + dx + 0.022, FY + 0.02, G + 0.6), (FX + dx - 0.022, FY + 0.02, G + 0.6)]], outline=0.008)
for k, (dx, r) in enumerate(((-0.09, 0.06), (0.0, 0.075), (0.09, 0.055))):
    ball(f'spray{k}', M['foam'], FX + dx, FY - 0.07, G + 0.01, r, outline=0.014)

# ---------- a little cruise boat ----------
BX, BY = -0.15, -0.72
hull = [(-0.26, 0), (-0.2, -0.07), (0.2, -0.07), (0.3, 0), (0.2, 0.07), (-0.2, 0.07)]
loft('hull', M['hull'], [[(BX + x * 0.85, BY + y * 0.85, G - 0.005) for x, y in hull], [(BX + x, BY + y, G + 0.07) for x, y in hull]],
     outline=0.018)
box('deck1', M['hull'], BX - 0.02, BY, G + 0.07, 0.34, 0.11, 0.06, outline=0.014, bevel=0.004)
box('deck2', M['hull'], BX - 0.05, BY, G + 0.13, 0.2, 0.09, 0.05, outline=0.012, bevel=0.004)
for k in range(5):
    box(f'boatwin{k}', M['window'], BX - 0.15 + k * 0.065, BY - 0.056, G + 0.09, 0.035, 0.01, 0.022, outline=0, bevel=0)
lathe('funnelpipe', M['funnel'], ((0.025, 0), (0.022, 0.07)), G + 0.18, BX + 0.0, BY, segs=12, outline=0.01)

turn(before, -20)
render(G)
