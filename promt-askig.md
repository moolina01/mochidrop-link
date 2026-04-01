Quiero que revises la factibilidad de implementar esta funcionalidad en LinkDrop y me propongas un plan concreto de implementación, aterrizado al código actual del proyecto.

Nueva funcionalidad:

Cada pyme debe tener una opción de configuración llamada `ask_instagram`, desactivada por defecto.

Si la pyme la activa:

* en los links nuevos que genere debe aparecer un campo adicional en el formulario del cliente: `Instagram`
* ese campo debe ser obligatorio
* el valor debe guardarse junto con los datos del envío
* al generar la guía, ese Instagram debe agregarse al nombre del destinatario, por ejemplo:
  `Mauricio Molina / pipinegrovape`

Si la opción está desactivada:

* el campo no debe aparecer

Quiero que me respondas en base al código actual de LinkDrop y me digas:

1. Qué tan factible es implementarlo
2. Qué partes del sistema habría que tocar
3. Qué cambios harías en base de datos, frontend, backend y generación de guía
4. Qué riesgos o edge cases ves
5. Un plan paso a paso, simple y pragmático, para implementarlo sin sobreingeniería

Importante:

* no me des una respuesta genérica
* aterrízalo a la estructura actual del proyecto
* prioriza una solución simple, rápida y mantenible
* si detectas que hay más de una forma de hacerlo, recomiéndame la más conveniente para esta etapa del proyecto
