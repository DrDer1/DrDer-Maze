// ===== DrDer-Maze - Main Application =====

class DrDerMazeApp {
    constructor() {
        // عناصر DOM
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.startButton = document.getElementById('startButton');
        this.stageNumberElement = document.getElementById('stageNumber');
        this.mazeContainer = document.getElementById('mazeContainer');
        this.winMessage = document.getElementById('winMessage');
        this.nextStageButton = document.getElementById('nextStageButton');
        this.installPrompt = document.getElementById('installPrompt');
        this.installButton = document.getElementById('installButton');
        this.dismissInstall = document.getElementById('dismissInstall');
        
        // حالة اللعبة
        this.currentStage = 1;
        this.mazeGenerator = new MazeGenerator();
        this.storageManager = new StorageManager();
        this.currentMaze = null;
        this.playerPosition = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };
        this.isGameActive = false;
        
        // معالجة التثبيت
        this.deferredPrompt = null;
        this.isInstalled = this.checkIfInstalled();
        
        // معالجة اللمس
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchThreshold = 30;
        
        // تهيئة التطبيق
        this.initialize();
    }

    // تهيئة التطبيق
    async initialize() {
        // تحميل التقدم المحفوظ
        this.currentStage = await this.storageManager.loadProgress();
        
        // إضافة مستمعي الأحداث
        this.setupEventListeners();
        
        // إظهار شاشة البداية
        this.showStartScreen();
        
        // التحقق من دعم PWA والتثبيت
        this.setupPWAInstall();
        
        console.log('DrDer-Maze initialized successfully');
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // زر بدء اللعب
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // زر المرحلة التالية
        this.nextStageButton.addEventListener('click', () => {
            this.nextStage();
        });
        
        // التحكم بلوحة المفاتيح
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardInput(event);
        });
        
        // التحكم باللمس
        this.mazeContainer.addEventListener('touchstart', (event) => {
            this.handleTouchStart(event);
        }, { passive: false });
        
        this.mazeContainer.addEventListener('touchmove', (event) => {
            this.handleTouchMove(event);
        }, { passive: false });
        
        this.mazeContainer.addEventListener('touchend', (event) => {
            this.handleTouchEnd(event);
        }, { passive: false });
        
        // منع التمرير على مستوى الصفحة
        document.addEventListener('touchmove', (event) => {
            if (this.isGameActive) {
                event.preventDefault();
            }
        }, { passive: false });
        
        // أزرار التثبيت
        if (this.installButton) {
            this.installButton.addEventListener('click', () => {
                this.installApp();
            });
        }
        
        if (this.dismissInstall) {
            this.dismissInstall.addEventListener('click', () => {
                this.hideInstallPrompt();
            });
        }
    }

    // عرض شاشة البداية
    showStartScreen() {
        this.startScreen.classList.add('active');
        this.gameScreen.classList.remove('active');
        this.isGameActive = false;
        
        // إظهار رسالة التثبيت إذا لزم الأمر
        if (!this.isInstalled) {
            setTimeout(() => {
                this.showInstallPrompt();
            }, 3000);
        }
    }

    // بدء اللعبة
    startGame() {
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.isGameActive = true;
        
        this.loadStage(this.currentStage);
    }

    // تحميل مرحلة جديدة
    loadStage(stageNumber) {
        // تحديث رقم المرحلة في الواجهة
        this.stageNumberElement.textContent = `المرحلة ${stageNumber}`;
        
        // توليد المتاهة
        this.currentMaze = this.mazeGenerator.generateMaze(stageNumber);
        
        // تعيين مواقع اللاعب والهدف
        this.playerPosition = this.currentMaze.playerPosition;
        this.targetPosition = this.currentMaze.targetPosition;
        
        // رسم المتاهة
        this.renderMaze();
        
        // إخفاء رسالة الفوز
        this.winMessage.classList.add('hidden');
        
        // حفظ التقدم
        this.storageManager.saveProgress(stageNumber);
    }

    // رسم المتاهة في الواجهة
    renderMaze() {
        const maze = this.currentMaze.maze;
        const width = this.currentMaze.width;
        const height = this.currentMaze.height;
        
        // حساب حجم الخلايا
        const containerWidth = this.mazeContainer.clientWidth;
        const containerHeight = this.mazeContainer.clientHeight;
        const maxMazeWidth = Math.min(containerWidth, containerHeight) - 20;
        const cellSize = Math.floor(maxMazeWidth / width);
        
        // إنشاء شبكة المتاهة
        const mazeGrid = document.createElement('div');
        mazeGrid.className = 'maze-grid';
        mazeGrid.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
        mazeGrid.style.gridTemplateRows = `repeat(${height}, ${cellSize}px)`;
        
        // إنشاء خلايا المتاهة
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                if (maze[y][x] === 1) {
                    cell.classList.add('maze-wall');
                } else {
                    cell.classList.add('maze-path');
                }
                
                mazeGrid.appendChild(cell);
            }
        }
        
        // تنظيف الحاوية وإضافة الشبكة الجديدة
        this.mazeContainer.innerHTML = '';
        this.mazeContainer.appendChild(mazeGrid);
        
        // تحديث مواقع اللاعب والهدف
        this.updatePlayerPosition();
        this.updateTargetPosition();
    }

    // تحديث موقع اللاعب
    updatePlayerPosition() {
        // إزالة اللاعب القديم
        const oldPlayer = this.mazeContainer.querySelector('.maze-player');
        if (oldPlayer) {
            oldPlayer.classList.remove('maze-player');
        }
        
        // إضافة اللاعب الجديد
        const playerCell = this.getCellElement(this.playerPosition.x, this.playerPosition.y);
        if (playerCell) {
            playerCell.classList.add('maze-player');
        }
    }

    // تحديث موقع الهدف
    updateTargetPosition() {
        const targetCell = this.getCellElement(this.targetPosition.x, this.targetPosition.y);
        if (targetCell) {
            targetCell.classList.add('maze-target');
        }
    }

    // الحصول على عنصر الخلية
    getCellElement(x, y) {
        return this.mazeContainer.querySelector(`.maze-cell[data-x="${x}"][data-y="${y}"]`);
    }

    // تحريك اللاعب
    movePlayer(dx, dy) {
        if (!this.isGameActive) {
            return;
        }
        
        const newX = this.playerPosition.x + dx;
        const newY = this.playerPosition.y + dy;
        
        // التحقق من إمكانية التحرك
        if (this.mazeGenerator.canMove(newX, newY)) {
            this.playerPosition.x = newX;
            this.playerPosition.y = newY;
            this.updatePlayerPosition();
            
            // التحقق من الوصول للهدف
            if (this.mazeGenerator.isTarget(newX, newY)) {
                this.completeStage();
            }
        }
    }

    // إكمال المرحلة
    completeStage() {
        this.isGameActive = false;
        this.winMessage.classList.remove('hidden');
    }

    // الانتقال إلى المرحلة التالية
    nextStage() {
        this.currentStage++;
        this.isGameActive = true;
        this.loadStage(this.currentStage);
    }

    // معالجة إدخال لوحة المفاتيح
    handleKeyboardInput(event) {
        if (!this.isGameActive) {
            return;
        }
        
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.movePlayer(0, -1); // أعلى
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.movePlayer(0, 1); // أسفل
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.movePlayer(-1, 0); // يسار
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.movePlayer(1, 0); // يمين
                break;
        }
    }

    // معالجة بداية اللمس
    handleTouchStart(event) {
        if (!this.isGameActive) {
            return;
        }
        
        event.preventDefault();
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    // معالجة حركة اللمس
    handleTouchMove(event) {
        if (!this.isGameActive) {
            return;
        }
        
        event.preventDefault();
    }

    // معالجة نهاية اللمس
    handleTouchEnd(event) {
        if (!this.isGameActive) {
            return;
        }
        
        event.preventDefault();
        
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        // التحقق من أن الحركة تجاوزت الحد الأدنى
        if (Math.abs(deltaX) < this.touchThreshold && Math.abs(deltaY) < this.touchThreshold) {
            return;
        }
        
        // تحديد اتجاه الحركة
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // حركة أفقية
            if (deltaX > 0) {
                // السحب من اليسار إلى اليمين = تحرك لليمين
                this.movePlayer(1, 0);
            } else {
                // السحب من اليمين إلى اليسار = تحرك لليسار
                this.movePlayer(-1, 0);
            }
        } else {
            // حركة رأسية
            if (deltaY > 0) {
                // السحب من الأعلى إلى الأسفل = تحرك للأسفل
                this.movePlayer(0, 1);
            } else {
                // السحب من الأسفل إلى الأعلى = تحرك للأعلى
                this.movePlayer(0, -1);
            }
        }
    }

    // إعداد دعم PWA للتثبيت
    setupPWAInstall() {
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredPrompt = event;
            
            if (!this.isInstalled) {
                this.showInstallPrompt();
            }
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('DrDer-Maze installed successfully');
            this.isInstalled = true;
            this.hideInstallPrompt();
        });
    }

    // التحقق مما إذا كان التطبيق مثبتاً
    checkIfInstalled() {
        const displayMode = window.matchMedia('(display-mode: standalone)').matches;
        const standaloneMode = window.navigator.standalone === true;
        
        return displayMode || standaloneMode;
    }

    // عرض رسالة التثبيت
    showInstallPrompt() {
        if (this.deferredPrompt && !this.isInstalled) {
            this.installPrompt.classList.remove('hidden');
        }
    }

    // إخفاء رسالة التثبيت
    hideInstallPrompt() {
        this.installPrompt.classList.add('hidden');
    }

    // تثبيت التطبيق
    async installApp() {
        if (this.deferredPrompt) {
            try {
                this.deferredPrompt.prompt();
                const result = await this.deferredPrompt.userChoice;
                
                if (result.outcome === 'accepted') {
                    console.log('User accepted installation');
                    this.isInstalled = true;
                } else {
                    console.log('User dismissed installation');
                }
                
                this.deferredPrompt = null;
                this.hideInstallPrompt();
            } catch (error) {
                console.error('Failed to install app:', error);
                this.hideInstallPrompt();
            }
        }
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const app = new DrDerMazeApp();
    window.drDerMazeApp = app;
});

// منع أزرار الأسهم من تحريك الصفحة
window.addEventListener('keydown', (event) => {
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (arrowKeys.includes(event.key)) {
        event.preventDefault();
    }
});
