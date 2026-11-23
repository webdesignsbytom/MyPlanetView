# A cartoon Fujian Tulou for the country maps, built in the set's shared look (../toon.py): a great
# round earth house open to the sky, its thick rammed-earth wall with small windows high up under
# the ring of dark tiled roof, the wooden galleries of its rings of rooms facing the courtyard and
# the ancestral hall in the middle, two smaller tulou beside it, and the green hills behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P fujian-tulou.py -- fujian-tulou-1024.png 1024 fujian-tulou.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#9ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'earth': toon('earth', '#d8b880', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'court': toon('court', '#c8b898'),
    'tile': toon('tile', '#5a5048'),
    'wood': toon('wood', '#8a5a3a'),
    'window': flat('window', '#3a3430'),
    'hill': toon('hill', '#5a9a4a', shadow_mul=(0.72, 0.8, 0.74)),
    'red': toon('red', '#c43a2a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def roofring(name, cx, cy, ro, ri, z0, rise, n=36):
    rm = (ro + ri) / 2
    for k in range(n):
        a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n

        def p(r, a, z):
            return (cx + r * math.cos(a), cy + r * math.sin(a), z)
        loft(f'{name}{k}', M['tile'], [[p(ro, a0, z0), p(ro, a1, z0), p(ri, a1, z0), p(ri, a0, z0)],
                                       [p(rm + 0.006, a0, z0 + rise), p(rm + 0.006, a1, z0 + rise), p(rm - 0.006, a1, z0 + rise), p(rm - 0.006, a0, z0 + rise)]], outline=0.002)


def tulou(name, cx, cy, ro, ri, h, galleries):
    lathe(f'{name}wall', M['earth'], ((ro, 0), (ro, h), (ri, h), (ri, 0.008)), G - 0.005, cx, cy, segs=40, outline=0.008)
    lathe(f'{name}court', M['court'], ((ri - 0.002, 0), (ri - 0.002, 0.006)), G - 0.002, cx, cy, segs=40, outline=0)
    roofring(f'{name}roof', cx, cy, ro + 0.04, ri - 0.03, G + h - 0.008, 0.07)
    for k in range(14):
        a = math.pi * 1.0 + math.pi * k / 13
        box(f'{name}win{k}', M['window'], cx + (ro + 0.002) * math.cos(a), cy + (ro + 0.002) * math.sin(a), G + h - 0.06, 0.02, 0.006, 0.03, rot_z=a + math.pi / 2, outline=0, bevel=0)
    a = -math.pi / 2
    box(f'{name}gate', M['window'], cx, cy - ro - 0.002, G - 0.005, ro * 0.18, 0.008, h * 0.35, outline=0, bevel=0)
    if galleries:
        n = 36
        for fl, z in enumerate((G + 0.07, G + 0.14, G + 0.21)):
            for k in range(n):
                a = 2 * math.pi * (k + 0.5) / n
                box(f'{name}rail{fl}{k}', M['wood'], cx + (ri - 0.012) * math.cos(a), cy + (ri - 0.012) * math.sin(a), z, 2 * math.pi * ri / n * 1.02, 0.012, 0.022, rot_z=a + math.pi / 2, outline=0, bevel=0)
        for k in range(n):
            a = 2 * math.pi * k / n
            rod(f'{name}post{k}', M['wood'], (cx + (ri - 0.016) * math.cos(a), cy + (ri - 0.016) * math.sin(a), G), (cx + (ri - 0.016) * math.cos(a), cy + (ri - 0.016) * math.sin(a), G + h), 0.006, segs=4, outline=0)


for k, (x, y, r, h) in enumerate(((-0.6, 0.85, 0.34, 0.26), (0.1, 0.98, 0.3, 0.3), (0.72, 0.78, 0.3, 0.22))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.65), (r * 0.3, h * 0.95), (0.004, h)), G - 0.01, x, y, segs=24, outline=0.008)
    hl.visible_shadow = False

TX, TY = 0.05, 0.2
tulou('big', TX, TY, 0.5, 0.33, 0.27, True)
box('hall', M['wood'], TX, TY + 0.02, G - 0.005, 0.18, 0.14, 0.08, outline=0.004, bevel=0)
box('halldoor', M['red'], TX, TY - 0.053, G - 0.005, 0.05, 0.006, 0.06, outline=0, bevel=0)
loft('hallroof', M['tile'], [[(TX - 0.11, TY - 0.07, G + 0.075), (TX + 0.11, TY - 0.07, G + 0.075), (TX + 0.11, TY + 0.11, G + 0.075), (TX - 0.11, TY + 0.11, G + 0.075)],
                             [(TX - 0.09, TY + 0.016, G + 0.13), (TX + 0.09, TY + 0.016, G + 0.13), (TX + 0.09, TY + 0.024, G + 0.13), (TX - 0.09, TY + 0.024, G + 0.13)]], outline=0.004)
tulou('left', -0.62, -0.45, 0.24, 0.14, 0.2, False)
tulou('right', 0.64, -0.48, 0.21, 0.12, 0.18, False)

turn(before, -20)
render(G)
