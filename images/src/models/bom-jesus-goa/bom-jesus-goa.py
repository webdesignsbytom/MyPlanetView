# A cartoon Basilica of Bom Jesus for the country maps, built in the set's shared look (../toon.py):
# Old Goa's baroque church of bare red-brown laterite, its tall three-storey front with the round
# arched doors, the pilasters, the carved panel and the great ornate gable with its IHS emblem, the
# long nave behind, the bell tower at its back, the white Se Cathedral across the lawn, and palms.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P bom-jesus-goa.py -- bom-jesus-goa-1024.png 1024 bom-jesus-goa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d8c8a8'),
    'laterite': toon('laterite', '#b8603e', shadow_mul=(0.86, 0.76, 0.74), lift=0.06),
    'lateriteDark': toon('lateriteDark', '#94482e'),
    'basalt': toon('basalt', '#e8dcc0', lift=0.15),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2622'),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
box('path', M['path'], -0.2, -0.6, G - 0.004, 0.2, 0.7, 0.01, outline=0.001, bevel=0)

# ---------- the basilica ----------
BX, BY = -0.2, 0.0
FW, FH = 0.42, 0.42
box('nave', M['laterite'], BX, BY + 0.38, G - 0.005, 0.32, 0.7, 0.3, outline=0.008, bevel=0)
loft('naveroof', M['roof'], [[(BX - 0.17, BY + 0.03, G + 0.295), (BX + 0.17, BY + 0.03, G + 0.295), (BX + 0.17, BY + 0.73, G + 0.295), (BX - 0.17, BY + 0.73, G + 0.295)],
                             [(BX - 0.004, BY + 0.03, G + 0.39), (BX + 0.004, BY + 0.03, G + 0.39), (BX + 0.004, BY + 0.73, G + 0.39), (BX - 0.004, BY + 0.73, G + 0.39)]], outline=0.005)
box('front', M['laterite'], BX, BY, G - 0.005, FW, 0.06, FH, outline=0.008, bevel=0)
# the storey bands and pilasters in pale basalt
for z in (G + 0.14, G + 0.28):
    box(f'band{z:.2f}', M['basalt'], BX, BY - 0.032, z, FW, 0.006, 0.015, outline=0, bevel=0)
for j in range(5):
    box(f'pilaster{j}', M['basalt'], BX - FW / 2 + 0.02 + j * (FW - 0.04) / 4, BY - 0.032, G - 0.005, 0.02, 0.006, FH, outline=0, bevel=0)
# three doors below, windows above, a round window in the top storey
for j, x in enumerate((BX - 0.1, BX, BX + 0.1)):
    w = 0.05 if j != 1 else 0.06
    box(f'door{j}', M['dark'], x, BY - 0.034, G - 0.005, w, 0.006, 0.09, outline=0, bevel=0)
    cyl(f'doortop{j}', M['dark'], w / 2, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, BY - 0.034, G + 0.085)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'window{j}', M['dark'], x, BY - 0.034, G + 0.18, 0.035, 0.006, 0.06, outline=0, bevel=0)
cyl('oculus', M['dark'], 0.03, 0.006, segs=14, outline=0, matrix=Matrix.Translation((BX, BY - 0.034, G + 0.35)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the great carved gable on top, with scrolls and its IHS emblem
loft('gable', M['laterite'], [[(BX - 0.16, BY - 0.03, G + FH - 0.005), (BX + 0.16, BY - 0.03, G + FH - 0.005), (BX + 0.16, BY + 0.03, G + FH - 0.005), (BX - 0.16, BY + 0.03, G + FH - 0.005)],
                              [(BX - 0.07, BY - 0.03, G + FH + 0.12), (BX + 0.07, BY - 0.03, G + FH + 0.12), (BX + 0.07, BY + 0.03, G + FH + 0.12), (BX - 0.07, BY + 0.03, G + FH + 0.12)]], outline=0.005)
box('gabletop', M['laterite'], BX, BY, G + FH + 0.115, 0.14, 0.06, 0.08, outline=0.004, bevel=0)
cyl('emblem', M['gold'], 0.035, 0.006, segs=14, outline=0.001, matrix=Matrix.Translation((BX, BY - 0.034, G + FH + 0.06)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    cyl(f'scroll{s}', M['basalt'], 0.025, 0.06, segs=10, outline=0.002, matrix=Matrix.Translation((BX + s * 0.15, BY, G + FH + 0.02)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    lathe(f'finial{s}', M['basalt'], ((0.015, 0), (0.008, 0.04)), G + FH + 0.02, BX + s * 0.2, BY, segs=6, outline=0.001, smooth=False)
rod('gablecross', M['basalt'], (BX, BY, G + FH + 0.195), (BX, BY, G + FH + 0.25), 0.006, segs=4, outline=0)
bar('gablecrossbar', M['basalt'], (BX - 0.02, BY, G + FH + 0.235), (BX + 0.02, BY, G + FH + 0.235), 0.008, outline=0)
# the bell tower at the back
box('belltower', M['laterite'], BX + 0.22, BY + 0.62, G - 0.005, 0.12, 0.12, 0.46, outline=0.006, bevel=0)
box('belfry', M['dark'], BX + 0.22, BY + 0.557, G + 0.36, 0.04, 0.006, 0.06, outline=0, bevel=0)
lathe('belltowercap', M['roof'], ((0.075, 0), (0.003, 0.1)), G + 0.455, BX + 0.22, BY + 0.62, segs=4, outline=0.003, smooth=False)

# ---------- the Se Cathedral across the lawn ----------
SX, SY = 0.6, 0.35
box('se', M['white'], SX, SY, G - 0.005, 0.34, 0.5, 0.26, outline=0.007, bevel=0)
loft('seroof', M['roof'], [[(SX - 0.18, SY - 0.25, G + 0.255), (SX + 0.18, SY - 0.25, G + 0.255), (SX + 0.18, SY + 0.25, G + 0.255), (SX - 0.18, SY + 0.25, G + 0.255)],
                           [(SX - 0.004, SY - 0.25, G + 0.34), (SX + 0.004, SY - 0.25, G + 0.34), (SX + 0.004, SY + 0.25, G + 0.34), (SX - 0.004, SY + 0.25, G + 0.34)]], outline=0.004)
box('setower', M['white'], SX - 0.2, SY - 0.2, G - 0.005, 0.12, 0.12, 0.38, outline=0.005, bevel=0)
box('sedoor', M['dark'], SX, SY - 0.253, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.75, -0.3), (0.3, -0.55), (0.75, -0.4), (-0.8, 0.45), (0.95, 0.0))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.32), 0.014, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, G + 0.32), (x + 0.02 + 0.1 * math.cos(a), y + 0.1 * math.sin(a), G + 0.27), 0.022, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
