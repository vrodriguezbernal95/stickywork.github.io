"""Utilidades compartidas por los scripts de captación (sin dependencias externas)."""
import json
import os
import re
import unicodedata

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
CARPETA = os.path.join(RAIZ, 'captacion')
DATOS = os.path.join(CARPETA, 'datos')
TANDAS = os.path.join(CARPETA, 'tandas')
EXPORTES = os.path.join(CARPETA, 'exportes')
USADOS = os.path.join(CARPETA, 'usados.json')

SECTORES = ['peluqueria', 'estetica', 'fisioterapia', 'psicologia', 'nutricion', 'podologia',
            'canina', 'tatuajes', 'optica', 'dental', 'gimnasio', 'otro']

# Cadenas y franquicias: se descartan (deciden en una central). El agente también descarta
# cualquier negocio con el mismo nombre en 3 o más direcciones.
CADENAS = [
    'llongueras', 'marco aldany', 'jean louis david', 'franck provost', 'provost', 'toni guy', 'tony guy',
    'tony and guy', 'toni and guy', 'raffel pages', 'cebado', 'pelu express',
    'dessange', 'camille albane', 'nails factory', 'the nail bar',
    'no mas vello', 'nomasvello', 'centros ideal', 'dorsia', 'corporacion dermoestetica', 'depilite', 'body laser',
    'sapphira', 'carmen navarro', 'yves rocher', 'mercadona', 'el corte ingles', 'carrefour',
    'vitaldent', 'dentix', 'sanitas', 'adeslas', 'caredent', 'unidental', 'donte', 'dental company', 'dentalcompany',
    'asisa', 'mapfre', 'quiron', 'ivi', 'clinica baviera', 'barnaclinic',
    'multiopticas', 'general optica', 'alain afflelou', 'afflelou', 'opticalia', 'vision lab', 'visionlab',
    'optica 2000', 'grandvision', 'specsavers', 'hans anders', 'optica universitaria',
    'gaes', 'amplifon', 'audika', 'oticon', 'widex', 'phonak', 'audifon', 'clinisord', 'centro auditivo aural',
    'basic fit', 'basicfit', 'mcfit', 'anytime fitness', 'dir ', 'holmes place', 'metropolitan', 'viva gym', 'vivagym',
    'altafit', 'synergym', 'fitness park', 'snap fitness', 'o2 centro', 'go fit', 'gofit', 'duet', 'arsenal',
    'tiendanimal', 'kiwoko', 'zooplus', 'mascotalia', 'veterinarios anicura', 'anicura', 'kivet', 'vetsum',
]


def norm(texto):
    if not texto:
        return ''
    t = unicodedata.normalize('NFD', str(texto).lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    t = re.sub(r'[^a-z0-9 ]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()


def norm_tel(tel):
    if not tel:
        return ''
    d = re.sub(r'\D', '', str(tel))
    if d.startswith('0034'):
        d = d[4:]
    if len(d) == 11 and d.startswith('34'):
        d = d[2:]
    return d[-9:] if len(d) >= 9 else ''


def es_cadena(nombre):
    n = ' ' + norm(nombre) + ' '
    return any((' ' + c.strip() + ' ') in n for c in CADENAS)


def leer_json(ruta, defecto):
    try:
        with open(ruta, encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return defecto


def guardar_json(ruta, datos):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)
