'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Dog, CheckCircle2, Mail, X, Info } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    invitationCode: ''
  });
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // In-page success modal state (replaces browser alert)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    // Check if the URL has a hash or query with auth callback info or messages
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      
      if (hash.includes('error_description') || search.includes('error_description')) {
        const params = new URLSearchParams(hash.replace('#', '?') || search);
        const errorDesc = params.get('error_description');
        if (errorDesc) {
          setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        }
      } else if (hash.includes('access_token')) {
        setInfoMessage('¡Tu correo ha sido verificado con éxito! Ya puedes iniciar sesión.');
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    if (isLogin) {
      // Login Flow
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos, o la cuenta no existe. Si no tienes cuenta, puedes registrarte abajo.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada o spam.');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // Verify or create profile in public.profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', authData.user.id)
          .single();

        let currentRole = profile?.role;

        if (!profile) {
          // If profile was missing (e.g. from signup without trigger), create it now with authenticated session
          const roleToAssign = (authData.user.user_metadata?.role as any) || 'client';
          const nameToAssign = authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Adoptante';
          
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            full_name: nameToAssign,
            role: roleToAssign
          });
          currentRole = roleToAssign;
        }

        // Redirect based on role
        const staffRoles = ['admin', 'supervisor', 'staff', 'employee'];
        if (staffRoles.includes(currentRole)) {
          router.push('/dashboard');
        } else {
          router.push('/mi-cuenta');
        }
      }
    } else {
      // Client/Adopter Registration Flow
      let assignedRole = 'client';
      
      if (formData.invitationCode && formData.invitationCode.trim()) {
        const { data: codeData } = await supabase
          .from('invitation_codes')
          .select('role')
          .eq('code', formData.invitationCode.trim())
          .single();
          
        if (codeData?.role) {
          assignedRole = codeData.role;
        } else {
          console.warn("Código de invitación inválido, registrando con rol de adoptante (client)");
        }
      }

      // Origin-based redirect so Supabase never redirects to localhost in production
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: assignedRole
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('Este correo electrónico ya está registrado. Por favor inicia sesión.');
        } else if (signUpError.message.includes('Password should be at least')) {
          setError('La contraseña debe tener al menos 6 caracteres.');
        } else if (signUpError.message.toLowerCase().includes('rate limit')) {
          setError('Límite de correos por hora alcanzado en Supabase (máx. 3-4/hora). Desactiva "Confirm email" en el panel de Supabase para registro instantáneo.');
        } else {
          setError(signUpError.message);
        }
      } else if (data.user) {
        // If session is active immediately (email confirmation disabled in Supabase)
        if (data.session) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: formData.fullName,
            role: assignedRole
          });
        }

        // Trigger in-page modern modal popup (NO native browser alert)
        setRegisteredEmail(formData.email);
        setNeedsConfirmation(!data.session && !data.user.confirmed_at);
        setShowSuccessModal(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      
      {/* --- IN-PAGE SUCCESS POPUP MODAL (NO NATIVE ALERT) --- */}
      {showSuccessModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalCloseBtn} 
              onClick={() => {
                setShowSuccessModal(false);
                setIsLogin(true);
              }}
              title="Cerrar"
            >
              <X size={20} />
            </button>

            <div className={styles.modalIconWrapper}>
              <CheckCircle2 size={44} color="#10b981" />
            </div>

            <h2 className={styles.modalTitle}>¡Cuenta creada exitosamente!</h2>
            
            <p className={styles.modalMessage}>
              Te has registrado con el correo <strong>{registeredEmail}</strong>. Tu perfil de adoptante está listo.
            </p>

            {needsConfirmation && (
              <div className={styles.modalNotice}>
                <Mail size={20} color="var(--primary-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Supabase requiere confirmación de email. Si recibes un correo con enlace, haz clic en él para verificar tu cuenta y luego inicia sesión aquí.
                </span>
              </div>
            )}

            <button
              type="button"
              className={styles.modalBtn}
              onClick={() => {
                setShowSuccessModal(false);
                setIsLogin(true);
              }}
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        </div>
      )}

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

          {infoMessage && (
            <div style={{ color: '#047857', backgroundColor: '#d1fae5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} />
              <span>{infoMessage}</span>
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--urgent-red)', backgroundColor: 'var(--urgent-red-light)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className={styles.formGroup}>
                  <label>Nombre Completo</label>
                  <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} placeholder="Ej. Juan Pérez" />
                </div>
                <div className={styles.formGroup}>
                  <label>Código de Invitación (Opcional - Solo Staff)</label>
                  <input type="text" name="invitationCode" value={formData.invitationCode} onChange={handleInputChange} placeholder="Ej. HUELLITAS-2026" />
                </div>
              </>
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
              <>¿Eres un futuro adoptante y no tienes cuenta? <a onClick={() => { setIsLogin(false); setError(''); setInfoMessage(''); }}>Regístrate aquí</a></>
            ) : (
              <>¿Ya tienes una cuenta? <a onClick={() => { setIsLogin(true); setError(''); setInfoMessage(''); }}>Inicia Sesión</a></>
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
