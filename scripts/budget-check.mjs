#!/usr/bin/env node
/**
 * Agape Sovereign - Daily Budget Check Script
 * Queries BigQuery billing export and alerts on threshold breaches
 * 
 * Usage: node scripts/budget-check.mjs
 * 
 * Required env vars:
 * - BILLING_ACCOUNT_ID: GCP billing account ID
 * - BUDGET_THRESHOLD_WARN: Warning threshold in USD (default: 5)
 * - BUDGET_THRESHOLD_CRITICAL: Critical threshold in USD (default: 25)
 * - SLACK_WEBHOOK_URL: (optional) Slack webhook for alerts
 * - BIGQUERY_BILLING_EXPORT_TABLE: (optional) Full table ID, default: project.dataset.table
 */

let BigQuery;
try {
  ({ BigQuery } = await import('@google-cloud/bigquery'));
} catch {
  console.log('[BUDGET_CHECK] @google-cloud/bigquery not available — skipping');
  process.exit(0);
}
import https from 'https';

const PROJECT_ID = 'agape-sovereign';
const BILLING_ACCOUNT_ID = process.env.BILLING_ACCOUNT_ID;
const BUDGET_WARN = parseFloat(process.env.BUDGET_THRESHOLD_WARN) || 5;
const BUDGET_CRITICAL = parseFloat(process.env.BUDGET_THRESHOLD_CRITICAL) || 25;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const BIGQUERY_TABLE = process.env.BIGQUERY_BILLING_EXPORT_TABLE || `${PROJECT_ID}.billing_export.gcp_billing_export_v1`;

const bigquery = new BigQuery({ projectId: PROJECT_ID });

async function checkTableExists() {
  try {
    const [tables] = await bigquery.dataset('billing_export').getTables();
    return tables.some(t => t.id.startsWith('gcp_billing_export_v1'));
  } catch {
    return false;
  }
}

async function getMonthlySpend() {
  const query = `
    SELECT
      SUM(cost) as total_cost_usd,
      service.description as service,
      SUM(cost) as service_cost_usd
    FROM \`${BIGQUERY_TABLE}\`
    WHERE DATE(usage_start_time, "America/New_York") >= DATE_TRUNC(DATE_SUB(CURRENT_DATE("America/New_York"), INTERVAL 1 DAY), MONTH)
      AND DATE(usage_start_time, "America/New_York") < DATE_TRUNC(CURRENT_DATE("America/New_York"), MONTH)
      AND project.id = '${PROJECT_ID}'
    GROUP BY service
    ORDER BY service_cost_usd DESC
  `;

  const [rows] = await bigquery.query(query);
  const total = rows.reduce((sum, r) => sum + (r.total_cost_usd || 0), 0);
  return { total, breakdown: rows };
}

async function getDailySpend() {
  const query = `
    SELECT
      DATE(usage_start_time, "America/New_York") as date,
      SUM(cost) as daily_cost_usd
    FROM \`${BIGQUERY_TABLE}\`
    WHERE DATE(usage_start_time, "America/New_York") >= DATE_SUB(CURRENT_DATE("America/New_York"), INTERVAL 30 DAY)
      AND project.id = '${PROJECT_ID}'
    GROUP BY date
    ORDER BY date DESC
    LIMIT 30
  `;

  const [rows] = await bigquery.query(query);
  return rows;
}

function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}

function getAlertLevel(total) {
  if (total >= BUDGET_CRITICAL) return 'CRITICAL';
  if (total >= BUDGET_WARN) return 'WARNING';
  return 'OK';
}

function buildMessage(data) {
  const { total, breakdown, daily } = data;
  const level = getAlertLevel(total);
  const emoji = level === 'CRITICAL' ? '🚨' : level === 'WARNING' ? '⚠️' : '✅';
  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });

  let msg = `${emoji} *Agape Sovereign - ${month} Budget Alert*\n\n`;
  msg += `*Status:* ${level}\n`;
  msg += `*Month-to-date:* ${formatCurrency(total)} / ${formatCurrency(BUDGET_CRITICAL)} (${((total / BUDGET_CRITICAL) * 100).toFixed(1)}%)\n`;
  msg += `*Warning threshold:* ${formatCurrency(BUDGET_WARN)}\n`;
  msg += `*Critical threshold:* ${formatCurrency(BUDGET_CRITICAL)}\n\n`;

  if (breakdown.length > 0) {
    msg += `*Top Services:*\n`;
    breakdown.slice(0, 5).forEach((row, i) => {
      msg += `${i + 1}. ${row.service}: ${formatCurrency(row.service_cost_usd)}\n`;
    });
    msg += '\n';
  }

  if (daily.length > 0) {
    msg += `*Last 7 Days:*\n`;
    daily.slice(0, 7).forEach(d => {
      const date = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
      msg += `${date}: ${formatCurrency(d.daily_cost_usd)}\n`;
    });
  }

  return msg;
}

async function sendSlackAlert(message) {
  if (!SLACK_WEBHOOK) return;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ text: message, mrkdwn: true });
    const url = new URL(SLACK_WEBHOOK);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => res.statusCode === 200 ? resolve() : reject(new Error(`Slack: ${res.statusCode} ${body}`)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting budget check for ${PROJECT_ID}...`);

  try {
const tableExists = await checkTableExists();
  if (!tableExists) {
    const msg = `⚠️ *Budget Check Skipped*\nProject: ${PROJECT_ID}\n\nBilling export not configured yet.\n\n**To enable:**\n1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_ID}\n2. Click "Billing export" → "Export to BigQuery"\n3. Select dataset: billing_export\n4. Data will appear in 24-48 hours\n\nRun again after setup.`;
    console.log(msg);
    if (SLACK_WEBHOOK) {
      await sendSlackAlert(msg);
    }
    return;
  }

  const [monthly, daily] = await Promise.all([getMonthlySpend(), getDailySpend()]);
  const message = buildMessage({ total: monthly.total, breakdown: monthly.breakdown, daily });
    const level = getAlertLevel(monthly.total);

    console.log(message);

    if (level !== 'OK') {
      console.log(`[ALERT] Budget ${level}: ${formatCurrency(monthly.total)}`);
      if (SLACK_WEBHOOK) {
        await sendSlackAlert(message);
        console.log('[SLACK] Alert sent');
      }
    }

    if (level === 'CRITICAL') {
      process.exit(1);
    }
  } catch (error) {
    console.error('[ERROR] Budget check failed:', error.message);
    if (SLACK_WEBHOOK) {
      await sendSlackAlert(`🚨 *Budget Check Failed*\nProject: ${PROJECT_ID}\nError: ${error.message}`).catch(() => {});
    }
    process.exit(1);
  }
}

main();