-- =============================================
-- RiskDetector Database Schema
-- PostgreSQL
-- =============================================

CREATE SCHEMA IF NOT EXISTS prod;

-- users 테이블
CREATE TABLE IF NOT EXISTS prod.users (
    id         BIGSERIAL    PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255),                    -- 이메일 로그인용
    name       VARCHAR(100),
    picture    VARCHAR(500),                    -- OAuth 프로필 이미지
    provider   VARCHAR(50),                     -- 'google', 'kakao' 등 OAuth 제공자
    created_at TIMESTAMP    DEFAULT NOW(),
    updated_at TIMESTAMP    DEFAULT NOW()
);

-- contracts 테이블
CREATE TABLE IF NOT EXISTS prod.contracts (
    id              VARCHAR(50)  PRIMARY KEY,   -- UUID
    user_id         BIGINT       REFERENCES prod.users(id),
    title           VARCHAR(500),
    contract_type   VARCHAR(50),                -- RENTAL, EMPLOYMENT
    guest_session_id VARCHAR(100),               -- 비로그인 PWA 세션
    s3_key_prefix   VARCHAR(500),
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

ALTER TABLE prod.contracts ADD COLUMN IF NOT EXISTS guest_session_id VARCHAR(100);

-- ocr_content 테이블
CREATE TABLE IF NOT EXISTS prod.ocr_content (
    id          VARCHAR(50)  PRIMARY KEY,
    contract_id VARCHAR(50)  REFERENCES prod.contracts(id) ON DELETE CASCADE,
    content     TEXT,
    category    VARCHAR(100),
    tag_idx     INTEGER,                        -- 정렬용 인덱스
    created_at  TIMESTAMP    DEFAULT NOW()
);

-- contract_analyses 테이블
CREATE TABLE IF NOT EXISTS prod.contract_analyses (
    id                     VARCHAR(50)  PRIMARY KEY,
    contract_id            VARCHAR(50)  REFERENCES prod.contracts(id) ON DELETE CASCADE,
    summary                TEXT,
    status                 VARCHAR(50),         -- 'success', 'error'
    process_status         VARCHAR(50),         -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    riskdetector_overall_comment TEXT,
    riskdetector_warning_comment TEXT,
    riskdetector_advice          TEXT,
    created_at             TIMESTAMP    DEFAULT NOW(),
    updated_at             TIMESTAMP    DEFAULT NOW()
);

-- toxic_clauses 테이블
CREATE TABLE IF NOT EXISTS prod.toxic_clauses (
    id                      VARCHAR(50)  PRIMARY KEY,
    analysis_id             VARCHAR(50)  REFERENCES prod.contract_analyses(id) ON DELETE CASCADE,
    title                   VARCHAR(500),
    clause                  TEXT,
    reason                  TEXT,
    suggestion              TEXT,
    reason_reference        TEXT,
    source_contract_tag_idx INTEGER,
    warn_level              INTEGER,            -- 1(낮음) ~ 3(높음)
    created_at              TIMESTAMP    DEFAULT NOW()
);

ALTER TABLE prod.toxic_clauses ADD COLUMN IF NOT EXISTS suggestion TEXT;

-- legal_tips 테이블
CREATE TABLE IF NOT EXISTS prod.legal_tips (
    id          BIGSERIAL PRIMARY KEY,
    source_id   VARCHAR(100) UNIQUE NOT NULL,
    category    VARCHAR(255) NOT NULL,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    source_url  TEXT,
    view_count  BIGINT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- legal_tip_bookmarks 테이블
CREATE TABLE IF NOT EXISTS prod.legal_tip_bookmarks (
    id               BIGSERIAL PRIMARY KEY,
    tip_id           BIGINT REFERENCES prod.legal_tips(id) ON DELETE CASCADE,
    user_id          BIGINT REFERENCES prod.users(id) ON DELETE CASCADE,
    guest_session_id VARCHAR(100),
    created_at       TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 인덱스
-- =============================================

CREATE INDEX IF NOT EXISTS idx_contracts_user_id        ON prod.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_guest_session_id ON prod.contracts(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_ocr_content_contract_id  ON prod.ocr_content(contract_id);
CREATE INDEX IF NOT EXISTS idx_analyses_contract_id     ON prod.contract_analyses(contract_id);
CREATE INDEX IF NOT EXISTS idx_toxic_clauses_analysis_id ON prod.toxic_clauses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_legal_tips_category ON prod.legal_tips(category);
CREATE INDEX IF NOT EXISTS idx_legal_tip_bookmarks_tip_id ON prod.legal_tip_bookmarks(tip_id);
CREATE INDEX IF NOT EXISTS idx_legal_tip_bookmarks_user_id ON prod.legal_tip_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_tip_bookmarks_guest_session_id ON prod.legal_tip_bookmarks(guest_session_id);
