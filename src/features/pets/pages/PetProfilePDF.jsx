/**
 * PetProfilePDF — programmatic PDF generation with @react-pdf/renderer
 * No DOM capture → no blank-page issues from cross-origin images.
 */
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';

/* ── Palette ── */
const C = {
  primary:   '#2c7a5a',
  teal:      '#A8E6CF',
  danger:    '#fee2e2',
  dangerTxt: '#991b1b',
  warn:      '#fef9c3',
  warnTxt:   '#854d0e',
  resolved:  '#f0f0f5',
  resolvedTxt: '#636366',
  border:    '#e5e5ea',
  bg:        '#f5f5f7',
  text:      '#1c1c1e',
  sub:       '#636366',
  muted:     '#8e8e93',
};

/* ── Styles ── */
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.text,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
    paddingBottom: 10,
    marginBottom: 14,
  },
  headerLeft: { flexDirection: 'column', gap: 2 },
  petName:  { fontSize: 20, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  subTitle: { fontSize: 9,  color: C.muted },
  dateText: { fontSize: 9,  color: C.muted, textAlign: 'right' },

  /* Vitals row */
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  vitalBox: {
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: '6 10',
    minWidth: 80,
  },
  vitalLabel: { fontSize: 7.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  vitalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 2 },

  /* Section */
  section: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    padding: '8 12',
  },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold' },

  /* Rows inside sections */
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '9 12',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  rowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '9 12',
    gap: 8,
  },
  rowLeft:  { flex: 1, flexDirection: 'column', gap: 2 },
  rowName:  { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  rowDate:  { fontSize: 8.5, color: C.sub },
  rowNotes: { fontSize: 8.5, color: C.muted, fontStyle: 'italic' },

  /* Badges */
  badge: { borderRadius: 10, padding: '3 8', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  badgeDanger:   { backgroundColor: C.danger,   color: C.dangerTxt },
  badgeWarn:     { backgroundColor: C.warn,     color: C.warnTxt },
  badgeTeal:     { backgroundColor: '#d1f0e5',  color: C.primary },
  badgeResolved: { backgroundColor: C.resolved, color: C.resolvedTxt },

  empty: { padding: '10 12', fontSize: 9, color: C.muted },

  /* Vaccine table */
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    padding: '6 12',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '8 12',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowLast: { flexDirection: 'row', padding: '8 12' },
  th: { fontSize: 7.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: 'Helvetica-Bold' },
  td: { fontSize: 9, color: C.text },
  col1: { flex: 2 }, col2: { flex: 1 }, col3: { flex: 1 },

  /* Disclaimer */
  disclaimer: {
    marginTop: 16,
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: '8 12',
    fontSize: 8,
    color: C.muted,
    textAlign: 'center',
  },
});

/* ── Helpers ── */
function fmt(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function dateRange(start, end, status) {
  const from = start ? `Desde ${fmt(start)}` : '';
  const to   = end   ? `Hasta ${fmt(end)}`   : (status === 'active' ? 'Actual' : 'Resuelta');
  return [from, to].filter(Boolean).join(' · ');
}

function BadgeView({ label, style }) {
  return (
    <View style={{ ...s.badge, ...style }}>
      <Text>{label}</Text>
    </View>
  );
}

/* ══════════════════════════════════════
   Main PDF Document component
   ══════════════════════════════════════ */
export function PetProfilePDF({
  pet, allergies, chronic, activeMeds, vaccines, appointments, today,
}) {
  const SPECIES = { cat: 'Gato', dog: 'Perro', rabbit: 'Conejo' };
  const GENDER  = { male: 'Macho', female: 'Hembra' };

  const vitals = [
    pet.species   && { label: 'Especie',      value: SPECIES[pet.species] || pet.species },
    pet.gender    && { label: 'Género',        value: GENDER[pet.gender] },
    pet.sterilized !== undefined && { label: 'Esterilizado', value: pet.sterilized ? 'Sí' : 'No' },
    pet.age       && { label: 'Edad',          value: String(pet.age) },
    pet.weight_kg && { label: 'Peso',          value: `${pet.weight_kg} kg` },
    pet.microchip && { label: 'Microchip',     value: pet.microchip },
  ].filter(Boolean);

  const now = new Date().toLocaleDateString('es', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Document
      title={`${pet.name} — Perfil KIMO`}
      author="KIMO"
      subject="Perfil de salud de mascota"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.petName}>{pet.name}</Text>
            <Text style={s.subTitle}>Perfil de salud · KIMO · kimofriends.app</Text>
          </View>
          <Text style={s.dateText}>{now}</Text>
        </View>

        {/* ── Vitals ── */}
        {vitals.length > 0 && (
          <View style={s.vitalsRow}>
            {vitals.map((v, i) => (
              <View key={i} style={s.vitalBox}>
                <Text style={s.vitalLabel}>{v.label}</Text>
                <Text style={s.vitalValue}>{v.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Alergias ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>⚠  Alergias</Text>
          </View>
          {allergies.length === 0
            ? <Text style={s.empty}>Sin alergias registradas</Text>
            : allergies.map((a, i) => (
              <View key={a.id} style={i < allergies.length - 1 ? s.row : s.rowLast}>
                <View style={s.rowLeft}>
                  <Text style={s.rowName}>{a.name}</Text>
                  <Text style={s.rowDate}>{dateRange(a.start_date, a.end_date, a.status)}</Text>
                  {a.notes ? <Text style={s.rowNotes}>{a.notes}</Text> : null}
                </View>
                <BadgeView
                  label={a.status === 'active' ? 'Activa' : 'Resuelta'}
                  style={a.status === 'active' ? s.badgeDanger : s.badgeResolved}
                />
              </View>
            ))
          }
        </View>

        {/* ── Enfermedades crónicas ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Enfermedades Crónicas</Text>
          </View>
          {chronic.length === 0
            ? <Text style={s.empty}>Sin enfermedades crónicas registradas</Text>
            : chronic.map((c, i) => (
              <View key={c.id} style={i < chronic.length - 1 ? s.row : s.rowLast}>
                <View style={s.rowLeft}>
                  <Text style={s.rowName}>{c.name}</Text>
                  <Text style={s.rowDate}>{dateRange(c.start_date, c.end_date, c.status)}</Text>
                  {c.notes ? <Text style={s.rowNotes}>{c.notes}</Text> : null}
                </View>
                <BadgeView
                  label={c.status === 'active' ? 'Activa' : 'Resuelta'}
                  style={c.status === 'active' ? s.badgeWarn : s.badgeResolved}
                />
              </View>
            ))
          }
        </View>

        {/* ── Medicamentos ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Medicamentos Actuales</Text>
          </View>
          {activeMeds.length === 0
            ? <Text style={s.empty}>Sin medicamentos activos</Text>
            : activeMeds.map((m, i) => (
              <View key={m.id} style={i < activeMeds.length - 1 ? s.row : s.rowLast}>
                <View style={s.rowLeft}>
                  <Text style={s.rowName}>{m.name}</Text>
                  {m.dose && <Text style={s.rowDate}>Dosis: {m.dose}</Text>}
                  {m.start_date && (
                    <Text style={s.rowDate}>
                      Inicio: {fmt(m.start_date)}{m.end_date ? ` · Fin: ${fmt(m.end_date)}` : ''}
                    </Text>
                  )}
                </View>
                <BadgeView label="En curso" style={s.badgeTeal} />
              </View>
            ))
          }
        </View>

        {/* ── Vacunas ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Vacunas</Text>
          </View>
          {vaccines.length === 0
            ? <Text style={s.empty}>Sin vacunas registradas</Text>
            : (
              <>
                <View style={s.tableHeader}>
                  <Text style={[s.th, s.col1]}>Vacuna</Text>
                  <Text style={[s.th, s.col2]}>Aplicación</Text>
                  <Text style={[s.th, s.col3]}>Próxima dosis</Text>
                </View>
                {vaccines.map((v, i) => (
                  <View key={v.id} style={i < vaccines.length - 1 ? s.tableRow : s.tableRowLast}>
                    <Text style={[s.td, s.col1]}>{v.name}</Text>
                    <Text style={[s.td, s.col2]}>{fmt(v.date)}</Text>
                    <Text style={[s.td, s.col3]}>{v.next_dose_date ? fmt(v.next_dose_date) : '—'}</Text>
                  </View>
                ))}
              </>
            )
          }
        </View>

        {/* ── Citas ── */}
        {appointments.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Citas Médicas</Text>
            </View>
            {appointments.slice(0, 8).map((a, i, arr) => (
              <View key={a.id} style={i < arr.length - 1 ? s.row : s.rowLast}>
                <View style={s.rowLeft}>
                  <Text style={s.rowName}>{a.title}</Text>
                  <Text style={s.rowDate}>
                    {fmt(a.date)}{a.vet_name ? ` · ${a.vet_name}` : ''}
                  </Text>
                  {a.notes ? <Text style={s.rowNotes}>{a.notes}</Text> : null}
                </View>
                <BadgeView
                  label={a.date >= today ? 'Pendiente' : 'Completada'}
                  style={a.date >= today ? s.badgeTeal : s.badgeResolved}
                />
              </View>
            ))}
          </View>
        )}

        {/* ── Disclaimer ── */}
        <Text style={s.disclaimer}>
          Este documento fue generado por KIMO (kimofriends.app) y compartido por el dueño de la mascota.
          No reemplaza un historial clínico formal.
        </Text>

      </Page>
    </Document>
  );
}
