class Terminal {
    constructor() {
        this.output = document.getElementById('terminalOutput');
        this.input = document.getElementById('commandInput');
        this.body = document.getElementById('terminalBody');
        this.history = [];
        this.historyIndex = -1;
        
        this.init();
    }
    
    init() {
        // 添加欢迎消息
        this.addOutput('<span class="welcome">Welcome to Terminal Homepage!</span>', 'welcome');
        this.addOutput('<span class="info">Type "help" for available commands.</span>', 'info');
        
        this.input.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // 确保输入框有焦点
        setTimeout(() => {
            this.input.focus();
        }, 100);
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
        
        // 清空输入框并聚焦
        this.input.value = '';
        this.scrollToBottom();
    }
    
    clearTerminal() {
        // 清除所有输出，保留输入行
        this.output.innerHTML = '';
        // 添加新的输入行
        this.addOutput('<span class="info">终端已清空</span>', 'info');
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