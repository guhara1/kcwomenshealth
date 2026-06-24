# 🔍 SEO 인덱싱 자동화 도구

KC Women's Health 웹사이트의 SEO 자동화를 위한 도구 모음입니다.

## 📚 도구 목록

### 1. **IndexNow (Bing & Naver)**
- 파일: `indexnow.py`
- 목적: URL을 Bing과 Naver에 즉시 제출
- 특징:
  - Sitemap에서 자동 URL 추출
  - 대량 URL 배치 처리 (최대 10,000개/요청)
  - 제출 결과 로깅

### 2. **Google Indexing API**
- 파일: `google_indexing_api.py`
- 목적: URL을 Google에 즉시 제출
- 특징:
  - 서비스 계정 인증
  - 배치 처리 및 레이트 제한
  - 상세 결과 리포팅

### 3. **빠른 시작 스크립트**
- 파일: `quick-start.sh`
- 목적: 환경 설정 자동화
- 사용: `bash quick-start.sh`

---

## 🚀 빠른 시작

### 1단계: 의존성 설치

```bash
bash tools/quick-start.sh
```

### 2단계: IndexNow 키 등록

```bash
# https://www.bing.com/webmasters/에서 키 받기
# public/indexnow-key.txt 수정
echo "your-indexnow-key" > public/indexnow-key.txt
```

### 3단계: 환경 설정

```bash
cp .env.local.example .env.local
# .env.local 파일 수정 (IndexNow 키, Google 자격증명 경로 등)
```

### 4단계: 사이트 빌드 (처음만)

```bash
npm run build
```

### 5단계: 첫 URL 제출

**IndexNow (Bing & Naver):**
```bash
python tools/indexnow.py \
  --domain www.vip-massage.co.kr \
  --key YOUR_INDEXNOW_KEY \
  --sitemap https://www.vip-massage.co.kr/sitemap-index.xml
```

**Google Indexing API:**
```bash
# 자격증명 파일이 준비되어 있어야 함
python tools/google_indexing_api.py \
  --credentials credentials/google-indexing-sa.json \
  --sitemap https://www.vip-massage.co.kr/sitemap-index.xml
```

---

## 📖 상세 가이드

전체 설정 및 사용 방법은 `SEO_SETUP_GUIDE.md`를 참고하세요.

```bash
cat tools/SEO_SETUP_GUIDE.md
```

---

## 🔧 명령어 참고

### IndexNow 제출

```bash
# 환경 변수로 제출
python tools/indexnow.py --config .env.local --sitemap SITEMAP_URL

# 직접 지정
python tools/indexnow.py \
  --domain www.vip-massage.co.kr \
  --key YOUR_KEY \
  --sitemap https://www.vip-massage.co.kr/sitemap-index.xml

# 특정 URL 제출
python tools/indexnow.py \
  --domain www.vip-massage.co.kr \
  --key YOUR_KEY \
  --urls https://example.com/page1 https://example.com/page2
```

### Google Indexing API 제출

```bash
# 기본 제출 (URL_UPDATED)
python tools/google_indexing_api.py \
  --credentials credentials/google-indexing-sa.json \
  --sitemap SITEMAP_URL

# URL 삭제 표시
python tools/google_indexing_api.py \
  --credentials credentials/google-indexing-sa.json \
  --sitemap SITEMAP_URL \
  --operation URL_DELETED

# 특정 URL만 제출
python tools/google_indexing_api.py \
  --credentials credentials/google-indexing-sa.json \
  --urls https://example.com/page1 https://example.com/page2
```

---

## 🤖 자동화 설정

### GitHub Actions (권장)

`.github/workflows/seo-indexing.yml`이 자동으로 실행됩니다:

**설정 방법:**
1. GitHub Secrets 추가:
   - `INDEXNOW_KEY`: IndexNow 키
   - `GOOGLE_INDEXING_CREDENTIALS`: Google 서비스 계정 JSON (base64 인코딩)

2. 자동 실행 시점:
   - 메인 브랜치에 페이지/데이터 수정 시
   - 매일 자정 UTC (한국 시간 오전 9시)
   - 매주 월요일 오전 9시 UTC

### 로컬 Cron (Linux/Mac)

```bash
# crontab -e 실행 후 추가

# 매일 자정에 IndexNow 실행
0 0 * * * cd /path/to/kcwomenshealth && python tools/indexnow.py --config .env.local --sitemap https://www.vip-massage.co.kr/sitemap-index.xml >> logs/indexnow.log 2>&1

# 매일 오전 1시에 Google Indexing API 실행
0 1 * * * cd /path/to/kcwomenshealth && python tools/google_indexing_api.py --credentials credentials/google-indexing-sa.json --sitemap https://www.vip-massage.co.kr/sitemap-index.xml >> logs/google-indexing.log 2>&1
```

---

## 📊 결과 확인

### 제출 결과 파일

- `indexnow-results.json`: IndexNow 제출 결과
- `google-indexing-results.json`: Google Indexing API 제출 결과

### 결과 보기

```bash
# IndexNow 결과 확인
cat indexnow-results.json | jq .

# Google Indexing API 결과 확인
cat google-indexing-results.json | jq .
```

### 검색 엔진 대시보드

- **Bing Webmaster Tools**: https://www.bing.com/webmasters/
  - Coverage 탭에서 URL 제출 현황 확인

- **Naver Search Advisor**: https://searchadvisor.naver.com/
  - 크롤링 → 수집 현황 확인

- **Google Search Console**: https://search.google.com/search-console/
  - Coverage 탭에서 색인 현황 확인

---

## ⚙️ 환경 변수

`.env.local`에서 설정:

```env
# IndexNow 설정
INDEXNOW_DOMAIN=www.vip-massage.co.kr
INDEXNOW_KEY=your-key-here

# Google 설정
GOOGLE_INDEXING_CREDENTIALS=./credentials/google-indexing-sa.json

# Sitemap URL
SITEMAP_URL=https://www.vip-massage.co.kr/sitemap-index.xml
```

---

## 🐛 문제 해결

### IndexNow 실패 (401/403)

```bash
# 1. 키 파일 확인
cat public/indexnow-key.txt

# 2. 키 파일이 접근 가능한지 확인
curl https://www.vip-massage.co.kr/indexnow-key.txt

# 3. 도메인 확인 (www 포함/미포함 일관성)
# .env.local에서 INDEXNOW_DOMAIN 확인
```

### Google Indexing API 실패

```bash
# 1. 자격증명 파일 확인
ls -la credentials/google-indexing-sa.json

# 2. Google Search Console에서 서비스 계정 확인
# Settings > Users and permissions > 서비스 계정 이메일 확인

# 3. Indexing API 활성화 확인
# Google Cloud Console > APIs & Services > Indexing API
```

### Sitemap 문제

```bash
# 1. 빌드 확인
npm run build

# 2. Sitemap 생성 확인
curl https://www.vip-massage.co.kr/sitemap-index.xml
```

---

## 📞 지원

문제가 발생하면 `SEO_SETUP_GUIDE.md`의 "문제 해결" 섹션을 확인하세요.

---

## 📄 파일 구조

```
tools/
├── indexnow.py                 # IndexNow API 클라이언트
├── google_indexing_api.py      # Google Indexing API 클라이언트
├── quick-start.sh              # 빠른 시작 스크립트
├── README.md                   # 이 파일
└── SEO_SETUP_GUIDE.md          # 상세 설정 가이드

credentials/                    # Google 자격증명 디렉토리
└── .gitkeep

.env.local.example              # 환경 변수 템플릿

.github/workflows/
└── seo-indexing.yml            # GitHub Actions 워크플로우
```

---

**마지막 업데이트**: 2026-06-24
