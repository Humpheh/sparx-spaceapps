import os
import csv
import re

pathRoot = os.path.join(os.getcwd(), 'client', 'public', 'assets', 'worlds')


def listPathFiles(dir):
    files = [f for f in os.listdir(dir) if os.path.isfile(os.path.join(dir, f))]
    csvs = [f for f in files if f.split(".")[1] == "csv"]
    path_files = [f for f in csvs if f.startswith("path")]
    return path_files

def outputCSV(csv_data, name):
    with open(os.path.join(pathRoot, name), 'wb') as csvfile:
        writer = csv.writer(csvfile, delimiter=",")
        for line in csv_data:
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
    "    ": "      "
}

path_files = listPathFiles(pathRoot)
# print path_files

for p in path_files:
    lines = loadCSV(p)

    lines = convertLinesToWorldLines(lines)
    outputCSV(lines, re.sub('path', 'world', p))
