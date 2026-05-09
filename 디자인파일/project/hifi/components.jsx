// Shared hi-fi components
function SectionHeader({ num, title, sub }) {
  return (
    <div className="section-header">
      <span className="num">{num}</span>
      <h2>{title}</h2>
      <span className="sub">{sub}</span>
    </div>
  );
}

function Screen({ label, children }) {
  return (
    <div>
      <div className="frame-label">{label}</div>
      <div className="phone">
        <div className="notch" />
        <div className="status">
          <span>9:41</span>
          <span className="row gap-1 ic-1">
            <Ico name="signal" /><Ico name="wifi" /><Ico name="battery" />
          </span>
        </div>
        <div className="body">{children}</div>
        <div className="home-ind" />
      </div>
    </div>
  );
}

// Simple inline icons (monoline)
function Ico({ name, size = 14, color = 'currentColor' }) {
  const map = {
    signal: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
        <rect x="1" y="10" width="2" height="3" rx="0.5"/>
        <rect x="5" y="7" width="2" height="6" rx="0.5"/>
        <rect x="9" y="4" width="2" height="9" rx="0.5"/>
        <rect x="13" y="1" width="2" height="12" rx="0.5"/>
      </svg>
    ),
    wifi: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M1 5a10 10 0 0114 0M3 8a7 7 0 0110 0M5 11a4 4 0 016 0"/>
        <circle cx="8" cy="13.5" r="0.8" fill={color}/>
      </svg>
    ),
    battery: (
      <svg width={size * 1.8} height={size} viewBox="0 0 24 12" fill="none">
        <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={color}/>
        <rect x="2" y="2" width="18" height="8" rx="1.5" fill={color}/>
        <rect x="22" y="4" width="2" height="4" rx="0.5" fill={color} opacity="0.4"/>
      </svg>
    ),
    chevron: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M6 4l4 4-4 4"/>
      </svg>
    ),
    back: (
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5l-5 5 5 5"/>
      </svg>
    ),
    close: (
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M5 5l10 10M15 5l-10 10"/>
      </svg>
    ),
    plus: (
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M10 4v12M4 10h12"/>
      </svg>
    ),
    search: (
      <svg width={size+2} height={size+2} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="8" cy="8" r="5.5"/>
        <path d="M12 12l4 4"/>
      </svg>
    ),
    bell: (
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3a5 5 0 015 5v4l1.5 2.5h-13L5 12V8a5 5 0 015-5z"/>
        <path d="M8 16a2 2 0 004 0"/>
      </svg>
    ),
    doc: (
      <svg width={size+8} height={size+8} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z"/>
        <path d="M14 3v5h5M9 13h6M9 17h6"/>
      </svg>
    ),
    camera: (
      <svg width={size+8} height={size+8} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h4l2-3h6l2 3h4v12H3V7z"/>
        <circle cx="12" cy="13" r="3.5"/>
      </svg>
    ),
    sparkle: (
      <svg width={size+2} height={size+2} viewBox="0 0 18 18" fill={color}>
        <path d="M9 1l1.5 5.5L16 8l-5.5 1.5L9 15l-1.5-5.5L2 8l5.5-1.5L9 1z"/>
      </svg>
    ),
    copy: (
      <svg width={size+2} height={size+2} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="6" width="10" height="10" rx="1.5"/>
        <path d="M12 6V4a1 1 0 00-1-1H3a1 1 0 00-1 1v8a1 1 0 001 1h2"/>
      </svg>
    ),
    share: (
      <svg width={size+2} height={size+2} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2v10M5 6l4-4 4 4M4 11v4a1 1 0 001 1h8a1 1 0 001-1v-4"/>
      </svg>
    ),
    eye: (
      <svg width={size+2} height={size+2} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
        <circle cx="9" cy="9" r="2.5"/>
      </svg>
    ),
    avatar: (
      <svg width={size+14} height={size+14} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#eaf1fd"/>
        <circle cx="16" cy="13" r="5" fill="#1b64da"/>
        <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="#1b64da"/>
      </svg>
    ),
    dot3: (
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill={color}>
        <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
      </svg>
    ),
    edit: (
      <svg width={size+8} height={size+8} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17v4h4l11-11-4-4L3 17z"/>
        <path d="M14 6l4 4"/>
      </svg>
    ),
    shield: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1l6 2.5V8c0 3.5-2.5 6-6 7-3.5-1-6-3.5-6-7V3.5L8 1z"/>
        <path d="M5.5 8l2 2 3-3.5"/>
      </svg>
    ),
    settings: (
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="2.5"/>
        <path d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9L4.5 4.5"/>
      </svg>
    ),
    moon: (
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 11.5A6.5 6.5 0 018.5 5a6.5 6.5 0 108.5 8.5c-.9.2-1.8 0-2-2z"/>
      </svg>
    ),
    sun: (
      <svg width={size+4} height={size+4} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
        <circle cx="10" cy="10" r="3.5"/>
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.5 1.5M14 14l1.5 1.5M15.5 4.5L14 6M6 14l-1.5 1.5"/>
      </svg>
    ),
  };
  return map[name] || null;
}

// Tab bar used in screens
function TabBar({ active = 'home' }) {
  const items = [
    { id: 'home', t: '홈' },
    { id: 'analyze', t: '분석' },
    { id: 'feed', t: '법률팁' },
    { id: 'me', t: '내 정보' },
  ];
  return (
    <div className="tab-bar">
      {items.map(it => (
        <div key={it.id} className={`t ${it.id === active ? 'on' : ''}`}>
          <div className="ic" />
          <div>{it.t}</div>
        </div>
      ))}
    </div>
  );
}

function RiskTag({ level }) {
  const map = { hi: { cls: 'risk-hi', t: '주의 필요' }, md: { cls: 'risk-md', t: '확인 권장' }, lo: { cls: 'risk-lo', t: '안전' } };
  const m = map[level];
  return <span className={`risk-tag ${m.cls}`}>{m.t}</span>;
}

Object.assign(window, { SectionHeader, Screen, Ico, TabBar, RiskTag });
