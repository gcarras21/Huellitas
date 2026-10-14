'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Dog, Home, User, CheckCircle, LogOut, AlertCircle } from 'lucide-react';
import styles from './onboarding.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    housing_type: 'Departamento / Espacio chico',
    has_kids: false,
    has_dogs: false,
    has_cats: false,
    adults_only: false,
    activity_level: 'Moderado',
    preferred_size: 'Mediano (10-25kg)',
    preferred_age_group: 'Cualquiera',
    experience_level: 'Soy primerizo (No tengo experiencia)',
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push('/login');
  };

  // Verify if session exists and is valid on Supabase Auth server
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        handleLogout();
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('edit') !== 'true') {
        supabase.from('user_preferences').select('user_id').eq('user_id', user.id).single().then(({ data }) => {
          if (data) router.push('/mi-cuenta'); // Already completed
        });
      }
    });
  }, [router]);

  const handleNext = () => {
    setErrorMsg('');
    setStep(s => Math.min(s + 1, 4));
  };
  const handlePrev = () => {
    setErrorMsg('');
    setStep(s => Math.max(s - 1, 1));
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'adults_only') {
        if (checked) {
          setFormData(prev => ({ ...prev, adults_only: true, has_kids: false, has_dogs: false, has_cats: false }));
        } else {
          setFormData(prev => ({ ...prev, adults_only: false }));
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: checked, adults_only: checked ? false : prev.adults_only }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      handleLogout();
      return;
    }

    const { adults_only, ...dbData } = formData;

    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      ...dbData
    });

    setLoading(false);
    if (!error) {
      router.push('/mi-cuenta');
    } else {
      // If user was deleted or foreign key constraint failed, clean up session
      if (error.message.includes('foreign key constraint') || error.message.includes('user_preferences_user_id_fkey')) {
        await handleLogout();
      } else {
        setErrorMsg('Error guardando preferencias: ' + error.message);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        <div className={styles.topBar}>
          <span className={styles.stepBadge}>Paso {step} de 4</span>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar Sesión">
            <LogOut size={15} /> Cerrar Sesión
          </button>
        </div>

        <div className={styles.header}>
          <Dog size={32} color="var(--primary-orange)" />
          <h1>Huellita Match AI</h1>
          <p>Ayúdanos a encontrar tu compañero ideal respondiendo unas breves preguntas.</p>
        </div>

        {errorMsg && (
          <div className={styles.errorBanner}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className={styles.stepContent}>
          {step === 1 && (
            <div className={styles.step}>
              <h2><Home /> Sobre tu hogar</h2>
              <div className={styles.formGroup}>
                <label>¿Dónde vives?</label>
                <select name="housing_type" value={formData.housing_type} onChange={handleChange}>
                  <option>Departamento / Espacio chico</option>
                  <option>Casa chica (patio chico/sin patio)</option>
                  <option>Casa grande (patio amplio/jardín)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>¿Con quién convivirá el perrito? (Selecciona las que apliquen)</label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="has_kids" checked={formData.has_kids} onChange={handleChange} />
                  Hay niños pequeños en casa
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="has_dogs" checked={formData.has_dogs} onChange={handleChange} />
                  Tengo otros perros
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="has_cats" checked={formData.has_cats} onChange={handleChange} />
                  Tengo gatos
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="adults_only" checked={formData.adults_only} onChange={handleChange} />
                  Solo adultos (Sin niños ni otras mascotas)
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.step}>
              <h2><User /> Tu estilo de vida</h2>
              <div className={styles.formGroup}>
                <label>¿Cómo es tu nivel de actividad y rutina diaria?</label>
                <select name="activity_level" value={formData.activity_level} onChange={handleChange}>
                  <option>Bajo (Tranquila, paseos cortos)</option>
                  <option>Moderado (Paseos diarios, juego en casa)</option>
                  <option>Alto (Súper activa, salir a correr, excursiones)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>¿Tienes experiencia previa teniendo perros?</label>
                <select name="experience_level" value={formData.experience_level} onChange={handleChange}>
                  <option>Soy primerizo (No tengo experiencia)</option>
                  <option>Tengo experiencia previa</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.step}>
              <h2><Dog /> Preferencias del perrito</h2>
              <div className={styles.formGroup}>
                <label>¿Qué tamaño prefieres?</label>
                <select name="preferred_size" value={formData.preferred_size} onChange={handleChange}>
                  <option>Pequeño (&lt;10kg)</option>
                  <option>Mediano (10-25kg)</option>
                  <option>Grande (&gt;25kg)</option>
                  <option>Sin preferencia</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>¿Qué edad te gustaría que tuviera?</label>
                <select name="preferred_age_group" value={formData.preferred_age_group} onChange={handleChange}>
                  <option>Cachorro (0-12m)</option>
                  <option>Joven (1-3a)</option>
                  <option>Adulto (3-7a)</option>
                  <option>Senior (&gt;7a)</option>
                  <option>Cualquiera</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={styles.step}>
              <h2><CheckCircle color="var(--success-green)" /> Todo listo</h2>
              <p className={styles.finalText}>
                Nuestra Inteligencia Artificial usará tu perfil para buscar a los perritos con mayor porcentaje de compatibilidad. ¡Prepárate para conocer a tu nuevo mejor amigo!
              </p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 && (
            <button className={styles.btnSecondary} onClick={handlePrev}>Atrás</button>
          )}
          {step < 4 ? (
            <button className={styles.btnPrimary} onClick={handleNext}>Siguiente</button>
          ) : (
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Calculando...' : '¡Descubrir mi Match!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
