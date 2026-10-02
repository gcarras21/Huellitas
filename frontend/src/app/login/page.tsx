'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Dog } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      // Login Flow
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } else {
      // Client/Adopter Registration Flow
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Create profile as 'client'
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: formData.fullName,
          role: 'client'
        });
        alert('Cuenta creada exitosamente. Por favor inicia sesión.');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      
      {/* Left Form Side */}
      <div className={styles.leftSide}>
        <div className={styles.loginBox}>
          
          <div className={styles.brand}>
            <Dog size={36} color="var(--primary-orange)" />
            <div><span>Huellitas</span> AI</div>
          </div>

          <h1 className={styles.title}>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
          <p className={styles.subtitle}>
            {isLogin 
              ? 'Ingresa tus credenciales para acceder al sistema de gestión y adopciones.' 
              : 'Regístrate como adoptante para encontrar a tu mejor amigo.'}
          </p>

          {error && <div style={{ color: 'var(--urgent-red)', backgroundColor: 'var(--urgent-red-light)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} placeholder="Ej. Juan Pérez" />
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label>Correo Electrónico</label>
              <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="correo@ejemplo.com" />
            </div>

            <div className={styles.formGroup}>
              <label>Contraseña</label>
              <input type="password" name="password" required value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarme')}
            </button>
          </form>

          <div className={styles.switchText}>
            {isLogin ? (
              <>¿Eres un futuro adoptante y no tienes cuenta? <a onClick={() => setIsLogin(false)}>Regístrate aquí</a></>
            ) : (
              <>¿Ya tienes una cuenta? <a onClick={() => setIsLogin(true)}>Inicia Sesión</a></>
            )}
          </div>
        </div>
      </div>

      {/* Right Image Side */}
      <div className={styles.rightSide}>
        <img src="https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800&auto=format&fit=crop" alt="Perro feliz" className={styles.heroImage} />
        <h2 className={styles.rightTitle}>Dale un hogar, recibe amor incondicional</h2>
        <p className={styles.rightSubtitle}>Nuestra plataforma potenciada por IA te ayuda a encontrar al perrito que mejor se adapte a tu estilo de vida y familia.</p>
      </div>

    </div>
  );
}
