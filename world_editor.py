import os
import csv
import re
from pathsToWorlds import convertLinesToWorldLines, outputCSV
from flask import Flask, render_template, abort, request

app = Flask(__name__)
app.config['ENV'] = "development"
pathRoot = os.path.join(os.getcwd(), 'client', 'public', 'assets', 'worlds')


@app.route("/<path>")
def index(path):
    if not path:
        abort(404)

    lines = []
    with open(os.path.join(pathRoot, path), 'rb') as csvfile:
        reader = csv.reader(csvfile, delimiter=",")
        for row in reader:
            lines.append(row)

    return render_template("index.html", data_from_flask=lines)


@app.route("/save/<path>", methods=["POST"])
def save(path):
    if not path:
        abort(404)

    lines = []
    print request.data[:-1]
    for r in request.data[:-1].split(",,"):
        # print r.split(','), len(r.split(','))
        lines.append(r.split(','))

    lines_with_comma_ending = lines
    for lc in lines_with_comma_ending:
        lc.append('')
        lines_with_comma_ending.append(lc)

    outputCSV(lines_with_comma_ending, path)

    lines = convertLinesToWorldLines(lines)
    print lines
    outputCSV(lines, re.sub('path', 'world', path))
    return ('', 204)


if __name__ == '__main__':
    app.run(debug=True)
