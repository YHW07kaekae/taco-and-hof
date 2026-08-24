# 타코와호프 — 주소 자동 지도 매핑 버전

## 달라진 점

- 사용자는 장소 등록 시 `주소`만 입력합니다.
- Apps Script가 주소를 위도(lat) / 경도(lng)로 자동 변환합니다.
- 변환된 좌표가 Google Sheet에 함께 저장됩니다.
- 따라서 새로 등록된 장소가 지도에 자동으로 표시됩니다.
- 기존 Sheet에서 lat/lng가 비어 있는 행도 한 번에 채울 수 있습니다.

## 기존 데이터 좌표 자동 채우기

1. Google Sheet → `확장 프로그램 → Apps Script`
2. 기존 `Code.gs` 전체를 새 `Code.gs`로 교체
3. 저장
4. 상단 실행 함수 선택에서 `backfillMissingCoordinates` 선택
5. `실행`
6. Google 권한 요청이 뜨면 내용을 확인하고 승인
7. Google Sheet로 돌아오면 E열 `lat`, F열 `lng`가 주소 기준으로 채워짐

주소 검색이 실패하는 행은 빈칸으로 남습니다. 해당 주소만 도로명 주소 등으로 수정한 뒤 함수를 다시 실행하면 됩니다.

## 웹 앱도 업데이트

Code.gs를 바꾼 뒤 Apps Script 웹 앱을 새 버전으로 배포해야 합니다.

`배포 → 배포 관리 → 수정(연필) → 새 버전 → 배포`

기존 웹 앱 URL은 그대로 사용할 수 있습니다.

## Netlify

새 `index.html`에 기존 Apps Script 웹 앱 URL을 넣은 뒤
Netlify Production deploys에 폴더를 다시 드래그하면 됩니다.

## 주의

Geocoding은 입력 주소를 외부 지도 서비스가 처리해 좌표로 변환하는 기능입니다.
맛집의 공개 주소만 입력하고 개인의 집 주소나 민감한 위치정보는 입력하지 마세요.
