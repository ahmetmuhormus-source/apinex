import { useState } from 'react'
import './ResortPlanPage.css'

const ZONES = [
  {
    id: 'arrival',
    label: 'Giriş', sublabel: 'Arrival',
    type: 'circulation', color: '#f5c84c', textColor: '#101010',
    x: 375, y: 10, w: 210, h: 58,
    desc: 'Ana giriş ve karşılama noktası. Otopark bağlantısı, bagaj transferi ve misafir oryantasyonu.',
    fns: ['Karşılama', 'Otopark', 'Bagaj', 'Oryantasyon'],
  },
  {
    id: 'village',
    label: 'Köy Merkezi', sublabel: 'Village Core',
    type: 'social', color: '#8a5cf5', textColor: '#fff',
    x: 310, y: 120, w: 340, h: 195,
    desc: 'Tüm akışların bağlandığı sosyal çekim merkezi. Yemek, lobi, mağaza ve bilgi noktası.',
    fns: ['Yemek & İçecek', 'Lobi', 'Mağaza', 'Toplantı Noktası'],
  },
  {
    id: 'bathhouse',
    label: 'Hamam & Spa', sublabel: 'Bathhouse',
    type: 'recovery', color: '#3b9fd4', textColor: '#fff',
    x: 30, y: 120, w: 230, h: 175,
    desc: 'Termal havuzlar, sauna, buhar odası ve masaj. Egzersiz sonrası aktif toparlanma merkezi.',
    fns: ['Termal Havuz', 'Sauna / Buhar', 'Masaj', 'Soğuk Banyo'],
  },
  {
    id: 'performance',
    label: 'Performans', sublabel: 'Performance',
    type: 'fitness', color: '#e05252', textColor: '#fff',
    x: 30, y: 355, w: 230, h: 150,
    desc: 'Spor salonu, HIIT ve yoga stüdyoları, açık kortlar. Sabah programının başlangıç noktası.',
    fns: ['Spor Salonu', 'HIIT Stüdyo', 'Yoga / Pilates', 'Kortlar'],
  },
  {
    id: 'clinic',
    label: 'Klinik', sublabel: 'Clinic',
    type: 'recovery', color: '#38b87c', textColor: '#fff',
    x: 700, y: 120, w: 230, h: 175,
    desc: 'Fizyoterapi, beslenme danışmanlığı, sağlık taraması ve kişisel program takibi.',
    fns: ['Fizyoterapi', 'Beslenme', 'Sağlık Tarama', 'Takip'],
  },
  {
    id: 'events',
    label: 'Etkinlik', sublabel: 'Events',
    type: 'social', color: '#e07c3a', textColor: '#fff',
    x: 700, y: 355, w: 230, h: 150,
    desc: 'Seminer, atölye, konser ve özel grup etkinlikleri. Haftalık program döngüsü.',
    fns: ['Seminer', 'Atölye', 'Konser Alanı', 'Özel Etkinlik'],
  },
  {
    id: 'nature',
    label: 'Doğa Bölgesi', sublabel: 'Wildland',
    type: 'nature', color: '#3a7a36', textColor: '#a8d8a0',
    x: 310, y: 385, w: 340, h: 125,
    desc: 'Yürüyüş parkurları, meditasyon köşeleri, nefes egzersizleri ve biyoçeşitlik alanları.',
    fns: ['Yürüyüş', 'Meditasyon', 'Nefes Egz.', 'Doğal Alan'],
  },
  {
    id: 'farm',
    label: 'Çiftlik', sublabel: 'Farm',
    type: 'nature', color: '#5a8a3c', textColor: '#d4f0b8',
    x: 30, y: 565, w: 230, h: 110,
    desc: 'Tarladan masaya sebze-meyve üretimi, mutfak bahçesi ve tarım atölyeleri.',
    fns: ['Mutfak Bahçesi', 'Tarım Atölyesi', 'Hasat Alanı'],
  },
  {
    id: 'lodging',
    label: 'Konaklama', sublabel: 'Lodging',
    type: 'lodging', color: '#4a5568', textColor: '#cbd5e0',
    x: 365, y: 570, w: 230, h: 110,
    desc: 'Doğa bölgesine yakın, sessiz konaklama. Villalar ve odalar.',
    fns: ['Villa', 'Standart Oda', 'Suite'],
  },
  {
    id: 'lodging-b',
    label: 'Konaklama +', sublabel: 'Lodging Plus',
    type: 'lodging', color: '#374151', textColor: '#9ca3af',
    x: 700, y: 570, w: 230, h: 110,
    desc: 'Klinik ve etkinlik alanına yakın premium konaklama.',
    fns: ['Premium Oda', 'Balkon Suite', 'Özel Erişim'],
  },
]

const ZONE_MAP = Object.fromEntries(ZONES.map((z) => [z.id, z]))

function zoneCenter(zone) {
  return [zone.x + zone.w / 2, zone.y + zone.h / 2]
}

const CONNECTIONS = [
  { from: 'arrival', to: 'village', type: 'primary', label: 'Ana Omurga' },
  { from: 'village', to: 'bathhouse', type: 'secondary', label: 'Hamam Koridoru' },
  { from: 'village', to: 'performance', type: 'secondary', label: 'Spor Erişimi' },
  { from: 'village', to: 'clinic', type: 'secondary', label: 'Sağlık Yolu' },
  { from: 'village', to: 'events', type: 'secondary', label: 'Etkinlik Bağlantısı' },
  { from: 'village', to: 'nature', type: 'secondary', label: 'Doğa Geçidi' },
  { from: 'bathhouse', to: 'performance', type: 'active', label: 'Toparlanma Döngüsü' },
  { from: 'performance', to: 'nature', type: 'active', label: 'Aktif Parkur' },
  { from: 'events', to: 'nature', type: 'active', label: 'Doğa Kaçışı' },
  { from: 'nature', to: 'farm', type: 'active', label: 'Çiftlik Parkuru' },
  { from: 'farm', to: 'village', type: 'service', label: 'Çiftlik Hattı' },
  { from: 'nature', to: 'lodging', type: 'service', label: 'Doğa Konaklama' },
  { from: 'events', to: 'lodging-b', type: 'service', label: 'Konaklama + Erişim' },
]

const PATH_STYLES = {
  primary:   { stroke: '#f5c84c', width: 4,   opacity: 1,    dash: '' },
  secondary: { stroke: 'rgba(255,255,255,0.35)', width: 2.5, opacity: 1, dash: '' },
  active:    { stroke: '#e05252', width: 2,   opacity: 0.9,  dash: '8 4' },
  wellness:  { stroke: '#3b9fd4', width: 2,   opacity: 0.9,  dash: '6 3' },
  service:   { stroke: '#5a8a3c', width: 1.5, opacity: 0.75, dash: '4 4' },
}

const ARROW_MARKERS = {
  primary:   '#arrowYellow',
  secondary: '#arrowWhite',
  active:    '#arrowRed',
  wellness:  '#arrowBlue',
  service:   '#arrowGreen',
}

const TYPE_META = {
  circulation: { label: 'Sirkülasyon', color: '#f5c84c' },
  social:      { label: 'Sosyal Alan',  color: '#8a5cf5' },
  recovery:    { label: 'Toparlanma',   color: '#3b9fd4' },
  fitness:     { label: 'Fitness',      color: '#e05252' },
  nature:      { label: 'Doğa',         color: '#3a7a36' },
  lodging:     { label: 'Konaklama',    color: '#4a5568' },
}

const FLOW_LEGEND = [
  { type: 'primary',   label: 'Ana Omurga Yolu' },
  { type: 'secondary', label: 'İkincil Bağlantı' },
  { type: 'active',    label: 'Aktif Devre' },
  { type: 'service',   label: 'Servis / Tedarik' },
]

const DAILY_CIRCUITS = [
  {
    id: 'morning',
    label: 'Sabah Aktif',
    color: '#e05252',
    path: ['lodging', 'performance', 'nature', 'village'],
  },
  {
    id: 'recovery',
    label: 'Toparlanma',
    color: '#3b9fd4',
    path: ['performance', 'bathhouse', 'village'],
  },
  {
    id: 'wellness',
    label: 'Sağlık Programı',
    color: '#38b87c',
    path: ['clinic', 'village', 'bathhouse'],
  },
  {
    id: 'social',
    label: 'Akşam Sosyal',
    color: '#e07c3a',
    path: ['lodging', 'events', 'village'],
  },
]

const FUNCTION_DIST = [
  { label: 'Fitness', pct: 20, color: '#e05252' },
  { label: 'Sosyal',  pct: 22, color: '#8a5cf5' },
  { label: 'Toparlanma', pct: 20, color: '#3b9fd4' },
  { label: 'Doğa',   pct: 18, color: '#3a7a36' },
  { label: 'Konaklama', pct: 15, color: '#4a5568' },
  { label: 'Sirkülasyon', pct: 5, color: '#f5c84c' },
]

function ArrowMarker({ id, color }) {
  return (
    <marker
      id={id}
      markerWidth="7"
      markerHeight="7"
      refX="5"
      refY="3.5"
      orient="auto"
    >
      <polygon points="0 0, 7 3.5, 0 7" fill={color} opacity="0.9" />
    </marker>
  )
}

export function ResortPlanPage() {
  const [activeZone, setActiveZone] = useState(null)
  const [showFlows, setShowFlows] = useState(true)
  const [highlightType, setHighlightType] = useState(null)
  const [activeCircuit, setActiveCircuit] = useState(null)
  const [tab, setTab] = useState('zones')

  const active = activeZone ? ZONE_MAP[activeZone] : null

  function handleZoneClick(id) {
    setActiveZone((prev) => (prev === id ? null : id))
    setActiveCircuit(null)
  }

  function isZoneDimmed(zone) {
    if (activeCircuit) {
      const circuit = DAILY_CIRCUITS.find((c) => c.id === activeCircuit)
      return !circuit.path.includes(zone.id)
    }
    if (highlightType) return zone.type !== highlightType
    if (activeZone) {
      if (zone.id === activeZone) return false
      return !CONNECTIONS.some(
        (c) =>
          (c.from === activeZone && c.to === zone.id) ||
          (c.to === activeZone && c.from === zone.id),
      )
    }
    return false
  }

  function isConnDimmed(conn) {
    if (activeCircuit) {
      const circuit = DAILY_CIRCUITS.find((c) => c.id === activeCircuit)
      for (let i = 0; i < circuit.path.length - 1; i++) {
        if (
          (conn.from === circuit.path[i] && conn.to === circuit.path[i + 1]) ||
          (conn.to === circuit.path[i] && conn.from === circuit.path[i + 1])
        )
          return false
      }
      return true
    }
    if (!activeZone && !highlightType) return false
    if (activeZone) {
      return conn.from !== activeZone && conn.to !== activeZone
    }
    return false
  }

  return (
    <section className="resort-page">
      <div className="resort-header">
        <div>
          <p className="eyebrow">Fitness Tatil Köyü · LONGLIGHT</p>
          <h2>Mekan Planı</h2>
          <p className="resort-subtitle">
            Alan bağlantıları · Fonksiyon dağılımı · Yaya akış hatları
          </p>
        </div>
        <div className="resort-controls">
          <button
            className={showFlows ? 'primary-button compact-btn' : 'secondary-button compact-btn'}
            onClick={() => setShowFlows((f) => !f)}
          >
            {showFlows ? 'Akışlar Açık' : 'Akışlar Kapalı'}
          </button>
          {(highlightType || activeCircuit) && (
            <button
              className="secondary-button compact-btn"
              onClick={() => {
                setHighlightType(null)
                setActiveCircuit(null)
              }}
            >
              Sıfırla
            </button>
          )}
        </div>
      </div>

      <div className="resort-layout">
        {/* SVG Plan */}
        <div className="resort-svg-wrapper">
          <svg
            viewBox="0 0 960 710"
            className="resort-svg"
            aria-label="Fitness tatil köyü mekan planı SVG"
          >
            <defs>
              <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="0" cy="0" r="0.8" fill="rgba(255,255,255,0.06)" />
              </pattern>
              <ArrowMarker id="arrowYellow" color="#f5c84c" />
              <ArrowMarker id="arrowWhite"  color="rgba(255,255,255,0.45)" />
              <ArrowMarker id="arrowRed"    color="#e05252" />
              <ArrowMarker id="arrowBlue"   color="#3b9fd4" />
              <ArrowMarker id="arrowGreen"  color="#5a8a3c" />
            </defs>

            <rect width="960" height="710" fill="url(#grid-dots)" />

            {/* Connections — drawn behind zones */}
            {showFlows &&
              CONNECTIONS.map((conn, i) => {
                const fz = ZONE_MAP[conn.from]
                const tz = ZONE_MAP[conn.to]
                if (!fz || !tz) return null
                const [x1, y1] = zoneCenter(fz)
                const [x2, y2] = zoneCenter(tz)
                const style = PATH_STYLES[conn.type]
                const dimmed = isConnDimmed(conn)
                const highlighted = activeZone &&
                  (conn.from === activeZone || conn.to === activeZone)

                return (
                  <line
                    key={i}
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke={style.stroke}
                    strokeWidth={highlighted ? style.width * 2 : style.width}
                    strokeOpacity={dimmed ? 0.06 : style.opacity}
                    strokeDasharray={style.dash}
                    markerEnd={`url(${ARROW_MARKERS[conn.type]})`}
                    className={`rpath rpath-${conn.type}`}
                  />
                )
              })}

            {/* Zones */}
            {ZONES.map((zone) => {
              const dimmed = isZoneDimmed(zone)
              const isActive = zone.id === activeZone
              const [cx, cy] = zoneCenter(zone)

              return (
                <g
                  key={zone.id}
                  onClick={() => handleZoneClick(zone.id)}
                  className="rzone"
                  opacity={dimmed ? 0.18 : 1}
                >
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.w}
                    height={zone.h}
                    rx={14}
                    fill={zone.color}
                    fillOpacity={isActive ? 1 : 0.82}
                    stroke={isActive ? '#fff' : zone.color}
                    strokeWidth={isActive ? 3 : 0.5}
                    strokeOpacity={isActive ? 1 : 0.3}
                  />
                  <text
                    x={cx}
                    y={zone.h > 90 ? cy - 8 : cy - 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={zone.textColor}
                    fontSize={zone.h < 80 ? 13 : 14}
                    fontWeight="700"
                    fontFamily="Inter, system-ui, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {zone.label}
                  </text>
                  {zone.h > 70 && (
                    <text
                      x={cx}
                      y={zone.h > 90 ? cy + 10 : cy + 9}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={zone.textColor}
                      fontSize={10}
                      fontWeight="400"
                      opacity={0.6}
                      fontFamily="Inter, system-ui, sans-serif"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {zone.sublabel}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Side panel */}
        <div className="resort-side">
          {active ? (
            <ZoneDetailPanel
              zone={active}
              onClose={() => setActiveZone(null)}
              onNavigate={handleZoneClick}
            />
          ) : (
            <>
              <div className="resort-tabs">
                {['zones', 'flows', 'circuits'].map((t) => (
                  <button
                    key={t}
                    className={`resort-tab ${tab === t ? 'active' : ''}`}
                    onClick={() => setTab(t)}
                  >
                    {{ zones: 'Bölgeler', flows: 'Dağılım', circuits: 'Döngüler' }[t]}
                  </button>
                ))}
              </div>

              {tab === 'zones' && (
                <div className="card resort-panel">
                  <h3>Bölge Tipleri</h3>
                  <div className="resort-legend-list">
                    {Object.entries(TYPE_META).map(([type, meta]) => (
                      <button
                        key={type}
                        className={`resort-legend-item ${highlightType === type ? 'active' : ''}`}
                        onClick={() =>
                          setHighlightType((prev) => (prev === type ? null : type))
                        }
                      >
                        <span
                          className="resort-legend-dot"
                          style={{ background: meta.color }}
                        />
                        <span>{meta.label}</span>
                        <span className="resort-legend-count">
                          {ZONES.filter((z) => z.type === type).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="resort-hint">Bir tipe tıkla → haritada vurgula</p>
                </div>
              )}

              {tab === 'flows' && (
                <div className="card resort-panel">
                  <h3>Fonksiyon Dağılımı</h3>
                  <div className="resort-dist-list">
                    {FUNCTION_DIST.map((d) => (
                      <div key={d.label} className="resort-dist-row">
                        <span className="resort-dist-label">{d.label}</span>
                        <div className="resort-dist-bar">
                          <div
                            className="resort-dist-fill"
                            style={{ width: `${d.pct}%`, background: d.color }}
                          />
                        </div>
                        <span className="resort-dist-pct">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="resort-divider" />
                  <h3>Akış Hatları</h3>
                  <div className="resort-legend-list">
                    {FLOW_LEGEND.map(({ type, label }) => {
                      const s = PATH_STYLES[type]
                      return (
                        <div key={type} className="resort-legend-item">
                          <svg width="38" height="8" viewBox="0 0 38 8">
                            <line
                              x1="0" y1="4" x2="38" y2="4"
                              stroke={s.stroke}
                              strokeWidth={Math.min(s.width, 2.5)}
                              strokeDasharray={s.dash}
                            />
                          </svg>
                          <span>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {tab === 'circuits' && (
                <div className="card resort-panel">
                  <h3>Günlük Yaya Döngüleri</h3>
                  <div className="resort-circuit-list">
                    {DAILY_CIRCUITS.map((circuit) => (
                      <button
                        key={circuit.id}
                        className={`resort-circuit-item ${activeCircuit === circuit.id ? 'active' : ''}`}
                        style={{
                          borderColor:
                            activeCircuit === circuit.id ? circuit.color : undefined,
                        }}
                        onClick={() =>
                          setActiveCircuit((prev) =>
                            prev === circuit.id ? null : circuit.id,
                          )
                        }
                      >
                        <span
                          className="resort-circuit-dot"
                          style={{ background: circuit.color }}
                        />
                        <div>
                          <span className="resort-circuit-name">{circuit.label}</span>
                          <span className="resort-circuit-path">
                            {circuit.path
                              .map((id) => ZONE_MAP[id]?.label ?? id)
                              .join(' → ')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="resort-hint">Bir döngüye tıkla → haritada rotayı vurgula</p>
                </div>
              )}

              <div className="card resort-panel resort-hint-card">
                <p className="eyebrow">Nasıl Kullanılır</p>
                <ul className="resort-help-list">
                  <li>Bölgeye tıkla → detay + bağlantılar</li>
                  <li>Bölge tipi filtrele → haritada vurgula</li>
                  <li>Günlük döngü seç → rotayı gör</li>
                  <li>Akışları kapat → sade plan görünümü</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function ZoneDetailPanel({ zone, onClose, onNavigate }) {
  const connectedZones = CONNECTIONS.filter(
    (c) => c.from === zone.id || c.to === zone.id,
  )

  return (
    <div className="card resort-panel resort-detail-panel">
      <div className="resort-detail-top">
        <span
          className="resort-type-badge"
          style={{
            background: zone.color + '22',
            color: zone.color,
            borderColor: zone.color + '44',
          }}
        >
          {TYPE_META[zone.type]?.label}
        </span>
        <button className="resort-close-btn" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
      </div>
      <h3>{zone.label}</h3>
      <p className="resort-detail-desc">{zone.desc}</p>

      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Fonksiyonlar</p>
        <div className="chip-row">
          {zone.fns.map((fn) => (
            <span key={fn} className="chip">{fn}</span>
          ))}
        </div>
      </div>

      {connectedZones.length > 0 && (
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Bağlı Alanlar</p>
          <div className="resort-conn-list">
            {connectedZones.map((conn) => {
              const otherId = conn.from === zone.id ? conn.to : conn.from
              const other = ZONE_MAP[otherId]
              if (!other) return null
              const direction = conn.from === zone.id ? '→' : '←'
              return (
                <button
                  key={conn.label}
                  className="resort-conn-item"
                  onClick={() => onNavigate(otherId)}
                >
                  <span
                    className="resort-conn-dot"
                    style={{ background: other.color }}
                  />
                  <span className="resort-conn-label">{conn.label}</span>
                  <span className="resort-conn-target">
                    {direction} {other.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
