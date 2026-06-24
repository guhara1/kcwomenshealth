# SEO 인덱싱 자동화 설정 가이드

이 가이드는 KC Women's Health 웹사이트의 SEO 자동화를 설정하는 방법을 설명합니다.

## 📋 목차
1. [IndexNow 설정 (Bing/Naver)](#indexnow-설정)
2. [Google Indexing API 설정](#google-indexing-api-설정)
3. [자동화 워크플로우](#자동화-워크플로우)
4. [문제 해결](#문제-해결)

---

## IndexNow 설정

### 1단계: IndexNow 키 등록

IndexNow는 검색 엔진에 URL 변경을 즉시 알리는 프로토콜입니다.

#### Bing Webmaster Tools에서 등록
1. https://www.bing.com/webmasters/ 접속
2. 웹사이트 등록 (`https://www.vip-massage.co.kr`)
3. "Crawl control" → "Submit URLs" 또는 "IndexNow" 확인
4. IndexNow 키 받기

#### Naver Search Advisor에서 등록
1. https://searchadvisor.naver.com/ 접속
2. 웹사이트 등록
3. IndexNow 지원 확인

### 2단계: IndexNow 키 설정

현재 프로젝트에는 임시 키가 있습니다:
- 위치: `public/indexnow-key.txt`
- 현재 키: `7a8d3c91-2f4e-4b7a-9d2e-1f3a5c8e7d2b`

**⚠️ 실제 키로 변경해야 합니다:**

```bash
# public/indexnow-key.txt 수정
# 새로운 키로 교체
echo "your-actual-indexnow-key" > public/indexnow-key.txt
```

### 3단계: 환경 설정

`.env.local` 파일 생성:

```bash
# .env.local.example을 기반으로 생성
cp .env.local.example .env.local
```

`.env.local` 수정:
```env
INDEXNOW_DOMAIN=www.vip-massage.co.kr
INDEXNOW_KEY=your-actual-indexnow-key
SITEMAP_URL=https://www.vip-massage.co.kr/sitemap-index.xml
```

### 4단계: Python 의존성 설치

```bash
pip install requests
```

### 5단계: 일괄 URL 제출 (첫 실행)

모든 URL을 한 번에 Bing/Naver에 제출:

```bash
python tools/indexnow.py \
  --domain www.vip-massage.co.kr \
  --key 7a8d3c91-2f4e-4b7a-9d2e-1f3a5c8e7d2b \
  --sitemap https://www.vip-massage.co.kr/sitemap-index.xml
```

또는 환경 변수 사용:

```bash
python tools/indexnow.py \
  --config .env.local \
  --sitemap https://www.vip-massage.co.kr/sitemap-index.xml
```

**결과**: `indexnow-results.json` 생성

---

## Google Indexing API 설정

Google은 IndexNow를 지원하지 않으므로, Google Indexing API를 별도로 설정해야 합니다.

### 1단계: Google Cloud 프로젝트 생성

1. https://console.cloud.google.com/ 접속
2. 새 프로젝트 생성: "vip-massage-indexing"
3. "Indexing API" 활성화:
   - APIs & Services → Library
   - "Indexing API" 검색
   - "Enable" 클릭

### 2단계: 서비스 계정 생성

1. APIs & Services → Credentials
2. "Create Credentials" → "Service Account"
3. 서비스 계정 정보 입력:
   - Service account name: `indexing-api`
   - 생성 완료

### 3단계: 서비스 계정 키 생성

1. 생성된 서비스 계정 클릭
2. "Keys" 탭 → "Add Key" → "Create new key"
3. "JSON" 선택 후 생성
4. 다운로드된 JSON 파일 저장:
   ```bash
   # credentials/google-indexing-sa.json에 저장
   mkdir -p credentials
   # JSON 파일을 이 위치로 이동
   ```

### 4단계: Search Console 연결

1. https://search.google.com/search-console/ 접속
2. 웹사이트 등록
3. 서비스 계정 이메일 추가:
   - Settings → Users and permissions
   - 서비스 계정 이메일 초대 (Full access)

### 5단계: Python 의존성 설치

```bash
pip install google-auth requests
```

### 6단계: Google Indexing API로 URL 제출

```bash
# 환경 변수에서 설정
export GOOGLE_INDEXING_CREDENTIALS=credentials/google-indexing-sa.json

# 일괄 제출
python tools/google_indexing_api.py \
  --credentials credentials/google-indexing-sa.json \
  --sitemap https://www.vip-massage.co.kr/sitemap-index.xml
```

**결과**: `google-indexing-results.json` 생성

---

## 자동화 워크플로우

### GitHub Actions로 자동화 (권장)

`.github/workflows/seo-indexing.yml` 생성:

```yaml
name: SEO Indexing

on:
  push:
    branches: [main, master]
    paths:
      - 'src/pages/**'
      - 'src/data/**'
      - '.github/workflows/seo-indexing.yml'
  schedule:
    - cron: '0 */6 * * *'  # 6시간마다

jobs:
  index:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install requests google-auth
      
      - name: IndexNow Submission
        env:
          INDEXNOW_DOMAIN: www.vip-massage.co.kr
          INDEXNOW_KEY: ${{ secrets.INDEXNOW_KEY }}
        run: |
          python tools/indexnow.py \
            --domain $INDEXNOW_DOMAIN \
            --key $INDEXNOW_KEY \
            --sitemap https://www.vip-massage.co.kr/sitemap-index.xml
      
      - name: Google Indexing API
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_INDEXING_CREDENTIALS }}
        run: |
          mkdir -p credentials
          echo "$GOOGLE_CREDENTIALS" > credentials/google-indexing-sa.json
          python tools/google_indexing_api.py \
            --credentials credentials/google-indexing-sa.json \
            --sitemap https://www.vip-massage.co.kr/sitemap-index.xml
      
      - name: Cleanup
        run: rm -f credentials/google-indexing-sa.json
```

### 로컬 크론 작업

Linux/Mac에서 crontab으로 자동화:

```bash
# crontab -e 실행
# 매일 자정에 실행
0 0 * * * cd /home/user/kcwomenshealth && python tools/indexnow.py --config .env.local --sitemap https://www.vip-massage.co.kr/sitemap-index.xml >> /var/log/indexnow.log 2>&1

# 매일 오전 1시에 Google Indexing API 실행
0 1 * * * cd /home/user/kcwomenshealth && python tools/google_indexing_api.py --credentials credentials/google-indexing-sa.json --sitemap https://www.vip-massage.co.kr/sitemap-index.xml >> /var/log/google-indexing.log 2>&1
```

---

## Sitemap & RSS 설정

### Sitemap (이미 구성됨)

- **Location**: `https://www.vip-massage.co.kr/sitemap-index.xml`
- **Generated by**: Astro sitemap plugin
- **Config**: `astro.config.mjs`

### RSS Feed 추가 (선택사항)

만약 블로그나 뉴스 섹션이 있다면, RSS 피드 추가:

```bash
npm install @astrojs/rss
```

`src/pages/rss.xml.js` 생성:

```javascript
import rss from '@astrojs/rss';

export async function GET(context) {
  return rss({
    title: 'KC Women\'s Health Updates',
    description: 'Latest updates and guides for massage services',
    site: context.site,
    items: import.meta.glob('./**/*.md', { eager: true }),
  });
}
```

---

## 실시간 인덱싱 (선택사항)

새 페이지가 배포되면 즉시 검색 엔진에 알림:

### Webhook 기반 자동화

배포 서비스(Vercel, Netlify 등)에서 deploy 완료 후 webhook 실행:

```bash
# Webhook 엔드포인트 (서버 필요)
# 또는 GitHub Actions 사용
```

---

## 검증 및 모니터링

### Bing Webmaster Tools
- https://www.bing.com/webmasters/
- Settings → Crawl control → "Submit URLs" 확인
- 제출 현황 확인

### Naver Search Advisor
- https://searchadvisor.naver.com/
- 크롤링 → 수집 현황 확인

### Google Search Console
- https://search.google.com/search-console/
- Coverage 탭에서 색인 현황 확인
- Enhancements → Coverage → 에러 확인

### 제출 결과 확인

```bash
# IndexNow 결과
cat indexnow-results.json | jq .

# Google Indexing API 결과
cat google-indexing-results.json | jq .
```

---

## 문제 해결

### IndexNow 제출 실패

**증상**: "status: 401" 또는 "status: 403"

**해결책**:
1. IndexNow 키 확인 (public/indexnow-key.txt와 일치)
2. 도메인 확인 (www 포함/미포함 일관성)
3. 키 파일이 접근 가능한지 확인: `curl https://www.vip-massage.co.kr/indexnow-key.txt`

### Google Indexing API 실패

**증상**: "Invalid credentials" 또는 "Permission denied"

**해결책**:
1. 서비스 계정 키 파일 경로 확인
2. Google Search Console에 서비스 계정 이메일이 등록되었는지 확인
3. Indexing API가 활성화되었는지 확인

### Sitemap 문제

**증상**: Sitemap not found

**해결책**:
```bash
# Astro 빌드 재실행
npm run build

# Sitemap 생성 확인
curl https://www.vip-massage.co.kr/sitemap-index.xml
```

---

## 참고 자료

- [IndexNow 공식 문서](https://www.indexnow.org/)
- [Bing Webmaster Tools](https://www.bing.com/webmasters/)
- [Google Indexing API 가이드](https://developers.google.com/search/docs/guides/indexing-api/v1/quickstart)
- [Naver Search Advisor](https://searchadvisor.naver.com/)
- [Astro Sitemap Plugin](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
