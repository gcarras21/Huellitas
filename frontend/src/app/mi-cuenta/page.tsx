'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ClipboardList, Settings, LogOut, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ClientPortalLayout() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Outfit', sans-serif"}}>
      {/* Sidebar de Cliente */}
      <aside style={{width: '260px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '1.5rem'}}>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '2.5rem'}}>
          <div style={{color: 'var(--primary-orange)'}}>Huellitas</div>
          <div style={{fontSize: '0.8rem', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#64748b'}}>Adoptante</div>
        </div>

        <nav style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1}}>
          <div style={{padding: '0.8rem 1rem', borderRadius: '8px', backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <Home size={18}/> Mi Inicio
          </div>
          <div style={{padding: '0.8rem 1rem', borderRadius: '8px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <ClipboardList size={18}/> Mis Solicitudes
          </div>
          <div style={{padding: '0.8rem 1rem', borderRadius: '8px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
            <Settings size={18}/> Mi Perfil
          </div>
        </nav>

        {/* Switcher para Admin (Renderizado condicional en el futuro) */}
        <div style={{marginTop: 'auto', marginBottom: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem'}}>
          <div style={{fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem'}}>Modo Administrador</div>
          
          <Link href="/dashboard" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', backgroundColor: '#eff6ff', borderRadius: '6px', marginBottom: '8px'}}>
            <ArrowLeftRight size={14}/> Ir al Portal Interno
          </Link>
          <Link href="/" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', backgroundColor: '#ecfdf5', borderRadius: '6px'}}>
            <ArrowLeftRight size={14}/> Ir al Portal Público
          </Link>
        </div>

        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#cbd5e1'}}></div>
            <div style={{fontSize: '0.9rem', fontWeight: 600}}>Usuario</div>
          </div>
          <button onClick={handleLogout} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}}><LogOut size={18}/></button>
        </div>

      </aside>

      {/* Main Content */}
      <main style={{flexGrow: 1, padding: '2.5rem', overflowY: 'auto'}}>
        <h1 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem'}}>Bienvenido a tu Portal</h1>
        <p style={{color: '#64748b'}}>Aquí podrás dar seguimiento a tus adopciones.</p>
        
        <div style={{marginTop: '3rem', padding: '3rem', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', color: '#94a3b8'}}>
          🚧 Portal en Construcción 🚧
        </div>
      </main>
    </div>
  );
}
