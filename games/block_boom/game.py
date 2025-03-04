from flask import Blueprint, render_template

block_blast = Blueprint('block_blast', __name__, url_prefix='/block-blast')

@block_blast.route('/game')
def game():
    return render_template('block_blast/game.html')
