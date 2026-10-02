'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LayoutDashboard, Dog, ClipboardList, Home, HeartPulse, Calendar, BarChart2, FileText, Settings, HelpCircle, Send, LogOut, Users, X, Bot, Globe } from 'lucide-react';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aiDogs, setAiDogs] = useState<any[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    // Fetch a couple of dogs to show in the AI panel dynamically
    supabase.from('dogs').select('*').limit(2).then(({ data }) => {
      if (data) setAiDogs(data);
    });
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Dogs', icon: Dog, href: '/perros' },
    { name: 'Adoption Applications', icon: ClipboardList, href: '/solicitudes' },
    { name: 'Foster Homes', icon: Home, href: '/foster' },
    { name: 'Health & Medical', icon: HeartPulse, href: '/health' },
    { name: 'Events', icon: Calendar, href: '/events' },
    { name: 'Reports', icon: BarChart2, href: '/reports' },
    { name: 'Documents', icon: FileText, href: '/documents' },
    { name: 'Staff', icon: Users, href: '/usuarios' },
  ];

  return (
    <div className="master-layout">
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="brand">
          <Dog size={28} color="var(--primary-orange)" />
          <div>
            <span>Huellitas</span> AI
            <div style={{fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400}}>Rescue Platform</div>
          </div>
        </div>
        
        <nav className="nav-links">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
            return (
              <Link key={item.name} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div style={{marginTop: '2rem'}}>
          <Link href="/" className="nav-item" style={{color: 'var(--primary-orange)', fontWeight: 600}}>
            <Globe size={18}/> Ver Portal Público
          </Link>
          <div className="nav-item"><Settings size={18}/> Settings</div>
          <div className="nav-item"><HelpCircle size={18}/> Need help?</div>
        </div>

        <div className="user-profile" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <img className="avatar" src="https://i.pravatar.cc/150?img=11" alt="Gabriel" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Gabriel</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Administrator</div>
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
              <p><span className="status-dot"></span> Online</p>
            </div>
          </div>
          <button className="ai-close-btn" onClick={() => setIsAiOpen(false)}><X size={20}/></button>
        </div>
        
        <div className="ai-chat-area">
          <div className="chat-bubble user">
            Which dogs are available for adoption and are good with children?
          </div>
          
          <div className="chat-bubble ai">
            Based on the information in the platform, here are the dogs that could be a good match for families with children:
            
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
            What vaccines does {aiDogs[0]?.name || 'Luna'} need and when?
          </div>
          <div className="chat-bubble ai">
            {aiDogs[0]?.name || 'Luna'} has the following pending vaccines:
            <ul style={{margin: '8px 0 8px 16px', fontSize: '0.85rem'}}>
              <li><strong style={{color: 'var(--urgent-red)'}}>Rabies vaccine</strong> - due today</li>
              <li><strong style={{color: 'var(--primary-orange)'}}>DHPP booster</strong> - due in 2 weeks</li>
            </ul>
            Would you like me to add this to your task list?
          </div>
        </div>

        <div className="ai-input-area">
          <div className="ai-input-wrapper">
            <input type="text" placeholder="Ask anything about dogs..." />
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
