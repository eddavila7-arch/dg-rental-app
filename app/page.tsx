'use client';

import React, { useState, useEffect, FC } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getRefrendoStatus, Unit, OperationalStatus, RefrendoStatus } from '../lib/definitions';

interface UnitCardProps {
  unit: Unit;
}

const UnitCard: FC<UnitCardProps> = ({ unit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Solo se permiten archivos PDF");
        return;
      }
      const storageRef = ref(storage, `contracts/${unit.id}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed", error);
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            const unitRef = doc(db, "units", unit.id);
            updateDoc(unitRef, { 
              contratoPdfUrl: downloadURL,
              contratoPdfPath: uploadTask.snapshot.ref.fullPath
            });
            setFile(null);
          });
        }
      );
    }
  };

  const getStatusColor = (status: OperationalStatus) => {
    switch (status) {
      case OperationalStatus.Disponible:
        return '#28a745'; // Verde
      case OperationalStatus.Rentado:
        return '#dc3545'; // Rojo
      case OperationalStatus.Taller:
        return '#ffc107'; // Amarillo
      default:
        return '#D4AF37';
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return '#4CAF50'; // Verde (Excelente)
    if (margin >= 30) return '#FFC107'; // Amarillo (Bueno)
    return '#FF6347'; // Rojo (Regular)
  };

  return (
    <div style={{
      border: '1px solid #D4AF37',
      padding: '20px',
      borderRadius: '10px',
      backgroundColor: '#1A1A1A',
      boxShadow: '0 6px 10px rgba(212,175,55,0.15)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{unit.id}</h2>
          <div style={{ 
            padding: '5px 10px',
            borderRadius: '5px', 
            backgroundColor: getMarginColor(unit.margenUtilidad),
            color: '#000',
            fontWeight: 'bold'
          }}>
            {unit.margenUtilidad}%
          </div>
        </div>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '10px 0', borderTop: '1px solid #444', paddingTop: '10px' }}>{unit.marca}</p>
        <p>Propietario: {unit.propietario}</p>
        <p>Placas: {unit.placas}</p>
        <p>Año de Refrendo: {unit.refrendo}</p>
        <p>Estatus: <span style={{ color: getStatusColor(unit.status), fontWeight: 'bold' }}>{unit.status}</span></p>
      </div>
      {unit.status === OperationalStatus.Rentado && (
        <div style={{ marginTop: '15px' }}>
          {unit.contratoPdfUrl ? (
            <a href={unit.contratoPdfUrl} target="_blank" rel="noopener noreferrer" style={{ 
              display: 'block', 
              padding: '10px', 
              backgroundColor: '#007BFF', 
              color: 'white', 
              textAlign: 'center', 
              borderRadius: '5px', 
              textDecoration: 'none', 
              fontWeight: 'bold'
            }}>
              Ver Contrato
            </a>
          ) : (
            <div>
              <input type="file" onChange={handleFileChange} style={{ 
                color: '#D4AF37', 
                backgroundColor: '#333', 
                border: '1px solid #D4AF37', 
                borderRadius: '5px', 
                padding: '5px',
                width: '100%',
                boxSizing: 'border-box'
              }} />
              {file && (
                <button onClick={handleUpload} style={{ 
                  width: '100%',
                  padding: '10px', 
                  marginTop: '10px',
                  backgroundColor: '#D4AF37', 
                  color: '#000', 
                  border: 'none', 
                  borderRadius: '5px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer'
                }}>
                  Subir Contrato
                </button>
              )}
              {uploadProgress > 0 && <progress value={uploadProgress} max="100" style={{ width: '100%', marginTop: '10px' }}/>}
            </div>
          )}
        </div>
      )}
      {getRefrendoStatus(unit.refrendo) === RefrendoStatus.Adeudo && (
        <div style={{
          backgroundColor: '#B22222',
          color: '#FFF',
          padding: '12px',
          textAlign: 'center',
          fontWeight: 'bold',
          marginTop: '20px',
          borderRadius: '5px',
          fontSize: '1.1rem',
          animation: 'pulse 1.5s infinite'
        }}>
          ⚠️ REFRENDO PENDIENTE
        </div>
      )}
    </div>
  );
};

const FilterButton: FC<{ filter: OperationalStatus | null, setFilter: (filter: OperationalStatus | null) => void, status: OperationalStatus | null, text: string }> = ({ filter, setFilter, status, text }) => (
    <button
        onClick={() => setFilter(status)}
        style={{
            background: filter === status ? '#D4AF37' : 'transparent',
            color: filter === status ? '#000' : '#D4AF37',
            border: '1px solid #D4AF37',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            margin: '0 5px',
            transition: 'background 0.3s, color 0.3s'
        }}
    >
        {text}
    </button>
);


export default function Dashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filter, setFilter] = useState<OperationalStatus | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'units'), (snapshot) => {
      const unitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[];
      setUnits(unitsData);
    });
    return () => unsubscribe();
  }, []);

  const filteredUnits = filter ? units.filter(unit => unit.status === filter) : units;

  return (
    <>
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(178, 34, 34, 0.7);
          }
          70% {
            transform: scale(1.02);
            box-shadow: 0 0 10px 15px rgba(178, 34, 34, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(178, 34, 34, 0);
          }
        }
      `}</style>
      <div style={{ backgroundColor: '#000', color: '#D4AF37', minHeight: '100vh', padding: '40px', fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        <header style={{ borderBottom: '2px solid #D4AF37', marginBottom: '30px', paddingBottom: '20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 700, letterSpacing: '1px' }}>DG Rental Solutions</h1>
        </header>

        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <FilterButton filter={filter} setFilter={setFilter} status={null} text="Toda la Flota" />
            <FilterButton filter={filter} setFilter={setFilter} status={OperationalStatus.Disponible} text="Disponibles" />
            <FilterButton filter={filter} setFilter={setFilter} status={OperationalStatus.Rentado} text="Rentados" />
            <FilterButton filter={filter} setFilter={setFilter} status={OperationalStatus.Taller} text="En Taller" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
          {filteredUnits.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
        
        <footer style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #444', textAlign: 'center', fontSize: '1rem', color: '#888' }}>
          DG Rental Solutions | Grupo Dávila | García, Nuevo León
        </footer>
      </div>
    </>
  );
}
