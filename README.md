# Patient Discovery

Aplicación web para consultar cohortes de pacientes a partir de un archivo CSV, revisar candidatos y documentar las decisiones. Desarrollada con React, TypeScript y Vite, con Tailwind CSS para los estilos y TanStack Table para la tabla de registros.

## Cómo lanzar la aplicación

Con Node.js y npm instalados, ejecuta desde la raíz del proyecto:

```bash
npm install
npm run dev
```

Abre en el navegador la dirección que indique la terminal, normalmente `http://localhost:5173`.

Para generar y previsualizar la versión compilada:

```bash
npm run build
npm run preview
```

Para comprobar el código con el linter:

```bash
npm run lint
```

## Funcionalidades actuales

- Carga de archivos CSV con encabezados y registros de pacientes.
- Tabla con columnas generadas a partir del archivo cargado.
- Búsqueda de registros, ordenación, paginación y selección de columnas visibles.
- Restablecimiento de la búsqueda, la ordenación y las columnas visibles.
- Filtrado por estado de revisión: pendiente, aceptado o rechazado.
- Revisión de candidatos mediante un diálogo con justificación obligatoria.
- Recuento de registros por estado e indicador del progreso de revisión.
- Exportación del CSV con los datos originales, el estado de revisión, la justificación y la fecha de la decisión.
- Carga de otro CSV desde un botón junto a la opción de exportación.
- Interfaz en español, adaptable a distintos tamaños de pantalla.

Los archivos se procesan en el navegador. Los datos y las decisiones se mantienen en memoria: se pierden al recargar la página o cargar otro archivo. Exporta la revisión antes de salir si quieres conservarla. Actualmente, las decisiones guardadas no se pueden modificar.

Los estados reflejan decisiones de revisión; no implican por sí mismos una validación de la elegibilidad clínica.

## Mejoras pendientes

Esta lista recoge propuestas para futuras versiones. No están implementadas.

- [ ] **Añadir un score sintético:** incorporar una puntuación de demostración para cada paciente, identificada claramente como sintética y sin valor de validación clínica.
- [ ] **Añadir un botón para modificar una decisión:** permitir editar el estado y la justificación de una revisión ya guardada, actualizando los recuentos y la exportación.
- [ ] **Mejorar la visualización de los datos de pacientes:** mostrar inicialmente solo unas pocas columnas relevantes para facilitar la lectura de la tabla.
- [ ] **Añadir un diálogo con el detalle del paciente:** al pulsar sobre un paciente, mostrar todos sus datos en un diálogo organizado y legible, incluidos los campos que no se muestran en la tabla.
