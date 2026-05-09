export function riskMeta(level?: number) {
  if ((level || 0) >= 3) return { label: '주의 필요', className: 'rd-risk-hi' };
  if ((level || 0) === 2) return { label: '확인 권장', className: 'rd-risk-md' };
  return { label: '안전', className: 'rd-risk-lo' };
}

export default function RiskTag({ level }: { level?: number }) {
  const meta = riskMeta(level);
  return <span className={`rd-risk-tag ${meta.className}`}>{meta.label}</span>;
}
