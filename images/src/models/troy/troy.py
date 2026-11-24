# A cartoon Troy for the country maps, built in the set's shared look (../toon.py): the great wooden
# horse that stands at the site, its plank body on its wheeled platform with windows in its side and
# a ladder up, beside the ruined sloping stone walls of the citadel, a ramp up to its gate, and a
# few fallen and standing columns among the olive trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P troy.py -- troy-1024.png 1024 troy.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b888', shadow_mul=(0.86, 0.82, 0.74), lift=0.2),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.1),
    'stoneDark': toon('stoneDark', '#b8a888', shadow_mul=(0.84, 0.82, 0.86)),
    'wood': toon('wood', '#a8743e', shadow_mul=(0.86, 0.8, 0.76), lift=0.1),
    'woodDark': toon('woodDark', '#7a5030'),
    'window': flat('window', '#2e2420'),
    'olive': toon('olive', '#7a9a58', shadow_mul=(0.74, 0.8, 0.74)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the ruined walls ----------
for k, (x, y, w, h, rot) in enumerate(((-0.55, 0.45, 0.7, 0.24, 0.15), (0.2, 0.62, 0.55, 0.18, -0.1), (0.7, 0.35, 0.4, 0.2, -0.6))):
    loft(f'wall{k}', M['stone'], [[(x - w / 2 * math.cos(rot) + 0.09 * math.sin(rot), y - w / 2 * math.sin(rot) - 0.09 * math.cos(rot), G - 0.005),
                                   (x + w / 2 * math.cos(rot) + 0.09 * math.sin(rot), y + w / 2 * math.sin(rot) - 0.09 * math.cos(rot), G - 0.005),
                                   (x + w / 2 * math.cos(rot) - 0.09 * math.sin(rot), y + w / 2 * math.sin(rot) + 0.09 * math.cos(rot), G - 0.005),
                                   (x - w / 2 * math.cos(rot) - 0.09 * math.sin(rot), y - w / 2 * math.sin(rot) + 0.09 * math.cos(rot), G - 0.005)],
                                  [(x - w / 2 * math.cos(rot) + 0.03 * math.sin(rot), y - w / 2 * math.sin(rot) - 0.03 * math.cos(rot), G + h),
                                   (x + w / 2 * math.cos(rot) + 0.03 * math.sin(rot), y + w / 2 * math.sin(rot) - 0.03 * math.cos(rot), G + h),
                                   (x + w / 2 * math.cos(rot) - 0.03 * math.sin(rot), y + w / 2 * math.sin(rot) + 0.03 * math.cos(rot), G + h),
                                   (x - w / 2 * math.cos(rot) - 0.03 * math.sin(rot), y - w / 2 * math.sin(rot) + 0.03 * math.cos(rot), G + h)]], outline=0.008)
    for j in range(4):
        t = -w / 2 + (j + 0.5) * w / 4
        box(f'wallcourse{k}{j}', M['stoneDark'], x + t * math.cos(rot), y + t * math.sin(rot) - 0.07, G + 0.04 + 0.04 * (j % 2), w / 4 - 0.02, 0.01, 0.008, rot_z=rot, outline=0, bevel=0)
box('ramp', M['stoneDark'], -0.1, 0.35, G - 0.005, 0.16, 0.36, 0.03, rot_z=0.1, outline=0.004, bevel=0)
for k, (x, y, h) in enumerate(((0.35, 0.15, 0.22), (0.45, 0.12, 0.14), (0.55, 0.1, 0.18))):
    rod(f'column{k}', M['stone'], (x, y, G), (x, y, G + h), 0.025, segs=10, outline=0.004)
rod('fallencolumn', M['stone'], (0.3, -0.05, G + 0.025), (0.5, -0.1, G + 0.025), 0.025, segs=10, outline=0.004)

# ---------- the wooden horse ----------
HX, HY = -0.25, -0.25
box('platform', M['woodDark'], HX, HY, G + 0.03, 0.5, 0.22, 0.04, outline=0.006, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f'wheel{sx}{sy}', M['woodDark'], 0.04, 0.02, segs=12, outline=0.003, matrix=Matrix.Translation((HX + sx * 0.18, HY + sy * 0.12 - (0.02 if sy > 0 else 0), G + 0.04)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for fx in (-0.13, 0.13):
    for s in (-1, 1):
        bar(f'leg{fx}{s}', M['wood'], (HX + fx, HY + s * 0.05, G + 0.07), (HX + fx * 1.05, HY + s * 0.05, G + 0.28), 0.04, outline=0.004)
loft('body', M['wood'], [[(HX - 0.2, HY - 0.08, G + 0.26), (HX + 0.18, HY - 0.08, G + 0.26), (HX + 0.18, HY + 0.08, G + 0.26), (HX - 0.2, HY + 0.08, G + 0.26)],
                         [(HX - 0.22, HY - 0.085, G + 0.4), (HX + 0.2, HY - 0.085, G + 0.4), (HX + 0.2, HY + 0.085, G + 0.4), (HX - 0.22, HY + 0.085, G + 0.4)],
                         [(HX - 0.18, HY - 0.06, G + 0.46), (HX + 0.16, HY - 0.06, G + 0.46), (HX + 0.16, HY + 0.06, G + 0.46), (HX - 0.18, HY + 0.06, G + 0.46)]], outline=0.008)
for j in range(4):
    box(f'plank{j}', M['woodDark'], HX - 0.15 + j * 0.1, HY - 0.087, G + 0.28, 0.006, 0.006, 0.15, outline=0, bevel=0)
for j in range(2):
    box(f'window{j}', M['window'], HX - 0.06 + j * 0.12, HY - 0.088, G + 0.33, 0.05, 0.006, 0.04, outline=0, bevel=0)
loft('neck', M['wood'], [[(HX + 0.1, HY - 0.05, G + 0.42), (HX + 0.2, HY - 0.05, G + 0.42), (HX + 0.2, HY + 0.05, G + 0.42), (HX + 0.1, HY + 0.05, G + 0.42)],
                         [(HX + 0.2, HY - 0.04, G + 0.6), (HX + 0.27, HY - 0.04, G + 0.6), (HX + 0.27, HY + 0.04, G + 0.6), (HX + 0.2, HY + 0.04, G + 0.6)]], outline=0.006)
loft('head', M['wood'], [[(HX + 0.19, HY - 0.045, G + 0.58), (HX + 0.29, HY - 0.045, G + 0.58), (HX + 0.29, HY + 0.045, G + 0.58), (HX + 0.19, HY + 0.045, G + 0.58)],
                         [(HX + 0.19, HY - 0.04, G + 0.66), (HX + 0.4, HY - 0.035, G + 0.6), (HX + 0.4, HY + 0.035, G + 0.6), (HX + 0.19, HY + 0.04, G + 0.66)]], outline=0.006)
for s in (-1, 1):
    lathe(f'ear{s}', M['woodDark'], ((0.015, 0), (0.004, 0.05)), G + 0.64, HX + 0.22, HY + s * 0.025, segs=4, outline=0.002, smooth=False)
box('mane', M['woodDark'], HX + 0.2, HY, G + 0.44, 0.04, 0.03, 0.18, rot_z=0, outline=0.003, bevel=0)
bar('tail', M['woodDark'], (HX - 0.22, HY, G + 0.42), (HX - 0.3, HY, G + 0.25), 0.03, outline=0.003)
for j in range(6):
    bar(f'ladder{j}', M['woodDark'], (HX - 0.05 - 0.02, HY - 0.13, G + 0.07 + j * 0.04), (HX - 0.05 + 0.02, HY - 0.13, G + 0.07 + j * 0.04), 0.006, outline=0)
for s in (-1, 1):
    bar(f'ladderrail{s}', M['woodDark'], (HX - 0.05 + s * 0.02, HY - 0.14, G + 0.05), (HX - 0.05 + s * 0.02, HY - 0.09, G + 0.28), 0.006, outline=0)

# ---------- olive trees ----------
for k, (x, y) in enumerate(((-0.95, -0.2), (0.85, -0.35), (-0.85, -0.6), (0.6, -0.65))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.1), 0.014, segs=6, outline=0.003)
    b = ball(f'olive{k}', M['olive'], 0, 0, 0, 0.09, outline=0.008)
    b.scale = (1.2, 1.0, 0.7)
    b.location = (x + 0.02, y, G + 0.15)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
