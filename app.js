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
        this.currentStage = await this.storageManager.loadProgress();
        this.setupEventListeners();
        this.showStartScreen();
        this.setupPWAInstall();
        console.log('DrDer-Maze initialized successfully');
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        this.nextStageButton.addEventListener('click', () => {
            this.nextStage();
        });
        
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardInput(event);
        });
        
        this.mazeContainer.addEventListener('touchstart', (event) => {
            this.handleTouchStart(event);
        }, { passive: false });
        
        this.mazeContainer.addEventListener('touchmove', (event) => {
            this.handleTouchMove(event);
        }, { passive: false });
        
        this.mazeContainer.addEventListener('touchend', (event) => {
            this.handleTouchEnd(event);
        }, { passive: false });
        
        document.addEventListener('touchmove', (event) => {
            if (this.isGameActive) {
                event.preventDefault();
            }
        }, { passive: false });
        
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
        this.stageNumberElement.textContent = `المرحلة ${stageNumber}`;
        this.currentMaze = this.mazeGenerator.generateMaze(stageNumber);
        
        this.playerPosition = { 
            x: this.currentMaze.playerPosition.x, 
            y: this.currentMaze.playerPosition.y 
        };
        this.targetPosition = { 
            x: this.currentMaze.targetPosition.x, 
            y: this.currentMaze.targetPosition.y 
        };
        
        this.renderMaze();
        this.winMessage.classList.add('hidden');
        this.storageManager.saveProgress(stageNumber);
    }

    // رسم المتاهة
    renderMaze() {
        const maze = this.currentMaze.maze;
        const width = this.currentMaze.width;
        const height = this.currentMaze.height;
        
        const containerWidth = this.mazeContainer.clientWidth;
        const containerHeight = this.mazeContainer.clientHeight;
        const maxMazeWidth = Math.min(containerWidth, containerHeight) - 20;
        const cellSize = Math.floor(maxMazeWidth / width);
        
        const mazeGrid = document.createElement('div');
        mazeGrid.className = 'maze-grid';
        mazeGrid.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
        mazeGrid.style.gridTemplateRows = `repeat(${height}, ${cellSize}px)`;
        
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
        
        this.mazeContainer.innerHTML = '';
        this.mazeContainer.appendChild(mazeGrid);
        
        this.updatePlayerPosition();
        this.updateTargetPosition();
    }

    // تحديث موقع اللاعب
    updatePlayerPosition() {
        const oldPlayer = this.mazeContainer.querySelector('.maze-player');
        if (oldPlayer) {
            oldPlayer.classList.remove('maze-player');
        }
        
        const playerCell = this.getCellElement(this.playerPosition.x, this.playerPosition.y);
        if (playerCell) {
            playerCell.classList.add('maze-player');
        }
    }

    // تحديث موقع الهدف
    updateTargetPosition() {
        const oldTarget = this.mazeContainer.querySelector('.maze-target');
        if (oldTarget) {
            oldTarget.classList.remove('maze-target');
        }
        
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
        
        if (this.mazeGenerator.canMove(newX, newY)) {
            this.playerPosition.x = newX;
            this.playerPosition.y = newY;
            this.updatePlayerPosition();
            
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

    // معالجة إدخال لوحة المفاتيح - الاتجاهات الأفقية معكوسة
    handleKeyboardInput(event) {
        if (!this.isGameActive) {
            return;
        }
        
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.movePlayer(0, -1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.movePlayer(0, 1);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.movePlayer(1, 0); // معكوس
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.movePlayer(-1, 0); // معكوس
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

    // معالجة نهاية اللمس - الاتجاهات الأفقية معكوسة
    handleTouchEnd(event) {
        if (!this.isGameActive) {
            return;
        }
        
        event.preventDefault();
        
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        if (Math.abs(deltaX) < this.touchThreshold && Math.abs(deltaY) < this.touchThreshold) {
            return;
        }
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // حركة أفقية - معكوسة
            if (deltaX > 0) {
                this.movePlayer(-1, 0); // سحب يمين = تحرك يسار
            } else {
                this.movePlayer(1, 0); // سحب يسار = تحرك يمين
            }
        } else {
            // حركة رأسية
            if (deltaY > 0) {
                this.movePlayer(0, 1); // أسفل
            } else {
                this.movePlayer(0, -1); // أعلى
            }
        }
    }

    // إعداد دعم PWA
    setupPWAInstall() {
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.deferredPrompt = event;
            
            if (!this.isInstalled) {
                this.showInstallPrompt();
            }
        });
        
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallPrompt();
        });
    }

    // التحقق من التثبيت
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
                    this.isInstalled = true;
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

// تهيئة التطبيق
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
