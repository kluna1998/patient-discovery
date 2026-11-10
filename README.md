# Patient Discovery

https://kluna1998.github.io/patient-discovery/

Aplicación web para consultar cohortes de pacientes a partir de un archivo CSV, revisar candidatos y documentar las decisiones. Desarrollada con React, TypeScript y Vite, con Tailwind CSS para los estilos y TanStack Table para la tabla de registros.

Los archivos se procesan en el navegador. Los datos y las decisiones se mantienen en memoria: se pierden al recargar la página o cargar otro archivo. Exporta la revisión antes de salir si quieres conservarla. Actualmente, las decisiones guardadas no se pueden modificar.

## Diccionario de columnas

El diccionario inicial se carga desde `public/info_columns_dict.csv`, con los campos `column_name` (nombre exacto del encabezado del CSV), `readable_name` (título legible) y `meaning` (descripción). Se respetan los textos y el idioma del archivo.

El editor solo se muestra al añadir `?debug=1` a la URL (o `&debug=1` si ya contiene otros parámetros), también en producción. Los títulos legibles y las ayudas se muestran siempre.

En **Diccionario de columnas** puedes añadir, editar o eliminar definiciones, incluso antes de cargar una cohorte. Los tres campos son obligatorios y los nombres originales deben ser únicos. Pulsa **Guardar cambios** para aplicarlos o **Descartar cambios** para volver a la versión guardada. Eliminar una definición no elimina la columna ni los datos de la cohorte.

La tabla y el selector de columnas muestran el título legible. Al pasar el cursor sobre el icono de información de cada encabezado aparece una burbuja con la descripción y el nombre original. También se muestra al enfocar el icono con el teclado o tocarlo en una pantalla táctil; se cierra al salir o pulsar Escape. Las columnas sin definición muestran su nombre original. Los encabezados de la exportación de revisión conservan sus nombres originales.

Los cambios del diccionario se conservan en `localStorage` en este navegador y tienen prioridad sobre el CSV del proyecto. **Descargar diccionario CSV** exporta la versión guardada: para compartirla con todos los usuarios, sustituye `public/info_columns_dict.csv` por el archivo descargado y vuelve a desplegar. La web no escribe directamente en el repositorio. Para volver a cargar el archivo del proyecto en un navegador con una copia guardada, elimina la clave `patient-discovery.column-dictionary.v1` de su almacenamiento local y recarga.

## Mejoras pendientes

- [ ] **Añadir un score sintético:** para hacer rankings?
- [ ] **Añadir un botón para modificar una decisión:** 
- [ ] **Añadir un diálogo con el detalle del paciente:** al pulsar sobre un paciente mostrar todos sus datos en un diálogo organizado y legible
