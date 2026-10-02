'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FileUp, Sparkles, Dog, CheckCircle2, Circle, Clock, Home, ClipboardList, Settings, LogOut, ArrowLeftRight } from 'lucide-react';

export default function ClientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('Adoptante');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setUserName(profile.full_name?.split(' ')[0] || 'Adoptante');

        // Fetch their adoption requests
        const { data: reqs } = await supabase.from('adoption_requests')
          .select('*, dogs(name, photo_url)')
          .eq('user_id', session.user.id);
        
        if (reqs) setMyRequests(reqs);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Outfit', sans-serif"}}>
      {/* --- SIDEBAR DEL CLIENTE --- */}
      <aside style={{width: '260px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '1.5rem', flexShrink: 0}}>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '2.5rem'}}>
          <Dog size={24} color="var(--primary-orange)" />
          <div>
            <span>Huellitas</span>
            <div style={{fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#64748b', display: 'inline-block', marginLeft: '6px'}}>Adoptante</div>
          </div>
        </div>

        <nav style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1}}>
          <div style={{padding: '0.8rem 1rem', borderRadius: '8px', backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <Home size={18}/> Mi Inicio
          </div>
          <div style={{padding: '0.8rem 1rem', borderRadius: '8px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <ClipboardList size={18}/> Mis Solicitudes
          </div>
          <div style={{padding: '0.8rem 1rem', borderRadius: '8px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
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
      <main style={{flexGrow: 1, padding: '3rem 4rem', overflowY: 'auto'}}>
        
        <h1 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem'}}>¡Hola, {userName}! 👋</h1>
        <p style={{color: '#64748b', marginBottom: '2.5rem'}}>Este es el centro de control de tu proceso de adopción.</p>

        {/* --- AI MATCH BANNER --- */}
        <div style={{background: 'linear-gradient(135deg, #fff5f0 0%, #fff 100%)', border: '1px solid #ffedd5', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem'}}>
          <div>
            <h3 style={{fontSize: '1.25rem', color: '#ea580c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Sparkles size={20} /> Encuentra tu match perfecto
            </h3>
            <p style={{color: '#78716c', marginTop: '4px', maxWidth: '600px'}}>
              Nuestra Inteligencia Artificial está lista para analizar tu estilo de vida y recomendarte a los perritos que mejor se adapten a tu hogar y energía.
            </p>
          </div>
          <button style={{backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)'}}>
            Iniciar Cuestionario IA
          </button>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem'}}>
          
          {/* --- TRACKER DE ADOPCIÓN --- */}
          <div>
            <h2 style={{fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '1rem'}}>Tus Solicitudes</h2>
            
            {loading ? (
              <div style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>Cargando tu información...</div>
            ) : myRequests.length === 0 ? (
              <div style={{border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '3rem', textAlign: 'center', backgroundColor: '#fff'}}>
                <Dog size={32} color="#94a3b8" style={{margin: '0 auto', marginBottom: '1rem'}} />
                <p style={{color: '#64748b', marginBottom: '1rem'}}>Aún no tienes solicitudes de adopción activas.</p>
                <Link href="/#adoptar" style={{textDecoration: 'none'}}>
                  <button style={{backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'all 0.2s'}}>Explorar Catálogo</button>
                </Link>
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
      </main>
    </div>
  );
}
