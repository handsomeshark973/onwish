// 훅: Claude가 파일을 만들거나 고칠 때마다 자동으로 실행됩니다.
// 코드에 비밀 키가 직접 적혀 있으면 Claude에게 경고를 돌려보내 .env로 옮기게 합니다.
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let file;
  try { file = JSON.parse(raw).tool_input?.file_path; } catch { process.exit(0); }
  if (!file) process.exit(0);
  // Windows에서 /c/Users/... 형식으로 오면 C:/Users/... 로 바꿔 읽습니다.
  if (process.platform === 'win32' && /^\/[a-zA-Z]\//.test(file)) file = file[1] + ':' + file.slice(2);
  const base = path.basename(file);
  if (base.startsWith('.env') || base === 'check-keys.js') process.exit(0);
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { process.exit(0); }
  const rules = [
    ['Resend API 키', /\bre_(?=[A-Za-z0-9_]*\d)[A-Za-z0-9_]{20,}/],
    ['Anthropic API 키', /\bsk-ant-[A-Za-z0-9_\-]{20,}/],
    ['Inngest Signing Key', /\bsignkey-[a-z]+-[A-Za-z0-9]{20,}/],
    ['Supabase 비밀 키', /\bsb_secret_[A-Za-z0-9_\-]{10,}/],
    ['비밀 값', /(SECRET|PASSWORD|TOKEN)\s*[:=]\s*['"][^'"\s]{16,}['"]/i],
  ];
  const hit = rules.filter(([, re]) => re.test(text)).map(([n]) => n);
  if (!hit.length) process.exit(0);
  process.stderr.write(
    `⚠ 훅 경고: ${base} 안에 ${hit.join(', ')}가 직접 적혀 있습니다. ` +
    `키는 .env에 넣고 코드에서는 불러와서 쓰도록 바로 고쳐 주세요. 키 값은 화면에 다시 출력하지 마세요.`
  );
  process.exit(2);
});
