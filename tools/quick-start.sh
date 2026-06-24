#!/bin/bash

# SEO Indexing Quick Start Script
# 빠르게 인덱싱 자동화를 시작할 수 있는 스크립트

set -e

echo "=== SEO 인덱싱 자동화 설정 ==="
echo ""

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Python 체크
echo "📦 Python 설치 확인..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3이 설치되지 않았습니다.${NC}"
    echo "   설치: brew install python3 (Mac) 또는 apt install python3 (Linux)"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 설치됨${NC}"

# 2. 의존성 설치
echo ""
echo "📚 Python 의존성 설치..."
pip install -q requests google-auth
echo -e "${GREEN}✓ 의존성 설치 완료${NC}"

# 3. 환경 설정
echo ""
echo "⚙️  환경 설정..."

if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo -e "${YELLOW}ℹ️  .env.local 파일 생성됨${NC}"
    echo "   아래 정보를 수정하세요:"
    echo "   - INDEXNOW_KEY: IndexNow 키 (https://www.bing.com/webmasters/)"
else
    echo -e "${GREEN}✓ .env.local 파일이 이미 존재합니다${NC}"
fi

# 4. 디렉토리 생성
echo ""
echo "📁 디렉토리 생성..."
mkdir -p credentials logs
echo -e "${GREEN}✓ 디렉토리 생성 완료${NC}"

# 5. IndexNow 키 파일 확인
echo ""
echo "🔑 IndexNow 키 파일 확인..."
if [ -f public/indexnow-key.txt ]; then
    KEY=$(cat public/indexnow-key.txt)
    echo -e "${GREEN}✓ IndexNow 키: $KEY${NC}"
else
    echo -e "${RED}❌ IndexNow 키 파일이 없습니다${NC}"
    exit 1
fi

# 6. Sitemap 확인
echo ""
echo "🗺️  Sitemap 확인..."
SITEMAP_URL="https://www.vip-massage.co.kr/sitemap-index.xml"
if curl -s -o /dev/null -w "%{http_code}" "$SITEMAP_URL" | grep -q "200"; then
    echo -e "${GREEN}✓ Sitemap 접근 가능${NC}"
else
    echo -e "${YELLOW}⚠️  Sitemap을 아직 생성할 수 없습니다${NC}"
    echo "   먼저 실행: npm run build"
fi

# 7. 사용 방법
echo ""
echo -e "${GREEN}=== 설정 완료! ===${NC}"
echo ""
echo "🚀 다음 명령어로 URL을 제출하세요:"
echo ""
echo "   IndexNow (Bing/Naver):"
echo "   python tools/indexnow.py --config .env.local --sitemap $SITEMAP_URL"
echo ""
echo "   Google Indexing API:"
echo "   python tools/google_indexing_api.py --credentials credentials/google-indexing-sa.json --sitemap $SITEMAP_URL"
echo ""
echo "📖 자세한 정보:"
echo "   cat tools/SEO_SETUP_GUIDE.md"
echo ""
