'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Dog, MapPin, Calendar, Heart } from 'lucide-react';
import styles from './page.module.css';

export default function PublicLanding() {
  const [dogs, setDogs] = useState<any[]>([]);
  
  useEffect(() => {
    // Obtenemos a todos los perritos de la base de datos
    supabase.from('dogs').select('*').then(({ data }) => {
      if (data) setDogs(data);
    });
  }, []);

  return (
    <div className={styles.landingContainer}>
      {/* --- NAVBAR PUBLICA --- */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <Dog size={36} color="var(--primary-orange)" />
          <div>Huellitas<span>AI</span></div>
        </div>
        <div className={styles.navLinks}>
          <Link href="#adoptar" className={styles.navLink}>Adoptar</Link>
          <Link href="#" className={styles.navLink}>Nosotros</Link>
          <Link href="#" className={styles.navLink}>Donar</Link>
          <Link href="/login" className={styles.loginBtn}>Iniciar Sesión</Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Encuentra a tu <span>mejor amigo</span></h1>
          <p>Utilizamos Inteligencia Artificial para encontrar el perrito perfecto para tu estilo de vida y tu familia. No compres, dale un hogar a quien más lo necesita.</p>
          <Link href="#adoptar" className={styles.loginBtn} style={{display: 'inline-block', padding: '1rem 2.5rem', fontSize: '1.15rem'}}>
            Ver Perritos Disponibles
          </Link>
        </div>
      </section>

      {/* --- CATALOGO DE PERROS --- */}
      <section id="adoptar" className={styles.catalogSection}>
        <h2 className={styles.sectionTitle}>Nuestros peludos en adopción</h2>
        
        <div className={styles.dogGrid}>
          {dogs.map(dog => (
            <div key={dog.id} className={styles.dogCard}>
              {dog.photo_url ? (
                <img src={dog.photo_url} alt={dog.name} className={styles.dogImage} />
              ) : (
                <div className={styles.noImage}>
                  <Dog size={64} />
                </div>
              )}
              
              <div className={styles.dogInfo}>
                <div className={styles.dogName}>{dog.name}</div>
                
                <div className={styles.dogDetails}>
                  <div className={styles.dogDetailItem}>
                    <Calendar size={16} color="var(--primary-orange)"/> 
                    {dog.age_months ? `${dog.age_months} meses` : 'Edad secreta'}
                  </div>
                  <div className={styles.dogDetailItem}>
                    <MapPin size={16} color="var(--primary-orange)"/> 
                    {dog.size || 'Tamaño Mediano'}
                  </div>
                </div>

                {/* Por ahora los mandamos a Iniciar Sesión para que apliquen */}
                <Link href="/login" className={styles.adoptBtn}>
                  <Heart size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'6px'}}/>
                  ¡Quiero Adoptarlo!
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
