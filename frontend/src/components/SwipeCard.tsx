'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Info } from 'lucide-react';

interface DogProps {
  id: string;
  name: string;
  photo_url: string;
  match_percentage: number;
  age_months: number;
  breed: string;
  size: string;
  energy_level: string;
}

interface SwipeCardProps {
  dog: DogProps;
  onSwipe: (direction: 'left' | 'right', dogId: string) => void;
  onInfo: (dog: DogProps) => void;
}

export default function SwipeCard({ dog, onSwipe, onInfo }: SwipeCardProps) {
  const [exitX, setExitX] = useState<number | string>(0);
  const x = useMotionValue(0);
  
  // Transform values for rotation and opacity based on swipe distance
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Heart/X Opacity overlay
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      setExitX(1000);
      onSwipe('right', dog.id);
    } else if (info.offset.x < -swipeThreshold) {
      setExitX(-1000);
      onSwipe('left', dog.id);
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        position: 'absolute',
        width: '100%',
        height: '100%',
        cursor: 'grab',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      animate={{ x: exitX, opacity: exitX ? 0 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '24px',
        background: `url(${dog.photo_url || 'https://via.placeholder.com/400x600?text=Perrito'}) center/cover`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Like Overlay */}
        <motion.div style={{
          opacity: likeOpacity, position: 'absolute', top: 40, left: 40,
          border: '4px solid var(--success-green)', color: 'var(--success-green)',
          padding: '10px 20px', borderRadius: '10px', fontSize: '2rem', fontWeight: 800, transform: 'rotate(-20deg)'
        }}>
          LIKE
        </motion.div>

        {/* Nope Overlay */}
        <motion.div style={{
          opacity: nopeOpacity, position: 'absolute', top: 40, right: 40,
          border: '4px solid var(--urgent-red)', color: 'var(--urgent-red)',
          padding: '10px 20px', borderRadius: '10px', fontSize: '2rem', fontWeight: 800, transform: 'rotate(20deg)'
        }}>
          NOPE
        </motion.div>

        {/* Bottom Info Gradient */}
        <div style={{
          position: 'absolute', bottom: 0, width: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
          padding: '2rem 1.5rem', color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{
                backgroundColor: 'rgba(255, 127, 80, 0.9)', display: 'inline-block',
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px'
              }}>
                {dog.match_percentage}% MATCH
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
                {dog.name}, {dog.age_months ? Math.floor(dog.age_months/12) : 2}
              </h2>
              <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '1rem' }}>
                {dog.breed || 'Mestizo'} • {dog.size}
              </p>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onInfo(dog); }}
              style={{
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer'
              }}
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
