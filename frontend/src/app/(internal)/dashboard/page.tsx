'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Calendar, Cloud, Bell, Syringe, Bug, Activity, Heart, Eye, Dog, Home, ClipboardList } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Admin');

  // Stats
  const [totalDogs, setTotalDogs] = useState(0);
  const [availableDogs, setAvailableDogs] = useState(0);
  const [fosterDogs, setFosterDogs] = useState(0);

  // Lists
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [upcomingMeds, setUpcomingMeds] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchData() {
      // Get User Name
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
        if (prof && prof.full_name) {
          setUserName(prof.full_name.split(' ')[0]);
        }
      }

      // Dogs Stats
      const { data: dogsData } = await supabase.from('dogs').select('*');
      if (dogsData) {
        setTotalDogs(dogsData.length);
        setAvailableDogs(dogsData.filter(d => d.status !== 'adopted').length);
        setFosterDogs(dogsData.filter(d => d.foster_home_id !== null).length);
      }

      // Applications
      const { data: appsData } = await supabase.from('adoption_requests').select('*, dogs(name, photo_url), profiles(full_name)').order('created_at', { ascending: false }).limit(4);
      if (appsData) setRecentApps(appsData);

      // Medical (Upcoming)
      const { data: medData } = await supabase.from('medical_records').select('*, dogs(name, photo_url)').not('next_due_date', 'is', null).order('next_due_date', { ascending: true }).limit(5);
      if (medData) setUpcomingMeds(medData);

      setLoading(false);
    }
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const getMedIcon = (type: string) => {
    if (type === 'vaccine') return <Syringe size={16} />;
    if (type === 'deworming') return <Bug size={16} />;
    return <Activity size={16} />;
  };
  const getMedColor = (type: string) => {
    if (type === 'vaccine') return 'red';
    if (type === 'deworming') return 'green';
    return 'purple';
  };
  const translateType = (type: string) => {
    if (type === 'vaccine') return 'Vacuna';
    if (type === 'deworming') return 'Desparasitación';
    if (type === 'surgery') return 'Cirugía';
    return 'Revisión';
  };

  return (
    <>
      <header className="top-header">
        <div className="greeting">
          <h1>¡Buenos días, {userName}! 👋</h1>
          <p>Este es el resumen de lo más importante hoy.</p>
        </div>
        <div className="header-tools">
          <div className="tool-badge"><Calendar size={16} color="var(--text-muted)" /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div style={{position: 'relative', cursor: 'pointer'}}>
            <Bell size={20} color="var(--text-dark)" />
            {recentApps.filter(a => a.status === 'pending').length > 0 && <span style={{position: 'absolute', top: -4, right: -4, backgroundColor: 'var(--urgent-red)', width: 10, height: 10, borderRadius: '50%'}}></span>}
          </div>
        </div>
      </header>

      <div className="bento-grid">
        
        {/* 1. Urgent Items (Medical Deadlines) */}
        <div className="bento-card col-span-3">
          <div className="bento-title">🚨 TAREAS MÉDICAS PRÓXIMAS <span className="tag-urgent" style={{marginLeft: '8px'}}>{upcomingMeds.length} pendientes</span></div>
          
          <div className="urgent-scroll">
            {loading ? (
              <p style={{color: 'var(--text-muted)', padding: '1rem'}}>Sincronizando con la base de datos...</p>
            ) : upcomingMeds.length === 0 ? (
              <p style={{color: 'var(--text-muted)', padding: '1rem'}}>No hay citas médicas ni vacunas próximas. ¡Excelente trabajo!</p>
            ) : (
              upcomingMeds.map((med) => (
                <div key={med.id} className="dog-card-mini">
                  {med.dogs?.photo_url ? (
                    <img src={med.dogs.photo_url} alt={med.dogs?.name} style={{width: '100%', height: 100, borderRadius: 8, objectFit: 'contain', backgroundColor: '#f8fafc'}} />
                  ) : (
                    <div style={{backgroundColor: '#e2e8f0', height: 100, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
                      <Dog size={32}/>
                    </div>
                  )}
                  <div className="dog-info" style={{marginTop: '0.5rem'}}>
                    <h4>{med.dogs?.name}</h4>
                    <span className="tag-urgent" style={{backgroundColor: '#fff1f0', color: '#f5222d'}}>VENCE PRONTO</span>
                  </div>
                  <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px'}}>
                    <b>{translateType(med.record_type)}</b><br/>
                    Para el {formatDate(med.next_due_date)}
                  </p>
                  <div style={{display: 'flex', gap: 4, marginTop: 'auto', paddingTop: '8px'}}>
                    <a href="/health" style={{textDecoration:'none', width:'100%'}}><button className="btn-outline" style={{width:'100%'}}>Abrir Expediente</button></a>
                  </div>
                </div>
              ))
            )}
            
            {/* Action Card para solicitudes nuevas */}
            {recentApps.filter(a => a.status === 'pending').length > 0 && (
              <div className="dog-card-mini" style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderStyle: 'dashed', minWidth: '160px', backgroundColor: '#fffaf5', borderColor: '#ffc069'}}>
                <div style={{color: 'var(--primary-orange)', marginBottom: 8}}><ClipboardList size={24}/></div>
                <h4 style={{fontSize: '1rem'}}>{recentApps.filter(a => a.status === 'pending').length} Solicitudes<br/>Nuevas</h4>
                <p style={{color: 'var(--urgent-red)', fontSize: '0.8rem', marginTop: '4px'}}>Pendientes de revisión</p>
                <a href="/solicitudes" style={{textDecoration:'none', marginTop: 12, width: '100%'}}>
                  <button className="btn-outline" style={{width: '100%', borderColor: 'var(--primary-orange)', color: 'var(--primary-orange)'}}>Ir a Solicitudes</button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 2. Próximos Vencimientos */}
        <div className="bento-card col-span-1">
          <div className="bento-title">📅 AGENDA MÉDICA</div>
          {upcomingMeds.slice(0,3).map(med => (
             <div className="list-item" key={med.id}>
              <div className="list-item-left">
                <div className={`icon-box ${getMedColor(med.record_type)}`}>{getMedIcon(med.record_type)}</div>
                <div>
                  <div className="list-item-title">{translateType(med.record_type)}: {med.dogs?.name}</div>
                  <div className="list-item-subtitle">{med.notes?.substring(0, 20) || 'Sin notas extra'}</div>
                </div>
              </div>
              <div className="list-item-right" style={{fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)'}}>{formatDate(med.next_due_date)}</div>
            </div>
          ))}
          {upcomingMeds.length === 0 && <div style={{fontSize: '0.8rem', color: '#666', marginTop: '1rem'}}>Nada en la agenda.</div>}
        </div>

        {/* 3. Solicitudes Recientes */}
        <div className="bento-card col-span-1">
          <div className="bento-title">📝 SOLICITUDES RECIENTES</div>
          {recentApps.map((app) => (
            <div className="list-item" key={app.id}>
              <div className="list-item-left">
                {app.dogs?.photo_url ? (
                  <img src={app.dogs.photo_url} style={{width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top'}} />
                ) : (
                  <div style={{width: 40, height: 40, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Dog size={16} color="#aaa"/></div>
                )}
                <div>
                  <div className="list-item-title">{app.dogs?.name || 'Desconocido'}</div>
                  <div className="list-item-subtitle" style={{fontSize: '0.7rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'120px'}}>
                    Por: {app.profiles?.full_name || 'Usuario'}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '0.65rem', padding: '4px 8px', borderRadius: 12, fontWeight: 700,
                backgroundColor: app.status === 'pending' ? '#fff7e6' : app.status === 'approved' ? '#f6ffed' : '#fff1f0',
                color: app.status === 'pending' ? '#fa8c16' : app.status === 'approved' ? '#52c41a' : '#f5222d'
              }}>
                {app.status === 'pending' ? 'PENDIENTE' : app.status === 'approved' ? 'APROBADA' : 'RECHAZADA'}
              </div>
            </div>
          ))}
          {recentApps.length === 0 && <div style={{fontSize: '0.8rem', color: '#666', marginTop: '1rem'}}>No hay solicitudes registradas.</div>}
          <a href="/solicitudes" style={{marginTop: 'auto', textDecoration:'none'}}><button className="btn-outline" style={{width:'100%'}}>Ver todas</button></a>
        </div>

        {/* 4. Refugio */}
        <div className="bento-card col-span-1">
          <div className="bento-title">🏠 VISTA DEL REFUGIO</div>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="icon-box purple"><Dog size={16}/></div>
              <div>
                <h3>{totalDogs}</h3><p>Total en BD</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="icon-box orange"><Heart size={16}/></div>
              <div>
                <h3>{availableDogs}</h3><p>Disponibles</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="icon-box green"><Home size={16}/></div>
              <div>
                <h3>{fosterDogs}</h3><p>Casas Puente</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="icon-box red"><Activity size={16}/></div>
              <div>
                <h3>0</h3><p>Cuarentena</p>
              </div>
            </div>
          </div>
        </div>



      </div>
    </>
  );
}
