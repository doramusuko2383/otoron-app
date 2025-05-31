import { supabase } from './supabaseClient.js';
import { chords } from '../data/chords.js';

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
  const passedSessions = trainingSessions.filter(s => s.is_qualified).length;
  const totalQuestions = trainingSessions.reduce((sum, s) => sum + (s.total_count || 0), 0);
  const totalCorrect = trainingSessions.reduce((sum, s) => sum + (s.correct_count || 0), 0);
  const accuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0.0';

  const chordLabelMap = Object.fromEntries(chords.map(c => [c.key, c.label]));
  const chordNames = progress.map(p => chordLabelMap[p.chord_key] || p.chord_key).join('、');

  const inversionMap = new Map();
  const topBottomMap = new Map();
  let initialMistakeCount = 0;

  trainingSessions.forEach(session => {
    const m = session.mistakes_json;
    if (m?.initial_mistake) initialMistakeCount++;
    m?.inversion_confusions?.forEach(i => {
      const key = `${i.question}|${i.answer}`;
      inversionMap.set(key, (inversionMap.get(key) || 0) + (i.count || 1));
    });
    m?.top_bottom_confusions?.forEach(i => {
      const key = `${i.question}|${i.answer}`;
      topBottomMap.set(key, (topBottomMap.get(key) || 0) + (i.count || 1));
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

  const userLabel = userName ? `${userName}ちゃん` : userId;
  const reportText = `\n【🎼 絶対音感トレーニング週次レポート】\n${userLabel}（${startDate}〜${endDate}）\n\n🗓 トレーニング実施日数：${totalSessions}日間\n✅ 合格日数：${passedSessions}日間（1日あたり40問以上・98%以上）\n📊 合計出題数：${totalQuestions}問\n🎯 正答率：${accuracy}%\n\n🔓 解放済み和音（色）：\n${chordNames}\n\n🔍 ミス傾向：\n${inversionMistakes.concat(topBottomMistakes).join('\n')}\n${initialMistakeCount > 0 ? `・初回だけミス：${initialMistakeCount}回あり` : ''}\n\n📣 コメント：\n今週もよくがんばりました。来週はさらに安定した結果を目指しましょう！`.trim();

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
