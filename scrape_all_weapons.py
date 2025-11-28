"""
델타포스 모든 총기 정보 스크래퍼
https://deltaforcetools.gg/wiki/weapon/all 에서 모든 총기 정보를 수집합니다.
총기 이름 뒤에 카테고리가 명시되어 있으므로 이를 파싱합니다.
권총(Pistol)은 제외합니다.
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import json
import re

# 카테고리 매핑 (영어 -> 한국어)
CATEGORY_MAP = {
    "assault rifle": "돌격소총",
    "rifle": "돌격소총",  # 기본값 (Assault Rifle이 아닌 경우)
    "submachine gun": "기관단총",
    "sniper rifle": "저격소총",
    "marksman rifle": "지정사수소총",
    "light machine gun": "경기관총",
    "general machine gun": "경기관총",
    "machine gun": "경기관총",
    "shotgun": "샷건",
    "compact assault rifle": "돌격소총",  # SR-3M 같은 경우
}

BASE_URL = "https://deltaforcetools.gg"
WEAPON_LIST_URL = "https://deltaforcetools.gg/wiki/weapon/all"

def setup_driver():
    """Selenium 드라이버 설정"""
    options = Options()
    # options.add_argument("--headless")  # 필요시 주석 해제
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=options)
    return driver

def parse_weapon_name_and_category(full_text):
    """총기 이름과 카테고리를 파싱합니다.
    
    예시:
    "AKM Assault Rifle" -> ("AKM", "돌격소총")
    "VSS Marksman Rifle" -> ("VSS", "지정사수소총")
    "QSZ-92G" -> (None, None)  # 카테고리가 없으면 권총
    """
    if not full_text or not full_text.strip():
        return None, None
    
    full_text = full_text.strip()
    full_text_lower = full_text.lower()
    
    # 권총 키워드 확인
    if "pistol" in full_text_lower:
        return None, None
    
    # 카테고리 찾기 (긴 것부터 매칭)
    found_category = None
    found_category_kr = None
    
    # 긴 카테고리부터 매칭 (순서 중요)
    sorted_categories = sorted(CATEGORY_MAP.items(), key=lambda x: -len(x[0]))
    for eng_cat, kor_cat in sorted_categories:
        if eng_cat in full_text_lower:
            found_category = eng_cat
            found_category_kr = kor_cat
            break
    
    # 카테고리를 찾지 못했으면 권총으로 간주
    if not found_category:
        return None, None
    
    # 총기 이름 추출 (카테고리 제거)
    weapon_name = full_text
    for eng_cat, _ in sorted_categories:
        if eng_cat in full_text_lower:
            # 카테고리 텍스트 제거
            pattern = re.compile(re.escape(eng_cat), re.IGNORECASE)
            weapon_name = pattern.sub("", weapon_name).strip()
            break
    
    # 남은 공백 정리
    weapon_name = re.sub(r'\s+', ' ', weapon_name).strip()
    
    return weapon_name, found_category_kr

def get_all_weapon_links(driver):
    """모든 페이지에서 총기 링크를 수집합니다."""
    print("총기 목록 페이지 접속 중...")
    driver.get(WEAPON_LIST_URL)
    print("페이지 로딩 대기 중... (10초)")
    time.sleep(10)  # 페이지 로딩 대기 (CAPTCHA 해결 시간 포함)
    
    all_weapons = []
    page = 1
    max_pages = 10  # 최대 페이지 수 (안전장치)
    
    while page <= max_pages:
        print(f"\n{'='*60}")
        print(f"페이지 {page} 처리 중...")
        print(f"{'='*60}")
        
        # 페이지 로딩 대기
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
        except Exception as e:
            print(f"페이지 로딩 타임아웃: {e}")
            break
        
        # 현재 페이지 HTML 파싱
        soup = BeautifulSoup(driver.page_source, "html.parser")
        
        # 디버깅: 페이지 제목 확인
        page_title = driver.title
        print(f"현재 페이지 제목: {page_title}")
        
        # 모든 링크 찾기
        all_links = soup.find_all("a", href=True)
        print(f"발견된 링크 수: {len(all_links)}")
        
        page_weapons = []
        
        # 모든 링크 검사
        for link in all_links:
            href = link.get("href", "")
            text = link.get_text(strip=True)
            
            # /wiki/weapon/ 패턴 확인
            if "/wiki/weapon/" in href:
                # 카테고리 페이지 제외
                path_parts = [p for p in href.split("/") if p]
                if len(path_parts) >= 3:
                    last_part = path_parts[-1].lower()
                    exclude_parts = ["all", "rifle", "submachine", "sniper", "marksman", 
                                   "light", "machine", "shotgun", "pistol", "gun", "weapon"]
                    # URL의 마지막 부분이 제외 목록에 있고, 경로가 3개 부분만 있으면 제외
                    if last_part in exclude_parts and len(path_parts) == 3:
                        continue
                
                # 텍스트가 있고, 숫자만 있지 않은 경우
                if text and not text.isdigit() and text not in ["Previous", "Next", "1", "2", "3"]:
                    # 총기 이름과 카테고리 파싱
                    weapon_name, category = parse_weapon_name_and_category(text)
                    
                    if weapon_name and category:
                        # URL 완성
                        if href.startswith("/"):
                            full_url = BASE_URL + href
                        elif href.startswith("http"):
                            full_url = href
                        else:
                            full_url = BASE_URL + "/" + href
                        
                        weapon_info = {
                            "name": weapon_name,
                            "category": category,
                            "url": full_url,
                        }
                        
                        # 중복 확인
                        is_duplicate = any(
                            w["name"] == weapon_name and w["category"] == category 
                            for w in all_weapons
                        )
                        
                        if not is_duplicate:
                            page_weapons.append(weapon_info)
                            print(f"  ✓ 발견: {weapon_name} ({category})")
                        else:
                            print(f"  ⊗ 중복: {weapon_name} ({category})")
        
        # 중복 제거 후 추가
        for weapon in page_weapons:
            if weapon not in all_weapons:
                all_weapons.append(weapon)
        
        print(f"\n페이지 {page} 요약:")
        print(f"  - 이번 페이지에서 발견: {len(page_weapons)}개")
        print(f"  - 누적 총기 수: {len(all_weapons)}개")
        
        # 다음 페이지 버튼 찾기
        next_found = False
        try:
            # "Next" 버튼 찾기
            next_buttons = driver.find_elements(By.XPATH, "//a[contains(text(), 'Next') or contains(text(), '다음')]")
            for next_button in next_buttons:
                # disabled 상태 확인
                class_attr = next_button.get_attribute("class") or ""
                aria_disabled = next_button.get_attribute("aria-disabled")
                
                if "disabled" not in class_attr.lower() and aria_disabled != "true":
                    print("\n다음 페이지로 이동 중...")
                    next_button.click()
                    time.sleep(5)  # 페이지 로딩 대기
                    next_found = True
                    page += 1
                    break
        except Exception as e:
            print(f"Next 버튼 클릭 실패: {e}")
        
        if not next_found:
            # 페이지 번호 클릭 시도
            try:
                next_page_num = page + 1
                page_links = driver.find_elements(By.XPATH, f"//a[text()='{next_page_num}']")
                if page_links:
                    print(f"\n페이지 {next_page_num}로 이동 중...")
                    page_links[0].click()
                    time.sleep(5)
                    page += 1
                    next_found = True
            except Exception as e:
                print(f"페이지 번호 클릭 실패: {e}")
        
        if not next_found:
            print("\n다음 페이지를 찾을 수 없음. 종료합니다.")
            break
    
    return all_weapons

def scrape_all_weapons():
    """모든 총기 정보를 수집합니다."""
    driver = setup_driver()
    
    try:
        print("=" * 60)
        print("델타포스 총기 정보 스크래퍼 시작")
        print("=" * 60)
        
        # 모든 총기 정보 수집
        weapons = get_all_weapon_links(driver)
        
        return weapons
        
    finally:
        print("\n브라우저 종료 중...")
        driver.quit()

if __name__ == "__main__":
    try:
        weapons = scrape_all_weapons()
        
        # 카테고리별로 정렬
        weapons_sorted = sorted(weapons, key=lambda x: (x["category"], x["name"]))
        
        # JSON 파일로 저장
        output_file = "weapons_list.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(weapons_sorted, f, ensure_ascii=False, indent=2)
        
        print("\n" + "=" * 60)
        print("스크래핑 완료!")
        print("=" * 60)
        print(f"\n총 {len(weapons)}개의 총기 정보를 수집했습니다.")
        
        if len(weapons) > 0:
            print(f"\n카테고리별 통계:")
            category_counts = {}
            for weapon in weapons:
                cat = weapon["category"]
                category_counts[cat] = category_counts.get(cat, 0) + 1
            
            for cat, count in sorted(category_counts.items()):
                print(f"  {cat}: {count}개")
            
            print(f"\n결과가 '{output_file}' 파일에 저장되었습니다.")
            
            # 샘플 출력
            print("\n샘플 데이터 (처음 10개):")
            for weapon in weapons_sorted[:10]:
                print(f"  - {weapon['name']} ({weapon['category']})")
        else:
            print("\n⚠ 경고: 총기를 찾지 못했습니다. 스크립트를 확인해주세요.")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
