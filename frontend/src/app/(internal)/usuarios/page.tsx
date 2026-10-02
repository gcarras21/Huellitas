'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, Plus, UserCircle, Shield, Mail, Edit2, X, Info } from 'lucide-react';
import styles from './usuarios.module.css';

export default function UsuariosPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('client');

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role || 'client');
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    await supabase.from('profiles').update({ role: newRole }).eq('id', selectedUser.id);
    setIsEditModalOpen(false);
    fetchProfiles();
  };

  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase() || 'client';
    if (r === 'admin') return { bg: '#f3f0ff', color: '#722ed1', text: 'ADMINISTRADOR', icon: <Shield size={12}/> };
    if (r === 'staff') return { bg: '#e6f7ff', color: '#1890ff', text: 'STAFF', icon: <Users size={12}/> };
    if (r === 'vet') return { bg: '#f6ffed', color: '#52c41a', text: 'VETERINARIO', icon: <Plus size={12}/> };
    return { bg: '#f1f5f9', color: '#64748b', text: 'CLIENTE', icon: null };
  };

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1 className="page-title">Gestión de Equipo y Usuarios</h1>
          <p className="page-subtitle">Administra los accesos y roles del equipo de la fundación y clientes.</p>
        </div>
        <button className={styles.btnPrimary} style={{width:'auto'}} onClick={() => setIsInviteModalOpen(true)}>
          <Plus size={20} /> Nuevo Miembro
        </button>
      </div>

      <div style={{backgroundColor: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden'}}>
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '1rem 1.5rem', backgroundColor: '#f9f9f9', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)'}}>
          <div>USUARIO</div>
          <div>ROL</div>
          <div>ESTADO</div>
          <div style={{textAlign:'right'}}>ACCIÓN</div>
        </div>
        
        {loading ? (
          <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>Cargando directorio...</div>
        ) : (
          profiles.map(profile => {
            const badge = getRoleBadge(profile.role);
            return (
              <div key={profile.id} style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <div style={{fontWeight: 700, color: 'var(--text-dark)'}}>{profile.full_name || 'Usuario sin nombre'}</div>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <Mail size={12}/> ID: {profile.id.substring(0,8)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <span style={{padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, 
                    backgroundColor: badge.bg, color: badge.color, display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    {badge.icon} {badge.text}
                  </span>
                </div>

                <div>
                  <span style={{color: 'var(--success-green)', fontWeight: 600, fontSize: '0.85rem', display:'flex', alignItems:'center', gap:'4px'}}>
                    <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'var(--success-green)', display:'inline-block'}}></span> Activo
                  </span>
                </div>

                <div style={{textAlign:'right'}}>
                  <button className={styles.btnSecondary} onClick={() => openEditModal(profile)} title="Cambiar Rol">
                    <Edit2 size={16}/>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para Editar Rol */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <h2 style={{fontWeight: 700}}>Editar Rol de Usuario</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}><X/></button>
            </div>
            
            <div style={{marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px'}}>
              <div style={{fontWeight: 600}}>{selectedUser?.full_name || 'Usuario'}</div>
              <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>ID: {selectedUser?.id}</div>
            </div>

            <form onSubmit={handleUpdateRole} style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
              <div>
                <label style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'block', marginBottom:'8px', fontWeight: 600}}>Asignar Nuevo Rol</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', fontFamily:'inherit', fontWeight: 600}}>
                  <option value="client">Cliente / Adoptante</option>
                  <option value="staff">Staff (Voluntario)</option>
                  <option value="vet">Veterinario</option>
                  <option value="admin">Administrador Total</option>
                </select>
              </div>
              <button type="submit" className={styles.btnPrimary}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Invitación (Explicativo) */}
      {isInviteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <h2 style={{fontWeight: 700}}>Invitar al Equipo</h2>
              <button onClick={() => setIsInviteModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}><X/></button>
            </div>
            
            <div style={{background: '#fff7ed', border: '1px solid #fdba74', padding: '1rem', borderRadius: '8px', color: '#c2410c', display: 'flex', gap: '12px', marginBottom: '1.5rem'}}>
              <Info size={24} style={{flexShrink: 0, marginTop: '2px'}}/>
              <div style={{fontSize: '0.9rem', lineHeight: '1.5'}}>
                Para proteger la seguridad de la plataforma, el sistema no permite crear contraseñas para otras personas.
              </div>
            </div>

            <p style={{fontSize: '0.95rem', color: 'var(--text-dark)', marginBottom: '1.5rem', lineHeight: '1.6'}}>
              <strong>Instrucciones:</strong><br/>
              1. Pide a tu colega que entre al <b>Portal Público</b> y se registre usando el botón de Iniciar Sesión.<br/>
              2. Una vez que cree su cuenta, aparecerá aquí en este directorio.<br/>
              3. Dale clic al botón de <b>Editar</b> junto a su nombre y cámbiale el rol a <b>Staff</b>, <b>Veterinario</b> o <b>Admin</b>.
            </p>

            <button onClick={() => setIsInviteModalOpen(false)} className={styles.btnPrimary}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
