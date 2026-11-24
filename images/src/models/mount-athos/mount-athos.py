# A cartoon Mount Athos for the country maps, built in the set's shared look (../toon.py): a
# monastery of the Holy Mountain perched on its crag above the Aegean, storey on storey of pale
# walls with wooden balconies hanging over the drop, the red-domed church in its courtyard, a little
# harbour tower below, and the wooded peninsula climbing to Athos's bare marble peak behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P mount-athos.py -- mount-athos-1024.png 1024 mount-athos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'forest': toon('forest', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#9a9086', shadow_mul=(0.84, 0.84, 0.88)),
    'marble': toon('marble', '#e8e6e0', lift=0.2),
    'wall': toon('wall', '#e8dcc0', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'wood': toon('wood', '#6a4a30'),
    'red': toon('red', '#b8503e'),
    'lead': toon('lead', '#7a8088'),
    'dark': flat('dark', '#2e2a28'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sea'])
before = set(bpy.data.objects)


def segment(c, r, z, n=30):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


land = loft('peninsula', M['forest'], [segment(-0.05, 1.33, -0.01), segment(0.02, 1.25, 0.1), segment(0.2, 1.1, 0.16)], outline=0.01, smooth=True)
land.visible_shadow = False
pk = lathe('athos', M['rock'], ((0.42, 0), (0.3, 0.18), (0.18, 0.4), (0.08, 0.58), (0.004, 0.66)), G + 0.1, 0.15, 0.75, segs=9, outline=0.008, smooth=False)
pk.visible_shadow = False
lathe('athospeak', M['marble'], ((0.11, 0), (0.06, 0.1), (0.004, 0.18)), G + 0.58, 0.15, 0.75, segs=9, outline=0.004, smooth=False)

# ---------- the crag and the monastery ----------
MX, MY = -0.2, -0.12
lathe('crag', M['rock'], ((0.3, 0), (0.24, 0.12), (0.2, 0.24), (0.16, 0.3)), G - 0.01, MX, MY, segs=9, outline=0.008, smooth=False)
T = G + 0.29
box('monastery', M['wall'], MX, MY, T - 0.005, 0.28, 0.22, 0.26, outline=0.008, bevel=0)
for r in range(4):
    for j in range(5):
        box(f'mwin{r}{j}', M['dark'], MX - 0.11 + j * 0.055, MY - 0.112, T + 0.03 + r * 0.055, 0.02, 0.006, 0.03, outline=0, bevel=0)
for k, z in enumerate((T + 0.12, T + 0.2)):
    box(f'balcony{k}', M['wood'], MX, MY - 0.14, z, 0.3, 0.06, 0.012, outline=0.002, bevel=0)
    box(f'balconyrail{k}', M['wood'], MX, MY - 0.168, z + 0.01, 0.3, 0.008, 0.035, outline=0.001, bevel=0)
    box(f'balconyroof{k}', M['wood'], MX, MY - 0.14, z + 0.06, 0.3, 0.06, 0.01, outline=0.001, bevel=0)
    for j in range(6):
        bar(f'strut{k}{j}', M['wood'], (MX - 0.13 + j * 0.052, MY - 0.11, z - 0.05), (MX - 0.13 + j * 0.052, MY - 0.165, z), 0.008, outline=0)
loft('monasteryroof', M['red'], [[(MX - 0.15, MY - 0.12, T + 0.255), (MX + 0.15, MY - 0.12, T + 0.255), (MX + 0.15, MY + 0.12, T + 0.255), (MX - 0.15, MY + 0.12, T + 0.255)],
                                 [(MX - 0.15, MY - 0.004, T + 0.32), (MX + 0.15, MY - 0.004, T + 0.32), (MX + 0.15, MY + 0.004, T + 0.32), (MX - 0.15, MY + 0.004, T + 0.32)]], outline=0.005)
box('tower', M['wall'], MX + 0.13, MY + 0.06, T - 0.005, 0.08, 0.08, 0.36, outline=0.005, bevel=0)
pyramid('towerroof', M['red'], MX + 0.13, MY + 0.06, T + 0.355, 0.09, 0.07, outline=0.003)
box('church', M['red'], MX - 0.03, MY + 0.17, T - 0.005, 0.14, 0.1, 0.12, outline=0.004, bevel=0)
lathe('churchdome', M['lead'], ((0.04, 0), (0.04, 0.03), (0.03, 0.06), (0.004, 0.08)), T + 0.115, MX - 0.03, MY + 0.17, segs=12, outline=0.003)

# ---------- the harbour tower ----------
lathe('arsanas', M['wall'], ((0.05, 0), (0.05, 0.16)), G - 0.005, 0.35, -0.3, segs=8, outline=0.004, smooth=False)
pyramid('arsanasroof', M['red'], 0.35, -0.3, G + 0.155, 0.1, 0.06, outline=0.003)
for k, (x, y) in enumerate(((0.5, 0.15), (0.7, 0.3), (-0.6, 0.35), (-0.8, 0.15), (0.45, 0.4), (-0.45, 0.55))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.07, outline=0.006)

turn(before, -20)
render(G)
