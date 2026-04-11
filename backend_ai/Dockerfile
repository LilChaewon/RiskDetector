# AWS Lambda 파이썬 기본 이미지를 사용합니다. (클라우드 배포 환경과 동일한 런타임을 보장)
FROM public.ecr.aws/lambda/python:3.13

# 작업 디렉토리 설정
WORKDIR /var/task

# 로컬 개발 및 테스트를 위해 필요한 의존성(PostgreSQL 클라이언트 등)을 미리 설치할 수 있습니다.
# (실제 람다 배포 시에는 패키징 단계에서 처리되지만, 로컬 도커 테스트를 목적으로 합니다.)
# 요구사항 파일이 없다면 무시하고 필수 패키지 직접 설치하도록 분기 처리합니다.
COPY requirements.txt ./
RUN pip install -r requirements.txt || pip install pg8000 boto3 psycopg python-dateutil requests

# 사용자의 AI 백엔드 코드(test_db.py, lambdas 등)를 컨테이너의 작업 디렉토리로 복사합니다.
COPY . .

# 컨테이너 시작 시 실행될 기본 명령어
# (추후 docker-compose.yml에서 원하는 스크립트로 오버라이딩 할 수 있습니다.)
CMD ["python", "test_db.py"]
