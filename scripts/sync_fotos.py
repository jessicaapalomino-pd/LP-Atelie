"""Copia as fotos das peças (links do Drive na planilha) para assets/pecas/<id>.jpg.

O Google limita (erro 429) imagens do Drive exibidas em sites, então o site
usa primeiro a cópia local e só recorre ao Drive se ela não existir.

Uso: python scripts/sync_fotos.py   (rodar de novo ao cadastrar peças novas)
"""
import csv
import io
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFzmlbt8FOoIInbHaOq6kI3RtVz9ch69heHBURGUFk-LmxjK2kNn3B6VYv5q6Sb6GDqaFB_Om6Kfdp/pub?output=csv'
DESTINO = Path(__file__).resolve().parent.parent / 'assets' / 'pecas'
LARGURA = 800


def drive_id(url):
    s = (url or '').strip()
    m = re.search(r'/d/([^/?]+)', s) or re.search(r'[?&]id=([^&]+)', s)
    if m:
        return m.group(1)
    if s and '/' not in s and ' ' not in s and len(s) > 10:
        return s
    return ''


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)
    linhas = list(csv.DictReader(io.StringIO(baixar(SHEET_CSV_URL).decode('utf-8'))))
    ids = []
    for linha in linhas:
        for col, valor in linha.items():
            if (col or '').strip().startswith('foto_id'):
                i = drive_id(valor)
                if i and i not in ids:
                    ids.append(i)

    falhas = 0
    for i in ids:
        alvo = DESTINO / (i + '.jpg')
        if alvo.exists():
            print('ok (já existe)', alvo.name)
            continue
        try:
            dados = baixar('https://drive.google.com/thumbnail?id=' + i + '&sz=w' + str(LARGURA * 2))
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(dados))).convert('RGB')
            if img.width > LARGURA:
                img = img.resize((LARGURA, round(img.height * LARGURA / img.width)), Image.LANCZOS)
            img.save(alvo, 'JPEG', quality=80, optimize=True, progressive=True)
            print('baixada', alvo.name, alvo.stat().st_size // 1024, 'KB')
        except Exception as e:
            falhas += 1
            print('FALHOU', i, e, file=sys.stderr)
    print(len(ids), 'fotos na planilha,', falhas, 'falhas')
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(main())
