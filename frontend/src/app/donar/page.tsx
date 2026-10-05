import React from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck } from 'lucide-react';

export default function DonarPage() {
  return (
    <div style={{minHeight: '100vh', backgroundColor: '#fffcfb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif'}}>
      <div style={{maxWidth: '600px', width: '100%', padding: '2rem', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center'}}>
        
        <div style={{width: 80, height: 80, backgroundColor: 'var(--primary-orange-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary-orange)'}}>
          <Heart size={40} fill="currentColor"/>
        </div>
        
        <h1 style={{fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '1rem'}}>Ayúdanos a seguir salvando vidas</h1>
        <p style={{fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem'}}>
          Tu donación nos permite rescatar, rehabilitar y mantener a más perritos mientras nuestra Inteligencia Artificial les encuentra su familia ideal.
        </p>

        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem'}}>
          <button style={{flex: 1, padding: '1.5rem', backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer'}}>$200</button>
          <button style={{flex: 1, padding: '1.5rem', backgroundColor: '#fff5f0', border: '2px solid var(--primary-orange)', borderRadius: '16px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-orange)', cursor: 'pointer'}}>$500</button>
          <button style={{flex: 1, padding: '1.5rem', backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer'}}>$1000</button>
        </div>

        <button style={{width: '100%', padding: '1.25rem', backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)', marginBottom: '1.5rem'}} onClick={() => alert("¡Próximamente! Aquí se abrirá el Checkout de Stripe.")}>
          Donar a través de Stripe <ShieldCheck size={20}/>
        </button>
        
        <p style={{fontSize: '0.85rem', color: '#94a3b8'}}>Pagos 100% seguros procesados por Stripe. Puedes cancelar donaciones recurrentes en cualquier momento.</p>
        
        <div style={{marginTop: '2rem'}}>
          <Link href="/" style={{color: 'var(--primary-orange)', fontWeight: 600, textDecoration: 'none'}}>Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
