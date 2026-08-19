// ===== DrDer-Maze - Maze Generator =====

class MazeGenerator {
    constructor() {
        this.maze = [];
        this.width = 0;
        this.height = 0;
        this.playerPosition = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };
        this.seed = 0;
    }

    // دالة لتوليد رقم عشوائي قابل لإعادة الإنتاج من seed
    seededRandom(seed) {
        return function() {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        };
    }

    // تحديد حجم المتاهة بناءً على رقم المرحلة
    getMazeSize(stageNumber) {
        let size;
        
        if (stageNumber <= 10) {
            // المراحل الأولى: متاهات صغيرة
            size = 7;
        } else if (stageNumber <= 30) {
            // مراحل متوسطة: متاهات أكبر قليلاً
            size = 9;
        } else if (stageNumber <= 60) {
            // مراحل متقدمة
            size = 11;
        } else if (stageNumber <= 100) {
            // مراحل صعبة
            size = 13;
        } else if (stageNumber <= 200) {
            // مراحل أكثر صعوبة
            size = 15;
        } else if (stageNumber <= 500) {
            // مراحل متقدمة جداً
            size = 17;
        } else if (stageNumber <= 1000) {
            // مراحل الخبراء
            size = 19;
        } else {
            // مراحل الأساطير
            size = 21;
        }
        
        // التأكد من أن الحجم فردي (مطلوب للمتاهة)
        if (size % 2 === 0) {
            size += 1;
        }
        
        return size;
    }

    // توليد المتاهة باستخدام خوارزمية Recursive Backtracking
    generateMaze(stageNumber) {
        const size = this.getMazeSize(stageNumber);
        this.width = size;
        this.height = size;
        this.seed = stageNumber * 1000 + 12345;
        
        const random = this.seededRandom(this.seed);
        
        // تهيئة المتاهة بالجدران
        this.maze = [];
        for (let y = 0; y < this.height; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.maze[y][x] = 1; // 1 = جدار
            }
        }

        // بدء من الخلية العلوية اليسرى
        const startX = 1;
        const startY = 1;
        this.maze[startY][startX] = 0; // 0 = ممر
        
        // استخدام خوارزمية Recursive Backtracking
        this.carvePassages(startX, startY, random);
        
        // إضافة بعض التفرعات الإضافية للصعوبة
        this.addExtraBranches(random);
        
        // تحديد مواقع اللاعب والهدف
        this.playerPosition = { x: 1, y: 1 };
        this.targetPosition = this.findTargetPosition(random);
        
        return {
            maze: this.maze,
            width: this.width,
            height: this.height,
            playerPosition: this.playerPosition,
            targetPosition: this.targetPosition,
            seed: this.seed
        };
    }

    // خوارزمية Recursive Backtracking لحفر الممرات
    carvePassages(x, y, random) {
        const directions = [
            { dx: 0, dy: -2 }, // أعلى
            { dx: 0, dy: 2 },  // أسفل
            { dx: -2, dy: 0 }, // يسار
            { dx: 2, dy: 0 }   // يمين
        ];
        
        // خلط الاتجاهات
        this.shuffleArray(directions, random);
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (this.isValidCell(newX, newY) && this.maze[newY][newX] === 1) {
                // حفر الممر
                this.maze[newY][newX] = 0;
                // حفر الخلية بين الموقعين
                this.maze[y + dir.dy / 2][x + dir.dx / 2] = 0;
                // الاستمرار بشكل تكراري
                this.carvePassages(newX, newY, random);
            }
        }
    }

    // إضافة تفرعات إضافية لجعل المتاهة أكثر صعوبة
    addExtraBranches(random) {
        const extraBranches = Math.floor(this.width / 3);
        
        for (let i = 0; i < extraBranches; i++) {
            // اختيار خلية عشوائية موجودة
            let attempts = 0;
            while (attempts < 50) {
                const x = Math.floor(random() * (this.width - 2)) + 1;
                const y = Math.floor(random() * (this.height - 2)) + 1;
                
                if (this.maze[y][x] === 0) {
                    // فتح ممر إضافي
                    this.openExtraPassage(x, y, random);
                    break;
                }
                attempts++;
            }
        }
    }

    // فتح ممر إضافي لزيادة التعقيد
    openExtraPassage(x, y, random) {
        const directions = [
            { dx: 0, dy: -2 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 },
            { dx: 2, dy: 0 }
        ];
        
        const dir = directions[Math.floor(random() * directions.length)];
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (this.isValidCell(newX, newY) && this.maze[newY][newX] === 0) {
            // فتح الخلية بينهما
            this.maze[y + dir.dy / 2][x + dir.dx / 2] = 0;
        }
    }

    // إيجاد موقع الهدف (أبعد نقطة عن البداية)
    findTargetPosition(random) {
        let maxDistance = -1;
        let bestPosition = { x: this.width - 2, y: this.height - 2 };
        
        // البحث عن أبعد نقطة باستخدام BFS
        const distances = this.calculateDistances(this.playerPosition);
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && distances[y][x] > maxDistance) {
                    maxDistance = distances[y][x];
                    bestPosition = { x: x, y: y };
                }
            }
        }
        
        // إذا كانت المسافة قصيرة جداً، اختر نقطة أبعد
        if (maxDistance < this.width) {
            const farPositions = [
                { x: this.width - 2, y: this.height - 2 },
                { x: 1, y: this.height - 2 },
                { x: this.width - 2, y: 1 }
            ];
            
            for (const pos of farPositions) {
                if (this.maze[pos.y][pos.x] === 0) {
                    const dist = distances[pos.y][pos.x];
                    if (dist > maxDistance) {
                        maxDistance = dist;
                        bestPosition = pos;
                    }
                }
            }
        }
        
        return bestPosition;
    }

    // حساب المسافات من نقطة البداية
    calculateDistances(startPos) {
        const distances = [];
        for (let y = 0; y < this.height; y++) {
            distances[y] = [];
            for (let x = 0; x < this.width; x++) {
                distances[y][x] = -1;
            }
        }
        
        distances[startPos.y][startPos.x] = 0;
        const queue = [startPos];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const currentDist = distances[current.y][current.x];
            
            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                if (this.maze[neighbor.y][neighbor.x] === 0 && 
                    distances[neighbor.y][neighbor.x] === -1) {
                    distances[neighbor.y][neighbor.x] = currentDist + 1;
                    queue.push(neighbor);
                }
            }
        }
        
        return distances;
    }

    // الحصول على الجيران المتاحين
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (this.isValidCell(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }

    // التحقق من صحة الخلية
    isValidCell(x, y) {
        return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1;
    }

    // خلط مصفوفة
    shuffleArray(array, random) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // التحقق من إمكانية التحرك
    canMove(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.maze[y][x] === 0;
    }

    // التحقق من الوصول للهدف
    isTarget(x, y) {
        return x === this.targetPosition.x && y === this.targetPosition.y;
    }

    // الحصول على معلومات المتاهة الحالية
    getMazeInfo() {
        return {
            width: this.width,
            height: this.height,
            playerPosition: this.playerPosition,
            targetPosition: this.targetPosition,
            seed: this.seed
        };
    }
}

// تصدير الكلاس للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeGenerator;
}
