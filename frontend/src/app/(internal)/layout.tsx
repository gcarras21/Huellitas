'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LayoutDashboard, Dog, ClipboardList, Home, HeartPulse, Calendar, BarChart2, FileText, Settings, HelpCircle, Send, LogOut, Users, X, Bot, Globe, Sparkles, Menu } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aiDogs, setAiDogs] = useState<any[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic user profile state
  const [currentUser, setCurrentUser] = useState({
    name: 'Usuario',
    role: 'Staff',
    initials: 'U',
  });

  // AI Assistant chat state
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    { role: 'ai', text: '¡Hola! Soy Huellitas AI para el equipo. Puedo ayudarte con dudas sobre perritos en adopción, estado de salud o solicitudes.' }
  ]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push('/login');
  };

  const handleAiSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;
    const userText = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (data.reply) {
        setAiMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      } else {
        setAiMessages(prev => [...prev, { role: 'ai', text: 'No pude obtener una respuesta en este momento.' }]);
      }
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'ai', text: 'Ups, ocurrió un error conectando con el servicio de IA.' }]);
    }
    setIsAiLoading(false);
  };

  const renderAiInternalMessage = (content: string) => {
    const parts = content.split(/(\[\s*DOG_CARD:\s*[^\]]+?\s*\])/gi);
    return parts.map((part, index) => {
      const match = part.match(/^\[\s*DOG_CARD:\s*([^\]]+?)\s*\]$/i);
      if (match) {
        const rawDogName = match[1].trim().replace(/[.,;:!]+$/, '').toLowerCase();
        const dog = aiDogs.find(d => {
          const dName = (d.name || '').trim().toLowerCase();
          return dName === rawDogName || dName.includes(rawDogName) || rawDogName.includes(dName);
        });

        if (dog) {
          return (
            <div key={index} style={{
              marginTop: '10px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              overflow: 'hidden',
              backgroundColor: 'white',
              maxWidth: '220px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <img 
                src={dog.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop"} 
                alt={dog.name} 
                style={{ width: '100%', height: '120px', objectFit: 'cover' }} 
              />
              <div style={{ padding: '8px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{dog.name.trim()}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>{dog.breed || 'Mestizo'}</div>
                <Link 
                  href="/perros" 
                  style={{
                    display: 'block',
                    backgroundColor: 'var(--primary-orange-light)',
                    color: 'var(--primary-orange)',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                >
                  Ver en catálogo
                </Link>
              </div>
            </div>
          );
        }
        return null;
      }

      if (!part) return null;

      return (
        <span 
          key={index}
          dangerouslySetInnerHTML={{ 
            __html: part
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>') 
          }} 
        />
      );
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      
      supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single().then(({data}) => {
        const staffRoles = ['admin', 'supervisor', 'staff', 'employee'];
        if (!data || !staffRoles.includes(data.role)) {
          router.push('/mi-cuenta');
          return;
        }

        const roleLabels: Record<string, string> = {
          admin: 'Administrador',
          supervisor: 'Supervisor',
          staff: 'Staff Operativo',
          employee: 'Personal Staff',
        };
        const name = data.full_name || session.user.email?.split('@')[0] || 'Usuario';
        const initials = name
          .split(' ')
          .filter(Boolean)
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'U';

        setCurrentUser({
          name,
          role: roleLabels[data.role] || 'Staff',
          initials,
        });
      });
    });

    // Fetch dogs to show in the AI panel dynamically
    supabase.from('dogs').select('*').then(({ data }) => {
      if (data) setAiDogs(data);
    });
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Perros', icon: Dog, href: '/perros' },
    { name: 'Solicitudes', icon: ClipboardList, href: '/solicitudes' },
    { name: 'Hogares Temporales', icon: Home, href: '/foster' },
    { name: 'Salud', icon: HeartPulse, href: '/health' },
    { name: 'Seguimiento', icon: FileText, href: '/seguimiento' },
    { name: 'Eventos', icon: Calendar, href: '/events' },
    { name: 'Reportes', icon: BarChart2, href: '/reports' },
    { name: 'Personal', icon: Users, href: '/usuarios' },
    { name: 'Métricas IA', icon: Sparkles, href: '/ai-metrics' },
  ];

  return (
    <div className="master-layout">
      {/* --- MOBILE TOP BAR --- */}
      <div className="mobile-top-bar">
        <button onClick={() => setIsMobileMenuOpen(true)} style={{background:'none', border:'none', color:'var(--text-dark)', display:'flex'}}>
          <Menu size={24} />
        </button>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Dog size={24} color="var(--primary-orange)" />
          <span>Huellitas</span>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <Dog size={28} color="var(--primary-orange)" />
          <div>
            <span>Huellitas</span> AI
            <div style={{fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400}}>Plataforma de Rescate</div>
          </div>
        </div>
        
        <nav className="nav-links">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
            return (
              <Link key={item.name} href={item.href} onClick={closeMobileMenu} className={`nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div style={{marginTop: '2rem'}}>
          <div style={{fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', padding: '0 1rem'}}>Cambiar de Portal</div>
          <Link href="/" className="nav-item" style={{color: '#10b981', fontWeight: 600}}>
            <Globe size={18}/> Portal Público
          </Link>
          <Link href="/mi-cuenta" className="nav-item" style={{color: 'var(--primary-orange)', fontWeight: 600}}>
            <Users size={18}/> Portal de Adoptante
          </Link>
          <Link href="/settings" className="nav-item" style={{marginTop: '1rem'}}><Settings size={18}/> Configuración</Link>
          <div className="nav-item"><HelpCircle size={18}/> ¿Necesitas ayuda?</div>
        </div>

        <div className="user-profile" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0}}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-orange-light)',
              color: 'var(--primary-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: '2px solid #fed7aa',
              flexShrink: 0,
            }}>
              {currentUser.initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', flexShrink: 0}} title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <main className="main-content">
        {/* Global Staff Header with Date, Notification Bell, and AI Trigger */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1.25rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Panel Staff &gt;</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
              {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="tool-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#fff', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '8px' }}>
              <Calendar size={15} color="var(--primary-orange)" />
              <span style={{ textTransform: 'capitalize' }}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <NotificationBell />

            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isAiOpen ? 'var(--primary-orange)' : 'var(--primary-orange-light)',
                color: isAiOpen ? 'white' : 'var(--primary-orange)',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Bot size={16} /> Huellitas AI
            </button>
          </div>
        </div>

        {children}
      </main>

      {/* --- RIGHT AI PANEL --- */}
      <aside className={`ai-panel ${isAiOpen ? 'open' : ''}`}>
        <div className="ai-header">
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div className="ai-header-icon"><Bot size={20} /></div>
            <div className="ai-header-info">
              <h3>Huellitas AI</h3>
              <p><span className="status-dot"></span> En línea</p>
            </div>
          </div>
          <button className="ai-close-btn" onClick={() => setIsAiOpen(false)}><X size={20}/></button>
        </div>
        
        <div className="ai-chat-area">
          {aiMessages.map((msg, index) => (
            <div key={index} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'ai' ? renderAiInternalMessage(msg.text) : msg.text}
              
              {/* Show mini dog cards only on the first welcome message if available */}
              {index === 0 && aiDogs.length > 0 && (
                <div style={{display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px'}}>
                  {aiDogs.slice(0, 3).map(dog => (
                    <div key={dog.id} style={{minWidth: '110px', border: '1px solid #eee', borderRadius: '8px', padding: '8px', backgroundColor: '#fff'}}>
                      {dog.photo_url ? (
                        <img src={dog.photo_url} alt={dog.name} style={{width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px'}} />
                      ) : (
                        <div style={{width: '100%', height: '60px', backgroundColor: '#ddd', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Dog size={16} color="#aaa"/></div>
                      )}
                      <div style={{fontSize: '0.8rem', fontWeight: 600}}>{dog.name}</div>
                      <div style={{fontSize: '0.65rem', color: '#777'}}>{dog.age_months ? `${dog.age_months} meses` : 'Edad desconocida'}<br/>{dog.temperament || 'Dócil'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isAiLoading && (
            <div className="chat-bubble ai" style={{fontStyle: 'italic', color: 'var(--text-muted)'}}>
              Huellitas AI está consultando la información...
            </div>
          )}
        </div>

        <div className="ai-input-area">
          <form onSubmit={handleAiSend} className="ai-input-wrapper">
            <input 
              type="text" 
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Pregunta algo sobre los perros..." 
              disabled={isAiLoading}
            />
            <button type="submit" disabled={isAiLoading} title="Enviar pregunta">
              <Send size={16} />
            </button>
          </form>
        </div>
      </aside>

      {/* Floating AI Button when closed */}
      {!isAiOpen && (
        <button className="ai-toggle-btn" onClick={() => setIsAiOpen(true)} title="Abrir Asistente IA">
          <Bot size={24} />
        </button>
      )}
    </div>
  );
}
