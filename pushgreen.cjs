const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'activity.txt');

// Pakistan National and Religious Holidays (YYYY-MM-DD or MM-DD for recurring)
const RECURRING_HOLIDAYS = new Set([
  '02-05', // Kashmir Day
  '03-23', // Pakistan Day
  '05-01', // Labour Day
  '08-14', // Independence Day
  '11-09', // Iqbal Day
  '12-25', // Quaid-e-Azam Day / Christmas
  '12-26', // Day after Christmas
]);

// Islamic lunar holidays in Pakistan for 2025 & 2026
const DATED_HOLIDAYS = new Set([
  // 2025
  '2025-02-14',
  '2025-03-30', '2025-03-31', '2025-04-01', '2025-04-02',
  '2025-06-06', '2025-06-07', '2025-06-08', '2025-06-09',
  '2025-07-05', '2025-07-06',
  '2025-09-05',
  // 2026
  '2026-02-04',
  '2026-03-20', '2026-03-21', '2026-03-22', '2026-03-23',
  '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29',
  '2026-06-25', '2026-06-26',
  '2026-08-25',
]);

function isHolidayOrWeekend(d) {
  const dayOfWeek = d.getDay();
  // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();

  const mmdd = `${mm}-${dd}`;
  const yyyymmdd = `${yyyy}-${mm}-${dd}`;

  if (RECURRING_HOLIDAYS.has(mmdd)) return true;
  if (DATED_HOLIDAYS.has(yyyymmdd)) return true;

  return false;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function run() {
  console.log('Starting commit generation for green contribution graph...');
  
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 365); // 1 full year back

  let totalCommits = 0;
  let workingDays = 0;

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const current = new Date(d);
    if (isHolidayOrWeekend(current)) {
      continue;
    }

    workingDays++;
    // 2 to 5 commits per working day for rich green tones
    const commitCount = getRandomInt(2, 5);

    for (let i = 0; i < commitCount; i++) {
      const hour = getRandomInt(9, 18);
      const minute = getRandomInt(0, 59);
      const second = getRandomInt(0, 59);
      
      const commitDate = new Date(current);
      commitDate.setHours(hour, minute, second);
      const isoDate = commitDate.toISOString();

      fs.appendFileSync(LOG_FILE, `Activity entry: ${isoDate}\n`);
      execSync('git add activity.txt');

      const commitMsg = `feat: update activity record [${isoDate.slice(0, 10)}]`;
      execSync(`git commit -m "${commitMsg}"`, {
        env: {
          ...process.env,
          GIT_AUTHOR_DATE: isoDate,
          GIT_COMMITTER_DATE: isoDate,
        },
        stdio: 'ignore',
      });

      totalCommits++;
    }
  }

  console.log(`Successfully generated ${totalCommits} commits across ${workingDays} working days.`);
}

run();
