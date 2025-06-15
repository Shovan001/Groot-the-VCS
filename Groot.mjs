#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import  crypto from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';
import { Command } from 'commander'; //importing commander to handle command line arguments

const program = new Command(); //create a new command instance

class Groot{
    constructor(repoPath= '.'){
        this.repoPath = path.join(repoPath, '.groot');//this is the path where our own .groot folder like .git will be made
        this.objectsPath = path.join(this.repoPath, 'objects'); //this is the path where our objects(.groot/objects) will be stored
        this.headPath = path.join(this.repoPath, 'HEAD'); //this is the path where our HEAD(.groot/HEAD) file will be stored
        this.indexPath = path.join(this.repoPath, 'index'); //this is the path where our index(.groot/index) file will be stored
        this.init();
    }

    async init(){
        //inatialize the .groot folder and its subfolders
        await fs.mkdir(this.objectsPath, { recursive: true})

        try {
            await fs.writeFile(this.headPath, '', { flag: 'wx' }); //create HEAD file if it doesn't exist.. wx: open for writing , fails if file exists
            await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: 'wx' }  ); //create empty index file
        } catch (error) {
            console.error("Already initialized the .groot folder");
        }
    }

    hashObject(content){
        return crypto.createHash('sha1').update(content, 'utf8').digest('hex'); //crypto.createHash gives an object that is capable of calling the sha1 hashing functions

    }

    async add (fileToBeAdded){

        const fileData = await fs.readFile(fileToBeAdded, {encoding: 'utf-8'}); //read the file to be added
        const fileHash = this.hashObject(fileData);
        console.log(`Hash of the file ${fileToBeAdded} is ${fileHash}`); //.groot/objects/<fileHash>
        const newFileHashedObjectPath = path.join(this.objectsPath, fileHash); //create the path for the object file 
        await fs.writeFile(newFileHashedObjectPath, fileData); //write the file data to the object file
        await this.updateStagingArea(fileToBeAdded, fileHash); //update the staging area with the file path and hash
        console.log(`File ${fileToBeAdded} added `);
        
    }

    async updateStagingArea(filePath, fileHash) {
        const index  = JSON.parse(await fs.readFile(this.indexPath,{encoding: 'utf-8'})); //read the index file
        index.push({ path: filePath, hash: fileHash }); //add the file path and hash to the index
        await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2)); //write the updated index back to the file
        

    }

    async commit(message){
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' })); //read the index file
        const parentCommit = await this.getCurrentHead(); //get the current HEAD commit
        const commitData = {
            message: message,
            timestamp: new Date().toISOString(),
            parent: parentCommit,
            files: index
        };


        const commitHash = this.hashObject(JSON.stringify(commitData)); //hash the commit data
        const commitPath = path.join(this.objectsPath, commitHash); //create the path for the commit object file
        await fs.writeFile(commitPath, JSON.stringify(commitData)); //write the commit data to the commit object file
        await fs.writeFile(this.headPath, commitHash); //update the HEAD file with the new commit hash
        await fs.writeFile(this.indexPath, JSON.stringify([])); //clear the index file after commit
        console.log(`Commit successful with hash: ${commitHash}`);
    }

    async getCurrentHead(){
        try{
            return await fs.readFile(this.headPath, { encoding: 'utf-8' }); //read the HEAD file
        } catch (error) {
            return null; //if HEAD file doesn't exist, return null
        }
    }

    async log(){
        let currentCommitHash = await this.getCurrentHead(); //get the current HEAD commit
        while (currentCommitHash){
            const commitData = JSON.parse(await fs.readFile(path.join(this.objectsPath, currentCommitHash), { encoding: 'utf-8' }));

            console.log('_____________________________________________________________\n')
            console.log(`Commit ${currentCommitHash}\nDate: ${commitData.timestamp}\nMessage: ${commitData.message}`);
            currentCommitHash = commitData.parent; //move to the parent commit
        }
    }

    async showCommitDiff(commitHash){
    const commitDataRaw = await this.getCommitData(commitHash); //get the commit data for the given commit hash
    if (!commitDataRaw) {
        console.log("Commit not found");
        return;
        }
    const commitData = JSON.parse(commitDataRaw);
    console.log("Changes in the last commit are:");
    
    for (const file of commitData.files) {
        console.log(`File: ${file.path}`);
        const fileContent = await this.getFileContent(file.hash); //get the file content for the file hash
        console.log(`Content: ${fileContent}`);

        if(commitData.parent){
            const parentCOmmitData = JSON.parse(await this.getCommitData(commitData.parent)); //get the parent commit data
            const parentFileContent = await this.getParentFileContent(parentCOmmitData, file.path);

if (parentFileContent !== undefined && parentFileContent !== null) {
    console.log('\n');
    const diff = diffLines(parentFileContent, fileContent);
    diff.forEach(part => {
        if (part.added) {
            process.stdout.write(chalk.green("++" + part.value));
        } else if (part.removed) {
            process.stdout.write(chalk.red("--" + part.value));
        } else {
            process.stdout.write(chalk.grey("--" + part.value));
        }
    });
    console.log('\n');
} else {
    console.log(chalk.yellow("New file in this commit"));
}
 
            }else{
                console.log("First Commit");
            }
       }

    }

    async getParentFileContent(parentCommitData, filePath){
        const parentFile = parentCommitData.files.find(file => file.path === filePath); //find the file in the parent commit data
        if (parentFile) {
            //get the file content from the parent commit and return the content
            return await this.getFileContent(parentFile.hash);
        }
        return null;
    }

    async getCommitData(commitHash) {
    const commitPath = path.join(this.objectsPath, commitHash);
    try {
        return await fs.readFile(commitPath, { encoding: 'utf-8' });
        } catch (error) {
        console.log("Failed to read commit data ", error);
        return null; //if commit file doesn't exist, return null
        }
    }

    async getFileContent(fileHash) {
        const filePath = path.join(this.objectsPath, fileHash);
        return fs.readFile(filePath, { encoding: 'utf-8' });
    }

}
// async function main() {
//     const groot = new Groot(); //create an instance of Groot class to initialize the .groot folder
//     await groot.add('sample.txt'); //add a file to the .groot folder
//     await groot.add('sample2.txt'); //add another file to the .groot folder
//     await groot.commit('Fifth commit'); //commit the changes with a message
//     await groot.log(); //log the commit history
//     await groot.showCommitDiff('0fd8ddf86660808f636b104ea5627f7e6f8780b4'); //show the diff of a specific commit
// }
// main();

program.command('init').action(async () => {
    const groot = new Groot(); //create an instance of Groot class to initialize the .groot folder
    console.log("Groot initialized");
});

program.command('add <file>').action(async (file) => {
    const groot = new Groot(); //create an instance of Groot class to initialize the .groot folder
    await groot.add(file); //add the file to the .groot folder
});

program.command('commit <message>').action(async (message) => {
    const groot = new Groot(); //create an instance of Groot class to initialize the .groot folder
    await groot.commit(message); //commit the changes with a message
});

program.command('log').action(async () => {
    const groot = new Groot(); //create an instance of Groot class to initialize the .groot folder
    await groot.log(); //log the commit history
});

program.command('show <commitHash>').action(async (commitHash) => {
    const groot = new Groot(); //create an instance of Groot class to initialize the .groot folder
    await groot.showCommitDiff(commitHash); //show the diff of a specific commit
});

program.parse(process.argv); //parse the command line arguments


