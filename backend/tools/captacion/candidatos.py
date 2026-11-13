#!/usr/bin/env python3
"""Elige los próximos negocios a investigar para la tanda de la semana.

Uso (desde la raíz del proyecto):
    python3 backend/tools/captacion/candidatos.py --sectores peluqueria,estetica --ciudades Barcelona --n 25
    python3 backend/tools/captacion/candidatos.py --sectores fisioterapia,psicologia --cerca 41.5463,2.1086 --radio 15 --n 10

Excluye:
  - los ya usados en tandas anteriores (captacion/usados.json),
  - los que ya estén en el panel (captacion/exportes/captacion.csv, si lo has exportado),
  - la lista de no contactar (captacion/exportes/no-contactar.csv, si la has exportado).
Reparte la selección entre barrios para no llamar a toda una calle el mismo día.
Escribe el resultado en JSON por la salida estándar.
"""
import argparse
import csv
import json
import math
import os
import random
import sys
from collections import defaultdict
from datetime import date

from comun import DATOS, EXPORTES, USADOS, leer_json, norm, norm_tel


def leer_csv(ruta):
    if not os.path.exists(ruta):
        return []
    with open(ruta, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def distancia_km(a_lat, a_lon, b_lat, b_lon):
    r = 6371
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sectores', default='peluqueria,estetica')
    ap.add_argument('--ciudades', default='', help='Lista separada por comas (vacío = todas)')
    ap.add_argument('--cerca', default='', help='lat,lon (Sabadell centro: 41.5463,2.1086)')
    ap.add_argument('--radio', type=float, default=15)
    ap.add_argument('--n', type=int, default=25)
    ap.add_argument('--solo-con-telefono', action='store_true')
    a = ap.parse_args()

    candidatos = leer_json(os.path.join(DATOS, 'candidatos.json'), None)
    if candidatos is None:
        sys.exit('No hay candidatos. Ejecuta primero: python3 backend/tools/captacion/fuentes.py')

    usados = set(leer_json(USADOS, []))
    panel = leer_csv(os.path.join(EXPORTES, 'captacion.csv'))
    dnc = leer_csv(os.path.join(EXPORTES, 'no-contactar.csv'))
    tel_excluidos = {norm_tel(r.get('phone_norm')) for r in panel + dnc if r.get('phone_norm')}
    nombres_excluidos = {(norm(r.get('name')), norm(r.get('city'))) for r in panel if r.get('name')}
    nombres_dnc = {norm(r.get('name_norm')) for r in dnc if r.get('name_norm')}

    sectores = {s.strip() for s in a.sectores.split(',') if s.strip()}
    ciudades = {norm(c) for c in a.ciudades.split(',') if c.strip()}
    centro = tuple(map(float, a.cerca.split(','))) if a.cerca else None

    elegibles = []
    for c in candidatos:
        if c['sector'] not in sectores or c['key'] in usados:
            continue
        if ciudades and norm(c['city']) not in ciudades:
            continue
        if a.solo_con_telefono and not c.get('phone'):
            continue
        if c.get('phone') and norm_tel(c['phone']) in tel_excluidos:
            continue
        if (norm(c['name']), norm(c['city'])) in nombres_excluidos or norm(c['name']) in nombres_dnc:
            continue
        if centro:
            try:
                d = distancia_km(centro[0], centro[1], float(c['lat']), float(c['lon']))
            except (TypeError, ValueError):
                continue
            if d > a.radio:
                continue
            c = {**c, 'km': round(d, 1)}
        elegibles.append(c)

    # Reparto por zona y sector: una ronda por cada barrio/ciudad hasta llegar a n
    random.seed(date.today().isoformat())
    grupos = defaultdict(list)
    for c in elegibles:
        grupos[(c['sector'], c.get('district') or c['city'])].append(c)
    for g in grupos.values():
        random.shuffle(g)
    claves = list(grupos)
    random.shuffle(claves)
    elegidos = []
    while len(elegidos) < a.n and any(grupos[k] for k in claves):
        for k in claves:
            if grupos[k] and len(elegidos) < a.n:
                elegidos.append(grupos[k].pop())

    print(json.dumps({'disponibles': len(elegibles), 'elegidos': elegidos}, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
