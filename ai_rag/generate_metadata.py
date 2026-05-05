import os
import json
from pathlib import Path

def infer_contract_type(text: str) -> str:
    """텍스트 내 키워드를 기반으로 계약 종류를 추론합니다."""
    joined_text = text[:2000].replace(" ", "").replace("\n", "")
    if "전속계약" in joined_text or "매니지먼트" in joined_text or "엔터테인먼트" in joined_text or "대중문화예술인" in joined_text:
        return "entertainment"
    if "근로계약" in joined_text or "연봉계약" in joined_text or "취업규칙" in joined_text:
        return "labor"
    if "임대차" in joined_text or "전세" in joined_text or "월세" in joined_text or "부동산" in joined_text:
        return "lease"
    return "unknown"

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

    stats = {"entertainment": 0, "labor": 0, "lease": 0, "unknown": 0}

    for txt_path in txt_files:
        try:
            with open(txt_path, "r", encoding="utf-8") as f:
                content = f.read(2000)
            
            contract_type = infer_contract_type(content)
            stats[contract_type] += 1
            
            metadata = {
                "metadataAttributes": {
                    "contract_type": contract_type,
                    "source_file": txt_path.name
                }
            }
            
            meta_path = txt_path.with_name(f"{txt_path.name}.metadata.json")
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            print(f"⚠️ 에러 발생 ({txt_path.name}): {e}")

    print("\n🎉 모든 메타데이터 파일(.metadata.json) 생성이 완료되었습니다!")
    print(f"📊 통계: 연예({stats['entertainment']}건), 임대차({stats['lease']}건), 근로({stats['labor']}건), 분류불가({stats['unknown']}건)")
    print("\n[다음 단계]")
    print("이제 터미널에서 aws s3 sync 명령어나 AWS 콘솔을 통해 data 폴더 전체를 S3 버킷에 업로드하신 후,")
    print("Bedrock Knowledge Base 메뉴에서 [Sync(동기화)] 버튼을 누르시면 메타데이터 필터링이 즉시 적용됩니다.")

if __name__ == "__main__":
    main()
