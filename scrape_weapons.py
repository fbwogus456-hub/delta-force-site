import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://deltaforcetools.gg"
WEAPONS_LIST_URL = f"{BASE_URL}/wiki/weapon/all"
OUTPUT_PATH = Path("weapons_data.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

REQUEST_DELAY = 1.0

# 영어 -> 한국어 번역 딕셔너리
TRANSLATIONS = {
    "Damage": "데미지",
    "Control": "제어력",
    "Stability": "안정성",
    "Range": "사거리",
    "Handling": "조작성",
    "Accuracy": "정확도",
    "Armor Penetration": "방어구 관통력",
    "Capacity": "탄창 용량",
    "Muzzle Velocity": "총구 속도",
    "Fire Rate": "발사 속도",
    "Mode": "발사 모드",
    "Gunshot Sound": "총소리 범위",
    "Pistol": "권총",
    "Assault Rifle": "돌격소총",
    "SMG": "기관단총",
    "DMR": "지정사수소총",
    "Sniper Rifle": "저격소총",
    "LMG": "경기관총",
    "Shotgun": "산탄총",
    "Single": "단발",
    "Auto": "자동",
    "Semi": "반자동",
    "Burst": "점사",
}


def translate(text: str) -> str:
    """영어 텍스트를 한국어로 번역"""
    if not text:
        return text
    text = text.strip()
    return TRANSLATIONS.get(text, text)


def extract_number(value: str) -> float | None:
    """문자열에서 숫자 추출 (예: '40', '525m/s' -> 525)"""
    if not value:
        return None
    match = re.search(r"(\d+\.?\d*)", str(value))
    return float(match.group(1)) if match else None


def extract_unit(value: str) -> str:
    """문자열에서 단위 추출 (예: '40m' -> 'm', '600/min' -> '/min')"""
    if not value:
        return ""
    match = re.search(r"(\d+\.?\d*)\s*([a-zA-Z/]+)", str(value))
    return match.group(2) if match else ""


def scrape_weapon_detail(url: str) -> dict | None:
    """개별 무기 상세 페이지 스크래핑"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # 무기 이름
        title_elem = soup.find("h1") or soup.find("title")
        weapon_name = title_elem.get_text(strip=True) if title_elem else url.split("/")[-1]

        # 페이지 전체 텍스트 가져오기
        body_text = soup.get_text()

        # 속성 딕셔너리 초기화
        attributes = {}

        # 프로그레스 바가 있는 주요 속성들 (이미지 참고)
        main_attributes = [
            "Damage",
            "Control",
            "Stability",
            "Range",
            "Handling",
            "Accuracy",
        ]

        # 리스트 형식 속성들
        list_attributes = [
            "Armor Penetration",
            "Capacity",
            "Muzzle Velocity",
            "Fire Rate",
            "Mode",
            "Gunshot Sound",
        ]

        # 텍스트를 줄 단위로 분리
        lines = [line.strip() for line in body_text.splitlines() if line.strip()]

        # 주요 속성 파싱 (프로그레스 바 형식)
        for attr in main_attributes:
            attr_lower = attr.lower()
            for i, line in enumerate(lines):
                if attr_lower in line.lower() and i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    num_value = extract_number(next_line)
                    if num_value is not None:
                        unit = extract_unit(next_line)
                        attributes[translate(attr)] = {
                            "value": num_value,
                            "unit": unit,
                            "raw": next_line,
                        }
                        break

        # 리스트 형식 속성 파싱
        for attr in list_attributes:
            attr_lower = attr.lower()
            for i, line in enumerate(lines):
                if attr_lower in line.lower():
                    # 다음 몇 줄에서 값 찾기
                    for j in range(i + 1, min(i + 5, len(lines))):
                        next_line = lines[j].strip()
                        if next_line and not any(
                            a.lower() in next_line.lower() for a in list_attributes + main_attributes
                        ):
                            # 숫자나 모드 정보가 있는지 확인
                            if re.search(r"\d+", next_line) or any(
                                mode in next_line for mode in ["Single", "Auto", "Semi", "Burst"]
                            ):
                                num_value = extract_number(next_line)
                                unit = extract_unit(next_line)
                                if num_value is not None:
                                    attributes[translate(attr)] = {
                                        "value": num_value,
                                        "unit": unit,
                                        "raw": next_line,
                                    }
                                else:
                                    # 모드 같은 경우
                                    attributes[translate(attr)] = {
                                        "value": translate(next_line),
                                        "unit": "",
                                        "raw": next_line,
                                    }
                                break
                    break

        # 탄약 정보 찾기 (Available bullets 섹션)
        ammo_types = []
        ammo_section = soup.find(string=re.compile("Available bullets|탄약", re.I))
        if ammo_section:
            parent = ammo_section.find_parent()
            if parent:
                # 부모 요소 주변에서 탄약 정보 찾기
                for elem in parent.find_all_next(["div", "span", "p"], limit=50):
                    text = elem.get_text(strip=True)
                    # 탄약 패턴 찾기 (예: 7.62x39mm AP)
                    ammo_match = re.search(r"(\d+\.?\d*x\d+\.?\d*mm\s+\w+)", text, re.I)
                    if ammo_match:
                        ammo_type = ammo_match.group(1).strip()
                        if ammo_type not in ammo_types:
                            ammo_types.append(ammo_type)

        # 무기 카테고리 찾기
        category = "Unknown"
        category_keywords = {
            "Assault Rifle": ["assault", "rifle", "ar"],
            "SMG": ["smg", "submachine"],
            "DMR": ["dmr", "marksman"],
            "Sniper Rifle": ["sniper", "bolt"],
            "LMG": ["lmg", "machine gun"],
            "Shotgun": ["shotgun"],
            "Pistol": ["pistol", "handgun"],
        }

        body_lower = body_text.lower()
        for cat, keywords in category_keywords.items():
            if any(kw in body_lower for kw in keywords):
                category = translate(cat)
                break

        return {
            "name": weapon_name,
            "category": category,
            "url": url,
            "attributes": attributes,
            "ammunition": ammo_types,
        }

    except Exception as e:
        print(f"  -> 오류 발생: {e}")
        return None


def scrape_weapons_list() -> list[dict]:
    """무기 목록 페이지에서 모든 무기 링크 수집 및 스크래핑"""
    print(f"무기 목록 페이지 접속 중: {WEAPONS_LIST_URL}")
    response = requests.get(WEAPONS_LIST_URL, headers=HEADERS, timeout=20)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    # 모든 무기 링크 찾기
    weapon_links = []
    for anchor in soup.select("a[href*='/wiki/weapon/']"):
        href = anchor.get("href")
        if not href:
            continue

        full_url = href if href.startswith("http") else urljoin(BASE_URL, href)

        # 권총 제외: 링크 텍스트나 URL에 'pistol'이 포함된 경우 제외
        link_text = anchor.get_text(strip=True).lower()
        url_lower = full_url.lower()

        if "pistol" in link_text or "pistol" in url_lower:
            continue

        if full_url not in weapon_links:
            weapon_links.append(full_url)

    print(f"수집된 무기 링크 수: {len(weapon_links)}")

    # 각 무기 상세 정보 스크래핑
    weapons_data = []
    for idx, link in enumerate(weapon_links, start=1):
        print(f"[{idx}/{len(weapon_links)}] 스크래핑 중: {link}")
        weapon_data = scrape_weapon_detail(link)
        if weapon_data:
            # 권총 카테고리도 한 번 더 체크
            if weapon_data.get("category") != "권총":
                weapons_data.append(weapon_data)
            else:
                print(f"  -> 권총으로 분류되어 제외됨")
        time.sleep(REQUEST_DELAY)

    return weapons_data


def main():
    print("=" * 60)
    print("델타포스 무기 정보 스크래퍼 시작")
    print("=" * 60)

    weapons = scrape_weapons_list()

    # JSON 파일로 저장
    OUTPUT_PATH.write_text(
        json.dumps(weapons, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("\n" + "=" * 60)
    print(f"완료! {len(weapons)}개의 무기 정보를 {OUTPUT_PATH.resolve()}에 저장했습니다.")
    print("=" * 60)


if __name__ == "__main__":
    main()

