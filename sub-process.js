function runBigProcess() {
    for (let i = 0; i < 1e6; i++) {
        console.log(i, '- sub-process');
    }
}

runBigProcess()