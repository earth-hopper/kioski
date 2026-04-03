/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Ticket, 
  CreditCard, 
  CheckCircle2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Smartphone, 
  Monitor, 
  Settings,
  X,
  AlertTriangle,
  Printer,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfToday, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type View = 'sales' | 'ticketing' | 'admin';
type SalesStep = 'date' | 'tickets' | 'payment' | 'confirmation';
type TicketType = '1day' | 'afternoon' | 'night';
type TicketCategory = 'adult' | 'child';

interface TicketSelection {
  type: TicketType;
  category: TicketCategory;
  count: number;
  price: number;
}

interface Transaction {
  id: string;
  purchaseDate: Date;
  usageDate: Date;
  status: 'paid' | 'issued' | 'cancelled';
  productName: string;
  price: number;
  email: string;
  channel: 'direct' | 'ota' | 'api';
  code: string;
}

// --- Mock Data ---
const TICKET_PRICES: Record<TicketType, Record<TicketCategory, number>> = {
  '1day': { adult: 5500, child: 3500 },
  'afternoon': { adult: 4000, child: 2500 },
  'night': { adult: 3000, child: 1800 },
};

const TICKET_LABELS: Record<TicketType, string> = {
  '1day': '1日券',
  'afternoon': '午後券',
  'night': 'ナイター券',
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', purchaseDate: new Date('2026-04-01'), usageDate: new Date('2026-04-05'), status: 'paid', productName: '1日券 (大人x2)', price: 11000, email: 'guest1@example.com', channel: 'direct', code: '123-4567' },
  { id: '2', purchaseDate: new Date('2026-04-02'), usageDate: new Date('2026-04-03'), status: 'issued', productName: '午後券 (大人x1, 子供x1)', price: 6500, email: 'guest2@example.com', channel: 'ota', code: '987-6543' },
  { id: '3', purchaseDate: new Date('2026-04-02'), usageDate: new Date('2026-04-10'), status: 'paid', productName: 'ナイター券 (大人x2)', price: 6000, email: 'guest3@example.com', channel: 'direct', code: '555-1212' },
  { id: '4', purchaseDate: new Date('2026-04-03'), usageDate: new Date('2026-04-03'), status: 'paid', productName: '1日券 (子供x3)', price: 10500, email: 'guest4@example.com', channel: 'api', code: '777-8888' },
];

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-gray-800 text-white hover:bg-gray-900 shadow-sm',
    outline: 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  return (
    <button 
      className={cn('px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2', variants[variant], className)}
      {...props}
    />
  );
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden', className)}>
    {children}
  </div>
);

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState<View>('sales');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* View Switcher (Demo Only) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full p-1.5 shadow-2xl flex gap-1">
        <button 
          onClick={() => setView('sales')}
          className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2', view === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100')}
        >
          <Smartphone size={16} /> 販売
        </button>
        <button 
          onClick={() => setView('ticketing')}
          className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2', view === 'ticketing' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100')}
        >
          <Monitor size={16} /> 発券
        </button>
        <button 
          onClick={() => setView('admin')}
          className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2', view === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100')}
        >
          <Settings size={16} /> 管理
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'sales' && <SalesView key="sales" onComplete={(t) => setTransactions(prev => [t, ...prev])} />}
        {view === 'ticketing' && <TicketingView key="ticketing" transactions={transactions} onIssue={(id) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'issued' } : t))} />}
        {view === 'admin' && <AdminView key="admin" transactions={transactions} />}
      </AnimatePresence>
    </div>
  );
}

// --- Sales View ---

function SalesView({ onComplete }: { onComplete: (t: Transaction) => void; key?: string }) {
  const [step, setStep] = useState<SalesStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(startOfToday(), 1));
  const [selections, setSelections] = useState<TicketSelection[]>([]);
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [lang, setLang] = useState('ja');

  const languages = [
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'ko', label: '한국어' },
    { code: 'th', label: 'ไทย' },
  ];

  const totalPrice = selections.reduce((sum, s) => sum + s.price * s.count, 0);

  const handlePayment = () => {
    const code = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmationCode(code);
    
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      purchaseDate: new Date(),
      usageDate: selectedDate,
      status: 'paid',
      productName: selections.map(s => `${TICKET_LABELS[s.type]} (${s.category === 'adult' ? '大人' : '子供'}x${s.count})`).join(', '),
      price: totalPrice,
      email: email,
      channel: 'direct',
      code: code,
    };
    
    onComplete(newTransaction);
    setStep('confirmation');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pt-8 pb-24 px-4">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">KIOSKI</h1>
          <p className="text-slate-500 text-sm font-medium">リフト券オンライン販売</p>
        </div>
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Ticket size={20} />
        </div>
      </header>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 'date' && (
            <motion.div 
              key="date"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap gap-2 mb-4">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                      lang === l.code 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">
                  {lang === 'ja' ? 'ご利用日を選択' : 
                   lang === 'en' ? 'Select Usage Date' :
                   lang === 'zh' ? '选择使用日期' :
                   lang === 'ko' ? '이용일 선택' : 'เลือกวันที่ใช้งาน'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {lang === 'ja' ? 'リフト券を利用する日を選んでください。' : 
                   lang === 'en' ? 'Please choose the date you will use the lift ticket.' :
                   lang === 'zh' ? '请选择您将使用缆车票的日期。' :
                   lang === 'ko' ? '리프트권을 이용할 날짜를 선택해 주세요.' : 'โปรดเลือกวันที่คุณจะใช้ตั๋วลิฟต์'}
                </p>
              </div>
              <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
              <Button className="w-full" onClick={() => setStep('tickets')}>
                券種選択へ進む <ArrowRight size={18} />
              </Button>
            </motion.div>
          )}

          {step === 'tickets' && (
            <motion.div 
              key="tickets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep('date')} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <h2 className="text-xl font-bold">券種と枚数を選択</h2>
                  <p className="text-slate-500 text-sm">{format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}</p>
                </div>
              </div>

              <div className="space-y-4">
                {(Object.keys(TICKET_PRICES) as TicketType[]).map(type => (
                  <TicketTypeCard 
                    key={type} 
                    type={type} 
                    selections={selections} 
                    onUpdate={(category, count) => {
                      setSelections(prev => {
                        const filtered = prev.filter(s => !(s.type === type && s.category === category));
                        if (count === 0) return filtered;
                        return [...filtered, { type, category, count, price: TICKET_PRICES[type][category] }];
                      });
                    }} 
                  />
                ))}
              </div>

              <div className="sticky bottom-24 bg-white/80 backdrop-blur-xl border border-slate-100 p-6 rounded-3xl shadow-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">合計金額</p>
                  <p className="text-2xl font-black text-blue-600">¥{totalPrice.toLocaleString()}</p>
                </div>
                <Button disabled={totalPrice === 0} onClick={() => setStep('payment')}>
                  お支払いへ <ArrowRight size={18} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep('tickets')} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <h2 className="text-xl font-bold">お支払い</h2>
                  <p className="text-slate-500 text-sm">Stripeによる安全な決済</p>
                </div>
              </div>

              <Card className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">メールアドレス <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="example@mail.com"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-400">発券に必要な整理番号をこのアドレスにお送りします。</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-700">カード情報</p>
                  <div className="space-y-3">
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder="カード番号" className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="MM / YY" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all" />
                      <input type="text" placeholder="CVC" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg" 
                  disabled={!email || !email.includes('@')}
                  onClick={handlePayment}
                >
                  ¥{totalPrice.toLocaleString()} を支払う
                </Button>
                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                  <CheckCircle2 size={12} className="text-green-500" /> セキュアな決済を提供しています
                </p>
              </Card>
            </motion.div>
          )}

          {step === 'confirmation' && (
            <motion.div 
              key="confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center py-8"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black">購入完了！</h2>
                <p className="text-slate-500">リフト券の購入が正常に完了しました。</p>
              </div>

              <Card className="p-8 space-y-6 bg-blue-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Ticket size={120} />
                </div>
                <div className="relative z-10">
                  <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2">発券用整理番号</p>
                  <ConfirmationCode code={confirmationCode} />
                  <p className="mt-4 text-blue-100 text-xs">
                    スキー場の発券機にこの番号を入力してください。
                  </p>
                </div>
              </Card>

              <div className="space-y-4">
                <div className="p-4 bg-slate-100 rounded-2xl text-left space-y-3">
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail size={16} /> メールが届かない場合
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="別のメールアドレス" 
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    />
                    <button className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors">
                      再送
                    </button>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => {
                  setStep('date');
                  setSelections([]);
                  setEmail('');
                }}>
                  トップに戻る
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Calendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const today = startOfToday();

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-bold text-lg">{format(currentMonth, 'yyyy年 MM月', { locale: ja })}</h3>
        <div className="flex gap-1">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">{d}</div>
        ))}
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isPast = day < today;
          return (
            <button
              key={day.toString()}
              disabled={isPast}
              onClick={() => onSelect(day)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all relative',
                isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110 z-10' : 'hover:bg-blue-50 text-slate-700',
                isPast && 'opacity-20 cursor-not-allowed grayscale',
                isToday(day) && !isSelected && 'text-blue-600'
              )}
            >
              {format(day, 'd')}
              {isToday(day) && <div className={cn('w-1 h-1 rounded-full absolute bottom-1.5', isSelected ? 'bg-white' : 'bg-blue-600')} />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function TicketTypeCard({ type, selections, onUpdate }: { type: TicketType; selections: TicketSelection[]; onUpdate: (cat: TicketCategory, count: number) => void; key?: string }) {
  const adultCount = selections.find(s => s.type === type && s.category === 'adult')?.count || 0;
  const childCount = selections.find(s => s.type === type && s.category === 'child')?.count || 0;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg text-slate-800">{TICKET_LABELS[type]}</h3>
        <div className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
          {type === '1day' ? '8:30 - 16:30' : type === 'afternoon' ? '12:00 - 16:30' : '16:30 - 21:00'}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-700">大人</p>
            <p className="text-sm text-slate-400">¥{TICKET_PRICES[type].adult.toLocaleString()}</p>
          </div>
          <Counter value={adultCount} onChange={c => onUpdate('adult', c)} />
        </div>
        <div className="h-px bg-slate-50" />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-700">子供</p>
            <p className="text-sm text-slate-400">¥{TICKET_PRICES[type].child.toLocaleString()}</p>
          </div>
          <Counter value={childCount} onChange={c => onUpdate('child', c)} />
        </div>
      </div>
    </Card>
  );
}

function Counter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl">
      <button 
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 active:scale-90 transition-all"
      >
        -
      </button>
      <span className="w-4 text-center font-black text-slate-800">{value}</span>
      <button 
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 active:scale-90 transition-all"
      >
        +
      </button>
    </div>
  );
}

function ConfirmationCode({ code }: { code: string }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const masked = code.split('').map(char => (char === '-' ? '-' : '*')).join('');

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <p className="text-4xl font-black tracking-[0.2em] mb-6 font-mono">
          {isRevealed ? code : masked}
        </p>
        {!isRevealed && (
          <button 
            onClick={() => setShowModal(true)}
            className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            整理番号を表示する
          </button>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">不正利用にご注意ください</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  他人に整理番号を知られると、チケットを不正に発券される恐れがあります。発券システムの前で表示してください。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => {
                  setIsRevealed(true);
                  setShowModal(false);
                }}>
                  表示する
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setShowModal(false)}>
                  キャンセル
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Ticketing View ---

function TicketingView({ transactions, onIssue }: { transactions: Transaction[]; onIssue: (id: string) => void; key?: string }) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [matchedTransaction, setMatchedTransaction] = useState<Transaction | null>(null);

  const handleInput = (val: string) => {
    if (input.length >= 7 && val !== 'back') return;
    if (val === 'back') {
      setInput(prev => prev.slice(0, -1));
      return;
    }
    const next = input + val;
    setInput(next);

    if (next.length === 7) {
      checkCode(next);
    }
  };

  const checkCode = (code: string) => {
    setStatus('checking');
    const formattedCode = `${code.slice(0, 3)}-${code.slice(3)}`;
    
    setTimeout(() => {
      const found = transactions.find(t => t.code === formattedCode);
      if (found) {
        if (found.status === 'issued') {
          setStatus('error');
          alert('この番号は既に発券済みです。');
        } else {
          setMatchedTransaction(found);
          setStatus('success');
        }
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }, 1000);
  };

  const handleIssue = () => {
    if (matchedTransaction) {
      onIssue(matchedTransaction.id);
      alert('チケットを発券しました。プリンターを確認してください。');
      setInput('');
      setStatus('idle');
      setMatchedTransaction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-8 gap-4 md:gap-8">
        {/* Input Display Area - High Visibility */}
        <div className="bg-slate-900 border-4 border-slate-800 rounded-[2rem] p-6 md:p-12 text-center relative overflow-hidden shadow-2xl">
          {status === 'checking' && (
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="absolute top-0 left-0 w-full h-2 bg-blue-500"
            />
          )}
          
          <div className="mb-4 text-slate-500 font-black tracking-widest text-sm uppercase">
            整理番号を入力してください
          </div>

          <div className="flex items-center justify-center gap-2 md:gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className={cn(
                'w-12 h-16 md:w-24 md:h-32 bg-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center text-4xl md:text-7xl font-mono font-black border-4 transition-all', 
                input.length > i ? 'border-blue-500 text-blue-400' : 'border-slate-700 text-slate-700'
              )}>
                {input[i] || ''}
              </div>
            ))}
            <div className="text-slate-700 text-4xl md:text-6xl font-black">-</div>
            {[3, 4, 5, 6].map(i => (
              <div key={i} className={cn(
                'w-12 h-16 md:w-24 md:h-32 bg-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center text-4xl md:text-7xl font-mono font-black border-4 transition-all', 
                input.length > i ? 'border-blue-500 text-blue-400' : 'border-slate-700 text-slate-700'
              )}>
                {input[i] || ''}
              </div>
            ))}
          </div>
          
          {status === 'error' && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-red-500 text-xl font-black"
            >
              番号が見つかりません
            </motion.p>
          )}
        </div>

        {/* Success / Result Area */}
        <AnimatePresence>
          {matchedTransaction && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-blue-600 rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-900/40 border-4 border-blue-400"
            >
              <div className="text-center md:text-left">
                <p className="text-blue-200 text-sm font-black uppercase tracking-widest mb-1">予約確認</p>
                <h3 className="text-3xl md:text-5xl font-black mb-2">{matchedTransaction.productName}</h3>
                <p className="text-blue-100 text-xl font-bold">利用日: {format(matchedTransaction.usageDate, 'yyyy/MM/dd')}</p>
              </div>
              <button 
                onClick={handleIssue}
                className="w-full md:w-auto px-12 py-8 bg-white text-blue-600 rounded-3xl font-black text-3xl hover:bg-blue-50 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4"
              >
                <Printer size={40} /> 発券する
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keypad Area - Maximum Size */}
        <div className="flex-1 grid grid-cols-3 gap-3 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              onClick={() => handleInput(num.toString())}
              className="bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-3xl md:rounded-[2.5rem] text-5xl md:text-8xl font-black transition-all shadow-xl border-b-8 border-slate-950 active:border-b-0 active:translate-y-2 flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 bg-slate-800 rounded-full opacity-20" />
          </div>
          <button 
            onClick={() => handleInput('0')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-3xl md:rounded-[2.5rem] text-5xl md:text-8xl font-black transition-all shadow-xl border-b-8 border-slate-950 active:border-b-0 active:translate-y-2 flex items-center justify-center"
          >
            0
          </button>
          <button 
            onClick={() => handleInput('back')}
            className="bg-slate-700 hover:bg-slate-600 active:bg-red-600 rounded-3xl md:rounded-[2.5rem] text-4xl md:text-6xl font-black transition-all shadow-xl border-b-8 border-slate-950 active:border-b-0 active:translate-y-2 flex items-center justify-center"
          >
            <X size={48} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Admin View ---

function AdminView({ transactions }: { transactions: Transaction[]; key?: string }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || t.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">管理ダッシュボード</h1>
          <p className="text-slate-500 font-medium">販売状況と発券履歴の管理</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[120px]">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">本日の売上</p>
            <p className="text-2xl font-black text-blue-600">¥42,500</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[120px]">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">発券済み</p>
            <p className="text-2xl font-black text-slate-800">12枚</p>
          </div>
        </div>
      </header>

      <Card className="p-6">
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="メールアドレスで検索..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none appearance-none font-bold text-sm text-slate-700"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">すべてのステータス</option>
                <option value="paid">支払い済み</option>
                <option value="issued">発券済み</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none appearance-none font-bold text-sm text-slate-700"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
              >
                <option value="all">すべてのチャネル</option>
                <option value="direct">直販</option>
                <option value="ota">OTA</option>
                <option value="api">API</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">購入日</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">利用日</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ステータス</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">整理番号</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">商品名</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">価格</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">メールアドレス</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">チャネル</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-slate-500">{format(t.purchaseDate, 'yyyy/MM/dd')}</td>
                  <td className="py-4 px-4 text-sm font-bold text-slate-800">{format(t.usageDate, 'yyyy/MM/dd')}</td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                      t.status === 'paid' ? 'bg-blue-100 text-blue-600' : 
                      t.status === 'issued' ? 'bg-green-100 text-green-600' : 
                      'bg-red-100 text-red-600'
                    )}>
                      {t.status === 'paid' ? '支払い済み' : t.status === 'issued' ? '発券済み' : 'キャンセル'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-mono font-bold text-blue-600">{t.code}</td>
                  <td className="py-4 px-4 text-sm font-bold text-slate-700">{t.productName}</td>
                  <td className="py-4 px-4 text-sm font-black text-slate-900 text-right">¥{t.price.toLocaleString()}</td>
                  <td className="py-4 px-4 text-sm text-slate-500">{t.email}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">
                      {t.channel}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    データが見つかりませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
