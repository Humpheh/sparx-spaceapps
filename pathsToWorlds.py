import os
import csv
import re

pathRoot = os.path.join(os.getcwd(), 'client', 'public', 'assets', 'worlds')


def listFiles(dir):
    return [f for f in os.listdir(dir) if os.path.isfile(os.path.join(dir, f))]

def listPathFiles(dir):
    return [f for f in listCSVs(dir) if f.startswith("path")]

def listWorldFiles(dir):
    return [f for f in listCSVs(dir) if f.startswith("world")]

def listCSVs(dir):
    return [f for f in listFiles(dir) if f.split(".")[1] == "csv"]

def outputCSV(csv_data, name):
    with open(os.path.join(pathRoot, name), 'wb') as csvfile:
        writer = csv.writer(csvfile, delimiter=",")
        for line in csv_data:
            print line
            writer.writerow(line)

def loadCSV(name):
    lines = []
    with open(os.path.join(pathRoot, p), 'rb') as csvfile:
        reader = csv.reader(csvfile, delimiter=",")
        for row in reader:
            # print row
            lines.append(row[:-1])
    return lines

def convertLinesToWorldLines(lines):
    world_lines = lines

    # Horizontal pass
    for ii, line in enumerate(lines):
        first = True
        middle = False
        last = False

        for jj, tile in enumerate(line):
            if jj == len(line) - 1:
                last = True
            if tile == 'true':
                if last:
                    world_lines[ii][jj] = 'last'
                    last = False
                    first = True
                    continue
                elif middle:
                    world_lines[ii][jj] = 'middle'
                    continue
                elif first:
                    world_lines[ii][jj] = 'left'
                    first = False
                    middle = True
                    continue
                else:
                    print line
                    print ii, jj
                    raise Exception('unknown tile type')
            else:
                try:
                    if world_lines[ii][jj-1] in ['middle', 'first']:
                        world_lines[ii][jj] = 'last'
                        middle = False
                        first = True
                except:
                    pass
        # print world_lines[ii]

    # Vertical pass
    for ii, line in enumerate(world_lines):
        for jj, tile in enumerate(line):
            if tile.strip() == '':
                continue

            if ii == 0:
                world_lines[ii][jj] += 'upper'
                continue

            try:
                if world_lines[ii-1][jj].strip() == '':
                    # Above tile has ice
                    world_lines[ii][jj] += 'upper'
                    continue
            except Exception as e:
                print ii, jj, e
                world_lines[ii][jj] += 'upper'

            try:
                if world_lines[ii+1][jj].strip() == '':
                    # Below tile has ice
                    world_lines[ii][jj] += 'lower'
                    continue
            except:
                world_lines[ii][jj] += 'lower'

            try:
                if world_lines[ii-1][jj].strip() != '' and world_lines[ii+1][jj].strip() != '':
                    # Above and below tiles have ice
                    world_lines[ii][jj] += 'middle'
                    continue
            except:
                pass

        # print world_lines[ii]

    # Corner pass
    for ii, line in enumerate(world_lines):
        for jj, tile in enumerate(line):
            if world_lines[ii][jj] != "middlemiddle":
                continue

            # At least one of these is true (pretty sure...)
            if world_lines[ii-1][jj-1].strip() == '':
                world_lines[ii][jj] += 'UL'
            elif world_lines[ii-1][jj+1].strip() == '':
                world_lines[ii][jj] += 'UR'
            elif world_lines[ii+1][jj-1].strip() == '':
                world_lines[ii][jj] += 'LL'
            elif world_lines[ii+1][jj+1].strip() == '':
                world_lines[ii][jj] += 'LR'

    for ii, line in enumerate(world_lines):
        for jj, tile in enumerate(line):
            world_lines[ii][jj] = convertCodes[world_lines[ii][jj]]

    return world_lines

convertCodes = {
    "leftupper": "ice_u1",
    "leftmiddle": "ice_m1",
    "leftlower": "ice_l1",
    "middleupper": "ice_u2",
    "middlemiddle": "ice_m2",
    "middlelower": "ice_l2",
    "lastupper": "ice_u3",
    "lastmiddle": "ice_m3",
    "lastlower": "ice_l3",
    "middlemiddleUL": "ice_c_tl",
    "middlemiddleUR": "ice_c_tr",
    "middlemiddleLL": "ice_c_bl",
    "middlemiddleLR": "ice_c_br",
    "    ": "      "
}

def pathToWorld(p):
    lines = loadCSV(p)

    lines = convertLinesToWorldLines(lines)
    outputCSV(lines, re.sub('path', 'world', p))


def worldToPath(w):
    lines = loadCSV(w)

    path_lines = lines
    for ii, line in enumerate(lines):
        for jj, tile in enumerate(line):
            if tile != "      ":
                path_lines[ii][jj] = "true"
            else:
                path_lines[ii][jj] = "    "

    outputCSV(path_lines, re.sub('world', 'path', w))

if __name__ == "__main__":
    # files = listPathFiles(pathRoot)
    files = listWorldFiles(pathRoot)
    for p in files:
        # pathToWorld(p)
        worldToPath(p)
