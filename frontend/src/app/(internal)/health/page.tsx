'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { HeartPulse, Syringe, Pill, Stethoscope, Plus, X, Calendar, User, Trash2 } from 'lucide-react';
import styles from './health.module.css';

export default function HealthPage() {
  const [dogs, setDogs] = useState<any[]>([]);
  const [selectedDog, setSelectedDog] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    record_type: 'vaccine',
    description: '',
    date_administered: '',
    next_due_date: '',
    vet_name: ''
  });

  const fetchDogs = async () => {
    const { data } = await supabase.from('dogs').select('*').order('name');
    if (data) {
      setDogs(data);
      // Auto-seleccionar al primer perro para que no se vea vacío
      if (data.length > 0 && !selectedDog) {
        selectDog(data[0]);
      }
    }
  };

  const selectDog = async (dog: any) => {
    setSelectedDog(dog);
    const { data } = await supabase
      .from('medical_records')
      .select('*')
      .eq('dog_id', dog.id)
      .order('date_administered', { ascending: false });
    setRecords(data || []);
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDog) return;
    
    await supabase.from('medical_records').insert([{
      ...formData,
      dog_id: selectedDog.id,
      date_administered: formData.date_administered || null,
      next_due_date: formData.next_due_date || null
    }]);
    
    setIsModalOpen(false);
    setFormData({ record_type: 'vaccine', description: '', date_administered: '', next_due_date: '', vet_name: '' });
    selectDog(selectedDog);
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro médico?')) return;
    await supabase.from('medical_records').delete().eq('id', recordId);
    if (selectedDog) selectDog(selectedDog);
  };

  const getIcon = (type: string) => {
    if (type === 'vaccine') return <Syringe size={20} />;
    if (type === 'surgery') return <HeartPulse size={20} />;
    if (type === 'deworming') return <Pill size={20} />;
    return <Stethoscope size={20} />;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Expediente Médico</h1>
          <p className="page-subtitle">Lleva el control de vacunas, desparasitaciones y cirugías de cada perro.</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* SIDEBAR: Lista de Perros */}
        <div className={styles.sidebar}>
          <div style={{padding:'1rem', borderBottom:'1px solid var(--border-color)', fontWeight:700, background:'#f8fafc', position: 'sticky', top: 0, zIndex: 10}}>
            Directorio de Pacientes
          </div>
          {dogs.map(dog => (
            <div 
              key={dog.id} 
              className={`${styles.dogItem} ${selectedDog?.id === dog.id ? styles.active : ''}`}
              onClick={() => selectDog(dog)}
            >
              {dog.photo_url ? (
                <img src={dog.photo_url} className={styles.dogAvatar} />
              ) : (
                <div className={styles.dogAvatar} style={{display:'flex', alignItems:'center', justifyContent:'center'}}><HeartPulse size={20} color="#ccc"/></div>
              )}
              <div>
                <div style={{fontWeight:600}}>{dog.name}</div>
                <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{dog.size || 'Tamaño desconocido'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* DETALLE: Expediente del Perro */}
        <div className={styles.content}>
          {selectedDog ? (
            <>
              <div className={styles.contentHeader}>
                <div>
                  <h2 style={{fontSize:'1.5rem', fontWeight:700, marginBottom:'4px'}}>Historial de {selectedDog.name}</h2>
                  <div style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>Chip/ID: {selectedDog.id.split('-')[0]}</div>
                </div>
                <button className={styles.btnAdd} onClick={() => setIsModalOpen(true)}>
                  <Plus size={18} /> Añadir Registro
                </button>
              </div>

              <div className={styles.timeline}>
                {records.length === 0 ? (
                  <div style={{textAlign:'center', padding:'4rem 2rem', color:'var(--text-muted)'}}>
                    <Stethoscope size={64} style={{margin:'0 auto 1.5rem', opacity:0.3}} />
                    <p style={{fontSize: '1.1rem'}}>No hay registros médicos para {selectedDog.name}.</p>
                    <p style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>Añade su primera vacuna o desparasitación.</p>
                  </div>
                ) : (
                  records.map(record => (
                    <div key={record.id} className={styles.recordItem}>
                      <div className={`${styles.recordIcon} ${styles[record.record_type]}`}>
                        {getIcon(record.record_type)}
                      </div>
                      <div className={styles.recordDetails} style={{flexGrow: 1}}>
                        <div className={styles.recordTitle}>{record.description}</div>
                        <div className={styles.recordDate}>
                          <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Calendar size={14}/> Aplicado: {record.date_administered || 'Sin fecha'}</span>
                          {record.next_due_date && (
                            <span style={{display:'flex', alignItems:'center', gap:'4px', color:'var(--primary-orange)', fontWeight: 600}}><Calendar size={14}/> Próxima dosis: {record.next_due_date}</span>
                          )}
                        </div>
                        {record.vet_name && (
                          <div style={{fontSize:'0.8rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px'}}>
                            <User size={14}/> Veterinario: {record.vet_name}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        style={{background:'transparent', border:'none', cursor:'pointer', color:'#ef4444', padding: '8px', alignSelf: 'flex-start', opacity: 0.7}}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="Eliminar registro"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-muted)'}}>
              Selecciona un paciente en el menú izquierdo para ver su expediente.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <h2 style={{fontWeight: 700}}>Añadir Registro Médico</h2>
              <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}><X/></button>
            </div>
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              
              <div>
                <label style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'block', marginBottom:'4px'}}>Tipo de Registro</label>
                <select required value={formData.record_type} onChange={e => setFormData({...formData, record_type: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', fontFamily:'inherit'}}>
                  <option value="vaccine">Vacuna</option>
                  <option value="deworming">Desparasitación</option>
                  <option value="surgery">Cirugía (ej. Esterilización)</option>
                  <option value="checkup">Revisión General</option>
                </select>
              </div>

              <div>
                <label style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'block', marginBottom:'4px'}}>Descripción / Nombre del tratamiento</label>
                <input required placeholder="Ej. Vacuna Múltiple, Bravecto, Esterilización..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', fontFamily:'inherit'}}/>
              </div>

              <div style={{display:'flex', gap:'1rem'}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'block', marginBottom:'4px'}}>Fecha de Aplicación</label>
                  <input type="date" value={formData.date_administered} onChange={e => setFormData({...formData, date_administered: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', fontFamily:'inherit'}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'block', marginBottom:'4px'}}>Próxima Dosis (opcional)</label>
                  <input type="date" value={formData.next_due_date} onChange={e => setFormData({...formData, next_due_date: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', fontFamily:'inherit'}}/>
                </div>
              </div>

              <div>
                <label style={{fontSize:'0.85rem', color:'var(--text-muted)', display:'block', marginBottom:'4px'}}>Nombre del Veterinario (opcional)</label>
                <input placeholder="Ej. Dr. Martínez - Clínica Vet" value={formData.vet_name} onChange={e => setFormData({...formData, vet_name: e.target.value})} style={{padding:'0.75rem', borderRadius:'8px', border:'1px solid var(--border-color)', width:'100%', fontFamily:'inherit'}}/>
              </div>
              
              <button type="submit" style={{background:'var(--primary-orange)', color:'white', border:'none', padding:'1rem', borderRadius:'8px', fontWeight:700, cursor:'pointer', marginTop: '0.5rem'}}>
                Guardar Expediente
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
