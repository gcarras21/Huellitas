'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, Plus, UserCircle, Shield, Mail, Edit2, X, Info, Search, Filter, Key } from 'lucide-react';
import styles from './usuarios.module.css';

export default function UsuariosPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [currentUserRole, setCurrentUserRole] = useState<string>('client');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('client');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');

  // Codes
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeRole, setCodeRole] = useState('staff');

  const fetchProfiles = async () => {
    setLoading(true);
    
    // Get current user role
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (prof) setCurrentUserRole(prof.role || 'client');
    }

    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm);
    const role = p.role || 'client';
    const matchesRole = roleFilter === 'todos' || role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openEditModal = (user: any) => {
    if (currentUserRole !== 'admin' && user.role === 'admin') {
      alert("No tienes permisos para editar a un Administrador.");
      return;
    }
    setSelectedUser(user);
    setNewRole(user.role || 'client');
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (currentUserRole !== 'admin' && newRole === 'admin') {
      alert("Solo un Administrador puede crear otro Administrador.");
      return;
    }
    
    await supabase.from('profiles').update({ role: newRole }).eq('id', selectedUser.id);
    setIsEditModalOpen(false);
    fetchProfiles();
  };

  const handleGenerateCode = async () => {
    if (currentUserRole !== 'admin' && codeRole === 'admin') {
      alert("No puedes generar códigos de Administrador.");
      return;
    }
    const code = `HUELLITAS-${codeRole.toUpperCase()}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
    await supabase.from('invitation_codes').insert([{ code, role: codeRole }]);
    setGeneratedCode(code);
  };

  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase() || 'client';
    if (r === 'admin') return { bg: '#f3f0ff', color: '#722ed1', text: 'ADMINISTRADOR', icon: <Shield size={12}/> };
    if (r === 'supervisor') return { bg: '#f6ffed', color: '#52c41a', text: 'SUPERVISOR', icon: <Shield size={12}/> };
    if (r === 'staff') return { bg: '#e6f7ff', color: '#1890ff', text: 'STAFF', icon: <Users size={12}/> };
    return { bg: '#f1f5f9', color: '#64748b', text: 'CLIENTE', icon: null };
  };

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1 className="page-title">Gestión de Equipo y Usuarios</h1>
          <p className="page-subtitle">Administra los accesos y roles del equipo de la fundación y clientes.</p>
        </div>
        <button className={styles.btnPrimary} style={{width:'auto'}} onClick={() => { setIsInviteModalOpen(true); setGeneratedCode(''); }}>
          <Key size={20} /> Generar Código
        </button>
      </div>

      <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 1rem', flex: 1, maxWidth: '400px'}}>
          <Search size={18} color="var(--text-muted)" style={{marginRight: '8px'}} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o ID..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem'}}
          />
        </div>
        
        <div style={{display: 'flex', gap: '8px'}}>
          {['todos', 'admin', 'supervisor', 'staff', 'client'].map(tab => (
            <button 
              key={tab}
              onClick={() => setRoleFilter(tab)}
              style={{
                padding: '0.5rem 1rem', 
                borderRadius: '20px', 
                border: '1px solid',
                borderColor: roleFilter === tab ? 'var(--primary-orange)' : 'var(--border-color)',
                backgroundColor: roleFilter === tab ? 'var(--primary-orange-light)' : 'white',
                color: roleFilter === tab ? 'var(--primary-orange)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'client' ? 'Clientes' : tab}
            </button>
          ))}
        </div>
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
        ) : filteredProfiles.length === 0 ? (
           <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No se encontraron usuarios con esos filtros.</div>
        ) : (
          filteredProfiles.map(profile => {
            const badge = getRoleBadge(profile.role);
            const isMe = profile.id === currentUserId;
            return (
              <div key={profile.id} style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center', backgroundColor: isMe ? '#fffaf5' : 'transparent'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <div style={{fontWeight: 700, color: 'var(--text-dark)'}}>
                      {profile.full_name || 'Usuario sin nombre'} {isMe && <span style={{fontSize:'0.75rem', color:'var(--primary-orange)', fontWeight:600}}>(Tú)</span>}
                    </div>
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
                  <option value="staff">Staff (Operativo)</option>
                  <option value="supervisor">Supervisor</option>
                  {currentUserRole === 'admin' && <option value="admin">Administrador Total</option>}
                </select>
              </div>
              <button type="submit" className={styles.btnPrimary}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Invitación */}
      {isInviteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <h2 style={{fontWeight: 700}}>Generar Código de Invitación</h2>
              <button onClick={() => setIsInviteModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}><X/></button>
            </div>
            
            <p style={{fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '1.5rem', lineHeight: '1.5'}}>
              Genera un código secreto para pasárselo a tu nuevo colega. Cuando se registren en la plataforma y pongan este código, el sistema les dará el rol automáticamente.
            </p>

            <div style={{display:'flex', flexDirection:'column', gap:'1rem', marginBottom:'1.5rem'}}>
              <div>
                <label style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'block', marginBottom:'4px'}}>Rol a otorgar:</label>
                <select value={codeRole} onChange={e => setCodeRole(e.target.value)} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', fontFamily:'inherit'}}>
                  <option value="staff">Staff (Operativo)</option>
                  <option value="supervisor">Supervisor</option>
                  {currentUserRole === 'admin' && <option value="admin">Administrador Total</option>}
                </select>
              </div>
              
              <button onClick={handleGenerateCode} className={styles.btnSecondary} style={{width:'100%', padding:'0.75rem', border:'1px solid var(--border-color)'}}>
                Generar Código
              </button>
            </div>

            {generatedCode && (
              <div style={{background: '#f6ffed', border: '1px solid #b7eb8f', padding: '1rem', borderRadius: '8px', textAlign: 'center'}}>
                <div style={{fontSize: '0.8rem', color: '#52c41a', fontWeight: 600, marginBottom: '4px'}}>CÓDIGO GENERADO ÉXITOSAMENTE</div>
                <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#389e0d', letterSpacing: '2px'}}>{generatedCode}</div>
                <div style={{fontSize: '0.75rem', color: '#52c41a', marginTop: '8px'}}>Cópialo y envíaselo por WhatsApp.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
