"use client";
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';

export default function Home() {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [waterDone, setWaterDone] = useState(false);
  const [fastingDone, setFastingDone] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(false);

  // 🌟 新增：用來存放從資料庫抓下來的歷史紀錄
  const [history, setHistory] = useState<any[]>([]);

  // 🌟 新增：去資料庫抓資料的專屬函數
  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .order('created_at', { ascending: false }); // 照時間新到舊排序

    if (data) {
      setHistory(data);
    }
  };

  // 🌟 新增：當網頁一打開（載入完成）時，就自動執行抓資料的函數
  useEffect(() => {
    fetchHistory();
  }, []);

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
          exercise_done: exerciseDone
        },
      ]);

    if (error) {
      alert("儲存失敗 😢：" + error.message);
    } else {
      alert("🎉 儲存成功！今天的努力已經記錄到雲端囉！");
      setWeight("");
      setWaist("");
      setWaterDone(false);
      setFastingDone(false);
      setExerciseDone(false);
      
      // 🌟 新增：存檔成功後，立刻重新抓取一次最新資料，讓畫面自動更新！
      fetchHistory();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans text-gray-800 pb-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col mt-4">
        
        {/* 頂部：目標區塊 */}
        <div className="bg-blue-500 text-white p-6 rounded-b-3xl">
          <h1 className="text-2xl font-bold mb-1">小步的減重計畫 💪</h1>
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

      {/* 🌟 新增：歷史紀錄顯示區塊 */}
      <div className="w-full max-w-md mt-6">
        <h2 className="font-bold text-lg mb-4 text-gray-700 px-2">📖 歷史打卡紀錄</h2>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">目前還沒有紀錄喔，趕快開始第一天的打卡吧！</p>
          ) : (
            history.map((record) => (
              <div key={record.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  {/* 顯示日期 */}
                  <p className="text-sm font-bold text-gray-700">
                    {new Date(record.created_at).toLocaleDateString('zh-TW')}
                  </p>
                  {/* 顯示體重與腰圍 */}
                  <p className="text-xs text-gray-500 mt-1">
                    體重: <span className="text-blue-500 font-bold">{record.weight}</span> kg | 
                    腰圍: <span className="text-blue-500 font-bold">{record.waist}</span> cm
                  </p>
                </div>
                {/* 顯示習慣達成小圖示 */}
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