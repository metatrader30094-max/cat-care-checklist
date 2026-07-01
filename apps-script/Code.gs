// ============================================
// 貓咪照顧清單 - Google Apps Script 後端
// ============================================

// 試算表 ID（需要替換成你自己的）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// 取得試算表
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 取得今天日期字串
function getToday() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// API: 取得所有勾選狀態
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getChecks') {
      return getChecks();
    } else if (action === 'getNotes') {
      return getNotes();
    }
    
    return jsonResponse({ error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// API: 更新勾選狀態
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'setCheck') {
      return setCheck(data.key, data.checked);
    } else if (action === 'setNotes') {
      return setNotes(data.note);
    } else if (action === 'reset') {
      return resetToday();
    }
    
    return jsonResponse({ error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

// 回傳 JSON
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 取得所有勾選狀態
function getChecks() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Checks');
  
  if (!sheet) {
    // 如果沒有，先建立
    sheet = ss.insertSheet('Checks');
    sheet.getRange('A1:C1').setValues([['Key', 'Date', 'Checked']]);
  }
  
  const data = sheet.getDataRange().getValues();
  const today = getToday();
  const checks = {};
  
  // 從第二行開始（跳過標題）
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const date = data[i][1];
    const checked = data[i][2] === true || data[i][2] === 'TRUE';
    
    // 只取今天的資料
    if (date && date.toString().startsWith(today)) {
      checks[key] = { checked: checked, timestamp: date.toString() };
    }
  }
  
  return jsonResponse({ checks: checks, today: today });
}

// 更新勾選狀態
function setCheck(key, checked) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Checks');
  
  if (!sheet) {
    sheet = ss.insertSheet('Checks');
    sheet.getRange('A1:C1').setValues([['Key', 'Date', 'Checked']]);
  }
  
  const today = getToday();
  const keyDate = key + '_' + today;
  const data = sheet.getDataRange().getValues();
  
  // 找現有的或新增
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key && data[i][1].toString().startsWith(today)) {
      sheet.getRange(i + 1, 3).setValue(checked);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([key, new Date(), checked]);
  }
  
  return jsonResponse({ success: true, key: keyDate, checked: checked });
}

// 取得筆記
function getNotes() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Notes');
  
  if (!sheet) {
    sheet = ss.insertSheet('Notes');
    sheet.getRange('A1:B1').setValues([['Date', 'Note']]);
  }
  
  const today = getToday();
  const data = sheet.getDataRange().getValues();
  let note = '';
  
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][0] && data[i][0].toString().startsWith(today)) {
      note = data[i][1];
      break;
    }
  }
  
  return jsonResponse({ note: note, today: today });
}

// 儲存筆記
function setNotes(note) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Notes');
  
  if (!sheet) {
    sheet = ss.insertSheet('Notes');
    sheet.getRange('A1:B1').setValues([['Date', 'Note']]);
  }
  
  const today = getToday();
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().startsWith(today)) {
      sheet.getRange(i + 1, 2).setValue(note);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([new Date(), note]);
  }
  
  return jsonResponse({ success: true, note: note });
}

// 重置今日進度
function resetToday() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Checks');
  
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    const today = getToday();
    
    // 刪除今天的記錄
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] && data[i][1].toString().startsWith(today)) {
        sheet.deleteRow(i + 1);
      }
    }
  }
  
  return jsonResponse({ success: true });
}

// 測試用
function testAPI() {
  Logger.log(getChecks().getContent());
}
