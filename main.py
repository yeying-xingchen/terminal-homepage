from sanic import Sanic
from sanic.response import json, html
import toml

app = Sanic("TerminalHome")

# 设置模板和静态文件目录
app.static('/static', './static')

config = {}
try:
    config = toml.load('config.toml')
except FileNotFoundError:
    print("配置文件不存在。请检查config.toml文件是否存在。")
    exit(1)

@app.route('/')
async def index(request):
    with open('./templates/index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    return html(content)

# 命令执行
@app.post('/api/command')
async def execute_command(request):
    command = request.json.get('command', '')
    cmd_parts = command.strip().split()
    cmd = cmd_parts[0].lower()
    if not cmd_parts:
        return json({'output': '', 'status': 'success'})
    elif cmd not in config['commands']:  # 检查命令是否在配置文件中
        return json({'output': 'Invalid command', 'status': 'error'})
    else:
        if command == 'clear':
            # clear命令由前端处理，后端返回特殊标识
            return json({'output': 'CLEAR_TERMINAL', 'status': 'clear'})
        return json({'output': config['commands'][cmd], 'status': 'success'})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)