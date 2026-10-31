#!/usr/bin/env python3
"""
ApexMind Studio - High-Performance Backend Runner
Provides pre-flight diagnostics, automatic port conflict detection,
dependency verification, structured error handling, and clean process lifecycle.
"""

from __future__ import annotations

import os
import sys
import warnings

# Suppress harmless Google API Core Python 3.11 EOL FutureWarnings
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ["PYTHONWARNINGS"] = "ignore::FutureWarning"

import argparse
import ctypes
from ctypes import wintypes
import http.client
import importlib.util
import os
from pathlib import Path
import shlex
import signal
import socket
import subprocess
import sys
import threading
import time
import traceback
import webbrowser

# Ensure project root is at the head of sys.path so 'backend.*' imports succeed
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    import uvicorn
    from uvicorn.supervisors.basereload import BaseReload
    from backend.shared.logger import get_uvicorn_log_config
except (ImportError, AttributeError):
    uvicorn = None  # type: ignore[assignment]
    get_uvicorn_log_config = None  # type: ignore[assignment]
    BaseReload = None  # type: ignore[assignment]


def _handle_import_interrupt(_signum, _frame) -> None:
    sys.stdout.write("\n[ApexMind] Ctrl+C received. Stopping backend server...\n")
    sys.stdout.flush()
    raise SystemExit(130)


signal.signal(signal.SIGINT, _handle_import_interrupt)
if hasattr(signal, "SIGBREAK"):
    signal.signal(signal.SIGBREAK, _handle_import_interrupt)

DOTENV_PATH = PROJECT_ROOT / ".env"
MIN_PYTHON_VERSION = (3, 10)

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


_WINDOWS_CTRL_HANDLER_REF = None
_stop_message_printed = False


def print_stop_message(reason: str = "Ctrl+C received", ansi: Ansi | None = None) -> None:
    """Print immediate stopping feedback when interrupt or stop signal is received."""
    global _stop_message_printed
    if _stop_message_printed:
        return
    _stop_message_printed = True
    if ansi and getattr(ansi, "enabled", False):
        sys.stdout.write(f"\n{ansi.YELLOW}[ApexMind]{ansi.RESET} {reason}. Stopping backend server...\n")
    else:
        sys.stdout.write(f"\n[ApexMind] {reason}. Stopping backend server...\n")
    sys.stdout.flush()


def register_windows_ctrl_handler(callback) -> None:
    """Register Windows ConsoleCtrlHandler for instantaneous interrupt notification."""
    global _WINDOWS_CTRL_HANDLER_REF
    if sys.platform != "win32":
        return

    try:
        HandlerRoutine = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.DWORD)

        def _console_ctrl_handler(ctrl_type: int) -> bool:
            # 0: CTRL_C_EVENT, 1: CTRL_BREAK_EVENT, 2: CTRL_CLOSE_EVENT
            if ctrl_type in (0, 1, 2):
                try:
                    callback()
                except Exception:
                    pass
            return False

        _WINDOWS_CTRL_HANDLER_REF = HandlerRoutine(_console_ctrl_handler)
        ctypes.windll.kernel32.SetConsoleCtrlHandler(_WINDOWS_CTRL_HANDLER_REF, True)
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

    @property
    def BRIGHT_MAGENTA(self) -> str:
        return self._c("\033[95;1m")

    @property
    def BRIGHT_BLUE(self) -> str:
        return self._c("\033[94;1m")

    @property
    def BRIGHT_RED(self) -> str:
        return self._c("\033[91;1m")

    @property
    def UNDERLINE(self) -> str:
        return self._c("\033[4m")


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


def check_python_version(ansi: Ansi) -> None:
    """Validate that the Python runtime meets minimum requirements."""
    if sys.version_info < MIN_PYTHON_VERSION:
        min_ver_str = ".".join(map(str, MIN_PYTHON_VERSION))
        cur_ver_str = ".".join(map(str, sys.version_info[:3]))
        print(
            f"{ansi.RED}{ansi.BOLD}[ApexMind Error]{ansi.RESET} Python {cur_ver_str} is below minimum requirement ({min_ver_str}+).\n"
            f"Please run using Python {min_ver_str} or newer.",
            file=sys.stderr,
        )
        sys.exit(1)


def check_dependencies(python_executable: str, env: dict[str, str], auto_install: bool, ansi: Ansi) -> None:
    """Verify required Python packages and offer clear remediation."""
    required_packages = {
        "uvicorn": "uvicorn>=0.30.0",
        "fastapi": "fastapi>=0.111.0",
        "pydantic": "pydantic>=2.7.0",
        "dotenv": "python-dotenv>=1.0.0",
    }

    missing: list[str] = []
    for mod_name in required_packages:
        if importlib.util.find_spec(mod_name) is None:
            missing.append(mod_name)

    if not missing:
        return

    missing_specs = [required_packages[m] for m in missing]
    print(
        f"\n{ansi.YELLOW}{ansi.BOLD}[ApexMind Warning]{ansi.RESET} Missing Python dependencies: {ansi.WHITE}{', '.join(missing)}{ansi.RESET}",
        file=sys.stderr,
    )

    should_install = auto_install or env.get("AUTO_INSTALL_DEPS", "").strip().lower() == "true"
    req_file = PROJECT_ROOT / "requirements.txt"

    if should_install:
        print(f"{ansi.CYAN}[ApexMind]{ansi.RESET} Installing missing dependencies...", file=sys.stderr)
        cmd = [python_executable, "-m", "pip", "install", *missing_specs]
        res = subprocess.run(cmd, cwd=str(PROJECT_ROOT))
        if res.returncode != 0:
            print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} pip install failed with code {res.returncode}", file=sys.stderr)
            sys.exit(res.returncode or 1)
        print(f"{ansi.GREEN}[ApexMind]{ansi.RESET} Dependencies installed successfully!\n")
        return

    install_cmd = f'"{python_executable}" -m pip install {" ".join(missing_specs)}'
    req_cmd = f'"{python_executable}" -m pip install -r requirements.txt' if req_file.exists() else install_cmd

    print(f"\n{ansi.BOLD}To install missing packages, run:{ansi.RESET}", file=sys.stderr)
    print(f"  {ansi.CYAN}{req_cmd}{ansi.RESET}\n", file=sys.stderr)
    print(f"Or re-run with: {ansi.CYAN}python script/backend.py --install{ansi.RESET}\n", file=sys.stderr)
    sys.exit(1)


def validate_application_import(ansi: Ansi) -> None:
    """Pre-test importing create_app to catch runtime or syntax errors gracefully."""
    try:
        importlib.import_module("backend.app.factory")
    except Exception as exc:
        tb = traceback.format_exc()
        print(
            f"\n{ansi.RED}{ansi.BOLD}[ApexMind Startup Error]{ansi.RESET} Failed to load backend application:\n"
            f"{ansi.YELLOW}{tb}{ansi.RESET}\n"
            f"{ansi.BOLD}Troubleshooting suggestions:{ansi.RESET}\n"
            f" 1. Verify all dependencies are installed: {ansi.CYAN}pip install -r requirements.txt{ansi.RESET}\n"
            f" 2. Check recent edits in {ansi.CYAN}backend/app{ansi.RESET} or {ansi.CYAN}backend/features{ansi.RESET}\n"
            f" 3. Verify .env file syntax and permissions\n",
            file=sys.stderr,
        )
        sys.exit(1)


def ensure_data_directory(ansi: Ansi) -> None:
    """Ensure backend/data directory exists for SQLite storage."""
    data_dir = PROJECT_ROOT / "backend" / "data"
    try:
        data_dir.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        print(f"{ansi.YELLOW}[ApexMind Warning]{ansi.RESET} Could not create data directory at {data_dir}: {exc}")


def check_api_key_configuration(env: dict[str, str], ansi: Ansi) -> None:
    """Check if GEMINI_API_KEY is configured and provide a helpful hint if missing."""
    key = env.get("GEMINI_API_KEY", "").strip()
    if not key or key == "MY_GEMINI_API_KEY":
        print(
            f"{ansi.YELLOW}[Notice]{ansi.RESET} GEMINI_API_KEY is not configured or using default placeholder.\n"
            f"         AI features will run in mock/fallback mode until a valid key is set in .env."
        )


def launch_browser_when_ready(host: str, port: int, probe_path: str = "/api/health", target_path: str = "/api/docs", timeout: float = 10.0) -> None:
    """Background helper to open browser once backend responds."""
    def _worker():
        deadline = time.time() + timeout
        probe_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host
        while time.time() < deadline:
            try:
                conn = http.client.HTTPConnection(probe_host, port, timeout=0.8)
                conn.request("GET", probe_path)
                resp = conn.getresponse()
                conn.close()
                if 200 <= resp.status < 500:
                    time.sleep(0.3)
                    url = f"http://{probe_host}:{port}{target_path}"
                    webbrowser.open(url)
                    return
            except (OSError, http.client.HTTPException):
                pass
            time.sleep(0.3)

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()


def parse_args() -> argparse.Namespace:
    """Construct CLI argument parser for backend server."""
    parser = argparse.ArgumentParser(
        description="ApexMind Studio AI Backend Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python script/backend.py                     # Start in development mode with auto-reload\n"
            "  python script/backend.py --port 8001         # Start on port 8001\n"
            "  python script/backend.py --open              # Open Swagger docs in browser\n"
            "  python script/backend.py --check-only        # Run preflight checks and exit\n"
            "  python script/backend.py --install           # Auto-install missing packages\n"
        ),
    )
    parser.add_argument("--host", help="Server host to bind (overrides HOST env var)")
    parser.add_argument("--port", "-p", type=int, help="Server port to bind (overrides PORT env var)")
    parser.add_argument("--reload", dest="reload", action="store_true", default=None, help="Force enable auto-reload")
    parser.add_argument("--no-reload", dest="reload", action="store_false", help="Disable auto-reload")
    parser.add_argument("--log-level", choices=["debug", "info", "warning", "error", "critical", "trace"], help="Uvicorn log level")
    parser.add_argument("--workers", "-w", type=int, default=1, help="Number of worker processes (production)")
    parser.add_argument("--kill-port", "-k", action="store_true", help="Force-terminate any process currently occupying the port")
    parser.add_argument("--force", "-f", action="store_true", help="Alias for --kill-port")
    parser.add_argument("--auto-port", "-a", action="store_true", help="Automatically pick the next available port if chosen port is occupied")
    parser.add_argument("--open", "-o", action="store_true", help="Open Swagger API documentation in browser when ready")
    parser.add_argument("--check-only", "-c", action="store_true", help="Perform pre-flight health checks and exit")
    parser.add_argument("--install", "-i", action="store_true", help="Automatically install missing dependencies")
    parser.add_argument("--env-file", type=Path, default=DOTENV_PATH, help="Path to custom .env file")
    parser.add_argument("--no-color", action="store_true", help="Disable ANSI color output")
    return parser.parse_args()


def main() -> int:
    enable_windows_kill_on_close()

    args = parse_args()

    use_color = (
        not args.no_color
        and os.environ.get("NO_COLOR") is None
        and (sys.stdout.isatty() or os.environ.get("FORCE_COLOR", "").strip() not in ("", "0"))
    )
    ansi = Ansi(enabled=use_color)

    def sig_handler(signum, frame):
        print_stop_message("Ctrl+C received", ansi=ansi)
        signal.default_int_handler(signum, frame)

    signal.signal(signal.SIGINT, sig_handler)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, sig_handler)

    register_windows_ctrl_handler(lambda: print_stop_message("Ctrl+C received", ansi=ansi))

    env = {**load_dotenv(args.env_file), **os.environ}
    python_executable = resolve_python_executable()

    # 1. Pre-flight system checks
    check_python_version(ansi)
    check_dependencies(python_executable, env, auto_install=args.install, ansi=ansi)
    ensure_data_directory(ansi)

    # 2. Host & Port resolution
    host = args.host or env.get("HOST", "0.0.0.0").strip() or "0.0.0.0"
    if args.port is not None:
        port = args.port
    else:
        raw_port = env.get("PORT", "8000")
        try:
            port = int(raw_port)
        except ValueError:
            print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} PORT environment variable must be an integer, got: '{raw_port}'", file=sys.stderr)
            return 1

    if not 1 <= port <= 65535:
        print(f"{ansi.RED}[ApexMind Error]{ansi.RESET} Port must be between 1 and 65535, got: {port}", file=sys.stderr)
        return 1

    # Propagate resolved host and port into environment for FastAPI / Pydantic settings
    os.environ["PORT"] = str(port)
    os.environ["HOST"] = host
    env["PORT"] = str(port)
    env["HOST"] = host

    # 3. Port conflict check and resolution
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
                f" - Auto-terminate & restart: {ansi.CYAN}python script/backend.py --kill-port{ansi.RESET}\n"
                f" - Auto-assign free port:    {ansi.CYAN}python script/backend.py --auto-port{ansi.RESET}\n"
                f" - Specify another port:     {ansi.CYAN}python script/backend.py --port {port + 1}{ansi.RESET}\n",
                file=sys.stderr,
            )
            return 1

    # 4. App import validation
    validate_application_import(ansi)

    # 5. Check API key notice
    check_api_key_configuration(env, ansi)

    if args.check_only:
        print(f"\n{ansi.GREEN}{ansi.BOLD}[ApexMind OK]{ansi.RESET} All pre-flight checks passed successfully!")
        print(f"  Python: {sys.version.split()[0]}")
        print(f"  Host: {host}")
        print(f"  Port: {port} (Available)")
        return 0

    # 6. Mode and log level configuration
    if args.reload is not None:
        reload_enabled = args.reload
    else:
        backend_reload = env.get("BACKEND_RELOAD", "true").strip().lower()
        reload_enabled = backend_reload != "false" and env.get("NODE_ENV", "development").strip().lower() != "production"

    log_level = args.log_level or (env.get("LOG_LEVEL") or env.get("LL") or "info").strip().lower()
    if log_level not in ["debug", "info", "warning", "error", "critical", "trace"]:
        log_level = "info"

    display_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host

    # 7. Launch browser auto-open hook if requested
    if args.open:
        print(f"{ansi.CYAN}[ApexMind]{ansi.RESET} Browser auto-open scheduled for http://{display_host}:{port}/api/docs")
        launch_browser_when_ready(host, port, target_path="/api/docs")

    # 8. Start Uvicorn server
    try:
        if uvicorn is None:
            raise ImportError("uvicorn is not installed")

        uvicorn_extra_args: list[str] = []
        raw_extra = env.get("UVICORN_ARGS", "").strip()
        if raw_extra:
            uvicorn_extra_args = shlex.split(raw_extra)

        mode_str = f"{ansi.BRIGHT_GREEN}Auto-Reload Active (Watching backend/){ansi.RESET}" if reload_enabled else f"{ansi.YELLOW}Auto-Reload Disabled{ansi.RESET}"
        print(f"\n{ansi.GREEN}{ansi.BOLD}[ApexMind OK]{ansi.RESET} Backend ready at http://{display_host}:{port}/api/docs")
        print(f"{ansi.CYAN}[ApexMind]{ansi.RESET} Starting FastAPI app on http://{display_host}:{port} ({mode_str})")

        # Hook Uvicorn exit handlers so stop message prints immediately on Ctrl+C
        orig_handle_exit = uvicorn.server.Server.handle_exit

        def hooked_handle_exit(self_server, sig, frame):
            print_stop_message("Ctrl+C received", ansi=ansi)
            return orig_handle_exit(self_server, sig, frame)

        uvicorn.server.Server.handle_exit = hooked_handle_exit

        if BaseReload is not None:
            try:
                orig_reload_signal = BaseReload.signal_handler

                def hooked_reload_signal(self_reload, sig, frame):
                    print_stop_message("Ctrl+C received", ansi=ansi)
                    return orig_reload_signal(self_reload, sig, frame)

                BaseReload.signal_handler = hooked_reload_signal
            except (AttributeError, Exception):
                pass

        uvicorn.run(
            "backend.main:app",
            host=host,
            port=port,
            reload=reload_enabled,
            reload_dirs=[str(PROJECT_ROOT / "backend")] if reload_enabled else None,
            log_config=get_uvicorn_log_config(use_color=use_color),
            log_level=log_level,
            workers=args.workers if not reload_enabled else 1,
            access_log=False,
        )
        return 0
    except KeyboardInterrupt:
        print_stop_message("Ctrl+C received", ansi=ansi)
        return 0
    except SystemExit:
        return 0
    except OSError as exc:
        print(f"\n{ansi.RED}{ansi.BOLD}[ApexMind OS Error]{ansi.RESET} Failed to bind server: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"\n{ansi.RED}{ansi.BOLD}[ApexMind Fatal Error]{ansi.RESET} {exc}", file=sys.stderr)
        return 1
    finally:
        print(f"{ansi.GREEN}[ApexMind]{ansi.RESET} Backend stopped cleanly. Goodbye!\n", flush=True)



if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print_stop_message("Ctrl+C received")
        print("[ApexMind] Backend stopped cleanly. Goodbye!\n", flush=True)
        sys.exit(0)
