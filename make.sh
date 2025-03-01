#!/bin/bash


SOURCE_HTML="./index.html";
SOURCE_CSS="./style/style.css";
SOURCE_AUDIO="./Audio";

TMP_FOLDER="./tmp";

RELEASE_FOLDER="./release";

echo "Begin building app...";

echo "\nStep 0: Prepare build process..."
# Create tmp-directory
if [ ! -d $TMP_FOLDER ]; then
    echo "making tmp-folder..."
    mkdir -v $TMP_FOLDER
fi

if [ ! -d $RELEASE_FOLDER ]; then
    echo "making release-folder ($RELEASE_FOLDER..."
    mkdir $RELEASE_FOLDER
else
    echo "cleaning up release-folder ($RELEASE_FOLDER)..."
    rm $RELEASE_FOLDER/*
fi

# compile
echo "\nStep 1: Copying html & css..." &&
cp -v $SOURCE_HTML $RELEASE_FOLDER &&
cp -v $SOURCE_CSS $RELEASE_FOLDER &&
cp -v $SOURCE_AUDIO/*.ogg $RELEASE_FOLDER &&

echo "\nStep 2: Compiling TS (according to tsconfig)..." &&
npx tsc &&
echo "done..." &&

echo "\nStep 3: Bundling up modules..." &&
npx browserify -o $TMP_FOLDER/app.js $TMP_FOLDER/index.js &&
echo "done..." &&

echo "\nStep 4: Minify..." &&
npx terser --mangle --compress --output $TMP_FOLDER/app.min.js $TMP_FOLDER/app.js &&
echo "done..." &&

echo "\nStep 5: Copying code..."
cp -v $TMP_FOLDER/app.min.js $RELEASE_FOLDER &&
echo "Done building app\n"

echo "Cleaning up..." &&
rm -r $TMP_FOLDER &&
echo "Success"