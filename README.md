# ES6 Phaser + Mocha tests

ES6 Boilerplate with Phaser, Mocha &amp; Babel

*To set up*

```
npm install
npm run build-init // racks up phaser in dist dirs
```

*To run build*

```
npm run build
```

*To run tests*

`npm run test`

This will:

 - run mocha tests in spec
 - build es6 -> common using babel

###Potential Errors

- For some reason, `npm install` doesn't work in node version 7. I rolled back to node v6.9

- If you see:

```
Package cairo was not found in the pkg-config search path.
Perhaps you should add the directory containing `cairo.pc'
to the PKG_CONFIG_PATH environment variable
No package 'cairo' found
```

Try 

```
xcode-select --install
brew install cairo
pkg-config --atleast-version=1.12.2 cairo
echo $?
```

http://stackoverflow.com/questions/22100213/package-cairo-was-not-found-in-the-pkg-config-search-path-node-j-s-install-canv
https://github.com/Automattic/node-canvas/issues/722