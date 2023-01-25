/*

 Build with the help of ChatGPT

*/

const fs = require('fs');
const crypto = require('crypto');

const dir2 = 'path/to'; // REFERENCE path, you wnat to know what's in compare path, but missing here!
const dir1 = 'path/to'; // the rebel directory we want to know what secrets it holds
const newPath = 'path/to'; // the destination we want to keep those secrets not in our ref path!

const fileExtension = '.php';

// Recursive function to compare the contents of two directories
const compareDirs = (dir1, dir2) => {
   // Get the list of files and subdirectories in the first directory
   const items1 = fs.readdirSync(dir1);

   // Loop through the items in the first directory
   items1.forEach(item1 => {
      const item2 = `${dir2}/${item1}`;
      // Check if the item is a file or a directory
      if (fs.lstatSync(`${dir1}/${item1}`).isDirectory())
      // If it's a directory, recursively call the function
         compareDirs(`${dir1}/${item1}`, item2);
      else if(item1.endsWith( fileExtension))
      // If it's a .XYZ  file, check if it's also in the second directory
         if (!fs.existsSync(item2)) {
            // Create the new directory structure if it doesn't exist
            const newDir = newPath + '/' + dir2.substring(dir2.indexOf('/'));
            if (!fs.existsSync(newDir))
               fs.mkdirSync(newDir, { recursive: true });

            // Copy the missing file to the new directory
            fs.copyFileSync(`${dir1}/${item1}`, `${newDir}/${item1}`);
            console.log(`${item1} is missing from ${dir2} and copied to ${newDir}`);
            return;
         }
      // // Compare the checksum of the file in the first and second directories
      // const hash1 = crypto.createHash('md5').update(fs.readFileSync(`${dir1}/${item1}`)).digest('hex');
      // const hash2 = crypto.createHash('md5').update(fs.readFileSync(item2)).digest('hex');

      // if (hash1 !== hash2) {
      //   console.log(`${item1} has a different checksum in ${dir2}`);
      // }

   });
}

compareDirs(dir1, dir2);
