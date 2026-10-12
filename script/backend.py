#!/usr/bin/env python3
import os
import shlex
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOTENV_PATH = PROJECT_ROOT / ".env"


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
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
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


def parse_env() -> dict[str, str]:
    return {**load_dotenv(DOTENV_PATH), **os.environ}


def get_port(env: dict[str, str]) -> int:
    value = env.get("PORT", "8000")
    try:
        port = int(value)
    except ValueError as exc:
        raise ValueError(f'PORT must be an integer between 1 and 65535. Received: "{value}"') from exc

    if not 1 <= port <= 65535:
        raise ValueError(f'PORT must be an integer between 1 and 65535. Received: "{value}"')
    return port


def get_host(env: dict[str, str]) -> str:
    raw = env.get("HOST", "0.0.0.0").strip()
    return raw or "0.0.0.0"


def should_enable_reload(env: dict[str, str]) -> bool:
    backend_reload = env.get("BACKEND_RELOAD", "true").strip().lower()
    if backend_reload == "false":
        return False
    return env.get("NODE_ENV", "development").strip().lower() != "production"


def get_log_level(env: dict[str, str]) -> str:
    level = (env.get("LOG_LEVEL") or env.get("LL") or "info").strip().lower()
    allowed = ["debug", "info", "warning", "error", "critical", "trace"]
    return level if level in allowed else "info"


def parse_uvicorn_args(env: dict[str, str]) -> list[str]:
    raw_value = env.get("UVICORN_ARGS", "").strip()
    if not raw_value:
        return []
    return shlex.split(raw_value)


def module_exists(python_executable: str, module_name: str) -> bool:
    command = [
        python_executable,
        "-c",
        (
            "import importlib.util, sys; "
            f"sys.exit(0 if importlib.util.find_spec({module_name!r}) else 1)"
        ),
    ]
    completed = subprocess.run(command, capture_output=True, text=True)
    return completed.returncode == 0


def ensure_python_dependencies(python_executable: str, env: dict[str, str]) -> None:
    required_modules = ["uvicorn"]
    missing = [module for module in required_modules if not module_exists(python_executable, module)]

    if not missing:
        return

    module_list = ", ".join(missing)
    install_command = f'"{python_executable}" -m pip install {" ".join(missing)}'

    print(f"Missing Python dependency: {module_list}", file=sys.stderr)
    print(f"Install it with: {install_command}", file=sys.stderr)

    if env.get("AUTO_INSTALL_DEPS", "").strip().lower() == "true":
        print("AUTO_INSTALL_DEPS is enabled; installing missing backend dependencies...", file=sys.stderr)
        completed = subprocess.run(
            [python_executable, "-m", "pip", "install", *missing],
            cwd=str(PROJECT_ROOT),
            env=env,
        )
        if completed.returncode != 0:
            raise SystemExit(completed.returncode or 1)
        return

    raise SystemExit(1)


def main() -> int:
    env = parse_env()
    python_executable = resolve_python_executable()
    host = get_host(env)
    port = get_port(env)
    reload_enabled = should_enable_reload(env)
    log_level = get_log_level(env)
    extra_args = parse_uvicorn_args(env)

    ensure_python_dependencies(python_executable, env)

    command = [
        python_executable,
        "-m",
        "uvicorn",
        "backend.main:app",
    ]

    if reload_enabled:
        command.extend(["--reload", "--reload-dir", str(PROJECT_ROOT / "backend")])

    command.extend(["--host", host, "--port", str(port), "--log-level", log_level, *extra_args])

    print("=" * 60)
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Backend runtime: {python_executable}")
    print(f"Serving {host}:{port}")
    print(f"Mode: {'development (auto-reload enabled)' if reload_enabled else 'production'}")
    print(f"Log level: {log_level}")
    print("=" * 60)

    completed = subprocess.run(command, cwd=str(PROJECT_ROOT), env=env)
    return completed.returncode


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
