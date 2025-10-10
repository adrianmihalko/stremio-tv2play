# TV2 Play Stremio Addon

A powerful Stremio addon that brings TV2Play.hu content directly to your Stremio interface. Watch Hungarian TV shows, series seamlessly integrated with your favorite media center.

## 🌟 Features

- **Complete Catalog**: Access the full TV2 Play library including series, shows
- **Smart Caching**: Efficient caching system to reduce load times and API calls
- **Geo-Unblocking**: Built-in IP spoofing to access Hungarian content from anywhere
- **Configurable Settings**: Server-side configuration for debug logging and refresh intervals
- **Stremio Integration**: Native Stremio addon with user-configurable program ordering

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Stremio application

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adrianmihalko/stremio-tv2play.git
   cd stremio-tv2play
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure settings** (optional)
   Edit `config.json` to customize:
   ```json
   {
     "debug": false,
     "refreshInterval": 60
   }
   ```

4. **Start the server**
   ```bash
   npm start
   # or
   node server.js
   ```

5. **Install in Stremio**
   Stremio requires HTTPS for addon installation, so you need to set up a reverse proxy from your local server to an HTTPS domain.

   **Example reverse proxy setup:**
   ```
   http://192.168.1.100:7000 -> https://stremio-tv2play.yourdomain.com
   ```

   - Set up your reverse proxy (nginx, Caddy, Apache, etc.) to proxy HTTPS requests to your local server
   - Open Stremio and go to the Addons section
   - Click the install button on the landing page at `https://stremio-tv2play.yourdomain.com`
   - Content will be available in the Discovery tab, where you can select "TV2Play shows" from the first dropdown

## ⚙️ Configuration

### Server Configuration (`config.json`)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `debug` | boolean | `false` | Enable detailed debug logging |
| `refreshInterval` | number | `60` | Cache refresh interval in minutes |

### Stremio Configuration

Available in Stremio addon settings:
- **Program Order**: Choose between 'Popularity' (default) or 'Name' (alphabetical)

## 🔧 API Endpoints

- `GET /` - Landing page with installation instructions
- `GET /manifest.json` - Stremio addon manifest
- `GET /debug` - Debug endpoint showing cached content

## 🌐 How It Works

1. **Content Discovery**: Scrapes TV2 Play's API to build a comprehensive catalog
2. **Metadata Extraction**: Fetches detailed information about shows, seasons, and episodes
3. **Stream Resolution**: Locates and provides streaming URLs with multiple quality options
4. **Geo-Unblocking**: Uses Hungarian IP ranges to bypass regional restrictions
5. **Caching**: Implements intelligent caching to minimize API calls and improve performance

## 🔒 Security & Privacy

- No user data collection
- No tracking or analytics
- Respects TV2 Play's terms of service
- Uses legitimate API endpoints

**Streaming issues**
- Premium content requires TV2 Play subscription, not implemented yet

### Debug Mode

Enable debug logging by setting `"debug": true` in `config.json`:

```json
{
  "debug": true,
  "refreshInterval": 60
}
```

Check server console output for detailed logs.


## 📄 License

This project is for educational purposes only. Please respect TV2 Play's terms of service and copyright laws.

## 🙏 Acknowledgments

- **vargalex** for the original Kodi TV2 Play addon that inspired this project

---

**Enjoy watching Hungarian content with TV2 Play Stremio Addon! 🇭🇺**
