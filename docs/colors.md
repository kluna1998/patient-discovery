# Colores de Patient Discovery

La paleta completa se edita en el bloque `@theme` de `src/index.css`. Los componentes usan nombres según la función del color. Esta refactorización conserva los colores anteriores y no modifica la disposición ni el comportamiento.

Los valores `var(--color-slate-...)`, `var(--color-amber-...)`, etc. son referencias a la paleta de Tailwind. Puedes sustituirlos por un hexadecimal en el mismo bloque. Los valores con ocho dígitos incluyen transparencia.

## Marca, enlaces y foco

| Variable (`--color-…`) | Valor inicial | Uso |
| --- | --- | --- |
| `primary` | `#163f64` | Color principal de la aplicación |
| `primary-hover` | `#123452` | Hover del botón principal |
| `secondary` | `#2a7679` | Color secundario y progreso |
| `interactive` | `var(--color-blue-600)` | Enlaces de ordenación y selección de columnas |
| `info` | `var(--color-blue-800)` | Mensajes informativos |
| `info-bg` | `var(--color-blue-50)` | Fondo informativo y hover del selector de archivo |
| `focus` | `var(--color-secondary)` | Contorno de foco general |
| `focus-tab` | `var(--color-primary)` | Contorno de foco de las pestañas |
| `selection` | `#d9ebee` | Selección de texto |

## Fondos y superficies

| Variable (`--color-…`) | Valor inicial | Uso |
| --- | --- | --- |
| `canvas` | `#f4f6f8` | Fondo general de la página |
| `surface` | `#ffffff` | Paneles, diálogo y pestaña activa |
| `surface-muted` | `var(--color-slate-50)` | Fondos secundarios y hover de botones |
| `surface-hover` | `var(--color-slate-100)` | Hover de pestañas inactivas |
| `surface-accent` | `#edf4f6` | Fondo de los iconos de sección |
| `table-header` | `#edf1f5` | Cabeceras de las tablas de pacientes y diccionario |
| `table-row-hover` | `#f3f8fa` | Hover de filas de pacientes |
| `progress-track` | `#e5ebef` | Fondo de la barra de progreso |

## Texto

| Variable (`--color-…`) | Valor inicial | Uso |
| --- | --- | --- |
| `content` | `var(--color-slate-700)` | Texto normal y etiquetas |
| `content-strong` | `var(--color-slate-900)` | Títulos y valores destacados |
| `content-heading` | `var(--color-slate-800)` | Encabezados secundarios |
| `content-muted` | `var(--color-slate-600)` | Texto secundario |
| `content-subtle` | `var(--color-slate-500)` | Ayudas, contadores y metadatos |
| `content-faint` | `var(--color-slate-400)` | Placeholders e iconos discretos |
| `content-inverse` | `#ffffff` | Texto sobre fondos oscuros |

## Documento clínico

Estos tokens conservan los hexadecimales que ya utilizaba el diálogo. Se mantienen separados de las referencias a Tailwind para conservar exactamente esos tonos.

| Variable (`--color-…`) | Valor inicial | Uso |
| --- | --- | --- |
| `document-content` | `#334155` | Texto base del diálogo y del tooltip |
| `document-label` | `#1e293b` | Etiquetas de los datos del paciente |
| `document-value` | `#0f172a` | Valores de los datos del paciente |
| `document-heading` | `#475569` | Títulos de las secciones clínicas |
| `document-surface` | `#f8fafc` | Fondos de cabecera y decisión del diálogo |

## Bordes

| Variable (`--color-…`) | Valor inicial | Uso |
| --- | --- | --- |
| `line` | `#dfe5eb` | Borde general de paneles y separadores |
| `line-soft` | `var(--color-slate-200)` | Borde de pestañas inactivas |
| `line-input` | `var(--color-slate-300)` | Borde de campos editables |
| `line-subtle` | `var(--color-slate-100)` | Separadores de filas |

## Estados de revisión

| Variable (`--color-…`) | Valor inicial | Uso |
| --- | --- | --- |
| `review-pending` | `var(--color-amber-800)` | Texto e icono de pendientes |
| `review-pending-bg` | `var(--color-amber-50)` | Fondo suave de pendientes |
| `review-pending-hover` | `var(--color-amber-100)` | Hover de pendientes |
| `review-accepted` | `var(--color-emerald-800)` | Texto e icono de aceptados; hover del botón sólido |
| `review-accepted-bg` | `var(--color-emerald-50)` | Fondo suave de aceptados |
| `review-accepted-hover` | `var(--color-emerald-100)` | Hover de aceptados con fondo suave |
| `review-accepted-action` | `var(--color-emerald-700)` | Fondo y borde del botón Aceptar |
| `review-rejected` | `var(--color-red-800)` | Texto e icono de rechazados |
| `review-rejected-bg` | `var(--color-red-50)` | Fondo suave de rechazados |
| `review-rejected-hover` | `var(--color-red-100)` | Hover del botón Rechazar |
| `review-rejected-action` | `var(--color-red-700)` | Borde del botón Rechazar |

## Indicadores booleanos y errores

| Variable (`--color-…`) | Valor inicial | Uso |
| --- | --- | --- |
| `indicator-yes` | `#166534` | Icono booleano SÍ |
| `indicator-yes-bg` | `#dcfce7` | Fondo del icono SÍ |
| `indicator-no` | `#991b1b` | Icono booleano NO |
| `indicator-no-bg` | `#fee2e2` | Fondo del icono NO |
| `indicator-unknown` | `#475569` | Icono booleano desconocido |
| `indicator-unknown-bg` | `#f1f5f9` | Fondo del icono desconocido |
| `error` | `var(--color-red-800)` | Texto de los mensajes de error |
| `error-bg` | `var(--color-red-50)` | Fondo de los mensajes de error |

## Pie de página y capas

| Variable (`--color-…`) | Valor inicial | Uso |
| --- | --- | --- |
| `footer` | `#17344d` | Fondo del pie de página |
| `footer-content` | `var(--color-slate-200)` | Texto del pie de página |
| `footer-muted` | `var(--color-slate-300)` | Texto secundario del pie de página |
| `footer-line` | `var(--color-slate-700)` | Borde superior del pie de página |
| `panel-shadow` | `#183b5604` | Color de la sombra de paneles |
| `floating-shadow` | `#102c4533` | Color de la sombra del diálogo y tooltip |
| `backdrop` | `#10283d80` | Fondo superpuesto detrás del diálogo |

## Cómo utilizarlos

Cada variable `--color-nombre` permite usar clases de Tailwind como `bg-nombre`, `text-nombre`, `border-nombre` y `outline-nombre`. También admite variantes como `hover:` y transparencia como `/60`.

```tsx
className="bg-surface text-content border-line"
className="border-current bg-review-pending-bg text-review-pending hover:bg-review-pending-hover"
```

Para cambiar el color de pendientes, edita `review-pending`, `review-pending-bg` y `review-pending-hover`. El texto, iconos, botones y pestañas que usan esos nombres se actualizarán juntos. `border-current` mantiene el borde del botón del mismo color que el texto.

```css
/* En @theme, sustituye las declaraciones existentes. */
--color-review-pending: #854d0e;
--color-review-pending-bg: #fefce8;
--color-review-pending-hover: #fef9c3;
```

Para cambiar los paneles, edita `surface`; para el fondo general, `canvas`. El borde blanco de la pestaña seleccionada usa también `surface`, para mantener su continuidad con el panel.

El foco general usa `focus` y las pestañas usan `focus-tab`. Las formas, posición y grosor del foco siguen en las reglas de cada componente.

Los resultados booleanos (`indicator-*`), los estados de revisión (`review-*`) y los errores (`error*`) tienen tokens separados: cambiar el color de un paciente rechazado no debe cambiar automáticamente el significado visual de un indicador NO o un error de importación.

En CSS normal, fuera de `@apply`, se utiliza la variable directamente:

```css
.column-help-content {
  background: var(--color-surface);
  color: var(--color-document-content);
  border-color: var(--color-line);
}
```

Los SVG e imágenes de marca conservan sus colores originales. No se introduce un tema oscuro ni controles nuevos en la aplicación.
