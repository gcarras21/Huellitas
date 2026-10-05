'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FileUp, Sparkles, Dog, CheckCircle2, Circle, Clock, Home, ClipboardList, Settings, LogOut, ArrowLeftRight, Bot, Send, User, Menu, X } from 'lucide-react';
import styles from './mi-cuenta.module.css';

export default function ClientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('Adoptante');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [allDogs, setAllDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View State
  const [chatOpen, setChatOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    {role: 'ai', content: '¡Hola! Soy Huellitas AI, tu asistente experto en adopciones. Cuéntame, ¿qué tipo de perrito estás buscando o cómo es tu estilo de vida?'}
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if(!inputMessage.trim()) return;
    const userMsg = inputMessage.trim();
    setMessages(prev => [...prev, {role: 'user', content: userMsg}]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      setMessages(prev => [...prev, {role: 'ai', content: data.reply}]);
    } catch (err) {
      setMessages(prev => [...prev, {role: 'ai', content: 'Ups, tuve un problema conectándome con mi cerebro (Backend). Asegúrate de que el servidor esté corriendo.'}]);
    }
    setIsTyping(false);
  };
  useEffect(() => {
    async function loadClientData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUserName(profile.full_name?.split(' ')[0] || 'Adoptante');
          setFullNameInput(profile.full_name || '');
        }
        setUserEmail(session.user.email || '');

        // Fetch their adoption requests
        const { data: reqs } = await supabase.from('adoption_requests')
          .select('*, dogs(name, photo_url)')
          .eq('client_id', session.user.id);
        
        if (reqs) setMyRequests(reqs);

        // Fetch all dogs for AI visual matching
        const { data: dogs } = await supabase.from('dogs').select('*');
        if (dogs) setAllDogs(dogs);
      }
      setLoading(false);
    }
    loadClientData();
  }, []);

  const getStepProgress = (status: string) => {
    if (status === 'pending') return 1;
    if (status === 'interview') return 2;
    if (status === 'approved') return 4;
    if (status === 'rejected') return -1;
    return 1;
  };

  const updateProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    await supabase.from('profiles').update({ full_name: fullNameInput }).eq('id', session.user.id);
    setUserName(fullNameInput.split(' ')[0]);
    
    if (newPassword.trim().length > 0) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        alert('Error al actualizar contraseña: ' + error.message);
        return;
      }
      setNewPassword('');
    }
    
    alert('Perfil actualizado con éxito');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      {/* --- SIDEBAR DEL CLIENTE --- */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        
        <button className={styles.closeSidebarBtn} onClick={() => setIsMobileMenuOpen(false)}>
          <X size={24} />
        </button>

        <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '2.5rem'}}>
          <Dog size={24} color="var(--primary-orange)" />
          <div>
            <span>Huellitas</span>
            <div style={{fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#64748b', display: 'inline-block', marginLeft: '6px'}}>Adoptante</div>
          </div>
        </div>

        <nav style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1}}>
          <div onClick={() => {setChatOpen(false); setCatalogOpen(false); setProfileOpen(false); setIsMobileMenuOpen(false);}} style={{padding: '0.8rem 1rem', borderRadius: '8px', backgroundColor: (!chatOpen && !catalogOpen && !profileOpen) ? 'var(--primary-orange-light)' : 'transparent', color: (!chatOpen && !catalogOpen && !profileOpen) ? 'var(--primary-orange)' : '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <Home size={18}/> Mi Inicio
          </div>
          <div onClick={() => {setChatOpen(true); setCatalogOpen(false); setProfileOpen(false); setIsMobileMenuOpen(false);}} style={{padding: '0.8rem 1rem', borderRadius: '8px', backgroundColor: chatOpen ? 'var(--primary-orange-light)' : 'transparent', color: chatOpen ? 'var(--primary-orange)' : '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <Bot size={18}/> Huellitas AI
          </div>
          <div onClick={() => {setChatOpen(false); setCatalogOpen(true); setProfileOpen(false); setIsMobileMenuOpen(false);}} style={{padding: '0.8rem 1rem', borderRadius: '8px', backgroundColor: catalogOpen ? 'var(--primary-orange-light)' : 'transparent', color: catalogOpen ? 'var(--primary-orange)' : '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <Dog size={18}/> Catálogo de Perros
          </div>
          <div onClick={() => {setChatOpen(false); setCatalogOpen(false); setProfileOpen(true); setIsMobileMenuOpen(false);}} style={{padding: '0.8rem 1rem', borderRadius: '8px', backgroundColor: profileOpen ? 'var(--primary-orange-light)' : 'transparent', color: profileOpen ? 'var(--primary-orange)' : '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <Settings size={18}/> Mi Perfil
          </div>
        </nav>

        {/* Switcher para Admin */}
        <div style={{marginTop: 'auto', marginBottom: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem'}}>
          <div style={{fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem'}}>Modo Administrador</div>
          <Link href="/dashboard" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', backgroundColor: '#eff6ff', borderRadius: '6px', marginBottom: '8px'}}>
            <ArrowLeftRight size={14}/> Ir al Portal Interno
          </Link>
          <Link href="/" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', backgroundColor: '#ecfdf5', borderRadius: '6px'}}>
            <ArrowLeftRight size={14}/> Ir al Portal Público
          </Link>
        </div>

        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700}}>
              {userName.charAt(0)}
            </div>
            <div style={{fontSize: '0.9rem', fontWeight: 600, color: '#334155'}}>{userName}</div>
          </div>
          <button onClick={handleLogout} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}} title="Cerrar Sesión"><LogOut size={18}/></button>
        </div>

      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={styles.main}>
        <button className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} /> Menú
        </button>
        
        <h1 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem'}}>¡Hola, {userName}! 👋</h1>
        <p style={{color: '#64748b', marginBottom: '2.5rem'}}>Este es el centro de control de tu proceso de adopción.</p>

        {/* --- AI MATCH BANNER --- */}
        {!chatOpen && !catalogOpen && !profileOpen && (
          <div style={{background: 'linear-gradient(135deg, #fff5f0 0%, #fff 100%)', border: '1px solid #ffedd5', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem'}}>
            <div>
              <h3 style={{fontSize: '1.25rem', color: '#ea580c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Sparkles size={20} /> Encuentra tu match perfecto
              </h3>
              <p style={{color: '#78716c', marginTop: '4px', maxWidth: '600px'}}>
                Nuestra Inteligencia Artificial está lista para analizar tu estilo de vida y recomendarte a los perritos que mejor se adapten a tu hogar y energía.
              </p>
            </div>
            <button onClick={() => {setChatOpen(true); setCatalogOpen(false);}} style={{backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)'}}>
              Hablar con Huellitas AI
            </button>
          </div>
        )}
        
        {/* --- CHAT VIEW --- */}
        {chatOpen && (
          <div style={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', marginBottom: '2.5rem', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
            <div style={{backgroundColor: 'var(--primary-orange)', padding: '1rem', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Bot size={20}/> Huellitas AI</div>
              <button onClick={() => setChatOpen(false)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700}}>X Cerrar</button>
            </div>
            <div style={{flexGrow: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {messages.map((msg, i) => {
                const mentionedDogs = msg.role === 'ai' ? allDogs.filter(d => msg.content.toLowerCase().includes(d.name.toLowerCase())) : [];
                return (
                <div key={i} style={{alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', display: 'flex', gap: '12px'}}>
                  {msg.role === 'ai' && <div style={{width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}><Bot size={18}/></div>}
                  <div style={{backgroundColor: msg.role === 'user' ? 'var(--primary-orange)' : '#f1f5f9', color: msg.role === 'user' ? 'white' : '#334155', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.95rem', borderTopLeftRadius: msg.role === 'ai' ? 0 : 12, borderTopRightRadius: msg.role === 'user' ? 0 : 12, lineHeight: 1.5, whiteSpace: 'pre-wrap'}}>
                    {msg.content}
                    
                    {mentionedDogs.length > 0 && (
                      <div style={{display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px'}}>
                        {mentionedDogs.map(dog => (
                          <div key={dog.id} style={{minWidth: '120px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px', backgroundColor: '#fff', color: '#334155'}}>
                            {dog.photo_url ? (
                              <img src={dog.photo_url} style={{width: '100%', height: '70px', objectFit: 'contain', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '8px'}} alt={dog.name} />
                            ) : (
                              <div style={{width: '100%', height: '70px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Dog color="#94a3b8"/></div>
                            )}
                            <div style={{fontSize: '0.85rem', fontWeight: 700}}>{dog.name}</div>
                            <div style={{fontSize: '0.7rem', color: '#64748b'}}>{dog.breed}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )})}
              {isTyping && <div style={{fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginLeft: '44px'}}>Huellitas AI está escribiendo...</div>}
            </div>
            <div style={{padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', backgroundColor: '#f8fafc'}}>
              <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Escribe tu mensaje aquí..." style={{flexGrow: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem'}} />
              <button onClick={sendMessage} disabled={isTyping} style={{backgroundColor: 'var(--primary-orange)', border: 'none', color: 'white', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isTyping ? 0.7 : 1}}><Send size={18}/></button>
            </div>
          </div>
        )}

        {/* --- CATALOG VIEW --- */}
        {catalogOpen && (
          <div style={{marginBottom: '2.5rem'}}>
             <h2 style={{fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem'}}>Catálogo de Perros en Adopción</h2>
             <div className={styles.catalogGrid}>
               {allDogs.map(dog => (
                 <div key={dog.id} style={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'}}>
                   <img src={dog.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop"} alt={dog.name} style={{width: '100%', height: '180px', objectFit: 'contain', backgroundColor: '#f1f5f9'}} />
                   <div style={{padding: '1rem'}}>
                     <h3 style={{fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#1e293b'}}>{dog.name}</h3>
                     <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.75rem'}}>
                       {dog.size && <span style={{fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#475569'}}>{dog.size}</span>}
                       {dog.age_months !== null && <span style={{fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#475569'}}>{dog.age_months} meses</span>}
                     </div>
                     <p style={{fontSize: '0.8rem', color: '#64748b', margin: 0}}><strong>Raza:</strong> {dog.breed || 'Mestizo'}</p>
                     <p style={{fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0'}}><strong>Energía:</strong> {dog.energy_level || 'Normal'}</p>
                     <p style={{fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0'}}><strong>Salud:</strong> {dog.health_status || 'Sano'}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* --- PROFILE VIEW --- */}
        {profileOpen && (
          <div style={{marginBottom: '2.5rem', maxWidth: '600px'}}>
             <h2 style={{fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem'}}>Configuración de Perfil</h2>
             <div style={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'}}>
               <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                 <div>
                   <label style={{display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem'}}>Nombre Completo</label>
                   <input type="text" value={fullNameInput} onChange={e => setFullNameInput(e.target.value)} style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '1rem', outline: 'none'}} />
                 </div>
                 <div>
                   <label style={{display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem'}}>Correo Electrónico (No modificable)</label>
                   <input type="email" value={userEmail} readOnly style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8', fontFamily: 'inherit', fontSize: '1rem', cursor: 'not-allowed', outline: 'none'}} />
                 </div>

                 <div style={{borderTop: '1px solid #e2e8f0', margin: '0.5rem 0'}}></div>
                 
                 <div>
                   <label style={{display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem'}}>Cambiar Contraseña</label>
                   <input type="password" placeholder="Escribe tu nueva contraseña..." value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '1rem', outline: 'none'}} />
                   <div style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px'}}>Déjalo en blanco si no deseas cambiarla.</div>
                 </div>

                 <button onClick={updateProfile} style={{backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem'}}>
                   Guardar Cambios
                 </button>
               </div>
             </div>
          </div>
        )}

        {!chatOpen && !catalogOpen && !profileOpen && (
          <div className={styles.grid}>
          
          {/* --- TRACKER DE ADOPCIÓN --- */}
          <div>
            <h2 style={{fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '1rem'}}>Tus Solicitudes</h2>
            
            {loading ? (
              <div style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>Cargando tu información...</div>
            ) : myRequests.length === 0 ? (
              <div style={{border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '3rem', textAlign: 'center', backgroundColor: '#fff'}}>
                <Dog size={32} color="#94a3b8" style={{margin: '0 auto', marginBottom: '1rem'}} />
                <p style={{color: '#64748b', marginBottom: '1rem'}}>Aún no tienes solicitudes de adopción activas.</p>
                <button onClick={() => {setChatOpen(false); setCatalogOpen(true); setProfileOpen(false);}} style={{backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'all 0.2s'}}>Explorar Catálogo</button>
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {myRequests.map(req => {
                  const step = getStepProgress(req.status);
                  return (
                    <div key={req.id} style={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.5rem'}}>
                        {req.dogs?.photo_url ? (
                          <img src={req.dogs.photo_url} alt={req.dogs.name} style={{width: 60, height: 60, borderRadius: '50%', objectFit: 'cover'}} />
                        ) : (
                          <div style={{width: 60, height: 60, borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Dog color="#94a3b8"/></div>
                        )}
                        <div>
                          <h4 style={{fontSize: '1.1rem', fontWeight: 700}}>{req.dogs?.name || 'Perrito'}</h4>
                          <p style={{fontSize: '0.85rem', color: '#64748b'}}>Solicitud enviada el {new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        {step === -1 && <span style={{marginLeft: 'auto', backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700}}>RECHAZADA</span>}
                        {step === 4 && <span style={{marginLeft: 'auto', backgroundColor: '#dcfce7', color: '#22c55e', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700}}>¡APROBADA!</span>}
                      </div>

                      {step !== -1 && (
                        <div style={{display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '1rem', padding: '0 10px'}}>
                          {/* Línea de fondo */}
                          <div style={{position: 'absolute', top: '12px', left: '30px', right: '30px', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0}}></div>
                          {/* Línea activa */}
                          <div style={{position: 'absolute', top: '12px', left: '30px', width: `calc(${((step - 1) / 3) * 100}% - 40px)`, height: '2px', backgroundColor: '#10b981', zIndex: 0, transition: 'width 0.5s ease'}}></div>
                          
                          {/* Pasos */}
                          {[
                            { num: 1, label: 'Recibida' },
                            { num: 2, label: 'En Revisión' },
                            { num: 3, label: 'Entrevista' },
                            { num: 4, label: 'Aprobada' }
                          ].map((s) => (
                            <div key={s.num} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1}}>
                              <div style={{backgroundColor: step >= s.num ? '#10b981' : '#fff', color: step >= s.num ? '#fff' : '#cbd5e1', border: `2px solid ${step >= s.num ? '#10b981' : '#e2e8f0'}`, borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                {step > s.num ? <CheckCircle2 size={16} /> : (step === s.num ? <Clock size={14}/> : <Circle size={10} fill="currentColor"/>)}
                              </div>
                              <span style={{fontSize: '0.75rem', fontWeight: step >= s.num ? 600 : 500, color: step >= s.num ? '#334155' : '#94a3b8'}}>{s.label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {step === 1 && (
                        <div style={{marginTop: '2rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px'}}>
                          <Clock size={16} color="#3b82f6"/> 
                          Estamos revisando tu perfil. El equipo te contactará pronto para el siguiente paso.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- BÓVEDA DE DOCUMENTOS --- */}
          <div>
            <h2 style={{fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '1rem'}}>Mis Documentos</h2>
            <div style={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'}}>
              <p style={{fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem'}}>Sube los documentos necesarios para agilizar tu proceso de adopción.</p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                
                <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc'}}>
                  <div>
                    <div style={{fontSize: '0.9rem', fontWeight: 600, color: '#334155'}}>Identificación Oficial</div>
                    <div style={{fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: '2px'}}>Faltante</div>
                  </div>
                  <button style={{backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', color: '#475569', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600}}>
                    <FileUp size={14}/> Subir
                  </button>
                </div>

                <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc'}}>
                  <div>
                    <div style={{fontSize: '0.9rem', fontWeight: 600, color: '#334155'}}>Comprobante Domicilio</div>
                    <div style={{fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: '2px'}}>Faltante</div>
                  </div>
                  <button style={{backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', color: '#475569', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600}}>
                    <FileUp size={14}/> Subir
                  </button>
                </div>

              </div>
            </div>
          </div>

          </div>
        )}
      </main>
    </div>
  );
}
