"""Ruční oprava masky výřezu z hero.jpg (Alena při driblingu).

Vision vzal do postavy i kus tmavého pozadí mezi pravou rukou a černým
návlekem na levé noze (od stehna ke kolenu) a tmavý lem u prstů. Návlek
a pozadí mají skoro stejný jas, proto se to automaticky nerozliší.

Oprava: levá hrana návleku je odečtená ručně po řádcích (body níže, souřadnice
v hero.jpg 960 × 1200). Nalevo od ní se v pásu y 560–880 vymažou tmavé pixely.
Kůže ruky je světlá, takže zůstane. U prstů (od y 745) je práh nižší, protože
stíny mezi prsty jsou tmavé, ale pořád světlejší než pozadí. Na hraně návleku
je měkký přechod 2 px.

    python3 blender/oprava-masky.py <hero.jpg> <maska.png> <výstup.png>

Maska je 8bitová šedá z cutout.swift (třetí argument). Potřebuje ImageMagick.
"""

import subprocess
import sys

SOURCE, MASK, OUT = sys.argv[1:4]
W, H = 960, 1200

# levá hrana návleku: (y, x)
# Nahoře (u šortek) a od kolene dolů je hrana změřená: stínovaná strana návleku
# je tmavší než pozadí (jas 1–5 proti 8–10). Na stehně (y 640–760) mají obě
# plochy stejný jas, tam je hrana vedená přirozeným obloukem stehna — první
# verze byla o 7–12 px užší a noha působila hubenější než druhá.
EDGE = [
    (560, 438), (575, 447), (600, 461), (620, 473), (640, 484), (660, 495),
    (680, 505), (700, 514), (720, 522), (740, 530), (760, 537), (780, 543),
    (800, 548), (820, 552), (840, 555), (860, 558), (880, 561),
]
X_MIN = 420          # vlevo od toho je druhá noha, nesahat
DARK_ARM = 22        # jas 0–255: pod tím je to pozadí, ne kůže paže
DARK_HAND = 13       # u prstů přísněji, stíny mezi nimi jsou kolem 15–40
HAND_Y = 745
SKIN = 60            # 1 px od takhle světlé kůže se nemaže (hladký okraj paže)
FEATHER = 2.0


def read_gray(path):
    return bytearray(subprocess.run(
        ['magick', path, '-colorspace', 'Gray', '-depth', '8', 'gray:-'],
        stdout=subprocess.PIPE, check=True).stdout)


def edge_x(y):
    for (y0, x0), (y1, x1) in zip(EDGE, EDGE[1:]):
        if y0 <= y <= y1:
            return x0 + (x1 - x0) * (y - y0) / (y1 - y0)
    return None


lum = read_gray(SOURCE)
mask = read_gray(MASK)
assert len(lum) == len(mask) == W * H, 'čekám 960 × 1200'

changed = 0
for y in range(EDGE[0][0], EDGE[-1][0] + 1):
    ex = edge_x(y)
    for x in range(X_MIN, int(ex + FEATHER) + 1):
        i = y * W + x
        hand = y >= HAND_Y
        if mask[i] == 0 or lum[i] >= (DARK_HAND if hand else DARK_ARM):
            continue
        if not hand and any(lum[(y + dy) * W + x + dx] >= SKIN
                            for dy in (-1, 0, 1) for dx in (-1, 0, 1)):
            continue
        # 0 daleko vlevo od hrany, 1 za hranou (návlek)
        keep = min(1.0, max(0.0, (x - ex) / FEATHER + 0.5))
        new = int(mask[i] * keep)
        if new != mask[i]:
            mask[i] = new
            changed += 1

subprocess.run(
    ['magick', '-size', f'{W}x{H}', '-depth', '8', 'gray:-', OUT],
    input=bytes(mask), check=True)
print(f'opraveno {changed} px masky')
