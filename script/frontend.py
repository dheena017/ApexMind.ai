#!/usr/bin/env python3
"""
ApexMind Studio - High-Performance Frontend & Full-Stack Runner
Provides pre-flight diagnostics, automated dependency checks, port conflict
resolution, dual-process supervision (Vite + FastAPI), and clean process lifecycle.
"""

from __future__ import annotations

import argparse
import http.client
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
VITE_BIN = PROJECT_ROOT / "node_modules" / "vite" / "bin" / "vite.js"
VITE_CONFIG = FRONTEND_ROOT / "vite.config.ts"
DOTENV_PATH = PROJECT_ROOT / ".env"

# Enable UTF-8 console output on Windows
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

_WINDOWS_JOB_HANDLE = None


def enable_windows_kill_on_close() -> None:
    """Ensure all spawned subprocesses and reload workers are destroyed by the Windows kernel if parent exits."""
    global _WINDOWS_JOB_HANDLE
    if sys.platform != "win32":
        return
    import ctypes
    from ctypes import wintypes

    try:
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        job = kernel32.CreateJobObjectW(None, None)
        if not job:
            return

        class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("PerProcessUserTimeLimit", wintypes.LARGE_INTEGER),
                ("PerJobUserTimeLimit", wintypes.LARGE_INTEGER),
                ("LimitFlags", wintypes.DWORD),
                ("MinimumWorkingSetSize", ctypes.c_size_t),
                ("MaximumWorkingSetSize", ctypes.c_size_t),
                ("ActiveProcessLimit", wintypes.DWORD),
                ("Affinity", ctypes.c_size_t),
                ("PriorityClass", wintypes.DWORD),
                ("SchedulingClass", wintypes.DWORD),
            ]

        class IO_COUNTERS(ctypes.Structure):
            _fields_ = [
                ("ReadOperationCount", ctypes.c_ulonglong),
                ("WriteOperationCount", ctypes.c_ulonglong),
                ("OtherOperationCount", ctypes.c_ulonglong),
                ("ReadTransferCount", ctypes.c_ulonglong),
                ("WriteTransferCount", ctypes.c_ulonglong),
                ("OtherTransferCount", ctypes.c_ulonglong),
            ]

        class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
                ("IoInfo", IO_COUNTERS),
                ("ProcessMemoryLimit", ctypes.c_size_t),
                ("JobMemoryLimit", ctypes.c_size_t),
                ("PeakProcessMemoryLimit", ctypes.c_size_t),
                ("PeakJobMemoryLimit", ctypes.c_size_t),
            ]

        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x2000
        JobObjectExtendedLimitInformation = 9

        info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE

        kernel32.SetInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            ctypes.byref(info),
            ctypes.sizeof(info),
        )

        current_process = kernel32.GetCurrentProcess()
        kernel32.AssignProcessToJobObject(job, current_process)
        _WINDOWS_JOB_HANDLE = job
    except Exception:
        pass


def find_process_on_port(port: int) -> int | None:
    """Find the PID of the process listening on the given port."""
    if sys.platform == "win32":
        try:
            res = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True,
                check=True,
            )
            for line in res.stdout.splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and f":{port}" in parts[1] and parts[3].upper() == "LISTENING":
                    try:
                        return int(parts[4])
                    except ValueError:
                        continue
        except Exception:
            pass
    return None


def kill_process_by_pid(pid: int) -> bool:
    """Forcefully terminate a process tree by PID."""
    if sys.platform == "win32":
        res = subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return res.returncode == 0
    else:
        try:
            os.kill(pid, signal.SIGKILL)
            return True
        except Exception:
            return False


class Ansi:
    """Terminal styling codes with automatic disabling support."""

    def __init__(self, enabled: bool = True):
        self.enabled = enabled

    def _c(self, code: str) -> str:
        return code if self.enabled else ""

    @property
    def RESET(self) -> str:
        return self._c("\033[0m")

    @property
    def BOLD(self) -> str:
        return self._c("\033[1m")

    @property
    def DIM(self) -> str:
        return self._c("\033[2m")

    @property
    def RED(self) -> str:
        return self._c("\033[91m")

    @property
    def GREEN(self) -> str:
        return self._c("\033[92m")

    @property
    def YELLOW(self) -> str:
        return self._c("\033[93m")

    @property
    def BLUE(self) -> str:
        return self._c("\033[94m")

    @property
    def MAGENTA(self) -> str:
        return self._c("\033[95m")

    @property
    def CYAN(self) -> str:
        return self._c("\033[96m")

    @property
    def WHITE(self) -> str:
        return self._c("\033[97m")

    @property
    def GRAY(self) -> str:
        return self._c("\033[90m")

    @property
    def BRIGHT_CYAN(self) -> str:
        return self._c("\033[96;1m")

    @property
    def BRIGHT_WHITE(self) -> str:
        return self._c("\033[97;1m")

    @property
    def BRIGHT_GREEN(self) -> str:
        return self._c("\033[92;1m")

    @property
    def BRIGHT_YELLOW(self) -> str:
        return self._c("\033[93;1m")



def load_dotenv(path: Path) -> dict[str, str]:
    """Parse key=value pairs from a .env file safely."""
    values: dict[str, str] = {}
    if not path.exists():
        return values

    try:
        with path.open("r", encoding="utf-8") as handle:
            for raw_line in handle:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue

                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
                    value = value[1:-1]
                values[key] = value
    except OSError as exc:
        print(f"[Warning] Could not read .env file at {path}: {exc}", file=sys.stderr)
    return values


def resolve_python_executable() -> str:
    """Detect virtual environment Python or fallback to current executable."""
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


def is_port_in_use(host: str, port: int) -> bool:
    """Check if the given host and port are already in use."""
    check_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((check_host, port)) == 0


def find_next_available_port(host: str, start_port: int, max_attempts: int = 50) -> int:
    """Find the next open port starting from start_port."""
    port = start_port
    while port < start_port + max_attempts:
        if not is_port_in_use(host, port):
            return port
        port += 1
    raise RuntimeError(f"Could not find an available port in range {start_port} - {start_port + max_attempts}")


def check_node_environment(ansi: Ansi) -> str:
    """Verify Node.js is installed and available in PATH."""
    node_path = shutil.which("node")
    if not node_path:
        print(
            f"\n{ansi.RED}{ansi.BOLD}[ApexMind Error]{ansi.RESET} Node.js was not found in your system PATH!\n"
            f"{ansi.BOLD}Resolution:{ansi.RESET}\n"
            f" 1. Download and install Node.js (v18+ LTS recommended) from {ansi.CYAN}https://nodejs.org{ansi.RESET}\n"
            f" 2. Ensure Node.js is added to your environment PATH and reopen your terminal.\n",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        res = subprocess.run([node_path, "-v"], capture_output=True, text=True, check=True)
        version_str = res.stdout.strip()
        # Parse major version
        major = int(version_str.lstrip("v").split(".")[0])
        if major < 18:
            print(
                f"{ansi.YELLOW}[ApexMind Warning]{ansi.RESET} Node.js {version_str} is detected. "
                f"Vite and modern tooling recommend Node.js 18+.",
                file=sys.stderr,
            )
        return version_str
    except Exception:
        return "Unknown"


def ensure_frontend_dependencies(auto_install: bool, ansi: Ansi) -> None:
    """Check if node_modules and Vite binary exist; offer auto-install if missing."""
    if VITE_BIN.exists():
        return

    print(
        f"\n{ansi.YELLOW}{ansi.BOLD}[ApexMind Notice]{ansi.RESET} Vite binary not found at:\n  {VITE_BIN}\n"
        f"Frontend dependencies (node_modules) appear to be missing.",
        file=sys.stderr,
    )

    should_install = auto_install or os.environ.get("AUTO_INSTALL_FRONTEND", "").strip().lower() == "true"
    npm_path = shutil.which("npm") or shutil.which("npm.cmd") or "npm"

    if should_install:
        print(f"{ansi.CYAN}[ApexMind]{ansi.RESET} Running {npm_path} install...", file=sys.stderr)
        res = subprocess.run([npm_path, "install"], cwd=str(PROJECT_ROOT))
        if res.returncode != 0:
            print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} 'npm install' failed with exit code {res.returncode}", file=sys.stderr)
            sys.exit(res.returncode or 1)
        if VITE_BIN.exists():
            print(f"{ansi.GREEN}[ApexMind]{ansi.RESET} Frontend dependencies installed successfully!\n")
            return

    print(
        f"\n{ansi.BOLD}Please install dependencies before running:{ansi.RESET}\n"
        f"  {ansi.CYAN}npm install{ansi.RESET}\n"
        f"Or run: {ansi.CYAN}python script/frontend.py --install{ansi.RESET}\n",
        file=sys.stderr,
    )
    sys.exit(1)


def is_server_ready(host: str, port: int) -> bool:
    """Probe if Vite HTTP server is responding."""
    probe_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host
    connection = http.client.HTTPConnection(probe_host, port, timeout=1.0)
    try:
        connection.request("GET", "/")
        response = connection.getresponse()
        return 200 <= response.status < 400
    except (OSError, http.client.HTTPException):
        return False
    finally:
        connection.close()


def wait_for_frontend(
    host: str,
    port: int,
    proc: subprocess.Popen | None = None,
    timeout_seconds: int = 30,
) -> float:
    """Silently wait for Vite HTTP server to respond without writing partial dot characters to stdout."""
    probe_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host
    url = f"http://{probe_host}:{port}"
    deadline = time.time() + timeout_seconds
    start_time = time.time()

    while time.time() < deadline:
        if proc is not None and proc.poll() is not None:
            raise RuntimeError(f"Vite server exited prematurely with code {proc.poll()}")

        if is_server_ready(host, port):
            return time.time() - start_time
        time.sleep(0.15)

    raise TimeoutError(f"The Vite frontend did not become ready at {url} within {timeout_seconds} seconds.")


def format_log(mod_name: str, message: str, level: str = "INFO", ansi: Ansi | None = None) -> str:
    """Format console log lines with exact badges, module padding, and timestamps matching backend logger."""
    now = datetime.now().strftime("%H:%M:%S")
    a = ansi or Ansi(enabled=True)

    timestamp = f"{a.GRAY}[{now}]{a.RESET}"

    lvl = level.upper()
    if lvl in ("ERROR", "FATAL"):
        badge = "\033[41m\033[97m\033[1m ERROR \033[0m"
    elif lvl in ("WARN", "WARNING"):
        badge = "\033[43m\033[30m\033[1m  WARN \033[0m"
    elif lvl in ("SUCCESS", "OK"):
        badge = "\033[42m\033[30m\033[1m   OK  \033[0m"
    elif lvl in ("ACTION", "EVENT"):
        badge = "\033[45m\033[97m\033[1m ACTION\033[0m"
    elif lvl == "DEBUG":
        badge = "\033[100m\033[97m\033[1m DEBUG \033[0m"
    else:
        badge = f"\033[44m\033[97m\033[1m  {lvl:<4} \033[0m"

    module_colors = {
        "Database": a.BRIGHT_GREEN,
        "Gemini": a.MAGENTA,
        "Workspace": a.BLUE,
        "Studio": a.BLUE,
        "YouTube": a.RED,
        "Notifications": a.YELLOW,
        "Dashboard": a.CYAN,
        "HTTP": a.CYAN,
        "Server": a.CYAN,
        "Auth": a.GREEN,
        "AuthGuard": a.YELLOW,
        "Router": a.MAGENTA,
        "Profile": a.MAGENTA,
        "Settings": a.GRAY,
        "App": a.BRIGHT_WHITE,
        "Vite": a.MAGENTA,
        "HMR": a.GREEN,
        "Plugins": a.YELLOW,
    }
    col = module_colors.get(mod_name, a.CYAN)
    tag = f"{col}{a.BOLD}[{mod_name:<10}]{a.RESET}"

    if lvl in ("ERROR", "FATAL"):
        msg_colored = f"{a.RED}{message}{a.RESET}"
    elif lvl in ("WARN", "WARNING"):
        msg_colored = f"{a.YELLOW}{message}{a.RESET}"
    elif lvl in ("SUCCESS", "OK"):
        msg_colored = f"{a.GREEN}{message}{a.RESET}"
    elif lvl in ("ACTION", "EVENT"):
        msg_colored = f"{a.CYAN}{message}{a.RESET}"
    else:
        msg_colored = f"{a.WHITE}{message}{a.RESET}"

    return f"{timestamp} {badge} {tag} {msg_colored}"


def print_frontend_banner(display_host: str, port: int, node_version: str, with_backend: bool, ansi: Ansi) -> None:
    """Renders a stylized startup banner in the console with exact column padding."""
    lines = [
        ("Runtime", f"Node.js {node_version}", ansi.CYAN),
        ("Frontend URL", f"http://{display_host}:{port}", ansi.WHITE),
        (
            "Backend Start",
            "Enabled (FastAPI alongside Vite)" if with_backend else "Disabled (Run 'npm run dev' to start both)",
            ansi.GREEN if with_backend else ansi.GRAY,
        ),
        ("Mode", "Development (Vite HMR Active)", ansi.CYAN),
    ]
    width = 76

    try:
        b_tl, b_tr, b_bl, b_br, b_ml, b_mr, b_h, b_v = "╔", "╗", "╚", "╝", "╠", "╣", "═", "║"
        banner_top = f"{ansi.CYAN}{b_tl}{b_h * width}{b_tr}{ansi.RESET}"
        banner_mid = f"{ansi.CYAN}{b_ml}{b_h * width}{b_mr}{ansi.RESET}"
        banner_bot = f"{ansi.CYAN}{b_bl}{b_h * width}{b_br}{ansi.RESET}"
        v_bar = f"{ansi.CYAN}{b_v}{ansi.RESET}"

        title_text = "APEXMIND STUDIO AI  —  FRONTEND DEV SERVER"
        title_pad = width - len(title_text) - 3
        title_line = f"{v_bar}   {ansi.WHITE}{ansi.BOLD}{title_text}{ansi.RESET}{' ' * max(0, title_pad)}{v_bar}"

        content_lines = []
        for label, val, color in lines:
            prefix = f"   {label:<14}: "
            raw_len = len(prefix) + len(val)
            pad = width - raw_len
            line = f"{v_bar}{ansi.GRAY}{prefix}{ansi.RESET}{color}{val}{ansi.RESET}{' ' * max(0, pad)}{v_bar}"
            content_lines.append(line)

        output = "\n" + "\n".join([banner_top, title_line, banner_mid] + content_lines + [banner_bot]) + "\n"
        print(output)
    except (UnicodeEncodeError, Exception):
        print(f"\n[{ansi.WHITE}{ansi.BOLD}APEXMIND STUDIO AI — FRONTEND DEV SERVER{ansi.RESET}]")
        for label, val, color in lines:
            print(f"  {label:<14}: {color}{val}{ansi.RESET}")
        print()


def terminate_process_tree(proc: subprocess.Popen | None) -> None:
    """Kills a process and all its descendants cleanly across platforms."""
    if proc is None:
        return
    try:
        if proc.poll() is None:
            if sys.platform == "win32":
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    check=False,
                )
            else:
                proc.terminate()
                try:
                    proc.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    proc.kill()
    except Exception:
        pass


frontend_process: subprocess.Popen | None = None
backend_process: subprocess.Popen | None = None
ansi_global: Ansi = Ansi(enabled=True)


def stop_all(exit_code: int = 0) -> None:
    """Stops both Vite and FastAPI processes cleanly and prints exit notice."""
    global backend_process, frontend_process
    print(f"\n{ansi_global.YELLOW}[ApexMind]{ansi_global.RESET} Stopping services (Vite & FastAPI)...")
    terminate_process_tree(backend_process)
    terminate_process_tree(frontend_process)
    print(f"{ansi_global.GREEN}[ApexMind] Studio stopped cleanly. Goodbye!{ansi_global.RESET}\n")
    sys.exit(exit_code)


def handle_signal(signum=None, frame=None):
    stop_all(0)


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for frontend runner."""
    parser = argparse.ArgumentParser(
        description="ApexMind Studio AI Frontend & Full-Stack Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python script/frontend.py                    # Start Vite frontend alone\n"
            "  python script/frontend.py --with-backend     # Start Vite frontend and Python backend\n"
            "  python script/frontend.py --open             # Start and open browser\n"
            "  python script/frontend.py --auto-port        # Auto-resolve port conflicts\n"
            "  python script/frontend.py --check-only       # Pre-flight health check only\n"
        ),
    )
    parser.add_argument("--with-backend", action="store_true", help="Start the Python FastAPI backend alongside the frontend")
    parser.add_argument("--host", help="Frontend host to bind (overrides FRONTEND_HOST or HOST)")
    parser.add_argument("--port", "-p", type=int, help="Frontend port to bind (overrides FRONTEND_PORT)")
    parser.add_argument("--backend-host", help="Custom host to pass to backend")
    parser.add_argument("--backend-port", type=int, help="Custom port to pass to backend")
    parser.add_argument("--kill-port", "-k", action="store_true", help="Force-terminate any process currently occupying the port")
    parser.add_argument("--force", "-f", action="store_true", help="Alias for --kill-port")
    parser.add_argument("--auto-port", "-a", action="store_true", help="Automatically pick the next available port if chosen port is occupied")
    parser.add_argument("--open", "-o", action="store_true", help="Automatically open browser once frontend is ready")
    parser.add_argument("--timeout", "-t", type=int, default=30, help="Maximum seconds to wait for frontend readiness (default: 30)")
    parser.add_argument("--check-only", "-c", action="store_true", help="Perform pre-flight health checks and exit")
    parser.add_argument("--install", "-i", action="store_true", help="Auto-install frontend dependencies with npm install if missing")
    parser.add_argument("--env-file", type=Path, default=DOTENV_PATH, help="Path to custom .env file")
    parser.add_argument("--no-color", action="store_true", help="Disable ANSI color output")
    return parser.parse_args()


def main() -> int:
    global frontend_process, backend_process, ansi_global

    enable_windows_kill_on_close()

    args = parse_args()

    use_color = not args.no_color and sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
    ansi = Ansi(enabled=use_color)
    ansi_global = ansi

    env = {**load_dotenv(args.env_file), **os.environ}

    # 1. Pre-flight checks
    node_version = check_node_environment(ansi)
    ensure_frontend_dependencies(auto_install=args.install, ansi=ansi)

    # 2. Port and host resolution
    host = (args.host or env.get("FRONTEND_HOST") or env.get("HOST") or "127.0.0.1").strip() or "127.0.0.1"
    raw_port = args.port if args.port is not None else env.get("FRONTEND_PORT", "5173")
    try:
        port = int(raw_port)
    except (TypeError, ValueError):
        print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} FRONTEND_PORT must be an integer, got: '{raw_port}'", file=sys.stderr)
        return 1

    if not 1 <= port <= 65535:
        print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} Port must be between 1 and 65535, got: {port}", file=sys.stderr)
        return 1

    # 3. Port conflict handling
    if is_port_in_use(host, port):
        occupied_pid = find_process_on_port(port)
        if args.kill_port or args.force:
            if occupied_pid:
                print(f"{ansi.YELLOW}[ApexMind Notice]{ansi.RESET} Port {port} is occupied by PID {occupied_pid}. Terminating process tree...")
                kill_process_by_pid(occupied_pid)
                time.sleep(0.6)
            if not is_port_in_use(host, port):
                print(f"{ansi.GREEN}[ApexMind]{ansi.RESET} Port {port} freed successfully!")
            else:
                print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} Could not free port {port}. Please specify another port.", file=sys.stderr)
                return 1
        elif args.auto_port:
            next_port = find_next_available_port(host, port + 1)
            print(f"{ansi.YELLOW}[ApexMind Notice]{ansi.RESET} Port {port} is occupied. Auto-switching to available port {ansi.GREEN}{next_port}{ansi.RESET}")
            port = next_port
        else:
            pid_info = f" by process PID {ansi.WHITE}{occupied_pid}{ansi.RESET}" if occupied_pid else ""
            print(
                f"\n{ansi.RED}{ansi.BOLD}[ApexMind Error]{ansi.RESET} Port {ansi.WHITE}{port}{ansi.RESET} is already in use{pid_info}!\n"
                f"{ansi.BOLD}Resolution:{ansi.RESET}\n"
                f" - Auto-terminate & restart: {ansi.CYAN}python script/frontend.py --kill-port{ansi.RESET}\n"
                f" - Auto-assign free port:    {ansi.CYAN}python script/frontend.py --auto-port{ansi.RESET}\n"
                f" - Specify another port:     {ansi.CYAN}python script/frontend.py --port {port + 1}{ansi.RESET}\n",
                file=sys.stderr,
            )
            return 1

    if args.check_only:
        print(f"\n{ansi.GREEN}{ansi.BOLD}[ApexMind OK]{ansi.RESET} Frontend pre-flight checks passed successfully!")
        print(f"  Node.js:  {node_version}")
        print(f"  Vite Bin: {VITE_BIN}")
        print(f"  Host:     {host}")
        print(f"  Port:     {port} (Available)")
        return 0

    display_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host

    print_frontend_banner(display_host, port, node_version, args.with_backend, ansi)

    # Register OS signals for graceful termination
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, handle_signal)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, handle_signal)

    # 4. Launch Vite server process
    vite_command = [
        "node",
        str(VITE_BIN),
        str(FRONTEND_ROOT),
        "--config",
        str(VITE_CONFIG),
        "--host",
        host,
        "--port",
        str(port),
        "--strictPort",
    ]

    try:
        frontend_process = subprocess.Popen(
            vite_command,
            cwd=str(PROJECT_ROOT),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            stdin=subprocess.DEVNULL,
        )
    except FileNotFoundError as exc:
        print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} Failed to execute Node.js: {exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} Failed to launch Vite dev server: {exc}", file=sys.stderr)
        return 1

    ready_logged = threading.Event()

    def stream_vite_logs():
        if frontend_process is None or frontend_process.stdout is None:
            return
        for raw_line in iter(frontend_process.stdout.readline, ""):
            line = raw_line.strip()
            if not line:
                continue

            # Strip ANSI escape codes
            clean = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", line).strip()

            if "Console Ninja" in clean:
                continue

            if "[APEX_LOG]" in clean:
                payload = clean.split("[APEX_LOG]", 1)[1].strip()
                parts = payload.split("|", 2)
                if len(parts) == 3:
                    lvl, mod, msg = parts[0].strip(), parts[1].strip(), parts[2].strip()
                    print(format_log(mod, msg, level=lvl, ansi=ansi))
                elif len(parts) == 2:
                    mod, msg = parts[0].strip(), parts[1].strip()
                    print(format_log(mod, msg, ansi=ansi))
                continue

            if "ready in" in clean.lower():
                if not ready_logged.is_set():
                    ready_logged.set()
                    print(format_log("Vite", clean, ansi=ansi))
                    print(format_log("Server", f"Local: http://{display_host}:{port}/", ansi=ansi))
                    print(format_log("App", "Client runtime active: React 19 + TailwindCSS v4", ansi=ansi))
                    print(format_log("App", "Features active: Workspace • YouTube • Notifications • Dashboard", ansi=ansi))
                continue

            if "Local:" in clean or "Network:" in clean:
                continue

            if "page reload" in clean.lower() or "hmr" in clean.lower():
                print(format_log("HMR", clean, ansi=ansi))
                continue

            if "error" in clean.lower():
                print(format_log("Vite", clean, level="ERROR", ansi=ansi))
                continue

            if "warn" in clean.lower():
                print(format_log("Vite", clean, level="WARN", ansi=ansi))
                continue

            if ready_logged.is_set() and clean:
                print(format_log("Vite", clean, ansi=ansi))

    reader_thread = threading.Thread(target=stream_vite_logs, daemon=True)
    reader_thread.start()

    # 5. Wait for frontend readiness
    try:
        elapsed = wait_for_frontend(host, port, proc=frontend_process, timeout_seconds=args.timeout)
        if not ready_logged.wait(timeout=0.8):
            ready_logged.set()
            print(format_log("Vite", f"VITE v8.3.4 ready in {int(elapsed * 1000)} ms", ansi=ansi))
            print(format_log("Server", f"Local: http://{display_host}:{port}/", ansi=ansi))
            print(format_log("App", "Client runtime active: React 19 + TailwindCSS v4", ansi=ansi))
            print(format_log("App", "Features active: Workspace • YouTube • Notifications • Dashboard", ansi=ansi))
    except (TimeoutError, RuntimeError) as exc:
        print(f"\n{ansi.RED}{ansi.BOLD}[ApexMind Error]{ansi.RESET} {exc}", file=sys.stderr)
        stop_all(1)

    # Auto-open browser if requested
    if args.open or env.get("OPEN_BROWSER", "").strip().lower() == "true":
        url = f"http://{display_host}:{port}"
        print(format_log("Server", f"Opening {url} in your default browser...", ansi=ansi))
        webbrowser.open(url)

    # 6. Launch Backend if requested
    if args.with_backend:
        backend_py = PROJECT_ROOT / "script" / "backend.py"
        if not backend_py.exists():
            print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} backend.py not found at {backend_py}", file=sys.stderr)
            stop_all(1)

        python_exec = resolve_python_executable()
        backend_cmd = [python_exec, str(backend_py)]
        if args.backend_host:
            backend_cmd.extend(["--host", args.backend_host])
        if args.backend_port:
            backend_cmd.extend(["--port", str(args.backend_port)])

        try:
            backend_process = subprocess.Popen(
                backend_cmd,
                cwd=str(PROJECT_ROOT),
                env=env,
                stdin=subprocess.DEVNULL,
            )
        except Exception as exc:
            print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} Failed to start backend process: {exc}", file=sys.stderr)
            stop_all(1)

    # 7. Supervision loop
    try:
        while True:
            f_status = frontend_process.poll()
            if f_status is not None:
                if f_status != 0:
                    print(f"\n{ansi.RED}[ApexMind]{ansi.RESET} Frontend process exited with code {f_status}")
                stop_all(f_status)
                break

            if backend_process is not None:
                b_status = backend_process.poll()
                if b_status is not None:
                    if b_status != 0:
                        print(f"\n{ansi.RED}[ApexMind]{ansi.RESET} Backend terminated unexpectedly with code {b_status}")
                    stop_all(b_status)
                    break

            time.sleep(0.3)
    except KeyboardInterrupt:
        stop_all(0)

    return 0



if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n[ApexMind] Interrupted. Exiting.")
        sys.exit(0)
