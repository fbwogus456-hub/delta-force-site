from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time


def main():
  # 브라우저 열기
  options = Options()
  # options.add_argument("--headless")
  driver = webdriver.Chrome(options=options)

  try:
    # 1. M14 30발 탄창 상세 페이지로 이동
    url = "https://deltaforcetools.gg/wiki/attachment/M14%2030-Round%20Mag"
    print(f"접속 중: {url}")
    driver.get(url)

    # 2. 로딩 대기 (15초) - 넉넉하게 기다림
    time.sleep(15)

    # 3. 페이지의 모든 텍스트 가져오기
    try:
      body_text = driver.find_element(By.TAG_NAME, "body").text

      print("\n" + "=" * 50)
      print("[페이지 내용 추출 성공]")
      print("=" * 50)

      # 텍스트 파일로 저장
      with open("page_text.txt", "w", encoding="utf-8") as f:
        f.write(body_text)

      print("page_text.txt 파일에 저장했습니다.")
    except Exception as e:
      print("에러 발생:", e)
  finally:
    driver.quit()


if __name__ == "__main__":
  main()




