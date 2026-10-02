'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Calendar, Cloud, Bell, Syringe, Bug, Activity, Heart, Eye, Dog, Home, ClipboardList } from 'lucide-react';

export default function DashboardPage() {
  const [dogs, setDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('dogs').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setDogs(data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const urgentDogs = dogs.slice(0, 3);
  const totalDogs = dogs.length;
  const availableDogs = dogs.filter(d => !d.is_adopted).length;

  return (
    <>
      {/* Top Header */}
      <header className="top-header">
        <div className="greeting">
          <h1>Good morning, Gabriel! 👋</h1>
          <p>Here's what's most important today.</p>
        </div>
        <div className="header-tools">
          <div className="tool-badge"><Calendar size={16} color="var(--text-muted)" /> Today is July 15, 2026</div>
          <div className="tool-badge"><Cloud size={16} color="var(--text-muted)" /> 28°C Mérida, Yucatán</div>
          <div style={{position: 'relative', cursor: 'pointer'}}>
            <Bell size={20} color="var(--text-dark)" />
            <span style={{position: 'absolute', top: -4, right: -4, backgroundColor: 'var(--urgent-red)', width: 10, height: 10, borderRadius: '50%'}}></span>
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="bento-grid">
        
        {/* 1. Urgent Items */}
        <div className="bento-card col-span-3">
          <div className="bento-title">🚨 1. URGENT ITEMS <span className="tag-urgent" style={{marginLeft: '8px'}}>{urgentDogs.length} pending</span></div>
          
          <div className="urgent-scroll">
            {loading ? (
              <p style={{color: 'var(--text-muted)', padding: '1rem'}}>Cargando perritos desde la base de datos...</p>
            ) : urgentDogs.length === 0 ? (
              <p style={{color: 'var(--text-muted)', padding: '1rem'}}>No hay perritos registrados. Ve a la pestaña "Dogs" para añadir.</p>
            ) : (
              urgentDogs.map((dog) => (
                <div key={dog.id} className="dog-card-mini">
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.name} style={{width: '100%', height: 100, borderRadius: 8, objectFit: 'cover'}} />
                  ) : (
                    <div style={{backgroundColor: '#e2e8f0', height: 100, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
                      <Dog size={32}/>
                    </div>
                  )}
                  <div className="dog-info" style={{marginTop: '0.5rem'}}>
                    <h4>{dog.name}</h4>
                    <span className="tag-urgent">URGENT</span>
                  </div>
                  <p style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Revisión médica<br/>pendiente</p>
                  <div style={{display: 'flex', gap: 4, marginTop: 'auto'}}>
                    <button className="btn-outline">Marcar listo</button>
                    <button className="btn-outline" style={{width: '32px'}}>⋮</button>
                  </div>
                </div>
              ))
            )}
            
            {/* Application Card (Static logic placeholder) */}
            <div className="dog-card-mini" style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderStyle: 'dashed', minWidth: '160px'}}>
              <div style={{color: 'var(--primary-orange)', marginBottom: 8}}><ClipboardList size={24}/></div>
              <h4>New adoption<br/>application</h4>
              <p style={{color: 'var(--urgent-red)'}}>Received today</p>
              <button className="btn-outline" style={{marginTop: 8}}>Review</button>
            </div>
          </div>
        </div>

        {/* 2. Upcoming Deadlines */}
        <div className="bento-card col-span-1">
          <div className="bento-title">📅 2. UPCOMING DEADLINES</div>
          <div className="list-item">
            <div className="list-item-left">
              <div className="icon-box red"><Syringe size={16} /></div>
              <div>
                <div className="list-item-title">Vaccinations</div>
                <div className="list-item-subtitle">{Math.max(1, Math.floor(totalDogs / 3))} dogs</div>
              </div>
            </div>
            <div className="list-item-right">This week &gt;</div>
          </div>
          <div className="list-item">
            <div className="list-item-left">
              <div className="icon-box green"><Bug size={16} /></div>
              <div>
                <div className="list-item-title">Deworming</div>
                <div className="list-item-subtitle">{Math.max(0, Math.floor(totalDogs / 4))} dogs</div>
              </div>
            </div>
            <div className="list-item-right">This week &gt;</div>
          </div>
          <div className="list-item">
            <div className="list-item-left">
              <div className="icon-box purple"><Activity size={16} /></div>
              <div>
                <div className="list-item-title">Veterinary check-ups</div>
                <div className="list-item-subtitle">{Math.max(1, Math.floor(totalDogs / 5))} dogs</div>
              </div>
            </div>
            <div className="list-item-right">This week &gt;</div>
          </div>
        </div>

        {/* 3. Adoption Applications */}
        <div className="bento-card col-span-1">
          <div className="bento-title">📝 3. ADOPTION APPLICATIONS</div>
          {urgentDogs.slice(0, 2).map((dog, i) => (
            <div className="list-item" key={dog.id}>
              <div className="list-item-left">
                {dog.photo_url ? (
                  <img src={dog.photo_url} style={{width: 40, height: 40, borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <div style={{width: 40, height: 40, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Dog size={16} color="#aaa"/></div>
                )}
                <div>
                  <div className="list-item-title">{dog.name}</div>
                  <div className="list-item-subtitle">{i === 0 ? 'Application received' : 'Home visit pending'}</div>
                </div>
              </div>
              <div style={{fontSize: '0.75rem', padding: '4px 8px', backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', borderRadius: 12}}>Step {i+1} of 4</div>
            </div>
          ))}
          <button className="btn-outline" style={{marginTop: 'auto'}}>View all applications</button>
        </div>

        {/* 4. Shelter Overview */}
        <div className="bento-card col-span-1">
          <div className="bento-title">🏠 4. SHELTER OVERVIEW</div>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="icon-box purple"><Dog size={16}/></div>
              <div>
                <h3>{totalDogs}</h3><p>Total dogs</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="icon-box orange"><Heart size={16}/></div>
              <div>
                <h3>{availableDogs}</h3><p>Available</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="icon-box green"><Home size={16}/></div>
              <div>
                <h3>0</h3><p>In foster</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="icon-box red"><Activity size={16}/></div>
              <div>
                <h3>0</h3><p>In quarantine</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
