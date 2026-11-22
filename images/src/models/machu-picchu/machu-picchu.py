# A cartoon Machu Picchu for the country maps, built in the set's shared look (../toon.py):
# the site's stepped terraces (stone walls, grass on top), its grey stone houses on the top
# (some with their thatch put back), Huayna Picchu's steep green peak behind, and a llama.
# Run: blender -b --factory-startup -P machu-picchu.py -- machu-picchu-1024.png 1024 machu-picchu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#aaa69c', shadow_mul=(0.78, 0.78, 0.86)),
    'hollow': flat('hollow', '#6f6b64'),
    'terrace': toon('terrace', '#7dbb57', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'forest': toon('forest', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'peakrock': toon('peakrock', '#9d988d', shadow_mul=(0.75, 0.75, 0.85)),
    'thatch': toon('thatch', '#c99a4c'),
    'llama': toon('llama', '#f4ead6', shadow_mul=(0.85, 0.8, 0.82)),
    'llamaDark': toon('llamaDark', '#8a6448'),
})

G = tile()

# ---------- Huayna Picchu, the steep peak behind ----------
rng = random.Random(3)
SIDES = 11


def ring(cx, cy, r, z, jitter):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             cy + r * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


PX, PY = 0.28, 0.74
LEAN = 0.1   # the peak leans a little, as mountains do; forest below, bare rock above
peak = loft('peak', M['forest'], [ring(PX, PY, 0.44, -0.01, 0.0), ring(PX + LEAN * 0.3, PY, 0.37, 0.4, 0.12),
                                   ring(PX + LEAN * 0.55, PY, 0.29, 0.8, 0.14), ring(PX + LEAN * 0.65, PY, 0.25, 0.95, 0.1)],
            outline=0.04)
rock = loft('peakrock', M['peakrock'], [ring(PX + LEAN * 0.55, PY, 0.27, 0.86, 0.1), ring(PX + LEAN * 0.8, PY, 0.2, 1.15, 0.16),
                                         ring(PX + LEAN * 0.95, PY, 0.12, 1.42, 0.14), ring(PX + LEAN, PY, 0.04, 1.56, 0.0)],
            outline=0.04)
peak.visible_shadow = rock.visible_shadow = False  # their facets shadowing themselves speckled

# ---------- the terraces: stone walls, grass on top, stepping up to the site ----------
CX, CY = -0.08, -0.02
TIERS, STEP = 5, 0.075
for k in range(TIERS):
    r = 1.24 - k * 0.13
    profile = ((r, 0), (r, STEP * (k + 1)))
    wall = lathe(f'terrace{k}', M['stone'], profile, G - 0.01, CX, CY, segs=40, outline=0.025, smooth=False)
    wall.scale = (1.08, 0.84, 1)
    wall.location = (CX * (1 - 1.08), CY * (1 - 0.84), 0)
    grass = lathe(f'grass{k}', M['terrace'], ((r - 0.012, 0), (r - 0.012, 0.014)), G - 0.01 + STEP * (k + 1), CX, CY,
                  segs=40, outline=0, smooth=False)
    grass.scale = (1.08, 0.84, 1)
    grass.location = (CX * (1 - 1.08), CY * (1 - 0.84), 0)
T = G - 0.01 + STEP * TIERS + 0.014

# ---------- the stone houses on top ----------
HOUSES = ((-0.4, -0.12, 0.22, 0.14, 0.12, True), (-0.1, -0.24, 0.18, 0.12, 0.11, False), (0.2, -0.12, 0.2, 0.13, 0.12, True),
          (-0.24, 0.14, 0.24, 0.14, 0.12, False), (0.08, 0.12, 0.16, 0.12, 0.1, True), (0.34, 0.12, 0.14, 0.12, 0.1, False),
          (-0.5, 0.12, 0.14, 0.12, 0.1, False))
for k, (x, y, w, d, h, thatched) in enumerate(HOUSES):
    box(f'house{k}', M['stone'], x, y, T, w, d, h, outline=0.022, bevel=0.006)
    if thatched:
        z = T + h
        loft(f'thatch{k}', M['thatch'], [[(xx, y - d / 2 - 0.025, z), (xx, y + d / 2 + 0.025, z), (xx, y, z + 0.1)]
                                         for xx in (x - w / 2 - 0.02, x + w / 2 + 0.02)], outline=0.02)
    else:
        box(f'hollow{k}', M['hollow'], x, y, T + h, w - 0.045, d - 0.045, 0.004, outline=0, bevel=0)

# ---------- a llama, side-on ----------
before = set(bpy.data.objects)
LX, LY = 0.98, -0.78
box('llamabody', M['llama'], LX, LY, G + 0.075, 0.15, 0.07, 0.07, outline=0.015, bevel=0.015)
for dx in (-0.05, 0.05):
    for dy in (-0.022, 0.022):
        rod(f'llamaleg{dx}{dy}', M['llama'], (LX + dx, LY + dy, G), (LX + dx, LY + dy, G + 0.08), 0.012, segs=6, outline=0.008)
box('llamaneck', M['llama'], LX - 0.07, LY, G + 0.12, 0.035, 0.035, 0.11, outline=0.012, bevel=0.008)
box('llamahead', M['llama'], LX - 0.09, LY, G + 0.22, 0.06, 0.035, 0.035, outline=0.012, bevel=0.008)
for dy in (-0.01, 0.01):
    rod(f'llamaear{dy}', M['llama'], (LX - 0.065, LY + dy, G + 0.25), (LX - 0.06, LY + dy, G + 0.285), 0.007, r2=0.0, segs=6,
        outline=0.006)
box('llamablanket', M['llamaDark'], LX + 0.005, LY, G + 0.142, 0.07, 0.074, 0.012, outline=0.006, bevel=0)
turn(before, -32, about=(LX, LY))

render(G)
