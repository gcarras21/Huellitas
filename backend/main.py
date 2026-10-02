from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Huellitas AI Backend")

# Habilitar CORS para que el frontend (React) pueda hacer peticiones
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiar por la URL de React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "¡Bienvenido a la API de Huellitas AI!"}

@app.get("/api/shelter-stats")
def get_stats():
    # Aquí es donde conectaremos Pandas y Supabase luego
    return {
        "total_dogs": 34,
        "available_adoption": 18,
        "in_foster": 4,
        "quarantine": 2
    }
