const fileSelector = document.getElementById("file-selector");
const nextButton = document.getElementById("next-button");
const prevButton = document.getElementById("prev-button");
const vmConsole = document.getElementById("vm-console");
const fullCode = document.getElementById("full-code");
const body = document.querySelector("body");
const nextInstruction = document.getElementById("next-instruction");
const memorySize = 100;
const timeDay = 500;

createMemoryTable();

let reg = { 'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e': 0, 'f': 0, 'sp': 0, 'acc': 0, 'pc': 0, 'ivec': 0, 'int': 0, 'timer': 0, 'halt': false };
let memory = new Array(memorySize);
let outputArray = [""];
memory = memory.fill(0)

class State {
    constructor(reg, mem, out) {
        this.reg = reg
        this.memory = mem
        this.outputArray = out;
    }
}


//console.log(memory);

class Stack {
    constructor() {
        this.array = [];
    }

    push(item) {
        this.array.push(item);
    }

    pop() {
        if (this.array.length > 1) {
            return this.array.pop();
        } else {
            return false;
        }
    }

    peek() {
        if (this.array.length != 0) {
            return this.array[this.array.length - 1];
        } else {
            return false;
        }
    }

}


function reset() {
    memory = memory.fill(0)
    reg = { 'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e': 0, 'f': 0, 'sp': 0, 'acc': 0, 'pc': 0, 'ivec': 0, 'int': 0, 'timer': 0, 'halt': false };

    // if (stack.array.length != 0) {
    //     goBackRegister(stack.peek().reg, reg);
    //     goBackMemory(stack.peek().memory, memory);
    // }

}

function mov(opr) {
    reg[opr[0]] = Number(reg[opr[1]]);
    reg['pc'] = reg['pc'] + 1;

    updateReg(opr[0], Number(reg[opr[1]]));
    updateReg('pc', reg['pc']);

}

function movv(opr) {
    reg[opr[0]] = Number(opr[1]);
    reg['pc'] = reg['pc'] + 1;

    updateReg(opr[0], Number(opr[1]));
    updateReg('pc', reg['pc']);
}

function out(opr) {
    console.log(reg[opr[0]]);
    outputArray.push(String(reg[opr[0]]));
    vmConsole.textContent = vmConsole.textContent + '\n' + String(reg[opr[0]]);
    reg['pc'] = reg['pc'] + 1;

    updateReg('pc', reg['pc']);
}

function halt(opr) {
    reg['halt'] = true;
    reg['pc'] = reg['pc'] + 1;

    updateReg('pc', reg['pc']);
    updateReg('halt', reg['halt']);
}

function load(opr) {
    reg[opr[0]] = Number(memory[Number(opr[1])]);
    reg['pc'] = reg['pc'] + 1;

    updateReg(opr[0], Number(memory[Number(opr[1])]));
    updateReg('pc', reg['pc']);
}

function loadr(opr) {
    reg[opr[0]] = Number(memory[Number(reg[opr[1]])]);
    reg['pc'] = reg['pc'] + 1;

    updateReg(opr[0], reg[opr[0]]);
    updateReg('pc', reg['pc']);
}

function store(opr) {
    memory[Number(opr[0])] = Number(reg[opr[1]]);
    reg['pc'] = reg['pc'] + 1;

    updateReg('pc', reg['pc']);
    updateMemory(Number(opr[0]), Number(reg[opr[1]]));
}

function storer(opr) {
    memory[Number(reg[opr[0]])] = Number(reg[opr[1]]);
    reg['pc'] = reg['pc'] + 1;

    updateReg('pc', reg['pc']);
    updateMemory(Number(reg[opr[0]]), Number(reg[opr[1]]));
}

function add(opr) {
    reg['acc'] = reg[opr[0]] + reg[opr[1]];
    reg['pc'] = reg['pc'] + 1;

    updateReg('acc', reg['acc']);
    updateReg('pc', reg['pc']);
}

function sub(opr) {
    reg['acc'] = reg[opr[0]] - reg[opr[1]];
    reg['pc'] = reg['pc'] + 1;

    updateReg('acc', reg['acc']);
    updateReg('pc', reg['pc']);
}

function mod(opr) {
    reg['acc'] = reg[opr[0]] % reg[opr[1]];
    reg['pc'] = reg['pc'] + 1;

    updateReg('acc', reg['acc']);
    updateReg('pc', reg['pc']);
}

function call(opr) {
    reg['sp'] = Number(reg['sp']) + 1;
    memory[Number(reg['sp'])] = Number(reg['pc']) + 1;
    reg['pc'] = Number(opr[0]);

    updateReg('sp', reg['sp']);
    updateReg('pc', reg['pc']);
    updateMemory(Number(reg['sp']), memory[Number(reg['sp'])]);
}

function ret(opr) {
    reg['pc'] = Number(memory[Number(reg['sp'])]);
    reg['sp'] = reg['sp'] - 1;

    updateReg('sp', reg['pc']);
    updateReg('pc', reg['pc']);

}

function push(opr) {
    reg['sp'] = Number(reg['sp']) + 1;
    memory[Number(reg['sp'])] = Number(reg[(opr[0])]);
    reg['pc'] = reg['pc'] + 1;

    updateReg('sp', reg['sp']);
    updateReg('pc', reg['pc']);
    updateMemory(Number(reg['sp']), memory[Number(reg['sp'])]);

}

function pop(opr) {
    reg[opr[0]] = Number(memory[Number(reg['sp'])]);
    reg['sp'] = Number(reg['sp']) - 1;
    reg['pc'] = reg['pc'] + 1;

    updateReg('sp', reg['sp']);
    updateReg('pc', reg['pc']);
}

function jmp(opr) {
    reg['pc'] = Number(opr[0]);

    updateReg('pc', reg['pc']);
}

function jnz(opr) {
    if (Number(reg[opr[1]]) != 0) {
        reg['pc'] = Number(opr[0]);
    } else {
        reg['pc'] = reg['pc'] + 1;
    }

    updateReg('pc', reg['pc']);
}


let stack = new Stack();

fileSelector.addEventListener('change', () => {
    reset();
    let asmFile = fileSelector.files[0];
    let reader = new FileReader();
    reader.onload = (e) => {
        nextButton.removeAttribute('Disabled');
        prevButton.removeAttribute('Disabled');
        fullCode.removeAttribute('Disabled');
        const file = e.target.result;
        const line = file.split(/\r\n|\n/);
        if (line.length != 0) {
            for (let i = 0; i < line.length; i++) {
                if (line[i][0] === '#' || line[i][0] == null) {
                    continue;
                } else {
                    let temp = line[i].split(" ");
                    memory[temp[0]] = temp.slice(1);
                    updateMemory(temp[0], temp.slice(1));

                }
            }

            let newState = new State(reg, memory, outputArray);
            setNextInstruction(newState.memory[newState.reg['pc']]);
            stack.push(newState);
            console.log(stack);
        }



    }

    reader.readAsText(asmFile)



});

nextButton.addEventListener('click', (e) => {
    start();

});

prevButton.addEventListener('click', (e) => {
    if (stack.array.length > 1) {
        let newObj = stack.pop();
        let oldObj = stack.peek();
        goBackRegister(newObj.reg, oldObj.reg);
        goBackMemory(newObj.memory, oldObj.memory);
        goBackOutput(newObj.outputArray, oldObj.outputArray);
        setNextInstruction(oldObj.memory[oldObj.reg['pc']]);
        addEffectBackward(oldObj.reg['pc']);
    }


});


fullCode.addEventListener('click', () => {
    while (reg['halt'] === false) {
        start();
    }
});

body.addEventListener('keypress', (e) => {
    if (e.key == 's') {
        console.log(reg['halt']);
        start();

        nextButton.classList.add('keypressed');
        setTimeout(function() {
            nextButton.classList.remove('keypressed');
        }, 100);


    } else if (e.key == 'w') {
        if (stack.array.length > 1) {
            let newObj = stack.pop();
            let oldObj = stack.peek();
            goBackRegister(newObj.reg, oldObj.reg);
            goBackMemory(newObj.memory, oldObj.memory);
            goBackOutput(newObj.outputArray, oldObj.outputArray);
            setNextInstruction(oldObj.memory[oldObj.reg['pc']]);
            addEffectBackward(oldObj.reg['pc']);

            prevButton.classList.add('keypressed');
            setTimeout(function() {
                prevButton.classList.remove('keypressed');
            }, 100)

        }
    } else if (e.key == 'h') {
        while (reg['halt'] === false) {
            start();

            fullCode.classList.add('keypressed');
            setTimeout(function() {
                fullCode.classList.remove('keypressed');
            }, 100)
        }
    }


})

function start() {
    let currentState = JSON.parse(JSON.stringify(stack.peek()));
    reg = currentState.reg;
    memory = currentState.memory;
    outputArray = currentState.outputArray;
    //console.log(outputArray);
    if (reg['halt'] === false) {
        let i = reg['pc'];
        addEffect(reg['pc']);
        op = memory[i][0];
        console.log(JSON.stringify(memory[i]));
        window[op](memory[i].slice(1));
        setNextInstruction(memory[reg['pc']]);

        reg['timer'] = reg['timer'] - 1;
        updateReg('timer', reg['timer']);
        if (Number(reg['int']) == 1 && Number(reg['timer']) == 0) {
            reg['sp'] = reg['sp'] + 1;
            memory[Number(reg['sp'])] = Number(reg['pc']);
            reg['pc'] = Number(reg['ivec']);
            reg['int'] = 0;

            updateReg('pc', reg['pc']);
            updateReg('int', reg['int']);
            updateReg('sp', reg['sp']);
            updateMemory(Number(reg['sp']), memory[Number(reg['sp'])]);
        }
    }

    if (reg['halt'] === true) {
        if (stack.peek().reg['halt'] == false) {
            stack.push(new State(reg, memory, outputArray)) //push into stack only once time after halt is true
        }

        console.log(memory);
        console.log(reg);
    } else {
        stack.push(new State(reg, memory, outputArray))
        console.log(stack);
    }


}

function updateReg(regName, value) {
    let register = document.getElementById(regName);
    register.textContent = value;

    register.classList.add('update');
    setTimeout(function() {
        register.classList.remove('update');
    }, timeDay);
}

function updateMemory(memAddress, value) {
    let memeoryCell = document.querySelector('.m' + memAddress);
    memeoryCell.textContent = value;

    if (typeof(value) == 'number') {
        memeoryCell.classList.add('update');
        setTimeout(function() {
            memeoryCell.classList.remove('update');
        }, timeDay);
    }


}

function goBackRegister(newReg, oldReg) {
    for (const [key, value] of Object.entries(newReg)) {
        if (oldReg[key] != value) {
            updateReg(key, oldReg[key]);
        }
    }
}

function goBackMemory(newMem, oldMem) {
    for (let memAdd = 0; memAdd < 100; memAdd++) {
        if (oldMem[memAdd] != newMem[memAdd]) {
            updateMemory(memAdd, oldMem[memAdd]);
        }
    }
}

function goBackOutput(newOut, oldOut) {
    if (newOut.length != oldOut.length) {
        vmConsole.textContent = "";
        for (let i = 0; i < oldOut.length; i++) {
            console.log(oldOut[i]);
            vmConsole.textContent = vmConsole.textContent + '\n' + oldOut[i];
        }
    }
}

function createMemoryTable() {
    const memTable = document.getElementById("memory-table");

    for (let i = 0; i < 10; i++) {
        const tableRow = document.createElement('tr');
        for (let j = 0; j < 10; j++) {
            const memCell = document.createElement('td');
            memCell.textContent = '0';
            let className = ('m') + String(i * 10 + j);
            memCell.classList.add(className);
            memCell.classList.add('mem');
            tableRow.appendChild(memCell);
        }

        memTable.appendChild(tableRow);
    }
}

function addEffect(pcVal) {
    const currentInst = document.querySelector(".m" + pcVal);
    currentInst.classList.add('current-code');
    setTimeout(function() {
        currentInst.classList.remove('current-code');
    }, timeDay);

}

function addEffectBackward(pcVal) {
    const currentInst = document.querySelector(".m" + pcVal);
    currentInst.classList.add('back-code');
    setTimeout(function() {
        currentInst.classList.remove('back-code');
    }, timeDay);

}

function setNextInstruction(nextInst) {
    nextInstruction.textContent = "";
    for (let i = 0; i < nextInst.length; i++) {
        nextInstruction.textContent = nextInstruction.textContent + " " + nextInst[i];
    }

}