import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)


@app.route('/')
def index(name=None):
    return render_template('index.html', name=name)


@app.route('/fusiontable')
def fusiontable(name=None):
    return render_template('fusion_tables.html', name=name)


@app.route('/<path:filename>')
def static(filename):
    return send_from_directory('./static/', filename)



if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 8080.
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
