// ===== DrDer-Maze - Maze Generator (Maximum Difficulty Version) =====

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

    // تحديد حجم المتاهة - أحجام كبيرة للصعوبة القصوى
    getMazeSize(stageNumber) {
        let size;
        
        if (stageNumber <= 3) {
            size = 15;
        } else if (stageNumber <= 10) {
            size = 21;
        } else if (stageNumber <= 25) {
            size = 27;
        } else if (stageNumber <= 50) {
            size = 33;
        } else if (stageNumber <= 100) {
            size = 39;
        } else if (stageNumber <= 200) {
            size = 45;
        } else {
            size = 51;
        }
        
        if (size % 2 === 0) {
            size += 1;
        }
        
        return size;
    }

    // توليد المتاهة بخوارزمية معقدة
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
                this.maze[y][x] = 1;
            }
        }

        const startX = 1;
        const startY = 1;
        this.maze[startY][startX] = 0;
        
        // استخدام خوارزمية معقدة
        this.carveComplexPassages(startX, startY, random);
        
        // إزالة جدران كثيرة لإنشاء متاهة معقدة
        this.removeManyWalls(random);
        
        // إضافة تفرعات كثيرة
        this.addComplexBranches(random);
        
        // إنشاء حلقات ومسارات دائرية
        this.createLoops(random);
        
        this.playerPosition = { x: 1, y: 1 };
        this.targetPosition = this.findHardestTarget(random);
        
        return {
            maze: this.maze,
            width: this.width,
            height: this.height,
            playerPosition: this.playerPosition,
            targetPosition: this.targetPosition,
            seed: this.seed
        };
    }

    // خوارزمية حفر معقدة مع تراجع محدود
    carveComplexPassages(x, y, random) {
        const directions = [
            { dx: 0, dy: -2 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 },
            { dx: 2, dy: 0 }
        ];
        
        this.shuffleArray(directions, random);
        
        // تحديد عدد الاتجاهات للحفر (ليس كلها)
        const directionsToCarve = 2 + Math.floor(random() * 3); // 2-4 اتجاهات
        
        for (let i = 0; i < directions.length && i < directionsToCarve; i++) {
            const dir = directions[i];
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (this.isValidCell(newX, newY) && this.maze[newY][newX] === 1) {
                this.maze[newY][newX] = 0;
                this.maze[y + dir.dy / 2][x + dir.dx / 2] = 0;
                this.carveComplexPassages(newX, newY, random);
            }
        }
    }

    // إزالة جدران كثيرة لإنشاء طرق متعددة
    removeManyWalls(random) {
        const wallsToRemove = Math.floor(this.width * this.height * 0.35);
        
        for (let i = 0; i < wallsToRemove; i++) {
            const x = Math.floor(random() * (this.width - 2)) + 1;
            const y = Math.floor(random() * (this.height - 2)) + 1;
            
            if (this.maze[y][x] === 1) {
                // التحقق من أن إزالة الجدار ستخلق اتصالاً
                const neighbors = this.getNeighbors(x, y);
                let pathCount = 0;
                for (const neighbor of neighbors) {
                    if (this.maze[neighbor.y][neighbor.x] === 0) {
                        pathCount++;
                    }
                }
                
                if (pathCount >= 2) {
                    this.maze[y][x] = 0;
                }
            }
        }
    }

    // إضافة تفرعات معقدة
    addComplexBranches(random) {
        const branches = Math.floor(this.width * 2);
        
        for (let i = 0; i < branches; i++) {
            let attempts = 0;
            while (attempts < 100) {
                const x = Math.floor(random() * (this.width - 4)) + 2;
                const y = Math.floor(random() * (this.height - 4)) + 2;
                
                if (this.maze[y][x] === 0) {
                    this.openBranchingPassage(x, y, random);
                    break;
                }
                attempts++;
            }
        }
    }

    // فتح تفرعات متعددة
    openBranchingPassage(x, y, random) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        
        const numDirections = 1 + Math.floor(random() * 3);
        this.shuffleArray(directions, random);
        
        for (let i = 0; i < numDirections; i++) {
            const dir = directions[i];
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (this.isValidCell(newX, newY) && this.maze[newY][newX] === 1) {
                this.maze[newY][newX] = 0;
            }
        }
    }

    // إنشاء حلقات ومسارات دائرية
    createLoops(random) {
        const loops = Math.floor(this.width / 2);
        
        for (let i = 0; i < loops; i++) {
            const x = Math.floor(random() * (this.width - 4)) + 2;
            const y = Math.floor(random() * (this.height - 4)) + 2;
            
            if (this.maze[y][x] === 1) {
                // فتح حلقة صغيرة
                this.maze[y][x] = 0;
                if (this.isValidCell(x + 1, y)) this.maze[y][x + 1] = 0;
                if (this.isValidCell(x, y + 1)) this.maze[y + 1][x] = 0;
                if (this.isValidCell(x + 1, y + 1)) this.maze[y + 1][x + 1] = 0;
            }
        }
    }

    // إيجاد أصعب هدف ممكن
    findHardestTarget(random) {
        const distances = this.calculateDistances(this.playerPosition);
        let maxDistance = -1;
        let candidates = [];
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && distances[y][x] > maxDistance) {
                    maxDistance = distances[y][x];
                    candidates = [{ x: x, y: y, distance: distances[y][x] }];
                } else if (this.maze[y][x] === 0 && distances[y][x] === maxDistance) {
                    candidates.push({ x: x, y: y, distance: distances[y][x] });
                }
            }
        }
        
        if (candidates.length > 0) {
            // اختيار أبعد نقطة عن البداية
            const selected = candidates[Math.floor(random() * candidates.length)];
            return { x: selected.x, y: selected.y };
        }
        
        return { x: this.width - 2, y: this.height - 2 };
    }

    // حساب المسافات
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

    // الحصول على الجيران
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

    // الحصول على معلومات المتاهة
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeGenerator;
}
