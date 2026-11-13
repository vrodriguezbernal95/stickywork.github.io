#!/usr/bin/env python3
"""Descarga las fuentes abiertas y genera captacion/datos/candidatos.json.

Uso (desde la raíz del proyecto):
    python3 backend/tools/captacion/fuentes.py

Fuentes (todas abiertas y gratuitas):
  - Censo de locales en planta baja de Barcelona (Open Data BCN, CC BY 4.0): peluquerías, estética,
    sanidad (fisios, psicólogos, podólogos, dentales...), gimnasios, peluquerías caninas. Sin teléfono.
  - Clínicas dentales autorizadas de Cataluña (Generalitat, datos abiertos): con teléfono.
  - Establecimientos sanitarios autorizados (Generalitat): ópticas y centros auditivos, con teléfono.

No se guarda el nombre de los titulares (personas): solo datos del negocio.
"""
import csv
import io
import json
import sys
import urllib.parse
import urllib.request
from collections import Counter
from datetime import date

from comun import DATOS, es_cadena, guardar_json, norm, norm_tel

UA = {'User-Agent': 'stickywork-captacion/1.0 (+https://stickywork.com)'}
HOY = date.today().strftime('%Y-%m-%d')


def get(url, timeout=120):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def sector_salud(nombre):
    n = norm(nombre)
    if any(k in n for k in ['fisio', 'osteo', 'rehabilit', 'quiro', 'readapt']):
        return 'fisioterapia'
    if any(k in n for k in ['psico', 'psicol', 'terapia', 'logoped', 'neuropsic']):
        return 'psicologia'
    if any(k in n for k in ['nutri', 'dieti', 'dietet']):
        return 'nutricion'
    if any(k in n for k in ['podo', 'podol']):
        return 'podologia'
    if any(k in n for k in ['dental', 'dent', 'odonto', 'ortodon']):
        return 'dental'
    return None


def barcelona():
    meta = json.loads(get('https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=cens-locals-planta-baixa-act-economica'))
    recursos = [r for r in meta['result']['resources'] if r.get('format', '').upper() == 'CSV' and r['name'][:4].isdigit()]
    recurso = sorted(recursos, key=lambda r: r['name'])[-1]
    print(f"  Barcelona: {recurso['name']}")
    texto = get(recurso['url'], timeout=300).decode('utf-8-sig')
    out = []
    for row in csv.DictReader(io.StringIO(texto)):
        act = row.get('Nom_Activitat', '').strip()
        nombre = (row.get('Nom_Local') or '').strip()
        if not nombre:
            continue
        if act == 'Perruqueries':
            sector = 'peluqueria'
        elif act == "Centres d'estètica":
            sector = 'estetica'
        elif act == 'Gimnàs /fitnes':
            sector = 'gimnasio'
        elif act == 'Sanitat i assistència':
            sector = sector_salud(nombre)
            if sector == 'dental':
                sector = None  # las dentales salen del registro de la Generalitat, que trae teléfono
        elif act == 'Veterinaris / Mascotes':
            sector = 'canina' if any(k in norm(nombre) for k in ['perruq', 'pelu', 'groom', 'canin', 'estetica']) else None
        else:
            sector = None
        if not sector:
            continue
        num = (row.get('Num_Policia_Inicial') or '').strip()
        via = (row.get('Nom_Via') or '').strip().title()
        out.append({
            'key': f"bcn:{row.get('ID_Global')}",
            'name': nombre,
            'sector': sector,
            'address': f"{via}, {num}" if num else via,
            'district': (row.get('Nom_Barri') or '').strip(),
            'city': 'Barcelona',
            'comarca': 'Barcelonès',
            'phone': '',
            'lat': row.get('Latitud'), 'lon': row.get('Longitud'),
            'source': f"Censo comercial de Barcelona ({recurso['name'][:4]}), Open Data BCN",
            'source_date': HOY,
        })
    return out


def socrata(dataset, where=None):
    filas, offset = [], 0
    while True:
        q = {'$limit': 5000, '$offset': offset}
        if where:
            q['$where'] = where
        url = f"https://analisi.transparenciacatalunya.cat/resource/{dataset}.json?{urllib.parse.urlencode(q)}"
        lote = json.loads(get(url))
        filas += lote
        if len(lote) < 5000:
            return filas
        offset += 5000


def direccion(r):
    partes = [(r.get('tipus_via_nom') or '').title(), (r.get('via_nom') or '').title()]
    calle = ' '.join(p for p in partes if p).strip()
    num = (r.get('numero_via') or '').strip()
    return f"{calle}, {num}" if num else calle


def generalitat():
    out = []
    print('  Generalitat: clínicas dentales')
    for r in socrata('67jd-4x4g'):
        out.append({
            'key': f"dental:{r.get('centre_codi')}",
            'name': (r.get('centre_nom') or '').strip(),
            'sector': 'dental',
            'address': direccion(r),
            'district': '',
            'city': (r.get('municipi_nom') or '').title(),
            'comarca': (r.get('comarca_nom') or '').title(),
            'phone': norm_tel(r.get('telefon')),
            'lat': r.get('latitud'), 'lon': r.get('longitud'),
            'source': 'Registro de clínicas dentales autorizadas, Generalitat de Catalunya (datos abiertos)',
            'source_date': HOY,
        })
    print('  Generalitat: ópticas y centros auditivos')
    for r in socrata('nrmq-ytje', "tipus_establiment_nom in('Òptica','Audiopròtesi')"):
        out.append({
            'key': f"sanitari:{r.get('establiment_codi')}",
            'name': (r.get('establiment_nom') or '').strip(),
            'sector': 'optica',
            'address': direccion(r),
            'district': '',
            'city': (r.get('municipi_nom') or '').title(),
            'comarca': (r.get('comarca_nom') or '').title(),
            'phone': norm_tel(r.get('telefon')),
            'lat': r.get('latitud'), 'lon': r.get('longitud'),
            'source': 'Registro de establecimientos sanitarios autorizados, Generalitat de Catalunya (datos abiertos)',
            'source_date': HOY,
        })
    return out


GENERICAS = {'perruqueria', 'peluqueria', 'perruquers', 'barberia', 'barber', 'barbershop', 'shop', 'unisex',
             'estetica', 'centre', 'centro', 'de', 'd', 'i', 'y', 'la', 'el', 'nails', 'unas', 'manicura', 'tattoo',
             'tatuatges', 'clinica', 'fisioterapia', 'podologia', 'optica', 'opticas', 'gimnas', 'gimnasio', 'salo',
             'salon', 'bellesa', 'belleza', 'home', 'dona', 'mujer', 'hombre', 'caballero', 'senyora'}


def es_generico(nombre):
    palabras = norm(nombre).split()
    return bool(palabras) and all(p in GENERICAS for p in palabras)


def main():
    todos = []
    for nombre, fn in (('Barcelona', barcelona), ('Generalitat', generalitat)):
        try:
            todos += fn()
        except Exception as e:  # una fuente caída no debe impedir usar las demás
            print(f"  ⚠️ No se pudo descargar {nombre}: {e}", file=sys.stderr)

    # Sin nombre real («SN», «S/N»): no se puede identificar ni buscar
    todos = [c for c in todos if norm(c['name']) not in ('', 'sn', 's n')]
    # Cadenas: por lista de marcas o por aparecer el mismo nombre en 3+ direcciones
    # (salvo nombres genéricos como «Perruqueria» o «Barber Shop», que se repiten sin ser cadena)
    repes = Counter(norm(c['name']) for c in todos)
    limpios = [c for c in todos
               if not es_cadena(c['name']) and (repes[norm(c['name'])] < 3 or es_generico(c['name']))]
    descartados = len(todos) - len(limpios)

    guardar_json(f"{DATOS}/candidatos.json", limpios)
    por_sector = Counter(c['sector'] for c in limpios)
    print(f"\n✅ {len(limpios)} candidatos guardados en captacion/datos/candidatos.json ({descartados} cadenas descartadas)")
    for s, n in por_sector.most_common():
        print(f"   {s:13} {n}")


if __name__ == '__main__':
    main()
