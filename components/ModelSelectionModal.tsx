import React, { useState } from 'react';
import { Bot, Zap, X, Check } from 'lucide-react';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (modelId: string) => void;
  currentModel: string;
}

const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentModel
}) => {
  const [selected, setSelected] = useState(currentModel);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            เลือกโมเดล AI สำหรับแต่งเพลง
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Gemini 3.1 Pro Preview */}
          <button
            onClick={() => setSelected('gemini-3.1-pro-preview')}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selected === 'gemini-3.1-pro-preview'
                ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50'
                : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <Bot className={`w-5 h-5 ${selected === 'gemini-3.1-pro-preview' ? 'text-indigo-400' : 'text-zinc-400'}`} />
                <span className="font-medium text-white">Gemini 3.1 Pro Preview</span>
              </div>
              {selected === 'gemini-3.1-pro-preview' && (
                <Check className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <p className="text-sm text-zinc-400 mt-2">
              โมเดลรุ่นท็อปสุด ฉลาดที่สุด เหมาะสำหรับการแต่งเพลงที่ซับซ้อน ต้องการความสละสลวยของภาษา และการเล่าเรื่องที่ลึกซึ้ง
            </p>
          </button>

          {/* Gemini 3.5 Flash Lite */}
          <button
            onClick={() => setSelected('gemini-3.5-flash-lite')}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selected === 'gemini-3.5-flash-lite'
                ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50'
                : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${selected === 'gemini-3.5-flash-lite' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span className="font-medium text-white">Gemini 3.5 Flash Lite</span>
              </div>
              {selected === 'gemini-3.5-flash-lite' && (
                <Check className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <p className="text-sm text-zinc-400 mt-2">
              โมเดลรุ่นเล็ก รวดเร็ว ประหยัดเวลา เหมาะสำหรับการแต่งเพลงทั่วไปที่ต้องการความรวดเร็วและไอเดียแบบฉับไว
            </p>
          </button>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2"
          >
            ยืนยันและสร้างเพลง
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelSelectionModal;
