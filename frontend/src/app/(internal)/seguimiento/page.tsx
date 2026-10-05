'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Calendar, Phone, Home, Plus, CheckCircle2, Clock } from 'lucide-react';

export default function SeguimientoPostAdopcion() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFollowups() {
      const { data } = await supabase
        .from('post_adoption_followups')
        .select(`
          *,
          adoption_requests (
            dogs (name, photo_url),
            profiles (full_name, id)
          )
        `)
        .order('scheduled_date', { ascending: true });
      if (data) setFollowups(data);
      setLoading(false);
    }
    loadFollowups();
  }, []);

  const markCompleted = async (id: string) => {
    await supabase.from('post_adoption_followups').update({ status: 'completed' }).eq('id', id);
    setFollowups(prev => prev.map(f => f.id === id ? { ...f, status: 'completed' } : f));
  };

  if (loading) return <div style={{padding: '2rem'}}>Cargando seguimientos...</div>;

  return (
    <div style={{padding: '2rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem'}}>Seguimiento Post-Adopción</h1>
          <p style={{color: '#64748b'}}>Bitácora de llamadas y visitas a los perritos en sus nuevos hogares.</p>
        </div>
        <button style={{backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
          <Plus size={18} /> Agendar Visita
        </button>
      </div>

      <div style={{display: 'grid', gap: '1.5rem'}}>
        {followups.map(f => (
          <div key={f.id} style={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'}}>
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
              <img src={f.adoption_requests?.dogs?.photo_url || "https://via.placeholder.com/60"} style={{width: 60, height: 60, borderRadius: '50%', objectFit: 'cover'}} />
              <div>
                <h3 style={{fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px'}}>{f.adoption_requests?.dogs?.name}</h3>
                <div style={{fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '12px'}}>
                  <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><User size={14}/> {f.adoption_requests?.profiles?.full_name}</span>
                  <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: f.status === 'completed' ? '#10b981' : '#f59e0b'}}><Calendar size={14}/> {f.scheduled_date}</span>
                </div>
                <p style={{fontSize: '0.9rem', color: '#475569', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                  {f.notes || 'Llamada de seguimiento rutinaria.'}
                </p>
              </div>
            </div>
            <div>
              {f.status === 'completed' ? (
                <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, padding: '8px 16px', backgroundColor: '#dcfce7', borderRadius: '30px', fontSize: '0.9rem'}}>
                  <CheckCircle2 size={18}/> Completado
                </div>
              ) : (
                <button onClick={() => markCompleted(f.id)} style={{backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '30px', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'}}>
                  <Clock size={16}/> Marcar Completado
                </button>
              )}
            </div>
          </div>
        ))}
        {followups.length === 0 && (
          <div style={{padding: '3rem', textAlign: 'center', color: '#64748b', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1'}}>
            No hay seguimientos agendados por el momento.
          </div>
        )}
      </div>
    </div>
  );
}
// Stub User component so lucide-react works cleanly
const User = ({size}: {size: number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
