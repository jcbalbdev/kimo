import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { getPetImg } from '../../../shared/utils/petAvatars';
import { calculateAge } from '../../home/components/PerfilTab';
import { formatDateDMY, formatDateLong } from '../../../shared/utils/dates';
import kimoLogo from '../../../assets/icono.png';
import './PetPublicPage.css';

const SPECIES_LABEL = { cat: 'Gato', dog: 'Perro', rabbit: 'Conejo' };
const GENDER_LABEL  = { male: 'Macho', female: 'Hembra' };

function Section({ title, icon, children }) {
  return (
    <section className="ppub-section">
      <div className="ppub-section-header">
        <span className="ppub-section-icon">{icon}</span>
        <h2 className="ppub-section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Badge({ label, variant = 'default' }) {
  return <span className={`ppub-badge ppub-badge-${variant}`}>{label}</span>;
}

export default function PetPublicPage() {
  const { id } = useParams();
  const [pet,          setPet]          = useState(null);
  const [conditions,   setConditions]   = useState([]);
  const [medications,  setMedications]  = useState([]);
  const [vaccines,     setVaccines]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [exporting,    setExporting]    = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) { setNotFound(true); setLoading(false); return; }

      let { data: petData } = await supabase
        .from('pets').select('*').eq('id', id).maybeSingle();

      if (!petData) {
        const { data: byCode } = await supabase
          .from('pets').select('*').eq('kimo_code', id.toUpperCase()).maybeSingle();
        petData = byCode;
      }

      if (!petData) { setNotFound(true); setLoading(false); return; }
      setPet(petData);

      const pid = petData.id;
      const [
        { data: conds },
        { data: meds  },
        { data: vacs  },
        { data: appts },
      ] = await Promise.all([
        supabase.from('pet_medical_conditions').select('*').eq('pet_id', pid).order('created_at'),
        supabase.from('medications').select('*').eq('pet_id', pid).order('created_at'),
        supabase.from('vaccines').select('*').eq('pet_id', pid).order('date', { ascending: false }),
        supabase.from('appointments').select('*').eq('pet_id', pid).order('date', { ascending: false }),
      ]);

      setConditions(conds   || []);
      setMedications(meds   || []);
      setVaccines(vacs      || []);
      setAppointments(appts || []);
      setLoading(false);
    }
    load();
  }, [id]);

  /* ── Loading ── */
  if (loading) return (
    <div className="ppub-loading">
      <img src={kimoLogo} alt="KIMO" className="ppub-loading-logo" />
      <p>Cargando perfil…</p>
    </div>
  );

  /* ── Not found ── */
  if (notFound) return (
    <div className="ppub-notfound">
      <img src={kimoLogo} alt="KIMO" className="ppub-loading-logo" />
      <h2>Perfil no encontrado</h2>
      <p>El enlace ha expirado o no es válido.</p>
    </div>
  );

  /* ── Derived data ── */
  const petImg     = getPetImg(pet);
  const age        = pet.birth_date ? calculateAge(pet.birth_date) : (pet.age || null);
  const allergies  = conditions.filter(c => c.record_type === 'allergy');
  const chronic    = conditions.filter(c => c.record_type === 'chronic');
  const activeMeds = medications.filter(m => !m.ended_at);
  const today      = new Date().toISOString().split('T')[0];
  const upcomingAppts = appointments.filter(a => a.date >= today);
  const pastAppts     = appointments.filter(a => a.date  < today);

  /* ── PDF export via jsPDF (pure JS, no DOM capture) ── */
  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const SPECIES = { cat: 'Gato', dog: 'Perro', rabbit: 'Conejo' };
      const GENDER  = { male: 'Macho', female: 'Hembra' };
      const fmt = (d) => { if (!d) return ''; const [y,m,dd]=d.split('-'); return `${dd}/${m}/${y}`; };
      const dateRange = (s, e, status) => {
        const from = s ? `Desde ${fmt(s)}` : '';
        const to   = e ? `Hasta ${fmt(e)}` : (status === 'active' ? 'Actual' : 'Resuelta');
        return [from, to].filter(Boolean).join(' · ');
      };

      const PW = 210; // A4 width mm
      const ML = 15; // margin left
      const MR = 15; // margin right
      const CW = PW - ML - MR;
      let y = 20;

      const checkPage = (needed = 10) => {
        if (y + needed > 280) { doc.addPage(); y = 20; }
      };

      // ── Header ──
      doc.setFillColor(248, 248, 252);
      doc.roundedRect(ML, y - 4, CW, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(28, 28, 30);
      doc.text(pet.name, ML + 4, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(142, 142, 147);
      doc.text('Perfil de salud · KIMO · kimofriends.app', ML + 4, y + 14);
      const dateStr = new Date().toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'});
      doc.text(dateStr, PW - MR - doc.getTextWidth(dateStr) - 2, y + 8);
      y += 28;

      // ── Vitals ──
      const vitals = [
        pet.species   && `Especie: ${SPECIES[pet.species] || pet.species}`,
        pet.gender    && `Género: ${GENDER[pet.gender]}`,
        age           && `Edad: ${age}`,
        pet.weight_kg && `Peso: ${pet.weight_kg} kg`,
        pet.microchip && `Microchip: ${pet.microchip}`,
      ].filter(Boolean);

      if (vitals.length) {
        const boxW = (CW - (vitals.length - 1) * 3) / vitals.length;
        vitals.forEach((v, i) => {
          const bx = ML + i * (boxW + 3);
          const cx = bx + boxW / 2;  // center x of box
          doc.setFillColor(245, 245, 247);
          doc.roundedRect(bx, y, boxW, 16, 2, 2, 'F');
          const [label, ...rest] = v.split(': ');
          // label — centered
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(142, 142, 147);
          doc.text(label.toUpperCase(), cx, y + 6, { align: 'center' });
          // value — centered
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(28, 28, 30);
          doc.text(rest.join(': '), cx, y + 13, { align: 'center' });
        });
        y += 22;
      }

      // ── Section helper ──
      const section = (title, rows) => {
        checkPage(14 + rows.length * 12);
        // Section header
        doc.setFillColor(249, 249, 249);
        doc.roundedRect(ML, y, CW, 10, 2, 2, 'F');
        doc.setDrawColor(229, 229, 234);
        doc.roundedRect(ML, y, CW, 10, 2, 2, 'D');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(28, 28, 30);
        doc.text(title, ML + 4, y + 7);
        y += 10;

        if (rows.length === 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(174, 174, 178);
          doc.text('Sin registros', ML + 4, y + 7);
          y += 10;
        } else {
          rows.forEach((row, ri) => {
            checkPage(14);
            if (ri > 0) {
              doc.setDrawColor(240, 240, 245);
              doc.line(ML, y, ML + CW, y);
            }
            // Name
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(28, 28, 30);
            doc.text(row.name, ML + 4, y + 8);
            // Badge
            if (row.badge) {
              const bw = doc.getTextWidth(row.badge) + 6;
              const bcolor = row.badgeColor || [242, 242, 247];
              const btcolor = row.badgeTextColor || [99, 99, 102];
              doc.setFillColor(...bcolor);
              doc.roundedRect(ML + CW - bw - 2, y + 2, bw, 7, 2, 2, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7);
              doc.setTextColor(...btcolor);
              doc.text(row.badge, ML + CW - bw + 1, y + 7.5);
            }
            // Sub (dates)
            if (row.sub) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(99, 99, 102);
              doc.text(row.sub, ML + 4, y + 14);
              y += 6;
            }
            // Notes
            if (row.notes) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.setTextColor(142, 142, 147);
              const lines = doc.splitTextToSize(row.notes, CW - 10);
              doc.text(lines, ML + 4, y + 14);
              y += lines.length * 4;
            }
            y += 14;
          });
        }
        y += 4;
      };

      // ── Alergias ──
      section('Alergias', allergies.map(a => ({
        name: a.name,
        sub:  dateRange(a.start_date, a.end_date, a.status),
        notes: a.notes,
        badge: a.status === 'active' ? 'Activa' : 'Resuelta',
        badgeColor: a.status === 'active' ? [254,226,226] : [240,240,245],
        badgeTextColor: a.status === 'active' ? [153,27,27] : [99,99,102],
      })));

      // ── Enfermedades crónicas ──
      section('Enfermedades Crónicas', chronic.map(c => ({
        name: c.name,
        sub:  dateRange(c.start_date, c.end_date, c.status),
        notes: c.notes,
        badge: c.status === 'active' ? 'Activa' : 'Resuelta',
        badgeColor: c.status === 'active' ? [254,249,195] : [240,240,245],
        badgeTextColor: c.status === 'active' ? [133,77,14] : [99,99,102],
      })));

      // ── Medicamentos ──
      section('Medicamentos Actuales', activeMeds.map(m => ({
        name: m.name,
        sub:  [m.dose && `Dosis: ${m.dose}`, m.start_date && `Inicio: ${fmt(m.start_date)}${m.end_date ? ` · Fin: ${fmt(m.end_date)}` : ''}`].filter(Boolean).join('  |  '),
        badge: 'En curso',
        badgeColor: [209,240,229],
        badgeTextColor: [20,95,65],
      })));

      // ── Vacunas ──
      checkPage(14 + vaccines.length * 10);
      doc.setFillColor(249, 249, 249);
      doc.roundedRect(ML, y, CW, 10, 2, 2, 'F');
      doc.setDrawColor(229, 229, 234);
      doc.roundedRect(ML, y, CW, 10, 2, 2, 'D');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(28,28,30);
      doc.text('Vacunas', ML + 4, y + 7);
      y += 10;
      if (vaccines.length === 0) {
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(174,174,178);
        doc.text('Sin vacunas registradas', ML+4, y+7); y += 10;
      } else {
        // table header
        doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(142,142,147);
        doc.text('VACUNA', ML+4, y+6);
        doc.text('APLICACIÓN', ML + CW*0.55, y+6);
        doc.text('PRÓXIMA DOSIS', ML + CW*0.78, y+6);
        y += 8;
        vaccines.forEach((v, ri) => {
          checkPage(10);
          if (ri > 0) { doc.setDrawColor(240,240,245); doc.line(ML, y, ML+CW, y); }
          doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(28,28,30);
          doc.text(v.name, ML+4, y+7);
          doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(99,99,102);
          doc.text(fmt(v.date), ML + CW*0.55, y+7);
          doc.text(v.next_dose_date ? fmt(v.next_dose_date) : '—', ML + CW*0.78, y+7);
          y += 9;
        });
      }
      y += 4;

      // ── Citas ──
      if (appointments.length > 0) {
        section('Citas Médicas', appointments.slice(0,8).map(a => ({
          name: a.title,
          sub:  `${fmt(a.date)}${a.vet_name ? ' · ' + a.vet_name : ''}`,
          notes: a.notes,
          badge: a.date >= today ? 'Pendiente' : 'Completada',
          badgeColor: a.date >= today ? [209,240,229] : [240,240,245],
          badgeTextColor: a.date >= today ? [20,95,65] : [99,99,102],
        })));
      }

      // ── Disclaimer ──
      checkPage(14);
      doc.setFillColor(245,245,247);
      doc.roundedRect(ML, y, CW, 12, 2, 2, 'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(142,142,147);
      const disc = 'Este documento fue generado por KIMO (kimofriends.app) y compartido por el dueño de la mascota. No reemplaza un historial clínico formal.';
      const discLines = doc.splitTextToSize(disc, CW - 8);
      doc.text(discLines, PW/2, y + 5 + (discLines.length - 1) * 3.5, { align: 'center' });

      doc.save(`${pet.name}-KIMO.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="ppub-root">

      {/* ── Top bar ── */}
      <div className="ppub-topbar">
        <img src={kimoLogo} alt="KIMO" className="ppub-kimo-logo" />
        <span className="ppub-kimo-name">KIMO</span>
        <span className="ppub-topbar-badge">Perfil compartido</span>
      </div>

      <div className="ppub-body">

        {/* ══════════════ LEFT SIDEBAR ══════════════ */}
        <aside className="ppub-sidebar">

          {/* Hero card */}
          <div className="ppub-hero">
            <div className="ppub-avatar-wrap">
              <img src={petImg} alt={pet.name} className="ppub-avatar" />
            </div>
            <h1 className="ppub-pet-name">{pet.name}</h1>
            <div className="ppub-pet-tags">
              {pet.species    && <Badge label={SPECIES_LABEL[pet.species] || pet.species} />}
              {pet.gender     && <Badge label={GENDER_LABEL[pet.gender]} />}
              {pet.sterilized && <Badge label="Esterilizado/a" variant="teal" />}
            </div>
          </div>

          {/* PDF download button */}
          <button
            className={`ppub-sidebar-pdf-btn ${exporting ? 'ppub-export-loading' : ''}`}
            onClick={handleExportPdf}
            disabled={exporting}
          >
            {exporting ? (
              <span className="ppub-export-spinner" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
            {exporting ? 'Generando…' : 'Descargar PDF'}
          </button>

          {/* ── KIMO CTA card ── */}
          <div className="ppub-cta-card">
            <div className="ppub-cta-glow" />
            <p className="ppub-cta-eyebrow">¿Primera vez que ves esto?</p>
            <h3 className="ppub-cta-headline">
              Tus pacientes ya tienen<br/>
              historial digital 🐾
            </h3>
            <p className="ppub-cta-body">
              KIMO es la app que usan sus dueños para registrar vacunas, medicamentos,
              alergias y citas — todo en un solo lugar y siempre contigo.
            </p>
            <a
              href="https://www.kimofriends.app/login"
              target="_blank"
              rel="noopener noreferrer"
              className="ppub-cta-btn"
            >
              Conoce KIMO
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
            <p className="ppub-cta-fine">kimofriends.app</p>
          </div>

        </aside>

        {/* ══════════════ RIGHT CONTENT ══════════════ */}
        <main className="ppub-content">

          {/* Vitals summary — first thing the vet sees on the right */}
          {(age || pet.weight_kg || pet.microchip || pet.sterilized !== undefined) && (
            <section className="ppub-section ppub-vitals-section">
              <div className="ppub-section-header">
                <span className="ppub-section-icon">🏷️</span>
                <h2 className="ppub-section-title">Información general</h2>
              </div>
              <div className="ppub-vitals-grid">
                {pet.species && (
                  <div className="ppub-vg-item">
                    <span className="ppub-vg-label">Especie</span>
                    <span className="ppub-vg-value">{SPECIES_LABEL[pet.species] || pet.species}</span>
                  </div>
                )}
                {pet.gender && (
                  <div className="ppub-vg-item">
                    <span className="ppub-vg-label">Género</span>
                    <span className="ppub-vg-value">{GENDER_LABEL[pet.gender]}</span>
                  </div>
                )}
                {pet.sterilized !== undefined && (
                  <div className="ppub-vg-item">
                    <span className="ppub-vg-label">Esterilizado</span>
                    <span className="ppub-vg-value">{pet.sterilized ? 'Sí' : 'No'}</span>
                  </div>
                )}
                {age && (
                  <div className="ppub-vg-item">
                    <span className="ppub-vg-label">Edad</span>
                    <span className="ppub-vg-value">{age}</span>
                  </div>
                )}
                {pet.weight_kg && (
                  <div className="ppub-vg-item">
                    <span className="ppub-vg-label">Peso</span>
                    <span className="ppub-vg-value">{pet.weight_kg} kg</span>
                  </div>
                )}
                {pet.microchip && (
                  <div className="ppub-vg-item ppub-vg-item--wide">
                    <span className="ppub-vg-label">Microchip</span>
                    <span className="ppub-vg-value ppub-vital-mono">{pet.microchip}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ⚠️ Allergies */}
          <Section title="Alergias" icon="⚠️">
            {allergies.length === 0
              ? <p className="ppub-empty-state">Sin alergias registradas</p>
              : (
                <div className="ppub-alert-list">
                  {allergies.map(a => (
                    <div key={a.id} className="ppub-alert-row">
                      <div className="ppub-alert-body">
                        <span className="ppub-alert-name">{a.name}</span>
                        <span className="ppub-alert-dates">
                          {a.start_date ? `Desde ${formatDateDMY(a.start_date)}` : ''}
                          {a.start_date && ' · '}
                          {a.end_date
                            ? `Hasta ${formatDateDMY(a.end_date)}`
                            : (a.status === 'active' ? 'Actual' : 'Resuelta')
                          }
                        </span>
                        {a.notes && <span className="ppub-alert-notes">{a.notes}</span>}
                      </div>
                      <Badge
                        label={a.status === 'active' ? 'Activa' : 'Resuelta'}
                        variant={a.status === 'active' ? 'danger' : 'resolved'}
                      />
                    </div>
                  ))}
                </div>
              )
            }
          </Section>

          {/* Chronic conditions */}
          <Section title="Enfermedades crónicas" icon="🩺">
            {chronic.length === 0
              ? <p className="ppub-empty-state">Sin enfermedades crónicas registradas</p>
              : chronic.map(c => (
                <div key={c.id} className="ppub-record-card">
                  <div className="ppub-record-top">
                    <span className="ppub-record-name">{c.name}</span>
                    <Badge
                      label={c.status === 'active' ? 'Activa' : 'Resuelta'}
                      variant={c.status === 'active' ? 'warn' : 'resolved'}
                    />
                  </div>
                  <span className="ppub-record-meta">
                    {c.start_date ? `Desde ${formatDateDMY(c.start_date)}` : ''}
                    {c.start_date && ' · '}
                    {c.end_date
                      ? `Hasta ${formatDateDMY(c.end_date)}`
                      : (c.status === 'active' ? 'Actual' : 'Resuelta')
                    }
                  </span>
                  {c.notes && <span className="ppub-record-notes">{c.notes}</span>}
                </div>
              ))
            }
          </Section>

          {/* Active medications */}
          <Section title="Medicamentos actuales" icon="💊">
            {activeMeds.length === 0
              ? <p className="ppub-empty-state">Sin medicamentos activos</p>
              : activeMeds.map(m => (
                <div key={m.id} className="ppub-record-card">
                  <div className="ppub-record-top">
                    <span className="ppub-record-name">{m.name}</span>
                    <Badge label="En curso" variant="teal" />
                  </div>
                  {m.dose       && <span className="ppub-record-meta">Dosis: {m.dose}</span>}
                  {m.start_date && <span className="ppub-record-meta">Inicio: {formatDateDMY(m.start_date)}</span>}
                  {m.end_date   && <span className="ppub-record-meta">Fin: {formatDateDMY(m.end_date)}</span>}
                </div>
              ))
            }
          </Section>

          {/* Vaccines */}
          <Section title="Vacunas" icon="💉">
            {vaccines.length === 0
              ? <p className="ppub-empty-state">Sin vacunas registradas</p>
              : (
                <div className="ppub-table">
                  <div className="ppub-table-header">
                    <span>Vacuna</span>
                    <span>Aplicación</span>
                    <span>Próx. dosis</span>
                  </div>
                  {vaccines.map(v => (
                    <div key={v.id} className="ppub-table-row">
                      <span className="ppub-table-name">{v.name}</span>
                      <span className="ppub-table-date">{formatDateDMY(v.date)}</span>
                      <span className="ppub-table-date">
                        {v.next_dose_date ? formatDateDMY(v.next_dose_date) : <span className="ppub-na">—</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          </Section>

          {/* Appointments */}
          <Section title="Citas médicas" icon="📅">
            {appointments.length === 0
              ? <p className="ppub-empty-state">Sin citas registradas</p>
              : (
                <>
                  {upcomingAppts.length > 0 && (
                    <>
                      <p className="ppub-group-label">Próximas</p>
                      {upcomingAppts.map(a => (
                        <div key={a.id} className="ppub-record-card ppub-appt-upcoming">
                          <div className="ppub-record-top">
                            <span className="ppub-record-name">{a.title}</span>
                            <Badge label="Pendiente" variant="teal" />
                          </div>
                          <span className="ppub-record-meta">{formatDateLong(a.date)}</span>
                          {a.vet_name && <span className="ppub-record-meta">Veterinario: {a.vet_name}</span>}
                          {a.notes    && <span className="ppub-record-notes">{a.notes}</span>}
                        </div>
                      ))}
                    </>
                  )}
                  {pastAppts.length > 0 && (
                    <>
                      <p className="ppub-group-label">Historial</p>
                      {pastAppts.slice(0, 5).map(a => (
                        <div key={a.id} className="ppub-record-card">
                          <div className="ppub-record-top">
                            <span className="ppub-record-name">{a.title}</span>
                            <span className="ppub-record-meta">{formatDateDMY(a.date)}</span>
                          </div>
                          {a.vet_name && <span className="ppub-record-meta">Veterinario: {a.vet_name}</span>}
                          {a.notes    && <span className="ppub-record-notes">{a.notes}</span>}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )
            }
          </Section>

          {/* Bio */}
          {pet.bio && (
            <Section title={`Sobre ${pet.name}`} icon="📝">
              <p className="ppub-bio">{pet.bio}</p>
            </Section>
          )}

        </main>
      </div>
    </div>
  );
}
