# Sovereign Automation MCP Server — hardened, non-root, offline
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MCP_PORT=8091

WORKDIR /app

# Install only what is needed; PyJWT is optional at runtime.
COPY requirements.txt ./
RUN pip install --no-cache-dir --disable-pip-version-check -r requirements.txt \
    && useradd --system --uid 10001 --no-create-home mcp

COPY server.py ./
USER 10001

EXPOSE 8091

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8091/health', timeout=2).status==200 else 1)"

CMD ["python", "server.py"]
