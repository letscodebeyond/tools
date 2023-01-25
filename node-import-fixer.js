/*
==================
== NODE IMPORT FIXER ==
==================
Copyright (c) 2023 Filipe Laborde

Purpose: Node specifications say imports NEED to specify the .js if it's not a standard 
library - a lot of the older code transpiled with babel did not need/do this, so ex.
import './somecode' --> import './somecode.js' | import './somecode/index.js'

Code License: The MIT License (MIT)

Use for any purpose you wish, but this code is provided 'as is', and
you are fully responsible for ANY and ALL consequences that arise from using it.
Run it with '-v -t' flags first.

Thanks to ChatGPT for the renameImports function.
*/
// const fs = require("fs");
// const path = require("path");
// if package.json has "type": "module", comment the above, and uncomment below:
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';

// __dirname not available on ES6 modules, so we use a hack [if needed]
const rootPath = fileURLToPath ? path.dirname(fileURLToPath(import.meta.url)) : __dirname;
// get command line inputs
const args = process.argv.slice(2);
const showVerbose = args.indexOf('-v')>-1;
const showHelp = args.indexOf('-h')>-1;
const showTestMode = args.indexOf('-t')>-1;
// the first non-flag entry we take as baseDir
const searchDir = args.filter( a=>a.indexOf('-')===-1 && a.length>1 )[0] || ''

let totalFileCnt = 0;
let totalFixCnt = 0;
let errorCnt = 0;
let errorList = []

const extension = ".js"; // the file extension to look for

function renameImports(dir) {
   fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      totalFileCnt++;
      if (fs.statSync(filePath).isDirectory()) {
         renameImports(filePath);
      } else if (path.extname(filePath) === extension) {
         let fileContent = fs.readFileSync(filePath, "utf8");
         // use a regular expression to match import statements that have a relative path and does not end with .js
         let fixCnt = 0; 
         let importList = [];
         fileContent = fileContent.replace(/import [^'"]+ from ['"]([^'"]+)['"];/gi, (match, origImport) => {
            let fixedImport = origImport;
            
            // relative imports OR modules with /
            if( origImport.substr(0,1)==='.' || origImport.indexOf('/')>-1 ){
               const isNodeImport = origImport.substr(0,1)!=='.'
               importList.push( path.basename(origImport) );
               let importPath = path.join(isNodeImport ? rootPath + '/node_modules' : path.dirname(filePath), origImport);
               // console.log( ` origImport(${origImport}) isNodeImport(${isNodeImport}) improtPath(${importPath})`)
               if (fs.existsSync(importPath) && fs.statSync(importPath).isDirectory()) {
                  console.log( `.... trying to fix Import with /index${extension} `)
                  if( fs.existsSync(importPath + '/index' + extension) ){
                     fixedImport += '/index' + extension;
                     fixCnt++;
                  } else if( isNodeImport && fs.existsSync(importPath + '/dist/index' + extension) ){
                     fixedImport += '/dist/index' + extension;
                     fixCnt++;
                  } else {
                     console.log( `- ERROR in ${path.basename(filePath)}: import file not found: ${origImport}`);
                     errorList.push( `${filePath}: '${origImport}' not found` );
                     errorCnt++;
                  }
               } else if( fs.existsSync(importPath) && origImport.endsWith(extension) ){
                  // file already exists and ok
                  // console.log( `- skipping already correct ${origImport}`)
               } else if( fs.existsSync(importPath+extension) ){
                  fixedImport += extension;
                  fixCnt++;
               } else if( origImport.endsWith(extension) ){
                  // something's wrong, file does NOT exist, 
                  const removedExtensionImport = origImport.substring(0,origImport.length-extension.length);
                  const removedExtensionPath = path.join(path.dirname(filePath), removedExtensionImport);
                  if( fs.existsSync(removedExtensionPath) && fs.statSync(removedExtensionPath).isDirectory()){
                     fixedImport = removedExtensionImport + '/index' + extension;
                     if( showVerbose ) console.log( `- [${path.basename(filePath)}] Detected import error (fixed) -> ${fixedImport}` );
                     fixCnt++;
                  } else {
                     console.log( `- ERROR in ${path.basename(filePath)}: import file not found: ${origImport}`);
                     errorList.push( `${filePath}: '${origImport}' not found` );
                     errorCnt++;
                  }
               } else {
                  console.log( `- ERROR in ${path.basename(filePath)}: import file not found: ${origImport}`);
                  errorList.push( `${filePath}: '${origImport}' not found` );
                  errorCnt++;
               }
            }
            // console.log( `importPath updated: ${origImport} -> ${fixedImport}` )
            return match.replace(origImport, fixedImport);
         });
         if( fixCnt ){
            totalFixCnt += fixCnt;
            if( showVerbose ) console.log( `- updating ${path.basename(filePath)} with ${fixCnt} import fixes; found imports: ${"'"+importList.join("';'")+"'"}`);
            if( !showTestMode ) fs.writeFileSync(filePath, fileContent);
         } else if( importList.length ){
            if( showVerbose ) console.log( `- reviewed ${path.basename(filePath)}, found imports: ${"'"+importList.join("';'")+"'"}`);
         }
      }
   });
}

if( showHelp || searchDir.length<2 ){
   console.log( `File Import Extension Fixer` );
   console.log( `---------------------------` );
   console.log( `Usage: node importFixer [file path]` );
   console.log( `-h: this help file` )
   console.log( `-v: indicate each file with imports and fixes` )
   console.log( `-t: don't modify files, just simulate (use -v too!)` )
   process.exit()
}

console.log( `Scanning ${searchDir}...` )

renameImports(searchDir);

if( showTestMode )
   console.log( `\n***************\n** TEST MODE **\n*************** (Nothing written, but if we were doing this for real:)` )

console.log(`--\n${totalFixCnt} Import paths fixed for ${totalFileCnt} files. Enjoy :)`);
if( errorCnt )
   console.error(`--\n${errorCnt} import errors: \n`+ errorList.join("\n") );
