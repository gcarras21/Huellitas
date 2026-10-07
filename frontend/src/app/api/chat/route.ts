import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        // 1. Obtener perros
        const { data: dogs } = await supabase.from('dogs').select('name, breed, size, energy_level, temperament, good_with_kids, photo_url');

        const system_prompt = `
    Eres 'Huellitas AI', un asistente experto en adopción de perros.
    Tu trabajo es leer el catálogo de perros disponibles y recomendarle al usuario el mejor match según su estilo de vida.
    Aquí está la lista de perros en adopción actualmente: ${JSON.stringify(dogs)}
    
    Reglas MUY IMPORTANTES:
    1. Sé EXTREMADAMENTE conciso y directo. Responde en 1 o 2 párrafos cortos como máximo.
    2. Cuando recomiendes a un perro, DEBES incluir su foto en tu respuesta usando una etiqueta HTML válida de imagen con su 'photo_url'. Ejemplo: <br/><img src="URL" style="width: 250px; border-radius: 12px; margin-top: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
    3. Sé muy conversacional y empático. Puedes usar **negritas** para enfatizar.
    `;

        const groqKey = process.env.GROQ_API_KEY;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b",
                messages: [
                    { role: "system", content: system_prompt },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();
        const reply = data.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (e: any) {
        return NextResponse.json({ reply: `Lo siento, hubo un error procesando tu solicitud: ${e.message}` });
    }
}
