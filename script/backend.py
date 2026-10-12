#!/usr/bin/env python3
"""
ApexMind Studio - High-Performance Backend Runner
Provides pre-flight diagnostics, automatic port conflict detection,
dependency verification, structured error handling, and clean process lifecycle.
"""

from __future__ import annotations

import argparse
import http.client
import importlib.util
import os
import shlex
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

# Ensure project root is at the head of sys.path so 'backend.*' imports succeed
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

DOTENV_PATH = PROJECT_ROOT / ".env"
MIN_PYTHON_VERSION = (3, 10)


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
        from backend.app.factory import create_app  # noqa: F401
    except Exception as exc:
        import traceback

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
    parser.add_argument("--open", "-o", action="store_true", help="Open Swagger API documentation in browser when ready")
    parser.add_argument("--check-only", "-c", action="store_true", help="Perform pre-flight health checks and exit")
    parser.add_argument("--install", "-i", action="store_true", help="Automatically install missing dependencies")
    parser.add_argument("--env-file", type=Path, default=DOTENV_PATH, help="Path to custom .env file")
    parser.add_argument("--no-color", action="store_true", help="Disable ANSI color output")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    use_color = not args.no_color and sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
    ansi = Ansi(enabled=use_color)

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

    # 3. Port conflict check
    if is_port_in_use(host, port):
        print(
            f"\n{ansi.RED}{ansi.BOLD}[ApexMind Error]{ansi.RESET} Port {ansi.WHITE}{port}{ansi.RESET} is already in use by another process!\n"
            f"{ansi.BOLD}Resolution:{ansi.RESET}\n"
            f" - Change the port: {ansi.CYAN}python script/backend.py --port {port + 1}{ansi.RESET}\n"
            + (
                f" - Or terminate the existing process: {ansi.CYAN}netstat -ano | findstr :{port}{ansi.RESET} (Windows)\n"
                if os.name == "nt"
                else f" - Or terminate the existing process: {ansi.CYAN}lsof -i :{port}{ansi.RESET} (Unix)\n"
            ),
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

    print("=" * 64)
    print(f" {ansi.BOLD}ApexMind Studio AI — Backend Server{ansi.RESET}")
    print(f" Runtime:   {ansi.CYAN}{python_executable}{ansi.RESET}")
    print(f" Address:   {ansi.WHITE}http://{display_host}:{port}{ansi.RESET}")
    print(f" API Docs:  {ansi.CYAN}http://{display_host}:{port}/api/docs{ansi.RESET}")
    print(f" Mode:      {ansi.GREEN if reload_enabled else ansi.YELLOW}{'Development (auto-reload)' if reload_enabled else 'Production'}{ansi.RESET}")
    print(f" Log Level: {log_level}")
    print("=" * 64)

    # 7. Launch browser auto-open hook if requested
    if args.open:
        print(f"{ansi.CYAN}[ApexMind]{ansi.RESET} Browser auto-open scheduled for http://{display_host}:{port}/api/docs")
        launch_browser_when_ready(host, port, target_path="/api/docs")

    # 8. Start Uvicorn server
    try:
        import uvicorn
        from backend.shared.logger import get_uvicorn_log_config

        uvicorn_extra_args: list[str] = []
        raw_extra = env.get("UVICORN_ARGS", "").strip()
        if raw_extra:
            uvicorn_extra_args = shlex.split(raw_extra)

        uvicorn.run(
            "backend.main:app",
            host=host,
            port=port,
            reload=reload_enabled,
            reload_dirs=[str(PROJECT_ROOT / "backend")] if reload_enabled else None,
            log_config=get_uvicorn_log_config(),
            log_level=log_level,
            workers=args.workers if not reload_enabled else 1,
        )
        return 0
    except KeyboardInterrupt:
        print(f"\n{ansi.YELLOW}[ApexMind]{ansi.RESET} Backend stopped cleanly. Goodbye!\n")
        return 0
    except OSError as exc:
        print(f"\n{ansi.RED}{ansi.BOLD}[ApexMind OS Error]{ansi.RESET} Failed to bind server: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"\n{ansi.RED}{ansi.BOLD}[ApexMind Fatal Error]{ansi.RESET} {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n[ApexMind] Interrupted. Exiting.")
        sys.exit(0)
