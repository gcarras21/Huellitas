'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileBarChart2 } from 'lucide-react';
import styles from './reports.module.css';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalDogs: 0,
    adoptedDogs: 0,
    pendingRequests: 0,
    totalUsers: 0
  });

  const [solicitudData, setSolicitudData] = useState<any[]>([]);
  const [sizeData, setSizeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. KPI Data
      const { count: cDogs } = await supabase.from('dogs').select('*', { count: 'exact', head: true });
      const { count: cAdopted } = await supabase.from('dogs').select('*', { count: 'exact', head: true }).eq('status', 'adopted');
      const { count: cPending } = await supabase.from('adoption_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: cUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      setStats({
        totalDogs: cDogs || 0,
        adoptedDogs: cAdopted || 0,
        pendingRequests: cPending || 0,
        totalUsers: cUsers || 0
      });

      // 2. Chart: Requests by Status
      const { data: requests } = await supabase.from('adoption_requests').select('status');
      if (requests) {
        const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
        requests.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);
        setSolicitudData([
          { name: 'Pendientes', value: counts.pending },
          { name: 'Aprobadas', value: counts.approved },
          { name: 'Rechazadas', value: counts.rejected }
        ]);
      }

      // 3. Chart: Dogs by Size
      const { data: dogs } = await supabase.from('dogs').select('size');
      if (dogs) {
        const counts: Record<string, number> = { Pequeño: 0, Mediano: 0, Grande: 0 };
        dogs.forEach(d => {
          if (counts[d.size] !== undefined) counts[d.size]++;
          else counts[d.size] = 1;
        });
        setSizeData([
          { name: 'Pequeños', value: counts['Pequeño'] || 0 },
          { name: 'Medianos', value: counts['Mediano'] || 0 },
          { name: 'Grandes', value: counts['Grande'] || 0 }
        ]);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const COLORS = ['#ff7a00', '#52c41a', '#f5222d'];
  const SIZE_COLORS = ['#ffc53d', '#ff7a00', '#d4380d'];

  return (
    <div className={styles.container}>
      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem'}}>
        <div style={{background: 'var(--primary-orange-light)', padding: '12px', borderRadius: '12px', color: 'var(--primary-orange)'}}>
          <FileBarChart2 size={28} />
        </div>
        <div>
          <h1 className="page-title" style={{marginBottom: 0}}>Reportes y Estadísticas</h1>
          <p className="page-subtitle">Visualiza el impacto de la fundación en tiempo real.</p>
        </div>
      </div>

      {loading ? (
        <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>Calculando métricas...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>Total Perros en Sistema</div>
              <div className={styles.kpiValue}>{stats.totalDogs}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>Perros Adoptados</div>
              <div className={styles.kpiValue} style={{color: 'var(--success-green)'}}>{stats.adoptedDogs}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>Solicitudes Pendientes</div>
              <div className={styles.kpiValue} style={{color: 'var(--primary-orange)'}}>{stats.pendingRequests}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTitle}>Usuarios (Comunidad)</div>
              <div className={styles.kpiValue}>{stats.totalUsers}</div>
            </div>
          </div>

          {/* Charts */}
          <div className={styles.chartsGrid}>
            
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Estado de Solicitudes</div>
              <div style={{width: '100%', height: '300px'}}>
                <ResponsiveContainer>
                  <BarChart data={solicitudData} margin={{top: 20, right: 30, left: 0, bottom: 5}}>
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {solicitudData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Distribución por Tamaño</div>
              <div style={{width: '100%', height: '300px'}}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={sizeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sizeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SIZE_COLORS[index % SIZE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
