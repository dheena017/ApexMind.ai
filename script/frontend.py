#!/usr/bin/env python3
import argparse
import http.client
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
VITE_BIN = PROJECT_ROOT / "node_modules" / "vite" / "bin" / "vite.js"
VITE_CONFIG = FRONTEND_ROOT / "vite.config.ts"


def load_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    with path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {"\"", "'"}:
                value = value[1:-1]
            values[key] = value
    return values


def resolve_python_executable() -> str:
    configured = os.environ.get("PYTHON", "").strip()
    if configured:
        return configured

    candidates = [
        PROJECT_ROOT / ".venv" / ("Scripts" if os.name == "nt" else "bin") / ("python.exe" if os.name == "nt" else "python"),
        PROJECT_ROOT / "venv" / ("Scripts" if os.name == "nt" else "bin") / ("python.exe" if os.name == "nt" else "python"),
    ]

    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    return sys.executable or "python"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the ApexMind frontend and optional backend.")
    parser.add_argument("--with-backend", action="store_true", help="start the Python backend after the frontend becomes ready")
    parser.add_argument("--host", dest="host", help="frontend host to bind to")
    parser.add_argument("--port", dest="port", type=int, help="frontend port to bind to")
    return parser.parse_args()


def get_frontend_host(env: dict[str, str], cli_host: str | None) -> str:
    host = cli_host or env.get("FRONTEND_HOST") or env.get("HOST") or "127.0.0.1"
    return host.strip() or "127.0.0.1"


def get_frontend_port(env: dict[str, str], cli_port: int | None) -> int:
    value = cli_port if cli_port is not None else env.get("FRONTEND_PORT", "5173")
    try:
        port = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f'FRONTEND_PORT must be an integer between 1 and 65535. Received: "{value}"') from exc

    if not 1 <= port <= 65535:
        raise ValueError(f'FRONTEND_PORT must be an integer between 1 and 65535. Received: "{value}"')
    return port


def is_server_ready(host: str, port: int) -> bool:
    try:
        connection = http.client.HTTPConnection(host, port, timeout=1)
        connection.request("GET", "/")
        response = connection.getresponse()
        response.read()
        return True
    except Exception:
        return False
    finally:
        try:
            connection.close()
        except Exception:
            pass


def wait_for_frontend(host: str, port: int, timeout_seconds: int = 30) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if is_server_ready(host, port):
            return
        time.sleep(0.2)
    raise TimeoutError(f"The Vite frontend did not become ready at http://{host}:{port} within {timeout_seconds} seconds.")


def run_frontend(host: str, port: int, env: dict[str, str]) -> subprocess.Popen[str]:
    command = [
        "node",
        str(VITE_BIN),
        "--config",
        str(VITE_CONFIG),
        "--host",
        host,
        "--port",
        str(port),
        "--strictPort",
        str(FRONTEND_ROOT),
    ]
    print("=" * 60)
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Frontend host: {host}")
    print(f"Frontend port: {port}")
    print(f"Backend auto-start: {'enabled' if args.with_backend else 'disabled'}")
    print("=" * 60)
    return subprocess.Popen(command, cwd=str(PROJECT_ROOT), env=env, stdin=subprocess.DEVNULL)


args = parse_args()
env = {**load_dotenv(PROJECT_ROOT / ".env"), **os.environ}

try:
    host = get_frontend_host(env, args.host)
    port = get_frontend_port(env, args.port)
except ValueError as exc:
    print(str(exc), file=sys.stderr)
    raise SystemExit(1)

if not VITE_BIN.exists():
    print(f"Vite binary not found at: {VITE_BIN}", file=sys.stderr)
    print("Install frontend dependencies with: npm install", file=sys.stderr)
    raise SystemExit(1)

frontend_process: subprocess.Popen[str] | None = None
backend_process: subprocess.Popen[str] | None = None


def shutdown(signum=None, frame=None):
    if backend_process is not None and backend_process.poll() is None:
        backend_process.terminate()
    if frontend_process is not None and frontend_process.poll() is None:
        frontend_process.terminate()
    raise SystemExit(0 if signum is None else 1)


for sig in (signal.SIGINT, signal.SIGTERM):
    signal.signal(sig, shutdown)

frontend_process = run_frontend(host, port, env)

if args.with_backend:
    try:
        wait_for_frontend(host, port)
        print("Frontend is ready; starting the backend.")
        backend_process = subprocess.Popen(
            [resolve_python_executable(), str(PROJECT_ROOT / "script" / "backend.py")],
            cwd=str(PROJECT_ROOT),
            env=env,
            stdin=subprocess.DEVNULL,
        )
    except TimeoutError as exc:
        print(str(exc), file=sys.stderr)
        frontend_process.terminate()
        raise SystemExit(1)

try:
    frontend_status = frontend_process.wait()
    if backend_process is not None and backend_process.poll() is None:
        backend_process.terminate()
    raise SystemExit(frontend_status)
except KeyboardInterrupt:
    shutdown()
