'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Bot, Clock, FileText, Dog, CheckCircle2, XCircle, 
  ChevronRight, Printer, X, Sparkles, User, Mail, 
  Home, Heart, AlertCircle, Save, Send, ShieldCheck, ClipboardList
} from 'lucide-react';
import styles from './solicitudes.module.css';

const KANBAN_COLUMNS = [
  { id: 'pending', title: '📥 Recibidas', color: '#64748b' },
  { id: 'reviewing', title: '🔍 En Revisión', color: '#0284c7' },
  { id: 'interview', title: '🗣️ Entrevista', color: '#8b5cf6' },
  { id: 'approved', title: '✅ Aprobadas', color: '#16a34a' },
  { id: 'rejected', title: '❌ Rechazadas', color: '#ef4444' }
];

interface EvaluationData {
  housing_status: string;
  yard_security: string;
  sleep_area: string;
  alone_hours: string;
  primary_carer: string;
  vacation_plan: string;
  vet_budget_confirmed: boolean;
  family_agreement: string;
  evaluator_notes: string;
  verdict: string;
  evaluated_at?: string;
}

const defaultEvaluation: EvaluationData = {
  housing_status: 'Propia',
  yard_security: 'Patio bardeado completamente y seguro',
  sleep_area: 'Dentro de la casa',
  alone_hours: '4 a 8 horas',
  primary_carer: '',
  vacation_plan: '',
  vet_budget_confirmed: true,
  family_agreement: 'Sí, unánime',
  evaluator_notes: '',
  verdict: 'Favorable para Entrevista'
};

// Calculate match percentage and highlights dynamically if missing
function computeCompatibility(dog: any, prefs: any) {
  if (!dog || !prefs) {
    return { score: 85, highlights: ['Estilo de vida compatible con el perrito.'] };
  }

  let score = 70;
  const highlights: string[] = [];

  // 1. Kids matching
  if (prefs.has_kids) {
    if (dog.good_with_kids) {
      score += 10;
      highlights.push('👶 Excelente con niños: El perro es paciente y apto para familia.');
    } else {
      score -= 15;
      highlights.push('⚠️ Precaución: El perrito prefiere un hogar sin niños pequeños.');
    }
  } else {
    score += 5;
    highlights.push('👶 Hogar tranquilo: Sin niños pequeños, ideal para su adaptación.');
  }

  // 2. Housing & Space
  const housing = (prefs.housing_type || '').toLowerCase();
  const dogSize = (dog.size || '').toLowerCase();
  if (housing.includes('grande') || housing.includes('patio amplio')) {
    score += 10;
    highlights.push('🏡 Espacio amplio: Cuenta con patio o jardín ideal para ejercitarse.');
  } else if (housing.includes('departamento') && dogSize.includes('pequeño')) {
    score += 10;
    highlights.push('🏢 Espacio óptimo: Perro pequeño perfectamente adaptado a departamento.');
  } else {
    score += 5;
  }

  // 3. Activity & Energy
  const activity = (prefs.activity_level || '').toLowerCase();
  const energy = (dog.energy_level || '').toLowerCase();
  if ((activity.includes('alto') || activity.includes('activo')) && (energy.includes('alto') || energy.includes('alta'))) {
    score += 10;
    highlights.push('🏃 Energía compatible: Adoptante activo para paseos y juegos diarios.');
  } else if ((activity.includes('bajo') || activity.includes('moderado')) && (energy.includes('bajo') || energy.includes('media'))) {
    score += 10;
    highlights.push('🛋️ Ritmo tranquilo: Nivel de energía sereno y muy manejable.');
  }

  // 4. Other pets
  if (prefs.has_dogs && dog.good_with_other_dogs) {
    highlights.push('🐾 Sociable: Tolera y disfruta convivir con otros perros.');
  }

  const finalScore = Math.min(98, Math.max(55, score));
  return { score: finalScore, highlights };
}

export default function SolicitudesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [preferencesMap, setPreferencesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Modal State (Carta del Adoptante)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData>(defaultEvaluation);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchRequests = async () => {
    // 1. Fetch adoption requests with dogs and applicant profiles
    const { data: reqs, error } = await supabase
      .from('adoption_requests')
      .select(`
        *,
        dogs ( * ),
        profiles ( * )
      `)
      .order('created_at', { ascending: false });

    // 2. Fetch user preferences (survey answers)
    const { data: prefs } = await supabase.from('user_preferences').select('*');
    const pMap: Record<string, any> = {};
    if (prefs) {
      prefs.forEach((p: any) => {
        pMap[p.user_id] = p;
      });
      setPreferencesMap(pMap);
    }

    if (!error && reqs) {
      // Enrich with calculated match score if missing
      const enriched = reqs.map((r: any) => {
        const userPref = pMap[r.client_id];
        const comp = computeCompatibility(r.dogs, userPref);
        return {
          ...r,
          computed_match_score: r.ml_match_score || comp.score,
          match_highlights: comp.highlights
        };
      });
      setRequests(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // When opening a request, load its saved evaluation notes if available
  useEffect(() => {
    if (selectedRequest) {
      setSaveSuccessMsg('');
      if (selectedRequest.notes) {
        try {
          const parsed = JSON.parse(selectedRequest.notes);
          if (parsed && typeof parsed === 'object') {
            setEvaluation({ ...defaultEvaluation, ...parsed });
            return;
          }
        } catch (e) {
          // If notes was plain text
          setEvaluation({
            ...defaultEvaluation,
            evaluator_notes: selectedRequest.notes
          });
          return;
        }
      }
      setEvaluation({
        ...defaultEvaluation,
        primary_carer: selectedRequest.profiles?.full_name || ''
      });
    }
  }, [selectedRequest]);

  // Handle phase change (update in DB + local state)
  const updateRequestStatus = async (reqId: string, newStatus: string) => {
    // Optimistic update
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
    if (selectedRequest && selectedRequest.id === reqId) {
      setSelectedRequest((prev: any) => ({ ...prev, status: newStatus }));
    }

    const { error } = await supabase
      .from('adoption_requests')
      .update({ status: newStatus })
      .eq('id', reqId);

    if (error) {
      alert('Error al actualizar fase de la solicitud.');
      fetchRequests();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const reqId = e.dataTransfer.getData('text/plain');
    if (!reqId) return;

    await updateRequestStatus(reqId, status);
    setDraggedId(null);
  };

  // Save the evaluation format to Supabase
  const handleSaveEvaluation = async (promoteToStatus?: string) => {
    if (!selectedRequest) return;
    setIsSaving(true);
    setSaveSuccessMsg('');

    const targetStatus = promoteToStatus || selectedRequest.status;
    const payload = {
      ...evaluation,
      evaluated_at: new Date().toISOString()
    };

    const notesStr = JSON.stringify(payload);

    const { error } = await supabase
      .from('adoption_requests')
      .update({
        notes: notesStr,
        status: targetStatus
      })
      .eq('id', selectedRequest.id);

    setIsSaving(false);

    if (error) {
      alert('Error al guardar la evaluación: ' + error.message);
    } else {
      setSaveSuccessMsg('¡Evaluación guardada exitosamente!');
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, notes: notesStr, status: targetStatus } : r));
      setSelectedRequest((prev: any) => ({ ...prev, notes: notesStr, status: targetStatus }));
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Start review action (moves from pending to reviewing and opens form)
  const handleStartReview = async () => {
    if (!selectedRequest) return;
    await updateRequestStatus(selectedRequest.id, 'reviewing');
  };

  // Create mock request for testing
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
      alert("Se necesita al menos 1 perro y 1 adoptante registrado para crear una solicitud de prueba.");
    }
  };

  const currentPrefs = selectedRequest ? preferencesMap[selectedRequest.client_id] : null;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Solicitudes de Adopción</h1>
          <p className="page-subtitle">Gestiona el proceso de adopción, revisa encuestas y evalúa a los adoptantes.</p>
        </div>
        <button 
          onClick={createMockRequest} 
          style={{
            backgroundColor: 'white', 
            color: 'var(--text-dark)', 
            border: '1px solid var(--border-color)', 
            padding: '0.65rem 1.25rem', 
            borderRadius: '8px', 
            fontWeight: 600, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '0.85rem'
          }}
        >
          <FileText size={18} /> Generar Solicitud de Prueba
        </button>
      </div>

      {/* --- KANBAN BOARD --- */}
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {column.title}
                </span>
                <span className={styles.badge}>{columnReqs.length}</span>
              </div>
              
              <div className={styles.columnBody}>
                {columnReqs.map(req => {
                  const matchScore = Math.round(req.computed_match_score || req.ml_match_score || 85);
                  const hasEvaluation = Boolean(req.notes);

                  return (
                    <div 
                      key={req.id} 
                      className={`${styles.card} ${draggedId === req.id ? styles.dragging : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, req.id)}
                      onDragEnd={() => setDraggedId(null)}
                      onClick={() => setSelectedRequest(req)}
                      title="Haz clic para abrir la carta y el formato de adopción"
                    >
                      <div className={styles.cardTop}>
                        <div className={`${styles.matchScore} ${matchScore > 80 ? styles.high : ''}`}>
                          <Bot size={13} /> {matchScore}% Match
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {new Date(req.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardTitle}>Para: {req.dogs?.name || 'Perro en adopción'}</div>
                        <div className={styles.cardSubtitle}>
                          {req.dogs?.photo_url ? (
                            <img src={req.dogs.photo_url} alt={req.dogs?.name} className={styles.dogAvatar} />
                          ) : (
                            <div className={styles.dogAvatar} style={{ backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Dog size={12} />
                            </div>
                          )}
                          De: {req.profiles?.full_name || 'Adoptante'}
                        </div>

                        {/* Status / Evaluation indicator */}
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {hasEvaluation ? (
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={12} /> Evaluada
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              {req.status === 'pending' ? 'Por evaluar' : 'En proceso'}
                            </span>
                          )}
                          <span style={{ fontSize: '0.72rem', color: 'var(--primary-orange)', fontWeight: 600 }}>
                            Ver carta →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnReqs.length === 0 && (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    Sin solicitudes en esta fase
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- CARTA DE SOLICITUD DE ADOPCIÓN (MODAL COMPLETO) --- */}
      {selectedRequest && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRequest(null)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            
            {/* 1. MODAL TOP HEADER */}
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 42, height: 42, borderRadius: '10px', backgroundColor: 'var(--primary-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-orange)' }}>
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                    Carta de Solicitud de Adopción
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    ID: {selectedRequest.id.slice(0, 8)} • Recibida el {new Date(selectedRequest.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  className={styles.btnSecondary}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  title="Imprimir formato"
                >
                  <Printer size={15} /> Imprimir
                </button>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* 2. PIPELINE INTERACTIVO DE FASES */}
            <div className={styles.pipelineBar}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: '6px' }}>
                Fase:
              </span>
              {KANBAN_COLUMNS.map(col => {
                const isActive = selectedRequest.status === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => updateRequestStatus(selectedRequest.id, col.id)}
                    className={`${styles.pipelineStep} ${isActive ? styles.active : ''}`}
                  >
                    {col.title}
                  </button>
                );
              })}
            </div>

            {/* 3. CONTENIDO PRINCIPAL EN 2 COLUMNAS */}
            <div className={styles.modalBody}>
              
              {/* COLUMNA IZQUIERDA: DATOS DEL ADOPTANTE + ENCUESTA + PERRO */}
              <div className={styles.columnLeft}>
                
                {/* A. DATOS DEL SOLICITANTE */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <User size={16} color="var(--primary-orange)" /> Datos del Solicitante
                  </div>
                  <div className={styles.dataGrid}>
                    <div className={styles.dataItem}>
                      <div className={styles.dataLabel}>Nombre Completo</div>
                      <div className={styles.dataValue}>{selectedRequest.profiles?.full_name || 'No especificado'}</div>
                    </div>
                    <div className={styles.dataItem}>
                      <div className={styles.dataLabel}>Correo Electrónico</div>
                      <div className={styles.dataValue} style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {selectedRequest.profiles?.email || 'Registrado en Supabase'}
                      </div>
                    </div>
                    <div className={styles.dataItem}>
                      <div className={styles.dataLabel}>Rol en el Sistema</div>
                      <div className={styles.dataValue}>{selectedRequest.profiles?.role || 'Adoptante'}</div>
                    </div>
                    <div className={styles.dataItem}>
                      <div className={styles.dataLabel}>Estado Actual</div>
                      <div className={styles.dataValue} style={{ textTransform: 'capitalize', color: 'var(--primary-orange)' }}>
                        {selectedRequest.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. ENCUESTA DE ESTILO DE VIDA (user_preferences) */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <Home size={16} color="var(--primary-orange)" /> Encuesta de Estilo de Vida
                  </div>
                  <div className={styles.dataGrid}>
                    <div className={styles.dataItem} style={{ gridColumn: 'span 2' }}>
                      <div className={styles.dataLabel}>Tipo de Vivienda</div>
                      <div className={styles.dataValue}>
                        {currentPrefs?.housing_type || selectedRequest.profiles?.housing_type || 'Casa estándar'}
                      </div>
                    </div>
                    <div className={styles.dataItem}>
                      <div className={styles.dataLabel}>¿Tiene Niños?</div>
                      <div className={styles.dataValue}>
                        {currentPrefs?.has_kids ? 'Sí, viven en el hogar' : 'No'}
                      </div>
                    </div>
                    <div className={styles.dataItem}>
                      <div className={styles.dataLabel}>Otras Mascotas</div>
                      <div className={styles.dataValue}>
                        {currentPrefs?.has_dogs ? 'Tiene perros ' : ''}
                        {currentPrefs?.has_cats ? 'Tiene gatos' : (!currentPrefs?.has_dogs ? 'Sin otras mascotas' : '')}
                      </div>
                    </div>
                    <div className={styles.dataItem}>
                      <div className={styles.dataLabel}>Nivel de Actividad</div>
                      <div className={styles.dataValue}>
                        {currentPrefs?.activity_level || 'Moderado (Paseos regulares)'}
                      </div>
                    </div>
                    <div className={styles.dataItem}>
                      <div className={styles.dataLabel}>Experiencia Previa</div>
                      <div className={styles.dataValue}>
                        {currentPrefs?.experience_level || 'Familiarizado con mascotas'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. PERRITO SOLICITADO */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <Dog size={16} color="var(--primary-orange)" /> Perrito Solicitado
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <img 
                      src={selectedRequest.dogs?.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop"} 
                      alt={selectedRequest.dogs?.name}
                      style={{ width: '85px', height: '85px', borderRadius: '12px', objectFit: 'contain', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#1e293b' }}>
                        {selectedRequest.dogs?.name || 'Perrito'}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        <strong>Raza:</strong> {selectedRequest.dogs?.breed || 'Mestizo'}<br/>
                        <strong>Tamaño:</strong> {selectedRequest.dogs?.size || 'Mediano'} • <strong>Energía:</strong> {selectedRequest.dogs?.energy_level || 'Moderada'}<br/>
                        <strong>Apto para niños:</strong> {selectedRequest.dogs?.good_with_kids ? 'Sí ✅' : 'No ❌'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* D. COMPATIBILIDAD IA */}
                <div className={styles.sectionCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <div className={styles.sectionTitle} style={{ color: '#166534' }}>
                    <Sparkles size={16} color="#16a34a" /> Análisis de Compatibilidad IA
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>
                      {Math.round(selectedRequest.computed_match_score || 88)}%
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ height: '8px', backgroundColor: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round(selectedRequest.computed_match_score || 88)}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(selectedRequest.match_highlights || ['Perfil compatible con el perro']).map((h: string, i: number) => (
                      <div key={i} style={{ fontSize: '0.78rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>•</span> {h}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* COLUMNA DERECHA: FORMATO INTEGRAL DE EVALUACIÓN */}
              <div className={styles.columnRight}>
                
                {/* BANNER SI ESTÁ EN RECIBIDAS */}
                {selectedRequest.status === 'pending' && (
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e40af' }}>
                        Solicitud en fase Recibida
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: '2px' }}>
                        Al iniciar la evaluación, la solicitud avanzará automáticamente a "En Revisión".
                      </div>
                    </div>
                    <button
                      onClick={handleStartReview}
                      className={styles.btnPrimary}
                      style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      <CheckCircle2 size={15} /> Iniciar Revisión
                    </button>
                  </div>
                )}

                {/* FORMATO DE EVALUACIÓN OFICIAL */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <ShieldCheck size={18} color="var(--primary-orange)" /> Formato de Evaluación de Adopción
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
                    Registra los hallazgos de la entrevista telefónica o presencial con el adoptante.
                  </p>

                  {/* 1. SECCIÓN VIVIENDA */}
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginBottom: '0.75rem' }}>
                    1. Vivienda y Seguridad
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Régimen de la Vivienda</label>
                    <select
                      className={styles.formSelect}
                      value={evaluation.housing_status}
                      onChange={e => setEvaluation({ ...evaluation, housing_status: e.target.value })}
                    >
                      <option value="Propia">Propia</option>
                      <option value="Rentada con permiso explícito de mascotas">Rentada con permiso explícito de mascotas</option>
                      <option value="Familiar / Compartida">Familiar / Compartida</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Seguridad del Patio / Jardín</label>
                    <select
                      className={styles.formSelect}
                      value={evaluation.yard_security}
                      onChange={e => setEvaluation({ ...evaluation, yard_security: e.target.value })}
                    >
                      <option value="Patio bardeado completamente y seguro">Patio bardeado completamente y seguro</option>
                      <option value="Patio abierto / Requiere adecuación de rejas">Patio abierto / Requiere adecuación de rejas</option>
                      <option value="Sin patio (Vive en departamento / Paseos diarios)">Sin patio (Vive en departamento / Paseos diarios)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>¿Dónde dormirá el perro?</label>
                    <select
                      className={styles.formSelect}
                      value={evaluation.sleep_area}
                      onChange={e => setEvaluation({ ...evaluation, sleep_area: e.target.value })}
                    >
                      <option value="Dentro de la casa con la familia">Dentro de la casa con la familia</option>
                      <option value="En patio techado con cama/casa adecuada">En patio techado con cama/casa adecuada</option>
                      <option value="Área común del hogar">Área común del hogar</option>
                    </select>
                  </div>

                  {/* 2. SECCIÓN RUTINA Y CUIDADO */}
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginTop: '1.25rem', marginBottom: '0.75rem' }}>
                    2. Rutina y Cuidados Diarios
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Horas estimadas que pasará solo al día</label>
                    <select
                      className={styles.formSelect}
                      value={evaluation.alone_hours}
                      onChange={e => setEvaluation({ ...evaluation, alone_hours: e.target.value })}
                    >
                      <option value="Menos de 4 horas (Alguien siempre en casa)">Menos de 4 horas (Alguien siempre en casa)</option>
                      <option value="4 a 8 horas (Jornada laboral típica)">4 a 8 horas (Jornada laboral típica)</option>
                      <option value="Más de 8 horas (Requiere paseador / apoyo)">Más de 8 horas (Requiere paseador / apoyo)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Responsable principal del perro</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Ej. Gabriel y su pareja"
                      value={evaluation.primary_carer}
                      onChange={e => setEvaluation({ ...evaluation, primary_carer: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Plan para vacaciones o imprevistos familiares</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Ej. Hotel canino de confianza o se queda con sus padres"
                      value={evaluation.vacation_plan}
                      onChange={e => setEvaluation({ ...evaluation, vacation_plan: e.target.value })}
                    />
                  </div>

                  {/* 3. SECCIÓN COMPROMISO */}
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginTop: '1.25rem', marginBottom: '0.75rem' }}>
                    3. Compromiso y Presupuesto
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Presupuesto para emergencias veterinarias y alimentación</label>
                    <select
                      className={styles.formSelect}
                      value={evaluation.vet_budget_confirmed ? 'true' : 'false'}
                      onChange={e => setEvaluation({ ...evaluation, vet_budget_confirmed: e.target.value === 'true' })}
                    >
                      <option value="true">Confirmado (Cuenta con solvencia para imprevistos médicos)</option>
                      <option value="false">En observación (Requiere mayor orientación financiera)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Acuerdo de todos los integrantes del hogar</label>
                    <select
                      className={styles.formSelect}
                      value={evaluation.family_agreement}
                      onChange={e => setEvaluation({ ...evaluation, family_agreement: e.target.value })}
                    >
                      <option value="Sí, unánime">Sí, unánime (Todos de acuerdo)</option>
                      <option value="Pendiente confirmar">Pendiente confirmar con integrantes</option>
                      <option value="En desacuerdo">En desacuerdo</option>
                    </select>
                  </div>

                  {/* 4. NOTAS Y OBSERVACIONES LIBRES */}
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginTop: '1.25rem', marginBottom: '0.75rem' }}>
                    4. Observaciones de la Entrevista (Staff)
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Notas y comentarios del evaluador</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder="Escribe aquí las impresiones de la llamada, actitud del adoptante, dudas resueltas..."
                      value={evaluation.evaluator_notes}
                      onChange={e => setEvaluation({ ...evaluation, evaluator_notes: e.target.value })}
                    />
                  </div>

                  {/* 5. DICTAMEN FINAL */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontWeight: 700 }}>
                      Dictamen Preliminar del Evaluador
                    </label>
                    <select
                      className={styles.formSelect}
                      value={evaluation.verdict}
                      onChange={e => setEvaluation({ ...evaluation, verdict: e.target.value })}
                      style={{ fontWeight: 600, color: 'var(--primary-orange)' }}
                    >
                      <option value="Favorable para Entrevista">Favorable para Entrevista Presencial</option>
                      <option value="Requiere Visita Domiciliaria">Requiere Visita Domiciliaria</option>
                      <option value="Aprobación Inmediata">Aprobación Inmediata</option>
                      <option value="No Recomendado / Rechazar">No Recomendado / Rechazar</option>
                    </select>
                  </div>

                  {/* MENSAJE DE ÉXITO */}
                  {saveSuccessMsg && (
                    <div style={{ padding: '0.6rem 1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> {saveSuccessMsg}
                    </div>
                  )}

                  {/* BOTONES DE ACCIÓN */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1rem' }}>
                    <button
                      onClick={() => handleSaveEvaluation()}
                      disabled={isSaving}
                      className={styles.btnSecondary}
                      style={{ flex: '1 1 auto' }}
                    >
                      <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Evaluación'}
                    </button>

                    {selectedRequest.status !== 'interview' && selectedRequest.status !== 'approved' && (
                      <button
                        onClick={() => handleSaveEvaluation('interview')}
                        disabled={isSaving}
                        className={styles.btnPrimary}
                        style={{ flex: '1 1 auto', backgroundColor: '#8b5cf6' }}
                      >
                        🗣️ Pasar a Entrevista
                      </button>
                    )}

                    {selectedRequest.status !== 'approved' && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Aprobar definitivamente la adopción de ${selectedRequest.dogs?.name || 'este perrito'} para ${selectedRequest.profiles?.full_name || 'este adoptante'}?`)) {
                            handleSaveEvaluation('approved');
                          }
                        }}
                        disabled={isSaving}
                        className={styles.btnPrimary}
                        style={{ flex: '1 1 auto', backgroundColor: '#16a34a' }}
                      >
                        ✅ Aprobar Adopción
                      </button>
                    )}

                    {selectedRequest.status !== 'rejected' && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Seguro que deseas rechazar esta solicitud?`)) {
                            handleSaveEvaluation('rejected');
                          }
                        }}
                        disabled={isSaving}
                        style={{
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '0.7rem 1rem',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        ❌ Rechazar
                      </button>
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
