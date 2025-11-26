import json
import re
import time
from pathlib import Path
from typing import Dict, List

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from urllib.parse import unquote


BASE_URL = "https://deltaforcetools.gg"
LISTING_URL = f"{BASE_URL}/wiki/attachment/mag"
OUTPUT_PATH = Path("attachments_data.json")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

REQUEST_DELAY = 1.0

# 1. URL 필터링용 블랙리스트 (마지막 세그먼트 기준)
BLOCKED_LAST_WORDS = [
    "mag",
    "functional",
    "rear grip",
    "foregrip",
    "handguard",
    "barrel",
    "muzzle",
    "optic",
    "stock",
    "attachment",
]
BLOCKED_LAST_WORDS_LOWER = {w.lower() for w in BLOCKED_LAST_WORDS}

# 2. 허용된 스탯 키워드 (Range 제외)
ALLOWED_STAT_KEYS = [
    "Holds",
    "Handling",
    "Recoil Control",
    "Ergonomics",
    "Stability",
    "Accuracy",
    "Fire Rate",
]
ALLOWED_STAT_KEYS_LOWER = {k.lower(): k for k in ALLOWED_STAT_KEYS}

# 3. 값 유효성 검사 정규식
NUMERIC_PATTERN = re.compile(r"^[+-]?\d+(?:\.\d+)?%?$")


def create_driver() -> webdriver.Chrome:
    """Selenium Chrome 드라이버 생성."""
    options = Options()
    # options.add_argument("--headless")  # 필요하면 헤드리스로 사용
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"user-agent={USER_AGENT}")

    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)


def scroll_to_bottom(driver: webdriver.Chrome, pause: float = 1.0, max_tries: int = 15) -> None:
    """간단한 무한 스크롤 처리: 더 이상 늘어나지 않을 때까지 아래로 스크롤."""
    last_height = driver.execute_script("return document.body.scrollHeight")
    tries = 0
    while tries < max_tries:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(pause)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height
        tries += 1


def is_blocked_url(url: str) -> bool:
    """
    URL 마지막 세그먼트(단어)를 기준으로 블랙리스트와 매칭.
    - 대소문자 무시
    - 공백/퍼센트 인코딩 처리 (예: 'rear%20grip')
    """
    last_segment = url.rstrip("/").split("/")[-1]
    decoded = unquote(last_segment).lower().strip()
    return decoded in BLOCKED_LAST_WORDS_LOWER


def parse_links_from_listing(html: str) -> List[str]:
    """목록 페이지 HTML에서 부착물 상세 페이지 URL 수집 (1차 필터 포함)."""
    soup = BeautifulSoup(html, "html.parser")
    links: List[str] = []
    seen = set()

    for a in soup.select("a[href*='/wiki/attachment/']"):
        href = a.get("href")
        if not href:
            continue

        full_url = href if href.startswith("http") else f"{BASE_URL}{href}"

        # 마지막 세그먼트 블랙리스트 체크
        if is_blocked_url(full_url):
            continue

        if full_url not in seen:
            seen.add(full_url)
            links.append(full_url)

    return links


def is_valid_value(value: str) -> bool:
    """텍스트가 '+/-/숫자/%' 패턴에 맞는지 검사."""
    return bool(NUMERIC_PATTERN.match(value.strip()))


def parse_stats_from_body_text(body_text: str) -> Dict[str, str]:
    """
    페이지 전체 텍스트(body.text)를 줄 단위로 쪼개고,
    허용된 키워드를 찾은 뒤 바로 다음 줄이 유효한 숫자형 값이면 stats에 저장.
    """
    lines = [ln.strip() for ln in body_text.splitlines()]
    # 빈 줄 제거
    lines = [ln for ln in lines if ln]

    stats: Dict[str, str] = {}
    lower_lines = [ln.lower() for ln in lines]

    for i, line_lower in enumerate(lower_lines):
        for key_lower, key_original in ALLOWED_STAT_KEYS_LOWER.items():
            if key_lower in line_lower:
                # 이미 값이 있으면 넘어감 (첫 번째 매치만 사용)
                if key_original in stats:
                    continue

                # 다음 줄이 없으면 스킵
                if i + 1 >= len(lines):
                    continue

                candidate = lines[i + 1].strip()
                if is_valid_value(candidate):
                    stats[key_original] = candidate

    return stats


def scrape_attachment(driver: webdriver.Chrome, url: str) -> Dict[str, Dict]:
    """단일 부착물 페이지에서 이름과 스탯 파싱."""
    # URL 블랙리스트 재확인 (방어적 체크)
    if is_blocked_url(url):
        raise ValueError(f"블랙리스트 URL: {url}")

    driver.get(url)
    time.sleep(REQUEST_DELAY * 2)

    # 이름: h1 텍스트 기준
    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")
    title_el = soup.find("h1")
    name = title_el.get_text(strip=True) if title_el else url.split("/")[-1]

    # 전체 텍스트에서 스탯 파싱
    body_text = driver.find_element(By.TAG_NAME, "body").text
    stats = parse_stats_from_body_text(body_text)

    return {"name": name, "url": url, "stats": stats}


def main():
    driver = create_driver()
    try:
        print("[INFO] 목록 페이지 접속:", LISTING_URL)
        driver.get(LISTING_URL)
        time.sleep(3)
        scroll_to_bottom(driver, pause=1.0, max_tries=10)

        listing_html = driver.page_source
        links = parse_links_from_listing(listing_html)
        print(f"[INFO] 1차 필터링 후 링크 수: {len(links)}")

        results: List[Dict] = []

        for idx, url in enumerate(links, start=1):
            print(f"\n[INFO] ({idx}/{len(links)}) 대상 URL:", url)

            # 2차 방어적 URL 필터링
            if is_blocked_url(url):
                print("  -> [SKIP] 블랙리스트 URL (마지막 단어 필터)")
                continue

            try:
                record = scrape_attachment(driver, url)
                if not record["stats"]:
                    print("  -> [SKIP] 스탯 없음")
                    continue

                print(f"  -> [OK] {record['name']} / 스탯 {len(record['stats'])}개")
                results.append(record)
            except Exception as exc:
                print(f"  -> [ERROR] 크롤링 실패: {exc}")

            time.sleep(REQUEST_DELAY)

        OUTPUT_PATH.write_text(
            json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(
            f"\n[INFO] 완료: 유효한 부착물 {len(results)}개를 {OUTPUT_PATH.resolve()} 에 저장했습니다."
        )
    finally:
        driver.quit()


if __name__ == "__main__":
    main()

import json
import re
import time
from pathlib import Path
from typing import Dict, List

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


BASE_URL = "https://deltaforcetools.gg"
LISTING_URL = f"{BASE_URL}/wiki/attachment/mag"
OUTPUT_PATH = Path("attachments_data.json")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

REQUEST_DELAY = 1.0

# URL/텍스트 기준으로 제외할 카테고리 이름들
CATEGORY_NAMES = {
    "mag",
    "mags",
    "magazine",
    "magazines",
    "stock",
    "stocks",
    "optic",
    "optics",
}

# 최종적으로 허용할 스탯 키워드
ALLOWED_KEYS = [
    "Holds",
    "Handling",
    "Recoil Control",
    "Ergonomics",
    "Stability",
    "Accuracy",
    "Range",
    "Fire Rate",
]

NUMERIC_PATTERN = re.compile(r"^[+-]?\d+(?:\.\d+)?%?$")


def create_driver() -> webdriver.Chrome:
    """Selenium Chrome 드라이버 생성."""
    options = Options()
    # options.add_argument("--headless")  # 필요하면 헤드리스로 전환
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"user-agent={USER_AGENT}")

    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)


def scroll_to_bottom(driver: webdriver.Chrome, pause: float = 1.0, max_tries: int = 20) -> None:
    """무한 스크롤 페이지를 끝까지 내리기."""
    last_height = driver.execute_script("return document.body.scrollHeight")
    tries = 0
    while tries < max_tries:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(pause)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height
        tries += 1


def parse_links_from_html(html: str) -> List[str]:
    """목록 페이지 HTML에서 아이템(탄창) 상세 링크 목록 추출."""
    soup = BeautifulSoup(html, "html.parser")
    links: List[str] = []
    seen = set()

    # attachment 관련 링크를 폭넓게 수집
    for a in soup.select("a[href*='/wiki/attachment/']"):
        href = a.get("href")
        if not href:
            continue

        full_url = href if href.startswith("http") else f"{BASE_URL}{href}"

        # URL 마지막 세그먼트 기준으로 카테고리 제외
        last_segment = full_url.rstrip("/").split("/")[-1].lower()
        if last_segment in CATEGORY_NAMES:
            continue

        # 텍스트가 카테고리 이름과 동일한 경우도 제외
        text = (a.get_text() or "").strip().lower()
        if text in CATEGORY_NAMES:
            continue

        if full_url not in seen:
            seen.add(full_url)
            links.append(full_url)

    return links


def is_valid_value(raw: str) -> bool:
    """값이 숫자/부호/퍼센트 형태인지 검증."""
    s = raw.strip()
    return bool(NUMERIC_PATTERN.match(s))


def parse_stats_from_lines(lines: List[str]) -> Dict[str, str]:
    """
    페이지 전체 텍스트(body.text)를 줄 단위로 읽어,
    허용된 키워드를 찾고 그 다음 줄의 숫자형 값을 stats에 저장.
    """
    stats: Dict[str, str] = {}

    # 공백 줄 제거 및 정리
    cleaned = [ln.strip() for ln in lines if ln.strip()]

    # 키워드 매칭을 위해 소문자로 변환한 버전도 함께 준비
    lower_cleaned = [ln.lower() for ln in cleaned]
    allowed_lower = {k.lower(): k for k in ALLOWED_KEYS}  # lower -> original

    for i, line_lower in enumerate(lower_cleaned):
        for key_lower, key_original in allowed_lower.items():
            if key_lower in line_lower:
                # 이미 값이 있는 키라면 건너뛴다 (첫 번째 매치만 사용)
                if key_original in stats:
                    continue

                # 바로 다음 줄이 존재하는지 확인
                if i + 1 >= len(cleaned):
                    continue

                value_candidate = cleaned[i + 1].strip()
                if is_valid_value(value_candidate):
                    stats[key_original] = value_candidate

    return stats


def scrape_attachment(driver: webdriver.Chrome, url: str) -> Dict:
    """단일 부착물(탄창) 상세 페이지에서 텍스트 기반 스탯 추출."""
    driver.get(url)
    time.sleep(REQUEST_DELAY * 2)

    # 이름은 h1 텍스트 기준
    page_html = driver.page_source
    soup = BeautifulSoup(page_html, "html.parser")
    title = soup.find("h1")
    name = title.get_text(strip=True) if title else url.split("/")[-1]

    # body 전체 텍스트를 줄 단위로 분리
    body_text = driver.find_element(By.TAG_NAME, "body").text
    lines = body_text.splitlines()
    stats = parse_stats_from_lines(lines)

    return {
        "name": name,
        "url": url,
        "stats": stats,
    }


def main():
    driver = create_driver()
    try:
        print("목록 페이지 접속 중...")
        driver.get(LISTING_URL)
        time.sleep(3)

        # 무한 스크롤 페이지라면 끝까지 스크롤
        scroll_to_bottom(driver, pause=1.0, max_tries=20)

        listing_html = driver.page_source
        links = parse_links_from_html(listing_html)
        print(f"총 {len(links)}개 링크를 찾았습니다.")

        data = []
        for idx, link in enumerate(links, start=1):
            print(f"[{idx}/{len(links)}] {link} 크롤링 중...")
            try:
                attachment = scrape_attachment(driver, link)
                data.append(attachment)
            except Exception as exc:
                print(f"  -> 오류 발생, 건너뜀: {exc}")
            time.sleep(REQUEST_DELAY)

        OUTPUT_PATH.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"완료! {OUTPUT_PATH.resolve()} 파일에 {len(data)}개 아이템을 저장했습니다.")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()


