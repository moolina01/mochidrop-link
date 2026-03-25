Tengo un problema de integración con Flow (pasarela de pago chilena).

SITUACIÓN:
- Cliente paga en Flow
- Flow intenta llamar a mi webhook en POST /api/flow/confirmation
- Flow me responde que no recibió HTTP 200 en menos de 15 segundos

MENSAJE DE ERROR DE FLOW:
- HTTP Code: 999 (debería ser 200)
- Tiempo de respuesta: 0 segundos
- Dice: "Su sitio no respondió a la confirmación de Flow en menos de 15 segundos"

MIS SOSPECHAS:
1. El endpoint /api/flow/confirmation no existe o no está respondiendo
2. Supabase está fallando y tarda demasiado
3. El sitio no está deployado correctamente (Flow no puede alcanzarlo)

NECESITO:
1. Validar que el endpoint /api/flow/confirmation exista y responda 200 OK rápido
2. Que el endpoint NO espere a N8N (llamar N8N en background sin await)
3. Que responda en menos de 2 segundos

MI STACK:
- [Next.js / Express / etc - dime cuál usas]
- Supabase (tabla: envios)
- Flow API
- N8N (webhook para generar guías)
- Deployado en [Vercel / Railway / etc - dime dónde]

FLOW DE LO QUE DEBE PASAR:
Cliente paga → Flow llama /api/flow/confirmation → Responde 200 inmediatamente 
→ Guarda datos en Supabase → Llama N8N en background → N8N genera guía

¿Puedes revisar mi endpoint y asegurar que responda correctamente a Flow?