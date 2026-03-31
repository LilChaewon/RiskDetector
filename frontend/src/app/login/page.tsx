"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock API 연동
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("아이디와 비밀번호를 입력해주세요.");
    
    setLoading(true);
    try {
      await login({ email, password });
      router.push("/select-type"); // 로그인 성공 시 계약서 종류 선택 화면으로 이동
    } catch (error) {
      alert("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="sidebar-logo-icon" style={{ margin: "0 auto 16px" }}>🔍</div>
          <h1 className="page-title">RiskDetector</h1>
          <p className="page-subtitle">계약서 위험 탐지 시스템 로그인</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              type="email"
              className="form-select"
              style={{ background: "transparent" }}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              className="form-select"
              style={{ background: "transparent" }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "16px", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? "로딩 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
