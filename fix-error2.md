En mi endpoint /api/flow/confirmation hay un problema:
- Flow recibe HTTP 307 (redirect) en lugar de 200
- Significa que algo está redirigiendo la petición

Revisa:
1. ¿Hay middleware que esté interceptando POST /api/flow/confirmation?
2. ¿Hay validación de headers o CORS que cause redirect?
3. ¿Las variables de entorno están todas completas?
4. ¿El endpoint realmente responde new NextResponse("OK", { status: 200 })?


¿Por qué da 307 en lugar de 200?