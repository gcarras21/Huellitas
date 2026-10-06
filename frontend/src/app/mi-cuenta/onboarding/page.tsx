'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Dog, Home, User, CheckCircle } from 'lucide-react';
import styles from './onboarding.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    housing_type: 'Departamento / Espacio chico',
    has_kids: false,
    has_dogs: false,
    has_cats: false,
    activity_level: 'Moderado',
    preferred_size: 'Mediano (10-25kg)',
    preferred_age_group: 'Cualquiera',
    experience_level: 'Soy primerizo (No tengo experiencia)',
  });

  // Verify if already has preferences
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('edit') !== 'true') {
          supabase.from('user_preferences').select('user_id').eq('user_id', session.user.id).single().then(({ data }) => {
            if (data) router.push('/mi-cuenta'); // Already completed
          });
        }
      }
    });
  }, [router]);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('user_preferences').upsert({
      user_id: session.user.id,
      ...formData
    });

    setLoading(false);
    if (!error) {
      router.push('/mi-cuenta');
    } else {
      alert('Error guardando preferencias: ' + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        <div className={styles.header}>
          <Dog size={32} color="var(--primary-orange)" />
          <h1>Huellita Match AI</h1>
          <p>Ayúdanos a encontrar tu compañero ideal respondiendo unas breves preguntas.</p>
        </div>

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
