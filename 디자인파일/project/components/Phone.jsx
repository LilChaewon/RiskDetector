// Simple lo-fi phone shell used across the wireframes.
function Phone({ label, children, time = '9:41' }) {
  return (
    <div className="col gap-2">
      {label && <div className="frame-label">{label}</div>}
      <div className="phone">
        <div className="notch" />
        <div className="status">
          <span>{time}</span>
          <span>● ● ●</span>
        </div>
        <div className="body no-scroll">{children}</div>
        <div className="home-ind" />
      </div>
    </div>
  );
}

function TabBar({ active = 'home' }) {
  const items = [
    { id: 'home', label: '홈' },
    { id: 'upload', label: '분석' },
    { id: 'feed', label: '법률팁' },
    { id: 'me', label: '나' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      height: 56, borderTop: '1.5px solid var(--ink)',
      background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 10px 6px',
    }}>
      {items.map(it => (
        <div key={it.id} className="col center" style={{ gap: 4, flex: 1 }}>
          <div className="box-soft" style={{
            width: 22, height: 22, borderRadius: 6,
            background: active === it.id ? 'var(--ink)' : 'transparent',
            borderColor: 'var(--ink)',
          }} />
          <div style={{ fontSize: 10, fontWeight: active === it.id ? 700 : 400, color: active === it.id ? 'var(--ink)' : 'var(--ink-3)' }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function RiskTag({ level }) {
  const map = {
    hi: { cls: 'risk-hi', label: '높음' },
    md: { cls: 'risk-md', label: '중간' },
    lo: { cls: 'risk-lo', label: '낮음' },
  };
  const m = map[level];
  return <span className={`risk-tag ${m.cls}`}>● {m.label}</span>;
}

function Ph({ w = '100%', h = 80, text = 'image' }) {
  return <div className="ph" style={{ width: w, height: h }}>{text}</div>;
}

function SectionHeader({ num, title, sub }) {
  return (
    <div className="section-title">
      <span className="num">{num}</span>
      <h2>{title}</h2>
      <span className="sub">{sub}</span>
    </div>
  );
}

function Variation({ tag, title, note, children }) {
  return (
    <div className="variation">
      <div className="cap"><span className="tag">{tag}</span><span>{title}</span></div>
      {children}
      {note && <div className="note">{note}</div>}
    </div>
  );
}

Object.assign(window, { Phone, TabBar, RiskTag, Ph, SectionHeader, Variation });
