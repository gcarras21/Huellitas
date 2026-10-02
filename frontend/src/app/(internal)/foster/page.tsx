'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Home, Phone, MapPin, Users, Plus, X } from 'lucide-react';
import styles from './foster.module.css';

export default function FosterPage() {
  const [fosters, setFosters] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', capacity: 1, notes: '' });

  const fetchFosters = async () => {
    // Al usar supabase, podemos traernos automáticamente a los perros asociados gracias a la foreign key que creé
    const { data } = await supabase.from('foster_homes').select('*, dogs(id, name)');
    if (data) setFosters(data);
  };

  useEffect(() => { fetchFosters(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('foster_homes').insert([formData]);
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', address: '', capacity: 1, notes: '' });
    fetchFosters();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Casas Puente (Foster Homes)</h1>
          <p className="page-subtitle">Gestiona la red de voluntarios que hospedan perros temporalmente.</p>
        </div>
        <button className={styles.btnAdd} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Nueva Casa Puente
        </button>
      </div>

      <div className={styles.grid}>
        {fosters.map(foster => (
          <div key={foster.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.name}>{foster.name}</div>
              <div className={`${styles.status} ${styles[foster.status]}`}>
                {foster.status === 'active' ? 'Activa' : 'Inactiva'}
              </div>
            </div>
            
            <div className={styles.infoLine}><Phone size={16}/> {foster.phone || 'Sin teléfono'}</div>
            <div className={styles.infoLine}><MapPin size={16}/> {foster.address || 'Sin dirección'}</div>
            <div className={styles.infoLine}><Users size={16}/> Capacidad: {foster.capacity} perro(s)</div>
            
            {foster.notes && (
              <div style={{fontSize: '0.85rem', color: '#666', fontStyle: 'italic'}}>"{foster.notes}"</div>
            )}

            <div className={styles.dogsList}>
              <div style={{fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px'}}>Huéspedes actuales:</div>
              {foster.dogs && foster.dogs.length > 0 ? (
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  {foster.dogs.map((dog:any) => (
                    <span key={dog.id} style={{background: 'var(--primary-orange-light)', color: 'var(--primary-orange)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600}}>
                      🐶 {dog.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Ninguno en este momento.</div>
              )}
            </div>
          </div>
        ))}

        {fosters.length === 0 && (
          <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
            <Home size={48} style={{margin: '0 auto 1rem', opacity: 0.5}}/>
            <p>No tienes Casas Puente registradas. ¡Agrega a tu primer voluntario!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <h2 style={{fontWeight: 700}}>Registrar Casa Puente</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}><X/></button>
            </div>
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <input placeholder="Nombre del Voluntario (ej. Familia Pérez)" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}/>
              <input placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}/>
              <input placeholder="Dirección completa" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}/>
              <div>
                <label style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>¿Cuántos perros pueden hospedar a la vez?</label>
                <input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', marginTop:'4px'}}/>
              </div>
              <textarea placeholder="Notas extras (ej. Tienen 2 gatos, jardín grande, no apto para cachorros)" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', minHeight:'80px', fontFamily: 'inherit'}}/>
              
              <button type="submit" style={{background:'var(--primary-orange)', color:'white', border:'none', padding:'1rem', borderRadius:'8px', fontWeight:700, cursor:'pointer', marginTop: '0.5rem'}}>
                Guardar Casa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
