import './App.css'
import { useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const RESULT_STORAGE_KEY = 'apinex-review-result'

const samplePayload = {
  product: 'Drift',
  reviews: [
    {
      source: 'G2',
      rating: 2,
      title: 'Powerful but expensive',
      body: 'The platform is powerful but pricing is too expensive and setup is confusing for our small team.',
    },
    {
      source: 'Capterra',
      rating: 3,
      title: 'Good features, hard implementation',
      body: 'Implementation took too long and the configuration felt complex. Support was also slow.',
    },
    {
      source: 'TrustRadius',
      rating: 2,
      title: 'Reporting is limited',
      body: 'Analytics and reporting are limited, and CRM integration caused multiple issues during onboarding.',
    },
    {
      source: 'Reddit',
      rating: 1,
      title: 'Terrible setup',
      body: 'Absolute nightmare.',
    },
  ],
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Data / Analytics AI</p>
            <h1>APINEX v1</h1>
          </div>
          <nav className="nav-links">
            <Link to="/">Ana Sayfa</Link>
            <Link to="/review">Review Analyze</Link>
            <Link to="/results">Sonuc</Link>
            <Link to="/scout">Scout</Link>
          </nav>
        </header>

        <main className="page-shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/review" element={<ReviewAnalyzePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/scout" element={<ScoutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function HomePage() {
  return (
    <section className="page-grid">
      <div className="hero-card">
        <p className="eyebrow">Canliya cikis odagi</p>
        <h2>APINEX su anda iki cekirdekle ilerliyor.</h2>
        <p>
          PainHive yorumlardan aci noktasi ve firsat cikarir. Scout Bee ise Product Hunt
          uzerinden pazar sinyali toplar.
        </p>
        <div className="cta-row">
          <Link className="primary-button" to="/review">
            Review Analyze ekranina git
          </Link>
          <Link className="secondary-button" to="/scout">
            Scout ekranina git
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>V1 hedefi</h3>
        <ul className="simple-list">
          <li>Yorum verisini al</li>
          <li>Aci noktasini goster</li>
          <li>Firsati ozetle</li>
          <li>Scout sinyallerini listele</li>
        </ul>
      </div>
    </section>
  )
}

function ReviewAnalyzePage() {
  const navigate = useNavigate()
  const [product, setProduct] = useState(samplePayload.product)
  const [reviewsJson, setReviewsJson] = useState(JSON.stringify(samplePayload.reviews, null, 2))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const reviews = JSON.parse(reviewsJson)
      const response = await fetch(`${API_BASE_URL}/api/review-engine/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product, reviews }),
      })

      const payload = await response.json()

      if (!response.ok) {
        const detailText = payload?.hata?.detaylar?.map((item) => item.mesaj).join(' ') || ''
        throw new Error(`${payload?.hata?.mesaj || 'Analiz istegi basarisiz oldu.'} ${detailText}`.trim())
      }

      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(payload))
      navigate('/results', { state: { result: payload } })
    } catch (submitError) {
      setError(submitError.message || 'Analiz sirasinda beklenmeyen bir hata olustu.')
    } finally {
      setLoading(false)
    }
  }

  function loadSample() {
    setProduct(samplePayload.product)
    setReviewsJson(JSON.stringify(samplePayload.reviews, null, 2))
    setError('')
  }

  return (
    <section className="page-grid">
      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="card-header">
          <div>
            <p className="eyebrow">PainHive</p>
            <h2>Review Analyze</h2>
          </div>
          <button type="button" className="secondary-button" onClick={loadSample}>
            Ornek veri yukle
          </button>
        </div>

        <label className="field">
          <span>Urun adi</span>
          <input value={product} onChange={(event) => setProduct(event.target.value)} />
        </label>

        <label className="field">
          <span>Reviews JSON</span>
          <textarea
            rows="18"
            value={reviewsJson}
            onChange={(event) => setReviewsJson(event.target.value)}
          />
        </label>

        {error ? <p className="error-box">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Analiz ediliyor...' : 'Analiz et'}
        </button>
      </form>

      <div className="card">
        <h3>Bu ekran ne yapar?</h3>
        <ul className="simple-list">
          <li>Yorumlari API&apos;ye yollar</li>
          <li>Dogrulama hatalarini gosterir</li>
          <li>Basarili sonucu Sonuc ekranina tasir</li>
        </ul>
      </div>
    </section>
  )
}

function ResultsPage() {
  const location = useLocation()
  const [result] = useState(() => {
    if (location.state?.result) {
      return location.state.result
    }

    const cached = sessionStorage.getItem(RESULT_STORAGE_KEY)
    return cached ? JSON.parse(cached) : null
  })

  const report = result?.veri

  if (!report) {
    return (
      <section className="page-grid">
        <div className="card">
          <h2>Henuz analiz sonucu yok</h2>
          <p>Once Review Analyze ekranindan bir analiz calistir.</p>
          <Link className="primary-button inline-button" to="/review">
            Review Analyze ekranina git
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="results-grid">
      <SummaryCard report={report} />
      <PainPointsCard report={report} />
      <OpportunitiesCard report={report} />
      <QuarantineCard report={report} />
      <SecondaryReviewCard report={report} />
    </section>
  )
}

function ScoutPage() {
  const [mode, setMode] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)

  const endpoint = useMemo(() => {
    return mode === 'basic'
      ? `${API_BASE_URL}/api/scout/producthunt`
      : `${API_BASE_URL}/api/scout/producthunt/detayli-incele`
  }, [mode])

  async function runScout(targetMode) {
    setMode(targetMode)
    setError('')
    setLoading(true)

    try {
      const response = await fetch(targetMode === 'basic'
        ? `${API_BASE_URL}/api/scout/producthunt`
        : `${API_BASE_URL}/api/scout/producthunt/detayli-incele`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.hata?.mesaj || 'Scout istegi basarisiz oldu.')
      }

      setPayload(data)
    } catch (requestError) {
      setError(requestError.message || 'Scout istegi basarisiz oldu.')
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }

  const scoutData = payload?.veri

  return (
    <section className="page-grid">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Scout Bee</p>
            <h2>Product Hunt tarama</h2>
          </div>
          <code>{endpoint}</code>
        </div>

        <div className="cta-row">
          <button className="primary-button" onClick={() => runScout('basic')} disabled={loading}>
            Temel tarama
          </button>
          <button className="secondary-button" onClick={() => runScout('detail')} disabled={loading}>
            Detayli inceleme
          </button>
        </div>

        {loading ? <p>Scout verisi getiriliyor...</p> : null}
        {error ? <p className="error-box">{error}</p> : null}

        {scoutData ? (
          <div className="scout-output">
            <div className="stat-row">
              <StatCard label="Kaynak" value={scoutData.kaynak || 'Product Hunt'} />
              <StatCard
                label="Kayit"
                value={String(scoutData.kayit_sayisi || scoutData.eslesen_kayit_sayisi || 0)}
              />
              <StatCard
                label="Taranan"
                value={String(scoutData.taranan_kayit_sayisi || scoutData.kayit_sayisi || 0)}
              />
            </div>

            <div className="card compact-card">
              <h3>Veri ozeti</h3>
              <pre>{JSON.stringify(scoutData, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function SummaryCard({ report }) {
  return (
    <div className="card">
      <p className="eyebrow">Sonuc ozeti</p>
      <h2>{report.urun}</h2>
      <p>{report.yonetici_ozeti}</p>
      <div className="stat-row">
        <StatCard label="Toplam yorum" value={String(report.toplam_yorum)} />
        <StatCard label="Islenen" value={String(report.islenen_yorum)} />
        <StatCard label="Temizlik" value={`${report.veri_temizligi_skoru}`} />
      </div>
    </div>
  )
}

function PainPointsCard({ report }) {
  return (
    <div className="card">
      <h3>Baskin aci noktalari</h3>
      <div className="stack">
        {report.baskin_aci_noktalari.map((item) => (
          <div key={item.tag} className="panel">
            <strong>{item.etiket}</strong>
            <p>{item.is_etkisi}</p>
            <small>Tekrar: {item.tekrar_sayisi} | Siddet: {item.siddet_skoru}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function OpportunitiesCard({ report }) {
  return (
    <div className="card">
      <h3>Eyleme donuk firsatlar</h3>
      <div className="stack">
        {report.eyleme_donuk_firsatlar.map((item) => (
          <div key={item.tag} className="panel">
            <strong>{item.etiket}</strong>
            <p>{item.firsat}</p>
            <p>{item.deger_onerisi}</p>
            <small>Oncelik: {item.oncelik_seviyesi}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuarantineCard({ report }) {
  return (
    <div className="card">
      <h3>Karantina havuzu</h3>
      {report.karantina_havuzu.length === 0 ? (
        <p>Karantinaya dusen yorum yok.</p>
      ) : (
        <div className="stack">
          {report.karantina_havuzu.map((item) => (
            <div key={item.id} className="panel">
              <strong>{item.baslik || item.kaynak}</strong>
              <p>{item.alinti}</p>
              <small>
                Kaynak: {item.kaynak} | Puan: {item.puan} | Durum: {item.inceleme_durumu}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SecondaryReviewCard({ report }) {
  return (
    <div className="card">
      <h3>Ikincil inceleme ozeti</h3>
      <p>{report.ikincil_inceleme_ozeti.ana_rapora_not}</p>
      <div className="stat-row">
        <StatCard label="Baskin duygu" value={report.ikincil_inceleme_ozeti.baskin_duygu} />
        <StatCard label="Baskin sinyal" value={report.ikincil_inceleme_ozeti.baskin_sinyal} />
      </div>
      <div className="chip-row">
        {report.karantina_sinyal_etiketleri.map((item) => (
          <span key={item} className="chip">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
