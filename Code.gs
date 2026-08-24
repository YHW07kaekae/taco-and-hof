const SHEET_NAME = 'places';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';

  if (action === 'list') {
    return jsonResponse(getPlaces());
  }

  return jsonResponse({ ok: false, message: 'unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');

    if (body.action === 'add') {
      const saved = addPlace(body);
      return jsonResponse({ ok: true, data: saved });
    }

    return jsonResponse({ ok: false, message: 'unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, message: String(err) });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'id',
      'name',
      'category',
      'address',
      'lat',
      'lng',
      'review',
      'menu',
      'author',
      'createdAt'
    ]);
  }

  return sheet;
}

function getPlaces() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return [];

  const headers = values[0];

  return values.slice(1)
    .filter(row => row.some(v => v !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
    .reverse();
}

function addPlace(data) {
  const sheet = getSheet();

  const id = Utilities.getUuid();
  const createdAt = new Date();
  const address = clean(data.address);

  // 주소 → 위도/경도 자동 변환
  const coords = geocodeAddress(address);

  const row = [
    id,
    clean(data.name),
    clean(data.category || 'etc'),
    address,
    coords.lat,
    coords.lng,
    clean(data.review),
    clean(data.menu),
    clean(data.author),
    createdAt
  ];

  sheet.appendRow(row);

  return {
    id,
    name: row[1],
    category: row[2],
    address: row[3],
    lat: row[4],
    lng: row[5],
    review: row[6],
    menu: row[7],
    author: row[8],
    createdAt: createdAt.toISOString()
  };
}

/**
 * 한국 주소를 위도/경도로 변환합니다.
 * 실패하면 빈 값을 반환합니다.
 */
function geocodeAddress(address) {
  if (!address) return { lat: '', lng: '' };

  try {
    const response = Maps.newGeocoder()
      .setLanguage('ko')
      .setRegion('kr')
      .geocode(address);

    if (
      response &&
      response.status === 'OK' &&
      response.results &&
      response.results.length > 0
    ) {
      const location = response.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
  } catch (err) {
    console.error('Geocoding failed:', address, err);
  }

  return { lat: '', lng: '' };
}

/**
 * 기존 Sheet의 빈 lat/lng를 주소를 기준으로 채웁니다.
 *
 * Apps Script 편집기에서 이 함수를 직접 실행하면 됩니다.
 * 최초 실행 시 Google 권한 승인이 다시 요청될 수 있습니다.
 */
function backfillMissingCoordinates() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  const rows = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

  rows.forEach((row, index) => {
    const address = clean(row[3]);
    const lat = row[4];
    const lng = row[5];

    if (address && (!lat || !lng)) {
      const coords = geocodeAddress(address);

      if (coords.lat && coords.lng) {
        sheet.getRange(index + 2, 5).setValue(coords.lat);
        sheet.getRange(index + 2, 6).setValue(coords.lng);
      }

      // 너무 빠른 연속 요청을 피하기 위한 짧은 대기
      Utilities.sleep(150);
    }
  });
}

function clean(value) {
  return String(value == null ? '' : value).trim();
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
