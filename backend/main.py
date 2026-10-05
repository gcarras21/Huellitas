import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from supabase import create_client, Client
import pandas as pd
import numpy as np
from scipy.spatial import distance

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

class MatchRequest(BaseModel):
    user_id: str

def map_size(val):
    v = str(val).lower()
    if "pequeño" in v or "chico" in v: return 1
    if "grande" in v: return 3
    return 2 # Mediano por defecto

def map_energy(val):
    v = str(val).lower()
    if "bajo" in v: return 1
    if "alto" in v: return 3
    return 2 # Moderado

def map_exp(val):
    v = str(val).lower()
    if "experiencia" in v: return 2
    return 1 # Primerizo

def map_house(val):
    v = str(val).lower()
    if "departamento" in v: return 1
    if "grande" in v: return 3
    return 2 # Casa chica

def map_age_group(val):
    v = str(val).lower()
    if "cachorro" in v: return 1
    if "adulto" in v: return 3
    if "senior" in v: return 4
    return 2 # Joven

def map_dog_age(months):
    if not months: return 2
    if months <= 12: return 1
    if months <= 36: return 2
    if months <= 84: return 3
    return 4

@app.post("/api/match")
async def get_huellitas_match(request: MatchRequest):
    try:
        # 1. Extraer preferencias
        prefs_res = supabase.table("user_preferences").select("*").eq("user_id", request.user_id).execute()
        if not prefs_res.data:
            return {"error": "Preferencias no encontradas"}
        
        prefs = prefs_res.data[0]
        
        # 2. Extraer perros
        dogs_res = supabase.table("dogs").select("*").eq("is_adopted", False).execute()
        all_dogs = dogs_res.data
        if not all_dogs:
            return {"matches": []}
            
        # 3. Extraer favoritos para excluir
        fav_res = supabase.table("user_favorites").select("dog_id").eq("user_id", request.user_id).execute()
        fav_dog_ids = [f['dog_id'] for f in fav_res.data]
        
        # 4. Pre-filtrado (Hard Filters) y cálculo de vector de Usuario
        # U = [Size, Energy, Experience, Housing, Age]
        U = [
            map_size(prefs.get("preferred_size", "")),
            map_energy(prefs.get("activity_level", "")),
            map_exp(prefs.get("experience_level", "")),
            map_house(prefs.get("housing_type", "")),
            map_age_group(prefs.get("preferred_age_group", ""))
        ]
        
        max_dist = 4.69 # sqrt(2^2 + 2^2 + 1^2 + 2^2 + 3^2) = sqrt(4+4+1+4+9) = sqrt(22) = 4.69
        
        scored_dogs = []
        for d in all_dogs:
            if d['id'] in fav_dog_ids:
                continue
                
            # Reglas de convivencia duras (Hard Constraints)
            if prefs.get("has_kids") and d.get("good_with_kids") is False:
                continue
            if prefs.get("has_cats") and d.get("good_with_cats") is False:
                continue
            if prefs.get("has_dogs") and d.get("good_with_other_dogs") is False:
                continue
                
            # Vector del perro
            D = [
                map_size(d.get("size", "")),
                map_energy(d.get("energy_level", "")),
                map_exp(d.get("experience_level_required", "")),
                map_house(d.get("housing_type_recommended", "")),
                map_dog_age(d.get("age_months", 24))
            ]
            
            # Distancia Euclidiana (KNN core logic)
            dist = distance.euclidean(U, D)
            match_pct = max(0, int((1 - (dist / max_dist)) * 100))
            
            # Solo sugerimos perros que superen el 30% de match para evitar malos matches
            if match_pct > 30:
                d['match_percentage'] = match_pct
                scored_dogs.append(d)
                
        # 5. Ordenar de mayor a menor compatibilidad
        scored_dogs.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        return {"matches": scored_dogs}
        
    except Exception as e:
        print(e)
        return {"error": str(e)}

