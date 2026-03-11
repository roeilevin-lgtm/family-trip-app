import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Sun, Moon, Map, Calendar, Plus, Navigation, Clock, Trash2, Camera, 
  UserCircle, MapPin, Wallet, CheckSquare, Square, 
  Baby, CheckCircle, Image as ImageIcon, RefreshCcw, SunMedium, Info, MapPinned,
  ArrowUp, ArrowDown, RefreshCw, Briefcase, AlertOctagon, Calculator,
  ChevronRight, ChevronLeft
} from 'lucide-react';

/**
 * --- API CONFIGURATION ---
 */
const API_URL = 'https://my-family-api.onrender.com/api/sync';

/**
 * --- APP CONSTANTS ---
 */
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'family-trip-final';
const DB_KEY = `${APP_ID}_db`;
const PACKING_DB_KEY = `${APP_ID}_packing`;
const VAULT_DB_KEY = `${APP_ID}_vault`;
const THEME_PREF_KEY = `${APP_ID}_theme_pref`;

// הוגדרו 4 מטבעות בדיוק כפי שהתבקש
const POPULAR_CURRENCIES = [
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'PLN', symbol: 'zł', flag: '🇵🇱' },
  { code: 'HUF', symbol: 'Ft', flag: '🇭🇺' }
];

const ACTIVITY_TYPES = {
  attraction: { label: 'אטרקציה', dot: 'bg-purple-500', border: 'border-purple-500', bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', text: 'text-purple-700', darkText: 'dark:text-purple-400', icon: '🎡' },
  food: { label: 'אוכל', dot: 'bg-orange-500', border: 'border-orange-500', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', text: 'text-orange-700', darkText: 'dark:text-orange-400', icon: '🍔' },
  travel: { label: 'נסיעה', dot: 'bg-blue-500', border: 'border-blue-500', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-700', darkText: 'dark:text-blue-400', icon: '🚗' },
  rest: { label: 'מנוחה', dot: 'bg-green-500', border: 'border-green-500', bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', text: 'text-green-700', darkText: 'dark:text-green-400', icon: '😴' }
};

/**
 * --- UTILITIES & LOCAL STORAGE (IndexedDB Wrapper) ---
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FamilyTripDB_v4', 4); 
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('trips')) db.createObjectStore('trips');
      if (!db.objectStoreNames.contains('vault')) db.createObjectStore('vault');
      if (!db.objectStoreNames.contains('packing')) db.createObjectStore('packing');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveLocally = async (storeName, key, data) => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(data, key);
      tx.oncomplete = () => resolve();
    });
  } catch (err) {
    localStorage.setItem(`${storeName}_${key}`, JSON.stringify(data));
  }
};

const loadLocally = async (storeName, key) => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (err) {
    return JSON.parse(localStorage.getItem(`${storeName}_${key}`));
  }
};

/**
 * --- COMPONENTS ---
 */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Production Error Caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-right">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-red-100">
            <AlertOctagon size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2 text-slate-900">אירעה שגיאה</h1>
            <p className="text-slate-500 mb-6">האפליקציה נתקלה בבעיה. אל דאגה, הנתונים שלך שמורים מקומית.</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors">טען מחדש</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SyncInput({ value, onSave, className, type = "text", ...props }) {
    const [localValue, setLocalValue] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);
  
    useEffect(() => {
      if (!isFocused) setLocalValue(value || '');
    }, [value, isFocused]);
  
    const handleBlur = () => {
      setIsFocused(false);
      if (localValue !== (value || '')) onSave(localValue);
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') e.target.blur();
    };
  
    return (
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
    );
}

/**
 * --- MAIN APPLICATION ---
 */
function TripApp() {
  const [activities, setActivities] = useState({});
  const [packingList, setPackingList] = useState([]);
  const [vaultFiles, setVaultFiles] = useState([]);
  const [mapLocations, setMapLocations] = useState([]); 
  
  const [currentDay, setCurrentDay] = useState("2026-07-17");
  const [themeMode, setThemeMode] = useState('auto');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('schedule');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  const [exchangeRates, setExchangeRates] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState(4.0);
  const [isAutoRate, setIsAutoRate] = useState(true);
  const [foreignAmount, setForeignAmount] = useState('');
  const [isFetchingFx, setIsFetchingFx] = useState(false);
  
  const [dailyWeather, setDailyWeather] = useState(null);
  const [userRole, setUserRole] = useState('editor');
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  const userMenuRef = useRef(null);
  const dataRefs = useRef({ activities, packingList, vaultFiles, mapLocations });

  const sortedDays = useMemo(() => Object.keys(activities).sort(), [activities]);
  const currentDayIndex = sortedDays.indexOf(currentDay);

  useEffect(() => {
    dataRefs.current = { activities, packingList, vaultFiles, mapLocations };
  }, [activities, packingList, vaultFiles, mapLocations]);

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  }, []);

  const pushToCloud = async (newData) => {
    if (!isOnline) return;
    setIsSyncing(true);
    
    const payload = {
        activities: newData.activities || dataRefs.current.activities,
        packingList: newData.packingList || dataRefs.current.packingList,
        vaultFiles: newData.vaultFiles || dataRefs.current.vaultFiles
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Server rejected request");
    } catch (error) {
      console.error("Push failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async (silent = false) => {
    if (!isOnline) return;
    
    if (!silent) setIsSyncing(true);
    try {
      const response = await fetch(API_URL, { method: 'GET' });
      if (!response.ok) throw new Error("Server rejected pull request");
      const data = await response.json();
      
      let changed = false;

      if (data.activities && JSON.stringify(data.activities) !== JSON.stringify(dataRefs.current.activities)) {
          setActivities(data.activities);
          await saveLocally('trips', DB_KEY, data.activities);
          changed = true;
      }
      if (data.packingList && JSON.stringify(data.packingList) !== JSON.stringify(dataRefs.current.packingList)) {
          setPackingList(data.packingList);
          await saveLocally('packing', PACKING_DB_KEY, data.packingList);
          changed = true;
      }
      if (data.vaultFiles && data.vaultFiles.length > 0) {
          const mergedVault = data.vaultFiles.map(cloudFile => {
              const localFile = dataRefs.current.vaultFiles.find(f => f.id === cloudFile.id);
              return localFile && localFile.data ? { ...cloudFile, data: localFile.data } : cloudFile;
          });
          if (JSON.stringify(mergedVault) !== JSON.stringify(dataRefs.current.vaultFiles)) {
             setVaultFiles(mergedVault);
             await saveLocally('vault', VAULT_DB_KEY, mergedVault);
             changed = true;
          }
      }
      if (data.mapLocations && JSON.stringify(data.mapLocations) !== JSON.stringify(dataRefs.current.mapLocations)) {
          setMapLocations(data.mapLocations);
          changed = true;
      }

      if (!silent) {
          if (changed) showToast("סונכרן בהצלחה");
          else showToast("המערכת מעודכנת");
      }
    } catch (error) {
      console.error("Pull failed:", error);
      if (!silent) showToast("שגיאת סנכרון");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => { pullFromCloud(true); }, 30000); 
    return () => clearInterval(intervalId);
  }, [isOnline]);

  useEffect(() => {
    const initApp = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('role') === 'viewer') setUserRole('viewer');

      const savedData = await loadLocally('trips', DB_KEY);
      if (savedData && Object.keys(savedData).length > 0) {
        setActivities(savedData);
      } else {
        setActivities({
          "2026-07-17": [
            { id: '17_1', time: '08:00', title: 'נסיעה לשדה התעופה', location: 'נתב"ג', duration: '60', type: 'travel', completed: false }
          ]
        });
      }

      const savedPacking = await loadLocally('packing', PACKING_DB_KEY);
      if (savedPacking) setPackingList(savedPacking);

      const savedVault = await loadLocally('vault', VAULT_DB_KEY);
      if (savedVault) setVaultFiles(savedVault);
      
      const savedTheme = localStorage.getItem(THEME_PREF_KEY);
      if (savedTheme) setThemeMode(savedTheme);

      if (navigator.onLine) pullFromCloud(true); 
    };
    
    initApp();

    const checkTouch = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    setIsTouchDevice(checkTouch());

    const toggleOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', toggleOnline);
    window.addEventListener('offline', toggleOnline);

    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', toggleOnline);
      window.removeEventListener('offline', toggleOnline);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    const target = themeMode === 'auto' ? ((hour >= 19 || hour < 6) ? 'dark' : 'light') : themeMode;
    setCurrentTheme(target);
    if (target === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_PREF_KEY, themeMode);
  }, [themeMode]);

  const addMinutes = (timeStr, mins) => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + Number(mins), 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleActivityEdit = async (id, field, value) => {
    if (userRole !== 'editor') return;
    const dayActs = [...(activities[currentDay] || [])];
    const idx = dayActs.findIndex(a => a.id === id);
    if (idx === -1) return;

    const original = dayActs[idx];
    if (original[field] === value) return;

    dayActs[idx] = { ...original, [field]: value };
    
    if ((field === 'time' || field === 'duration') && idx < dayActs.length - 1) {
        if (window.confirm("האם לעדכן אוטומטית את שעות הפעילויות הבאות?")) {
            let nextT = addMinutes(dayActs[idx].time, dayActs[idx].duration);
            for (let i = idx + 1; i < dayActs.length; i++) {
                dayActs[i].time = nextT;
                nextT = addMinutes(dayActs[i].time, dayActs[i].duration);
            }
        }
    }
    
    const updatedActivities = { ...activities, [currentDay]: dayActs };
    setActivities(updatedActivities);
    await saveLocally('trips', DB_KEY, updatedActivities);
    pushToCloud({ activities: updatedActivities });
  };

  const addActivity = async () => {
    if (userRole !== 'editor') return;
    const n = { id: Date.now().toString(), time: '08:00', title: 'פעילות חדשה', location: 'הזן מיקום', duration: '60', type: 'attraction', completed: false };
    const updatedActivities = { ...activities, [currentDay]: [n, ...(activities[currentDay] || [])] };
    setActivities(updatedActivities);
    await saveLocally('trips', DB_KEY, updatedActivities);
    pushToCloud({ activities: updatedActivities });
  };

  const removeActivity = async (id) => {
    if (userRole !== 'editor') return;
    const updatedActivities = { ...activities, [currentDay]: activities[currentDay].filter(a => a.id !== id) };
    setActivities(updatedActivities);
    await saveLocally('trips', DB_KEY, updatedActivities);
    pushToCloud({ activities: updatedActivities });
  };

  const cycleType = (id, type) => {
    const types = Object.keys(ACTIVITY_TYPES);
    handleActivityEdit(id, 'type', types[(types.indexOf(type) + 1) % types.length]);
  };

  const moveActivityDirection = async (index, direction) => {
    if (userRole !== 'editor') return;
    const dayActivities = [...(activities[currentDay] || [])];
    if (direction === 'up' && index > 0) [dayActivities[index - 1], dayActivities[index]] = [dayActivities[index], dayActivities[index - 1]];
    else if (direction === 'down' && index < dayActivities.length - 1) [dayActivities[index + 1], dayActivities[index]] = [dayActivities[index], dayActivities[index + 1]];
    else return;
    
    const updatedActivities = { ...activities, [currentDay]: dayActivities };
    setActivities(updatedActivities);
    await saveLocally('trips', DB_KEY, updatedActivities);
    pushToCloud({ activities: updatedActivities });
  };

  const goToNextDay = () => currentDayIndex < sortedDays.length - 1 && setCurrentDay(sortedDays[currentDayIndex + 1]);
  const goToPrevDay = () => currentDayIndex > 0 && setCurrentDay(sortedDays[currentDayIndex - 1]);

  const handleFileUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onloadend = async () => {
      const n = { id: Date.now().toString(), name: f.name, data: r.result, type: f.type };
      const updatedVault = [n, ...vaultFiles];
      setVaultFiles(updatedVault);
      await saveLocally('vault', VAULT_DB_KEY, updatedVault);
      showToast("מעלה את הקובץ לכספת הענן...");
      pushToCloud({ vaultFiles: updatedVault });
    };
    r.readAsDataURL(f);
  };

  const removeVaultFile = async (id) => {
      const updatedVault = vaultFiles.filter(x => x.id !== id);
      setVaultFiles(updatedVault);
      await saveLocally('vault', VAULT_DB_KEY, updatedVault);
      pushToCloud({ vaultFiles: updatedVault });
  };

  const addPackingItem = async () => {
    const t = prompt('הכנס פריט:'); if (!t) return;
    const updatedPacking = [{ id: Date.now().toString(), text: t, checked: false }, ...packingList];
    setPackingList(updatedPacking);
    await saveLocally('packing', PACKING_DB_KEY, updatedPacking);
    pushToCloud({ packingList: updatedPacking });
  };

  const togglePackingItem = async (id) => {
    const updatedPacking = packingList.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    setPackingList(updatedPacking);
    await saveLocally('packing', PACKING_DB_KEY, updatedPacking);
    pushToCloud({ packingList: updatedPacking });
  };

   const fetchFXRates = async () => {
    if (!isOnline) return;
    setIsFetchingFx(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/ILS');
      const data = await res.json();
      if (data?.rates) {
        const inv = {};
        for (const [k, v] of Object.entries(data.rates)) inv[k] = 1 / v;
        setExchangeRates(inv);
      }
    } catch (e) { console.error(e); }
    finally { setIsFetchingFx(false); }
  };

  const fetchWeather = async () => {
    const loc = activities[currentDay]?.find(a => a.location !== 'הזן מיקום')?.location;
    if (!loc || !isOnline) return;
    try {
      const gRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1`);
      const gData = await gRes.json();
      if (gData.results) {
          const { latitude, longitude, name } = gData.results[0];
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const wData = await wRes.json();
          setDailyWeather({ temp: Math.round(wData.current_weather.temperature), code: wData.current_weather.weathercode, loc: name });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchFXRates(); }, []);
  useEffect(() => { fetchWeather(); }, [currentDay, isOnline]);
  useEffect(() => { if (isAutoRate && exchangeRates[selectedCurrency]) setExchangeRate(Number(exchangeRates[selectedCurrency].toFixed(4))); }, [selectedCurrency, exchangeRates, isAutoRate]);

  const themeClass = currentTheme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900';
  
  const stats = useMemo(() => {
    let t = 0; let a = 0;
    (activities[currentDay] || []).forEach(x => {
        const d = Number(x.duration) || 0;
        if (x.type === 'travel') t += d; else a += d;
    });
    return { travel: t, activity: a };
  }, [activities, currentDay]);

  const renderSecondaryPane = () => {
    const pane = activeTab === 'schedule' ? 'map' : activeTab;
    
    if (pane === 'map') return (
        <div className="space-y-6 animate-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">מיקומים שמורים</h2>
                <div className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold text-slate-500 flex items-center gap-1">
                    <MapPinned size={12}/> מסונכרן לדרייב
                </div>
            </div>
            
            {mapLocations.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                    <MapPinned size={48} className="mx-auto mb-4 opacity-20"/>
                    <p className="font-bold">אין מיקומים שמורים.</p>
                    <p className="text-xs mt-2">הורד קובץ KML מהמפה שלך וזרוק בתיקיית הדרייב המשותפת לסנכרון.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {mapLocations.map((loc, idx) => (
                        <a 
                            key={idx} 
                            href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group active:scale-95"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                                    <MapPin size={20} fill="currentColor"/>
                                </div>
                                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{loc.name}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Navigation size={18}/>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );

    if (pane === 'vault') return (
        <div className="space-y-6 animate-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">כספת (Vault)</h2>
                <label className="p-3 bg-indigo-600 text-white rounded-2xl cursor-pointer shadow-lg hover:bg-indigo-700 transition-all"><Camera size={20}/><input type="file" className="hidden" onChange={handleFileUpload} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {vaultFiles.map(f => {
                    const imageSource = f.url || f.data;
                    return (
                    <div key={f.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group shadow-sm">
                        {imageSource ? <img src={imageSource} className="w-full h-full object-cover" alt={f.name} /> : <div className="flex items-center justify-center h-full text-slate-300"><ImageIcon size={48}/></div>}
                        <button onClick={() => removeVaultFile(f.id)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><Trash2 size={12}/></button>
                    </div>
                )})}
            </div>
        </div>
    );
    if (pane === 'packing') return (
        <div className="space-y-6 animate-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">אריזה</h2>
                <button onClick={addPackingItem} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all"><Plus size={20}/></button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700 overflow-hidden shadow-sm">
                {packingList.map(item => (
                    <div key={item.id} onClick={() => togglePackingItem(item.id)} className="p-5 border-b last:border-0 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        {item.checked ? <CheckSquare className="text-green-500"/> : <Square className="text-slate-300"/>}
                        <span className={`font-bold ${item.checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{item.text}</span>
                    </div>
                ))}
                {packingList.length === 0 && <div className="p-8 text-center text-slate-400">הרשימה ריקה</div>}
            </div>
        </div>
    );
    if (pane === 'wallet') return (
        <div className="space-y-6 animate-in">
            <h2 className="text-3xl font-black">ארנק ומט"ח</h2>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700 shadow-sm space-y-6">
                
                {/* 4 המטבעות בשורה אחת */}
                <div className="grid grid-cols-4 gap-2 w-full bg-slate-50 dark:bg-slate-900/50 p-2 rounded-3xl">
                    {POPULAR_CURRENCIES.map(c => (
                        <button 
                            key={c.code} 
                            onClick={() => setSelectedCurrency(c.code)} 
                            className={`py-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${selectedCurrency === c.code ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/30' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <span className="text-2xl block">{c.flag}</span>
                            <span className="text-[11px] sm:text-xs font-black tracking-tight">{c.code} {c.symbol}</span>
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            {/* פדינג שמאלי מורחב (pl-20) מונע מהמספר לדרוס את תווית המטבע */}
                            <input type="number" placeholder="סכום" value={foreignAmount} onChange={(e)=>setForeignAmount(e.target.value)} className="w-full py-4 pr-4 pl-20 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-black text-lg text-right focus:ring-2 focus:ring-indigo-500" />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 flex items-center gap-1.5">
                                <span className="text-lg">{POPULAR_CURRENCIES.find(p => p.code === selectedCurrency)?.flag}</span>
                                <span>{selectedCurrency}</span>
                            </div>
                        </div>
                        <div className="text-2xl text-slate-300 font-black">=</div>
                        <div className="flex-1 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-black text-lg text-left dir-ltr border border-indigo-100 dark:border-indigo-800">
                            {(Number(foreignAmount) * exchangeRate).toFixed(2)} ₪
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-700">
                    <span className="flex items-center gap-2"><Info size={14}/> שער המרה: {exchangeRate}</span>
                    <button onClick={fetchFXRates} className="flex items-center gap-1 text-indigo-500 hover:underline"><RefreshCcw size={12} className={isFetchingFx ? 'animate-spin' : ''}/> רענן</button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div dir="rtl" className={`min-h-screen flex flex-col transition-all duration-500 font-sans ${themeClass}`}>
      {toastMessage && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 font-bold text-sm whitespace-nowrap">{toastMessage}</div>}

      <header className={`sticky top-0 z-50 border-b p-3 flex items-center justify-between backdrop-blur-xl ${currentTheme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'} ${isKidsMode ? 'border-b-4 border-b-yellow-400' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${isKidsMode ? 'bg-yellow-400' : 'bg-indigo-600'}`}>
            {isKidsMode ? <Baby size={24} /> : <Map size={22} />}
          </div>
          <div className="leading-tight">
            <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">{isKidsMode ? 'הטיול שלי!' : 'FamilyPlanner'}</h1>
            {!isOnline && <span className="text-[10px] text-orange-500 bg-orange-500/10 px-2 rounded-full font-bold ml-1">אופליין</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isKidsMode && isOnline && (
              <button onClick={() => pullFromCloud(false)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors" title="משוך נתונים מהענן">
                  <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
              </button>
          )}
          <button onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">{currentTheme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}</button>
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-500 transition-colors shadow-inner"><UserCircle size={28}/></button>
            {showUserMenu && (
                <div className="absolute left-0 mt-3 w-56 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-3xl shadow-2xl p-4 animate-in zoom-in-95 origin-top-left z-[60]">
                    <button onClick={() => { setIsKidsMode(!isKidsMode); setShowUserMenu(false); }} className={`w-full py-3 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${isKidsMode ? 'bg-slate-100 text-slate-700' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}><Baby size={18}/> {isKidsMode ? 'צא ממצב ילדים' : 'מצב ילדים'}</button>
                </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-8">
        <div className="max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          <div className={`lg:col-span-7 space-y-8 ${activeTab === 'schedule' ? 'block' : 'hidden lg:block'}`}>
            {dailyWeather && !isKidsMode && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-3xl border border-blue-100 dark:border-slate-700 shadow-sm animate-in">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm"><SunMedium className="text-yellow-500"/></div>
                    <div className="leading-tight">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white">{dailyWeather.temp}°C</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase">מזג האוויר ב{dailyWeather.loc}</p>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-3xl shadow-inner overflow-x-auto no-scrollbar scroll-smooth">
                <button onClick={goToPrevDay} className="p-2 text-indigo-500 hidden sm:block"><ChevronRight size={20}/></button>
                {sortedDays.map((day, idx) => (
                    <button key={day} onClick={() => setCurrentDay(day)} className={`px-6 py-3 rounded-2xl font-black text-sm shrink-0 transition-all ${currentDay === day ? (isKidsMode ? 'bg-yellow-400 text-slate-900 shadow-md scale-105' : 'bg-indigo-600 text-white shadow-lg scale-105') : 'bg-white dark:bg-slate-700 text-slate-400'}`}>יום {idx+1}</button>
                ))}
                <button onClick={goToNextDay} className="p-2 text-indigo-500 hidden sm:block"><ChevronLeft size={20}/></button>
            </div>

            <section className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{isKidsMode ? 'היום בטיול!' : 'הלו"ז היומי'}</h2>
                    {!isKidsMode && <button onClick={addActivity} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform"><Plus size={32}/></button>}
                </div>

                <div className="space-y-4 relative pr-4">
                    <div className="absolute top-4 bottom-4 right-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    {(activities[currentDay] || []).map((act, idx) => {
                        const type = ACTIVITY_TYPES[act.type || 'attraction'];
                        return (
                            <div key={act.id} className={`relative pr-8 animate-in ${act.completed ? 'opacity-50 grayscale-[50%]' : ''}`}>
                                <div className={`absolute right-[-4px] top-8 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${act.completed ? 'bg-green-500' : type.dot}`}></div>
                                <div className={`p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-3xl shadow-sm border-r-4 ${act.completed ? 'border-r-green-500' : type.border} flex items-center gap-4 group hover:shadow-md transition-all`}>
                                    {!isKidsMode && <div className="flex flex-col gap-1 text-slate-300"><button onClick={()=>moveActivityDirection(idx, 'up')} disabled={idx===0} className="hover:text-indigo-500 transition-colors"><ArrowUp size={16}/></button><button onClick={()=>moveActivityDirection(idx, 'down')} disabled={idx===activities[currentDay].length-1} className="hover:text-indigo-500 transition-colors"><ArrowDown size={16}/></button></div>}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3 w-full">
                                                <button onClick={()=>isKidsMode ? handleActivityEdit(act.id, 'completed', !act.completed) : cycleType(act.id, act.type)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-transform hover:scale-110 active:scale-90 ${act.completed ? 'bg-green-500 text-white' : (type.bg + ' ' + type.darkBg)}`}>{act.completed ? <CheckCircle size={20}/> : type.icon}</button>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <SyncInput 
                                                          type="time" 
                                                          value={act.time} 
                                                          onSave={(val)=>handleActivityEdit(act.id, 'time', val)} 
                                                          className={`text-[10px] font-black p-0.5 rounded border-none focus:ring-1 focus:ring-indigo-500 ${act.completed ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`} 
                                                        />
                                                        <SyncInput 
                                                          type="text" 
                                                          value={act.title} 
                                                          onSave={(val)=>handleActivityEdit(act.id, 'title', val)} 
                                                          className={`block w-full font-bold text-lg bg-transparent focus:outline-none truncate border-b border-transparent focus:border-indigo-500 ${act.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {!isKidsMode && <button onClick={()=>removeActivity(act.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2"><Trash2 size={16}/></button>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1 truncate max-w-[150px]">
                                                <MapPin size={12}/> 
                                                <SyncInput 
                                                  type="text" 
                                                  value={act.location} 
                                                  onSave={(val)=>handleActivityEdit(act.id, 'location', val)} 
                                                  className="bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 w-full"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12}/> 
                                                <SyncInput 
                                                  type="number" 
                                                  value={act.duration} 
                                                  onSave={(val)=>handleActivityEdit(act.id, 'duration', val)} 
                                                  className="bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 w-8 text-center"
                                                />
                                                דק'
                                            </div>
                                        </div>
                                    </div>
                                    {isKidsMode && <button onClick={()=>handleActivityEdit(act.id, 'completed', !act.completed)} className={`px-4 py-3 rounded-2xl font-black shadow-md transition-all ${act.completed ? 'bg-green-100 text-green-700 scale-95' : 'bg-yellow-400 text-slate-900 active:scale-90'}`}>{act.completed ? 'בוצע!' : 'היינו כאן!'}</button>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!isKidsMode && (activities[currentDay] || []).length > 0 && (
                    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex justify-around text-center border dark:border-slate-700 shadow-inner">
                        <div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1">פעילות נטו</p><p className="font-black text-xl text-indigo-600">{Math.floor(stats.activity/60)}ש' ו-{stats.activity%60}ד'</p></div>
                        <div className="w-px bg-slate-200 dark:bg-slate-700 h-10"></div>
                        <div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1">זמן בדרכים</p><p className="font-black text-xl text-blue-500">{Math.floor(stats.travel/60)}ש' ו-{stats.travel%60}ד'</p></div>
                    </div>
                )}
            </section>
          </div>

          <div className={`lg:col-span-4 ${activeTab !== 'schedule' ? 'block' : 'hidden lg:block'}`}>
            {!isKidsMode ? renderSecondaryPane() : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20 grayscale select-none"><Baby size={84} className="mb-6 text-slate-400"/><h3 className="text-2xl font-black text-slate-400">אזור מבוגרים</h3><p className="text-sm">צא ממצב ילדים כדי לראות עוד כלים</p></div>
            )}
          </div>

          {!isKidsMode && (
              <div className="hidden lg:flex lg:col-span-1 flex-col items-center w-full">
                  <div className="sticky top-24 flex flex-col gap-4 items-center">
                      {[
                          {id: 'schedule', icon: <MapPinned size={24}/>, label: 'מפה'},
                          {id: 'packing', icon: <CheckSquare size={24}/>, label: 'אריזה'},
                          {id: 'vault', icon: <Briefcase size={24}/>, label: 'כספת'},
                          {id: 'wallet', icon: <Calculator size={24}/>, label: 'ארנק'}
                      ].map(btn => (
                          <button 
                              key={btn.id} 
                              title={btn.label} 
                              onClick={()=>setActiveTab(btn.id)} 
                              className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95 ${activeTab===btn.id ? 'bg-indigo-600 text-white shadow-indigo-500/30 ring-4 ring-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:text-indigo-500'}`}
                          >
                              {btn.icon}
                          </button>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </main>

      {!isKidsMode && (
        <nav className="fixed bottom-0 left-0 right-0 safe-bottom border-t p-2 flex justify-around items-center z-40 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 lg:hidden">
          <NavBtn active={activeTab === 'schedule'} icon={<Calendar />} label="לוז" onClick={() => setActiveTab('schedule')} />
          <NavBtn active={activeTab === 'map'} icon={<Map />} label="מפה" onClick={() => setActiveTab('map')} />
          <NavBtn active={activeTab === 'packing'} icon={<CheckSquare />} label="אריזה" onClick={() => setActiveTab('packing')} />
          <NavBtn active={activeTab === 'vault'} icon={<Briefcase />} label="כספת" onClick={() => setActiveTab('vault')} />
          <NavBtn active={activeTab === 'wallet'} icon={<Wallet />} label="ארנק" onClick={() => setActiveTab('wallet')} />
        </nav>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .dir-ltr { direction: ltr; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="time"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0; position: absolute; right: 0; width: 100%; height: 100%; }
        input[type="time"] { position: relative; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 px-4 py-2 transition-all duration-300 ${active ? 'text-indigo-600 scale-110 font-black' : 'text-slate-400 hover:text-slate-600'}`}>
      {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
    </button>
  );
}

export default function App() { return ( <ErrorBoundary><TripApp /></ErrorBoundary> ); }
