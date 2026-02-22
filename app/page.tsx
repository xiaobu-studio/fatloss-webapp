"use client";
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // 數據狀態
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waterDone, setWaterDone] = useState(false);
  const [fastingDone, setFastingDone] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // 目標設定狀態
  const [targetGoal, setTargetGoal] = useState<number>(5);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<number>(5);

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
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
      const savedGoal = localStorage.getItem(`goal_${user.id}`);
      if (savedGoal) setTargetGoal(Number(savedGoal));
    } else setHistory([]);
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  // 儲存資料的函數
  const handleSave = async () => {
    // 🌟 修正：現在只有「體重」是必填項
    if (!weight) {
      alert("請輸入體重數字喔！");
      return;
    }

    const { error } = await supabase.from('daily_records').insert([{
      weight: parseFloat(weight), 
      // 🌟 修正：腰圍現在也支援選填，沒填就存 null
      waist: waist ? parseFloat(waist) : null,
      body_fat: bodyFat ? parseFloat(bodyFat) : null,
      water_done: waterDone, 
      fasting_done: fastingDone, 
      exercise_done: exerciseDone,
      user_id: user.id
    }]);

    if (error) {
      alert("儲存失敗 😢：" + error.message);
    } else {
      alert("🎉 儲存成功！");
      // 清空輸入欄位
      setWeight(""); 
      setWaist(""); 
      setBodyFat(""); 
      setWaterDone(false); 
      setFastingDone(false); 
      setExerciseDone(false);
      fetchHistory();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("確定要刪除這筆紀錄嗎？")) return;
    const { error } = await supabase.from('daily_records').delete().eq('id', id).eq('user_id', user.id);
    if (!error) fetchHistory();
  };

  // 🌟 圖表數據
  const chartData = [...history].reverse().map(item => ({
    date: new Date(item.created_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
    weight: item.weight
  }));

  let currentLoss = history.length >= 2 ? parseFloat((history[history.length - 1].weight - history[0].weight).toFixed(1)) : 0;
  let progressPercent = Math.min(100, Math.max(0, targetGoal > 0 ? (currentLoss / targetGoal) * 100 : 0));

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">系統載入中...</div>;

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">歡迎來到小步學習 📖</h1>
          <button onClick={async () => await supabase.auth.signInAnonymously()} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl">👻 訪客快速試玩</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans text-gray-800 pb-10">
      
      {/* 🌟 修正後的彈出視窗 (Modal) */}
      {isEditingGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">🎯 設定減重目標</h3>
            <div className="flex items-center justify-center mb-8">
              <input type="number" value={tempGoal} onChange={(e) => setTempGoal(Number(e.target.value))} className="w-24 border-b-2 border-blue-500 p-2 text-4xl text-center font-bold text-blue-600 focus:outline-none bg-transparent" autoFocus />
              <span className="text-gray-500 font-bold ml-2 mt-4 text-lg">公斤</span>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setIsEditingGoal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold">取消</button>
              <button onClick={() => { setTargetGoal(tempGoal); localStorage.setItem(`goal_${user.id}`, tempGoal.toString()); setIsEditingGoal(false); }} className="flex-1 bg-blue-500 text-white py-3.5 rounded-2xl font-bold">儲存目標</button>
            </div>
          </div>
        </div>
      )}

      {/* 使用者狀態列 */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 px-2">
        <p className="text-sm text-gray-600 font-medium">👤 {user.is_anonymous ? "訪客試玩中" : user.email}</p>
        <button onClick={async () => await supabase.auth.signOut()} className="text-xs bg-gray-200 hover:bg-gray-300 py-1.5 px-3 rounded-lg font-bold">登出</button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col mb-6">
        {/* 頂部藍色區塊 */}
        <div className="bg-blue-500 text-white p-6 rounded-b-3xl">
          <div className="flex items-center space-x-2 mb-4 opacity-90">
            <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">📖</div>
            <span className="text-xs font-bold tracking-[0.2em]">XiaoBu Studio | 小步學習</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold">專屬減重計畫 💪</h1>
            <button onClick={() => { setTempGoal(targetGoal); setIsEditingGoal(true); }} className="flex items-center bg-white/20 py-1 px-3 rounded-full text-xs font-bold">🎯 目標 {targetGoal}kg ✏️</button>
          </div>
          <div className="bg-white/20 rounded-full h-3 w-full overflow-hidden"><div className="bg-white h-full transition-all duration-700" style={{ width: `${progressPercent}%` }}></div></div>
          <p className="text-right text-xs mt-2 text-blue-100 font-medium">進度：{currentLoss > 0 ? currentLoss : 0}kg / {targetGoal}kg</p>
        </div>

        {/* 趨勢圖表 */}
        {history.length >= 2 && (
          <div className="p-6 pb-0">
            <h2 className="font-bold text-gray-700 mb-4 text-sm">📉 體重變化趨勢</h2>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
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
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">體重 (kg)</label>
              <input type="number" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="65" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">腰圍 (cm)</label>
              <input type="number" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="80" value={waist} onChange={(e) => setWaist(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">體脂 (%)</label>
              <input type="number" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="20" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            </div>
          </div>
          
          {/* 🌟 補齊：3 個打卡項目 */}
          <div className="space-y-2">
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

      {/* 歷史紀錄清單 */}
      <div className="w-full max-w-md space-y-3">
        <h2 className="font-bold text-lg text-gray-700 px-2">📖 我的歷史紀錄</h2>
        {history.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8 bg-white rounded-3xl border border-dashed">尚無資料，開始打卡吧！</p>
        ) : (
          history.map((record) => (
            <div key={record.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center relative pr-12 shadow-sm">
              <button onClick={() => handleDelete(record.id)} className="absolute top-3 right-3 text-red-300 hover:text-red-500 text-xs font-bold">刪除</button>
              <div>
                <p className="text-sm font-bold text-gray-700">{new Date(record.created_at).toLocaleDateString('zh-TW')}</p>
                <p className="text-xs text-gray-500 mt-1">
                  體重: <span className="text-blue-500 font-bold">{record.weight}</span> kg | 
                  體脂: <span className="text-blue-500 font-bold">{record.body_fat || '--'}</span> %
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
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-600">
          XiaoBu Studio | © {new Date().getFullYear()} 小步學習
        </p>
      </footer>
    </main>
  );
}