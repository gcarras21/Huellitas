'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LayoutDashboard, Dog, ClipboardList, Home, HeartPulse, Calendar, BarChart2, FileText, Settings, HelpCircle, Send, LogOut, Users, X, Bot, Globe, Sparkles, Menu } from 'lucide-react';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aiDogs, setAiDogs] = useState<any[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      
      supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({data}) => {
        if (data && data.role === 'adoptante') {
          router.push('/mi-cuenta');
        }
      });
    });

    // Fetch a couple of dogs to show in the AI panel dynamically
    supabase.from('dogs').select('*').limit(2).then(({ data }) => {
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
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <img className="avatar" src="https://i.pravatar.cc/150?img=11" alt="Gabriel" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Gabriel</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Administrador</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px'}} title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <main className="main-content">
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
          <div className="chat-bubble user">
            ¿Qué perros están disponibles para adopción y son buenos con los niños?
          </div>
          
          <div className="chat-bubble ai">
            Basado en la información de la plataforma, aquí hay perros que podrían ser ideales para familias con niños:
            
            {/* Dynamic Mini cards inside chat */}
            <div style={{display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px'}}>
              {aiDogs.length === 0 ? (
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>No hay perros registrados aún para recomendar.</div>
              ) : (
                aiDogs.map(dog => (
                  <div key={dog.id} style={{minWidth: '110px', border: '1px solid #eee', borderRadius: '8px', padding: '8px', backgroundColor: '#fff'}}>
                    {dog.photo_url ? (
                      <img src={dog.photo_url} style={{width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px'}} />
                    ) : (
                      <div style={{width: '100%', height: '60px', backgroundColor: '#ddd', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Dog size={16} color="#aaa"/></div>
                    )}
                    <div style={{fontSize: '0.8rem', fontWeight: 600}}>{dog.name}</div>
                    <div style={{fontSize: '0.65rem', color: '#777'}}>{dog.age_months ? `${dog.age_months} meses` : 'Edad desconcida'}<br/>{dog.temperament || 'Calm'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="chat-bubble user">
            ¿Qué vacunas necesita {aiDogs[0]?.name || 'Luna'} y cuándo?
          </div>
          <div className="chat-bubble ai">
            {aiDogs[0]?.name || 'Luna'} tiene las siguientes vacunas pendientes:
            <ul style={{margin: '8px 0 8px 16px', fontSize: '0.85rem'}}>
              <li><strong style={{color: 'var(--urgent-red)'}}>Vacuna contra la rabia</strong> - hoy</li>
              <li><strong style={{color: 'var(--primary-orange)'}}>Refuerzo DHPP</strong> - en 2 semanas</li>
            </ul>
            ¿Quieres que lo agregue a tus tareas?
          </div>
        </div>

        <div className="ai-input-area">
          <div className="ai-input-wrapper">
            <input type="text" placeholder="Pregunta algo sobre los perros..." />
            <button><Send size={16} /></button>
          </div>
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
