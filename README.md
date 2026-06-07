# RiskDetector

계약서를 업로드하면 OCR과 AI 분석으로 독소조항, 위험 근거, 수정 제안을 정리해주는 계약서 위험 탐지 서비스입니다.

<p align="center">
  <a href="https://riskdetectorpeuronteuendeu.onrender.com"><strong>서비스 바로가기</strong></a>
  ·
  <a href="https://lilchaewon.github.io/RiskDetector/aboutRD/">GitHub Pages 소개 페이지</a>
</p>

<p align="center">
  <img src="./aboutRD/assets/ardi/ardi-hero.png" alt="RiskDetector mascot Ardi" width="260" />
</p>

## About

RiskDetector는 계약서를 혼자 읽기 어려운 사용자를 위해 만들어졌습니다. PDF, 이미지, 사진 속 계약서를 텍스트로 변환하고, 임대차·근로·용역 계약서에서 놓치기 쉬운 위험 조항을 찾아 읽기 쉬운 분석 결과로 보여줍니다.

## 주요 기능

- 계약서 PDF, 이미지, 사진 업로드
- OCR 기반 계약서 텍스트 추출
- 독소조항 탐지와 위험도 분류
- 위험 근거와 수정 제안 제공
- 아르디 챗봇을 통한 조항별 쉬운 설명
- 생활 법률 팁 피드와 분석 기록 관리

## 프로젝트 구조

```text
RiskDetector/
├─ aboutRD/                  # GitHub Pages용 소개 페이지
├─ frontend/riskdetector-web # Next.js 프론트엔드
├─ backend_core/             # Spring Boot 백엔드
├─ backend_ai/               # AI/OCR Lambda 및 분석 로직
├─ ai_rag/                   # 법률 문서 RAG 데이터 파이프라인
└─ supabase/                 # Supabase 설정과 마이그레이션
```

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Spring Boot, Java, Supabase |
| AI / OCR | AWS Lambda, Bedrock, RAG pipeline |
| Data | 법령·판례·생활법률 데이터 |
| Deployment | Render, GitHub Pages |

## GitHub Pages

소개 페이지는 `aboutRD` 폴더에 정적 HTML/CSS/JS로 구성되어 있습니다. 저장소의 GitHub Pages 설정을 `main` 브랜치 기준으로 켜면 아래 주소에서 확인할 수 있습니다.

```text
https://lilchaewon.github.io/RiskDetector/aboutRD/
```

## Team

RiskDetector는 사용자가 계약 전 위험을 더 쉽게 확인할 수 있도록 만드는 AI 계약서 분석 프로젝트입니다.
