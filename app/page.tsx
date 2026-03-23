"use client";
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  // === 狀態管理 ===
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // 🌟 新增：忘記密碼 & 重設密碼的專屬狀態
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // 紀錄數據
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waterDone, setWaterDone] = useState(false);
  const [fastingDone, setFastingDone] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // 目標設定
  const [targetGoal, setTargetGoal] = useState<number>(5);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<number>(5);

  // === 初始化與監聽 ===
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };
    checkUser();

    // 🌟 修改：監聽登入狀態時，順便攔截「重設密碼」的事件
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);

      // 當使用者點擊 Email 裡的重設連結回到網頁時，會觸發這個事件
      if (event === 'PASSWORD_RECOVERY') {
        setIsSettingNewPassword(true);
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
      const savedGoal = localStorage.getItem(`goal_${user.id}`);
      if (savedGoal) setTargetGoal(Number(savedGoal));
    } else setHistory([]);
  }, [user]);

  // === 功能函數 ===
  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from('daily_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let errorMessage = error.message;
      if (errorMessage === "Invalid login credentials") errorMessage = "帳號或密碼錯誤，請檢查後再試一次！";
      else if (errorMessage === "User already registered") errorMessage = "這個信箱已經註冊過囉，請直接點擊下方登入！";
      else if (errorMessage.includes("Password should be at least 6 characters")) errorMessage = "密碼太短囉，請至少輸入 6 個字元！";
      alert("操作失敗 😢：" + errorMessage);
    }
  };

  const handleGuestLogin = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) alert("訪客登入失敗：" + error.message);
  };

  // 🌟 新增：寄出忘記密碼信件
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("請輸入您的 Email！");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // 確保重設完會跳回目前的網址
    });

    if (error) {
      alert("發送失敗：" + error.message);
    } else {
      alert("✅ 重設密碼信已經寄出囉！請去信箱點擊連結。");
      setIsForgotPassword(false); // 寄出後切換回登入畫面
    }
  };

  // 🌟 新增：使用者輸入新密碼並更新
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("密碼太短囉，請至少輸入 6 個字元！");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert("密碼更新失敗：" + error.message);
    } else {
      alert("🎉 密碼更新成功！請記住新密碼喔，現在可以直接使用了。");
      setIsSettingNewPassword(false);
      setNewPassword("");
    }
  };


  const handleSave = async () => {
    if (!weight) { alert("請輸入體重數字喔！"); return; }
    const currentEmail = user.is_anonymous ? '訪客' : user.email;
    const { error } = await supabase.from('daily_records').insert([{
      weight: parseFloat(weight),
      waist: waist ? parseFloat(waist) : null,
      body_fat: bodyFat ? parseFloat(bodyFat) : null,
      water_done: waterDone, fasting_done: fastingDone, exercise_done: exerciseDone,
      user_id: user.id,
      user_email: currentEmail
    }]);

    if (!error) {
      alert("🎉 儲存成功！");
      setWeight(""); setWaist(""); setBodyFat(""); setWaterDone(false); setFastingDone(false); setExerciseDone(false);
      fetchHistory();
    } else {
      alert("儲存失敗：" + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("確定要刪除這筆紀錄嗎？")) return;
    const { error } = await supabase.from('daily_records').delete().eq('id', id).eq('user_id', user.id);
    if (!error) fetchHistory();
  };

  const groupedData: Record<string, number> = {};
  [...history].reverse().forEach(record => {
    const dateLabel = new Date(record.created_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    groupedData[dateLabel] = record.weight;
  });
  const chartData = Object.keys(groupedData).map(date => ({ date: date, weight: groupedData[date] }));

  let currentLoss = history.length >= 2 ? parseFloat((history[history.length - 1].weight - history[0].weight).toFixed(1)) : 0;
  let progressPercent = Math.min(100, Math.max(0, targetGoal > 0 ? (currentLoss / targetGoal) * 100 : 0));

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400">系統載入中...</div>;

  // === 0. 攔截畫面：重新設定新密碼 ===
  if (isSettingNewPassword) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-800">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-2 bg-green-500 w-full"></div>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">設定新密碼 🔐</h1>
            <p className="text-center text-sm text-gray-500 mb-8 leading-relaxed">請輸入您的新密碼，未來請用這組密碼登入喔！</p>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full border-gray-100 bg-gray-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  placeholder="請輸入至少 6 位數新密碼"
                />
              </div>
              <button type="submit" className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl hover:bg-green-600 transition-all shadow-lg mt-2">
                確認更新密碼
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // === 1. 品牌強化版登入畫面 ===
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-800">

        <div className="flex items-center space-x-2 mb-8 opacity-80">
          <div className="bg-blue-500 text-white p-1.5 rounded-lg shadow-sm">📖</div>
          <span className="text-sm font-bold tracking-[0.2em] text-gray-500">
            XiaoBu Studio | 小步學習
          </span>
        </div>

        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-gray-100 overflow-hidden">
          <div className="h-2 bg-blue-500 w-full"></div>

          <div className="p-8">
            {/* 🌟 修改：根據忘記密碼狀態切換標題 */}
            <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
              {isForgotPassword ? "忘記密碼 🔑" : (isSignUp ? "開啟減重計畫 💪" : "歡迎回來 👋")}
            </h1>
            <p className="text-center text-sm text-gray-500 mb-8 leading-relaxed">
              {isForgotPassword ? "別擔心，輸入 Email 讓我們寄送重設連結給您" : (isSignUp ? "加入專屬減重小管家，遇見更好的自己" : "今天也要繼續為減重目標努力喔！")}
            </p>

            {/* 🌟 修改：如果是「忘記密碼」模式，顯示發送信件的表單 */}
            {isForgotPassword ? (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Email 信箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border-gray-100 bg-gray-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                <button type="submit" className="w-full bg-gray-800 text-white font-bold py-4 rounded-2xl hover:bg-gray-900 transition-all shadow-lg mt-2">
                  寄送重設密碼信
                </button>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-gray-500 text-sm font-bold py-2 hover:text-gray-700">
                  返回登入
                </button>
              </form>
            ) : (
              // 原本的登入/註冊表單
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Email 信箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border-gray-100 bg-gray-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">安全密碼</label>
                    {/* 🌟 新增：忘記密碼按鈕 (只在登入模式顯示) */}
                    {!isSignUp && (
                      <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] text-blue-500 font-bold hover:underline">
                        忘記密碼？
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border-gray-100 bg-gray-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="請輸入密碼"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 mt-2">
                  {isSignUp ? "立即開啟計畫" : "進入減重計畫"}
                </button>
              </form>
            )}

            {!isForgotPassword && (
              <>
                <div className="flex items-center my-8">
                  <div className="flex-1 h-[1px] bg-gray-100"></div>
                  <span className="px-3 text-[10px] text-gray-300 font-bold uppercase tracking-widest">or</span>
                  <div className="flex-1 h-[1px] bg-gray-100"></div>
                </div>

                <button
                  onClick={handleGuestLogin}
                  className="w-full bg-white text-gray-600 border border-gray-200 font-bold py-3.5 rounded-2xl hover:bg-gray-50 transition-all flex justify-center items-center space-x-2"
                >
                  <span>👻</span>
                  <span className="text-sm">免註冊，以訪客身分試玩</span>
                </button>

                <p className="text-center mt-8 text-xs text-gray-400">
                  {isSignUp ? "已經有帳號了？" : "還沒有專屬帳號？"}
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-500 ml-1 font-bold hover:underline">
                    {isSignUp ? "點此登入" : "點此註冊"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-12 text-center space-y-1 opacity-30">
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-600">
            XiaoBu Studio | © 2026 小步學習
          </p>
          <p className="text-[10px] text-gray-500">
            打造更好的數位學習生活
          </p>
        </div>
      </main>
    );
  }

  // === 2. 主打卡畫面 (維持不變) ===
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans text-gray-800 pb-10">

      {/* 目標設定 Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-center mb-6">🎯 設定減重目標</h3>
            <div className="flex items-center justify-center mb-8">
              <input type="number" value={tempGoal} onChange={(e) => setTempGoal(Number(e.target.value))} className="w-24 border-b-2 border-blue-500 p-2 text-4xl text-center font-bold text-blue-600 outline-none bg-transparent" autoFocus />
              <span className="text-gray-500 font-bold ml-2 mt-4 text-lg">公斤</span>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setIsEditingGoal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold">取消</button>
              <button onClick={() => { setTargetGoal(tempGoal); localStorage.setItem(`goal_${user.id}`, tempGoal.toString()); setIsEditingGoal(false); }} className="flex-1 bg-blue-500 text-white py-3.5 rounded-2xl font-bold">儲存目標</button>
            </div>
          </div>
        </div>
      )}

      {/* 使用者狀態 */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-2">
        <p className="text-sm text-gray-600 font-medium">👤 {user.is_anonymous ? "訪客試玩中" : user.email}</p>
        <button onClick={async () => await supabase.auth.signOut()} className="text-xs bg-gray-200 py-1.5 px-3 rounded-lg font-bold">登出</button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col mb-6">
        {/* 頂部藍色區塊 */}
        <div className="bg-blue-500 text-white p-6 rounded-b-3xl">
          <div className="flex items-center space-x-2 mb-4 opacity-90">
            <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm text-lg">📖</div>
            <span className="text-xs font-bold tracking-[0.2em]">XiaoBu Studio | 小步學習</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold">專屬減重計畫 💪</h1>
            <button onClick={() => { setTempGoal(targetGoal); setIsEditingGoal(true); }} className="bg-white/20 py-1 px-3 rounded-full text-xs font-bold border border-white/10">🎯 目標 {targetGoal}kg ✏️</button>
          </div>
          <div className="bg-white/20 rounded-full h-3 w-full overflow-hidden"><div className="bg-white h-full transition-all duration-700" style={{ width: `${progressPercent}%` }}></div></div>
          <p className="text-right text-xs mt-2 text-blue-100 font-medium">目前進度：{currentLoss > 0 ? currentLoss : 0}kg / {targetGoal}kg</p>
        </div>

        {/* 趨勢圖表 */}
        {history.length >= 2 && (
          <div className="p-6 pb-0">
            <h2 className="font-bold text-gray-700 mb-4 text-sm flex items-center"><span className="mr-2">📉</span>體重變化趨勢</h2>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    padding={{ left: 20, right: 20 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 輸入欄位 */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">體重 (kg)</label>
              <input type="number" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="必填" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">腰圍 (cm)</label>
              <input type="number" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="選填" value={waist} onChange={(e) => setWaist(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-1">體脂 (%)</label>
              <input type="number" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="選填" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-sm text-gray-700 mb-2 flex items-center"><span className="mr-2">✅</span>今日習慣打卡</h2>
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input type="checkbox" checked={waterDone} onChange={(e) => setWaterDone(e.target.checked)} className="w-5 h-5 text-blue-500 rounded" />
              <span className="text-sm text-gray-600 font-medium">喝水 2000cc 💧</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input type="checkbox" checked={fastingDone} onChange={(e) => setFastingDone(e.target.checked)} className="w-5 h-5 text-blue-500 rounded" />
              <span className="text-sm text-gray-600 font-medium">168 斷食達標 ⏳</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input type="checkbox" checked={exerciseDone} onChange={(e) => setExerciseDone(e.target.checked)} className="w-5 h-5 text-blue-500 rounded" />
              <span className="text-sm text-gray-600 font-medium">運動 30 分鐘 🏃‍♀️</span>
            </label>
          </div>

          <button onClick={handleSave} className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">儲存今日紀錄</button>
        </div>
      </div>

      {/* 歷史紀錄 */}
      <div className="w-full max-w-md space-y-3">
        <h2 className="font-bold text-lg text-gray-700 px-2 flex items-center"><span className="mr-2">📖</span>我的歷史紀錄</h2>
        {history.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12 bg-white rounded-3xl border border-dashed border-gray-200">尚無資料，開始第一天的紀錄吧！</p>
        ) : (
          history.map((record) => (
            <div key={record.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center relative pr-12 shadow-sm border-gray-100">
              <button onClick={() => handleDelete(record.id)} className="absolute top-3 right-3 text-red-300 hover:text-red-500 text-xs font-bold">刪除</button>
              <div>
                <p className="text-sm font-bold text-gray-700">{new Date(record.created_at).toLocaleString('zh-TW', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}</p>
                <p className="text-xs text-gray-500 mt-1">
                  體重: <span className="text-blue-500 font-bold">{record.weight}</span>kg |
                  腰圍: <span className="text-blue-500 font-bold">{record.waist || '--'}</span> |
                  體脂: <span className="text-blue-500 font-bold">{record.body_fat || '--'}</span>%
                </p>
              </div>
              <div className="flex space-x-2 text-lg">
                <span className={record.water_done ? "opacity-100" : "opacity-10 grayscale"}>💧</span>
                <span className={record.fasting_done ? "opacity-100" : "opacity-10 grayscale"}>⏳</span>
                <span className={record.exercise_done ? "opacity-100" : "opacity-10 grayscale"}>🏃‍♀️</span>
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="w-full max-w-md mt-12 mb-8 flex flex-col items-center opacity-40">
        <div className="h-[1px] w-12 bg-gray-300 mb-2"></div>
        <p className="text-[10px] font-bold tracking-[0.2em] text-gray-600">
          XiaoBu Studio | © {new Date().getFullYear()} 小步學習
        </p>
      </footer>
    </main>
  );
}