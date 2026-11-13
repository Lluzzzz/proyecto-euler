# Misión NASA 1962: simulador de Euler

Proyecto académico inspirado en la película *Talentos ocultos (Hidden Figures)*. Incluye una aplicación web funcional, la resolución matemática en Word, el código listo para GitHub, pruebas automáticas y un video explicativo de menos de dos minutos.

> **Nota histórica:** John Glenn orbitó la Tierra en 1962 y Katherine Johnson revisó cálculos orbitales para esa misión. Los parámetros y el cohete de esta actividad son hipotéticos; no son los valores del Atlas de 1962.

## Abrir la aplicación

1. Abrir esta carpeta de repositorio (archivos en la raíz).
2. Abrir `index.html` con Chrome, Firefox, Edge u otro navegador moderno.
3. Se cargarán los parámetros de la consigna: `m = 1000 kg`, `T = 15000 N`, `g = 9.81 m/s²`, `k = 100 kg/s`, `v0 = 0 m/s`, `y0 = 0 m`, `tiempo = 20 s`, `h = 2 s`.
4. Modificar los datos o pulsar **Calcular**. Las tablas y las dos gráficas se actualizan automáticamente.
5. Pulsar **Comparar pasos** para mostrar `h = 2`, `1` y `0,5 s` con los datos originales; **Restablecer** recupera los datos base; **Exportar CSV** guarda la tabla de iteraciones.

No requiere conexión a internet, servidor ni instalación de librerías.

## Fundamento y resultado

Modelo de ascenso vertical:

```text
m · dv/dt = T - mg - kv
     dy/dt = v
```

Euler explícito, con dos actualizaciones desde el estado anterior:

```text
v[n+1] = v[n] + dt × (T/m - g - k/m × v[n])
y[n+1] = y[n] + dt × v[n]
```

Para cualquier entrada válida, definir `a = T/m - g`, `b = k/m`, `vL = a/b`. La solución analítica es:

```text
v(t) = vL + (v0 - vL) × exp(-b×t)
y(t) = y0 + vL×t + (v0 - vL) × [1 - exp(-b×t)]/b
```

Valores a los 20 segundos con h = 2 s:

| Método | Velocidad (m/s) | Altura (m) |
|---|---:|---:|
| Euler | 46,3273 | 574,7272 |
| Analítico | 44,8761 | 589,2390 |
| Error absoluto | 1,4512 | 14,5118 |

## Pruebas del código

Con Node.js instalado, desde la carpeta del proyecto:

```bash
node tests/verificar.js
```

Se validan las primeras iteraciones, la solución a los 20 segundos, la actualización correcta de la altura, un último subpaso fraccionario, errores por parámetros inválidos y la convergencia de los pasos. No se requiere `npm install`.

## Validación del simulador

- Masa y resistencia: positivas; gravedad no negativa.
- Empuje superior al peso `T > mg` para representar ascenso.
- Velocidad y altura iniciales no negativas en este modelo.
- Tiempo y paso positivos; `h < m/k` para evitar oscilaciones del método explícito.
- Resultados finitos; máximo 3000 pasos.
- Si el tiempo final no es múltiplo de `h`, solo se ajusta el último subpaso.

## Publicar en GitHub

En este repositorio, `index.html` está en la raíz, por lo que puede publicarse directamente con GitHub Pages.

1. Crear un repositorio nuevo en tu cuenta de GitHub y cargar el contenido del ZIP descomprimido (sin incluir una carpeta superior adicional).
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)**.
3. Copiar el enlace público del repositorio y de Pages a la entrega académica.

Como alternativa desde Git (sustituir `TU_USUARIO` y `TU_REPOSITORIO`):

```bash
git init
git add .
git commit -m "Simulador de Euler para lanzamiento vertical"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

**Importante:** Esta entrega incluye el repositorio **preparado**, no una URL pública ya publicada. La creación y subida a la cuenta personal requiere que el estudiante lo haga desde GitHub.

## Archivos de la entrega completa

- `index.html`, `styles.css`, `app.js`: simulador.
- `tests/verificar.js`: pruebas automáticas.
- El informe Word, el video y el guion se encuentran en el ZIP de la entrega completa.

## Bibliografía

- NASA: [El legado de Katherine G. Johnson](https://ciencia.nasa.gov/gente-de-la-nasa/el-legado-de-katherine-g-johnson-0/).
- NASA: [Mercury-Atlas 6: Friendship 7](https://www.nasa.gov/mission/mercury-atlas-6-friendship-7/).
- NASA Science: [Katherine Johnson](https://science.nasa.gov/people/katherine-johnson/).

Material académico; modelo matemático y códigos de este proyecto elaborados para la actividad.
