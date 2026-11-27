# Guía de uso de Patient Discovery

Patient Discovery permite revisar los registros de una cohorte, consultar sus informes y descargar las decisiones de revisión. Cada fila es un registro independiente. Si un identificador aparece varias veces, cada fila conserva su propia decisión.

## 1. Abre el protocolo y carga la cohorte

1. Pulsa **Protocolo** para consultar los criterios de inclusión y exclusión. Puedes abrirlo antes o después de cargar el archivo. Ciérralo con la X o con **Esc**.
2. En **Cargar resultados**, selecciona el archivo CSV de la cohorte. La primera fila debe contener los nombres de las columnas y el archivo debe incluir al menos un registro.
3. Comprueba el nombre del archivo, el total de registros y el **Progreso de revisión**. El progreso cuenta los registros aceptados y rechazados.
4. Si aparece un error de carga, comprueba el separador, las comillas y que las filas tengan el mismo número de campos. Corrige el archivo y vuelve a seleccionarlo.

Para consultar informes asociados, el identificador del paciente en la columna `nhc` debe coincidir con el del listado de documentos. Para practicar o compartir ejemplos, usa datos sintéticos.

## 2. Encuentra el registro que quieres revisar

- **Pendientes**, **Aceptados** y **Rechazados** muestran los registros de cada estado. El número de cada pestaña corresponde al total de ese estado. Con el foco en una pestaña, puedes cambiar de estado con las flechas izquierda y derecha.
- **Buscar en los registros…** acota la lista de la pestaña actual. El pie de la tabla indica cuántos registros coinciden.
- **Columnas visibles** abre las casillas para mostrar u ocultar campos. Puedes usarlo para consultar un dato concreto y cerrar después las opciones.
- **Ordena y pasa de página** pulsando un encabezado con flechas o usando las flechas de paginación. Puedes desplazar la tabla horizontalmente para ver más columnas.
- **Restablecer vista**, el botón con la flecha circular, limpia la búsqueda y la ordenación, recupera las columnas iniciales y vuelve a la primera página.
- Los iconos de **información** de los encabezados explican los campos incluidos en el diccionario de la cohorte.

Al cambiar de pestaña, la tabla vuelve a abrirse con sus controles iniciales. Si necesitas comparar registros entre estados, vuelve a introducir la búsqueda en cada pestaña.

## 3. Revisa y registra una decisión

1. Pulsa **Revisar** en la fila correspondiente. El número de registro de la ficha identifica su posición original en la cohorte, aunque hayas ordenado o filtrado la tabla.
2. Consulta los datos por secciones. Los iconos de información muestran las explicaciones y las evidencias disponibles para el criterio. Si aparece **Sin datos**, el registro carece de un valor que la interfaz pueda mostrar para ese campo.
3. Lee los informes que necesites. Puedes abrir el listado con **Ver documentos** o seguir la lupa de una evidencia concreta desde el panel de ayuda del criterio.
4. Escribe, si procede, el **Motivo de la decisión**. Es opcional y admite hasta 2.000 caracteres.
5. Pulsa **Aceptar** o **Rechazar**. La fila pasa a su pestaña y se actualiza el progreso. **Cancelar** o la X cierran la ficha y descartan las ediciones sin guardar.
6. Para corregir una decisión, localiza el registro en **Aceptados** o **Rechazados**, pulsa **Modificar**, ajusta el estado o el motivo y elige **Guardar cambios**.

## 4. Consulta los documentos

| Si quieres… | Usa… |
| --- | --- |
| Leer los informes de una fila rápidamente | El icono de documento junto a **Revisar** o **Modificar**. |
| Leer informes mientras revisas un registro | **Ver documentos** dentro de la ficha. |
| Buscar un paciente en todo el listado de documentos | **Todos los documentos**. Busca por identificador, ordena desde la cabecera y pasa de página con las flechas del listado. |
| Abrir directamente un informe del listado global | Pulsa su botón en **Todos los documentos**. Se abre en un diálogo. Al cerrarlo con **Esc** o **Cerrar visor**, conservas la búsqueda y la página del listado. |

En un panel lateral, selecciona un informe para leerlo. En pantallas estrechas, la flecha **Volver al listado de documentos** te devuelve a la lista. En pantallas grandes, **Cerrar visor** cierra la lectura y deja el listado abierto. La X **Cerrar documentos** cierra todo el panel lateral.

El contenido del informe es de **solo lectura**. Escribe en **Buscar en este informe…** para resaltar un término. Usa las flechas para avanzar o retroceder, o pulsa **Intro** y **Mayús + Intro** desde el buscador. Pulsa la X de **Limpiar búsqueda** para quitar el texto y sus resaltados.

## 5. Localiza evidencias en los informes

Hay tres formas de empezar:

1. **Lupa de un criterio en la ficha.** Abre su icono de información y pulsa la lupa junto al valor de la evidencia. Abre directamente las referencias de esa evidencia. La ayuda del criterio se cierra al entrar.
2. **Ver documentos en la ficha.** Despliega **Evidencias** y elige una entrada del selector para filtrar el listado por esa evidencia.
3. **Buscar evidencias en Todos los documentos.** Pulsa el botón de la fila del paciente. Cuando haya varias filas de ese paciente en la cohorte, elige el **Registro de la cohorte** adecuado. Si aparece **Sin registro en la cohorte**, puedes leer los informes del paciente y la búsqueda automática carece de una fila para comparar.

El número junto al nombre de una evidencia indica cuántos **documentos** tienen referencias. Al abrir un informe, las marcas y flechas de evidencia te llevan a las coincidencias en el texto. En las evidencias de texto, la búsqueda también puede detectar las variantes definidas en el diccionario. Si ves **Coincidencia en fecha del informe**, el resultado se basa en la fecha del documento y puede aparecer sin un fragmento resaltado.

En el selector aparecen las evidencias con referencias encontradas. Elige **Todos los documentos** para volver al listado completo. Si ves **Búsqueda parcial** o aparece **Reintentar búsqueda**, vuelve a intentarlo antes de dar por terminada la comprobación. Cuando el selector solo muestra **Todos los documentos**, revisa si aparece **Reintentar búsqueda** y comprueba los informes antes de tomar una decisión. Usa siempre el fragmento en su contexto para interpretar lo encontrado.

## 6. Exporta y cambia de cohorte

- Pulsa **Exportar revisión en CSV** y comprueba que se descargó el archivo terminado en `_reviewed.csv`. Incluye todos los registros, también los pendientes, junto con el estado, el motivo y la fecha de revisión cuando corresponda.
- Puedes exportar una revisión a medias. **Exporta antes de recargar o cerrar la página.** Las decisiones se conservan durante la sesión y el CSV exportado sirve como resultado, sin reanudar automáticamente la revisión al volver a abrirlo.
- Para cambiar de cohorte, pulsa **Cargar otro CSV**. Si hay decisiones sin exportar, puedes **Volver a la revisión**, **Exportar y cargar CSV** o **Cargar sin exportar**. Esta última opción descarta las decisiones anteriores.

## 7. Configura los nombres y sinónimos de una cohorte

Esta sección es para quien mantiene el diccionario de la cohorte. Abre la vista del editor añadiendo `?debug=1` al final de la dirección de la aplicación y despliega **Diccionario de columnas**.

1. Edita el título, la descripción, la sección o el tipo de los campos que correspondan a tu cohorte. Usa **Añadir columna** o el icono de papelera para agregar o quitar definiciones.
2. Para una **Evidencia** de tipo **text**, escribe las variantes en **Sinónimos**, separadas por punto y coma. Como ejemplo sintético, puedes usar `MARCADOR DEMO; MARCADOR DE PRUEBA`. Usa variantes del mismo concepto.
3. Pulsa **Aplicar cambios** para verlos durante la sesión o **Descartar cambios** para volver a las definiciones aplicadas.
4. Pulsa **Descargar diccionario CSV** para conservar una copia. Para disponer de esos cambios al volver a abrir la aplicación, entrega el archivo a la persona que mantiene el diccionario de esa cohorte.

## Si algo no aparece

| Lo que ves | Qué puedes hacer |
| --- | --- |
| **No se encontraron registros** | Limpia la búsqueda, revisa la pestaña activa y comprueba las columnas visibles. |
| No se encuentra un paciente en **Todos los documentos** | Prueba el identificador tal como figura en el listado de documentos, sin espacios adicionales. |
| No se pudo cargar el índice o un informe | Cierra el listado o informe, ábrelo de nuevo y comprueba si sigue fallando. Si persiste, comunica el problema al equipo que mantiene los datos. |
| Error al cargar el diccionario | Pulsa **Reintentar carga**. Si persiste, pide al equipo responsable que revise el diccionario de la cohorte. |
