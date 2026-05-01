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
    .slice(0, 50)
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

/** Standard Deviation */
export function calculateStdDev(vals) {
  const n = vals.length;
  if (n < 2) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / n;
  const variance = vals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (n - 1);
  return Math.sqrt(variance);
}

/** Median */
export function calculateMedian(vals) {
  if (!vals.length) return 0;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Simple Linear Regression for Forecasting */
export function predictNextValue(vals) {
  const n = vals.length;
  if (n < 2) return null;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += vals[i];
    sumXY += i * vals[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
// Predict next point (n)
  return slope * n + intercept;
}

/** Get high-level summary info */
export function getSmartSummary(data, headers, cols) {
  if (!data) return { rows: 0, cols: 0, missing: 0 };
  let missing = 0;
  data.forEach(r => {
    headers.forEach(h => {
      if (r[h] === null || r[h] === undefined || String(r[h]).trim() === '') missing++;
    });
  });
  return {
    rows: data.length,
    cols: headers.length,
    missing
  };
}

/** Pearson Correlation */
export function getCorrelation(data, colA, colB) {
  const valsA = data.map(r => parseNum(r[colA])).filter(v => !isNaN(v));
  const valsB = data.map(r => parseNum(r[colB])).filter(v => !isNaN(v));
  const n = Math.min(valsA.length, valsB.length);
  if (n < 2) return 0;

  let sumA = 0, sumB = 0, sumA2 = 0, sumB2 = 0, sumAB = 0;
  for (let i = 0; i < n; i++) {
    const a = valsA[i], b = valsB[i];
    sumA += a; sumB += b;
    sumA2 += a * a; sumB2 += b * b;
    sumAB += a * b;
  }
  const num = n * sumAB - sumA * sumB;
  const den = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  return den === 0 ? 0 : num / den;
}

/** Get Detailed Column Stats (Pandas describe equivalent) */
export function getDetailedStats(data, headers, cols) {
  const { numeric, text, dates } = cols;
  const result = {};

  numeric.forEach(col => {
    let missing = 0;
    const vals = data.map(r => {
      const v = r[col];
      if (v === null || v === undefined || String(v).trim() === '') {
        missing++;
        return NaN;
      }
      return parseNum(v);
    }).filter(v => !isNaN(v));

    if (!vals.length) {
      result[col] = { type: 'numeric', count: 0, mean: 0, median: 0, min: 0, max: 0, std: 0, missing };
      return;
    }
    result[col] = {
      type: 'numeric',
      count: vals.length,
      mean: vals.reduce((a, b) => a + b, 0) / vals.length,
      median: calculateMedian(vals),
      min: Math.min(...vals),
      max: Math.max(...vals),
      std: calculateStdDev(vals),
      missing
    };
  });

  text.concat(dates).forEach(col => {
    const counts = {};
    let missing = 0;
    data.forEach(r => {
      const v = r[col];
      if (v === null || v === undefined || String(v).trim() === '') {
        missing++;
        return;
      }
      counts[v] = (counts[v] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    result[col] = {
      type: 'categorical',
      unique: Object.keys(counts).length,
      top: sorted[0]?.[0] || 'N/A',
      freq: sorted[0]?.[1] || 0,
      pct: sorted[0] ? ((sorted[0][1] / data.length) * 100).toFixed(1) : 0,
      missing
    };
  });

  return result;
}

/** Compute AI Insights with Advanced Logic */
export function getAIInsights(data, cols) {
  const insights = [];
  const { numeric, text, dates } = cols;

  if (!data || data.length < 5) return [];

  // 1. ANOMALIES (Spikes & Drops)
  numeric.slice(0, 3).forEach(col => {
    const vals = data.map(r => parseNum(r[col])).filter(v => !isNaN(v));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    
    const spikes = vals.filter(v => v > mean * 2);
    const drops = vals.filter(v => v < mean * 0.5 && v > 0);
    const totalAnomalies = spikes.length + drops.length;

    if (totalAnomalies > 0) {
      if (spikes.length > 0) {
        insights.push({
          type: 'anomaly',
          title: `Spike detected ⚠️`,
          text: `Found ${spikes.length} values in ${col} that are more than 2x the average (${fmt(mean)}). Peak value: ${fmt(Math.max(...spikes))}.`,
          sentiment: 'warning', confidence: 'High', icon: '⚠️',
          total: totalAnomalies
        });
      }
      if (drops.length > 0) {
        insights.push({
          type: 'anomaly',
          title: `Sudden drop detected 📉`,
          text: `Found ${drops.length} values in ${col} that are less than 50% of the average. These may be underperforming records or data gaps.`,
          sentiment: 'negative', confidence: 'High', icon: '📉',
          total: totalAnomalies
        });
      }
    }
  });

  // 2. TRENDS & GROWTH (Exact 30% Logic)
  numeric.slice(0, 2).forEach(col => {
    const vals = data.map(r => parseNum(r[col])).filter(v => !isNaN(v));
    const size = Math.floor(vals.length * 0.3);
    if (size >= 2) {
      const startAvg = vals.slice(0, size).reduce((a, b) => a + b, 0) / size;
      const endAvg = vals.slice(-size).reduce((a, b) => a + b, 0) / size;
      const diff = ((endAvg - startAvg) / (startAvg || 1)) * 100;
      
      if (diff > 15) {
        insights.push({
          type: 'trend',
          title: `Increasing trend 📈`,
          text: `Growth of ${diff.toFixed(1)}% detected in ${col} when comparing earlier records with the most recent 30%.`,
          sentiment: 'positive', confidence: 'High', icon: '📈'
        });
      } else if (diff < -15) {
        insights.push({
          type: 'trend',
          title: `Declining trend ⚠️`,
          text: `A decline of ${Math.abs(diff).toFixed(1)}% detected in ${col}. Recent activity is significantly lower than the baseline.`,
          sentiment: 'negative', confidence: 'High', icon: '⚠️'
        });
      }
    }
  });

  // 3. PEAK DETECTION (Top 5%)
  numeric.slice(0, 1).forEach(col => {
    const vals = data.map(r => parseNum(r[col])).filter(v => !isNaN(v)).sort((a,b) => b-a);
    const topCount = Math.ceil(vals.length * 0.05);
    if (topCount > 0) {
      const threshold = vals[topCount - 1];
      insights.push({
        type: 'peak',
        title: `Peak Performance Detected`,
        text: `🔥 Top 5% of records in ${col} are above ${fmt(threshold)}. These represent high-impact outlier events across your dataset.`,
        sentiment: 'positive', confidence: 'High', icon: '🔥'
      });
    }
  });

  // 3. FORECAST
  numeric.slice(0, 1).forEach(col => {
    const vals = data.map(r => parseNum(r[col])).slice(-20); // Last 20 for short term forecast
    const nextVal = predictNextValue(vals);
    if (nextVal !== null) {
      insights.push({
        type: 'forecast',
        title: `Forward Forecast: ${col}`,
        text: `📊 Based on linear trend analysis, the next expected value for ${col} is approximately ${fmt(nextVal)}. The current momentum is ${nextVal > vals[vals.length-1] ? 'upward' : 'downward'}.`,
        sentiment: 'neutral', confidence: 'Medium', icon: '🔮'
      });
    }
  });

  // 4. CORRELATIONS
  if (numeric.length >= 2) {
    const a = numeric[0], b = numeric[1];
    const corr = getCorrelation(data, a, b);
    if (Math.abs(corr) > 0.6) {
      insights.push({
        type: 'relation',
        title: `Correlation: ${a} & ${b}`,
        text: `💡 There is a ${corr > 0 ? 'positive' : 'negative'} link between these metrics. As ${a} ${corr > 0 ? 'rises' : 'rises'}, ${b} tends to ${corr > 0 ? 'rise' : 'fall'}. Strength: ${(Math.abs(corr) * 100).toFixed(0)}%.`,
        sentiment: 'positive', confidence: 'High', icon: '🔗'
      });
    }
  }

  // 5. TIME PATTERNS
  const dateCol = dates[0];
  if (dateCol) {
    const dayCounts = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    data.forEach(r => {
      const d = new Date(r[dateCol]);
      if (!isNaN(d.getDay())) dayCounts[d.getDay()]++;
    });
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDay = Object.entries(dayCounts).sort((a,b) => b[1] - a[1])[0];
    if (bestDay && bestDay[1] > 0) {
      insights.push({
        type: 'time',
        title: `Peak Activity Day`,
        text: `📅 ${days[bestDay[0]]} is your most active day, accounting for ${((bestDay[1]/data.length)*100).toFixed(1)}% of total entries.`,
        sentiment: 'neutral', confidence: 'High', icon: '📅'
      });
    }
  }

  return insights;
}

/** Response generator for rule-based explanation */
export function generateExplanation(insight) {
  const map = {
    trend: "This trend indicates a systematic change in your metrics over time. Upward trends often signal successful scaling, while downward trends might require operational review.",
    anomaly: "Anomalies are data points that differ significantly from other observations. They are important because they can indicate errors, but also unique opportunities or 'black swan' events.",
    relation: "A strong correlation suggests these two variables are functionally linked. You can potentially use one to predict or influence the other.",
    forecast: "Forecasting uses mathematical regression to project the next likely data point. While not 100% certain, it provides a data-driven baseline for future expectations.",
    time: "Time-based patterns reveal cyclical behavior in your users or processes. Understanding weekend vs. weekday load can help in resource allocation."
  };
  return map[insight.type] || "This insight represents a statistically significant pattern detected by the analysis engine across your dataset.";
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
      const sum = data.reduce((a, b) => a + parseNum(b[col]), 0);
      return `The average value for ${col} is ${fmt(sum / data.length)}.`;
    }
  }

  return "I'm not sure about that. Try asking about 'top 5 [column]' or 'average [column]'.";
}

/** Format large numbers */
export function fmt(num) {
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}
