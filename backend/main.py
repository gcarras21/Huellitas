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
    
    Reglas:
    - Sé amable, conciso y entusiasta.
    - Si el usuario te pregunta por perros, recomienda solo los que están en la lista proporcionada.
    - Haz preguntas de seguimiento para conocer su estilo de vida si es su primer mensaje (ej. ¿Vives en casa o departamento? ¿Tienes niños?).
    """

    try:
        # 3. Llamar a LLaMA a través de Groq
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=500,
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        return {"reply": f"Lo siento, hubo un error procesando tu solicitud: {str(e)}"}

