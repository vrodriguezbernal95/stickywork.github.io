#!/usr/bin/env python3
"""Comprueba una tanda antes de subirla al panel y la marca como usada.

Uso (desde la raíz del proyecto):
    python3 backend/tools/captacion/validar_tanda.py captacion/tandas/2026-11-16.json
    python3 backend/tools/captacion/validar_tanda.py captacion/tandas/2026-11-16.json --marcar

Sin --marcar solo informa. Con --marcar, si no hay errores, añade los negocios a captacion/usados.json
para que no se repitan en próximas tandas.
"""
import re
import sys

from comun import SECTORES, USADOS, guardar_json, leer_json, norm_tel

METODOS = {'whatsapp_telefono', 'web_sin_reservas', 'sin_web', 'marketplace', 'software', 'desconocido'}
# Promesas que StickyWork no cumple: si aparecen en un mensaje, es un error
PROHIBIDO = [
    (r'whatsapp[^.]{0,40}autom', 'promete WhatsApp automático (lo automático es el email)'),
    (r'autom[^.]{0,40}whatsapp', 'promete WhatsApp automático (lo automático es el email)'),
    (r'\d+\s?%', 'incluye un porcentaje: no inventamos cifras'),
    (r'profesional(es)? (que|a) elegir|elige (a )?(tu|su) profesional', 'promete elegir profesional (no existe)'),
    (r'festivo', 'promete cerrar festivos (no existe)'),
    (r'export', 'promete exportar datos (no existe)'),
    (r'miles de (negocios|clientes)|cientos de (negocios|clientes)', 'inventa número de clientes'),
]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    ruta = sys.argv[1]
    marcar = '--marcar' in sys.argv
    datos = leer_json(ruta, None)
    if datos is None:
        sys.exit(f'No se puede leer {ruta}')
    items = datos.get('prospects') if isinstance(datos, dict) else datos
    if not isinstance(items, list) or not items:
        sys.exit('La tanda debe ser {"batch": "...", "prospects": [ ... ]} con al menos un negocio')

    errores, avisos = [], []
    for i, p in enumerate(items, 1):
        q = f"#{i} {p.get('name', '¿sin nombre?')}"
        if not p.get('name'):
            errores.append(f'{q}: falta el nombre')
        if p.get('sector') not in SECTORES:
            errores.append(f"{q}: sector no válido ({p.get('sector')})")
        if p.get('booking_method') and p['booking_method'] not in METODOS:
            errores.append(f"{q}: booking_method no válido ({p['booking_method']})")
        sc = p.get('score')
        if not isinstance(sc, (int, float)) or not 0 <= sc <= 100:
            errores.append(f'{q}: score debe ser un número de 0 a 100')
        elif p.get('tier') and p['tier'] != ('A' if sc >= 70 else 'B' if sc >= 50 else 'C'):
            errores.append(f"{q}: tier {p['tier']} no cuadra con score {sc}")
        if p.get('phone') and not norm_tel(p['phone']):
            errores.append(f"{q}: teléfono raro ({p['phone']})")
        if not p.get('phone'):
            avisos.append(f'{q}: sin teléfono (tendrás que mirarlo en Maps o visitarlo)')
        if not p.get('call_script'):
            errores.append(f'{q}: falta el guion de llamada')
        if not p.get('wa_message'):
            errores.append(f'{q}: falta el WhatsApp para después del permiso')
        elif '{enlace}' not in p['wa_message']:
            errores.append(f'{q}: el WhatsApp debe incluir {{enlace}} (enlace de registro con seguimiento)')
        if not p.get('hook'):
            avisos.append(f'{q}: sin gancho personalizado (hook)')
        if not p.get('source'):
            errores.append(f'{q}: falta la fuente del dato (obligatorio por RGPD)')
        texto = ' '.join(str(p.get(k) or '') for k in ('call_script', 'wa_message', 'followup_message', 'hook')).lower()
        for patron, motivo in PROHIBIDO:
            if re.search(patron, texto):
                errores.append(f'{q}: {motivo}')

    print(f'{len(items)} negocios revisados')
    for a in avisos:
        print('  ⚠️ ', a)
    for e in errores:
        print('  ❌', e)
    if errores:
        sys.exit(f'\n{len(errores)} errores: corrígelos antes de subir la tanda')
    print('✅ Tanda correcta')

    if marcar:
        usados = set(leer_json(USADOS, []))
        nuevos = [p['key'] for p in items if p.get('key')]
        usados.update(nuevos)
        guardar_json(USADOS, sorted(usados))
        print(f'   {len(nuevos)} negocios marcados como usados en captacion/usados.json')


if __name__ == '__main__':
    main()
