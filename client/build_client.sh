#!/usr/bin/env bash

npm i
npm run build
cd build
git checkout gh-pages
git pull
git add *
git commit -m "updated build"
git push
cd ../
git add build
git commit -m "updated build"
git push