import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateProfile() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'gabriel@gmail.com',
    password: 'Gabriel123',
  });

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id, full_name: 'Gabriel', role: 'admin' });
    console.log("Perfil actualizado", profileError || "OK");
  } else {
    console.error("Error signing in:", error);
  }
}

updateProfile();
