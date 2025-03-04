class BlockBoom {
    constructor() {
        this.GRID_SIZE = 10;
        this.grid = Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(null));
        this.score = 0;
        this.availableBlocks = [];
        this.lastPlacedBlockInfo = null;
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D', '#FF9F1C'];
        this.blockShapes = {
            single: [[1]],
            double: [[1, 1]],
            triple: [[1, 1, 1]],
            square: [[1, 1], [1, 1]],
            lShape: [[1, 0], [1, 0], [1, 1]],
            tShape: [[1, 1, 1], [0, 1, 0]],
            zShape: [[1, 1, 0], [0, 1, 1]]
        };
        this.generateNewBlocks();
    }

    generateBlock() {
        const shapes = Object.keys(this.blockShapes);
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        return {
            shape: this.blockShapes[randomShape],
            color: color,
            width: this.blockShapes[randomShape][0].length,
            height: this.blockShapes[randomShape].length
        };
    }

    generateNewBlocks() {
        this.availableBlocks = [];
        for (let i = 0; i < 3; i++) {
            this.availableBlocks.push(this.generateBlock());
        }
    }

    isValidPlacement(block, row, col) {
        if (row < 0 || col < 0) return false;
        if (row + block.height > this.GRID_SIZE || col + block.width > this.GRID_SIZE) return false;

        for (let i = 0; i < block.height; i++) {
            for (let j = 0; j < block.width; j++) {
                if (block.shape[i][j] && this.grid[row + i][col + j] !== null) {
                    return false;
                }
            }
        }
        return true;
    }

    placeBlock(block, startRow, startCol) {
        if (!this.isValidPlacement(block, startRow, startCol)) return false;

        let blockCells = [];
        for (let i = 0; i < block.height; i++) {
            for (let j = 0; j < block.width; j++) {
                if (block.shape[i][j]) {
                    const row = startRow + i;
                    const col = startCol + j;
                    this.grid[row][col] = block.color;
                    blockCells.push({ row, col });
                }
            }
        }

        this.lastPlacedBlockInfo = {
            cells: blockCells,
            color: block.color
        };

        this.score += block.shape.flat().filter(cell => cell).length;
        return true;
    }

    async checkLines() {
        let linesToClear = [];
        
        // Check rows
        for (let i = 0; i < this.GRID_SIZE; i++) {
            if (this.grid[i].every(cell => cell !== null)) {
                linesToClear.push({ type: 'row', index: i });
            }
        }
        
        // Check columns
        for (let j = 0; j < this.GRID_SIZE; j++) {
            if (this.grid.every(row => row[j] !== null)) {
                linesToClear.push({ type: 'column', index: j });
            }
        }

        return linesToClear.length > 0 ? linesToClear : null;
    }

    determineDirection(type) {
        if (!this.lastPlacedBlockInfo || !this.lastPlacedBlockInfo.cells.length) {
            return type === 'row' ? 'top-down' : 'left-right';
        }

        const cells = this.lastPlacedBlockInfo.cells;
        let sum = 0;
        
        if (type === 'row') {
            sum = cells.reduce((acc, cell) => acc + cell.row, 0) / cells.length;
            if (sum === this.GRID_SIZE / 2) return 'top-down';
            return sum < this.GRID_SIZE / 2 ? 'top-down' : 'bottom-up';
        } else {
            sum = cells.reduce((acc, cell) => acc + cell.col, 0) / cells.length;
            if (sum === this.GRID_SIZE / 2) return 'left-right';
            return sum < this.GRID_SIZE / 2 ? 'left-right' : 'right-left';
        }
    }

    getClearingSequence(line) {
        const direction = this.determineDirection(line.type);
        let sequence = [];

        if (line.type === 'row') {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                sequence.push({ row: line.index, col });
            }
        } else {
            for (let row = 0; row < this.GRID_SIZE; row++) {
                sequence.push({ row, col: line.index });
            }
        }

        if (direction === 'bottom-up' || direction === 'right-left') {
            sequence.reverse();
        }

        return sequence;
    }

    canPlaceAnyBlock() {
        for (const block of this.availableBlocks) {
            for (let i = 0; i < this.GRID_SIZE; i++) {
                for (let j = 0; j < this.GRID_SIZE; j++) {
                    if (this.isValidPlacement(block, i, j)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isGameOver() {
        return !this.canPlaceAnyBlock();
    }

    getState() {
        return {
            grid: this.grid,
            score: this.score,
            availableBlocks: this.availableBlocks,
            gameOver: this.isGameOver()
        };
    }
}

class BlockBoomUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.blocksContainer = document.getElementById('blocks-container');
        this.scoreDisplay = document.getElementById('score');
        this.gameOverScreen = document.getElementById('gameOver');
        this.finalScoreDisplay = document.getElementById('finalScore');
        
        this.game = new BlockBoom();
        this.draggedBlock = null;
        this.draggedElement = null;
        
        this.sounds = {
            place: new Audio('static/block_boom/assets/sounds/place.mp3'),
            clear: new Audio('static/block_boom/assets/sounds/clear.mp3'),
            gameOver: new Audio('static/block_boom/assets/sounds/gameover.mp3')
        };
        
        this.createGrid();
        this.createPreviewBlocks();
        this.setupEventListeners();
    }

    createGrid() {
        this.container.innerHTML = '';
        for (let i = 0; i < this.game.GRID_SIZE; i++) {
            for (let j = 0; j < this.game.GRID_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                this.container.appendChild(cell);
            }
        }
    }

    createPreviewBlocks() {
        this.blocksContainer.innerHTML = '';
        this.game.availableBlocks.forEach((block, index) => {
            const previewBlock = document.createElement('div');
            previewBlock.className = 'preview-block';
            previewBlock.style.gridTemplateColumns = `repeat(${block.width}, 20px)`;
            previewBlock.dataset.blockIndex = index;

            block.shape.forEach((row, i) => {
                row.forEach((cell, j) => {
                    const blockCell = document.createElement('div');
                    blockCell.className = 'block-cell';
                    if (cell) {
                        blockCell.style.backgroundColor = block.color;
                    }
                    previewBlock.appendChild(blockCell);
                });
            });

            this.blocksContainer.appendChild(previewBlock);
            this.setupDragAndDrop(previewBlock, block);
        });
    }

    setupDragAndDrop(element, block) {
        element.draggable = true;
        
        element.addEventListener('dragstart', (e) => {
            this.draggedBlock = block;
            this.draggedElement = element;
            element.classList.add('dragging');
            e.dataTransfer.setData('text/plain', '');
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });
    }

    setupEventListeners() {
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.grid-cell');
            if (!cell || !this.draggedBlock) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            this.clearPreview();

            if (this.game.isValidPlacement(this.draggedBlock, row, col)) {
                this.showPreview(this.draggedBlock, row, col);
            }
        });

        this.container.addEventListener('dragleave', () => {
            this.clearPreview();
        });

        this.container.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (!this.draggedBlock) return;

            const cell = e.target.closest('.grid-cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            this.clearPreview();

            if (this.game.placeBlock(this.draggedBlock, row, col)) {
                this.sounds.place.play();
                
                const blockIndex = parseInt(this.draggedElement.dataset.blockIndex);
                this.game.availableBlocks.splice(blockIndex, 1);
                
                if (this.game.availableBlocks.length === 0) {
                    this.game.generateNewBlocks();
                }
                
                this.createPreviewBlocks();
                this.scoreDisplay.textContent = this.game.score;
                
                const linesToClear = await this.game.checkLines();
                if (linesToClear) {
                    for (const line of linesToClear) {
                        const sequence = this.game.getClearingSequence(line);
                        await this.animateClearLine(sequence);
                    }
                }
                
                this.refreshGridDisplay();

                if (this.game.isGameOver()) {
                    this.showGameOver();
                }
            }
        });
    }

    async animateClearLine(sequence) {
        for (const cell of sequence) {
            const cellElement = this.findCell(cell.row, cell.col);
            if (cellElement) {
                const originalColor = this.game.grid[cell.row][cell.col];
                
                cellElement.style.backgroundColor = '#fff';
                await new Promise(resolve => setTimeout(resolve, 50));
                cellElement.style.backgroundColor = originalColor;
                await new Promise(resolve => setTimeout(resolve, 50));
                
                this.game.grid[cell.row][cell.col] = null;
                cellElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                cellElement.classList.remove('filled');
                
                this.sounds.clear.cloneNode(true).play();
                
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    refreshGridDisplay() {
        for (let i = 0; i < this.game.GRID_SIZE; i++) {
            for (let j = 0; j < this.game.GRID_SIZE; j++) {
                const cell = this.findCell(i, j);
                const color = this.game.grid[i][j];
                if (cell) {
                    cell.style.backgroundColor = color || 'rgba(255, 255, 255, 0.1)';
                    cell.classList.toggle('filled', color !== null);
                }
            }
        }
    }

    showGameOver() {
        this.sounds.gameOver.play();
        this.finalScoreDisplay.textContent = this.game.score;
        this.gameOverScreen.style.display = 'flex';
    }

    showPreview(block, startRow, startCol) {
        for (let i = 0; i < block.height; i++) {
            for (let j = 0; j < block.width; j++) {
                if (block.shape[i][j]) {
                    const row = startRow + i;
                    const col = startCol + j;
                    const cell = this.findCell(row, col);
                    if (cell) {
                        cell.classList.add('preview');
                        cell.style.backgroundColor = block.color;
                    }
                }
            }
        }
    }

    clearPreview() {
        const cells = this.container.querySelectorAll('.grid-cell.preview');
        cells.forEach(cell => {
            cell.classList.remove('preview');
            if (!cell.classList.contains('filled')) {
                cell.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
        });
    }

    findCell(row, col) {
        return this.container.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlockBoomUI('game-grid');
});