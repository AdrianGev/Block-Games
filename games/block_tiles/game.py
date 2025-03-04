import pygame
import random
from flask import Blueprint, render_template

block_tiles = Blueprint('block_tiles', __name__, url_prefix='/block-tiles')

@block_tiles.route('/game')
def game():
    return render_template('block_tiles/game.html')
