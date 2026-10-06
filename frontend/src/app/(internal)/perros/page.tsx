'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, X, Dog, Edit2 } from 'lucide-react';
import styles from './perros.module.css';

export default function PerrosPage() {
  const [dogs, setDogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    breed: '',
    color: '',
    age_months: '',
    size: '',
    energy_level: '',
    temperament: '',
    health_status: '',
    good_with_kids: false,
    good_with_other_dogs: false,
    good_with_cats: false,
    experience_level_required: 'Apto para primerizos',
    housing_type_recommended: 'Casa chica (patio chico/sin patio)'
  });

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching dogs:", error);
    else setDogs(data || []);
    setLoading(false);
  };

  const openEditModal = (dog: any) => {
    setEditingDogId(dog.id);
    setFormData({
      name: dog.name || '',
      photo_url: dog.photo_url || '',
      breed: dog.breed || '',
      color: dog.color || '',
      age_months: dog.age_months !== null ? dog.age_months.toString() : '',
      size: dog.size || '',
      energy_level: dog.energy_level || '',
      temperament: dog.temperament || '',
      health_status: dog.health_status || '',
      good_with_kids: dog.good_with_kids || false,
      good_with_other_dogs: dog.good_with_other_dogs || false,
      good_with_cats: dog.good_with_cats || false,
      experience_level_required: dog.experience_level_required || 'Apto para primerizos',
      housing_type_recommended: dog.housing_type_recommended || 'Casa chica (patio chico/sin patio)'
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleNewClick = () => {
    setEditingDogId(null);
    setFormData({ name: '', photo_url: '', breed: '', color: '', age_months: '', size: '', energy_level: '', temperament: '', health_status: '', good_with_kids: false, good_with_other_dogs: false, good_with_cats: false, experience_level_required: 'Apto para primerizos', housing_type_recommended: 'Casa chica (patio chico/sin patio)' });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImg(true);

    let finalPhotoUrl = formData.photo_url;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dogs')
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Error subiendo imagen: " + uploadError.message);
        setUploadingImg(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('dogs').getPublicUrl(fileName);
      finalPhotoUrl = publicUrl;
    }
    
    const payload = {
      name: formData.name,
      photo_url: finalPhotoUrl || null,
      breed: formData.breed || null,
      color: formData.color || null,
      age_months: formData.age_months ? parseInt(formData.age_months) : null,
      size: formData.size || null,
      energy_level: formData.energy_level || null,
      temperament: formData.temperament || null,
      health_status: formData.health_status || null,
      good_with_kids: formData.good_with_kids,
      good_with_other_dogs: formData.good_with_other_dogs,
      good_with_cats: formData.good_with_cats,
      experience_level_required: formData.experience_level_required,
      housing_type_recommended: formData.housing_type_recommended
    };

    let error;
    if (editingDogId) {
      const { error: updateError } = await supabase.from('dogs').update(payload).eq('id', editingDogId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('dogs').insert([payload]);
      error = insertError;
    }

    if (error) {
      alert("Hubo un error al guardar: " + error.message);
    } else {
      setIsModalOpen(false);
      setImageFile(null);
      setFormData({ name: '', photo_url: '', breed: '', color: '', age_months: '', size: '', energy_level: '', temperament: '', health_status: '', good_with_kids: false, good_with_other_dogs: false, good_with_cats: false, experience_level_required: 'Apto para primerizos', housing_type_recommended: 'Casa chica (patio chico/sin patio)' });
      fetchDogs();
    }
    setUploadingImg(false);
  };

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Expedientes de Perritos</h1>
          <p className="page-subtitle">Gestiona el catálogo de perros del refugio. Registra nuevos ingresos o actualiza su información.</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleNewClick}>
          <Plus size={20} /> Nuevo Ingreso
        </button>
      </div>

      {loading ? (
        <p>Cargando perritos...</p>
      ) : dogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Dog size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <h3 style={{fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-dark)'}}>Catálogo Vacío</h3>
          <p>No hay perritos registrados aún en la base de datos.<br/>¡Haz clic en "Nuevo Ingreso" para registrar a Luna o Max!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {dogs.map(dog => (
            <div key={dog.id} className={styles.card}>
              <img 
                src={dog.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop"} 
                alt={dog.name} 
                className={styles.cardImg} 
              />
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>
                  {dog.name}
                  <button onClick={() => openEditModal(dog)} style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)'}} title="Editar expediente">
                    <Edit2 size={18}/>
                  </button>
                </div>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem'}}>
                  {dog.size && <span className={styles.tag}>{dog.size}</span>}
                  {dog.age_months !== null && <span className={styles.tag}>{dog.age_months} meses</span>}
                  {dog.good_with_kids && <span className={styles.tag} style={{background: 'var(--success-green-light)', color: 'var(--success-green)', borderColor: 'var(--success-green)'}}>Kids Friendly</span>}
                </div>
                <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5}}>
                  <strong>Raza:</strong> {dog.breed || 'Mestizo'} | <strong>Color:</strong> {dog.color || 'No especificado'}<br/>
                  <strong>Temperamento:</strong> {dog.temperament || 'No especificado'}<br/>
                  <strong>Salud:</strong> {dog.health_status || 'No especificado'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Perrito */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <h2>{editingDogId ? 'Editar Expediente' : 'Registrar Nuevo Perrito'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem'}}>
              Ingresa los datos del perro. Si no tienes toda la información por ahora (ej. no sabes la edad exacta), puedes dejar los campos vacíos y actualizarlos más adelante.
            </p>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nombre del perro *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Ej. Luna" />
              </div>
              
              <div className={styles.formGroup}>
                <label>Fotografía del Perro (Subir Archivo)</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Raza (Dinámica / Autocompletado)</label>
                  <input type="text" name="breed" list="breedOptions" value={formData.breed} onChange={handleInputChange} placeholder="Escribe o selecciona..." />
                  <datalist id="breedOptions">
                    <option value="Mestizo Pequeño" />
                    <option value="Mestizo Mediano" />
                    <option value="Mestizo Grande" />
                    <option value="Cruza de Labrador" />
                    <option value="Cruza de Pitbull/Terrier" />
                    <option value="Cruza de Pastor Alemán" />
                    <option value="Cruza de Husky" />
                    <option value="Cruza de Chihuahua" />
                    <option value="Cruza de Poodle/Doodle" />
                    <option value="Akita" />
                    <option value="Beagle" />
                    <option value="Basset Hound" />
                    <option value="Border Collie" />
                    <option value="Boston Terrier" />
                    <option value="Boxer" />
                    <option value="Bulldog Francés" />
                    <option value="Bulldog Inglés" />
                    <option value="Bull Terrier" />
                    <option value="Caniche/Poodle" />
                    <option value="Chihuahua" />
                    <option value="Chow Chow" />
                    <option value="Cocker Spaniel" />
                    <option value="Dachshund (Salchicha)" />
                    <option value="Dóberman" />
                    <option value="Gran Danés" />
                    <option value="Golden Retriever" />
                    <option value="Husky Siberiano" />
                    <option value="Labrador Retriever" />
                    <option value="Malinois" />
                    <option value="Pastor Alemán" />
                    <option value="Pastor Australiano" />
                    <option value="Pitbull" />
                    <option value="Pomerania" />
                    <option value="Pug" />
                    <option value="Rottweiler" />
                    <option value="Schnauzer" />
                    <option value="Shih Tzu" />
                    <option value="Yorkshire Terrier" />
                  </datalist>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Color dominante</label>
                  <select name="color" value={formData.color} onChange={handleInputChange}>
                    <option value="">Selecciona Color</option>
                    <option value="Negro">Negro</option>
                    <option value="Blanco">Blanco</option>
                    <option value="Café / Canela">Café / Canela</option>
                    <option value="Manchado (Blanco y Negro/Café)">Manchado (Blanco y Negro/Café)</option>
                    <option value="Atigrado (Brindle)">Atigrado (Brindle)</option>
                    <option value="Gris / Cenizo">Gris / Cenizo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Edad estimada (meses)</label>
                  <input type="number" name="age_months" value={formData.age_months} onChange={handleInputChange} placeholder="Ej. 24 (para 2 años)" />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Tamaño</label>
                  <select name="size" value={formData.size} onChange={handleInputChange}>
                    <option value="">Desconocido</option>
                    <option value="Pequeño (<10kg)">Pequeño (&lt;10kg)</option>
                    <option value="Mediano (10-25kg)">Mediano (10-25kg)</option>
                    <option value="Grande (>25kg)">Grande (&gt;25kg)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Nivel de Energía</label>
                  <select name="energy_level" value={formData.energy_level} onChange={handleInputChange}>
                    <option value="">Desconocido</option>
                    <option value="Bajo">Bajo</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Tolerancia / Comportamiento (ML Features)</label>
                  <div style={{display:'flex', flexDirection:'column', gap: '8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap: '8px', fontWeight: 400, color: 'var(--text-dark)'}}>
                      <input type="checkbox" name="good_with_kids" checked={formData.good_with_kids} onChange={handleInputChange} style={{width:'18px', height:'18px', cursor:'pointer'}} />
                      Bueno con Niños
                    </label>
                    <label style={{display:'flex', alignItems:'center', gap: '8px', fontWeight: 400, color: 'var(--text-dark)'}}>
                      <input type="checkbox" name="good_with_other_dogs" checked={formData.good_with_other_dogs} onChange={handleInputChange} style={{width:'18px', height:'18px', cursor:'pointer'}} />
                      Bueno con otros Perros
                    </label>
                    <label style={{display:'flex', alignItems:'center', gap: '8px', fontWeight: 400, color: 'var(--text-dark)'}}>
                      <input type="checkbox" name="good_with_cats" checked={formData.good_with_cats} onChange={handleInputChange} style={{width:'18px', height:'18px', cursor:'pointer'}} />
                      Bueno con Gatos
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Temperamento (Actitud)</label>
                  <select name="temperament" value={formData.temperament} onChange={handleInputChange}>
                    <option value="">Selecciona Temperamento</option>
                    <option value="Juguetón/Activo">Juguetón/Activo</option>
                    <option value="Tranquilo/Calmo">Tranquilo/Calmo</option>
                    <option value="Cariñoso/Encimoso">Cariñoso/Encimoso</option>
                    <option value="Protector/Alerta">Protector/Alerta</option>
                    <option value="Tímido/Asustadizo">Tímido/Asustadizo</option>
                    <option value="Independiente">Independiente</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Nivel de Experiencia Requerido</label>
                  <select name="experience_level_required" value={formData.experience_level_required} onChange={handleInputChange}>
                    <option value="Apto para primerizos">Apto para primerizos</option>
                    <option value="Requiere experiencia">Requiere experiencia</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Espacio Recomendado / Vivienda</label>
                <select name="housing_type_recommended" value={formData.housing_type_recommended} onChange={handleInputChange}>
                  <option value="Departamento / Espacio chico">Departamento / Espacio chico</option>
                  <option value="Casa chica (patio chico/sin patio)">Casa chica (patio chico/sin patio)</option>
                  <option value="Casa grande (patio amplio/jardín)">Casa grande (patio amplio/jardín)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Estado de Salud (Notas Médicas)</label>
                <select name="health_status" value={formData.health_status} onChange={handleInputChange}>
                  <option value="">Selecciona Estado de Salud</option>
                  <option value="Completamente Sano">Completamente Sano</option>
                  <option value="En Tratamiento (Leve)">En Tratamiento (Leve)</option>
                  <option value="Condición Crónica / Especial">Condición Crónica / Especial</option>
                  <option value="Recuperándose de Cirugía">Recuperándose de Cirugía</option>
                  <option value="Vacunas / Desparasitación Pendiente">Vacunas / Desparasitación Pendiente</option>
                </select>
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={uploadingImg}>
                  {uploadingImg ? 'Subiendo imagen y guardando...' : 'Guardar Expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
