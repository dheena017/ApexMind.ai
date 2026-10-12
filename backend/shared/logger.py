"""
ApexMind Studio - High-Visibility Colored Logger
Provides rich, color-coded console formatting, module-specific tags,
HTTP request/response tracking, and stylized developer diagnostics.
"""

import logging
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


class ColoredFormatter(logging.Formatter):
    """Custom log formatter rendering colorful badges, module tags, and timestamps."""

    LEVEL_BADGES = {
        logging.DEBUG: f"{Colors.BG_GRAY} DEBUG {Colors.RESET}",
        logging.INFO: f"{Colors.BG_CYAN}  INFO {Colors.RESET}",
        logging.WARNING: f"{Colors.BG_YELLOW}  WARN {Colors.RESET}",
        logging.ERROR: f"{Colors.BG_RED} ERROR {Colors.RESET}",
        logging.CRITICAL: f"{Colors.BG_RED} FATAL {Colors.RESET}",
    }

    MODULE_COLORS = {
        "Database": Colors.BRIGHT_GREEN,
        "Gemini": Colors.BRIGHT_MAGENTA,
        "Workspace": Colors.BRIGHT_BLUE,
        "YouTube": Colors.BRIGHT_RED,
        "Notifications": Colors.BRIGHT_YELLOW,
        "Dashboard": Colors.BRIGHT_CYAN,
        "HTTP": Colors.CYAN,
        "App": Colors.BRIGHT_WHITE,
    }

    def format(self, record: logging.LogRecord) -> str:
        # 1. Format Timestamp (Dim Gray)
        now = datetime.fromtimestamp(record.created).strftime("%H:%M:%S.%f")[:-3]
        timestamp = f"{Colors.GRAY}[{now}]{Colors.RESET}"

        # 2. Level Badge
        badge = self.LEVEL_BADGES.get(record.levelno, f"[{record.levelname}]")

        # 3. Determine Module Tag & Color
        name = record.name.replace("ApexMind.", "")
        tag_color = Colors.CYAN
        for mod, col in self.MODULE_COLORS.items():
            if mod.lower() in name.lower():
                tag_color = col
                break

        tag = f"{tag_color}{Colors.BOLD}[{name}]{Colors.RESET}"

        # 4. Message Coloring
        msg = record.getMessage()
        if record.levelno >= logging.ERROR:
            msg_colored = f"{Colors.BRIGHT_RED}{msg}{Colors.RESET}"
        elif record.levelno == logging.WARNING:
            msg_colored = f"{Colors.BRIGHT_YELLOW}{msg}{Colors.RESET}"
        else:
            msg_colored = f"{Colors.WHITE}{msg}{Colors.RESET}"

        return f"{timestamp} {badge} {tag} {msg_colored}"


def setup_colored_logging(level=logging.INFO):
    """Configures root, Uvicorn, and ApexMind loggers with the custom colored formatter."""

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColoredFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers on root
    if not any(isinstance(h, logging.StreamHandler) and isinstance(h.formatter, ColoredFormatter) for h in root_logger.handlers):
        root_logger.handlers = [handler]

    # Hook Uvicorn loggers into our ColoredFormatter
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
        logger.info(f"{Colors.GRAY}-->{Colors.RESET} {m_color}{Colors.BOLD}{method:<6}{Colors.RESET} {Colors.WHITE}{path}{Colors.RESET} {Colors.GRAY}(from {client_host}){Colors.RESET}")

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
                f"{Colors.GRAY}<--{Colors.RESET} {code_str} {m_color}{method:<6}{Colors.RESET} {Colors.WHITE}{path}{Colors.RESET} | Duration: {duration_str}"
            )
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"{Colors.BRIGHT_RED}<!- EXCEPTION{Colors.RESET} {m_color}{method:<6}{Colors.RESET} {path} | Failed after {duration_ms:.1f}ms | Error: {exc}"
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
    lines = [
        ("Framework", "FastAPI 2.0 (Python 3.11)", C.BRIGHT_GREEN),
        ("Database", "SQLite (backend/data/apexmind.db)", C.BRIGHT_YELLOW),
        ("AI Engine", "Google Gemini 2.5 Flash + TTS Audio", C.BRIGHT_MAGENTA),
        ("Server Host", f"http://{host}:{port}", C.BRIGHT_WHITE),
        ("OpenAPI Docs", f"http://{host}:{port}/api/docs", C.BRIGHT_CYAN),
        ("Health Check", f"http://{host}:{port}/api/health", C.BRIGHT_GREEN),
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


