class Terminal {
    constructor() {
        this.output = document.getElementById('terminalOutput');
        this.body = document.getElementById('terminalBody');
        this.history = [];
        this.historyIndex = -1;
        this.input = null; // 初始化为空，将在createNewInputLine中设置
        
        this.init();
    }
    
    init() {
        // 添加欢迎消息
        this.addOutput('<span class="welcome">Welcome to Terminal Homepage!</span>', 'welcome');
        this.addOutput('<span class="info">Type "help" for available commands.</span>', 'info');
        
        // 创建第一个输入行
        this.createNewInputLine();
    }
    
    async handleKeyDown(e) {
        if (e.key === 'Enter') {
            const command = this.input.value.trim();
            if (command) {
                await this.executeCommand(command);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.navigateHistory(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.navigateHistory(1);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.autoComplete();
        }
    }
    
    async executeCommand(input) {
        // 添加用户输入到输出
        this.addOutput(`<span class="cmd-history">guest@terminal:~$ ${input}</span>`, 'cmd-history');
        
        // 将命令添加到历史记录
        this.history.push(input);
        this.historyIndex = this.history.length;
        
        try {
            // 发送请求到后端API
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command: input })
            });
            
            const data = await response.json();
            
            if (data.status === 'clear') {
                // 处理clear命令
                this.clearTerminal();
            } else if (data.status === 'success') {
                if (data.output) {
                    // 如果是CLEAR_TERMINAL特殊标记，则清空终端
                    if (data.output === 'CLEAR_TERMINAL') {
                        this.clearTerminal();
                    } else {
                        this.addOutput(data.output);
                    }
                }
            } else {
                this.addOutput(data.output, 'error');
            }
        } catch (error) {
            this.addOutput(`错误: ${error.message}`, 'error');
        }
        
        // 清空当前输入框
        if (this.input) {
            this.input.value = '';
        }
        
        this.scrollToBottom();
        
        // 先移除现有的所有输入行
        const existingInputs = this.output.querySelectorAll('.command-line');
        existingInputs.forEach(inputElement => {
            inputElement.remove();
        });
        
        // 创建新的输入行
        this.createNewInputLine();
    }
    
    createNewInputLine() {
        // 创建新的输入行并添加到输出区域的末尾
        const newInputLine = document.createElement('div');
        newInputLine.className = 'command-line';
        newInputLine.innerHTML = `
            <span class="prompt">guest@terminal:~$ </span>
            <input type="text" class="command-input dynamic-input" autocomplete="off">
        `;
        // 将输入行添加到terminalOutput的末尾，使其紧跟在输出之后
        this.output.appendChild(newInputLine);
        
        // 获取新创建的输入框并设置事件监听器
        this.input = newInputLine.querySelector('.command-input');
        if (this.input) {
            this.input.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });
            
            // 确保新输入框获得焦点
            setTimeout(() => {
                this.input.focus();
            }, 10);
        }
    }
    
    clearTerminal() {
        // 清除所有输出
        this.output.innerHTML = '';
        
        // 移除所有现有的输入行
        const existingInputs = this.output.querySelectorAll('.command-line');
        if (existingInputs.length > 0) {
            existingInputs.forEach(inputElement => inputElement.remove());
        }
        
        // 添加清空提示
        this.addOutput('<span class="info">终端已清空</span>', 'info');
        // 创建新的输入行
        this.createNewInputLine();
    }
    
    addOutput(text, className = '') {
        const outputLine = document.createElement('div');
        outputLine.className = `output-line ${className}`;
        outputLine.innerHTML = text;
        this.output.appendChild(outputLine);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.body.scrollTop = this.body.scrollHeight;
    }
    
    navigateHistory(direction) {
        if (this.history.length === 0) return;
        
        if (direction === -1) { // 向上箭头
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.input.value = this.history[this.historyIndex];
            }
        } else if (direction === 1) { // 向下箭头
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.input.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = this.history.length;
                this.input.value = '';
            }
        }
    }
    
    autoComplete() {
        const input = this.input.value.toLowerCase();
        const allowedCommands = ['help', 'clear', 'echo', 'date', 'ls', 'pwd', 'whoami', 'history', 'about', 'contact'];
        const matches = allowedCommands.filter(cmd => 
            cmd.startsWith(input)
        );
        
        if (matches.length === 1) {
            this.input.value = matches[0];
        } else if (matches.length > 1) {
            // 显示可能的匹配项
            this.addOutput(`可能的命令: ${matches.join(', ')}`, 'info');
        }
    }
}

// 初始化终端
document.addEventListener('DOMContentLoaded', () => {
    new Terminal();
});