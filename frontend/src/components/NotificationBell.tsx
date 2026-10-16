'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Bell, CheckCheck, Clock, ClipboardList, Syringe, ChevronRight, X, HeartPulse } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'solicitud' | 'medica';
  title: string;
  description: string;
  timeAgo: string;
  timestamp: number;
  link: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load read notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('huellitas_read_notifications');
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error reading localStorage for notifications', e);
    }
  }, []);

  // Fetch real alerts from Supabase
  const fetchNotifications = async () => {
    try {
      const items: NotificationItem[] = [];

      // 1. Pending adoption requests
      const { data: reqs } = await supabase
        .from('adoption_requests')
        .select(`
          id,
          status,
          created_at,
          dogs ( name ),
          profiles ( full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reqs) {
        reqs.forEach((r: any) => {
          const dogName = r.dogs?.name || 'Perrito';
          const userName = r.profiles?.full_name || 'Un adoptante';
          const time = new Date(r.created_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          });

          items.push({
            id: `req-${r.id}`,
            type: 'solicitud',
            title: r.status === 'pending' ? 'Nueva Solicitud de Adopción' : `Solicitud en fase ${r.status}`,
            description: `${userName} solicitó adoptar a ${dogName}.`,
            timeAgo: time,
            timestamp: new Date(r.created_at).getTime(),
            link: '/solicitudes'
          });
        });
      }

      // 2. Pending or upcoming medical records
      const { data: meds } = await supabase
        .from('medical_records')
        .select(`
          id,
          treatment_type,
          description,
          due_date,
          status,
          dogs ( name )
        `)
        .order('due_date', { ascending: true })
        .limit(5);

      if (meds) {
        meds.forEach((m: any) => {
          const dogName = m.dogs?.name || 'Perrito';
          const time = m.due_date ? new Date(m.due_date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
          }) : 'Próxima';

          items.push({
            id: `med-${m.id}`,
            type: 'medica',
            title: `Cita Médica: ${m.treatment_type || 'Tratamiento'}`,
            description: `${dogName}: ${m.description || 'Revisión veterinaria programada.'}`,
            timeAgo: `Fecha: ${time}`,
            timestamp: m.due_date ? new Date(m.due_date).getTime() : Date.now(),
            link: '/health'
          });
        });
      }

      // Sort newest first
      items.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(items);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to click outside to close dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem('huellitas_read_notifications', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      // Mark as read when opening so the red badge clears
      markAllAsRead();
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      try {
        localStorage.setItem('huellitas_read_notifications', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setIsOpen(false);
    router.push(item.link);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* BELL TRIGGER BUTTON */}
      <button
        onClick={handleToggle}
        aria-label="Notificaciones"
        style={{
          position: 'relative',
          background: isOpen ? '#f1f5f9' : 'transparent',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: isOpen ? 'var(--primary-orange)' : 'var(--text-dark)'
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: 'var(--urgent-red, #ef4444)',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              boxShadow: '0 0 0 2px white'
            }}
          />
        )}
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '360px',
            maxHeight: '480px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fafbfc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="var(--primary-orange)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                Alertas y Notificaciones
              </span>
            </div>
            <button
              onClick={markAllAsRead}
              title="Marcar todas como leídas"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <CheckCheck size={14} color="#10b981" /> Leídas
            </button>
          </div>

          {/* LIST OF NOTIFICATIONS */}
          <div style={{ overflowY: 'auto', maxHeight: '350px', padding: '0.5rem 0' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Cargando alertas...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto',
                    color: '#94a3b8'
                  }}
                >
                  <Bell size={22} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                  ¡Todo al día!
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  No tienes nuevas solicitudes ni pendientes médicos.
                </div>
              </div>
            ) : (
              notifications.map(item => {
                const isRead = readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f8fafc',
                      backgroundColor: isRead ? 'transparent' : 'rgba(255, 107, 53, 0.04)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = isRead ? 'transparent' : 'rgba(255, 107, 53, 0.04)')}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: item.type === 'solicitud' ? 'var(--primary-orange-light, #ffedd5)' : '#e0e7ff',
                        color: item.type === 'solicitud' ? 'var(--primary-orange, #ea580c)' : '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {item.type === 'solicitud' ? <ClipboardList size={16} /> : <Syringe size={16} />}
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div
                          style={{
                            fontWeight: isRead ? 600 : 700,
                            fontSize: '0.85rem',
                            color: '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.title}
                        </div>
                        {!isRead && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-orange)',
                              flexShrink: 0,
                              marginLeft: '6px'
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#475569',
                          marginTop: '2px',
                          lineHeight: '1.3'
                        }}
                      >
                        {item.description}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#94a3b8',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Clock size={11} /> {item.timeAgo}
                      </div>
                    </div>
                    <ChevronRight size={14} color="#cbd5e1" style={{ alignSelf: 'center', flexShrink: 0 }} />
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              backgroundColor: '#fafbfc'
            }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/solicitudes');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-orange)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Ver tablero de solicitudes →
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInPop {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
