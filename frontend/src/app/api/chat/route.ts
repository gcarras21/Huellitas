import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        // 1. Obtener perros
        const { data: dogs } = await supabase.from('dogs').select('name, breed, size, energy_level, temperament, good_with_kids');

        const system_prompt = `
    Eres 'Huellitas AI', un asistente experto en adopción de perros.
    Tu trabajo es leer el catálogo de perros disponibles y recomendarle al usuario el mejor match según su estilo de vida.
    Aquí está la lista de perros en adopción actualmente: ${JSON.stringify(dogs)}
    
    Reglas MUY IMPORTANTES:
    1. Sé EXTREMADAMENTE conciso y directo. Responde en 1 o 2 párrafos cortos como máximo.
    2. NO uses formato markdown. Está estrictamente PROHIBIDO usar **asteriscos** para negritas o listas con viñetas. Usa texto completamente plano.
    3. Cuando recomiendes a un perro, menciona su nombre exacto para que el sistema pueda mostrar su foto en pantalla.
    4. Sé muy conversacional y empático.
    `;

        const groqKey = process.env.GROQ_API_KEY;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-70b-versatile",
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
