from __future__ import annotations

import json
import statistics as stat
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
FUENTE = RAIZ / "datos_fuente"
SALIDA = RAIZ / "js" / "datos.js"

ORDEN = ["Moto electrica", "Bicicleta electrica", "Patinete electrico"]
ETIQUETAS = {
    "Moto electrica": "Moto eléctrica",
    "Bicicleta electrica": "Bicicleta eléctrica",
    "Patinete electrico": "Patinete eléctrico",
}

SITIOS = (
    {
        "nombre": "Revolico",
        "fuente": "Internet",
        "archivo": "anuncios_revolico.json",
        "lista": "anuncios",
        "precio": "precio",
        "autonomia": "autonomia_km",
    },
    {
        "nombre": "iTENCEL",
        "fuente": "Internet",
        "archivo": "itencel_anuncios.json",
        "lista": "productos",
        "precio": "precio_usd",
        "autonomia": "autonomia_max_km",
    },
    {
        "nombre": "VEDCA",
        "fuente": "Mercado",
        "archivo": "vedca_islagrande.json",
        "lista": "productos",
        "precio": "precio_usd",
        "autonomia": "autonomia_max_km",
    },
    {
        "nombre": "CubAmerica",
        "fuente": "Mercado",
        "archivo": "cubamerica_envios.json",
        "lista": "productos",
        "precio": "precio_usd",
        "autonomia": "autonomia_max_km",
    },
)

ESTRELLAS_CALIDAD = {"Buena": 5, "Regular": 3, "Mala": 1}


def leer(archivo: str, lista: str):
    with open(FUENTE / archivo, encoding="utf-8") as f:
        return json.load(f)[lista]


def numero(valor):
    try:
        if valor is None or valor == "":
            return None
        return float(valor)
    except (TypeError, ValueError):
        return None


def main() -> None:
    productos = []
    observados = 0
    excluidos = 0
    for sitio in SITIOS:
        for p in leer(sitio["archivo"], sitio["lista"]):
            observados += 1
            precio = numero(p.get(sitio["precio"]))
            autonomia = numero(p.get(sitio["autonomia"]))
            if precio is None or autonomia is None or autonomia <= 0:
                continue
            # Anuncio atípico de bicicleta con 140 km: excluido por indicación del proyecto.
            if p.get("tipo_vehiculo") == "Bicicleta electrica" and precio == 410 and autonomia == 140:
                excluidos += 1
                continue
            productos.append(
                {
                    "tipo": p.get("tipo_vehiculo"),
                    "sitio": sitio["nombre"],
                    "fuente": sitio["fuente"],
                    "marca": (p.get("marca") or "Sin marca").strip(),
                    "precio": round(precio),
                    "autonomia": round(autonomia),
                    "usd_km": round(precio / autonomia, 1),
                }
            )

    encuestas = leer("encuestas_personas.json", "personas")
    for p in encuestas:
        p["_nueva"] = numero(p.get("autonomia_nueva_km"))
        p["_actual"] = numero(p.get("autonomia_actual_km"))
        p["_anios"] = numero(p.get("anios_uso"))
        p["_precio"] = numero(p.get("precio_usd"))
        if p["_nueva"] and p["_actual"] is not None:
            p["_perdida"] = (p["_nueva"] - p["_actual"]) / p["_nueva"] * 100
        else:
            p["_perdida"] = 0.0
        p["_estrellas"] = ESTRELLAS_CALIDAD.get(p.get("calidad"), 3)

    tipos = {}
    for tipo in ORDEN:
        de_tipo = [p for p in productos if p["tipo"] == tipo]
        enc = [p for p in encuestas if p.get("tipo_vehiculo") == tipo]
        if not enc:
            continue
        perdida_pct = stat.mean([p["_perdida"] for p in enc])
        anios_prom = stat.mean([p["_anios"] for p in enc if p["_anios"] is not None])
        nueva = stat.mean([p["_nueva"] for p in enc if p["_nueva"] is not None])
        actual = stat.mean([p["_actual"] for p in enc if p["_actual"] is not None])
        estrellas = stat.mean([p["_estrellas"] for p in enc])
        precios = [p["_precio"] for p in enc if p["_precio"] is not None]
        calidad = {nivel: sum(1 for p in enc if p.get("calidad") == nivel) for nivel in ["Buena", "Regular", "Mala"]}
        internet = [p["autonomia"] for p in de_tipo if p["fuente"] == "Internet"]
        mercado = [p["autonomia"] for p in de_tipo if p["fuente"] == "Mercado"]
        tipos[tipo] = {
            "etiqueta": ETIQUETAS[tipo],
            "personas": len(enc),
            "productos": len(de_tipo),
            "precio_prom": round(stat.mean(precios)) if precios else None,
            "nueva_real": round(nueva),
            "actual_real": round(actual),
            "perdida_pct": round(perdida_pct, 1),
            "anios_prom": round(anios_prom, 1),
            "perdida_anual": round(perdida_pct / anios_prom, 2) if anios_prom else 0,
            "estrellas": round(estrellas, 2),
            "calidad": calidad,
            "internet_prom": round(stat.mean(internet)) if internet else None,
            "mercado_prom": round(stat.mean(mercado)) if mercado else None,
        }

    testimonios = []
    for p in encuestas:
        opinion = (p.get("opinion_calidad") or "").strip()
        if len(opinion) < 5:
            continue
        testimonios.append(
            {
                "tipo": p.get("tipo_vehiculo"),
                "etiqueta": ETIQUETAS.get(p.get("tipo_vehiculo"), ""),
                "marca": (p.get("marca") or "").strip(),
                "anios": round(p["_anios"], 1) if p["_anios"] is not None else None,
                "precio": round(p["_precio"]) if p["_precio"] is not None else None,
                "nueva": round(p["_nueva"]) if p["_nueva"] is not None else None,
                "actual": round(p["_actual"]) if p["_actual"] is not None else None,
                "perdida": round(p["_perdida"], 1),
                "calidad": p.get("calidad"),
                "estrellas": p["_estrellas"],
                "opinion": opinion,
            }
        )
    testimonios.sort(key=lambda t: len(t["opinion"]), reverse=True)
    testimonios = testimonios[:16]

    datos = {
        "fuente": "https://github.com/AdrianaAmadorVerdecia/analisis-del-mercado-de-motos-bicicletas-patinetes",
        "autora": "Adriana Amador Verdecia · MATCOM, Universidad de La Habana",
        "presupuesto_referencia": 1500,
        "resumen": {
            "productos": len(productos),
            "productos_observados": observados,
            "excluidos": excluidos,
            "internet": sum(1 for p in productos if p["fuente"] == "Internet"),
            "mercado": sum(1 for p in productos if p["fuente"] == "Mercado"),
            "encuestas": len(encuestas),
        },
        "tipos": tipos,
        "productos": productos,
        "testimonios": testimonios,
    }

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as f:
        f.write("const DATOS = ")
        json.dump(datos, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print("Generado", SALIDA, "con", len(productos), "productos y", len(testimonios), "testimonios")


if __name__ == "__main__":
    main()
