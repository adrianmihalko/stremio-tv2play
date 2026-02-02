# TV2 Play Stremio Addon (Docker Release)

This folder contains a lightweight Docker setup that brings TV2Play.hu content directly to your Stremio interface. Watch Hungarian TV shows, series seamlessly integrated with your favorite media center.

<img width="2858" height="1888" alt="CleanShot 2025-10-10 at 15 03 45@2x" src="https://github.com/user-attachments/assets/aaad3793-d8bb-4c7d-8308-2132d40eedea" />


## ✅ What’s Included

- Docker-friendly setup for running the addon
- Docker Compose example

## ⚙️ Requirements

- Docker
- (Optional) Docker Compose
- HTTPS domain or reverse proxy for Stremio installation

## 🔧 Configuration

### Environment variables

| Variable | Description |
|---------|-------------|
| `ADDON_URL` | URL of your addon (used for proxying streams) VERY IMPORTANT (it can be either http://ip:port or https://reverseproxified.domain) |
| `PORT` | Optional server port (default `7000`) |
| `DATA_DIR` | Writable data directory for cache files (default `/data` in Docker image) |
| `SKIP_SCAN` | Set to `1` to skip the automatic empty-show scan on startup |
| `DEBUG` | Set to `true` or `1` for verbose logs |
| `REFRESH_INTERVAL` | Cache refresh interval in minutes (default `60`) |

### Configuration (no config.json)

Use environment variables in Docker to configure debug and refresh interval.

## 🧩 Docker Compose Example

Create a `docker-compose.yml` like this:

```yaml
services:
  stremio-tv2play:
    image: stremio-tv2play:lite
    container_name: stremio-tv2play
    restart: unless-stopped
    ports:
      - "7000:7000"
    environment:
      # IP and port this addon running at
      ADDON_URL: http://192.168.1.5:7000
      # If you use a reverse proxy (pointing to http://192.168.1.5:7000 in this example):
      # ADDON_URL: https://stremio-tv2play.mydomain.com
      DATA_DIR: /data
      SKIP_SCAN: "0"
      DEBUG: "false"
      REFRESH_INTERVAL: "60"
    volumes:
      - stremio-tv2play-data:/data

volumes:
  stremio-tv2play-data:
```

Then run:

```bash
docker compose up -d
```

Open Stremio and install the addon from:

```
https://your-domain.example/manifest.json
```
