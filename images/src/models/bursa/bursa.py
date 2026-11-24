# A cartoon Bursa for the country maps, built in the set's shared look (../toon.py): the Green Mosque
# (Yeşil Camii) with its two domes and carved marble doorway, and on the rise beside it the octagonal
# Green Tomb (Yeşil Türbe) of Sultan Mehmed I covered in turquoise tiles under its dome, the tall dark
# cypresses round them, and Mount Uludağ rising behind with snow on its top. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P bursa.py -- bursa-1024.png 1024 bursa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ac05a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'marble': toon('marble', '#eee8dc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'turquoise': toon('turquoise', '#2aa8a0', shadow_mul=(0.78, 0.88, 0.88), lift=0.15),
    'tileDark': toon('tileDark', '#1a7a78'),
    'lead': toon('lead', '#8a929e', shadow_mul=(0.82, 0.86, 0.94), lift=0.12),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'dark': flat('dark', '#2e2a2a'),
    'path': toon('path', '#d8ccb4'),
    'mountain': toon('mountain', '#6a8a6a', shadow_mul=(0.78, 0.82, 0.86)),
    'snow': toon('snow', '#f4f6fa', lift=0.3),
    'cypress': toon('cypress', '#2f5a34', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- Uludağ behind ----------
mt = lathe('uludag', M['mountain'], ((0.52, 0), (0.37, 0.25), (0.2, 0.42), (0.004, 0.5)), G - 0.01, 0.1, 0.78, segs=14, outline=0.008, smooth=False)
mt.visible_shadow = False
lathe('uludagsnow', M['snow'], ((0.205, 0), (0.004, 0.08 + 0.004)), G - 0.01 + 0.42, 0.1, 0.78, segs=14, outline=0.003, smooth=False)


def dome(name, x, y, z, r, mat='lead'):
    lathe(name, M[mat], ((r, 0), (r * 0.97, r * 0.3), (r * 0.82, r * 0.62), (r * 0.5, r * 0.88), (0.004, r)), z, x, y, segs=24, outline=0.004)
    rod(name + 'finial', M['gold'], (x, y, z + r), (x, y, z + r + 0.05), 0.004, segs=4, outline=0)


# ---------- the Green Mosque ----------
MX, MY = -0.3, -0.1
box('mosque', M['marble'], MX, MY, G - 0.005, 0.5, 0.36, 0.22, outline=0.008, bevel=0)
for j in range(4):
    box(f'mosquewin{j}', M['tileDark'], MX - 0.18 + j * 0.12, MY - 0.183, G + 0.06, 0.04, 0.006, 0.07, outline=0, bevel=0)
# the tall carved marble portal with its stalactite niche
box('portal', M['marble'], MX, MY - 0.2, G - 0.005, 0.14, 0.05, 0.27, outline=0.005, bevel=0)
box('portalniche', M['dark'], MX, MY - 0.227, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
box('portalcarving', M['tileDark'], MX, MY - 0.227, G + 0.13, 0.08, 0.006, 0.1, outline=0, bevel=0)
for s in (-1, 1):
    lathe(f'mosquedrum{s}', M['marble'], ((0.1, 0), (0.1, 0.04)), G + 0.215, MX + s * 0.12, MY, segs=8, outline=0.003, smooth=False)
    dome(f'mosquedome{s}', MX + s * 0.12, MY, G + 0.255, 0.1)
# the stump of its minaret
lathe('minaret', M['marble'], ((0.03, 0), (0.026, 0.36)), G - 0.005, MX + 0.28, MY + 0.15, segs=12, outline=0.003, smooth=False)
lathe('minaretbalcony', M['marble'], ((0.026, 0), (0.038, 0.012), (0.038, 0.02)), G + 0.28, MX + 0.28, MY + 0.15, segs=12, outline=0.002)
lathe('minaretcap', M['lead'], ((0.027, 0), (0.003, 0.12)), G + 0.355, MX + 0.28, MY + 0.15, segs=12, outline=0.002)

# ---------- the Green Tomb on its rise ----------
TX, TY = 0.45, 0.25
lathe('rise', M['grass'], ((0.32, 0), (0.28, 0.05), (0.0, 0.07)), G - 0.005, TX, TY, segs=24, outline=0.004)
TZ = G + 0.065
lathe('tomb', M['turquoise'], ((0.17, 0), (0.17, 0.26)), TZ, TX, TY, segs=8, outline=0.007, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    rr = 0.17 * math.cos(math.pi / 8) + 0.003
    box(f'tombwin{k}', M['tileDark'], TX + rr * math.cos(a), TY + rr * math.sin(a), TZ + 0.1, 0.004, 0.05, 0.09, rot_z=a, outline=0, bevel=0)
lathe('tombcornice', M['tileDark'], ((0.18, 0), (0.18, 0.02)), TZ + 0.255, TX, TY, segs=8, outline=0.002, smooth=False)
lathe('tombdrum', M['turquoise'], ((0.13, 0), (0.13, 0.04)), TZ + 0.27, TX, TY, segs=16, outline=0.003)
dome('tombdome', TX, TY, TZ + 0.31, 0.14, mat='turquoise')
box('tombdoor', M['marble'], TX - 0.03, TY - 0.16, TZ, 0.08, 0.03, 0.14, outline=0.002, bevel=0)
box('path', M['path'], TX - 0.2, TY - 0.32, G - 0.004, 0.08, 0.3, 0.01, rot_z=0.6, outline=0.001, bevel=0)

# ---------- cypresses ----------
for k, (x, y) in enumerate(((-0.7, 0.25), (-0.55, 0.45), (0.05, 0.35), (0.85, -0.1), (0.75, 0.6), (0.15, -0.55), (-0.8, -0.5))):
    rod(f'cypresstrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.04), 0.01, segs=6, outline=0.002)
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.05, 0.08), (0.035, 0.22), (0.004, 0.34)), G + 0.03, x, y, segs=10, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
