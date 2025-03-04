const GRID_SIZE = 10;
const BLOCK_SIZE = 50;
const COLORS = [
    '#FF6B6B', // red
    '#4ECDC4', // cyan
    '#45B7D1', // blue
    '#96CEB4', // green
    '#FFD93D', // yellow
    '#FF9F1C', // orange
    '#6C5B7B', // purple
    '#C06C84', // pink (team 172 reference???)
];

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.selectedBlock = null;
        this.score = 0;
        
        // grid size and block size
        this.canvas.width = GRID_SIZE * BLOCK_SIZE;
        this.canvas.height = GRID_SIZE * BLOCK_SIZE;
        
        // init board
        this.board = Array(GRID_SIZE).fill().map(() => 
            Array(GRID_SIZE).fill().map(() => ({
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                selected: false,
                matched: false,
                falling: false,
                yOffset: 0
            }))
        );
        
        // add event listeners
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // start game loop
        this.gameLoop();
    }
    
    drawBlock(x, y, color, selected = false, yOffset = 0) {
        const ctx = this.ctx;
        const blockX = x * BLOCK_SIZE;
        const blockY = y * BLOCK_SIZE + yOffset;
        
        // draw main block
        ctx.fillStyle = color;
        ctx.fillRect(blockX + 2, blockY + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
        
        // draw highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(blockX + 2, blockY + 2);
        ctx.lineTo(blockX + BLOCK_SIZE - 4, blockY + 2);
        ctx.lineTo(blockX + BLOCK_SIZE/2, blockY + BLOCK_SIZE/2);
        ctx.closePath();
        ctx.fill();
        
        if (selected) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.strokeRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const block = this.board[row][col];
                this.drawBlock(col, row, block.color, block.selected, block.yOffset);
            }
        }
        
        // draw score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    }
    
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const col = Math.floor(x / BLOCK_SIZE);
        const row = Math.floor(y / BLOCK_SIZE);
        
        if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
        
        if (!this.selectedBlock) {
            this.board[row][col].selected = true;
            this.selectedBlock = {row, col};
        } else {
            const selectedRow = this.selectedBlock.row;
            const selectedCol = this.selectedBlock.col;
            
            // check if blocks are adjacent
            if ((Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
                (Math.abs(col - selectedCol) === 1 && row === selectedRow)) {
                
                // swap blocks
                this.swapBlocks(selectedRow, selectedCol, row, col);
                
                // check for matches
                if (!this.findMatches()) {
                    // if not swap back
                    this.swapBlocks(row, col, selectedRow, selectedCol);
                }
            }
            
            // clear selection
            this.board[selectedRow][selectedCol].selected = false;
            this.selectedBlock = null;
        }
    }
    
    swapBlocks(row1, col1, row2, col2) {
        const temp = {...this.board[row1][col1]};
        this.board[row1][col1] = {...this.board[row2][col2]};
        this.board[row2][col2] = temp;
    }
    
    findMatches() {
        let hasMatches = false;
        
        // check horizontal matches (this could probably be refactored)
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE - 2; col++) {
                if (this.board[row][col].color === this.board[row][col + 1].color &&
                    this.board[row][col].color === this.board[row][col + 2].color) {
                    this.board[row][col].matched = true;
                    this.board[row][col + 1].matched = true;
                    this.board[row][col + 2].matched = true;
                    hasMatches = true;
                }
            }
        }
        
        // check vertical matches
        for (let row = 0; row < GRID_SIZE - 2; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (this.board[row][col].color === this.board[row + 1][col].color &&
                    this.board[row][col].color === this.board[row + 2][col].color) {
                    this.board[row][col].matched = true;
                    this.board[row + 1][col].matched = true;
                    this.board[row + 2][col].matched = true;
                    hasMatches = true;
                }
            }
        }
        
        if (hasMatches) {
            this.removeMatches();
        }
        
        return hasMatches;
    }
    
    removeMatches() {
        // count matches and update score
        let matchCount = 0;
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (this.board[row][col].matched) {
                    matchCount++;
                }
            }
        }
        this.score += matchCount * 10;
        
        // remove matched blocks and create new ones
        for (let col = 0; col < GRID_SIZE; col++) {
            let writeRow = GRID_SIZE - 1;
            for (let row = GRID_SIZE - 1; row >= 0; row--) {
                if (!this.board[row][col].matched) {
                    if (writeRow !== row) {
                        this.board[writeRow][col] = {...this.board[row][col], falling: true};
                    }
                    writeRow--;
                }
            }
            
            // fill empty spaces with new blocks
            for (let row = writeRow; row >= 0; row--) {
                this.board[row][col] = {
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    selected: false,
                    matched: false,
                    falling: true,
                    yOffset: -BLOCK_SIZE * (writeRow - row + 1)
                };
            }
        }
    }
    
    update() {
        let stillFalling = false;
        
        // update falling blocks
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const block = this.board[row][col];
                if (block.falling) {
                    if (block.yOffset < 0) {
                        block.yOffset += 5;
                        stillFalling = true;
                    } else {
                        block.yOffset = 0;
                        block.falling = false;
                    }
                }
            }
        }
        
        // check for new matches after blocks have settled
        if (!stillFalling) {
            this.findMatches();
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// init game WHILE page loads
window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    new Game(canvas);
};
