const { createServer } = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { cpus } = require('os');

const MAX_PARALLEL_PROCESS = /*cpus().length <= 1 ? 1 : cpus().length / 2*/ 1
let runningProcess = []

    
async function runBigProcessInQueue() {
    if (runningProcess.length >= MAX_PARALLEL_PROCESS) {
        console.log('Queue is full, waiting some process finish...');
        const firstResolvedPromise = await Promise.race(runningProcess)

        runningProcess = runningProcess.filter((p) => p !== firstResolvedPromise)
        
        return runBigProcessInQueue()
    }
    
    console.log('Running process...');

    const promise = runBigProcess()
    runningProcess.push(promise)

    function removePromise() {
        console.log('Promise finish, removing from queue...');
        runningProcess = runningProcess.filter((p) => p !== promise)
    }

    let result;

    try {
        result = await promise;
    } catch (error) {
        throw error
    } finally {
        removePromise()
    }
    
    return result 
}

async function runBigProcess() {
    return new Promise((resolve, reject) => {
        const subProcess = spawn('node', [
            path.resolve(__dirname, 'sub-process.js')
        ])

        subProcess.stdout.on('data', (chunk) => {})
        subProcess.stderr.on('data', (chunk) => console.log(chunk.toString()))
      
        subProcess.on('error', reject)
        subProcess.on('close', () => {
            resolve('resolved')
        })
    })
}

createServer(async (req, res) => {
    if (req.url === '/queue') {
        const started = new Date()
        await runBigProcessInQueue()

        console.log(`this process took: ${new Date() - started}ms`);
    }

    res.end('ok')
}).listen(5050, () => console.log('server up'));