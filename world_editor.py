import os
import csv
import re
import copy
from pathsToWorlds import convertLinesToWorldLines, outputCSV
from flask import Flask, render_template, abort, request

app = Flask(__name__)
app.config['ENV'] = "development"
pathRoot = os.path.join(os.getcwd(), 'client', 'public', 'assets', 'worlds')


@app.route("/<path>")
def index(path):
    # print path
    if (not path) or (path == "favicon.ico"):
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
    # print repr(request.data[:-1])
    for r in request.data[:-1].split(",,"):
        # print r.split(','), len(r.split(','))
        lines.append(r.split(','))

    lines_with_comma = copy.deepcopy(lines)
    for l in lines_with_comma:
        l.append("")
    outputCSV(lines_with_comma, path)

    lines = convertLinesToWorldLines(lines)
    outputCSV(lines, re.sub('path', 'world', path))
    return ('', 204)


if __name__ == '__main__':
    app.run(debug=True)
