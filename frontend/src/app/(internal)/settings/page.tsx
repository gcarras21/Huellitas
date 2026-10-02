'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Save, User, Lock, Mail } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
  });

  const [passwords, setPasswords] = useState({
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setProfile(prev => ({ ...prev, email: session.user.email || '' }));
        const { data: p } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
        if (p) setProfile(prev => ({ ...prev, full_name: p.full_name || '' }));
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    // 1. Update Name in profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name })
      .eq('id', session.user.id);

    if (profileError) {
      setMessage({ text: 'Error al actualizar nombre.', type: 'error' });
      setSaving(false);
      return;
    }

    // 2. Update Password if provided
    if (passwords.new_password) {
      if (passwords.new_password !== passwords.confirm_password) {
        setMessage({ text: 'Las contraseñas no coinciden.', type: 'error' });
        setSaving(false);
        return;
      }
      const { error: authError } = await supabase.auth.updateUser({
        password: passwords.new_password
      });
      if (authError) {
        setMessage({ text: 'Error al actualizar contraseña: ' + authError.message, type: 'error' });
        setSaving(false);
        return;
      }
    }

    setMessage({ text: 'Configuración guardada exitosamente.', type: 'success' });
    setPasswords({ new_password: '', confirm_password: '' });
    setSaving(false);
  };

  if (loading) return <div style={{padding: '2rem'}}>Cargando configuración...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 className="page-title">Configuración de Cuenta</h1>
      <p className="page-subtitle">Modifica tu perfil, correo electrónico y contraseña de acceso.</p>

      {message.text && (
        <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', fontWeight: 600 }}>
          {message.text}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--panel-bg)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}><User size={20} color="var(--primary-orange)"/> Perfil Público</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Nombre Completo</label>
            <input 
              type="text" 
              name="full_name"
              value={profile.full_name} 
              onChange={handleProfileChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem' }} 
            />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--panel-bg)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}><Lock size={20} color="var(--primary-orange)"/> Seguridad y Acceso</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Correo Electrónico <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400}}>(No editable por seguridad)</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc', color: 'var(--text-muted)' }}>
              <Mail size={16}/> {profile.email}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Nueva Contraseña</label>
              <input 
                type="password" 
                name="new_password"
                value={passwords.new_password}
                onChange={handlePasswordChange}
                placeholder="Deja en blanco para no cambiarla"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Confirmar Contraseña</label>
              <input 
                type="password" 
                name="confirm_password"
                value={passwords.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Repite tu nueva contraseña"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem' }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={saveProfile}
          disabled={saving}
          style={{ 
            backgroundColor: 'var(--primary-orange)', color: 'white', padding: '0.75rem 2rem', 
            borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1
          }}>
          <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
