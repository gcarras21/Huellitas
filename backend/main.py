import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from supabase import create_client, Client

load_dotenv()

app = FastAPI(title="Huellitas AI Backend")

# Habilitar CORS para que el frontend (React) pueda hacer peticiones
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar Clientes (Usarán las variables del archivo .env)
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", "dummy_key"))
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL", "https://xyz.supabase.co"), 
    os.environ.get("SUPABASE_KEY", "dummy_key")
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "¡Bienvenido a la API de Huellitas AI (Motor LLaMA)!"}

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    # 1. Obtener los perritos de la BD para darle contexto a LLaMA (RAG Simple)
    response = supabase.table("dogs").select("name, breed, size, energy_level, temperament, good_with_kids").execute()
    dogs = response.data

    # 2. Construir el prompt del sistema
    system_prompt = f"""
    Eres 'Huellitas AI', un asistente experto en adopción de perros.
    Tu trabajo es leer el catálogo de perros disponibles y recomendarle al usuario el mejor match según su estilo de vida.
    Aquí está la lista de perros en adopción actualmente: {dogs}
    
    Reglas MUY IMPORTANTES:
    1. Sé EXTREMADAMENTE conciso y directo. Responde en 1 o 2 párrafos cortos como máximo.
    2. NO uses formato markdown. Está estrictamente PROHIBIDO usar **asteriscos** para negritas o listas con viñetas. Usa texto completamente plano.
    3. Cuando recomiendes a un perro, menciona su nombre exacto para que el sistema pueda mostrar su foto en pantalla.
    4. Sé muy conversacional y empático.
    """

    try:
        # 3. Llamar a LLaMA a través de Groq
        completion = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=500,
        )
        reply_content = completion.choices[0].message.content
        
        # Guardar uso de tokens en base de datos
        try:
            if hasattr(completion, 'usage') and completion.usage:
                supabase.table("ai_usage").insert({
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens
                }).execute()
        except Exception as metric_err:
            print("Error guardando metricas:", metric_err)
            
        return {"reply": reply_content}
    except Exception as e:
        return {"reply": f"Lo siento, hubo un error procesando tu solicitud: {str(e)}"}

