'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FileUp, Sparkles, Dog, CheckCircle2, Circle, Clock, Home, Settings, LogOut, ArrowLeftRight, Bot, Send, Menu, X, Heart, Edit3 } from 'lucide-react';
import styles from './mi-cuenta.module.css';
import matchStyles from './match.module.css';
import SwipeCard from '@/components/SwipeCard';

export default function ClientDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [userName, setUserName] = useState('Adoptante');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [allDogs, setAllDogs] = useState<any[]>([]);
  const [matchDogs, setMatchDogs] = useState<any[]>([]);
  const [favoriteDogs, setFavoriteDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View State
  const [currentView, setCurrentView] = useState('inicio'); // inicio, chat, catalog, profile, match, favorites
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    {role: 'ai', content: '¡Hola! Soy Huellitas AI, tu asistente experto en adopciones. Cuéntame, ¿qué tipo de perrito estás buscando o cómo es tu estilo de vida?'}
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if(!inputMessage.trim()) return;
    const userMsg = inputMessage.trim();
    setMessages(prev => [...prev, {role: 'user', content: userMsg}]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      setMessages(prev => [...prev, {role: 'ai', content: data.reply}]);
    } catch (err) {
      setMessages(prev => [...prev, {role: 'ai', content: 'Ups, tuve un problema conectándome con mi cerebro (Backend). Asegúrate de que el servidor esté corriendo.'}]);
    }
    setIsTyping(false);
  };

  const loadAIRecommendations = async (userId: string) => {
    try {
      const { data: prefs } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single();
      const { data: favs } = await supabase.from('user_favorites').select('dog_id').eq('user_id', userId);
      const fav_dog_ids = favs ? favs.map(f => f.dog_id) : [];

      const matchResponse = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, prefs: prefs || {}, fav_dog_ids })
      });
      const matchData = await matchResponse.json();
      if (matchData.matches) setMatchDogs(matchData.matches);
    } catch (err) {
      console.error("Error fetching match", err);
    }
  };

  useEffect(() => {
    async function loadClientData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setSession(session);

      // Verify Onboarding
      const { data: prefs } = await supabase.from('user_preferences').select('*').eq('user_id', session.user.id).single();
      if (!prefs) {
        router.push('/mi-cuenta/onboarding');
        return;
      }
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setUserName(profile.full_name?.split(' ')[0] || 'Adoptante');
        setFullNameInput(profile.full_name || '');
      }
      setUserEmail(session.user.email || '');

      // Fetch adoption requests
      const { data: reqs } = await supabase.from('adoption_requests')
        .select('*, dogs(name, photo_url)')
        .eq('client_id', session.user.id);
      if (reqs) setMyRequests(reqs);

      // Fetch all dogs
      const { data: dogs } = await supabase.from('dogs').select('*');
      if (dogs) setAllDogs(dogs);

      // Fetch favorites
      const { data: favs } = await supabase.from('user_favorites').select('id, dog_id, dogs(*)').eq('user_id', session.user.id);
      if (favs) setFavoriteDogs(favs);

      // Fetch AI Match
      await loadAIRecommendations(session.user.id);
      
      setLoading(false);
    }
    
    loadClientData();
  }, [router]);

  const handleSwipe = async (direction: 'left' | 'right', dogId: string) => {
    if (direction === 'right') {
      await supabase.from('user_favorites').insert({ user_id: session.user.id, dog_id: dogId });
      const favDog = matchDogs.find(d => d.id === dogId);
      if (favDog) setFavoriteDogs(prev => [...prev, { dog_id: dogId, dogs: favDog }]);
    }
    
    setTimeout(() => {
      setMatchDogs(prev => prev.filter(d => d.id !== dogId));
    }, 300);
  };

  const removeFavorite = async (favId: string, dogId: string) => {
    await supabase.from('user_favorites').delete().eq('user_id', session.user.id).eq('dog_id', dogId);
    setFavoriteDogs(prev => prev.filter(f => f.dogs.id !== dogId));
    // After removing from favorites, it could appear in match again if we reload
    loadAIRecommendations(session.user.id);
  };

  const requestAdoption = async (dogId: string) => {
    const existing = myRequests.find(r => r.dog_id === dogId);
    if (existing) {
        alert("Ya tienes una solicitud activa para este perrito.");
        return;
    }

    const { data, error } = await supabase.from('adoption_requests').insert({
        client_id: session.user.id,
        dog_id: dogId,
        status: 'pending'
    }).select('*, dogs(name, photo_url)').single();

    if (error) {
        alert("Hubo un error al enviar tu solicitud.");
        console.error(error);
        return;
    }

    setMyRequests(prev => [data, ...prev]);
    alert("¡Solicitud de adopción enviada con éxito! Nos pondremos en contacto contigo pronto.");
    switchView('inicio');
  };

  const renderChatMessage = (content: string) => {
    const parts = content.split(/(\[DOG_CARD:.*?\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[DOG_CARD:') && part.endsWith(']')) {
        const dogNameMatch = part.match(/\[DOG_CARD:\s*(.*?)\]/);
        if (dogNameMatch) {
          const dogName = dogNameMatch[1].trim();
          const dog = allDogs.find(d => d.name.toLowerCase() === dogName.toLowerCase());
          if (dog) {
            return (
              <div key={index} style={{marginTop: '1rem', marginBottom: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', maxWidth: '240px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
                <img src={dog.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop"} alt={dog.name} style={{width: '100%', height: '180px', objectFit: 'cover'}} />
                <div style={{padding: '1rem', textAlign: 'center'}}>
                  <h4 style={{margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem'}}>{dog.name}</h4>
                  <button onClick={() => alert(`${dog.name} es ${dog.temperament}.\nEnergía: ${dog.energy_level}\nTamaño: ${dog.size}\nAdecuado para niños: ${dog.good_with_kids ? 'Sí' : 'No'}`)} style={{backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', width: '100%', transition: 'background-color 0.2s'}}>
                    Ver más información
                  </button>
                </div>
              </div>
            );
          }
        }
        return null;
      }
      
      return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} style={{display: 'inline-block'}} />;
    });
  };

  const getStepProgress = (status: string) => {
    if (status === 'pending') return 1;
    if (status === 'interview') return 2;
    if (status === 'approved') return 4;
    if (status === 'rejected') return -1;
    return 1;
  };

  const updateProfile = async () => {
    if (!session) return;
    await supabase.from('profiles').update({ full_name: fullNameInput }).eq('id', session.user.id);
    setUserName(fullNameInput.split(' ')[0]);
    if (newPassword.trim().length > 0) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        alert('Error al actualizar contraseña: ' + error.message);
        return;
      }
      setNewPassword('');
    }
    alert('Perfil actualizado con éxito');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const switchView = (view: string) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const navItemStyle = (viewName: string) => ({
    padding: '0.8rem 1rem', 
    borderRadius: '8px', 
    backgroundColor: currentView === viewName ? 'var(--primary-orange-light)' : 'transparent', 
    color: currentView === viewName ? 'var(--primary-orange)' : '#64748b', 
    fontWeight: currentView === viewName ? 600 : 500, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    cursor: 'pointer'
  });

  return (
    <div className={styles.container}>
      {/* --- SIDEBAR --- */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        <button className={styles.closeSidebarBtn} onClick={() => setIsMobileMenuOpen(false)}>
          <X size={24} />
        </button>

        <div style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '2.5rem'}}>
          <Dog size={24} color="var(--primary-orange)" />
          <div>
            <span>Huellitas</span>
            <div style={{fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#64748b', display: 'inline-block', marginLeft: '6px'}}>Adoptante</div>
          </div>
        </div>

        <nav style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1}}>
          <div onClick={() => switchView('inicio')} style={navItemStyle('inicio')}>
            <Home size={18}/> Mi Inicio
          </div>
          <div onClick={() => switchView('match')} style={navItemStyle('match')}>
            <Sparkles size={18}/> Huellita Match AI
          </div>
          <div onClick={() => switchView('favorites')} style={navItemStyle('favorites')}>
            <Heart size={18}/> Mis Favoritos
          </div>
          <div onClick={() => switchView('catalog')} style={navItemStyle('catalog')}>
            <Dog size={18}/> Catálogo Completo
          </div>
          <div onClick={() => switchView('chat')} style={navItemStyle('chat')}>
            <Bot size={18}/> Asistente Chatbot
          </div>
          <div onClick={() => switchView('profile')} style={navItemStyle('profile')}>
            <Settings size={18}/> Configuración
          </div>
        </nav>

        {/* Switcher para Admin */}
        <div style={{marginTop: 'auto', marginBottom: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem'}}>
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
            <div style={{width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700}}>
              {userName.charAt(0)}
            </div>
            <div style={{fontSize: '0.9rem', fontWeight: 600, color: '#334155'}}>{userName}</div>
          </div>
          <button onClick={handleLogout} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'}} title="Cerrar Sesión"><LogOut size={18}/></button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={styles.main}>
        <button className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} /> Menú
        </button>
        
        <h1 style={{fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem'}}>¡Hola, {userName}! 👋</h1>
        <p style={{color: '#64748b', marginBottom: '2.5rem'}}>
          {currentView === 'inicio' ? 'Este es el centro de control de tu proceso de adopción.' : 
           currentView === 'match' ? 'Desliza a la derecha para dar Like, a la izquierda para descartar.' : 
           currentView === 'favorites' ? 'Tus perritos guardados listos para que los adoptes.' : 
           'Explora, adopta y da amor.'}
        </p>

        {/* --- INICIO VIEW --- */}
        {currentView === 'inicio' && (
          <div className={styles.grid}>
            {/* TRACKER DE ADOPCIÓN */}
            <div>
              <h2 style={{fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '1rem'}}>Tus Solicitudes</h2>
              {loading ? (
                <div style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>Cargando...</div>
              ) : myRequests.length === 0 ? (
                <div style={{border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '3rem', textAlign: 'center', backgroundColor: '#fff'}}>
                  <Dog size={32} color="#94a3b8" style={{margin: '0 auto', marginBottom: '1rem'}} />
                  <p style={{color: '#64748b', marginBottom: '1rem'}}>Aún no tienes solicitudes de adopción activas.</p>
                  <button onClick={() => switchView('match')} style={{backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, color: '#475569', cursor: 'pointer'}}>Conocer Perritos</button>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {myRequests.map(req => {
                    const step = getStepProgress(req.status);
                    return (
                      <div key={req.id} style={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.5rem'}}>
                          {req.dogs?.photo_url ? (
                            <img src={req.dogs.photo_url} alt={req.dogs.name} style={{width: 60, height: 60, borderRadius: '50%', objectFit: 'cover'}} />
                          ) : (
                            <div style={{width: 60, height: 60, borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Dog color="#94a3b8"/></div>
                          )}
                          <div>
                            <h4 style={{fontSize: '1.1rem', fontWeight: 700}}>{req.dogs?.name || 'Perrito'}</h4>
                            <p style={{fontSize: '0.85rem', color: '#64748b'}}>Solicitud {new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                          
                          {step === -1 && <span style={{marginLeft: 'auto', backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700}}>RECHAZADA</span>}
                          {step === 4 && <span style={{marginLeft: 'auto', backgroundColor: '#dcfce7', color: '#22c55e', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700}}>¡APROBADA!</span>}
                        </div>

                        {step !== -1 && (
                          <div style={{display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '1rem', padding: '0 10px'}}>
                            <div style={{position: 'absolute', top: '12px', left: '30px', right: '30px', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0}}></div>
                            <div style={{position: 'absolute', top: '12px', left: '30px', width: `calc(${((step - 1) / 3) * 100}% - 40px)`, height: '2px', backgroundColor: '#10b981', zIndex: 0, transition: 'width 0.5s ease'}}></div>
                            
                            {[{ num: 1, label: 'Recibida' }, { num: 2, label: 'Revisión' }, { num: 3, label: 'Entrevista' }, { num: 4, label: 'Aprobada' }].map((s) => (
                              <div key={s.num} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1}}>
                                <div style={{backgroundColor: step >= s.num ? '#10b981' : '#fff', color: step >= s.num ? '#fff' : '#cbd5e1', border: `2px solid ${step >= s.num ? '#10b981' : '#e2e8f0'}`, borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                  {step > s.num ? <CheckCircle2 size={16} /> : (step === s.num ? <Clock size={14}/> : <Circle size={10} fill="currentColor"/>)}
                                </div>
                                <span style={{fontSize: '0.75rem', fontWeight: step >= s.num ? 600 : 500, color: step >= s.num ? '#334155' : '#94a3b8'}}>{s.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BÓVEDA DE DOCUMENTOS */}
            <div>
              <h2 style={{fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '1rem'}}>Mis Documentos / Contratos</h2>
              <div style={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  
                  {/* Digital Contract appears when a request is approved */}
                  {myRequests.some(r => r.status === 'approved') && (
                    <div style={{border: '1px solid var(--primary-orange)', borderRadius: '8px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--primary-orange-light)'}}>
                      <div>
                        <div style={{fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', gap: '6px'}}><Edit3 size={16}/> Contrato Digital de Adopción</div>
                        <div style={{fontSize: '0.75rem', color: '#555', marginTop: '4px'}}>Firma requerida para finalizar.</div>
                      </div>
                      <button onClick={() => alert("Firma digital conectada a DocuSign/HelloSign iría aquí.")} style={{backgroundColor: 'var(--primary-orange)', border: 'none', padding: '8px 14px', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'}}>Firmar</button>
                    </div>
                  )}

                  <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc'}}>
                    <div>
                      <div style={{fontSize: '0.9rem', fontWeight: 600, color: '#334155'}}>Identificación Oficial</div>
                      <div style={{fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: '2px'}}>Faltante</div>
                    </div>
                    <button style={{backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', color: '#475569', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600}}><FileUp size={14}/> Subir</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- HUELLITA MATCH VIEW --- */}
        {currentView === 'match' && (
          <div className={matchStyles.matchContainer}>
            {matchDogs.length > 0 ? (
              <div className={matchStyles.cardsWrapper}>
                {[...matchDogs].reverse().map((dog, index) => (
                  <SwipeCard 
                    key={dog.id} 
                    dog={dog} 
                    onSwipe={handleSwipe} 
                    onInfo={() => alert(dog.name + " es " + dog.temperament)} 
                  />
                ))}
              </div>
            ) : (
              <div className={matchStyles.emptyState}>
                <Dog size={48} color="#cbd5e1" style={{marginBottom: '1rem'}}/>
                <h2>¡Has visto a todos!</h2>
                <p>O tal vez aplicamos filtros muy estrictos.</p>
                <button onClick={() => loadAIRecommendations(session?.user?.id)}>Volver a cargar recomendaciones</button>
                <button onClick={() => router.push('/mi-cuenta/onboarding?edit=true')} style={{marginTop: '1rem', backgroundColor: 'transparent', border: '1px solid var(--primary-orange)', color: 'var(--primary-orange)'}}>Actualizar mis preferencias</button>
              </div>
            )}
            
            {matchDogs.length > 0 && (
              <div className={matchStyles.actionButtons}>
                <button className={`${matchStyles.swipeBtn} ${matchStyles.btnNope}`} onClick={() => handleSwipe('left', matchDogs[0].id)}>
                  <X size={28} strokeWidth={3}/>
                </button>
                <button className={`${matchStyles.swipeBtn} ${matchStyles.btnLike}`} onClick={() => handleSwipe('right', matchDogs[0].id)}>
                  <Heart size={28} strokeWidth={3}/>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- FAVORITOS VIEW --- */}
        {currentView === 'favorites' && (
          <div>
            {favoriteDogs.length === 0 ? (
              <div style={{padding: '3rem', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '12px'}}>
                Aún no tienes perritos favoritos. ¡Ve a Huellita Match para descubrir a tu compañero ideal!
              </div>
            ) : (
              <div className={styles.catalogGrid}>
                {favoriteDogs.map(fav => (
                  <div key={fav.id || fav.dog_id} style={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', position: 'relative'}}>
                    <button onClick={() => removeFavorite(fav.id, fav.dogs.id)} style={{position: 'absolute', top: 10, right: 10, backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--urgent-red)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'}}>
                      <X size={16}/>
                    </button>
                    <img src={fav.dogs.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop"} alt={fav.dogs.name} style={{width: '100%', height: '180px', objectFit: 'cover'}} />
                    <div style={{padding: '1rem'}}>
                      <h3 style={{fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0'}}>{fav.dogs.name}</h3>
                      {myRequests.find(r => r.dog_id === fav.dogs.id) ? (
                        <button disabled style={{width: '100%', backgroundColor: '#e2e8f0', color: '#94a3b8', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: 600, cursor: 'not-allowed'}}>
                          Solicitud en Proceso
                        </button>
                      ) : (
                        <button onClick={() => requestAdoption(fav.dogs.id)} style={{width: '100%', backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'}}>
                          Solicitar Adopción
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- CATALOG VIEW --- */}
        {currentView === 'catalog' && (
          <div className={styles.catalogGrid}>
            {allDogs.map(dog => (
              <div key={dog.id} style={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden'}}>
                <img src={dog.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop"} alt={dog.name} style={{width: '100%', height: '180px', objectFit: 'contain', backgroundColor: '#f1f5f9'}} />
                <div style={{padding: '1rem'}}>
                  <h3 style={{fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0'}}>{dog.name}</h3>
                  <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.75rem'}}>
                    {dog.size && <span style={{fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#475569'}}>{dog.size}</span>}
                  </div>
                  <p style={{fontSize: '0.8rem', color: '#64748b', margin: 0}}><strong>Raza:</strong> {dog.breed || 'Mestizo'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- CHAT VIEW --- */}
        {currentView === 'chat' && (
          <div style={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden'}}>
            <div style={{backgroundColor: 'var(--primary-orange)', padding: '1rem', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Bot size={20}/> Huellitas AI</div>
            </div>
            <div style={{flexGrow: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {messages.map((msg, i) => (
                <div key={i} style={{alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', display: 'flex', gap: '12px'}}>
                  {msg.role === 'ai' && <div style={{width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-orange-light)', color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Bot size={18}/></div>}
                  <div style={{backgroundColor: msg.role === 'user' ? 'var(--primary-orange)' : '#f1f5f9', color: msg.role === 'user' ? 'white' : '#334155', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.95rem'}}>
                    {renderChatMessage(msg.content)}
                  </div>
                </div>
              ))}
              {isTyping && <div style={{fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic'}}>Huellitas AI está escribiendo...</div>}
            </div>
            <div style={{padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', backgroundColor: '#f8fafc'}}>
              <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Escribe tu mensaje..." style={{flexGrow: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem'}} />
              <button onClick={sendMessage} disabled={isTyping} style={{backgroundColor: 'var(--primary-orange)', border: 'none', color: 'white', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer'}}><Send size={18}/></button>
            </div>
          </div>
        )}

        {/* --- PROFILE VIEW --- */}
        {currentView === 'profile' && (
          <div style={{maxWidth: '600px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              <div><label style={{display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem'}}>Nombre Completo</label>
              <input type="text" value={fullNameInput} onChange={e => setFullNameInput(e.target.value)} style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none'}} /></div>
              <div><label style={{display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem'}}>Correo Electrónico (No modificable)</label>
              <input type="email" value={userEmail} readOnly style={{width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8'}} /></div>
              <button onClick={updateProfile} style={{backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'}}>Guardar Cambios</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
