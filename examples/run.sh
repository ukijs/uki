set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR/..
cp dist/uki.esm.js examples/$1/uki.esm.js
cd examples/$1
serve
