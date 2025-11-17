import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

let sheetsClient;

function getCredentials() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google Sheets service account credentials.");
  }

  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const { clientEmail, privateKey } = getCredentials();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

export async function getSheetValues(range, overrideSpreadsheetId) {
  const spreadsheetId = overrideSpreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured.");
  }

  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}
