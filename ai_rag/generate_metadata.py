import json
import re
from pathlib import Path

# Bedrock KB 필터에서 사용 가능한 법령 키워드 화이트리스트
KNOWN_LAWS = (
    "주택임대차보호법",
    "상가건물 임대차보호법",
    "근로기준법",
    "최저임금법",
    "민법",
    "상법",
    "대중문화예술산업발전법",
    "공인중개사법",
    "부동산 거래신고 등에 관한 법률",
    "남녀고용평등과 일·가정 양립 지원에 관한 법률",
    "기간제 및 단시간근로자 보호 등에 관한 법률",
)

# 카테고리(생활법령 분류) 정규화 맵
CATEGORY_TO_CONTRACT_TYPE = {
    "임대차": "lease",
    "부동산": "lease",
    "전세": "lease",
    "월세": "lease",
    "근로": "labor",
    "노동": "labor",
    "임금": "labor",
    "퇴직": "labor",
    "연예": "entertainment",
    "엔터": "entertainment",
}


def infer_contract_type(text: str) -> str:
    """텍스트 내 키워드 기반으로 계약 종류를 추론합니다."""
    head = text[:2000].replace(" ", "").replace("\n", "")
    if any(k in head for k in ("전속계약", "매니지먼트", "엔터테인먼트", "대중문화예술인")):
        return "entertainment"
    if any(k in head for k in ("근로계약", "연봉계약", "취업규칙", "근로기준법")):
        return "labor"
    if any(k in head for k in ("임대차", "전세", "월세", "부동산", "임대인", "임차인")):
        return "lease"
    return "unknown"


def extract_source_type(file_path: Path, text: str) -> str:
    """파일명/경로/내용 기반으로 자료 종류를 분류합니다."""
    name = file_path.name.lower()
    parent = str(file_path.parent).lower()
    if name.startswith("precedent_") or "precedent" in parent:
        return "precedent"
    if name.startswith("qa_") or "easylaw" in parent or "질문:" in text[:200]:
        return "qa"
    if "law_open_api" in parent:
        return "law"
    return "unknown"


def extract_law_names(text: str) -> list[str]:
    """본문에 등장하는 알려진 법령명을 모두 추출합니다."""
    found = []
    head = text[:8000]
    for law in KNOWN_LAWS:
        if law in head and law not in found:
            found.append(law)
    return found


def extract_case_number(text: str) -> str:
    head = text[:1500]
    labeled = re.search(r"사건번호[:\s]+([^\s\n]+)", head)
    if labeled:
        return labeled.group(1).strip()
    bare = re.search(r"([0-9]{2,4}[가-힣]{1,6}[0-9]{1,10})", head)
    return bare.group(1) if bare else ""


def extract_judgment_year(text: str) -> int:
    """선고일자에서 연도만 정수로 추출. 없으면 0."""
    head = text[:1500]
    match = re.search(r"선고일자[:\s]+([0-9]{4})", head)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return 0
    iso = re.search(r"\b(19|20)([0-9]{2})\.\s*[0-9]{1,2}\.\s*[0-9]{1,2}\b", head)
    if iso:
        try:
            return int(iso.group(1) + iso.group(2))
        except ValueError:
            return 0
    return 0


def extract_court_name(text: str) -> str:
    head = text[:1500]
    labeled = re.search(r"법원명[:\s]+([^\n]+)", head)
    if labeled:
        name = labeled.group(1).strip()
        if name and name != "":
            return name
    case_no = extract_case_number(text)
    if "대법원" in case_no:
        return "대법원"
    if "고등법원" in case_no or "고법" in case_no:
        return "고등법원"
    if "지방법원" in case_no or "지법" in case_no:
        return "지방법원"
    return ""


def extract_category(text: str) -> str:
    head = text[:3000]
    match = re.search(r"카테고리[:\s]+([^\n]+)", head)
    if not match:
        return ""
    return match.group(1).strip()


def normalize_contract_type_from_category(category: str, fallback: str) -> str:
    if not category:
        return fallback
    for keyword, mapped in CATEGORY_TO_CONTRACT_TYPE.items():
        if keyword in category:
            return mapped
    return fallback


def build_metadata(file_path: Path, content: str) -> dict:
    source_type = extract_source_type(file_path, content)
    category = extract_category(content) if source_type == "qa" else ""
    contract_type = normalize_contract_type_from_category(
        category=category,
        fallback=infer_contract_type(content),
    )

    attributes: dict[str, object] = {
        "contract_type": contract_type,
        "source_type": source_type,
        "source_file": file_path.name,
    }

    law_names = extract_law_names(content)
    if law_names:
        attributes["law_names"] = law_names
        attributes["primary_law"] = law_names[0]

    if source_type == "precedent":
        case_number = extract_case_number(content)
        if case_number:
            attributes["case_number"] = case_number
        judgment_year = extract_judgment_year(content)
        if judgment_year:
            attributes["judgment_year"] = judgment_year
        court = extract_court_name(content)
        if court:
            attributes["court_name"] = court

    if category:
        attributes["category"] = category

    return {"metadataAttributes": attributes}


def main():
    base_dir = Path("data")
    if not base_dir.exists():
        print("❌ data 폴더를 찾을 수 없습니다. 스크립트를 ai_rag 폴더 최상단에서 실행해주세요.")
        return

    txt_files = list(base_dir.rglob("*.txt"))
    if not txt_files:
        print("❌ data 폴더 내에 .txt 파일이 없습니다.")
        return

    print(f"총 {len(txt_files)}개의 텍스트 파일에 대해 메타데이터 생성을 시작합니다...\n")

    contract_stats = {"entertainment": 0, "labor": 0, "lease": 0, "unknown": 0}
    source_stats = {"precedent": 0, "qa": 0, "law": 0, "unknown": 0}
    laws_seen: dict[str, int] = {}

    for txt_path in txt_files:
        try:
            with open(txt_path, "r", encoding="utf-8") as f:
                content = f.read(16000)

            metadata = build_metadata(txt_path, content)
            attrs = metadata["metadataAttributes"]
            contract_stats[attrs["contract_type"]] = contract_stats.get(attrs["contract_type"], 0) + 1
            source_stats[attrs["source_type"]] = source_stats.get(attrs["source_type"], 0) + 1
            for law in attrs.get("law_names", []) or []:
                laws_seen[law] = laws_seen.get(law, 0) + 1

            meta_path = txt_path.with_name(f"{txt_path.name}.metadata.json")
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"⚠️ 에러 발생 ({txt_path.name}): {e}")

    print("\n🎉 모든 메타데이터 파일(.metadata.json) 생성이 완료되었습니다!")
    print(
        "📊 계약 종류: "
        f"연예({contract_stats['entertainment']}), 임대차({contract_stats['lease']}), "
        f"근로({contract_stats['labor']}), 분류불가({contract_stats['unknown']})"
    )
    print(
        "📁 자료 종류: "
        f"판례({source_stats['precedent']}), 생활법령({source_stats['qa']}), "
        f"법령({source_stats['law']}), 분류불가({source_stats['unknown']})"
    )
    if laws_seen:
        top_laws = sorted(laws_seen.items(), key=lambda kv: kv[1], reverse=True)[:5]
        print("⚖️  자주 등장한 법령 TOP5: " + ", ".join(f"{name}({cnt})" for name, cnt in top_laws))

    print("\n[다음 단계]")
    print("1) aws s3 sync data/ s3://<your-bucket>/kb/ 로 메타데이터까지 함께 업로드")
    print("2) Bedrock 콘솔에서 Knowledge Base [Sync] 실행")
    print("3) handler.py가 contract_type 외에 law_names/source_type/judgment_year 같은")
    print("   필드로도 필터링할 수 있게 KB 메타데이터 스키마가 동기화됩니다.")


if __name__ == "__main__":
    main()
