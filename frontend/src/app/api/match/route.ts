import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// KNN logic
function map_size(val: string) {
    const v = String(val).toLowerCase();
    if (v.includes("pequeño") || v.includes("chico") || v.includes("small")) return 1;
    if (v.includes("grande") || v.includes("large")) return 3;
    return 2;
}
function map_energy(val: string) {
    const v = String(val).toLowerCase();
    if (v.includes("bajo") || v.includes("low")) return 1;
    if (v.includes("alto") || v.includes("high")) return 3;
    return 2;
}
function map_exp(val: string) {
    const v = String(val).toLowerCase();
    if (v.includes("no tengo experiencia") || v.includes("primerizo")) return 1;
    if (v.includes("experiencia")) return 2;
    return 1;
}
function map_house(val: string) {
    const v = String(val).toLowerCase();
    if (v.includes("departamento")) return 1;
    if (v.includes("grande")) return 3;
    return 2;
}
function map_age_group(val: string) {
    const v = String(val).toLowerCase();
    if (v.includes("cachorro")) return 1;
    if (v.includes("adulto")) return 3;
    if (v.includes("senior")) return 4;
    return 2;
}
function map_dog_age(months: number | null) {
    if (!months) return 2;
    if (months <= 12) return 1;
    if (months <= 36) return 2;
    if (months <= 84) return 3;
    return 4;
}

function euclideanDistance(a: number[], b: number[]) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

export async function POST(request: Request) {
    try {
        const { user_id, prefs, fav_dog_ids } = await request.json();
        if (!prefs) {
            return NextResponse.json({ error: 'Preferencias no encontradas' }, { status: 400 });
        }

        const { data: dogsData } = await supabase.from('dogs').select('*');
        const all_dogs = (dogsData || []).filter(d => !d.is_adopted);

        const U = [
            map_size(prefs.preferred_size || ""),
            map_energy(prefs.activity_level || ""),
            map_exp(prefs.experience_level || ""),
            map_house(prefs.housing_type || ""),
            map_age_group(prefs.preferred_age_group || "")
        ];

        const max_dist = 4.69;
        const scored_dogs = [];

        for (const d of all_dogs) {
            if (fav_dog_ids.includes(d.id)) continue;

            const D = [
                map_size(d.size || ""),
                map_energy(d.energy_level || ""),
                map_exp(d.experience_level_required || ""),
                map_house(d.housing_type_recommended || ""),
                map_dog_age(d.age_months || 24)
            ];

            const dist = euclideanDistance(U, D);
            let match_pct = Math.max(0, Math.floor((1 - (dist / max_dist)) * 100));

            if (prefs.has_kids && d.good_with_kids === false) match_pct = 0;
            if (prefs.has_cats && d.good_with_cats === false) match_pct = 0;
            if (prefs.has_dogs && d.good_with_other_dogs === false) match_pct = 0;

            if (match_pct >= 0) {
                scored_dogs.push({ ...d, match_percentage: match_pct });
            }
        }

        scored_dogs.sort((a, b) => b.match_percentage - a.match_percentage);

        return NextResponse.json({ matches: scored_dogs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
