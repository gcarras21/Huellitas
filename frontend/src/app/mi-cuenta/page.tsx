'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { FileUp, Sparkles, Dog, CheckCircle2, Circle, Clock } from 'lucide-react';

export default function ClientDashboard() {
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

  return (
    <>
      <h1 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem'}}>¡Hola, {userName}! 👋</h1>
      <p style={{color: '#64748b', marginBottom: '2.5rem'}}>Este es el centro de control de tu proceso de adopción.</p>

      {/* --- AI MATCH BANNER --- */}
      <div style={{background: 'linear-gradient(135deg, #fff5f0 0%, #fff 100%)', border: '1px solid #ffedd5', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem'}}>
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
            <div style={{border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc'}}>
              <Dog size={32} color="#94a3b8" style={{margin: '0 auto', marginBottom: '1rem'}} />
              <p style={{color: '#64748b', marginBottom: '1rem'}}>Aún no tienes solicitudes de adopción activas.</p>
              <button style={{backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, color: '#475569', cursor: 'pointer'}}>Explorar Catálogo</button>
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
                      <div style={{display: 'flex', justifyContent: 'space-between', position: 'relative'}}>
                        {/* Línea de fondo */}
                        <div style={{position: 'absolute', top: '12px', left: '20px', right: '20px', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0}}></div>
                        {/* Línea activa */}
                        <div style={{position: 'absolute', top: '12px', left: '20px', width: `${((step - 1) / 3) * 100}%`, height: '2px', backgroundColor: '#10b981', zIndex: 0, transition: 'width 0.5s ease'}}></div>
                        
                        {/* Pasos */}
                        {[
                          { num: 1, label: 'Recibida' },
                          { num: 2, label: 'En Revisión' },
                          { num: 3, label: 'Entrevista' },
                          { num: 4, label: 'Aprobada' }
                        ].map((s) => (
                          <div key={s.num} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, width: '80px'}}>
                            <div style={{backgroundColor: step >= s.num ? '#10b981' : '#fff', color: step >= s.num ? '#fff' : '#cbd5e1', border: `2px solid ${step >= s.num ? '#10b981' : '#e2e8f0'}`, borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                              {step > s.num ? <CheckCircle2 size={16} /> : (step === s.num ? <Clock size={14}/> : <Circle size={10} fill="currentColor"/>)}
                            </div>
                            <span style={{fontSize: '0.7rem', fontWeight: step >= s.num ? 600 : 400, color: step >= s.num ? '#334155' : '#94a3b8'}}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {step === 1 && (
                      <div style={{marginTop: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '8px'}}>
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
              
              <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <div style={{fontSize: '0.9rem', fontWeight: 600}}>Identificación Oficial</div>
                  <div style={{fontSize: '0.75rem', color: '#ef4444'}}>Faltante</div>
                </div>
                <button style={{backgroundColor: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#475569', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600}}>
                  <FileUp size={14}/> Subir
                </button>
              </div>

              <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <div style={{fontSize: '0.9rem', fontWeight: 600}}>Comprobante de Domicilio</div>
                  <div style={{fontSize: '0.75rem', color: '#ef4444'}}>Faltante</div>
                </div>
                <button style={{backgroundColor: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#475569', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600}}>
                  <FileUp size={14}/> Subir
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </>
  );
}
