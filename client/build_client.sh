#!/usr/bin/env bash

set -e

mv build/.git .gittmp
npm i
npm run build
cd build
mv ../.gittmp .git
git checkout gh-pages
git pull
git add *
git commit -m "updated build"
git push
cd ../
git add build
git commit -m "updated build"
git push