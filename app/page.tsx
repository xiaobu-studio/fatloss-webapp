"use client";
import { useState } from "react";

export default function Home() {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans text-gray-800">
      {/* 手機版最大寬度限制，讓電腦看也像手機 App */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden min-h-[85vh] flex flex-col mt-4">
        
        {/* 頂部：目標區塊 */}
        <div className="bg-blue-500 text-white p-6 rounded-b-3xl">
          <h1 className="text-2xl font-bold mb-1">小步的減重計畫 💪</h1>
          <p className="text-blue-100 text-sm">終極目標：減重 5 公斤</p>
          
          <div className="mt-4 bg-white/20 rounded-full h-3 w-full overflow-hidden">
            <div className="bg-white h-full rounded-full w-1/5"></div> {/* 假裝進度 20% */}
          </div>
          <p className="text-right text-xs mt-1 text-blue-100">目前進度：1kg / 5kg</p>
        </div>

        {/* 中間：每日習慣打卡 */}
        <div className="p-6 flex-1">
          <h2 className="font-bold text-lg mb-4 text-gray-700">✅ 今日習慣打卡</h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400" />
              <span className="text-gray-600">喝水 2000cc 💧</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400" />
              <span className="text-gray-600">168 斷食達標 ⏳</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400" />
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
            onClick={() => alert(`假裝存入資料庫：體重 ${weight}kg, 腰圍 ${waist}cm`)}
          >
            儲存今日紀錄
          </button>
        </div>

      </div>
    </main>
  );
}