/**
 * Smart CSV data analyzer for AutoDash charts
 * Detects columns, aggregates, and prepares chart-ready data
 */

/** Check if a column looks like a date */
export function isDateColumn(col, data) {
  const sample = data.slice(0, 10).map(r => r[col]).filter(Boolean);
  if (sample.length === 0) return false;
  
  return sample.some(v => {
    const str = String(v).trim();
    // Pure numbers (like "1", "1980", "5000") should NOT be dates
    if (/^-?\d+(\.\d+)?$/.test(str)) return false;
    // Check if it parses as a valid date and has date-like characters
    return !isNaN(Date.parse(str)) && (str.includes('-') || str.includes('/') || /[a-zA-Z]/.test(str));
  });
}

/** Check if a column is numeric */
export function isNumericColumn(col, data) {
  const sample = data.slice(0, 10).map(r => r[col]).filter(Boolean);
  if (sample.length === 0) return false;
  
  const nums = sample.filter(v => {
    const str = String(v).trim();
    if (str === '') return false;
    return !isNaN(parseFloat(str.replace(/[,$%]/g, '')));
  });
  return nums.length / sample.length >= 0.7;
}

/** Parse a numeric cell — handles $1,234 and 12.5% etc */
export function parseNum(val) {
  if (val === null || val === undefined || val === '') return 0;
  return parseFloat(String(val).replace(/[,$%\s]/g, '')) || 0;
}

/** Check if a column looks like an ID/Hash (cryptic hex strings, etc.) */
export function isLikelyId(col, data) {
  const name = String(col).toLowerCase();
  if (['id', 'key', 'uuid', 'guid', 'uid', 'hash', 'token', 'index'].some(k => name.includes(k))) return true;
  
  const sample = data.slice(0, 10).map(r => String(r[col] || '')).filter(v => v.length > 0);
  if (!sample.length) return false;
  
  // Detect hex-like strings or very long alphanumeric values
  return sample.some(v => /^[0-9a-fA-F-]{8,}$/.test(v) || (v.length > 15 && /[0-9]/.test(v) && /[a-zA-Z]/.test(v)));
}

/** Classify all columns */
export function classifyColumns(headers, data) {
  const numeric = [];
  const dates = [];
  const text = [];
  const ids = [];
  
  headers.forEach(h => {
    if (isDateColumn(h, data)) dates.push(h);
    else if (isNumericColumn(h, data)) numeric.push(h);
    else if (isLikelyId(h, data)) ids.push(h);
    else text.push(h);
  });
  
  return { numeric, dates, text, ids };
}

/** Build accurate chart data: Aggregates ALL rows by label and sorts dates */
export function buildChartData(data, labelCol, numericCols) {
  const map = {};
  const isDate = isDateColumn(labelCol, data);
  const metrics = numericCols.slice(0, 5);
  
  data.forEach(row => {
    let rawLabel = row[labelCol];
    let key = String(rawLabel ?? 'Unknown');
    if (!map[key]) {
      map[key] = { name: key, _date: isDate ? new Date(rawLabel).getTime() : 0 };
      metrics.forEach(c => map[key][c] = 0);
      if (!metrics.length) map[key].Count = 0;
    }
    metrics.forEach(c => map[key][c] += parseNum(row[c]));
    if (!metrics.length) map[key].Count += 1;
  });

  let result = Object.values(map);
  
  if (isDate) {
    result = result.filter(d => !isNaN(d._date)).sort((a, b) => a._date - b._date);
  } else {
    const sortKey = metrics[0] || 'Count';
    result.sort((a, b) => b[sortKey] - a[sortKey]);
  }

  return result.slice(0, 40).map(d => {
    let name = d.name;
    if (name.length > 18) name = name.substring(0, 18) + '…';
    return { ...d, name };
  });
}

/** Aggregate data by a text category column */
export function aggregateByCategory(data, catCol, valueCol) {
  const map = {};
  data.forEach(row => {
    let cat = String(row[catCol] ?? 'Other');
    if (cat.length > 20) cat = cat.substring(0, 20) + '…';
    map[cat] = (map[cat] || 0) + (valueCol ? parseNum(row[valueCol]) : 1);
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
}

/** Compute summary stats for a numeric column */
export function getStats(data, col) {
  const vals = data.map(r => parseNum(r[col])).filter(v => !isNaN(v) && v !== 0);
  if (!vals.length) return { sum: 0, avg: 0, max: 0, min: 0, trend: 0 };
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = sum / vals.length;
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const half = Math.floor(vals.length / 2);
  const firstHalf = vals.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
  const secondHalf = vals.slice(half).reduce((a, b) => a + b, 0) / (half || 1);
  const trend = firstHalf ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  return { sum, avg, max, min, trend: +trend.toFixed(1), count: vals.length };
}

/** Compute AI Insights */
export function getAIInsights(data, cols) {
  const insights = [];
  const { numeric, text, dates } = cols;

  // 1. Trend Insights
  numeric.slice(0, 3).forEach(col => {
    const stats = getStats(data, col);
    if (Math.abs(stats.trend) > 15) {
      insights.push({
        type: 'trend',
        title: `${col} is ${stats.trend > 0 ? 'Surging' : 'Dropping'}`,
        text: `${col} shows a ${Math.abs(stats.trend)}% ${stats.trend > 0 ? 'increase' : 'decrease'} in the latter half of the dataset.`,
        sentiment: stats.trend > 0 ? 'positive' : 'negative'
      });
    }
  });

  // 2. Frequency Insights
  text.slice(0, 2).forEach(col => {
    const counts = {};
    data.forEach(r => { const v = r[col]; counts[v] = (counts[v] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    if (sorted[0]) {
      const pct = ((sorted[0][1] / data.length) * 100).toFixed(1);
      insights.push({
        type: 'freq',
        title: `Dominant ${col}: ${sorted[0][0]}`,
        text: `"${sorted[0][0]}" accounts for ${pct}% of all entries in the ${col} column.`,
        sentiment: 'neutral'
      });
    }
  });

  // 3. Outlier Detection
  numeric.slice(0, 2).forEach(col => {
    const vals = data.map(r => parseNum(r[col])).filter(v => v !== 0);
    const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
    const max = Math.max(...vals);
    if (max > avg * 3) {
      insights.push({
        type: 'anomaly',
        title: `Potential Outlier in ${col}`,
        text: `The maximum value (${fmt(max)}) is significantly higher than the average (${fmt(avg)}).`,
        sentiment: 'warning'
      });
    }
  });

  return insights.length ? insights : [{ type: 'info', title: 'Data is Stable', text: 'No major anomalies or sharp trends detected in this dataset.', sentiment: 'neutral' }];
}

/** Chatbot Logic */
export function chatbotResponse(query, data, cols) {
  const q = query.toLowerCase();
  const { numeric, text } = cols;

  // Handle "Top 5 [Column]"
  const topMatch = q.match(/top (\d+)\s+(.+)/i);
  if (topMatch) {
    const count = parseInt(topMatch[1]);
    const col = text.find(c => q.includes(c.toLowerCase())) || numeric.find(c => q.includes(c.toLowerCase()));
    if (col) {
      const sorted = [...data].sort((a,b) => parseNum(b[col]) - parseNum(a[col])).slice(0, count);
      return `The top ${count} entries for ${col} are: ` + sorted.map(r => `${r[col] || 'N/A'}`).join(', ') + '.';
    }
  }

  // Handle "Average [Column]"
  if (q.includes('average') || q.includes('mean')) {
    const col = numeric.find(c => q.includes(c.toLowerCase()));
    if (col) {
      const stats = getStats(data, col);
      return `The average value for ${col} is ${fmt(stats.avg)}.`;
    }
  }

  // Handle "Most common [Column]"
  if (q.includes('common') || q.includes('frequent')) {
    const col = text.find(c => q.includes(c.toLowerCase()));
    if (col) {
      const counts = {};
      data.forEach(r => { const v = r[col]; counts[v] = (counts[v] || 0) + 1; });
      const best = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
      return `The most frequent ${col} is "${best[0]}" with ${best[1]} occurrences.`;
    }
  }

  return "I'm not sure about that. Try asking about 'top 5 [column]', 'average [column]', or 'most common [column]'.";
}

/** Format large numbers */
export function fmt(num) {
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}
