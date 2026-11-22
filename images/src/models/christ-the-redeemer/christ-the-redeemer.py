# A cartoon Christ the Redeemer for the country maps, built in the set's shared look
# (../toon.py): Corcovado as a low-poly mountain (forest below, bare rock above), the pedestal
# on its summit, and the soapstone figure with its arms spread wide and its long sleeves,
# turned to face the camera.
# Run: blender -b --factory-startup -P christ-the-redeemer.py -- christ-the-redeemer-1024.png 1024 christ-the-redeemer.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'soapstone': toon('soapstone', '#eeede6', shadow_mul=(0.78, 0.80, 0.90), lift=0.2),
    'forest': toon('forest', '#5fa35a', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#a99f93', shadow_mul=(0.75, 0.75, 0.85)),
    'plinth': toon('plinth', '#d9d3c7', shadow_mul=(0.78, 0.8, 0.9)),
})

G = tile()

# ---------- Corcovado: rings of jittered points, faceted ----------
rng = random.Random(4)
SIDES = 11


def ring(r, z, jitter):
    return [(r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             r * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


forest = loft('forest', M['forest'], [ring(1.3, -0.01, 0.0), ring(1.12, 0.24, 0.1), ring(0.88, 0.48, 0.12),
                             ring(0.64, 0.72, 0.12), ring(0.46, 0.9, 0.08)], outline=0.04)
PEAK = 1.3
rock = loft('rock', M['rock'], [ring(0.5, 0.8, 0.06), ring(0.37, 1.04, 0.1), ring(0.26, 1.2, 0.08),
                         ring(0.2, PEAK, 0.0)], outline=0.04)
# the mountain casts no shadow on itself: its faces at a grazing angle to the sun speckled
forest.visible_shadow = rock.visible_shadow = False

# ---------- the pedestal and the figure, built facing the front and turned to the camera ----------
before = set(bpy.data.objects)
box('platform', M['plinth'], 0, 0, G + PEAK - 0.02, 0.34, 0.34, 0.05, outline=0.025, bevel=0.01)
box('pedestal', M['plinth'], 0, 0, G + PEAK + 0.03, 0.2, 0.2, 0.22, outline=0.03, bevel=0.012)
F = G + PEAK + 0.25

# the robe, slim and straight, a little wider at the hem and the chest
PROFILE = ((0.0, 0.15), (0.25, 0.135), (0.5, 0.125), (0.7, 0.15), (0.79, 0.15), (0.85, 0.1), (0.89, 0.06))
SEGS = 20
loft('robe', M['soapstone'],
     [[(r * math.cos(2 * math.pi * k / SEGS), 0.72 * r * math.sin(2 * math.pi * k / SEGS), F + z) for k in range(SEGS)]
      for z, r in PROFILE],
     outline=0.035, smooth=True)

# the arms, straight out, with the sleeves hanging under them
for side in (-1, 1):
    shoulder = Vector((side * 0.12, 0, F + 0.77))
    hand = Vector((side * 0.6, -0.02, F + 0.79))
    rod(f'arm{side}', M['soapstone'], shoulder, hand, 0.055, r2=0.045, outline=0.03)
    ball(f'hand{side}', M['soapstone'], *hand, 0.045, outline=0.025)
    sleeve = [[(side * x, y, F + z) for y, z in ((-dy, z0), (dy, z0), (dy, 0.8), (-dy, 0.8))]
              for x, dy, z0 in ((0.12, 0.05, 0.58), (0.5, 0.035, 0.7))]
    loft(f'sleeve{side}', M['soapstone'], sleeve, outline=0.025)

rod('neck', M['soapstone'], (0, 0, F + 0.84), (0, 0, F + 0.93), 0.04, outline=0.02)
ball('head', M['soapstone'], 0, -0.01, F + 0.99, 0.075, outline=0.03)
turn(before, -32)

render(G)
