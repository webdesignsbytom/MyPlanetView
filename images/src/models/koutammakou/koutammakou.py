# A cartoon Koutammakou for the country maps, built in the set's shared look (../toon.py) on a tile of
# savanna: the Batammariba's takienta, the two-storey earthen tower houses, round towers joined by
# curving mud walls, granaries under pointed thatched roofs, the flat roof terrace with its low
# parapet and the low doorway; a second house beyond, baobabs, and the grass of the plain.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P koutammakou.py -- koutammakou-1024.png 1024 koutammakou.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'savanna': toon('savanna', '#c9b46a', shadow_mul=(0.82, 0.76, 0.62), lift=0.25),
    'tuft': toon('tuft', '#a89a52', shadow_mul=(0.8, 0.78, 0.7)),
    'earth': toon('earth', '#b0784e', shadow_mul=(0.84, 0.72, 0.7)),
    'earthLight': toon('earthLight', '#c48c5e', shadow_mul=(0.84, 0.72, 0.7)),
    'thatch': toon('thatch', '#c9a45a', shadow_mul=(0.84, 0.74, 0.62)),
    'door': flat('door', '#3a2a22'),
    'baobab': toon('baobab', '#a89a8a', shadow_mul=(0.8, 0.78, 0.84)),
    'leaf': toon('leaf', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['savanna'])
before = set(bpy.data.objects)
rng = random.Random(397)


def tower_house(name, cx, cy, s):
    """A takienta: round towers ringing a flat roof terrace, joined by curving mud walls."""
    towers = []
    for k, (a, r, h, granary) in enumerate(((200, 0.11, 0.3, True), (250, 0.09, 0.26, False), (300, 0.11, 0.3, True), (20, 0.1, 0.28, True),
                                            (90, 0.09, 0.26, False), (140, 0.1, 0.28, True))):
        x, y = cx + 0.24 * s * math.cos(math.radians(a)), cy + 0.2 * s * math.sin(math.radians(a))
        r, h = r * s, h * s
        lathe(f'{name}tower{k}', M['earth' if k % 2 else 'earthLight'], ((r, 0), (r * 0.94, h)), G - 0.005, x, y, segs=18, outline=0.016)
        if granary:
            # the granary on top, under its pointed thatch
            lathe(f'{name}granary{k}', M['earthLight'], ((r * 0.75, 0), (r * 0.8, 0.07 * s)), G + h, x, y, segs=16, outline=0.012)
            lathe(f'{name}thatch{k}', M['thatch'], ((r * 1.1, 0), (r * 0.5, 0.08 * s), (0.004, 0.16 * s)), G + h + 0.065 * s, x, y, segs=16, outline=0.012)
            rod(f'{name}spike{k}', M['thatch'], (x, y, G + h + 0.22 * s), (x, y, G + h + 0.27 * s), 0.008, segs=6, outline=0.003)
        towers.append((x, y))
    # curving mud walls between the towers
    for k, ((x0, y0), (x1, y1)) in enumerate(zip(towers, towers[1:] + towers[:1])):
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        bar(f'{name}wall{k}', M['earth'], (x0, y0, G + 0.09 * s), (x1, y1, G + 0.09 * s), 0.17 * s, outline=0.012)
    # the flat roof terrace and its low parapet
    terrace = [(cx + 0.22 * s * math.cos(t), cy + 0.18 * s * math.sin(t)) for t in (2 * math.pi * k / 16 for k in range(16))]
    loft(f'{name}terrace', M['earthLight'], [[(x, y, G + 0.17 * s) for x, y in terrace], [(x, y, G + 0.2 * s) for x, y in terrace]], outline=0.012)
    # the low doorway at the front
    dx, dy = cx + 0.24 * s * math.cos(math.radians(275)), cy + 0.2 * s * math.sin(math.radians(275))
    box(f'{name}door', M['door'], dx, dy - 0.07 * s, G, 0.05 * s, 0.012, 0.09 * s, outline=0, bevel=0)
    for k in range(3):
        box(f'{name}vent{k}', M['door'], cx - 0.06 * s + k * 0.06 * s, cy - 0.2 * s, G + 0.14 * s, 0.015, 0.012, 0.015, outline=0, bevel=0)


tower_house('house1', 0.0, 0.0, 1.6)
tower_house('house2', 0.7, 0.68, 0.95)


# ---------- baobabs ----------
def baobab(name, x, y, s):
    lathe(name, M['baobab'], ((0.12 * s, 0), (0.11 * s, 0.12 * s), (0.08 * s, 0.32 * s), (0.07 * s, 0.4 * s)), G - 0.005, x, y, segs=14, outline=0.016)
    for k in range(5):
        a = 2 * math.pi * k / 5 + x
        p1 = (x + 0.18 * s * math.cos(a), y + 0.18 * s * math.sin(a), G + 0.5 * s)
        rod(f'{name}branch{k}', M['baobab'], (x, y, G + 0.38 * s), p1, 0.025 * s, r2=0.012 * s, segs=6, outline=0.006)
        b = ball(f'{name}leaf{k}', M['leaf'], 0, 0, 0, 0.07 * s, outline=0.012)
        b.scale = (1.2, 1.2, 0.6)
        b.location = p1


baobab('baobab1', -0.85, 0.55, 1.2)
baobab('baobab2', 0.95, -0.35, 0.9)

# ---------- grass tufts ----------
for k in range(24):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.55, 1.3)
    x, y = r * math.cos(a), r * math.sin(a)
    if math.hypot(x - 0.7, y - 0.68) < 0.3:
        continue
    rod(f'tuft{k}', M['tuft'], (x, y, G), (x, y, G + 0.06), 0.02, r2=0.0, segs=6, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
