'use client';

import React from 'react';
import { Sparkles, BrainCircuit, Activity, Zap, Server, ShieldCheck, Cpu } from 'lucide-react';

export default function AiMetricsDashboard() {
  return (
    <>
      <div className="dashboard-header">
        <div>
          <h2>Inteligencia Artificial</h2>
          <p>Métricas en tiempo real del motor LLaMA 3.1 8B Instant</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* MODEL INFO */}
        <div className="bento-card col-span-2">
          <div className="bento-title"><BrainCircuit size={18}/> Arquitectura del Modelo</div>
          <div style={{display: 'flex', gap: '2rem', marginTop: '1rem'}}>
            <div style={{flex: 1, backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <h3 style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a'}}>LLaMA 3.1 (8B)</h3>
              <p style={{color: '#64748b', fontSize: '0.85rem', marginTop: '4px'}}>Meta Open Source Foundation</p>
              <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px'}}>
                  <span style={{color: '#475569', fontSize: '0.85rem'}}>Parámetros</span>
                  <span style={{fontWeight: 700, color: '#0f172a'}}>8 Billones</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px'}}>
                  <span style={{color: '#475569', fontSize: '0.85rem'}}>Ventana de Contexto</span>
                  <span style={{fontWeight: 700, color: '#0f172a'}}>131,072 Tokens</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: '#475569', fontSize: '0.85rem'}}>Arquitectura</span>
                  <span style={{fontWeight: 700, color: '#0f172a'}}>Transformer Optimizado</span>
                </div>
              </div>
            </div>
            
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem'}}>
               <div style={{backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{backgroundColor: '#3b82f6', color: 'white', padding: '10px', borderRadius: '8px'}}><Zap size={20}/></div>
                  <div>
                    <div style={{fontWeight: 700, color: '#1e3a8a'}}>Inferencia Ultra Rápida</div>
                    <div style={{fontSize: '0.8rem', color: '#1d4ed8'}}>Aceleración por hardware (Groq LPU)</div>
                  </div>
               </div>
               <div style={{backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{backgroundColor: '#22c55e', color: 'white', padding: '10px', borderRadius: '8px'}}><Server size={20}/></div>
                  <div>
                    <div style={{fontWeight: 700, color: '#14532d'}}>Backend Serverless</div>
                    <div style={{fontSize: '0.8rem', color: '#15803d'}}>Render Cloud + FastAPI Python</div>
                  </div>
               </div>
               <div style={{backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{backgroundColor: '#ef4444', color: 'white', padding: '10px', borderRadius: '8px'}}><ShieldCheck size={20}/></div>
                  <div>
                    <div style={{fontWeight: 700, color: '#7f1d1d'}}>Privacidad de Datos</div>
                    <div style={{fontSize: '0.8rem', color: '#b91c1c'}}>Conexión cifrada sin retención de logs</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* USAGE METRICS */}
        <div className="bento-card col-span-1">
          <div className="bento-title"><Activity size={18}/> Consumo de Tokens (Hoy)</div>
          
          <div style={{marginTop: '1.5rem', textAlign: 'center'}}>
            <div style={{position: 'relative', width: '150px', height: '150px', margin: '0 auto'}}>
              <svg viewBox="0 0 36 36" style={{width: '100%', height: '100%', transform: 'rotate(-90deg)'}}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary-orange)" strokeWidth="3" strokeDasharray="15, 100" />
              </svg>
              <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
                <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#0f172a'}}>15%</div>
                <div style={{fontSize: '0.65rem', color: '#64748b'}}>USO DIARIO</div>
              </div>
            </div>
          </div>

          <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{color: '#64748b', fontSize: '0.85rem'}}>Tokens Usados</span>
              <span style={{fontWeight: 700, color: '#0f172a'}}>15,420</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{color: '#64748b', fontSize: '0.85rem'}}>Límite Restante</span>
              <span style={{fontWeight: 700, color: '#10b981'}}>84,580</span>
            </div>
          </div>
        </div>

        {/* FINANCIAL SAVINGS */}
        <div className="bento-card col-span-3">
          <div className="bento-title"><Sparkles size={18}/> Ahorro Financiero vs GPT-4</div>
          <div className="stats-grid" style={{marginTop: '1.5rem'}}>
            <div className="stat-box" style={{backgroundColor: '#fff', border: '1px solid #e2e8f0'}}>
              <div className="icon-box" style={{backgroundColor: '#f1f5f9', color: '#475569'}}><Cpu size={16}/></div>
              <div>
                <h3 style={{color: '#0f172a'}}>$0.00 <span style={{fontSize: '0.8rem'}}>USD</span></h3>
                <p style={{color: '#64748b'}}>Costo Facturado (Groq)</p>
              </div>
            </div>
            <div className="stat-box" style={{backgroundColor: '#fff', border: '1px solid #e2e8f0'}}>
              <div className="icon-box" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}><Cpu size={16}/></div>
              <div>
                <h3 style={{color: '#0f172a'}}>$0.46 <span style={{fontSize: '0.8rem'}}>USD</span></h3>
                <p style={{color: '#64748b'}}>Costo Equivalente GPT-4</p>
              </div>
            </div>
            <div className="stat-box" style={{backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0'}}>
              <div className="icon-box green" style={{backgroundColor: '#16a34a', color: 'white'}}><Sparkles size={16}/></div>
              <div>
                <h3 style={{color: '#166534'}}>$0.46 <span style={{fontSize: '0.8rem'}}>USD</span></h3>
                <p style={{color: '#15803d'}}>Ahorro Neto Diario</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
