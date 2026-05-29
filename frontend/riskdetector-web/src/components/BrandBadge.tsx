import Image from 'next/image';

/**
 * 브랜드 마크. 파란 뱃지 안에 아르디 마스코트를 넣어
 * 로그인/인증 다이얼로그/내비게이션 등에서 일관되게 사용한다.
 */
export default function BrandBadge({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`rd-brand-badge ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.29) }}
    >
      <Image
        src="/ardi/ardi-head.png"
        alt="아르디"
        width={size}
        height={size}
        className="h-[82%] w-[82%] object-contain"
        priority
      />
    </span>
  );
}
