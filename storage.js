// ===== DrDer-Maze - Storage Manager =====

class StorageManager {
    constructor() {
        this.dbName = 'DrDerMazeDB';
        this.dbVersion = 1;
        this.storeName = 'gameProgress';
        this.db = null;
        this.useIndexedDB = false;
        
        this.initializeStorage();
    }

    // تهيئة نظام التخزين
    async initializeStorage() {
        // التحقق من دعم IndexedDB
        if ('indexedDB' in window) {
            try {
                this.db = await this.openDatabase();
                this.useIndexedDB = true;
                console.log('IndexedDB initialized successfully');
            } catch (error) {
                console.warn('IndexedDB failed, falling back to localStorage:', error);
                this.useIndexedDB = false;
            }
        } else {
            console.warn('IndexedDB not supported, using localStorage');
            this.useIndexedDB = false;
        }
    }

    // فتح قاعدة البيانات
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // إنشاء object store إذا لم يكن موجوداً
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('stageNumber', 'stageNumber', { unique: false });
                }
            };
        });
    }

    // حفظ تقدم اللاعب
    async saveProgress(stageNumber) {
        const progressData = {
            id: 'currentProgress',
            stageNumber: stageNumber,
            lastUpdated: new Date().toISOString()
        };
        
        if (this.useIndexedDB && this.db) {
            try {
                await this.saveToIndexedDB(progressData);
                // تحديث localStorage كنسخة احتياطية
                this.saveToLocalStorage(progressData);
                return true;
            } catch (error) {
                console.error('Failed to save to IndexedDB:', error);
                // محاولة الحفظ في localStorage
                this.saveToLocalStorage(progressData);
                return false;
            }
        } else {
            // استخدام localStorage فقط
            this.saveToLocalStorage(progressData);
            return true;
        }
    }

    // حفظ في IndexedDB
    saveToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.put(data);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = () => {
                reject(new Error('Failed to save to IndexedDB'));
            };
        });
    }

    // حفظ في localStorage
    saveToLocalStorage(data) {
        try {
            localStorage.setItem('drderMazeProgress', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    // تحميل تقدم اللاعب
    async loadProgress() {
        if (this.useIndexedDB && this.db) {
            try {
                const data = await this.loadFromIndexedDB();
                if (data) {
                    return data.stageNumber || 1;
                }
            } catch (error) {
                console.error('Failed to load from IndexedDB:', error);
            }
        }
        
        // محاولة التحميل من localStorage
        return this.loadFromLocalStorage();
    }

    // تحميل من IndexedDB
    loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get('currentProgress');
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onerror = () => {
                reject(new Error('Failed to load from IndexedDB'));
            };
        });
    }

    // تحميل من localStorage
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('drderMazeProgress');
            if (data) {
                const parsedData = JSON.parse(data);
                return parsedData.stageNumber || 1;
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
        return 1;
    }

    // مسح التقدم (لإعادة اللعبة من البداية)
    async clearProgress() {
        if (this.useIndexedDB && this.db) {
            try {
                await this.clearFromIndexedDB();
            } catch (error) {
                console.error('Failed to clear IndexedDB:', error);
            }
        }
        
        // مسح localStorage
        try {
            localStorage.removeItem('drderMazeProgress');
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    }

    // مسح من IndexedDB
    clearFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete('currentProgress');
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = () => {
                reject(new Error('Failed to clear IndexedDB'));
            };
        });
    }

    // التحقق من صحة بيانات التخزين
    async validateStorage() {
        const stageNumber = await this.loadProgress();
        return stageNumber > 0 && stageNumber <= 1000000;
    }

    // الحصول على إحصائيات التخزين
    async getStorageInfo() {
        return {
            useIndexedDB: this.useIndexedDB,
            dbName: this.dbName,
            dbVersion: this.dbVersion,
            storeName: this.storeName
        };
    }
}

// تصدير الكلاس للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
