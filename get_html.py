from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

from bs4 import BeautifulSoup


def main():
  # 브라우저 열기
  options = Options()
  # options.add_argument("--headless")  # 화면 보이게 설정

  driver = webdriver.Chrome(options=options)

  try:
    # 1. M14 30발 탄창 상세 페이지로 이동
    url = "https://deltaforcetools.gg/wiki/attachment/M14%2030-Round%20Mag"
    print(f"접속 중: {url}")
    driver.get(url)

    # 2. 로딩 대기 (10초) - 만약 사람 인증 뜨면 직접 푸세요!
    time.sleep(10)

    # 3. HTML 소스 가져오기
    html = driver.page_source

    # 4. 전체 페이지를 파일로 저장 (참고용)
    with open("target_page.html", "w", encoding="utf-8") as f:
      f.write(html)

    print("완료! 'target_page.html' 파일이 생성되었습니다.")

    # 5. BeautifulSoup으로 'Reload' 주변 구조만 예쁘게 출력
    soup = BeautifulSoup(html, "html.parser")

    # 'reload' 텍스트를 포함하는 요소들 찾기 (대소문자 무시)
    candidates = soup.find_all(
      string=lambda t: isinstance(t, str) and "reload" in t.lower()
    )

    if not candidates:
      print("\n[경고] 'Reload' 텍스트를 포함하는 요소를 찾지 못했습니다.")
      return

    print("\n" + "=" * 80)
    print("[Reload 텍스트 주변 HTML 구조]")
    print("=" * 80)

    # 너무 많이 찍히지 않도록 최대 몇 개까지만
    max_samples = 3
    for idx, text_node in enumerate(candidates[:max_samples], start=1):
      parent = text_node.parent
      if parent is None:
        continue

      print(f"\n--- #{idx} 부모 태그 전체 구조 ---")
      print(parent.prettify())

      # 형제 태그들도 출력
      print("\n형제 태그들:")
      sibling_index = 0
      for sibling in parent.next_siblings:
        # 공백/개행 같은 것은 건너뛰기
        if getattr(sibling, "name", None) is None:
          continue
        sibling_index += 1
        print(f"\n[Sibling {sibling_index}]")
        print(sibling.prettify())

      # 한 후보만 봐도 충분할 수 있으니 break를 제거/유지 선택 가능
      # 여기서는 여러 경우를 비교해보기 위해 계속 진행

  finally:
    driver.quit()


if __name__ == "__main__":
  main()


