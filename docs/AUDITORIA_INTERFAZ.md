# Auditoría funcional de la interfaz de Patient Discovery

**Fecha de revisión** 27 de noviembre de 2026

**Guía para revisores** [Cómo usar Patient Discovery](GUIA_DE_USO.md)

La revisión cubre la interfaz de la versión local del proyecto. Se leyó el código de los recorridos y se probó la compilación en Chromium con CSV, diccionario, protocolo e informes sintéticos. Las pruebas incluyeron escritorio a 1280 px y móvil a 390 px, además de respuestas de error simuladas. Quedan fuera la comprobación del contenido clínico, el despliegue publicado, el rendimiento con cohortes grandes y una evaluación completa con lectores de pantalla u otros navegadores.

## Cobertura funcional

| Área | Comportamiento comprobado |
| --- | --- |
| Entrada, navegación y protocolo | Estado inicial, exportación desactivada sin cohorte, salto al contenido con teclado, presencia de enlaces institucionales y apertura, cierre y fallo de carga del protocolo. La navegación a sitios externos quedó fuera de la prueba. |
| Importación y sustitución | Carga de CSV válido, aviso ante archivo mal formado y recuperación con otro archivo. La confirmación de sustitución permite volver a la revisión, exportar y cambiar de cohorte o descartar las decisiones. |
| Tabla principal | Pestañas y navegación con flechas, paginación, ordenación y filtro, columnas visibles, estado sin resultados y restablecimiento de la vista. Se probaron también el cambio de pestaña y el cambio de CSV con el mismo nombre. |
| Ficha y progreso | Apertura del registro original, cancelación del borrador, aceptación y rechazo, motivo opcional, edición posterior del estado y actualización del progreso. |
| Exportación | Descarga con filas revisadas y pendientes, estado, motivo y fecha de revisión cuando corresponde. Se comprobó el flujo de exportar antes de sustituir la cohorte. |
| Documentos | Acceso desde el icono de la fila, desde la ficha y desde **Todos los documentos**. En el listado global se probaron la búsqueda por identificador, la ordenación, la paginación y el diálogo de lectura con retorno al botón que lo abrió. También se comprobaron el aviso al faltar el identificador y los errores de carga del listado y de un informe. El botón independiente **Explorar documentos clínicos** está oculto en la interfaz actual. |
| Visor | Lectura, búsqueda dentro del texto, contador de coincidencias, navegación, limpieza de búsqueda y cierre con teclado. La lectura se conserva en modo de solo lectura. |
| Evidencias | Filtro desde **Ver documentos**, acceso directo desde la ayuda del criterio, búsqueda desde el listado global, paciente con varias filas, paciente fuera de la cohorte, sinónimos, coincidencia por fecha del informe, fallo parcial y reintento. |
| Diccionario | Acceso desde la vista del editor, validación, alta y baja de definiciones, descarte y aplicación de cambios, descarga con sinónimos y alcance de sesión. Se probó el reintento de carga. |

## Correcciones prioritarias

**Alta** indica que el problema puede confundir la revisión o comprometer la interpretación de los resultados. **Media** indica una barrera de uso o una pérdida de contexto que tiene una forma de recuperación.

| Prioridad | Hallazgo y efecto | Corrección propuesta | Evidencia |
| --- | --- | --- | --- |
| Alta | **Una búsqueda de evidencias parcial puede parecer completa.** El selector admite resultados de los informes leídos y muestra un botón de reintento. El aviso de búsqueda parcial está oculto. Cuando no hay coincidencias, el selector puede quedarse con **Todos los documentos** como única opción, sin explicar el resultado. | Mostrar el estado al lado del selector y anunciarlo al actualizarse. Distinguir **Sin referencias**, **Búsqueda parcial** y **Sin evidencias configuradas**. Mantener el filtro que oculta entradas individuales sin referencias. | Fallo de un informe simulado en Chromium. Confirmación del aviso oculto y del selector operativo. [Panel de documentos](../src/components/ClinicalDocumentsSheet.tsx) |
| Alta | **Se aceptan cabeceras duplicadas en el CSV de la cohorte.** Un archivo con dos columnas del mismo nombre se carga y una de ellas queda renombrada. Esto puede dejar un campo fuera de la definición del diccionario o alterar qué valor se revisa. | Validar los nombres originales tras quitar espacios y antes de aceptar cualquier renombrado automático. Indicar la cabecera duplicada y conservar la cohorte activa si se estaba sustituyendo. | Reproducido con un CSV sintético que repetía una cabecera. [Carga de CSV](../src/services/csvService.ts) |
| Alta | **El estado de exportación se actualiza al iniciar la descarga.** Si el navegador bloquea la descarga o el usuario la cancela, la aplicación puede tratar las decisiones como exportadas. En **Exportar y cargar CSV** la cohorte se reemplaza al iniciarse la descarga. | Separar la descarga de la confirmación de sustitución. Mantener las decisiones hasta que la persona confirme que tiene el archivo y quiere cargar la nueva cohorte. | Revisado en código. Chromium completó la descarga normal. El bloqueo por el navegador queda pendiente de prueba específica. [Revisión y sustitución](../src/App.tsx) · [Exportación](../src/services/exportService.ts) |
| Media | **Dos CSV distintos con el mismo nombre pueden compartir el filtro anterior.** Al sustituir una cohorte por otra con el mismo nombre, el buscador puede conservar la consulta de la primera. La nueva cohorte puede parecer vacía. | Reiniciar la vista al confirmar una nueva carga usando la identidad de esa carga. Comprobar que búsqueda, ordenación, paginación y columnas vuelven a sus valores iniciales. | Reproducido en Chromium con dos archivos sintéticos distintos llamados igual. [Revisión de cohortes](../src/App.tsx) |
| Media | **En el panel de evidencias el selector carece de un nombre accesible.** El buscador de **Todos los documentos** depende del texto de ejemplo, que desaparece al escribir. | Poner nombres estables como **Evidencia que se muestra** y **Buscar por identificador de paciente**. Usar una etiqueta visible cuando haya espacio y una etiqueta accesible en los diseños compactos. | Inspección en Chromium del selector y de los atributos del buscador. [Panel de documentos](../src/components/ClinicalDocumentsSheet.tsx) · [Tabla de documentos](../src/components/ClinicalDocumentsTable.tsx) |
| Media | **El foco de teclado de «Todos los documentos» es invisible.** La tecla Tab llega al control, que se puede abrir con Intro, y la franja conserva exactamente el mismo aspecto. | Revisar el ajuste visual con el equipo. Una opción es cambiar solo el color del borde cuando se llega con teclado y conservar el fondo y el estilo al hacer clic. | Reproducido con Tab y comprobación de estilos en Chromium. [Tabla de pacientes](../src/components/PatientTable.tsx) |

## Mejoras propuestas

| Prioridad | Mejora | Resultado esperado |
| --- | --- | --- |
| Alta | **Verificar la cohorte antes de revisarla.** Mostrar si faltan columnas esperadas, si hay identificadores documentales vacíos y qué campos admite el diccionario elegido. Permitir una revisión manual cuando sea suficiente. | El equipo sabe desde la carga qué datos y funciones están disponibles. Los identificadores repetidos pueden seguir siendo válidos cuando hay varias filas por paciente. |
| Alta | **Diseñar una forma de reanudar una revisión.** Acordar primero cómo identificar el archivo y cada registro y dónde se permite conservar las decisiones. Mostrar una vista previa antes de restaurarlas. | Se pueden continuar cohortes largas con menos riesgo de asociar decisiones a una fila equivocada. |
| Media | **Conservar la vista al cambiar de pestaña dentro de la misma cohorte.** Mantener búsqueda, ordenación y columnas por pestaña. Reiniciar las preferencias al cargar otra cohorte. | Se puede volver a una lista filtrada sin repetir la búsqueda. En la versión revisada, cambiar de pestaña borra el filtro. |
| Media | **Proteger el motivo en edición.** Avisar al salir de una ficha con cambios pendientes y ofrecer continuar editando o descartar. | Evita perder una justificación escrita al pulsar la X o Esc. **Cancelar** ya descarta el motivo en la versión actual. |
| Media | **Diferenciar con claridad las tres búsquedas.** Mantener etiquetas concretas para registros, identificadores de pacientes y texto del informe. En resultados por fecha, indicar dentro del listado que se trata de la fecha del documento. | Queda claro qué se está filtrando y por qué un informe puede aparecer sin una frase resaltada. |
| Media | **Facilitar los reintentos documentales.** Añadir una acción visible de reintento a los estados de error del índice y de lectura del informe. | La persona puede recuperar el acceso sin cerrar toda la vista y perder su contexto. |
| Media | **Hacer más manejable el diccionario.** Añadir búsqueda por nombre o criterio y priorizar los campos de edición más usados. | Es más fácil encontrar y ajustar un sinónimo en cohortes con muchas columnas. |
| Baja | **Unificar el acceso al explorador.** Decidir si **Todos los documentos** será la única entrada global y reflejarlo en la interfaz y la documentación. | Se reducen los accesos duplicados y queda claro cuál es el recorrido habitual. |
| Baja | **Ajustar mensajes y controles compactos.** Mejorar el singular de los recuentos, mostrar un estado vacío más específico y revisar el espacio táctil de paginación y cierre. | La interfaz explica el contexto con mayor claridad, especialmente en móvil. |

## Orden de intervención

1. **Fiabilidad de la revisión.** Hacer visibles los estados de búsqueda y validar cabeceras antes de aceptar un CSV. Separar la sustitución de la confirmación de descarga.
2. **Navegación y accesibilidad.** Corregir los nombres accesibles, decidir el indicador de teclado y restablecer correctamente la vista al cambiar de archivo.
3. **Continuidad de trabajo.** Conservar preferencias dentro de una cohorte, proteger borradores y definir el flujo de reanudación.

Se ejecutaron `npm run lint`, `npm run build` y las pruebas existentes de búsqueda de evidencias. Esta entrega incorpora la auditoría y la guía de uso. Las correcciones de interfaz quedan como propuestas.
