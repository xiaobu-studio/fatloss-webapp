"use client";
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';

export default function Home() {
  // === 🌟 會員登入系統狀態 ===
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // === 減肥紀錄狀態 ===
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [waterDone, setWaterDone] = useState(false);
  const [fastingDone, setFastingDone] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // 1. 檢查目前是否已經登入
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };
    checkUser();

    // 監聽登入狀態改變 (登入/登出時會自動觸發)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. 當切換使用者時，自動去抓「他專屬的」資料
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]); // 沒登入就清空畫面
    }
  }, [user]);

  // === 🌟 會員功能函數 ===
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      // 執行註冊
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("註冊失敗：" + error.message);
      else alert("🎉 註冊成功！已經自動為您登入。");
    } else {
      // 執行登入
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("登入失敗，請檢查信箱與密碼！");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // === 資料庫功能函數 ===
  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', user.id) // 🌟 魔法 1：只抓取 user_id 等於目前登入者的資料！
      .order('created_at', { ascending: false });

    if (data) setHistory(data);
  };

  const handleSave = async () => {
    if (!weight || !waist) {
      alert("請輸入體重和腰圍數字喔！");
      return;
    }

    const { error } = await supabase
      .from('daily_records')
      .insert([
        {
          weight: parseFloat(weight),
          waist: parseFloat(waist),
          water_done: waterDone,
          fasting_done: fastingDone,
          exercise_done: exerciseDone,
          user_id: user.id // 🌟 魔法 2：存檔時，自動蓋上目前使用者的專屬印章！
        },
      ]);

    if (error) {
      alert("儲存失敗 😢：" + error.message);
    } else {
      alert("🎉 儲存成功！");
      setWeight(""); setWaist(""); setWaterDone(false); setFastingDone(false); setExerciseDone(false);
      fetchHistory();
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm("確定要刪除這筆紀錄嗎？");
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('daily_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // 🌟 魔法 3：雙重防護，只能刪自己的資料

    if (error) alert("刪除失敗 😢：" + error.message);
    else fetchHistory();
  };

  // === 畫面渲染 ===
  
  // 正在檢查登入狀態時的過場畫面
  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">系統載入中...</div>;

  // 🌟 如果「尚未登入」，顯示精美的登入/註冊畫面
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
        </div>
      </main>
    );
  }

  // 🌟 如果「已經登入」，顯示原本的打卡畫面 (頂部增加登出列)
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans text-gray-800 pb-10">
      
      {/* 使用者資訊列 */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-2">
        <p className="text-sm text-gray-600 font-medium">👤 {user.email}</p>
        <button onClick={handleLogout} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-3 rounded-lg font-bold transition-colors">
          登出
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col mt-2">
        {/* 頂部：目標區塊 */}
        <div className="bg-blue-500 text-white p-6 rounded-b-3xl">
          <h1 className="text-2xl font-bold mb-1">專屬減重計畫 💪</h1>
          <p className="text-blue-100 text-sm">終極目標：減重 5 公斤</p>
          <div className="mt-4 bg-white/20 rounded-full h-3 w-full overflow-hidden">
            <div className="bg-white h-full rounded-full w-1/5"></div>
          </div>
          <p className="text-right text-xs mt-1 text-blue-100">目前進度：1kg / 5kg</p>
        </div>

        {/* 中間：每日習慣打卡 */}
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

          {/* 下方：數據紀錄 */}
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

        {/* 儲存按鈕 */}
        <div className="p-6 pt-0">
          <button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-colors shadow-md shadow-blue-500/30">
            儲存今日紀錄
          </button>
        </div>
      </div>

      {/* 歷史紀錄顯示區塊 */}
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