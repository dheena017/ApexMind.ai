"""
ApexMind Studio - High-Visibility Colored Logger
Provides rich, color-coded console formatting, module-specific tags,
HTTP request/response tracking, and stylized developer diagnostics.
"""

import logging
import os
import re
import sys
import time
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# ── ANSI Terminal Styling Codes ──────────────────────────────────────────────
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"

    # Foreground
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    GRAY = "\033[90m"

    # Bright Foreground
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"

    # Background Badges
    BG_RED = "\033[41m\033[97m\033[1m"
    BG_GREEN = "\033[42m\033[30m\033[1m"
    BG_YELLOW = "\033[43m\033[30m\033[1m"
    BG_BLUE = "\033[44m\033[97m\033[1m"
    BG_MAGENTA = "\033[45m\033[97m\033[1m"
    BG_CYAN = "\033[46m\033[30m\033[1m"
    BG_GRAY = "\033[100m\033[97m\033[1m"


class UvicornNoiseFilter(logging.Filter):
    """Filters out internal Uvicorn lifecycle noise to keep console output pristine."""
    NOISE_PHRASES = (
        "waiting for application startup",
        "waiting for application shutdown",
        "started server process",
        "finished server process",
        "shutting down",
        "application shutdown complete",
        "application startup complete",
        "will watch for changes in these directories",
        "started reloader process",
        "uvicorn running on",
    )

    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage().lower()
        return not any(phrase in msg for phrase in self.NOISE_PHRASES)


def colorize_backend_info(msg: str) -> str:
    """Intelligently syntax-highlight backend INFO log messages."""
    if "\033[" in msg:
        return msg

    clean = msg

    if "Features active:" in clean:
        parts = clean.split("Features active:", 1)
        feat_str = parts[1]
        formatted_features = (
            feat_str.replace("Workspace", f"{Colors.BRIGHT_BLUE}Workspace{Colors.RESET}")
            .replace("YouTube", f"{Colors.BRIGHT_RED}YouTube{Colors.RESET}")
            .replace("Notifications", f"{Colors.BRIGHT_YELLOW}Notifications{Colors.RESET}")
            .replace("Dashboard", f"{Colors.BRIGHT_CYAN}Dashboard{Colors.RESET}")
            .replace("Auth", f"{Colors.BRIGHT_GREEN}Auth{Colors.RESET}")
            .replace("•", f"{Colors.GRAY}•{Colors.RESET}")
        )
        return f"{Colors.WHITE}Features active:{Colors.RESET}{formatted_features}"

    if "Schema verified" in clean or "Presets verified" in clean:
        return re.sub(r"\(([^)]+)\)", rf"({Colors.BRIGHT_CYAN}\1{Colors.RESET})", clean)

    if "SQLite DB connected:" in clean:
        return re.sub(r"(connected:\s*)(.+)", rf"\1{Colors.BRIGHT_CYAN}\2{Colors.RESET}", clean)

    # Style pipe delimiters and arrows
    clean = clean.replace(" | ", f" {Colors.GRAY}|{Colors.RESET} ")
    clean = clean.replace(" -> ", f" {Colors.GRAY}➔{Colors.RESET} ")
    clean = clean.replace(" --> ", f" {Colors.GRAY}➔{Colors.RESET} ")

    # Highlight URLs
    clean = re.sub(
        r"(https?://[^\s\)]+)",
        rf"{Colors.BRIGHT_CYAN}{Colors.UNDERLINE}\1{Colors.RESET}",
        clean,
    )

    # Highlight AI Models
    clean = re.sub(
        r"\b(gemini-[\w\.\-]+|gTTS|TTS)\b",
        rf"{Colors.BRIGHT_MAGENTA}{Colors.BOLD}\1{Colors.RESET}",
        clean,
    )

    # Highlight quoted strings
    clean = re.sub(
        r"'([^']+)'",
        rf"'{Colors.BRIGHT_WHITE}{Colors.BOLD}\1{Colors.RESET}'",
        clean,
    )

    # Highlight bracketed tags
    clean = re.sub(
        r"\[([^\]]+)\]",
        rf"[{Colors.BRIGHT_YELLOW}\1{Colors.RESET}]",
        clean,
    )

    # Highlight metrics and sizes
    clean = re.sub(
        r"\b(\d+\.?\d*\s*(?:ms|s|seconds|bytes|KB|MB|GB|px|views|quotes|channels|videos|items|records|scenes))\b",
        rf"{Colors.BRIGHT_GREEN}\1{Colors.RESET}",
        clean,
        flags=re.IGNORECASE,
    )

    # Highlight ID tags
    clean = re.sub(
        r"\b(ID:\s*[\w\-]+|Unread:\s*\d+|limit:\s*\d+|count:\s*\d+)\b",
        rf"{Colors.CYAN}\1{Colors.RESET}",
        clean,
    )

    return f"{Colors.WHITE}{clean}{Colors.RESET}"


class ColoredFormatter(logging.Formatter):
    """Custom log formatter rendering colorful badges, module tags, and timestamps."""

    def __init__(self, use_color: bool | None = None):
        super().__init__()
        if use_color is None:
            use_color = sys.stdout.isatty() or os.environ.get("FORCE_COLOR", "").strip() not in ("", "0")
        self.use_color = use_color and os.environ.get("NO_COLOR") is None

    LEVEL_BADGES = {
        logging.DEBUG: "\033[100m\033[97m\033[1m DEBUG \033[0m",
        logging.INFO: "\033[44m\033[97m\033[1m  INFO \033[0m",
        logging.WARNING: "\033[43m\033[30m\033[1m  WARN \033[0m",
        logging.ERROR: "\033[41m\033[97m\033[1m ERROR \033[0m",
        logging.CRITICAL: "\033[41m\033[97m\033[1m FATAL \033[0m",
    }

    MODULE_COLORS = {
        "Database": Colors.BRIGHT_GREEN,
        "Gemini": Colors.BRIGHT_MAGENTA,
        "Workspace": Colors.BRIGHT_BLUE,
        "YouTube": Colors.BRIGHT_RED,
        "Notifications": Colors.BRIGHT_YELLOW,
        "Dashboard": Colors.BRIGHT_CYAN,
        "HTTP": Colors.CYAN,
        "Server": Colors.BRIGHT_CYAN,
        "Watcher": Colors.BRIGHT_YELLOW,
        "App": Colors.BRIGHT_CYAN,
        "Auth": Colors.BRIGHT_GREEN,
    }

    def format(self, record: logging.LogRecord) -> str:
        # 1. Format Timestamp (HH:MM:SS in Dim Gray)
        now = datetime.fromtimestamp(record.created).strftime("%H:%M:%S")
        timestamp = f"{Colors.GRAY}[{now}]{Colors.RESET}"

        # 2. Level Badge with High Contrast
        badge = self.LEVEL_BADGES.get(record.levelno, f"[{record.levelname}]")

        # 3. Determine Module Tag & Color (Map cleanly to standard 10-char width)
        raw_name = record.name.replace("ApexMind.", "").lower()
        if "uvicorn" in raw_name or "server" in raw_name:
            mod_name = "Server"
        elif "watchfiles" in raw_name or "watcher" in raw_name:
            mod_name = "Watcher"
        elif "youtube" in raw_name:
            mod_name = "YouTube"
        elif "notification" in raw_name:
            mod_name = "Notifications"
        elif "workspace" in raw_name:
            mod_name = "Workspace"
        elif "dashboard" in raw_name:
            mod_name = "Dashboard"
        elif "auth" in raw_name:
            mod_name = "Auth"
        elif "database" in raw_name:
            mod_name = "Database"
        elif "gemini" in raw_name:
            mod_name = "Gemini"
        elif "http" in raw_name:
            mod_name = "HTTP"
        else:
            mod_name = record.name.split(".")[-1].capitalize()[:10]

        tag_color = self.MODULE_COLORS.get(mod_name, Colors.CYAN)
        tag = f"{tag_color}{Colors.BOLD}[{mod_name:<10}]{Colors.RESET}"

        # 4. Message Coloring and cleaning
        msg = record.getMessage()
        if "watchfiles detected changes" in msg.lower():
            msg = "Reloading server (file change detected)..."

        if record.levelno >= logging.ERROR:
            msg_colored = f"{Colors.BRIGHT_RED}{msg}{Colors.RESET}"
        elif record.levelno == logging.WARNING:
            msg_colored = f"{Colors.BRIGHT_YELLOW}{msg}{Colors.RESET}"
        else:
            msg_colored = colorize_backend_info(msg)

        scope = f"{Colors.BRIGHT_GREEN}[Backend]{Colors.RESET}"
        formatted = f"{timestamp} {scope} {badge} {tag} {msg_colored}"
        if not self.use_color:
            return re.sub(r"\033\[[0-?]*[ -/]*[@-~]", "", formatted)
        return formatted


def get_uvicorn_log_config(use_color: bool | None = None) -> dict:
    """Provides a dictConfig dictionary for Uvicorn using ApexMind's custom colored formatter."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "apex_colored": {
                "()": "backend.shared.logger.ColoredFormatter",
                "use_color": use_color,
            },
        },
        "filters": {
            "uvicorn_noise": {
                "()": "backend.shared.logger.UvicornNoiseFilter",
            },
        },
        "handlers": {
            "apex_stream": {
                "class": "logging.StreamHandler",
                "formatter": "apex_colored",
                "filters": ["uvicorn_noise"],
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "": {"handlers": ["apex_stream"], "level": "INFO"},
            "uvicorn": {"handlers": ["apex_stream"], "level": "INFO", "propagate": False},
            "uvicorn.error": {"handlers": ["apex_stream"], "level": "INFO", "propagate": False},
            "uvicorn.access": {"handlers": ["apex_stream"], "level": "WARNING", "propagate": False},
            "watchfiles": {"handlers": ["apex_stream"], "level": "WARNING", "propagate": False},
        },
    }


def setup_colored_logging(level=logging.INFO):
    """Configures root, Uvicorn, and ApexMind loggers with the custom colored formatter."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColoredFormatter())
    handler.addFilter(UvicornNoiseFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers on root
    if not any(isinstance(h, logging.StreamHandler) and isinstance(h.formatter, ColoredFormatter) for h in root_logger.handlers):
        root_logger.handlers = [handler]

    # Hook Uvicorn and child loggers
    for u_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        u_logger = logging.getLogger(u_name)
        u_logger.handlers = [handler]
        u_logger.propagate = False
        u_logger.setLevel(logging.INFO if "access" not in u_name else logging.WARNING)

    # Silence third-party noise
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)



class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs incoming HTTP requests and responses with status codes, latency, and color coding."""

    async def dispatch(self, request: Request, call_next):
        logger = logging.getLogger("ApexMind.HTTP")
        start_time = time.perf_counter()

        method = request.method
        path = request.url.path
        path_color = Colors.BRIGHT_CYAN

        # Method Color
        method_colors = {
            "GET": Colors.BRIGHT_CYAN,
            "POST": Colors.BRIGHT_GREEN,
            "PUT": Colors.BRIGHT_YELLOW,
            "DELETE": Colors.BRIGHT_RED,
            "PATCH": Colors.BRIGHT_MAGENTA,
        }
        m_color = method_colors.get(method, Colors.WHITE)

        client_host = request.client.host if request.client else "unknown"
        logger.info(
            f"{Colors.GRAY}-->{Colors.RESET} "
            f"{m_color}{Colors.BOLD}{method:<6}{Colors.RESET} "
            f"{path_color}{path}{Colors.RESET} "
            f"{Colors.GRAY}(from {client_host}){Colors.RESET}"
        )

        try:
            response: Response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            # Status Code Color
            code = response.status_code
            if code < 300:
                code_str = f"{Colors.BRIGHT_GREEN}{code} OK{Colors.RESET}"
            elif code < 400:
                code_str = f"{Colors.BRIGHT_CYAN}{code} REDIR{Colors.RESET}"
            elif code < 500:
                code_str = f"{Colors.BRIGHT_YELLOW}{code} CLIENT ERR{Colors.RESET}"
            else:
                code_str = f"{Colors.BRIGHT_RED}{code} SERVER ERR{Colors.RESET}"

            # Latency Badge
            if duration_ms < 100:
                duration_str = f"{Colors.GREEN}{duration_ms:.1f}ms{Colors.RESET}"
            elif duration_ms < 500:
                duration_str = f"{Colors.YELLOW}{duration_ms:.1f}ms{Colors.RESET}"
            else:
                duration_str = f"{Colors.RED}{duration_ms:.1f}ms{Colors.RESET}"

            logger.info(
                f"{Colors.GRAY}<--{Colors.RESET} {code_str} "
                f"{m_color}{Colors.BOLD}{method:<6}{Colors.RESET} "
                f"{path_color}{path}{Colors.RESET} "
                f"{Colors.GRAY}| Duration: {Colors.RESET}{duration_str}"
            )
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"{Colors.BRIGHT_RED}<!- EXCEPTION{Colors.RESET} "
                f"{m_color}{Colors.BOLD}{method:<6}{Colors.RESET} "
                f"{path_color}{path}{Colors.RESET} "
                f"{Colors.GRAY}| Failed after {Colors.RESET}{Colors.BRIGHT_RED}{duration_ms:.1f}ms"
                f"{Colors.GRAY} | Error: {Colors.RESET}{Colors.BRIGHT_RED}{exc}{Colors.RESET}"
            )
            raise exc


# Enable UTF-8 console output on Windows
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def print_startup_banner(host: str, port: int):
    """Renders a stylized startup banner in the console with exact column padding."""
    C = Colors
    display_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host
    lines = [
        ("Framework", "FastAPI 2.0 (Python 3.11)", C.BRIGHT_GREEN),
        ("Database", "SQLite (backend/data/apexmind.db)", C.BRIGHT_YELLOW),
        ("AI Engine", "Google Gemini 2.5 Flash + TTS Audio", C.BRIGHT_MAGENTA),
        ("Server URL", f"http://{display_host}:{port}", C.BRIGHT_WHITE),
        ("OpenAPI Docs", f"http://{display_host}:{port}/api/docs", C.BRIGHT_CYAN),
        ("Health Check", f"http://{display_host}:{port}/api/health", C.BRIGHT_GREEN),
    ]
    width = 76

    # Box-drawing with ASCII fallback if terminal does not support Unicode
    try:
        b_tl, b_tr, b_bl, b_br, b_ml, b_mr, b_h, b_v = "╔", "╗", "╚", "╝", "╠", "╣", "═", "║"
        banner_top = f"{C.BRIGHT_CYAN}{b_tl}{b_h * width}{b_tr}{C.RESET}"
        banner_mid = f"{C.BRIGHT_CYAN}{b_ml}{b_h * width}{b_mr}{C.RESET}"
        banner_bot = f"{C.BRIGHT_CYAN}{b_bl}{b_h * width}{b_br}{C.RESET}"
        v_bar = f"{C.BRIGHT_CYAN}{b_v}{C.RESET}"

        title_text = "APEXMIND STUDIO AI  —  BACKEND OPERATIONAL"
        title_pad = width - len(title_text) - 3
        title_line = f"{v_bar}   {C.BRIGHT_WHITE}{C.BOLD}{title_text}{C.RESET}{' ' * max(0, title_pad)}{v_bar}"

        content_lines = []
        for label, val, color in lines:
            prefix = f"   {label:<12}: "
            raw_len = len(prefix) + len(val)
            pad = width - raw_len
            line = f"{v_bar}{C.GRAY}{prefix}{C.RESET}{color}{val}{C.RESET}{' ' * max(0, pad)}{v_bar}"
            content_lines.append(line)

        output = "\n" + "\n".join([banner_top, title_line, banner_mid] + content_lines + [banner_bot]) + "\n"
        print(output)
    except (UnicodeEncodeError, Exception):
        # Fallback to standard clean ASCII border
        print(f"\n[{C.BRIGHT_WHITE}{C.BOLD}APEXMIND STUDIO AI - BACKEND OPERATIONAL{C.RESET}]")
        for label, val, color in lines:
            print(f"  {label:<12}: {color}{val}{C.RESET}")
        print()
