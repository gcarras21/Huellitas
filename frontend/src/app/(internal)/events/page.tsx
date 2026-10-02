'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Calendar as CalendarIcon, MapPin, Plus, X, Dog, Info } from 'lucide-react';
import styles from './events.module.css';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '', event_date: '', location: '' });
  
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [availableDogs, setAvailableDogs] = useState<any[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>('');

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_dogs (
          dog_id,
          dogs ( id, name )
        )
      `)
      .order('event_date', { ascending: true });
      
    if (data) setEvents(data);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('events').insert([formData]);
    setIsModalOpen(false);
    setFormData({ title: '', description: '', event_date: '', location: '' });
    fetchEvents();
  };

  const openAssignModal = async (eventId: string) => {
    setSelectedEventId(eventId);
    const { data } = await supabase.from('dogs').select('id, name');
    setAvailableDogs(data || []);
    if (data && data.length > 0) setSelectedDogId(data[0].id);
    setIsAssignModalOpen(true);
  };

  const handleAssignDog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDogId || !selectedEventId) return;
    
    // Check if already assigned
    const { data: existing } = await supabase.from('event_dogs').select('*').eq('event_id', selectedEventId).eq('dog_id', selectedDogId);
    if (existing && existing.length > 0) {
      alert("Ese perro ya está asignado a este evento.");
      return;
    }

    await supabase.from('event_dogs').insert([{ event_id: selectedEventId, dog_id: selectedDogId }]);
    setIsAssignModalOpen(false);
    fetchEvents();
  };

  const handleRemoveDog = async (eventId: string, dogId: string) => {
    if (confirm("¿Seguro que quieres quitar a este perro del evento?")) {
      await supabase.from('event_dogs').delete().eq('event_id', eventId).eq('dog_id', dogId);
      fetchEvents();
    }
  };

  const updateStatus = async (eventId: string, newStatus: string) => {
    await supabase.from('events').update({ status: newStatus }).eq('id', eventId);
    fetchEvents();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Eventos y Ferias</h1>
          <p className="page-subtitle">Organiza ferias de adopción y decide qué perros asistirán.</p>
        </div>
        <button className={styles.btnAdd} onClick={() => setIsModalOpen(true)}>
          <CalendarIcon size={20} /> Crear Evento
        </button>
      </div>

      <div className={styles.grid}>
        {events.length === 0 ? (
          <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)'}}>
            <CalendarIcon size={64} style={{margin: '0 auto 1rem', opacity: 0.3}}/>
            <p style={{fontSize: '1.2rem', fontWeight: 600}}>No tienes eventos programados.</p>
            <p>Empieza organizando tu primera feria de adopción.</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.title}>{event.title}</div>
                <div className={`${styles.status} ${styles[event.status]}`}>
                  {event.status === 'upcoming' ? 'Próximo' : event.status === 'completed' ? 'Completado' : 'Cancelado'}
                </div>
              </div>
              
              <div className={styles.infoLine}><CalendarIcon size={16}/> {event.event_date}</div>
              <div className={styles.infoLine}><MapPin size={16}/> {event.location}</div>
              {event.description && <div style={{fontSize: '0.85rem', color: '#666', fontStyle: 'italic'}}>"{event.description}"</div>}

              <div style={{marginTop: '0.5rem', display: 'flex', gap: '8px'}}>
                {event.status === 'upcoming' && (
                  <>
                    <button onClick={() => updateStatus(event.id, 'completed')} style={{background:'#f6ffed', color:'#52c41a', border:'1px solid #b7eb8f', borderRadius:'4px', padding:'4px 8px', fontSize:'0.75rem', fontWeight:600, cursor:'pointer'}}>Marcar Completado</button>
                    <button onClick={() => updateStatus(event.id, 'cancelled')} style={{background:'#fff1f0', color:'#f5222d', border:'1px solid #ffa39e', borderRadius:'4px', padding:'4px 8px', fontSize:'0.75rem', fontWeight:600, cursor:'pointer'}}>Cancelar</button>
                  </>
                )}
              </div>

              <div className={styles.dogsList}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '8px'}}>
                  <div style={{fontSize: '0.85rem', fontWeight: 700, display:'flex', alignItems:'center', gap:'4px'}}>
                    <Dog size={14}/> Asistentes ({event.event_dogs?.length || 0})
                  </div>
                  {event.status === 'upcoming' && (
                    <button onClick={() => openAssignModal(event.id)} style={{background:'none', border:'none', color:'var(--primary-orange)', cursor:'pointer', fontSize:'0.75rem', fontWeight:700, display:'flex', alignItems:'center', gap:'2px'}}>
                      <Plus size={14}/> Asignar Perro
                    </button>
                  )}
                </div>
                
                {event.event_dogs && event.event_dogs.length > 0 ? (
                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    {event.event_dogs.map((ed:any) => (
                      <span key={ed.dog_id} className={styles.dogBadge}>
                        {ed.dogs?.name}
                        {event.status === 'upcoming' && (
                          <button onClick={() => handleRemoveDog(event.id, ed.dog_id)} style={{background:'none', border:'none', color:'inherit', cursor:'pointer', padding:0, display:'flex'}} title="Quitar del evento"><X size={12}/></button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Aún no has seleccionado qué perros irán.</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear Evento */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <h2 style={{fontWeight: 700}}>Programar Evento</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}><X/></button>
            </div>
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <input placeholder="Nombre del Evento (ej. Feria de Adopción Parque México)" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', fontWeight:600}}/>
              <input type="date" required value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}/>
              <input placeholder="Ubicación" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}/>
              <textarea placeholder="Descripción (ej. Llevar toldos, agua, mesas...)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', minHeight:'80px', fontFamily:'inherit'}}/>
              
              <button type="submit" style={{background:'var(--primary-orange)', color:'white', border:'none', padding:'1rem', borderRadius:'8px', fontWeight:700, cursor:'pointer', marginTop: '0.5rem'}}>
                Guardar Evento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Perro */}
      {isAssignModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <h2 style={{fontWeight: 700}}>¿Quién asistirá al evento?</h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}><X/></button>
            </div>
            <form onSubmit={handleAssignDog} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <label style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>Selecciona un perro de tu catálogo:</label>
              <select value={selectedDogId} onChange={(e) => setSelectedDogId(e.target.value)} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', fontWeight:600}}>
                {availableDogs.map(dog => (
                  <option key={dog.id} value={dog.id}>{dog.name}</option>
                ))}
              </select>
              <button type="submit" style={{background:'var(--primary-orange)', color:'white', border:'none', padding:'1rem', borderRadius:'8px', fontWeight:700, cursor:'pointer', marginTop: '0.5rem'}}>
                Añadir al Evento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
