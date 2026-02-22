"use client";
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [waterDone, setWaterDone] = useState(false);
  const [fastingDone, setFastingDone] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // 🌟 新增：減重目標的狀態管理
  const [targetGoal, setTargetGoal] = useState<number>(5);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
      // 🌟 新增：登入時，去瀏覽器記憶裡找他之前設定的目標
      const savedGoal = localStorage.getItem(`goal_${user.id}`);
      if (savedGoal) {
        setTargetGoal(Number(savedGoal));
      }
    } else {
      setHistory([]);
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("註冊失敗：" + error.message);
      else alert("🎉 註冊成功！");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("登入失敗，請檢查信箱與密碼！");
    }
  };

  const handleGuestLogin = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) alert("訪客登入失敗 😢：" + error.message);
    else alert("👻 成功以訪客身分進入！您可以開始試玩囉！");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }); // 新的在最前面
    if (data) setHistory(data);
  };

  const handleSave = async () => {
    if (!weight || !waist) {
      alert("請輸入體重和腰圍數字喔！");
      return;
    }
    const { error } = await supabase
      .from('daily_records')
      .insert([{
        weight: parseFloat(weight), waist: parseFloat(waist),
        water_done: waterDone, fasting_done: fastingDone, exercise_done: exerciseDone,
        user_id: user.id
      }]);

    if (error) alert("儲存失敗 😢：" + error.message);
    else {
      alert("🎉 儲存成功！");
      setWeight(""); setWaist(""); setWaterDone(false); setFastingDone(false); setExerciseDone(false);
      fetchHistory();
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm("確定要刪除這筆紀錄嗎？");
    if (!isConfirmed) return;
    const { error } = await supabase.from('daily_records').delete().eq('id', id).eq('user_id', user.id);
    if (error) alert("刪除失敗 😢：" + error.message);
    else fetchHistory();
  };

  // 🌟 魔法計算：動態算出已減重量
  let currentLoss = 0;
  // 如果歷史紀錄大於等於 2 筆，就可以計算差值
  if (history.length >= 2) {
    const firstWeight = history[history.length - 1].weight; // 最舊的一筆 (陣列最後面)
    const latestWeight = history[0].weight; // 最新的一筆 (陣列最前面)
    currentLoss = parseFloat((firstWeight - latestWeight).toFixed(1)); // 取小數點第一位
  }

  // 🌟 魔法計算：算出進度條的百分比 (確保在 0% ~ 100% 之間)
  let progressPercent = targetGoal > 0 ? (currentLoss / targetGoal) * 100 : 0;
  progressPercent = Math.min(100, Math.max(0, progressPercent));

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">系統載入中...</div>;

  // === 登入畫面 ===
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {isSignUp ? "加入減重計畫 💪" : "歡迎回來 👋"}
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email 信箱</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="your@email.com"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">密碼</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="至少 6 個字元"/>
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors">
              {isSignUp ? "註冊專屬帳號" : "登入我的帳號"}
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-gray-500">
            {isSignUp ? "已經有帳號了？" : "還沒有專屬帳號？"}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-500 ml-1 font-bold hover:underline">
              {isSignUp ? "點此登入" : "點此註冊"}
            </button>
          </p>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button onClick={handleGuestLogin} type="button" className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center space-x-2">
              <span>👻</span><span>免註冊，以訪客身分試玩</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // === 登入後的打卡畫面 ===
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans text-gray-800 pb-10">
      
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-2">
        <p className="text-sm text-gray-600 font-medium">👤 {user.is_anonymous ? "訪客試玩中" : user.email}</p>
        <button onClick={handleLogout} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-3 rounded-lg font-bold transition-colors">登出</button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col mt-2">
        {/* 🌟 修改：頂部目標區塊，加入編輯功能與動態進度 */}
        <div className="bg-blue-500 text-white p-6 rounded-b-3xl">
          <h1 className="text-2xl font-bold mb-1">專屬減重計畫 💪</h1>
          
          <div className="flex items-center text-blue-100 text-sm mt-1">
            <span>終極目標：減重</span>
            {isEditingGoal ? (
              <input 
                type="number" 
                value={targetGoal} 
                onChange={(e) => setTargetGoal(Number(e.target.value))}
                onBlur={() => {
                  setIsEditingGoal(false);
                  localStorage.setItem(`goal_${user.id}`, targetGoal.toString()); // 存入記憶體
                }}
                autoFocus
                className="w-14 mx-1 px-1 py-0.5 text-black rounded text-center outline-none"
              />
            ) : (
              <span 
                className="mx-1 font-bold text-white underline decoration-dashed cursor-pointer"
                onClick={() => setIsEditingGoal(true)}
                title="點擊修改目標"
              >
                {targetGoal}
              </span>
            )}
            <span>公斤</span>
          </div>

          {/* 動態進度條 */}
          <div className="mt-4 bg-white/20 rounded-full h-3 w-full overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          
          <p className="text-right text-xs mt-1 text-blue-100 font-medium">
            目前進度：{currentLoss > 0 ? currentLoss : 0}kg / {targetGoal}kg
          </p>
        </div>

        {/* 下方程式碼保持不變... */}
        <div className="p-6">
          <h2 className="font-bold text-lg mb-4 text-gray-700">✅ 今日習慣打卡</h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input type="checkbox" checked={waterDone} onChange={(e) => setWaterDone(e.target.checked)} className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400" />
              <span className="text-gray-600">喝水 2000cc 💧</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input type="checkbox" checked={fastingDone} onChange={(e) => setFastingDone(e.target.checked)} className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400" />
              <span className="text-gray-600">168 斷食達標 ⏳</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input type="checkbox" checked={exerciseDone} onChange={(e) => setExerciseDone(e.target.checked)} className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400" />
              <span className="text-gray-600">運動 30 分鐘 🏃‍♀️</span>
            </label>
          </div>

          <h2 className="font-bold text-lg mt-8 mb-4 text-gray-700">📊 記錄今日數據</h2>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">體重 (kg)</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如: 65.2" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">腰圍 (cm)</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如: 80" value={waist} onChange={(e) => setWaist(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-colors shadow-md shadow-blue-500/30">
            儲存今日紀錄
          </button>
        </div>
      </div>

      <div className="w-full max-w-md mt-6">
        <h2 className="font-bold text-lg mb-4 text-gray-700 px-2">📖 我的歷史紀錄</h2>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">目前還沒有紀錄喔，趕快開始第一天的打卡吧！</p>
          ) : (
            history.map((record) => (
              <div key={record.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center relative pr-12">
                <button onClick={() => handleDelete(record.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-xs font-bold" title="刪除此紀錄">
                  刪除
                </button>
                <div>
                  <p className="text-sm font-bold text-gray-700">
                    {new Date(record.created_at).toLocaleDateString('zh-TW')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    體重: <span className="text-blue-500 font-bold">{record.weight}</span> kg | 
                    腰圍: <span className="text-blue-500 font-bold">{record.waist}</span> cm
                  </p>
                </div>
                <div className="flex space-x-2 text-lg">
                  <span className={record.water_done ? "opacity-100" : "opacity-20 grayscale"}>💧</span>
                  <span className={record.fasting_done ? "opacity-100" : "opacity-20 grayscale"}>⏳</span>
                  <span className={record.exercise_done ? "opacity-100" : "opacity-20 grayscale"}>🏃‍♀️</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}