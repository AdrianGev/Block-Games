# Block Games 

A bunch of games built with Python, Flask, and Pygame.

## Games
1. Block Tiles - A match-3 puzzle game
2. Block Boom - Destroy blocks and hopefully don't get sued in the process

## Project Structure
```
cubeexplosion/
├── app.py              # Main Flask application
├── games/             # Individual game modules
│   └── block_tiles/   # Block Tiles game
├── static/            # Static assets
│   ├── styles.css     # Main styles
│   └── block_tiles/   # Block Tiles game assets
└── templates/         # HTML templates
    ├── index.html     # Main menu
    └── block_tiles/   # Block Tiles templates
```

## Requirements
- Python 3.6 or higher
- Flask 3.0.0
- Pygame 2.5.2

## Installation
1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Running the Games
1. Start the server:
```bash
python app.py
```

2. Open ya browser and go to:
```
http://localhost:5001
```

3. Select a game from the menu

