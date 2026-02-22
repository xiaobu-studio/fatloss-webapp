"use client";
import { useState } from "react";
// 引入我們剛剛寫好的對講機
import { supabase } from '../lib/supabase';

export default function Home() {
  // 記錄使用者輸入的數據
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  
  // 記錄三個習慣是否有打勾
  const [waterDone, setWaterDone] = useState(false);
  const [fastingDone, setFastingDone] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(false);

  // 當按下儲存按鈕時會執行的動作
  const handleSave = async () => {
    // 1. 防呆機制：檢查有沒有填寫體重
    if (!weight || !waist) {
      alert("請輸入體重和腰圍數字喔！");
      return;
    }

    // 2. 透過對講機，把資料寫入 Supabase 的 daily_records 表格
    const { data, error } = await supabase
      .from('daily_records')
      .insert([
        {
          weight: parseFloat(weight),      // 體重
          waist: parseFloat(waist),        // 腰圍
          water_done: waterDone,           // 喝水打勾狀態
          fasting_done: fastingDone,       // 斷食打勾狀態
          exercise_done: exerciseDone      // 運動打勾狀態
        },
      ]);

    // 3. 判斷是否成功
    if (error) {
      alert("儲存失敗 😢：" + error.message);
    } else {
      alert("🎉 儲存成功！今天的努力已經記錄到雲端囉！");
      // 存檔成功後，把輸入框清空方便明天輸入
      setWeight("");
      setWaist("");
      setWaterDone(false);
      setFastingDone(false);
      setExerciseDone(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans text-gray-800">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden min-h-[85vh] flex flex-col mt-4">
        
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
        <div className="p-6 flex-1">
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
              <input 
                type="number" 
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 65.2"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">腰圍 (cm)</label>
              <input 
                type="number" 
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 80"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 底部：儲存按鈕 */}
        <div className="p-6 border-t border-gray-100">
          <button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-colors shadow-md shadow-blue-500/30"
            onClick={handleSave}
          >
            儲存今日紀錄
          </button>
        </div>

      </div>
    </main>
  );
}