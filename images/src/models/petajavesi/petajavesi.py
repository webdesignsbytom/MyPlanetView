# A cartoon Petäjävesi Old Church for the country maps, built in the set's shared look (../toon.py): the
# eighteenth-century log church in central Finland, cross-shaped, its four arms under steep
# shingled roofs, the octagonal lantern and little shingled dome over the crossing, and at the west
# end the bell tower with its skirt roof, octagonal belfry and domed cap; the firs and birches round
# it and the lake behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P petajavesi.py -- petajavesi-1024.png 1024 petajavesi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'logs': toon('logs', '#a07a50'),
    'logsDark': flat('logsDark', '#5e4630'),
    'boards': toon('boards', '#8a6a4a'),
    'shingle': toon('shingle', '#655546', shadow_mul=(0.8, 0.8, 0.86)),
    'stone': toon('stone', '#b8b4aa', lift=0.12),
    'dark': flat('dark', '#2e2a2a'),
    'white': toon('white', '#f4f2ea', lift=0.2),
    'water': toon('water', '#4a8ab0', lift=0.3),
    'fir': toon('fir', '#3a6e3a', shadow_mul=(0.7, 0.78, 0.8)),
    'birch': toon('birch', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#ece8dc'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the lake behind ----------
lake = [(0.55 + 0.42 * math.cos(2 * math.pi * k / 24), 0.78 + 0.26 * math.sin(2 * math.pi * k / 24)) for k in range(24)]
loft('lake', M['water'], [[(x, y, G - 0.004) for x, y in lake], [(x, y, G + 0.006) for x, y in lake]], outline=0.002)

# ---------- the cross-shaped church ----------
CX, CY = 0.1, 0.0
L, A, H = 0.62, 0.22, 0.15
box('plinth', M['stone'], CX, CY, G - 0.005, L + 0.02, A + 0.02, 0.025, outline=0.002, bevel=0)
box('plinth2', M['stone'], CX, CY, G - 0.005, A + 0.02, L + 0.02, 0.025, outline=0.002, bevel=0)
box('armx', M['logs'], CX, CY, G + 0.015, L, A, H, outline=0.006, bevel=0)
box('army', M['logs'], CX, CY, G + 0.015, A, L, H, outline=0.006, bevel=0)
for k in range(5):
    z = G + 0.035 + k * 0.026
    bar(f'logfront{k}', M['logsDark'], (CX - A / 2, CY - L / 2 - 0.003, z), (CX + A / 2, CY - L / 2 - 0.003, z), 0.004, outline=0)
    for s in (-1, 1):
        bar(f'logside{s}{k}', M['logsDark'], (CX + s * A / 2, CY - A / 2 - 0.003, z), (CX + s * L / 2, CY - A / 2 - 0.003, z), 0.004, outline=0)
for s in (-1, 1):
    box(f'win{s}', M['white'], CX + s * 0.2, CY - A / 2 - 0.004, G + 0.07, 0.04, 0.006, 0.055, outline=0, bevel=0)
    box(f'winpane{s}', M['dark'], CX + s * 0.2, CY - A / 2 - 0.007, G + 0.075, 0.03, 0.006, 0.045, outline=0, bevel=0)
box('door', M['dark'], CX, CY - L / 2 - 0.004, G + 0.015, 0.06, 0.006, 0.1, outline=0, bevel=0)
RZ = G + 0.16
loft('roofx', M['shingle'], [[(CX - L / 2 - 0.03, CY - A / 2 - 0.04, RZ), (CX + L / 2 + 0.03, CY - A / 2 - 0.04, RZ), (CX + L / 2 + 0.03, CY + A / 2 + 0.04, RZ), (CX - L / 2 - 0.03, CY + A / 2 + 0.04, RZ)],
                             [(CX - L / 2 - 0.03, CY - 0.004, RZ + 0.26), (CX + L / 2 + 0.03, CY - 0.004, RZ + 0.26), (CX + L / 2 + 0.03, CY + 0.004, RZ + 0.26), (CX - L / 2 - 0.03, CY + 0.004, RZ + 0.26)]], outline=0.005)
loft('roofy', M['shingle'], [[(CX - A / 2 - 0.04, CY - L / 2 - 0.03, RZ), (CX + A / 2 + 0.04, CY - L / 2 - 0.03, RZ), (CX + A / 2 + 0.04, CY + L / 2 + 0.03, RZ), (CX - A / 2 - 0.04, CY + L / 2 + 0.03, RZ)],
                             [(CX - 0.004, CY - L / 2 - 0.03, RZ + 0.26), (CX + 0.004, CY - L / 2 - 0.03, RZ + 0.26), (CX + 0.004, CY + L / 2 + 0.03, RZ + 0.26), (CX - 0.004, CY + L / 2 + 0.03, RZ + 0.26)]], outline=0.005)
# the lantern and dome over the crossing
lathe('lantern', M['boards'], ((0.07, 0), (0.07, 0.08)), RZ + 0.22, CX, CY, segs=8, outline=0.003, smooth=False)
for k in range(4):
    a = -math.pi / 2 + (k - 1.5) * math.pi / 4
    box(f'lanternwin{k}', M['dark'], CX + 0.069 * math.cos(a), CY + 0.069 * math.sin(a), RZ + 0.24, 0.02, 0.006, 0.035, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('dome', M['shingle'], ((0.08, 0), (0.075, 0.03), (0.045, 0.07), (0.02, 0.09), (0.02, 0.11), (0.003, 0.15)), RZ + 0.295, CX, CY, segs=8, outline=0.003, smooth=False)
# the bell tower at the west end
TX, TY = CX - L / 2 - 0.07, CY
box('tower', M['boards'], TX, TY, G - 0.005, 0.15, 0.15, 0.27, outline=0.005, bevel=0)
box('towerdoor', M['dark'], TX, TY - 0.078, G - 0.005, 0.045, 0.006, 0.08, outline=0, bevel=0)
loft('towerskirt', M['shingle'], [[(TX - 0.11, TY - 0.11, G + 0.26), (TX + 0.11, TY - 0.11, G + 0.26), (TX + 0.11, TY + 0.11, G + 0.26), (TX - 0.11, TY + 0.11, G + 0.26)],
                                  [(TX - 0.05, TY - 0.05, G + 0.33), (TX + 0.05, TY - 0.05, G + 0.33), (TX + 0.05, TY + 0.05, G + 0.33), (TX - 0.05, TY + 0.05, G + 0.33)]], outline=0.004)
lathe('belfry', M['boards'], ((0.05, 0), (0.05, 0.08)), G + 0.32, TX, TY, segs=8, outline=0.003, smooth=False)
box('belfryopening', M['dark'], TX, TY - 0.047, G + 0.335, 0.025, 0.006, 0.045, outline=0, bevel=0)
lathe('towercap', M['shingle'], ((0.06, 0), (0.055, 0.03), (0.03, 0.065), (0.003, 0.13)), G + 0.395, TX, TY, segs=8, outline=0.003, smooth=False)
rod('cross', M['dark'], (TX, TY, G + 0.52), (TX, TY, G + 0.58), 0.004, segs=4, outline=0)
bar('crossbar', M['dark'], (TX - 0.015, TY, G + 0.56), (TX + 0.015, TY, G + 0.56), 0.006, outline=0)

# ---------- firs and birches ----------
for k, (x, y, h) in enumerate(((-0.8, 0.45, 0.5), (-0.55, 0.8, 0.6), (-0.95, -0.15, 0.42), (0.95, -0.25, 0.46), (-0.1, 0.95, 0.5))):
    lathe(f'fir{k}', M['fir'], ((0.11, 0), (0.07, h * 0.45), (0.003, h)), G + 0.03, x, y, segs=10, outline=0.006, smooth=False)
for k, (x, y) in enumerate(((0.7, -0.6), (-0.55, -0.7), (0.95, 0.25))):
    rod(f'birchtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.012, segs=6, outline=0.002)
    ball(f'birch{k}', M['birch'], x, y, G + 0.2, 0.1, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
