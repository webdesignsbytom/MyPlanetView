# A cartoon L'Anse aux Meadows for the country maps, built in the set's shared look (../toon.py):
# the Viking settlement at the tip of Newfoundland, its long houses of thick turf walls with grassy
# roofs and plain wooden doors, smoke holes, a wattle fence, the boulders on the meadow, and the
# grey sea of the bay behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lanse-aux-meadows.py -- lanse-aux-meadows-1024.png 1024 lanse-aux-meadows.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#8ab860', shadow_mul=(0.72, 0.8, 0.78), lift=0.2),
    'sea': toon('sea', '#4a7a9a', shadow_mul=(0.76, 0.84, 0.92), lift=0.25),
    'turf': toon('turf', '#7a8a4a', shadow_mul=(0.76, 0.8, 0.78)),
    'turfDark': toon('turfDark', '#6a5a3a'),
    'grass': toon('grassroof', '#9ac060', lift=0.1),
    'wood': toon('wood', '#7a5a3a'),
    'dark': flat('dark', '#2e2a26'),
    'rock': toon('rock', '#9a968e', shadow_mul=(0.84, 0.84, 0.9)),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(2621)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('sea', M['sea'], [strip(0.55, 1.3, 1.33, -0.004), strip(0.55, 1.3, 1.33, 0.006)], outline=0.004)


def longhouse(name, x, y, L, W, rot):
    mark = set(bpy.data.objects)

    def rr(hw, hh, z, rad, n=4):
        pts = []
        for ox, oy, a0 in ((hw - rad, -hh + rad, -90), (hw - rad, hh - rad, 0), (-hw + rad, hh - rad, 90), (-hw + rad, -hh + rad, 180)):
            for k in range(n + 1):
                a = math.radians(a0 + 90 * k / n)
                pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), z))
        return pts
    loft(f'{name}walls', M['turfDark'], [rr(L / 2, W / 2, G - 0.005, 0.06), rr(L / 2 - 0.01, W / 2 - 0.01, G + 0.08, 0.05)], outline=0.006, smooth=True)
    loft(f'{name}roof', M['grass'], [rr(L / 2, W / 2, G + 0.075, 0.06), rr(L / 2 - 0.04, W * 0.15, G + 0.17, 0.03), rr(L / 2 - 0.08, 0.012, G + 0.19, 0.01)], outline=0.006, smooth=True)
    box(f'{name}door', M['wood'], L * 0.15, -W / 2 - 0.003, G - 0.005, 0.04, 0.012, 0.07, outline=0.001, bevel=0)
    box(f'{name}smoke', M['dark'], -L * 0.15, 0.0, G + 0.185, 0.03, 0.02, 0.012, outline=0, bevel=0)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in [o for o in bpy.data.objects if o not in mark]:
        o.matrix_world = m @ o.matrix_world


longhouse('hall', -0.15, 0.15, 0.62, 0.26, 0.0)
longhouse('house2', 0.45, -0.15, 0.38, 0.22, 0.5)
longhouse('hut', -0.5, -0.35, 0.22, 0.18, -0.3)
for k in range(18):
    t = k / 17
    x, y = -0.85 + 1.4 * t, -0.62 + 0.05 * math.sin(t * 6)
    rod(f'fencepost{k}', M['wood'], (x, y, G - 0.005), (x, y, G + 0.07), 0.008, segs=5, outline=0)
for z in (0.03, 0.055):
    bar(f'fencerail{z}', M['wood'], (-0.85, -0.62, G + z), (0.55, -0.62 + 0.05 * math.sin(6), G + z), 0.008, outline=0)
for k in range(12):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.8, 0.5)
    if math.hypot(x, y) > 1.05 or abs(y - 0.15) < 0.2 and abs(x + 0.15) < 0.4:
        continue
    ball(f'rock{k}', M['rock'], x, y, G + 0.01, rng.uniform(0.03, 0.06), outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
