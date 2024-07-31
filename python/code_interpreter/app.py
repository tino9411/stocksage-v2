from flask import Flask, request, jsonify, abort, send_file
from flask_cors import CORS
import subprocess
import sys
import io
import plotly.graph_objects as go
import plotly.express as px
from contextlib import redirect_stdout, redirect_stderr
import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__)
CORS(app)

# Function to install a package
def install_package(package):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return f'Package {package} installed successfully.'
    except subprocess.CalledProcessError as e:
        return f"Error installing package {package}: {str(e)}"

# Function to execute Python code
def execute_python_code(code):
    f_stdout = io.StringIO()
    f_stderr = io.StringIO()
    try:
        with redirect_stdout(f_stdout), redirect_stderr(f_stderr):
            exec(code, {'__builtins__': __builtins__}, {})
            return f_stdout.getvalue() if f_stdout.getvalue() else "Code executed successfully."
    except ImportError as e:
        missing_module = str(e).split(" ")[-1].strip("'")
        install_result = install_package(missing_module)
        try:
            with redirect_stdout(f_stdout), redirect_stderr(f_stderr):
                exec(code, {'__builtins__': __builtins__}, {})
                return f_stdout.getvalue() if f_stdout.getvalue() else "Code executed successfully."
        except Exception as re_run_exception:
            return f"Error: {str(re_run_exception)}. Attempted to install {missing_module}: {install_result}"
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/execute', methods=['POST'])
def execute():
    if request.content_type != 'application/json':
        abort(400, description="Content type must be application/json")
    
    try:
        data = request.get_json(force=True)
    except Exception as e:
        abort(400, description="Invalid JSON")

    code = data.get('code', '')
    language = data.get('language', 'python')
    
    if not code:
        abort(400, description="No code provided")

    if language == 'python':
        result = execute_python_code(code)
    elif language == 'bash':
        result = execute_bash_command(code)
    else:
        abort(400, description="Unsupported language")

    return jsonify({'result': result})

# Function to execute bash commands
def execute_bash_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        return result.stdout if result.stdout else "Command executed successfully."
    except subprocess.CalledProcessError as e:
        return f"Error: {str(e)}"

# Endpoint to handle chart generation
@app.route('/generate_chart', methods=['POST'])
def generate_chart():
    if request.content_type != 'application/json':
        abort(400, description="Content type must be application/json")

    try:
        data = request.get_json(force=True)
    except Exception as e:
        abort(400, description="Invalid JSON")

    code = data.get('code', '')
    
    if not code:
        abort(400, description="No code provided")

    try:
        # Redirect stdout and stderr
        f_stdout = io.StringIO()
        f_stderr = io.StringIO()
        with redirect_stdout(f_stdout), redirect_stderr(f_stderr):
            fig = go.Figure()  # Initialize the figure
            exec(code, {'__builtins__': __builtins__, 'go': go, 'fig': fig, 'px': px})
        
        # Save the plot to an HTML file
        fig.write_html('chart.html')
        
        return send_file('chart.html', mimetype='text/html')
    except Exception as e:
        return jsonify({'error': str(e)})

# Logging setup
handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=1)
handler.setLevel(logging.INFO)
app.logger.addHandler(handler)

# Rate limiting (simple example)
requests = {}

@app.before_request
def limit_remote_addr():
    ip = request.remote_addr
    if ip not in requests:
        requests[ip] = 1
    else:
        requests[ip] += 1

    if requests[ip] > 100:
        abort(429, description="Rate limit exceeded")

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    app.run(host='0.0.0.0', port=5000)