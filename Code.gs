const SHEET_NAME = 'Posts';
const PIN_PROPERTY = 'ADMIN_PIN';
const SHEET_ID_PROPERTY = 'SHEET_ID';

function doGet(e) {
  const params = (e && e.parameter) || {};

  if (String(params.view || '') === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('Roots & Rhythms Admin')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const posts = listPosts_();

  if (params.callback) {
    return jsonp_(params.callback, { ok: true, posts });
  }

  return json_({ ok: true, posts });
}

function doPost(e) {
  const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  const action = body.action;

  if (action === 'login') {
    return login_(body);
  }

  if (action === 'list') {
    return json_({ ok: true, posts: listPosts_() });
  }

  if (!isAuthed_(body.token)) {
    return json_({ ok: false, error: 'Unauthorized.' }, 401);
  }

  if (action === 'create') {
    const posts = listPosts_();
    posts.unshift(normalizePost_(body));
    savePosts_(posts);
    return json_({ ok: true });
  }

  if (action === 'update') {
    const posts = listPosts_();
    const index = posts.findIndex((post) => post.id === body.id);
    if (index < 0) {
      return json_({ ok: false, error: 'Post not found.' }, 404);
    }
    posts[index] = normalizePost_(body, posts[index]);
    savePosts_(posts);
    return json_({ ok: true });
  }

  if (action === 'delete') {
    const posts = listPosts_().filter((post) => post.id !== body.id);
    savePosts_(posts);
    return json_({ ok: true });
  }

  if (action === 'clear') {
    savePosts_([]);
    return json_({ ok: true });
  }

  return json_({ ok: false, error: 'Unknown action.' }, 400);
}

function login_(body) {
  const pin = String(body.pin || '');
  const expectedPin = PropertiesService.getScriptProperties().getProperty(PIN_PROPERTY);
  if (!expectedPin) {
    return json_({ ok: false, error: 'Admin PIN is not configured.' }, 500);
  }
  if (pin !== expectedPin) {
    return json_({ ok: false, error: 'Incorrect PIN.' }, 401);
  }

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(`token:${token}`, '1', 60 * 60 * 8);
  return json_({ ok: true, token });
}

function isAuthed_(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get(`token:${token}`) === '1';
}

function listPosts_() {
  const sheet = ensureSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1).map((row) => ({
    id: row[0],
    title: row[1],
    summary: row[2],
    category: row[3],
    categoryLabel: row[4],
    date: row[5],
    audience: row[6],
    accentColor: row[7],
    createdAt: row[8],
    updatedAt: row[9],
  }));
}

function savePosts_(posts) {
  const sheet = ensureSheet_();
  sheet.clearContents();
  sheet.appendRow(['id', 'title', 'summary', 'category', 'categoryLabel', 'date', 'audience', 'accentColor', 'createdAt', 'updatedAt']);
  posts.forEach((post) => {
    sheet.appendRow([
      post.id,
      post.title,
      post.summary,
      post.category,
      post.categoryLabel,
      post.date,
      post.audience,
      post.accentColor,
      post.createdAt,
      post.updatedAt,
    ]);
  });
}

function normalizePost_(input, existing) {
  const now = new Date().toISOString();
  const category = ['heritage', 'workshop', 'community'].includes(input.category) ? input.category : 'heritage';
  return {
    id: existing?.id || Utilities.getUuid(),
    title: String(input.title || '').trim(),
    summary: String(input.summary || '').trim(),
    category,
    categoryLabel: category === 'workshop' ? 'Workshop' : category === 'community' ? 'Community' : 'Heritage',
    date: String(input.date || '').trim(),
    audience: String(input.audience || '').trim(),
    accentColor: String(input.accentColor || '#E07656'),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function ensureSheet_() {
  const sheetId = PropertiesService.getScriptProperties().getProperty(SHEET_ID_PROPERTY);
  const ss = sheetId ? SpreadsheetApp.openById(sheetId) : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'title', 'summary', 'category', 'categoryLabel', 'date', 'audience', 'accentColor', 'createdAt', 'updatedAt']);
  }
  return sheet;
}

function json_(data, status) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(callback, data) {
  const name = String(callback || '').replace(/[^\w.$]/g, '');
  const body = `${name}(${JSON.stringify(data)});`;
  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
