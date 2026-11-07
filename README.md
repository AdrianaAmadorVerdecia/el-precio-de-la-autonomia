# El precio de la autonomía · Historia interactiva

**Publicado:** [Historia interactiva](https://adrianaamadorverdecia.github.io/el-precio-de-la-autonomia/) · [Repositorio](https://github.com/AdrianaAmadorVerdecia/el-precio-de-la-autonomia)

Sitio web estático (HTML, CSS y JavaScript, sin frameworks) que convierte el estudio
*El precio de la autonomía* en una historia interactiva de 4 escenas cortas:

1. Lucy y la evidencia, con la portada y el perfil de Lucy.
2. La decisión: presupuesto, recorrido, años, prioridad y tipo de vehículo.
3. La trampa: autonomía anunciada frente a la real, paso del tiempo y voces.
4. El resultado y el cierre, con la encuesta y el feedback plegados.

El visitante conoce a Lucy, revisa la evidencia, ajusta su presupuesto, sus kilómetros
diarios, sus años de uso y su prioridad; ve la autonomía prometida frente a la real;
lee testimonios con calificación en estrellas; recibe una recomendación personalizada;
valora la historia y puede responder la encuesta. Las respuestas se guardan en una
copia aparte del navegador y se pueden descargar en JSON o CSV.

La historia prioriza a Lucy en todas las escenas con una ficha breve de su perfil o una
cita suya. Las secciones largas (hallazgos, método, encuesta, respuestas guardadas) se
muestran en bloques plegables para que la página no obligue a bajar de más. La barra
superior mantiene un botón «Empezar/Siguiente» para avanzar sin volver al final de cada
escena.

La interfaz usa fondo blanco (`#FFFFFF`), texto (`#212529`), llamadas a la acción
verdes (`#00E676`) y acentos/gráficos púrpura (`#8A2BE2`). Las tipografías son Poppins
para títulos e Inter para cuerpo, importadas desde Google Fonts con fallback local.
No hay dependencias de JavaScript ni frameworks.

## Cómo abrirlo

Opción rápida: doble clic en `index.html`.

Opción con servidor local (recomendada para probar el guardado y las descargas):

```bat
Abrir sitio.bat
```

El lanzador abre `http://localhost:8080/`. También puedes ejecutar:

```bash
python -m http.server 8080
```

y visitar `http://localhost:8080/`.

## Estructura

```
web-autonomia/
  index.html
  css/estilos.css
  js/datos.js        # generado, no editar a mano
  js/app.js          # historia, Lucy, resumen de datos, gráficos y resultado
  js/encuesta.js     # encuesta, estrellas, feedback, copia local, descargas y GA4
  datos_fuente/      # copia de solo lectura de los JSON del estudio
  build_datos.py     # regenera js/datos.js desde datos_fuente/
  Abrir sitio.bat
```

## Regenerar los datos

```bash
python build_datos.py
```

El script lee los JSON de `datos_fuente/` y escribe `js/datos.js`. No modifica el
proyecto original ni los archivos de `datos_fuente/`.

Por indicación del proyecto, se excluye el anuncio atípico de bicicleta de $410 con
140 km de autonomía. El resumen generado conserva los conteos `productos_observados`
(406), `productos` (405, usados en el cálculo) y `excluidos` (1). El anuncio excluido
no se muestra en la interfaz ni se usa en las recomendaciones.

## Estrellas

La encuesta original clasifica la calidad como **Buena**, **Regular** o **Mala**.
La historia la traduce a estrellas para que sea legible:

- Buena = 5
- Regular = 3
- Mala = 1

El promedio se muestra con decimales. En el formulario nuevo, el visitante califica
de 1 a 5 estrellas y la calidad se deriva así: 1–2 = Mala, 3 = Regular, 4–5 = Buena.

En el cierre, un segundo componente de estrellas permite valorar la historia de 1 a 5.
Esa valoración se guarda aparte en `localStorage`, bajo la clave
`epda_feedback_historia_v1`, y no se mezcla con las encuestas de vehículos.

## Encuesta y privacidad

- No hay backend ni se envían datos a ningún servidor.
- Cada respuesta se guarda en `localStorage` de **ese** navegador, bajo la clave
  `epda_encuestas_v2`.
- La valoración de la historia se guarda en la clave `epda_feedback_historia_v1`.
- Desde el cierre se descarga una copia en JSON o CSV.
- El estudio original y sus archivos no se modifican.
- Si se borran los datos del navegador, se pierde la copia local. Por eso se ofrece
  la descarga.

## Analítica opcional (GA4)

El `<head>` de `index.html` incluye un bloque comentado con el identificador
`G-XXXXXXXXXX`. Mientras permanezca comentado no se carga ninguna analítica.

Si se activa GA4, la aplicación ya prepara dos eventos en `window.dataLayer`:

- `encuesta_enviada`: `tipo_vehiculo`, `calidad`, `estrellas`.
- `feedback_historia`: `valoracion`, `calidad`, `guardado`.

No se envían respuestas de la encuesta ni textos de opinión a la analítica.

## Publicar y compartir

El sitio es estático: se puede subir tal cual a cualquier hosting gratuito.

1. **Cloudflare Pages**: crear un proyecto, subir la carpeta o conectarla a un
   repositorio. No requiere backend.
2. **Netlify Drop**: arrastrar la carpeta `web-autonomia` a la zona de despliegue.
3. **GitHub Pages**: solo si se decide crear un repositorio aparte para publicar.
   El estudio original no debe modificarse.

Después del despliegue, comparte la URL que te entregue el servicio. Ten en cuenta
que el acceso a algunos hostings gratuitos desde Cuba puede ser intermitente; conviene
probar la URL desde la red donde se va a usar.

Google Fonts y GA4 también pueden tener disponibilidad limitada desde Cuba. El sitio
funciona sin ellos: las tipografías tienen fallback local y la analítica está comentada
por defecto.

El botón **Mi repositorio UI** apunta por ahora al listado de repositorios del perfil.
Cuando el repositorio exacto esté publicado, reemplaza esa URL en `index.html`.

## Límites que el sitio declara

- La muestra de patinetes es pequeña: 3 personas.
- Las autonomías de los anuncios no siempre coinciden con la autonomía real.
- Se excluyó un anuncio atípico de bicicleta (140 km) para no distorsionar la
  recomendación. El resumen declara 406 anuncios observados y 405 usados en el cálculo.
- La proyección de batería es una estimación lineal con la pérdida promedio reportada;
  no es una medición del vehículo de cada persona.
- Para no premiar anuncios inflados, la recomendación limita la autonomía de cada
  anuncio a un 20 % por encima del promedio que reportaron los dueños del mismo tipo.
  La autonomía anunciada se sigue mostrando para que la diferencia sea visible.
- Solo se usan anuncios que publican autonomía.
- La recomendación es orientativa y no sustituye una revisión del estado real de la
  batería.

## Fuente

Estudio de Adriana Amador Verdecia (Ciencia de Datos, MATCOM, Universidad de La Habana):

https://github.com/AdrianaAmadorVerdecia/analisis-del-mercado-de-motos-bicicletas-patinetes
