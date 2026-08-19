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

    // تحديد حجم المتاهة
    getMazeSize(stageNumber) {
        let size;
        
        if (stageNumber <= 5) {
            size = 15;
        } else if (stageNumber <= 15) {
            size = 21;
        } else if (stageNumber <= 30) {
            size = 27;
        } else if (stageNumber <= 60) {
            size = 33;
        } else if (stageNumber <= 100) {
            size = 39;
        } else {
            size = 45;
        }
        
        if (size % 2 === 0) {
            size += 1;
        }
        
        return size;
    }

    // توليد المتاهة
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

        const startX = 1;
        const startY = 1;
        this.maze[startY][startX] = 0; // 0 = ممر
        
        // استخدام خوارزمية Recursive Backtracking
        this.carvePassages(startX, startY, random);
        
        // إزالة بعض الجدران لإنشاء طرق بديلة (5% فقط)
        this.removeSomeWalls(random);
        
        // إضافة تفرعات محدودة
        this.addBranches(random);
        
        this.playerPosition = { x: 1, y: 1 };
        this.targetPosition = this.findTarget(random);
        
        return {
            maze: this.maze,
            width: this.width,
            height: this.height,
            playerPosition: this.playerPosition,
            targetPosition: this.targetPosition,
            seed: this.seed
        };
    }

    // خوارزمية Recursive Backtracking
    carvePassages(x, y, random) {
        const directions = [
            { dx: 0, dy: -2 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 },
            { dx: 2, dy: 0 }
        ];
        
        this.shuffleArray(directions, random);
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (this.isValidCell(newX, newY) && this.maze[newY][newX] === 1) {
                this.maze[newY][newX] = 0;
                this.maze[y + dir.dy / 2][x + dir.dx / 2] = 0;
                this.carvePassages(newX, newY, random);
            }
        }
    }

    // إزالة بعض الجدران (5% فقط)
    removeSomeWalls(random) {
        const totalCells = this.width * this.height;
        const wallsToRemove = Math.floor(totalCells * 0.05);
        
        for (let i = 0; i < wallsToRemove; i++) {
            const x = Math.floor(random() * (this.width - 2)) + 1;
            const y = Math.floor(random() * (this.height - 2)) + 1;
            
            if (this.maze[y][x] === 1) {
                const neighbors = this.getNeighbors(x, y);
                let pathCount = 0;
                
                for (const neighbor of neighbors) {
                    if (this.maze[neighbor.y][neighbor.x] === 0) {
                        pathCount++;
                    }
                }
                
                // إزالة الجدار فقط إذا كان محاطاً بممرين بالضبط
                if (pathCount === 2) {
                    this.maze[y][x] = 0;
                }
            }
        }
    }

    // إضافة تفرعات محدودة
    addBranches(random) {
        const branches = Math.floor(this.width * 0.5);
        
        for (let i = 0; i < branches; i++) {
            let attempts = 0;
            while (attempts < 50) {
                const x = Math.floor(random() * (this.width - 4)) + 2;
                const y = Math.floor(random() * (this.height - 4)) + 2;
                
                if (this.maze[y][x] === 0) {
                    this.openBranch(x, y, random);
                    break;
                }
                attempts++;
            }
        }
    }

    // فتح تفرع
    openBranch(x, y, random) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        
        const dir = directions[Math.floor(random() * directions.length)];
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (this.isValidCell(newX, newY) && this.maze[newY][newX] === 1) {
            const neighbors = this.getNeighbors(newX, newY);
            let pathCount = 0;
            
            for (const neighbor of neighbors) {
                if (this.maze[neighbor.y][neighbor.x] === 0) {
                    pathCount++;
                }
            }
            
            // فتح الجدار فقط إذا كان محاطاً بممر واحد
            if (pathCount === 1) {
                this.maze[newY][newX] = 0;
            }
        }
    }

    // إيجاد الهدف في أبعد نقطة
    findTarget(random) {
        const distances = this.calculateDistances(this.playerPosition);
        let maxDistance = -1;
        let candidates = [];
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && distances[y][x] > maxDistance) {
                    maxDistance = distances[y][x];
                    candidates = [{ x: x, y: y }];
                } else if (this.maze[y][x] === 0 && distances[y][x] === maxDistance) {
                    candidates.push({ x: x, y: y });
                }
            }
        }
        
        if (candidates.length > 0) {
            return candidates[Math.floor(random() * candidates.length)];
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
