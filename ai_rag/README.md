ai_rag

로컬 Easylaw 크롤링 테스트:

```bash
cd ai_rag
python main.py easylaw local
cat data/easylaw/qa_data/qa_1.txt
```

출력 형식:

```text
질문: ...

답변: ...

카테고리: ...
```

국가법령정보 공동활용 API 로컬 테스트:

```bash
cd ai_rag
python3 main.py law_open_api local
cat data/law_open_api/law_1.txt
```
