import numpy as np
from scipy.spatial import distance

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
    if "no tengo experiencia" in v or "primerizo" in v: return 1
    if "experiencia" in v: return 2
    return 1 # Primerizo por defecto

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

def calcular_match(prefs, all_dogs, fav_dog_ids):
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
        # Solo excluimos si el perro dice explicitamente False (que NO es apto). Si es None, lo dejamos pasar.
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
        
        # Sugerimos todos los perros y ordenamos, el límite de 30% lo quitamos para que siempre muestre cartas
        if match_pct >= 0:
            d['match_percentage'] = match_pct
            scored_dogs.append(d)
            
    # Ordenar de mayor a menor compatibilidad
    scored_dogs.sort(key=lambda x: x['match_percentage'], reverse=True)
    return scored_dogs
