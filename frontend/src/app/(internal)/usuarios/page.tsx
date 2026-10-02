'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, Plus, UserCircle, Shield, Mail } from 'lucide-react';

export default function UsuariosPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) setProfiles(data);
      setLoading(false);
    }
    fetchProfiles();
  }, []);

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1 className="page-title">Gestión de Staff</h1>
          <p className="page-subtitle">Administra los accesos y roles del equipo de la fundación.</p>
        </div>
        <button style={{backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Plus size={20} /> Invitar Miembro
        </button>
      </div>

      <div style={{backgroundColor: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden'}}>
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '1rem 1.5rem', backgroundColor: '#f9f9f9', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)'}}>
          <div>USUARIO</div>
          <div>ROL</div>
          <div>ESTADO</div>
        </div>
        
        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Cargando usuarios...</div>
        ) : (
          profiles.map(profile => (
            <div key={profile.id} style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <UserCircle size={24} />
                </div>
                <div>
                  <div style={{fontWeight: 600, color: 'var(--text-dark)'}}>{profile.full_name || 'Usuario Nuevo'}</div>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px'}}><Mail size={12}/> ID: {profile.id.substring(0,8)}...</div>
                </div>
              </div>
              
              <div>
                <span style={{padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, 
                  backgroundColor: profile.role === 'admin' ? '#f3f0ff' : '#e6f7ff',
                  color: profile.role === 'admin' ? '#722ed1' : '#1890ff',
                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  {profile.role === 'admin' && <Shield size={12}/>}
                  {profile.role?.toUpperCase() || 'CLIENT'}
                </span>
              </div>

              <div>
                <span style={{color: 'var(--success-green)', fontWeight: 600, fontSize: '0.85rem'}}>● Activo</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
