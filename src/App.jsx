import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Sun, Moon, Map, Calendar, Plus, Navigation, Clock, Trash2, Camera, 
  Settings, MapPin, Wallet, CheckSquare, Square, UserCircle, Image as ImageIcon,
  Baby, CheckCircle, Info, MapPinned, RefreshCw, Briefcase, AlertOctagon, Calculator,
  ChevronRight, ChevronLeft, FileText, X, GripVertical, SunMedium, RefreshCcw
} from 'lucide-react';

/**
 * ==========================================
 * MAIN EXPORT
 * ==========================================
 */
export default function App() {
  return (
    <ErrorBoundary>
      <TripApp />
    </ErrorBoundary>
  );
}

/**
 * --- API CONFIGURATION & CONSTANTS ---
 */
const API_URL = 'https://my-family-api.onrender.com/api/sync';
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'family-trip-final';
const DB_KEY = `${APP_ID}_db`;
const PACKING_DB_KEY = `${APP_ID}_packing`;
const VAULT_DB_KEY = `${APP_ID}_vault`;
const THEME_PREF_KEY = `${APP_ID}_theme_pref`;
const USER_IDENTITY_KEY = `${APP_ID}_identity`;
const SAVED_CALENDAR_ID = `${APP_ID}_calendar_id`;
const APP_THEME_KEY = `${APP_ID}_app_theme`;

const POPULAR_CURRENCIES = [
  { code: 'EUR', label: 'אירו', flag: 'https://flagcdn.com/w40/eu.png', symbol: '€' },
  { code: 'USD', label: 'דולר', flag: 'https://flagcdn.com/w40/us.png', symbol: '$' },
  { code: 'PLN', label: 'זלוטי', flag: 'https://flagcdn.com/w40/pl.png', symbol: 'zł' },
  { code: 'HUF', label: 'פורינט', flag: 'https://flagcdn.com/w40/hu.png', symbol: 'Ft' }
];

const ACTIVITY_TYPES = {
  attraction: { label: 'אטרקציה', dot: 'bg-purple-500', border: 'border-purple-500', bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', text: 'text-purple-700', darkText: 'dark:text-purple-400', icon: '🎡' },
  food: { label: 'אוכל', dot: 'bg-orange-500', border: 'border-orange-500', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', text: 'text-orange-700', darkText: 'dark:text-orange-400', icon: '🍔' },
  travel: { label: 'נסיעה', dot: 'bg-blue-500', border: 'border-blue-500', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-700', darkText: 'dark:text-blue-400', icon: '🚗' },
  rest: { label: 'מנוחה', dot: 'bg-green-500', border: 'border-green-500', bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', text: 'text-green-700', darkText: 'dark:text-green-400', icon: '😴' }
};

const THEMES = {
  standard: {
    bg: 'bg-slate-50 dark:bg-slate-900',
    bgImg: null,
    header: 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800',
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl',
    primaryText: 'text-indigo-600 dark:text-indigo-400',
    primaryLight: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    ring: 'focus:ring-indigo-500 focus:border-indigo-500',
    shadow: 'shadow-indigo-500/20'
  },
  hoops: {
    bg: 'bg-orange-50 dark:bg-zinc-900',
    bgImg: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=2000&auto=format&fit=crop',
    header: 'bg-orange-100/80 dark:bg-zinc-900/80 border-orange-200 dark:border-zinc-800',
    primary: 'bg-orange-600 hover:bg-orange-700 text-white rounded-full',
    primaryText: 'text-orange-600 dark:text-orange-400',
    primaryLight: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    ring: 'focus:ring-orange-500 focus:border-orange-500',
    shadow: 'shadow-orange-500/20'
  },
  grass: {
    bg: 'bg-green-50 dark:bg-stone-900',
    bgImg: 'https://images.unsplash.com/photo-1533460004989-cef01064af7e?q=80&w=2000&auto=format&fit=crop',
    header: 'bg-green-100/80 dark:bg-stone-900/80 border-green-200 dark:border-stone-800',
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl',
    primaryText: 'text-emerald-600 dark:text-emerald-400',
    primaryLight: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    ring: 'focus:ring-emerald-500 focus:border-emerald-500',
    shadow: 'shadow-emerald-500/20'
  },
  urban: {
    bg: 'bg-neutral-50 dark:bg-neutral-950',
    bgImg: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop',
    header: 'bg-neutral-100/80 dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800',
    primary: 'bg-neutral-800 hover:bg-neutral-900 text-white dark:bg-neutral-200 dark:hover:bg-white dark:text-neutral-900 rounded-lg',
    primaryText: 'text-neutral-800 dark:text-neutral-200',
    primaryLight: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200',
    ring: 'focus:ring-neutral-500 focus:border-neutral-500',
    shadow: 'shadow-neutral-500/20'
  },
  snow: {
    bg: 'bg-slate-100 dark:bg-slate-900',
    bgImg: 'https://images.unsplash.com/photo-1517298257259-f72ccd2dd3ce?q=80&w=2000&auto=format&fit=crop',
    header: 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800',
    primary: 'bg-sky-600 hover:bg-sky-700 text-white rounded-xl',
    primaryText: 'text-sky-600 dark:text-sky-400',
    primaryLight: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    ring: 'focus:ring-sky-500 focus:border-sky-500',
    shadow: 'shadow-sky-500/20'
  },
  beach: {
    bg: 'bg-cyan-50 dark:bg-slate-900',
    bgImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop',
    header: 'bg-cyan-100/80 dark:bg-slate-900/80 border-cyan-200 dark:border-slate-800',
    primary: 'bg-teal-500 hover:bg-teal-600 text-white rounded-2xl',
    primaryText: 'text-teal-600 dark:text-teal-400',
    primaryLight: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    ring: 'focus:ring-teal-500 focus:border-teal-500',
    shadow: 'shadow-teal-500/20'
  }
};

/**
 * --- UTILITIES & STORAGE (IndexedDB) ---
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FamilyTripDB_v5', 5); 
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
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(data, key);
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

const formatTabDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
};

/**
 * --- ERROR BOUNDARY ---
 */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.warn("Production Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 font-sans text-right">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-red-100 dark:border-red-900">
            <AlertOctagon size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">אירעה שגיאה</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">האפליקציה נתקלה בבעיה טכנית. אל דאגה, הנתונים בטוחים מקומית.</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">טען מחדש</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * --- COMPONENTS ---
 */
function SyncInput({ value, onSave, className, type = "text", disabled = false, ...props }) {
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
        disabled={disabled}
        {...props}
      />
    );
}

/**
 * --- MAIN APPLICATION COMPONENT ---
 */
function TripApp() {
  const [activities, setActivities] = useState({});
  const [packingList, setPackingList] = useState([]);
  const [vaultFiles, setVaultFiles] = useState([]);
  const [mapLocations, setMapLocations] = useState([]); 
  
  const initialUser = localStorage.getItem(USER_IDENTITY_KEY) || 'אורח';
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [sharedCalendarId, setSharedCalendarId] = useState(localStorage.getItem(SAVED_CALENDAR_ID) || '');
  const [currentDay, setCurrentDay] = useState(new Date().toISOString().split('T')[0]); 
  
  const [appTheme, setAppTheme] = useState(localStorage.getItem(APP_THEME_KEY) || 'standard');
  const [themeMode, setThemeMode] = useState('auto');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('schedule');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  const [exchangeRates, setExchangeRates] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState(4.0);
  const [foreignAmount, setForeignAmount] = useState('');
  const [isFetchingFx, setIsFetchingFx] = useState(false);
  
  const [dailyWeather, setDailyWeather] = useState(null);
  const [userRole, setUserRole] = useState('editor');
  const [isKidsMode, setIsKidsMode] = useState(['יותם', 'דורון', 'אורי'].includes(initialUser));
  const [showSettings, setShowSettings] = useState(false); 
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [conflictDialog, setConflictDialog] = useState(null);
  
  const lastSyncedActivitiesStr = useRef('{}');
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const dataRefs = useRef({ activities, packingList, vaultFiles, mapLocations, sharedCalendarId });

  const sortedDays = useMemo(() => {
    const daysSet = new Set(Object.keys(activities));
    daysSet.add(currentDay);
    return Array.from(daysSet).sort();
  }, [activities, currentDay]);
  
  const currentDayIndex = sortedDays.indexOf(currentDay);
  const themeParams = THEMES[appTheme] || THEMES.standard;
  const themeClass = currentTheme === 'dark' ? 'bg-slate-900 text-slate-100 dark' : 'bg-slate-50 text-slate-900 light';

  useEffect(() => {
    dataRefs.current = { activities, packingList, vaultFiles, mapLocations, sharedCalendarId };
  }, [activities, packingList, vaultFiles, mapLocations, sharedCalendarId]);

  useEffect(() => {
    localStorage.setItem(USER_IDENTITY_KEY, currentUser);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(APP_THEME_KEY, appTheme);
  }, [appTheme]);

  const handleUserChange = (u) => {
    setCurrentUser(u);
    if (['יותם', 'דורון', 'אורי'].includes(u)) {
        setIsKidsMode(true);
    } else {
        setIsKidsMode(false);
    }
  };

  useEffect(() => {
    if (sharedCalendarId) {
        localStorage.setItem(SAVED_CALENDAR_ID, sharedCalendarId.trim());
    } else {
        localStorage.removeItem(SAVED_CALENDAR_ID);
    }
  }, [sharedCalendarId]);

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  }, []);

  /**
   * --- CLOUD ENGINE ---
   */
  const pushToCloud = async (newData = {}) => {
    if (!isOnline) return;
    setIsSyncing(true);
    
    let payloadPacking = [...(newData.packingList || dataRefs.current.packingList)];
    const cid = newData.sharedCalendarId !== undefined ? newData.sharedCalendarId : dataRefs.current.sharedCalendarId;
    
    payloadPacking = payloadPacking.filter(i => i.id !== 'config_calendar_id');
    if (cid && cid.trim() !== '') {
        payloadPacking.push({ id: 'config_calendar_id', text: cid.trim(), checked: false, owner: 'system' });
    }

    const payload = {
        activities: newData.activities || dataRefs.current.activities,
        packingList: payloadPacking,
        vaultFiles: newData.vaultFiles || dataRefs.current.vaultFiles
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        lastSyncedActivitiesStr.current = JSON.stringify(payload.activities);
      }
    } catch (error) {
      console.warn("Push failed:", error.message);
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

      if (data.activities && Object.keys(data.activities).length > 0) {
          const cloudStr = JSON.stringify(data.activities);
          const localStr = JSON.stringify(dataRefs.current.activities);
          if (cloudStr !== localStr) {
              if (localStr === lastSyncedActivitiesStr.current || Object.keys(dataRefs.current.activities).length === 0) {
                  setActivities(data.activities);
                  lastSyncedActivitiesStr.current = cloudStr;
                  await saveLocally('trips', DB_KEY, data.activities);
                  changed = true;
              } else {
                  setConflictDialog(data);
              }
          }
      }

      if (data.packingList) {
          const configItem = data.packingList.find(i => i.id === 'config_calendar_id');
          const pulledCid = configItem ? configItem.text : '';
          
          if (pulledCid && pulledCid !== dataRefs.current.sharedCalendarId) {
              setSharedCalendarId(pulledCid);
              localStorage.setItem(SAVED_CALENDAR_ID, pulledCid);
          }

          const actualPacking = data.packingList.filter(i => i.id !== 'config_calendar_id');
          if (JSON.stringify(actualPacking) !== JSON.stringify(dataRefs.current.packingList)) {
              setPackingList(actualPacking);
              await saveLocally('packing', PACKING_DB_KEY, actualPacking);
              changed = true;
          }
      }
      
      if (data.vaultFiles && data.vaultFiles.length > 0) {
          const mergedVault = data.vaultFiles.map(cloudFile => {
              const localFile = dataRefs.current.vaultFiles.find(f => f.id === cloudFile.id);
              const isPinned = cloudFile.type?.includes('pinned') || (localFile && localFile.pinnedToWallet);
              return { ...cloudFile, data: localFile ? localFile.data : undefined, pinnedToWallet: isPinned };
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

      if (!silent && !conflictDialog && changed) {
          showToast("סונכרן בהצלחה");
      }
    } catch (error) {
      console.warn("Pull failed:", error.message);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  /**
   * --- GOOGLE CALENDAR SYNC (Advanced Sync with Diffs) ---
   */
  const syncFromGoogleCalendar = async () => {
    if (!isOnline) {
        showToast("נדרש חיבור לאינטרנט לסנכרון יומן");
        return;
    }
    
    if (!sharedCalendarId || sharedCalendarId.trim() === '') {
        showToast("לא הוגדר יומן. אנא הגדר מזהה יומן (Calendar ID) בתפריט ההגדרות.", 4000);
        setShowSettings(true); 
        return;
    }
    
    setIsSyncing(true);
    
    try {
        const calUrl = API_URL.replace('/sync', '/calendar');
        const res = await fetch(`${calUrl}?calendarId=${encodeURIComponent(sharedCalendarId.trim())}&date=${currentDay}`);
        
        if (!res.ok) {
            if (res.status === 404 || res.status === 403) {
                throw new Error("היומן לא נמצא או שחסרות הרשאות אבטחה מול גוגל.");
            }
            throw new Error('שגיאת רשת בגישה ליומן');
        }
        const data = await res.json();

        if (data.events) {
            const newActs = [...(dataRefs.current.activities[currentDay] || [])];
            
            // אוספים מזהים מגוגל
            const incomingCalIds = data.events.map(ev => `cal_${ev.id}`);
            
            // מסננים אירועי יומן ישנים שכבר לא קיימים בגוגל
            let finalActs = newActs.filter(a => !a.id.toString().startsWith('cal_') || incomingCalIds.includes(a.id));
            
            let addedCount = 0;
            let updatedCount = 0;
            
            // מוסיפים/מעדכנים
            data.events.forEach(ev => {
                const calId = `cal_${ev.id}`;
                const existingActIndex = finalActs.findIndex(a => a.id === calId);
                
                if (existingActIndex >= 0) {
                    const oldAct = finalActs[existingActIndex];
                    if (oldAct.title !== ev.title || oldAct.time !== ev.time || oldAct.location !== ev.location || oldAct.duration !== ev.duration) {
                        finalActs[existingActIndex] = { 
                            ...oldAct, title: ev.title, time: ev.time, location: ev.location, duration: ev.duration 
                        };
                        updatedCount++;
                    }
                } else {
                    finalActs.push({
                        id: calId, time: ev.time, title: ev.title, location: ev.location || 'יומן גוגל', duration: ev.duration || '60', type: 'attraction', completed: false
                    });
                    addedCount++;
                }
            });
            
            finalActs.sort((a, b) => a.time.localeCompare(b.time));
            const updatedActivities = { ...dataRefs.current.activities, [currentDay]: finalActs };
            setActivities(updatedActivities);
            await saveLocally('trips', DB_KEY, updatedActivities);
            pushToCloud({ activities: updatedActivities });
            
            showToast(`סנכרון יומן: ${addedCount} הוספו, ${updatedCount} עודכנו.`);
        } else {
            showToast('לא נתקבלו נתונים מהיומן');
        }
    } catch (err) {
        console.warn("Calendar Sync Error:", err.message);
        showToast(err.message || 'שגיאה בסנכרון מול גוגל.');
    } finally {
        setIsSyncing(false);
    }
  };

  /**
   * --- UNIFIED SYNC (Full Sync) ---
   */
  const handleFullSync = async () => {
    if (!isOnline) {
        showToast("נדרש חיבור לאינטרנט לסנכרון");
        return;
    }
    setIsSyncing(true);
    
    // משיכת נתוני אקסל בצורה שקטה כדי לא להפריע לחיווי הסנכרון
    await pullFromCloud(true); 
    
    if (sharedCalendarId && sharedCalendarId.trim() !== '') {
        // אם מוגדר יומן, נסנכרן גם אותו (הפונקציה תכבה את הספינר בסיומה)
        await syncFromGoogleCalendar();
    } else {
        showToast("סונכרן בהצלחה מול הענן");
        setIsSyncing(false);
    }
  };

  /**
   * --- INITIALIZATION & EFFECTS ---
   */
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
        lastSyncedActivitiesStr.current = JSON.stringify(savedData);
        
        const defaultDay = Object.keys(savedData).sort()[0];
        if (defaultDay) setCurrentDay(defaultDay);
      }

      const savedPacking = await loadLocally('packing', PACKING_DB_KEY);
      if (savedPacking) setPackingList(savedPacking);

      const savedVault = await loadLocally('vault', VAULT_DB_KEY);
      if (savedVault) setVaultFiles(savedVault);
      
      const savedTheme = localStorage.getItem(THEME_PREF_KEY);
      if (savedTheme) setThemeMode(savedTheme);

      if (navigator.onLine) {
        pullFromCloud(true); 
      }
    };
    
    initApp();

    const checkTouch = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    setIsTouchDevice(checkTouch());

    const toggleOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', toggleOnline);
    window.addEventListener('offline', toggleOnline);

    return () => {
      window.removeEventListener('online', toggleOnline);
      window.removeEventListener('offline', toggleOnline);
    };
  }, []);

  useEffect(() => {
    if (themeMode === 'auto') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
        
        const handleChange = (e) => setCurrentTheme(e.matches ? 'dark' : 'light');
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        }
        return () => {
            if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleChange);
        };
    } else {
        setCurrentTheme(themeMode);
    }
  }, [themeMode]);

  useEffect(() => { 
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_PREF_KEY, themeMode); 
  }, [currentTheme, themeMode]);

  /**
   * --- LOGIC HELPERS ---
   */
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

    // חסימת עריכת שדות מיומן גוגל
    const isCalEvent = id.toString().startsWith('cal_');
    if (isCalEvent && ['time', 'title', 'location', 'duration'].includes(field)) {
        showToast("לא ניתן לערוך אירוע מסונכרן. ערוך ביומן גוגל.");
        return;
    }

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
    if (id.toString().startsWith('cal_')) {
        showToast("לא ניתן למחוק אירוע מסונכרן. מחק מגוגל קלנדר.");
        return;
    }
    const updatedActivities = { ...activities, [currentDay]: activities[currentDay].filter(a => a.id !== id) };
    setActivities(updatedActivities);
    await saveLocally('trips', DB_KEY, updatedActivities);
    pushToCloud({ activities: updatedActivities });
  };

  const cycleType = (id, type) => {
    const types = Object.keys(ACTIVITY_TYPES);
    handleActivityEdit(id, 'type', types[(types.indexOf(type) + 1) % types.length]);
  };

  const handleDragEnd = async () => {
      if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
          const list = [...(activities[currentDay] || [])];
          const dragged = list.splice(dragItem.current, 1)[0];
          list.splice(dragOverItem.current, 0, dragged);
          dragItem.current = null; dragOverItem.current = null;
          const up = { ...activities, [currentDay]: list };
          setActivities(up);
          await saveLocally('trips', DB_KEY, up);
          pushToCloud({ activities: up });
      }
  };

  const goToNextDay = () => currentDayIndex < sortedDays.length - 1 && setCurrentDay(sortedDays[currentDayIndex + 1]);
  const goToPrevDay = () => currentDayIndex > 0 && setCurrentDay(sortedDays[currentDayIndex - 1]);

  const handleFileUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onloadend = async () => {
      const n = { id: Date.now().toString(), name: f.name, data: r.result, type: f.type, pinnedToWallet: false };
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

  const toggleVaultPin = async (id) => {
      const updatedVault = vaultFiles.map(f => {
          if (f.id === id) {
              const isNowPinned = !f.pinnedToWallet;
              const newType = isNowPinned ? (f.type ? f.type + '_pinned' : 'pinned') : (f.type ? f.type.replace('_pinned', '').replace('pinned', '') : '');
              return { ...f, pinnedToWallet: isNowPinned, type: newType };
          }
          return f;
      });
      setVaultFiles(updatedVault);
      await saveLocally('vault', VAULT_DB_KEY, updatedVault);
      pushToCloud({ vaultFiles: updatedVault });
      showToast("סטטוס נעץ עודכן");
  };

  const addPackingItem = async () => {
    const t = prompt('הכנס פריט:'); if (!t) return;
    const updatedPacking = [{ id: Date.now().toString(), text: t, checked: false, owner: currentUser }, ...packingList];
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
    } catch (e) { console.warn("FX fetch failed:", e.message); }
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
    } catch (e) { console.warn("Weather fetch failed:", e.message); }
  };

  useEffect(() => { fetchFXRates(); }, []);
  useEffect(() => { fetchWeather(); }, [currentDay, isOnline]);
  useEffect(() => { if (exchangeRates[selectedCurrency]) setExchangeRate(Number(exchangeRates[selectedCurrency].toFixed(4))); }, [selectedCurrency, exchangeRates]);

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
        <div className="space-y-6 animate-in relative z-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">מיקומים שמורים</h2>
                <div className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold text-slate-500 flex items-center gap-1">
                    <MapPinned size={12}/> מסונכרן למפה
                </div>
            </div>
            
            {mapLocations.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                    <MapPinned size={48} className="mx-auto mb-4 opacity-20"/>
                    <p className="font-bold">אין מיקומים שמורים.</p>
                    <p className="text-xs mt-2">הוסף קובץ KML לתיקיית הדרייב.</p>
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
                            <div className={`w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center ${themeParams.primaryText} group-hover:${themeParams.primary.split(' ')[0]} group-hover:text-white transition-colors`}>
                                <Navigation size={18}/>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );

    if (pane === 'vault') return (
        <div className="space-y-6 animate-in relative z-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">כספת (Vault)</h2>
                <label className={`p-3 ${themeParams.primary} shadow-lg transition-all cursor-pointer`}><Camera size={20}/><input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {vaultFiles.map(f => {
                    const driveIdMatch = f.url?.match(/id=([a-zA-Z0-9_-]+)/);
                    const driveThumbnail = driveIdMatch ? `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w800` : f.url;
                    const fileSource = f.data || driveThumbnail;
                    
                    const isPdf = f.name?.toLowerCase().endsWith('.pdf') || f.type?.includes('pdf') || f.data?.includes('application/pdf');
                    const isImage = f.name?.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/i) || f.type?.includes('image') || f.data?.includes('image/');

                    return (
                    <div key={f.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group shadow-sm flex flex-col transition-all hover:shadow-md">
                        {isPdf ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-800/50">
                                <FileText size={48} className="text-red-500 mb-3 drop-shadow-sm"/>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full px-2" dir="ltr">{f.name}</span>
                                <a href={f.url || f.data} download={f.name} target="_blank" rel="noreferrer" className={`mt-4 px-4 py-2 ${themeParams.primaryLight} text-[10px] font-black rounded-xl transition-colors uppercase tracking-wide`}>פתח מסמך</a>
                            </div>
                        ) : isImage || fileSource ? (
                            <img src={fileSource} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x600/f1f5f9/a4b5c6?text=Preview+Error' }} className="w-full h-full object-cover" alt={f.name} />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-800/50">
                                <ImageIcon size={48} className="text-slate-400 mb-3 drop-shadow-sm"/>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full px-2" dir="ltr">{f.name}</span>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => toggleVaultPin(f.id)} 
                            title="הצג בארנק"
                            className={`absolute top-2 left-2 p-2 rounded-full shadow-md transition-all hover:scale-110 ${f.pinnedToWallet ? 'bg-yellow-400 text-white' : 'bg-white/80 text-slate-400 hover:text-indigo-600'}`}
                        >
                            <Wallet size={14}/>
                        </button>

                        <button onClick={() => removeVaultFile(f.id)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"><Trash2 size={12}/></button>
                    </div>
                )})}
            </div>
        </div>
    );
    if (pane === 'packing') return (
        <div className="space-y-6 animate-in relative z-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">אריזה</h2>
                <button onClick={addPackingItem} className={`p-3 ${themeParams.primary} shadow-lg transition-all hover:scale-105 active:scale-95`}><Plus size={20}/></button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                {packingList.map(item => (
                    <div key={item.id} onClick={() => togglePackingItem(item.id)} className="p-5 border-b last:border-0 border-slate-50 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-4">
                            {item.checked ? <CheckSquare className="text-green-500 shrink-0"/> : <Square className="text-slate-300 shrink-0"/>}
                            <span className={`font-bold ${item.checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{item.text}</span>
                        </div>
                        {item.owner && (
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold px-2 py-1 rounded-full shrink-0">
                                {item.owner}
                            </span>
                        )}
                    </div>
                ))}
                {packingList.length === 0 && <div className="p-8 text-center text-slate-400">הרשימה ריקה</div>}
            </div>
        </div>
    );
    if (pane === 'wallet') {
        const pinnedFiles = vaultFiles.filter(f => f.pinnedToWallet);
        
        return (
            <div className="space-y-8 animate-in relative z-10">
                <div>
                    <h2 className="text-3xl font-black mb-6 text-slate-900 dark:text-white">ארנק ומט"ח</h2>
                    <div className="p-6 bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700 shadow-sm space-y-6">
                        
                        <div className="grid grid-cols-4 gap-2 w-full bg-slate-50 dark:bg-slate-900/50 p-2 rounded-3xl">
                            {POPULAR_CURRENCIES.map(c => (
                                <button 
                                    key={c.code} 
                                    onClick={() => setSelectedCurrency(c.code)} 
                                    className={`py-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 ${selectedCurrency === c.code ? `${themeParams.primary} ${themeParams.shadow} ring-2 ${themeParams.ring}` : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    <span className="block h-6 w-8 overflow-hidden rounded shadow-sm border border-slate-200 dark:border-slate-600">
                                        <img src={c.flag} alt={c.code} className="w-full h-full object-cover" />
                                    </span>
                                    <span className="text-[11px] sm:text-xs font-black tracking-tight">{c.code} {c.symbol}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <input type="number" placeholder="סכום" value={foreignAmount} onChange={(e)=>setForeignAmount(e.target.value)} className={`w-full py-4 pr-4 pl-20 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-black text-lg text-right ${themeParams.ring} text-slate-900 dark:text-white`} />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 flex items-center gap-1.5">
                                        <img src={POPULAR_CURRENCIES.find(p => p.code === selectedCurrency)?.flag} alt="flag" className="h-4 w-6 rounded-sm object-cover shadow-sm border border-slate-200 dark:border-slate-600" />
                                        <span>{selectedCurrency}</span>
                                    </div>
                                </div>
                                <div className="text-2xl text-slate-300 font-black">=</div>
                                <div className={`flex-1 p-4 rounded-2xl ${themeParams.primaryLight} font-black text-lg text-left dir-ltr border border-slate-100 dark:border-slate-800`}>
                                    {(Number(foreignAmount) * exchangeRate).toFixed(2)} ₪
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-700">
                            <span className="flex items-center gap-2"><Info size={14}/> שער המרה יציג: {exchangeRate}</span>
                            <button onClick={fetchFXRates} className={`flex items-center gap-1 ${themeParams.primaryText} hover:underline`}><RefreshCcw size={12} className={isFetchingFx ? 'animate-spin' : ''}/> רענן</button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-black mb-4 px-2 text-slate-900 dark:text-white">מסמכים לשליפה מהירה</h3>
                    {pinnedFiles.length === 0 ? (
                        <div className="text-sm text-slate-400 text-center py-8 bg-white/50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                            אין מסמכים נעוצים.<br/>כדי להוסיף מסמך לגישה מהירה, עבור ללשונית ה"כספת" ולחץ על סמל הארנק בפינת הקובץ.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {pinnedFiles.map(f => {
                                const driveIdMatch = f.url?.match(/id=([a-zA-Z0-9_-]+)/);
                                const driveThumbnail = driveIdMatch ? `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w800` : f.url;
                                const fileSource = f.data || driveThumbnail;
                                
                                const isPdf = f.name?.toLowerCase().endsWith('.pdf') || f.type?.includes('pdf') || f.data?.includes('application/pdf');
                                const isImage = f.name?.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/i) || f.type?.includes('image') || f.data?.includes('image/');
                                
                                return (
                                    <div key={f.id} className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col group">
                                        {isPdf ? (
                                            <div className="flex-1 flex flex-col items-center justify-center p-2 text-center bg-slate-50 dark:bg-slate-900/30">
                                                <FileText size={24} className="text-red-500 mb-1"/>
                                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full px-1" dir="ltr">{f.name}</span>
                                                <a href={f.url || f.data} download={f.name} target="_blank" rel="noreferrer" className={`mt-1 px-3 py-1 ${themeParams.primaryLight} text-[9px] font-black rounded-lg`}>צפה</a>
                                            </div>
                                        ) : isImage || fileSource ? (
                                            <img src={fileSource} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x200/f1f5f9/a4b5c6?text=Preview+Error' }} className="w-full h-full object-cover" alt={f.name} />
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30"><ImageIcon size={24} className="text-slate-400"/></div>
                                        )}
                                        <button 
                                            onClick={() => toggleVaultPin(f.id)} 
                                            className="absolute top-1 left-1 p-1.5 bg-slate-900/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                            title="הסר מהארנק"
                                        >
                                            <X size={10}/>
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }
  };

  return (
    <div dir="rtl" className={`min-h-screen flex flex-col transition-all duration-500 font-sans ${themeParams.bg} text-slate-900 dark:text-slate-100 ${themeClass}`}>
      
      {themeParams.bgImg && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-10 dark:opacity-5 pointer-events-none transition-opacity duration-500"
          style={{ backgroundImage: `url('${themeParams.bgImg}')` }}
        />
      )}

      {toastMessage && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 font-bold text-sm whitespace-nowrap">{toastMessage}</div>}

      {conflictDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-slate-100 dark:border-slate-700">
                  <AlertOctagon size={48} className="mx-auto text-orange-500 mb-4" />
                  <h2 className="text-xl font-black mb-2 text-slate-900 dark:text-white">קונפליקט גרסאות</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">התגלו נתונים שונים בענן. איזו גרסה לשמור?</p>
                  <div className="space-y-3">
                      <button onClick={async () => { setActivities(conflictDialog.activities); lastSyncedActivitiesStr.current = JSON.stringify(conflictDialog.activities); await saveLocally('trips', DB_KEY, conflictDialog.activities); setConflictDialog(null); }} className={`w-full py-3 ${themeParams.primary} rounded-xl font-bold transition-colors shadow-lg ${themeParams.shadow}`}>קבל גרסת ענן</button>
                      <button onClick={async () => { lastSyncedActivitiesStr.current = JSON.stringify(activities); pushToCloud({ activities }); setConflictDialog(null); }} className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">השאר גרסה שלי</button>
                  </div>
              </div>
          </div>
      )}

      {showSettings && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
          >
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700 relative z-10">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Settings size={20}/> הגדרות המערכת</h2>
                      <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors bg-slate-100 dark:bg-slate-700"><X size={16}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-6">
                      <div className="mb-4">
                          <label className="block text-[11px] uppercase tracking-wide font-black text-slate-400 mb-2">מי משתמש באפליקציה?</label>
                          <div className="flex flex-wrap gap-2">
                              {['רועי', 'יעלה', 'יותם', 'דורון', 'אורי', 'אורח'].map(u => (
                                  <button
                                      key={u}
                                      onClick={() => handleUserChange(u)}
                                      className={`px-3 py-2 rounded-xl text-sm font-black transition-all flex-grow text-center ${currentUser === u ? `${themeParams.primary.split(' ')[0]} text-white shadow-md ring-2 ${themeParams.ring}` : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                  >
                                      {u}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
                          <label className="block text-[11px] uppercase tracking-wide font-black text-slate-400 mb-2">תצוגה (Theme)</label>
                          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 gap-1">
                              {['light', 'dark', 'auto'].map(t => (
                                  <button 
                                      key={t} 
                                      onClick={() => setThemeMode(t)} 
                                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${themeMode === t ? `bg-white dark:bg-slate-700 ${themeParams.primaryText} shadow-sm` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                  >
                                      {t === 'light' ? <Sun size={14}/> : t === 'dark' ? <Moon size={14}/> : <MapPin size={14}/>}
                                      {t === 'light' ? 'בהיר' : t === 'dark' ? 'כהה' : 'אוטומטי'}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
                          <label className="block text-[11px] uppercase tracking-wide font-black text-slate-400 mb-2">סגנון עיצוב</label>
                          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 rounded-2xl p-1">
                              {[
                                  { id: 'standard', label: 'רגיל' },
                                  { id: 'hoops', label: 'כדורסל 🏀' },
                                  { id: 'grass', label: 'דשא 🌿' },
                                  { id: 'urban', label: 'אורבני 🏙️' },
                                  { id: 'snow', label: 'לבן נקי' },
                                  { id: 'beach', label: 'חופים 🏖️' }
                              ].map(t => (
                                  <button 
                                      key={t.id} 
                                      onClick={() => setAppTheme(t.id)} 
                                      className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${appTheme === t.id ? `bg-white dark:bg-slate-700 ${themeParams.primaryText} shadow-sm` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                  >
                                      {t.label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
                          <label className="block text-[11px] uppercase tracking-wide font-black text-slate-400 mb-2">יומן גוגל (משותף לכל המשפחה)</label>
                          <input
                              type="text"
                              value={sharedCalendarId}
                              onChange={(e) => setSharedCalendarId(e.target.value)}
                              onBlur={(e) => {
                                  pushToCloud({ sharedCalendarId: e.target.value });
                                  if(e.target.value) showToast("הגדרות היומן סונכרנו לכולם");
                              }}
                              className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 ${themeParams.ring} dir-ltr text-left transition-all`}
                              placeholder="example@group.calendar.google.com"
                          />
                          <p className="text-[10px] font-bold text-slate-400 mt-2 leading-relaxed">מזהה היומן כדי לשאוב אירועים. שינוי כאן ישפיע על כל המשפחה מיד.</p>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
                          <button 
                              onClick={() => { setIsKidsMode(!isKidsMode); setShowSettings(false); }} 
                              className={`w-full py-4 font-black rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-sm ${isKidsMode ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800'}`}
                          >
                              <Baby size={20}/> {isKidsMode ? 'צא ממצב ילדים' : 'הפעל מצב ילדים'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <header className={`sticky top-0 z-50 border-b p-3 flex items-center justify-between backdrop-blur-xl transition-colors relative ${themeParams.header} ${isKidsMode ? 'border-b-4 border-b-yellow-400' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center text-white shadow-lg ${isKidsMode ? 'bg-yellow-400 rounded-2xl' : `${themeParams.primary}`}`}>
            {isKidsMode ? <Baby size={24} /> : <Map size={22} />}
          </div>
          <div className="leading-tight">
            <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">{isKidsMode ? 'הטיול שלי!' : 'FamilyPlanner'}</h1>
            {!isOnline && <span className="text-[10px] text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 rounded-full font-bold ml-1">אופליין</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isKidsMode && isOnline && (
              <button onClick={handleFullSync} className={`p-2 ${themeParams.primaryText} hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors`} title="סנכרן נתונים ויומן">
                  <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
              </button>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <Settings size={22}/>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 lg:pb-8 flex flex-col gap-6 lg:gap-8 max-w-[90rem] mx-auto w-full relative z-10">
        
        {/* Top Area: Days Bar & Weather */}
        <div className="w-full flex flex-col lg:flex-row gap-4 items-stretch">
            <div className="flex-1 w-full flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-3xl shadow-inner overflow-x-auto no-scrollbar scroll-smooth border border-slate-50 dark:border-slate-900/50">
                {!isTouchDevice && sortedDays.length > 3 && <button onClick={goToPrevDay} className={`p-2 ${themeParams.primaryText} hidden sm:block`}><ChevronRight size={20}/></button>}
                {sortedDays.map((day) => (
                    <button 
                        key={day} 
                        onClick={() => setCurrentDay(day)} 
                        className={`px-6 py-3 font-black text-sm shrink-0 transition-all hover:scale-105 ${currentDay === day ? (isKidsMode ? 'bg-yellow-400 text-slate-900 shadow-md rounded-2xl' : `${themeParams.primary} shadow-lg ${themeParams.shadow}`) : 'bg-white dark:bg-slate-700 text-slate-400 rounded-2xl'}`}
                    >
                        {formatTabDate(day)}
                    </button>
                ))}
                {!isTouchDevice && sortedDays.length > 3 && <button onClick={goToNextDay} className={`p-2 ${themeParams.primaryText} hidden sm:block`}><ChevronLeft size={20}/></button>}
            </div>

            {dailyWeather && !isKidsMode && (
                <div className="shrink-0 flex items-center gap-4 p-3 lg:p-4 bg-blue-50 dark:bg-slate-800 rounded-3xl border border-blue-100 dark:border-slate-700 shadow-sm animate-in">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm"><SunMedium className="text-yellow-500"/></div>
                    <div className="leading-tight">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white">{dailyWeather.temp}°C</h3>
                        <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase">מזג האוויר ב{dailyWeather.loc}</p>
                    </div>
                </div>
            )}
        </div>

        {/* Columns Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start flex-1 w-full">
          
          {/* Schedule Column */}
          <div className={`lg:col-span-7 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-8 ${activeTab === 'schedule' ? 'block' : 'hidden lg:block'}`}>
            <section className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {isKidsMode ? 'היום בטיול!' : 'לוח הזמנים ליום'}
                        </h2>
                        {!isKidsMode && (
                            <input 
                                type="date" 
                                value={currentDay} 
                                onChange={(e) => setCurrentDay(e.target.value)} 
                                className={`p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm font-bold focus:ring-2 ${themeParams.ring} cursor-pointer text-slate-700 dark:text-slate-200 outline-none`}
                            />
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {!isKidsMode && <button onClick={addActivity} className={`w-14 h-14 ${themeParams.primary} shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:scale-110 ${themeParams.shadow}`} title="הוסף פעילות חדשה"><Plus size={32}/></button>}
                    </div>
                </div>

                <div className="space-y-4 relative pr-4">
                    <div className="absolute top-4 bottom-4 right-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    {(activities[currentDay] || []).map((act, idx) => {
                        const type = ACTIVITY_TYPES[act.type || 'attraction'];
                        const isCalEvent = act.id.toString().startsWith('cal_');
                        return (
                            <div 
                                key={act.id} 
                                draggable={userRole === 'editor' && !isKidsMode}
                                onDragStart={(e) => { dragItem.current = idx; }}
                                onDragEnter={(e) => { dragOverItem.current = idx; }}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className={`relative pr-8 animate-in ${act.completed ? 'opacity-50 grayscale-[50%]' : ''}`}
                            >
                                <div className={`absolute right-[-4px] top-8 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${act.completed ? 'bg-green-500' : type.dot}`}></div>
                                <div className={`p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm border-r-4 ${act.completed ? 'border-r-green-500' : type.border} flex items-center gap-4 group hover:shadow-md transition-all`}>
                                    
                                    {!isKidsMode && userRole === 'editor' && (
                                        <div className={`cursor-move text-slate-300 dark:text-slate-600 hover:${themeParams.primaryText} touch-none ml-1`}>
                                            <GripVertical size={20} />
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3 w-full">
                                                <button onClick={()=>isKidsMode ? handleActivityEdit(act.id, 'completed', !act.completed) : cycleType(act.id, act.type)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-transform hover:scale-110 active:scale-90 ${act.completed ? 'bg-green-500 text-white' : (type.bg + ' ' + type.darkBg)}`}>{act.completed ? <CheckCircle size={20}/> : type.icon}</button>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {isCalEvent && <Calendar size={14} className="text-blue-500 opacity-70 shrink-0" title="מסונכרן מיומן גוגל" />}
                                                        <SyncInput 
                                                          type="time" 
                                                          value={act.time} 
                                                          disabled={isCalEvent}
                                                          onSave={(val)=>handleActivityEdit(act.id, 'time', val)} 
                                                          className={`text-[10px] font-black p-0.5 rounded border-none focus:ring-1 ${themeParams.ring} bg-transparent ${act.completed ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'} ${isCalEvent ? 'opacity-60 cursor-not-allowed' : ''}`} 
                                                        />
                                                        <SyncInput 
                                                          type="text" 
                                                          value={act.title} 
                                                          disabled={isCalEvent}
                                                          onSave={(val)=>handleActivityEdit(act.id, 'title', val)} 
                                                          className={`block w-full font-bold text-lg bg-transparent focus:outline-none truncate border-b border-transparent ${themeParams.ring.replace('focus:ring-', 'focus:border-')} text-slate-900 dark:text-white ${act.completed ? 'line-through text-slate-400' : ''} ${isCalEvent ? 'opacity-60 cursor-not-allowed' : ''}`} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {(!isKidsMode && !isCalEvent) && <button onClick={()=>removeActivity(act.id)} className="text-slate-200 dark:text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2"><Trash2 size={16}/></button>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1 truncate max-w-[150px]">
                                                <MapPin size={12}/> 
                                                <SyncInput 
                                                  type="text" 
                                                  value={act.location} 
                                                  disabled={isCalEvent}
                                                  onSave={(val)=>handleActivityEdit(act.id, 'location', val)} 
                                                  className={`bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 w-full ${isCalEvent ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12}/> 
                                                <SyncInput 
                                                  type="number" 
                                                  value={act.duration} 
                                                  disabled={isCalEvent}
                                                  onSave={(val)=>handleActivityEdit(act.id, 'duration', val)} 
                                                  className={`bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 w-8 text-center ${isCalEvent ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                />
                                                דק'
                                            </div>
                                        </div>
                                    </div>
                                    {isKidsMode && <button onClick={()=>handleActivityEdit(act.id, 'completed', !act.completed)} className={`px-4 py-3 rounded-2xl font-black shadow-md transition-all hover:scale-105 active:scale-95 ${act.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-400 text-slate-900'}`}>{act.completed ? 'בוצע!' : 'היינו כאן!'}</button>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!isKidsMode && (activities[currentDay] || []).length > 0 && (
                    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex justify-around text-center border border-slate-100 dark:border-slate-700 shadow-inner">
                        <div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">פעילות נטו</p><p className={`font-black text-xl ${themeParams.primaryText}`}>{Math.floor(stats.activity/60)} ש' ו-{stats.activity%60} ד'</p></div>
                        <div className="w-px bg-slate-200 dark:bg-slate-700 h-10"></div>
                        <div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">זמן בדרכים</p><p className="font-black text-xl text-blue-500 dark:text-blue-400">{Math.floor(stats.travel/60)} ש' ו-{stats.travel%60} ד'</p></div>
                    </div>
                )}
            </section>
          </div>

          <div className={`lg:col-span-4 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-8 ${activeTab !== 'schedule' ? 'block' : 'hidden lg:block'}`}>
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
                              className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95 ${activeTab===btn.id ? `${themeParams.primary} ${themeParams.shadow} ring-4 ${themeParams.ring.replace('focus:', '')}` : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:text-slate-600 dark:hover:text-slate-200'}`}
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
        <nav className="fixed bottom-0 left-0 right-0 safe-bottom border-t border-slate-100 dark:border-slate-800 p-2 flex justify-around items-center z-40 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 lg:hidden relative">
          <NavBtn active={activeTab === 'schedule'} themeParams={themeParams} icon={<Calendar />} label="לוז" onClick={() => setActiveTab('schedule')} />
          <NavBtn active={activeTab === 'map'} themeParams={themeParams} icon={<Map />} label="מפה" onClick={() => setActiveTab('map')} />
          <NavBtn active={activeTab === 'packing'} themeParams={themeParams} icon={<CheckSquare />} label="אריזה" onClick={() => setActiveTab('packing')} />
          <NavBtn active={activeTab === 'vault'} themeParams={themeParams} icon={<Briefcase />} label="כספת" onClick={() => setActiveTab('vault')} />
          <NavBtn active={activeTab === 'wallet'} themeParams={themeParams} icon={<Wallet />} label="ארנק" onClick={() => setActiveTab('wallet')} />
        </nav>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .dir-ltr { direction: ltr; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="time"]::-webkit-calendar-picker-indicator, input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0; position: absolute; right: 0; width: 100%; height: 100%; }
        input[type="time"], input[type="date"] { position: relative; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, themeParams }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 px-4 py-2 transition-all duration-300 ${active ? `${themeParams.primaryText} scale-110 font-black` : 'text-slate-400 hover:text-slate-600'}`}>
      {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
    </button>
  );
}
