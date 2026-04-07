ai_rag

로컬 Easylaw 크롤링 테스트:

```bash
cd ai_rag
python3 -m pip install -r requirements.txt
python main.py easylaw local
cat data/easylaw/qa_data/qa_1.txt
```

기본적으로 `부동산/임대차`, `근로/노동` 카테고리만 수집하며, 기본 목표 개수는 `600`개임.

출력 형식:

```text
질문: ...

답변: ...

카테고리: ...

원문URL: ...
```

국가법령정보 공동활용 API 로컬 테스트:

```bash
cd ai_rag
python3 main.py law_open_api local
cat data/law_open_api/law_1.txt
```

국가법령정보 공동활용 API 판례 로컬 테스트:

```bash
cd ai_rag
python3 main.py law_open_api_precedent local
cat data/law_open_api/precedent/precedent_1.txt
```
