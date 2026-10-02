'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bot, User, Clock, FileText, Dog } from 'lucide-react';
import styles from './solicitudes.module.css';

const KANBAN_COLUMNS = [
  { id: 'pending', title: '📥 Recibidas' },
  { id: 'reviewing', title: '🔍 En Revisión' },
  { id: 'interview', title: '🗣️ Entrevista' },
  { id: 'approved', title: '✅ Aprobadas' },
  { id: 'rejected', title: '❌ Rechazadas' }
];

export default function SolicitudesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For Drag and Drop
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchRequests = async () => {
    // In a real app we would join tables. Supabase allows this if foreign keys are set up.
    // adoption_requests -> dogs(id) & profiles(id)
    const { data, error } = await supabase
      .from('adoption_requests')
      .select(`
        *,
        dogs ( name, photo_url ),
        profiles ( full_name )
      `);
      
    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const reqId = e.dataTransfer.getData('text/plain');
    if (!reqId) return;

    // Optimistic UI update
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
    
    // Update DB
    const { error } = await supabase
      .from('adoption_requests')
      .update({ status })
      .eq('id', reqId);
      
    if (error) {
      alert("Error moviendo solicitud");
      fetchRequests(); // Revert on error
    }
    setDraggedId(null);
  };

  // Create a mock request if none exist (for UI testing)
  const createMockRequest = async () => {
    const { data: dogs } = await supabase.from('dogs').select('id').limit(1);
    const { data: users } = await supabase.from('profiles').select('id').eq('role', 'client').limit(1);
    
    if (dogs?.[0] && users?.[0]) {
      await supabase.from('adoption_requests').insert({
        dog_id: dogs[0].id,
        client_id: users[0].id,
        status: 'pending',
        ml_match_score: 92.5
      });
      fetchRequests();
    } else {
      alert("Necesitas al menos 1 perro y 1 cliente (adoptante) registrado para crear una solicitud de prueba.");
    }
  };

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1 className="page-title">Solicitudes de Adopción</h1>
          <p className="page-subtitle">Gestiona el proceso de adopción arrastrando las tarjetas de fase en fase.</p>
        </div>
        <button onClick={createMockRequest} style={{backgroundColor: 'white', color: 'var(--text-dark)', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <FileText size={20} /> Generar Solicitud de Prueba
        </button>
      </div>

      <div className={styles.kanbanContainer}>
        {KANBAN_COLUMNS.map(column => {
          const columnReqs = requests.filter(r => r.status === column.id);
          
          return (
            <div 
              key={column.id} 
              className={styles.column}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={styles.columnHeader}>
                {column.title}
                <span className={styles.badge}>{columnReqs.length}</span>
              </div>
              
              <div className={styles.columnBody}>
                {columnReqs.map(req => (
                  <div 
                    key={req.id} 
                    className={`${styles.card} ${draggedId === req.id ? styles.dragging : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, req.id)}
                    onDragEnd={() => setDraggedId(null)}
                  >
                    <div className={styles.cardTop}>
                      <div className={`${styles.matchScore} ${req.ml_match_score > 80 ? styles.high : ''}`}>
                        <Bot size={14} /> {req.ml_match_score ? `${req.ml_match_score}% Match` : 'IA Calculando...'}
                      </div>
                      <Clock size={14} color="var(--text-muted)" />
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTitle}>Para: {req.dogs?.name || 'Perro Borrado'}</div>
                      <div className={styles.cardSubtitle}>
                        {req.dogs?.photo_url ? (
                           <img src={req.dogs.photo_url} className={styles.dogAvatar} />
                        ) : (
                           <div className={styles.dogAvatar} style={{backgroundColor:'#eee', display:'flex', alignItems:'center', justifyContent:'center'}}><Dog size={12}/></div>
                        )}
                        De: {req.profiles?.full_name || 'Adoptante'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  );
}
