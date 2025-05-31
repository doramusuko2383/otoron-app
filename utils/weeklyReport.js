import { supabase } from './supabaseClient.js';
import { chords, chordOrder } from '../data/chords.js';
import { REQUIRED_DAYS } from './growthUtils.js';

export async function generateWeeklyReport(user, startDate, endDate) {
  const userId = typeof user === 'string' ? user : user?.id;
  const userName = typeof user === 'object' ? user?.name : null;

  const { data: trainingSessions, error: sesErr } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('session_date', startDate)
    .lte('session_date', endDate);

  if (sesErr) {
    console.error('❌ セッション取得失敗:', sesErr);
    return;
  }

  const { data: progress, error: progErr } = await supabase
    .from('user_chord_progress')
    .select('chord_key, status')
    .eq('user_id', userId)
    .not('status', 'eq', 'locked');

  if (progErr) {
    console.error('❌ 進捗取得失敗:', progErr);
    return;
  }

  const totalSessions = trainingSessions.length;

  const { data: qualifiedDays, error: qualErr } = await supabase
    .from('qualified_days')
    .select('qualified_date')
    .eq('user_id', userId)
    .gte('qualified_date', startDate)
    .lte('qualified_date', endDate);

  if (qualErr) {
    console.error('❌ 合格日数取得失敗:', qualErr);
    return;
  }
  const passedDays = qualifiedDays.length;
  const totalQuestions = trainingSessions.reduce((sum, s) => sum + (s.total_count || 0), 0);
  const totalCorrect = trainingSessions.reduce((sum, s) => sum + (s.correct_count || 0), 0);
  const accuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0.0';

  const prevStart = new Date(startDate);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStartStr = prevStart.toISOString().split('T')[0];
  const prevEndStr = prevEnd.toISOString().split('T')[0];

  const { data: lastSessions, error: lastErr } = await supabase
    .from('training_sessions')
    .select('correct_count, total_count')
    .eq('user_id', userId)
    .gte('session_date', prevStartStr)
    .lte('session_date', prevEndStr);

  if (lastErr) {
    console.error('❌ 先週データ取得失敗:', lastErr);
    return;
  }

  const lastTotalQ = lastSessions.reduce((sum, s) => sum + (s.total_count || 0), 0);
  const lastTotalC = lastSessions.reduce((sum, s) => sum + (s.correct_count || 0), 0);
  const lastWeekAccuracy = lastTotalQ > 0 ? (lastTotalC / lastTotalQ) * 100 : 0;

  const chordLabelMap = Object.fromEntries(chords.map(c => [c.key, c.label]));
  const chordNames = progress.map(p => chordLabelMap[p.chord_key] || p.chord_key).join('、');

  const inversionMap = new Map();
  const topBottomMap = new Map();
  let initialMistakeCount = 0;
  let inversionMistakeTotal = 0;
  let topBottomMistakeTotal = 0;

  trainingSessions.forEach(session => {
    const m = session.mistakes_json;
    if (m?.initial_mistake) initialMistakeCount++;
    m?.inversion_confusions?.forEach(i => {
      const key = `${i.question}|${i.answer}`;
      const c = i.count || 1;
      inversionMap.set(key, (inversionMap.get(key) || 0) + c);
      inversionMistakeTotal += c;
    });
    m?.top_bottom_confusions?.forEach(i => {
      const key = `${i.question}|${i.answer}`;
      const c = i.count || 1;
      topBottomMap.set(key, (topBottomMap.get(key) || 0) + c);
      topBottomMistakeTotal += c;
    });
  });

  const inversionMistakes = Array.from(inversionMap.entries()).map(([key, count]) => {
    const [q, a] = key.split('|');
    return `・「${q}」→「${a}」（転回形ミス）×${count}`;
  });
  const topBottomMistakes = Array.from(topBottomMap.entries()).map(([key, count]) => {
    const [q, a] = key.split('|');
    return `・「${q}」→「${a}」（上下音一致）×${count}`;
  });

  const unlockedKeys = new Set(progress.map(p => p.chord_key));
  const nextKey = chordOrder.find(key => !unlockedKeys.has(key));
  const nextUnlockChord = nextKey ? chordLabelMap[nextKey] || nextKey : null;

  const consFrom = new Date(endDate);
  consFrom.setDate(consFrom.getDate() - (REQUIRED_DAYS - 1));
  const consFromStr = consFrom.toISOString().split('T')[0];

  const { data: recentQualified, error: recentErr } = await supabase
    .from('qualified_days')
    .select('qualified_date')
    .eq('user_id', userId)
    .gte('qualified_date', consFromStr)
    .lte('qualified_date', endDate);

  if (recentErr) {
    console.error('❌ 連続合格取得失敗:', recentErr);
    return;
  }

  const recentSet = new Set(recentQualified.map(d => d.qualified_date));
  let consecutiveDays = 0;
  for (let i = 0; i < REQUIRED_DAYS; i++) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (recentSet.has(ds)) consecutiveDays++; else break;
  }
  const remainingPassDays = Math.max(0, REQUIRED_DAYS - consecutiveDays);

  const comments = [];

  const accNum = parseFloat(accuracy);
  if (accNum >= 98) {
    comments.push('正答率が非常に高く、音の感覚が安定してきました！');
  } else if (accNum >= 95) {
    comments.push('高い正答率でよく頑張りました。');
  } else if (accNum >= 90) {
    comments.push('ほぼ安定していますが、まだ少しミスが見られます。');
  } else {
    comments.push('無理なく続けて、正答率の向上を目指しましょう。');
  }

  if (passedDays >= 7) {
    comments.push('今週も全日クリアできています。継続して努力を積み上げている姿勢が素晴らしいです。');
  } else if (passedDays >= 5) {
    comments.push('5日間の達成は良い流れですが、毎日2セットの習慣をさらに安定させていきましょう。');
  } else if (passedDays >= 3) {
    comments.push('日によってムラがあります。毎日トレーニングを習慣化していきましょう。');
  } else {
    comments.push('継続回数が少なめです。毎日少しずつでも続けることが上達の鍵です。');
  }

  const rateDiff = accNum - lastWeekAccuracy;
  if (rateDiff >= 2) {
    comments.push(`先週から正答率が${rateDiff.toFixed(1)}%向上しました。確実に成長が見られます！`);
  } else if (rateDiff >= 0.5) {
    comments.push('前週比で正答率が少し上がっています。地道な努力が実を結びつつあります。');
  } else if (rateDiff < -1) {
    comments.push('先週より正答率が少し下がっていますが、焦らずに丁寧に続けましょう。');
  }

  if (nextUnlockChord && remainingPassDays > 0) {
    comments.push(`あと${remainingPassDays}日合格すれば、「${nextUnlockChord}」の和音が解放されます。がんばりましょう！`);
  }

  if (inversionMistakeTotal >= 4) {
    comments.push('転回形の和音が少し難しいようです。同じ構成音でも形に注意しましょう。');
  }
  if (topBottomMistakeTotal >= 4) {
    comments.push('上下の音が似ている和音を間違えやすい傾向があります。ゆっくり聞いてみましょう。');
  }
  if (initialMistakeCount >= 2) {
    comments.push('最初の問題でのミスが時々あります。出だしに集中するとさらに安定します。');
  }

  const fullComment = [comments[0], comments[1], ...(comments.slice(2))].join(' ');

  const userLabel = userName ? `${userName}ちゃん` : userId;
  const reportText = `\n【🎼 絶対音感トレーニング週次レポート】\n${userLabel}（${startDate}〜${endDate}）\n\n🗓 トレーニング実施日数：${totalSessions}日間\n✅ 合格日数：${passedDays}日間（1日あたり40問以上・98%以上）\n📊 合計出題数：${totalQuestions}問\n🎯 正答率：${accuracy}%\n\n🔓 解放済み和音（色）：\n${chordNames}\n\n🔍 ミス傾向：\n${inversionMistakes.concat(topBottomMistakes).join('\n')}\n${initialMistakeCount > 0 ? `・初回だけミス：${initialMistakeCount}回あり` : ''}\n\n📣 コメント：\n${fullComment}`.trim();

  return reportText;
}

export async function shareReport(text) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: '絶対音感レポート',
        text
      });
    } catch (err) {
      console.error('❌ 共有に失敗:', err);
    }
  } else {
    alert('このブラウザは共有機能に対応していません。\n\n' + text);
  }
}
