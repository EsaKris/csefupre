/**
 * FUPRE Centre for Safety Education — Application data layer
 * Google Apps Script Web App (V8 runtime), bound to the CSE admissions Google Sheet.
 *
 * Only the website's server (Vercel functions) calls this script. Every request
 * must carry the shared secret stored in Script Properties as SHARED_SECRET.
 * The browser never talks to this script directly.
 *
 * Setup: see docs/GOOGLE_SHEETS.md
 */

/* ───────────────────────── Configuration ───────────────────────── */

var CONFIG = {
  TIMEZONE: 'Africa/Lagos',
  APPLICATION_PREFIX: 'CSE',
  ENQUIRY_PREFIX: 'ENQ',
  /** An application with the same email or phone within this many days is treated as a duplicate */
  DUPLICATE_WINDOW_DAYS: 180,
  LOCK_WAIT_MS: 20000,
  SHEETS: {
    APPLICATIONS: 'Applications',
    PAYMENTS: 'Payments',
    ENQUIRIES: 'Enquiries',
  },
};

var APPLICATION_STATUSES = ['Submitted', 'Under Review', 'Completed', 'Withdrawn'];
var PAYMENT_STATUSES = ['Not Started', 'Pending', 'Ongoing', 'Processing', 'Queued', 'Success', 'Failed', 'Abandoned', 'Reversed'];
var FOLLOW_UP_STATUSES = ['Not Contacted', 'Pending', 'Contacted', 'Responded', 'Converted', 'Closed'];
var ENQUIRY_STATUSES = ['New', 'Responded', 'Closed'];

var PROGRAMME_CODES = ['professional-diploma', 'pgd', 'masters', 'phd'];

/**
 * Applications sheet columns. The script finds columns by HEADER NAME, so staff may
 * add columns or reorder existing ones — but must not rename these headers.
 * [header, payload key or null for system-managed columns]
 */
var APPLICATION_COLUMNS = [
  ['Application ID', null],
  ['Submitted At', null],
  ['First Name', 'firstName'],
  ['Last Name', 'lastName'],
  ['Email', 'email'],
  ['Phone', 'phone'],
  ['Date of Birth', 'dateOfBirth'],
  ['Gender', 'gender'],
  ['Country', 'country'],
  ['State', 'state'],
  ['Address', 'address'],
  ['Programme', 'programmeName'],
  ['Programme Code', 'programme'],
  ['Highest Qualification', 'highestQualification'],
  ['Institution', 'institution'],
  ['Course of Study', 'courseOfStudy'],
  ['Graduation Year', 'graduationYear'],
  ['Grade / Classification', 'grade'],
  ['Employment Status', 'employmentStatus'],
  ['Organization', 'organization'],
  ['Job Title', 'jobTitle'],
  ['Years of Experience', 'yearsExperience'],
  ['Application Reason', 'applicationReason'],
  ['Referral Source', 'referralSource'],
  ['Contact Preference', 'preferredContact'],
  ['Application Status', null],
  ['Payment Status', null],
  ['Payment Reference', null],
  ['Paystack Transaction ID', null],
  ['Payment Amount', null],
  ['Payment Date', null],
  ['Follow-up Status', null],
  ['Last Contacted', null],
  ['Notes', null],
  ['Updated At', null],
  ['Submission ID', 'submissionId'],
];

var PAYMENT_COLUMNS = [
  'Payment Reference', 'Application ID', 'Initialized At', 'Amount', 'Currency', 'Status',
  'Paystack Transaction ID', 'Channel', 'Paid At', 'Verified At', 'Last Event', 'Updated At',
];

var ENQUIRY_COLUMNS = [
  ['Enquiry ID', null],
  ['Received At', null],
  ['Full Name', 'fullName'],
  ['Email', 'email'],
  ['Phone', 'phone'],
  ['Enquiry Type', 'enquiryType'],
  ['Course', 'course'],
  ['Message', 'message'],
  ['Status', null],
  ['Notes', null],
  ['Updated At', null],
];

/** Maximum stored length per payload field (defence in depth — the website validates first) */
var MAX_LENGTHS = {
  firstName: 60, lastName: 60, email: 254, phone: 24, dateOfBirth: 10, gender: 30, country: 80, state: 100,
  address: 300, programmeName: 120, programme: 40, highestQualification: 60, institution: 150, courseOfStudy: 150,
  graduationYear: 4, grade: 80, employmentStatus: 40, organization: 150, jobTitle: 100, yearsExperience: 40,
  applicationReason: 1500, referralSource: 40, preferredContact: 20, submissionId: 64,
  fullName: 120, enquiryType: 40, course: 120, message: 2000,
};

/* ───────────────────────── Web app entry points ───────────────────────── */

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '');
  } catch (err) {
    return json_({ ok: false, code: 'BAD_REQUEST' });
  }

  if (!body || !isAuthorized_(body.secret)) {
    return json_({ ok: false, code: 'UNAUTHORIZED' });
  }

  var action = ACTIONS_[body.action];
  if (!action) return json_({ ok: false, code: 'UNKNOWN_ACTION' });

  try {
    var result = action(body.payload || {});
    result.ok = true;
    return json_(result);
  } catch (err) {
    if (err && err.code) return json_({ ok: false, code: err.code });
    // Log the error type only — never applicant details
    console.error('CSE data layer error in ' + body.action + ': ' + (err && err.message ? err.message : String(err)));
    return json_({ ok: false, code: 'SERVER_ERROR' });
  }
}

function doGet() {
  return json_({ ok: false, code: 'METHOD_NOT_ALLOWED' });
}

var ACTIONS_ = {
  ping: function () {
    return { status: 'ok' };
  },
  createApplication: createApplication_,
  createEnquiry: createEnquiry_,
  getApplication: getApplication_,
  getPayment: getPayment_,
  recordPaymentInit: recordPaymentInit_,
  recordPaymentResult: recordPaymentResult_,
  listPendingPayments: listPendingPayments_,
};

/* ───────────────────────── Actions ───────────────────────── */

/**
 * Creates an application row, or returns:
 *  - the existing ID when the same submissionId was already recorded (safe retry)
 *  - status "duplicate" when a recent application uses the same email or phone
 */
function createApplication_(payload) {
  var data = cleanPayload_(payload, APPLICATION_COLUMNS);
  requireFields_(data, ['firstName', 'lastName', 'email', 'phone', 'programme', 'programmeName', 'submissionId']);
  if (PROGRAMME_CODES.indexOf(data.programme) === -1) throw codedError_('INVALID_PAYLOAD');
  if (!/^[A-Za-z0-9-]{8,64}$/.test(data.submissionId)) throw codedError_('INVALID_PAYLOAD');
  data.email = data.email.toLowerCase();

  return withLock_(function () {
    var sheet = getSheet_(CONFIG.SHEETS.APPLICATIONS, headersOf_(APPLICATION_COLUMNS));
    var table = readTable_(sheet);
    var col = table.col;
    var now = new Date();
    var windowStart = new Date(now.getTime() - CONFIG.DUPLICATE_WINDOW_DAYS * 86400000);
    var phoneKey = digitsOnly_(data.phone);

    // 1. Same submission retried (double click, network retry): return the original record
    for (var i = 0; i < table.rows.length; i++) {
      if (String(table.rows[i][col['Submission ID']]) === data.submissionId) {
        return { status: 'created', applicationId: String(table.rows[i][col['Application ID']]), idempotent: true };
      }
    }

    // 2. Recent application with the same email or phone
    for (var j = table.rows.length - 1; j >= 0; j--) {
      var row = table.rows[j];
      var submitted = row[col['Submitted At']];
      if (submitted instanceof Date && submitted < windowStart) continue;
      var sameEmail = String(row[col['Email']]).toLowerCase() === data.email;
      var samePhone = phoneKey.length >= 7 && digitsOnly_(String(row[col['Phone']])) === phoneKey;
      if (sameEmail || samePhone) {
        return {
          status: 'duplicate',
          // Returned to the website SERVER only, so it can email the owner of the existing application.
          existing: {
            applicationId: String(row[col['Application ID']]),
            email: String(row[col['Email']]),
            firstName: String(row[col['First Name']]),
            programmeName: String(row[col['Programme']]),
            paymentStatus: String(row[col['Payment Status']]),
          },
        };
      }
    }

    // 3. New application
    var applicationId = nextId_(CONFIG.APPLICATION_PREFIX, 'APPLICATION', now, table.rows, col['Application ID']);
    var values = {};
    APPLICATION_COLUMNS.forEach(function (c) {
      if (c[1]) values[c[0]] = data[c[1]] || '';
    });
    values['Application ID'] = applicationId;
    values['Submitted At'] = now;
    values['Application Status'] = 'Submitted';
    values['Payment Status'] = 'Not Started';
    values['Follow-up Status'] = 'Not Contacted';
    values['Updated At'] = now;

    appendRecord_(sheet, table.headers, values);
    return { status: 'created', applicationId: applicationId, idempotent: false };
  });
}

function createEnquiry_(payload) {
  var data = cleanPayload_(payload, ENQUIRY_COLUMNS);
  requireFields_(data, ['fullName', 'email', 'enquiryType', 'message']);
  data.email = data.email.toLowerCase();

  return withLock_(function () {
    var sheet = getSheet_(CONFIG.SHEETS.ENQUIRIES, headersOf_(ENQUIRY_COLUMNS));
    var table = readTable_(sheet);
    var now = new Date();
    var enquiryId = nextId_(CONFIG.ENQUIRY_PREFIX, 'ENQUIRY', now, table.rows, table.col['Enquiry ID']);
    var values = {};
    ENQUIRY_COLUMNS.forEach(function (c) {
      if (c[1]) values[c[0]] = data[c[1]] || '';
    });
    values['Enquiry ID'] = enquiryId;
    values['Received At'] = now;
    values['Status'] = 'New';
    values['Updated At'] = now;
    appendRecord_(sheet, table.headers, values);
    return { status: 'created', enquiryId: enquiryId };
  });
}

/**
 * Looks up an application for the payment page.
 * When `email` is supplied it must match the application's email, otherwise "not found"
 * is returned — so an Application ID alone never reveals anyone's details.
 */
function getApplication_(payload) {
  var applicationId = String(payload.applicationId || '').trim().toUpperCase();
  if (!/^CSE-\d{4}-\d{6}$/.test(applicationId)) return { found: false };

  var sheet = getSheet_(CONFIG.SHEETS.APPLICATIONS, headersOf_(APPLICATION_COLUMNS));
  var table = readTable_(sheet);
  var col = table.col;
  for (var i = 0; i < table.rows.length; i++) {
    var row = table.rows[i];
    if (String(row[col['Application ID']]) !== applicationId) continue;
    if (payload.email !== undefined && String(row[col['Email']]).toLowerCase() !== String(payload.email).trim().toLowerCase()) {
      return { found: false };
    }
    return {
      found: true,
      application: {
        applicationId: applicationId,
        firstName: String(row[col['First Name']]),
        lastName: String(row[col['Last Name']]),
        email: String(row[col['Email']]),
        programme: String(row[col['Programme Code']]),
        programmeName: String(row[col['Programme']]),
        applicationStatus: String(row[col['Application Status']]),
        paymentStatus: String(row[col['Payment Status']]),
        paymentReference: String(row[col['Payment Reference']] || ''),
      },
    };
  }
  return { found: false };
}


/* ───────────────────────── Payment actions (called by the website server) ───────────────────────── */

var PENDING_STATES = ['Pending', 'Ongoing', 'Processing', 'Queued'];

/** Records a new payment attempt: adds a Payments row and points the application at it. */
function recordPaymentInit_(payload) {
  var applicationId = String(payload.applicationId || '').toUpperCase();
  var reference = String(payload.reference || '');
  var amount = Number(payload.amount);
  if (!/^CSE-\d{4}-\d{6}$/.test(applicationId) || !/^CSE-\d{4}-\d{6}-P[A-Z0-9]{6,24}$/.test(reference)) throw codedError_('INVALID_PAYLOAD');
  if (!(amount > 0) || Math.floor(amount) !== amount) throw codedError_('INVALID_PAYLOAD');

  return withLock_(function () {
    var apps = getSheet_(CONFIG.SHEETS.APPLICATIONS, headersOf_(APPLICATION_COLUMNS));
    var appTable = readTable_(apps);
    var appRow = findRowIndex_(appTable, 'Application ID', applicationId);
    if (appRow === -1) throw codedError_('NOT_FOUND');

    var payments = getSheet_(CONFIG.SHEETS.PAYMENTS, PAYMENT_COLUMNS);
    var payTable = readTable_(payments);
    if (findRowIndex_(payTable, 'Payment Reference', reference) !== -1) return { recorded: false, duplicate: true };

    var now = new Date();
    appendRecord_(payments, payTable.headers, {
      'Payment Reference': reference,
      'Application ID': applicationId,
      'Initialized At': now,
      'Amount': amount,
      'Currency': 'NGN',
      'Status': 'Pending',
      'Last Event': 'initialized',
      'Updated At': now,
    });

    var current = String(appTable.rows[appRow][appTable.col['Payment Status']]);
    if (current !== 'Success') {
      setCells_(apps, appTable, appRow, {
        'Payment Status': 'Pending',
        'Payment Reference': reference,
        'Payment Amount': amount,
        'Updated At': now,
      });
    }
    return { recorded: true };
  });
}

/**
 * Records a verified Paystack result (from callback verification, webhook or the hourly check).
 * Idempotent: repeating the same result changes nothing. A successful payment is never downgraded,
 * except to Reversed for that same transaction.
 */
function recordPaymentResult_(payload) {
  var reference = String(payload.reference || '');
  var status = String(payload.status || '');
  if (!/^CSE-\d{4}-\d{6}-P[A-Z0-9]{6,24}$/.test(reference) || PAYMENT_STATUSES.indexOf(status) === -1) throw codedError_('INVALID_PAYLOAD');
  var applicationId = reference.slice(0, 15);
  var transactionId = payload.transactionId ? String(payload.transactionId).slice(0, 40) : '';
  var channel = payload.channel ? String(payload.channel).slice(0, 40) : '';
  var event = String(payload.event || 'verify').slice(0, 60);
  var paidAt = payload.paidAt ? new Date(payload.paidAt) : null;
  if (paidAt && isNaN(paidAt.getTime())) paidAt = null;
  var amount = Number(payload.amount);

  return withLock_(function () {
    var now = new Date();
    var payments = getSheet_(CONFIG.SHEETS.PAYMENTS, PAYMENT_COLUMNS);
    var payTable = readTable_(payments);
    var payRow = findRowIndex_(payTable, 'Payment Reference', reference);

    if (payRow === -1) {
      // Result for an attempt we never recorded (e.g. recording failed after Paystack initialised it)
      appendRecord_(payments, payTable.headers, {
        'Payment Reference': reference, 'Application ID': applicationId, 'Initialized At': '', 'Amount': amount > 0 ? amount : '',
        'Currency': 'NGN', 'Status': 'Pending', 'Last Event': 'recovered', 'Updated At': now,
      });
      payTable = readTable_(payments);
      payRow = findRowIndex_(payTable, 'Payment Reference', reference);
    }

    var prevStatus = String(payTable.rows[payRow][payTable.col['Status']]);
    var prevTxn = String(payTable.rows[payRow][payTable.col['Paystack Transaction ID']] || '');

    if (prevStatus === status && (status !== 'Success' || prevTxn === transactionId)) {
      return { changed: false, status: status };
    }
    if (prevStatus === 'Success' && status !== 'Reversed') {
      return { changed: false, status: prevStatus };
    }

    var payUpdate = { 'Status': status, 'Last Event': event, 'Verified At': now, 'Updated At': now };
    if (transactionId) payUpdate['Paystack Transaction ID'] = transactionId;
    if (channel) payUpdate['Channel'] = channel;
    if (paidAt) payUpdate['Paid At'] = paidAt;
    setCells_(payments, payTable, payRow, payUpdate);

    // Update the application row
    var apps = getSheet_(CONFIG.SHEETS.APPLICATIONS, headersOf_(APPLICATION_COLUMNS));
    var appTable = readTable_(apps);
    var appRow = findRowIndex_(appTable, 'Application ID', applicationId);
    if (appRow === -1) return { changed: true, status: status, applicationFound: false };

    var col = appTable.col;
    var row = appTable.rows[appRow];
    var appPayStatus = String(row[col['Payment Status']]);
    var latestRef = String(row[col['Payment Reference']]);
    var followUp = String(row[col['Follow-up Status']]);
    var appUpdate = { 'Updated At': now };
    var becameSuccess = false;
    var becameAbandoned = false;

    if (status === 'Success') {
      if (appPayStatus !== 'Success') becameSuccess = true;
      appUpdate['Payment Status'] = 'Success';
      appUpdate['Payment Reference'] = reference;
      if (transactionId) appUpdate['Paystack Transaction ID'] = transactionId;
      if (paidAt) appUpdate['Payment Date'] = paidAt;
      if (amount > 0) appUpdate['Payment Amount'] = amount;
      if (followUp === 'Pending' || followUp === 'Contacted' || followUp === 'Responded') appUpdate['Follow-up Status'] = 'Converted';
    } else if (status === 'Reversed') {
      if (String(row[col['Paystack Transaction ID']]) === transactionId || latestRef === reference) {
        appUpdate['Payment Status'] = 'Reversed';
        if (followUp === 'Not Contacted' || followUp === 'Converted') appUpdate['Follow-up Status'] = 'Pending';
      }
    } else if (appPayStatus !== 'Success' && latestRef === reference) {
      appUpdate['Payment Status'] = status;
      if ((status === 'Abandoned' || status === 'Failed') && followUp === 'Not Contacted') {
        appUpdate['Follow-up Status'] = 'Pending';
      }
      if (status === 'Abandoned' && appPayStatus !== 'Abandoned') becameAbandoned = true;
    }
    setCells_(apps, appTable, appRow, appUpdate);

    var result = { changed: true, status: status, becameSuccess: becameSuccess, becameAbandoned: becameAbandoned };
    if (becameSuccess || becameAbandoned) {
      // Returned to the website server so it can send the payment email
      result.application = {
        applicationId: applicationId,
        firstName: String(row[col['First Name']]),
        email: String(row[col['Email']]),
        programmeName: String(row[col['Programme']]),
      };
    }
    return result;
  });
}

/** Looks up one payment attempt by reference */
function getPayment_(payload) {
  var reference = String(payload.reference || '');
  if (!/^CSE-\d{4}-\d{6}-P[A-Z0-9]{6,24}$/.test(reference)) return { found: false };
  var table = readTable_(getSheet_(CONFIG.SHEETS.PAYMENTS, PAYMENT_COLUMNS));
  var i = findRowIndex_(table, 'Payment Reference', reference);
  if (i === -1) return { found: false };
  var row = table.rows[i];
  var apps = readTable_(getSheet_(CONFIG.SHEETS.APPLICATIONS, headersOf_(APPLICATION_COLUMNS)));
  var a = findRowIndex_(apps, 'Application ID', String(row[table.col['Application ID']]));
  return {
    found: true,
    payment: {
      reference: reference,
      applicationId: String(row[table.col['Application ID']]),
      amount: Number(row[table.col['Amount']]) || null,
      status: String(row[table.col['Status']]),
      programmeName: a === -1 ? '' : String(apps.rows[a][apps.col['Programme']]),
      programme: a === -1 ? '' : String(apps.rows[a][apps.col['Programme Code']]),
    },
  };
}

/** Payment attempts still pending after `olderThanMinutes`, oldest first */
function listPendingPayments_(payload) {
  // Explicit 0 is honoured (used by local dev tooling to test without waiting); anything else
  // omitted/invalid falls back to the normal 60-minute threshold used by the hourly trigger.
  var requested = payload.olderThanMinutes;
  var minutes = requested === 0 ? 0 : Math.max(Number(requested) || 60, 15);
  var limit = Math.min(Math.max(Number(payload.limit) || 25, 1), 100);
  var cutoff = new Date(Date.now() - minutes * 60000);
  var table = readTable_(getSheet_(CONFIG.SHEETS.PAYMENTS, PAYMENT_COLUMNS));
  var col = table.col;
  var out = [];
  table.rows
    .filter(function (r) {
      var started = r[col['Initialized At']];
      return PENDING_STATES.indexOf(String(r[col['Status']])) !== -1 && (!(started instanceof Date) || started <= cutoff);
    })
    .sort(function (a, b) {
      return new Date(a[col['Initialized At']] || 0) - new Date(b[col['Initialized At']] || 0);
    })
    .slice(0, limit)
    .forEach(function (r) {
      out.push({ reference: String(r[col['Payment Reference']]), applicationId: String(r[col['Application ID']]), amount: Number(r[col['Amount']]) || null });
    });
  return { payments: out };
}

/* ───────────────────────── Hourly abandoned-payment check ───────────────────────── */

/**
 * Asks the website to re-check payments that are still pending with Paystack.
 * Payments the customer never completed are marked Abandoned with Follow-up Status = Pending.
 * Requires Script properties RECONCILE_URL (https://your-domain/api/paystack/reconcile) and RECONCILE_SECRET.
 */
function reconcilePayments() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('RECONCILE_URL');
  var secret = props.getProperty('RECONCILE_SECRET');
  if (!url || !secret) {
    console.warn('RECONCILE_URL or RECONCILE_SECRET is not set; skipping payment check.');
    return;
  }
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + secret },
    payload: '{}',
    muteHttpExceptions: true,
  });
  console.log('Payment check finished: HTTP ' + response.getResponseCode() + ' ' + response.getContentText().slice(0, 200));
}

/** Run once from the editor to schedule reconcilePayments every hour. */
function installReconcileTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'reconcilePayments') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('reconcilePayments').timeBased().everyHours(1).create();
  return 'Hourly payment check scheduled';
}

/* ───────────────────────── One-time setup (run from the editor) ───────────────────────── */

/**
 * Creates the Applications, Payments and Enquiries sheets with headers,
 * status dropdowns and text formatting. Safe to run more than once.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  var apps = getSheet_(CONFIG.SHEETS.APPLICATIONS, headersOf_(APPLICATION_COLUMNS));
  styleSheet_(apps, headersOf_(APPLICATION_COLUMNS).length);
  addDropdown_(apps, 'Application Status', APPLICATION_STATUSES);
  addDropdown_(apps, 'Payment Status', PAYMENT_STATUSES);
  addDropdown_(apps, 'Follow-up Status', FOLLOW_UP_STATUSES);
  setDateColumns_(apps, ['Submitted At', 'Payment Date', 'Last Contacted', 'Updated At']);

  var payments = getSheet_(CONFIG.SHEETS.PAYMENTS, PAYMENT_COLUMNS);
  styleSheet_(payments, PAYMENT_COLUMNS.length);
  addDropdown_(payments, 'Status', PAYMENT_STATUSES);
  setDateColumns_(payments, ['Initialized At', 'Paid At', 'Verified At', 'Updated At']);

  var enquiries = getSheet_(CONFIG.SHEETS.ENQUIRIES, headersOf_(ENQUIRY_COLUMNS));
  styleSheet_(enquiries, ENQUIRY_COLUMNS.length);
  addDropdown_(enquiries, 'Status', ENQUIRY_STATUSES);
  setDateColumns_(enquiries, ['Received At', 'Updated At']);

  var secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!secret || secret.length < 32) {
    console.warn('SHARED_SECRET is not set (or shorter than 32 characters). Add it in Project Settings → Script Properties.');
  }
  return 'Sheets ready';
}

/* ───────────────────────── Internals ───────────────────────── */

function isAuthorized_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!expected || expected.length < 32 || typeof provided !== 'string') return false;
  // Constant-time comparison
  var mismatch = expected.length ^ provided.length;
  for (var i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ (provided.charCodeAt(i % Math.max(provided.length, 1)) || 0);
  }
  return mismatch === 0;
}

function findRowIndex_(table, header, value) {
  var idx = table.col[header];
  if (idx === undefined) return -1;
  for (var i = 0; i < table.rows.length; i++) {
    if (String(table.rows[i][idx]) === value) return i;
  }
  return -1;
}

/** Writes named cells on one data row (rowIndex is 0-based within table.rows) */
function setCells_(sheet, table, rowIndex, values) {
  Object.keys(values).forEach(function (header) {
    var c = table.col[header];
    if (c === undefined) return;
    var v = values[header];
    var out = v instanceof Date || typeof v === 'number' ? v : asText_(v);
    sheet.getRange(rowIndex + 2, c + 1).setValue(out);
    table.rows[rowIndex][c] = v;
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function codedError_(code) {
  var err = new Error(code);
  err.code = code;
  return err;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_WAIT_MS)) throw codedError_('BUSY');
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function headersOf_(columns) {
  return columns.map(function (c) {
    return c[0];
  });
}

/** Returns the sheet, creating it (with headers) or adding any missing headers */
function getSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var missing = headers.filter(function (h) {
    return existing.indexOf(h) === -1;
  });
  if (missing.length) {
    var start = existing.filter(String).length + 1;
    sheet.getRange(1, start, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function readTable_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var all = lastRow > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [[]];
  var headers = all[0].map(String);
  var col = {};
  headers.forEach(function (h, i) {
    if (h) col[h] = i;
  });
  return { headers: headers, col: col, rows: all.slice(1) };
}

function appendRecord_(sheet, headers, values) {
  var row = headers.map(function (h) {
    var v = values[h];
    if (v === undefined || v === null) return '';
    if (v instanceof Date || typeof v === 'number') return v;
    return asText_(v);
  });
  sheet.appendRow(row);
}

/**
 * Stores user-supplied text as literal text:
 *  - prevents formula injection (values starting with = + - @)
 *  - keeps leading zeros and + in phone numbers
 * The leading apostrophe is a Sheets text marker and is not displayed.
 */
function asText_(value) {
  var s = String(value);
  return s === '' ? '' : "'" + s;
}

function cleanPayload_(payload, columns) {
  var out = {};
  columns.forEach(function (c) {
    var key = c[1];
    if (!key) return;
    var v = payload[key];
    if (v === undefined || v === null) {
      out[key] = '';
      return;
    }
    if (typeof v !== 'string' && typeof v !== 'number') throw codedError_('INVALID_PAYLOAD');
    var s = String(v)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
    var max = MAX_LENGTHS[key] || 200;
    if (s.length > max) throw codedError_('INVALID_PAYLOAD');
    out[key] = s;
  });
  return out;
}

function requireFields_(data, keys) {
  keys.forEach(function (k) {
    if (!data[k]) throw codedError_('INVALID_PAYLOAD');
  });
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw codedError_('INVALID_PAYLOAD');
}

function digitsOnly_(s) {
  var d = String(s || '').replace(/\D/g, '');
  // Treat 0802… and 234802… as the same Nigerian number
  if (d.indexOf('234') === 0 && d.length === 13) d = '0' + d.slice(3);
  return d;
}

/**
 * Next sequential ID for the current year, e.g. CSE-2026-000001.
 * The counter lives in Script Properties (so deleting rows never reuses an ID).
 * If the property is missing, it is rebuilt from the highest ID in the sheet.
 * Must be called inside withLock_.
 */
function nextId_(prefix, kind, now, rows, idColIndex) {
  var year = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy');
  var props = PropertiesService.getScriptProperties();
  var key = 'SEQ_' + kind + '_' + year;
  var current = parseInt(props.getProperty(key) || '', 10);

  if (isNaN(current)) {
    current = 0;
    var pattern = new RegExp('^' + prefix + '-' + year + '-(\\d{6})$');
    for (var i = 0; i < rows.length; i++) {
      var m = pattern.exec(String(rows[i][idColIndex]));
      if (m) current = Math.max(current, parseInt(m[1], 10));
    }
  }

  var next = current + 1;
  props.setProperty(key, String(next));
  return prefix + '-' + year + '-' + ('000000' + next).slice(-6);
}

function styleSheet_(sheet, width) {
  sheet.setFrozenRows(1);
  var header = sheet.getRange(1, 1, 1, width);
  header.setFontWeight('bold').setBackground('#0e3b25').setFontColor('#ffffff').setWrap(true);
  sheet.setColumnWidths(1, width, 160);
}

function addDropdown_(sheet, headerName, options) {
  var table = readTable_(sheet);
  var idx = table.col[headerName];
  if (idx === undefined) return;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(options, true).setAllowInvalid(false).build();
  sheet.getRange(2, idx + 1, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
}

function setDateColumns_(sheet, headerNames) {
  var table = readTable_(sheet);
  headerNames.forEach(function (h) {
    var idx = table.col[h];
    if (idx === undefined) return;
    sheet.getRange(2, idx + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('dd mmm yyyy, hh:mm');
  });
}
