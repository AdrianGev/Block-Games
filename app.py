from flask import Flask, render_template
from games.block_tiles.game import block_tiles
from games.block_blast.game import block_blast

app = Flask(__name__)
app.register_blueprint(block_tiles)
app.register_blueprint(block_blast)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5001)
