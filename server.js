const { addonBuilder } = require('stremio-addon-sdk');
const express = require('express');
const axios = require('axios');
const m3u8Parser = require('m3u8-parser');
const { SocksProxyAgent } = require('socks-proxy-agent');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const Fuse = require('fuse.js');

// Load server configuration
const configPath = path.join(__dirname, 'config.json');
let serverConfig = { debug: false, refreshInterval: 60 };
try {
  const configData = fs.readFileSync(configPath, 'utf8');
  serverConfig = { ...serverConfig, ...JSON.parse(configData) };
  console.log('Server config loaded:', serverConfig);
} catch (error) {
  console.error('Failed to load config.json, using defaults:', error.message);
}

const hungarianIPRanges = [
  "5.38.128.0/17", "5.63.192.0/18", "5.148.192.0/18", "5.187.128.0/17", "5.204.0.0/16",
  "5.206.128.0/18", "31.46.0.0/16", "31.171.224.0/20", "37.17.160.0/20", "37.76.0.0/17",
  "37.191.0.0/18", "37.220.128.0/20", "37.220.192.0/18", "37.234.0.0/16", "46.35.192.0/19",
  "46.107.0.0/16", "46.139.0.0/16", "46.249.128.0/19", "46.251.16.0/20", "62.77.208.0/20",
  "62.77.224.0/20", "62.100.224.0/19", "62.112.192.0/19", "62.165.192.0/18", "62.201.64.0/18",
  "77.110.128.0/19", "77.110.160.0/19", "77.111.64.0/19", "77.111.96.0/20", "77.111.112.0/20",
  "77.111.128.0/18", "77.221.32.0/19", "77.234.64.0/19", "77.242.144.0/20", "77.243.208.0/20",
  "78.92.0.0/16", "78.108.16.0/20", "78.131.0.0/17", "78.139.0.0/18", "78.153.96.0/19",
  "79.120.128.0/19", "79.120.176.0/20", "79.120.192.0/19", "79.120.224.0/20", "79.121.0.0/18",
  "79.121.64.0/19", "79.122.0.0/17", "79.172.192.0/18", "80.64.64.0/20", "80.77.112.0/20",
  "80.95.64.0/20", "80.95.80.0/20", "80.98.0.0/15", "80.244.96.0/20", "80.249.160.0/20",
  "80.252.48.0/20", "81.0.64.0/20", "81.16.192.0/20", "81.17.176.0/20", "81.22.176.0/20",
  "81.93.192.0/20", "81.94.176.0/20", "81.94.240.0/20", "81.160.128.0/17", "81.182.0.0/15",
  "82.131.128.0/19", "82.131.160.0/20", "82.131.224.0/19", "82.141.128.0/18", "82.150.32.0/19",
  "84.0.0.0/14", "84.21.0.0/19", "84.206.0.0/16", "84.224.0.0/16", "84.225.0.0/17",
  "84.225.128.0/18", "84.225.192.0/18", "84.236.0.0/17", "85.66.0.0/15", "85.90.160.0/19",
  "85.238.64.0/19", "86.59.128.0/17", "86.101.0.0/16", "86.109.64.0/19", "87.97.0.0/18",
  "87.97.64.0/20", "87.97.80.0/20", "87.97.96.0/19", "87.101.112.0/20", "87.229.0.0/17",
  "87.242.0.0/18", "88.87.224.0/20", "88.132.0.0/17", "88.132.128.0/18", "88.132.192.0/19",
  "88.132.224.0/20", "88.209.192.0/18", "89.132.0.0/14", "89.147.64.0/20", "89.148.64.0/18",
  "89.223.128.0/17", "89.251.32.0/20", "91.82.96.0/19", "91.82.192.0/20", "91.83.0.0/19",
  "91.83.64.0/20", "91.83.160.0/20", "91.83.192.0/20", "91.83.208.0/20", "91.83.224.0/20",
  "91.104.0.0/16", "91.120.0.0/16", "91.135.112.0/20", "91.137.128.0/17", "91.144.64.0/18",
  "91.146.128.0/18", "91.147.192.0/19", "92.52.192.0/19", "92.52.224.0/19", "92.61.96.0/20",
  "92.61.112.0/20", "92.63.240.0/20", "92.245.64.0/19", "92.249.128.0/17", "93.89.160.0/20",
  "94.21.0.0/16", "94.27.128.0/17", "94.44.0.0/16", "94.248.128.0/19", "94.248.160.0/20",
  "94.248.192.0/19", "94.248.240.0/20", "95.168.32.0/19", "95.168.64.0/19", "95.171.64.0/19",
  "109.61.0.0/18", "109.61.64.0/20", "109.61.112.0/20", "109.74.48.0/20", "109.105.0.0/19",
  "109.110.128.0/19", "109.199.32.0/19", "130.43.192.0/18", "130.93.192.0/18", "134.255.0.0/17",
  "145.236.0.0/16", "146.110.0.0/16", "147.7.0.0/16", "148.6.0.0/16", "149.200.0.0/17",
  "151.0.64.0/18", "152.66.0.0/16", "157.181.0.0/16", "158.249.0.0/16", "160.114.0.0/16",
  "171.19.0.0/16", "171.31.0.0/16", "176.63.0.0/16", "176.77.128.0/17", "176.226.0.0/17",
  "176.241.0.0/18", "178.48.0.0/16", "178.164.128.0/17", "178.210.224.0/19", "178.238.208.0/20",
  "188.6.0.0/16", "188.36.0.0/16", "188.44.128.0/17", "188.127.128.0/19", "188.142.128.0/19",
  "188.142.160.0/19", "188.142.192.0/18", "188.143.0.0/17", "188.156.0.0/15", "193.6.0.0/16",
  "193.68.32.0/19", "193.91.64.0/19", "193.224.0.0/16", "193.225.0.0/16", "194.38.96.0/19",
  "194.88.32.0/19", "194.143.224.0/19", "194.149.0.0/19", "194.149.32.0/19", "194.152.128.0/19",
  "194.176.224.0/19", "195.38.96.0/19", "195.56.0.0/16", "195.70.32.0/19", "195.111.0.0/16",
  "195.184.0.0/19", "195.184.160.0/19", "195.199.0.0/16", "195.228.0.0/16", "212.16.128.0/19",
  "212.24.160.0/19", "212.40.64.0/19", "212.40.96.0/19", "212.48.240.0/20", "212.51.64.0/18",
  "212.52.160.0/19", "212.92.0.0/19", "212.96.32.0/19", "212.105.224.0/19", "212.108.192.0/18",
  "213.16.64.0/18", "213.157.96.0/19", "213.163.0.0/19", "213.163.32.0/19", "213.178.96.0/19",
  "213.181.192.0/19", "213.197.80.0/20", "213.197.96.0/19", "213.222.128.0/18", "213.253.192.0/18",
  "217.13.32.0/20", "217.13.96.0/20", "217.20.128.0/20", "217.21.16.0/20", "217.27.208.0/20",
  "217.65.96.0/20", "217.65.112.0/20", "217.79.128.0/20", "217.112.128.0/20", "217.116.32.0/20",
  "217.144.48.0/20", "217.150.128.0/20", "217.173.32.0/20", "217.197.176.0/20",
];

function produceHeader() {
  const randomRange = hungarianIPRanges[Math.floor(Math.random() * hungarianIPRanges.length)];
  const randomIP = randomRange.split('/')[0];
  return { 'X-Forwarded-For': randomIP };
}

let cachedMetas = [];
let lastUpdated = null;

const baseUrl = 'https://tv2play.hu';
const apiUrl = `${baseUrl}/api`;
const musorokURL = "https://tv2-prod.d-saas.com/grrec-tv2-prod-war/JSServlet4?&rn=&cid=&ts=%d&rd=0,TV2_W_CONTENT_LISTING,800,[*platform:web;*domain:tv2play;*currentContent:SHOW;*country:HU;*userAge:18;*pagingOffset:%d],[displayType;channel;title;itemId;duration;isExtra;ageLimit;showId;genre;availableFrom;director;isExclusive;lead;url;contentType;seriesTitle;availableUntil;showSlug;videoType;series;availableEpisode;imageUrl;totalEpisode;category;playerId;currentSeasonNumber;currentEpisodeNumber;part;isPremium]";

// Headers for requests
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
  'Accept-Language': 'hu-HU,hu;q=0.8,en-US;q=0.6,en;q=0.4,de;q=0.2',
  'Referer': baseUrl
};

// Helper function to make requests
async function makeRequest(url, options = {}) {
  try {
    const dynamicHeaders = produceHeader();
    const requestHeaders = { ...headers, ...dynamicHeaders };
    const response = await axios.get(url, { headers: requestHeaders, ...options });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status !== 404) {
      console.error('Request failed:', error.message);
    }
    return null;
  }
}

// Parse M3U8 content
function parseM3U8(content) {
  const parser = new m3u8Parser.Parser();
  parser.push(content);
  parser.end();
  return parser.manifest;
}

// Helper function for debug logging
function debugLog(isDebug, ...args) {
  if (isDebug) {
    console.log('[DEBUG]', ...args);
  }
}

// Helper function to normalize strings for searching
function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}


// Catalog handler
async function catalogHandler(args, cb) {
  const { type, id, config } = args;
  debugLog(serverConfig.debug, `Catalog request: ${type}, ${id}`);

  if (args.extra && args.extra.search) {
    const query = args.extra.search;
    debugLog(serverConfig.debug, `Searching for: "${query}"`);

    debugLog(serverConfig.debug, 'Cached metas:', cachedMetas);
    const normalizedQuery = normalizeString(query);
    debugLog(serverConfig.debug, `Normalized query: "${normalizedQuery}"`);
    const fuse = new Fuse(cachedMetas, {
      keys: ['name'],
      includeScore: true,
      threshold: 0.2,
      getFn: (obj, path) => normalizeString(obj[path])
    });
    const searchResults = fuse.search(normalizedQuery);
    debugLog(serverConfig.debug, `Fuse.js search results:`, searchResults);
    const searchMetas = searchResults.map(result => result.item);
    debugLog(serverConfig.debug, `Final matched shows:`, searchMetas);


    return cb(null, { metas: searchMetas });
  }

  const refreshInterval = serverConfig.refreshInterval;
  const programOrder = (config && config.programOrder) ? config.programOrder : 'Popularity';

  const now = new Date();
  if (cachedMetas.length > 0 && lastUpdated && (now - lastUpdated) < refreshInterval * 60 * 1000) {
    debugLog(serverConfig.debug, 'Serving from cache');
    return cb(null, { metas: cachedMetas });
  }

  debugLog(serverConfig.debug, 'Cache stale or empty, fetching new data...');

  try {
    let allItems = [];
    let pageOffset = 0;
    let totalResults = 50;

    while (totalResults >= 50) {
      const timestamp = Math.floor(Date.now() / 1000);
      const url = musorokURL.replace('%d', timestamp).replace('%d', pageOffset);
      const response = await makeRequest(url);
      if (!response) {
        break;
      }
      let data;
      try {
        if (typeof response === 'string' && response.includes('var data =')) {
          const match = response.match(/var data = (\{[\s\S]*?\});/);
          if (match && match[1]) {
            data = JSON.parse(match[1]);
          } else {
            break;
          }
        } else if (typeof response === 'string') {
          data = JSON.parse(response);
        } else {
          data = response;
        }
      } catch (e) {
        break;
      }
      const items = data.recommendationWrappers?.[0]?.recommendation?.items || [];
      totalResults = data.recommendationWrappers?.[0]?.recommendation?.totalResults || 0;
      if (totalResults > 0) {
        allItems = allItems.concat(items);
      }
      pageOffset = allItems.length;
    }

    debugLog(serverConfig.debug, `Loaded ${allItems.length} total items from musorokURL`);

    if (programOrder === 'Name') {
      allItems.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;
      });
    }

    const metas = [];
    let premiumSkipped = 0;

    for (const item of allItems) {
      // if (item.isPremium === 'true') {
      //   debugLog(serverConfig.debug, `Skipping premium show: ${item.title}`);
      //   premiumSkipped++;
      //   continue;
      // }

      let stremioType;
      if (item.contentType === 'SHOW') {
        stremioType = 'series';
      } else if (item.contentType === 'MOVIE') { // Assuming 'MOVIE' is the content type for movies
        stremioType = 'movie';
      } else {
        continue; // Skip unknown content types
      }

      if (stremioType) {
        metas.push({
          id: `tv2play:${item.url}`,
          type: stremioType,
          name: item.title,
          poster: item.imageUrl && item.imageUrl.startsWith('http') ? item.imageUrl : `${baseUrl}${item.imageUrl || ''}`,
          background: item.imageUrl && item.imageUrl.startsWith('http') ? item.imageUrl : `${baseUrl}${item.imageUrl || ''}`,
          description: item?.seo?.description || item.lead || '',
          genres: (() => {
            if (Array.isArray(item.genre) && item.genre.length)
              return item.genre;
            if (item.category)
              return [item.category];
            if (item.genres && typeof item.genres === 'string')
              return item.genres.split(',').map(g => g.trim());
            return [];
          })(),
          releaseInfo: (() => {
            if (!item.availableFrom) return undefined;

            let timestamp = item.availableFrom;
            if (typeof timestamp === 'string') timestamp = Number(timestamp);

            // Convert seconds → milliseconds if needed
            if (timestamp < 1000000000000) {
              timestamp *= 1000;
            }

            const date = new Date(timestamp);
            const year = date.getFullYear();
            return isNaN(year) ? undefined : year.toString();
          })(),
        });
      }
    }
    
    // Save metas to cache
    cachedMetas = metas;

    // Write cached shows to a file for debugging
    try {
      const cachedShowsPath = path.join(__dirname, 'cached_shows.json');
      fs.writeFileSync(cachedShowsPath, JSON.stringify(cachedMetas, null, 2));
      debugLog(serverConfig.debug, `Cached shows written to ${cachedShowsPath}`);
    } catch (err) {
      console.warn('[DEBUG] Failed to write cached shows to file:', err.message);
    }


    // Try to filter out empty and failed shows if we have a list
    try {
      const emptyPath = path.join(__dirname, 'empty_shows.json');
      if (fs.existsSync(emptyPath)) {
        const json = JSON.parse(fs.readFileSync(emptyPath, 'utf8'));

        // Collect all IDs (supports old and new formats)
        const emptyIds = new Set();
        if (Array.isArray(json)) {
          // Old format: just an array of empty shows
          json.forEach(e => e.id && emptyIds.add(e.id));
        } else {
          // New format: object with emptyShows + failedShows
          (json.emptyShows || []).forEach(e => e.id && emptyIds.add(e.id));
          (json.failedShows || []).forEach(e => e.id && emptyIds.add(e.id));
        }

        const before = cachedMetas.length;
        cachedMetas = cachedMetas.filter(m => !emptyIds.has(m.id));
        const removed = before - cachedMetas.length;
        debugLog(
          serverConfig.debug,
          `Filtered out ${removed} empty/failed shows from catalog (out of ${before}).`
        );
      }
    } catch (err) {
      console.warn('[DEBUG] Failed to filter empty/failed shows:', err.message);
    }

    lastUpdated = new Date();
    debugLog(
      serverConfig.debug,
      `Cache updated. Final count: ${cachedMetas.length} shows (Premium skipped: ${premiumSkipped})`
    );
    cb(null, { metas: cachedMetas });
  } catch (error) {
    console.error('[DEBUG] Cache update error:', error);
    cb(error);
  }
}

// Meta handler
async function metaHandler(args, cb) {
  const { type, id, config } = args;
  debugLog(serverConfig.debug, `Meta request: ${type}, ${id}`);

  // Check if the ID belongs to this addon
  if (!id.startsWith('tv2play:')) {
    debugLog(serverConfig.debug, `ID ${id} does not belong to tv2play addon, returning Item not found.`);
    return cb(new Error('Item not found'));
  }

  try {
    const itemSlug = id.replace('tv2play:', '');
    const searchUrl = `${apiUrl}/search/${itemSlug}`;
    debugLog(serverConfig.debug, `Fetching meta for itemSlug: ${itemSlug}, URL: ${searchUrl}`);

    const data = await makeRequest(searchUrl);
    if (!data || data.contentType !== 'showpage') {
      debugLog(serverConfig.debug, 'No data found for item');
      return cb(new Error('Item not found'));
    }

    const firstPage = data.pages[0];
    const showInfoTab = firstPage?.tabs.find(t => t.tabType === 'SHOW_INFO');
    const showData = showInfoTab?.showData;

    const seriesName = showData?.title || firstPage?.title;
    debugLog(serverConfig.debug, `Processing series: ${seriesName}`);
    const videos = [];

    if (data.pages && data.pages.length > 0) {
      for (const seasonPage of data.pages) {
        const season = seasonPage.seasonNr;
        let episodeNumber = 1;
        if (seasonPage.tabs) {
          for (const tab of seasonPage.tabs) {
            if (tab.tabType === 'RIBBON' && tab.ribbonIds) {
              const MAX_CONCURRENT_RIBBON_PAGES = 5; // Limit concurrent page fetches per ribbon

              const fetchRibbonPage = async (ribbonId, page) => {
                const ribbonUrl = `${apiUrl}/ribbons/${ribbonId}/${page}`;
                return await makeRequest(ribbonUrl);
              };

              const ribbonPromises = tab.ribbonIds.map(async (ribbonId) => {
                let allRibbonEpisodes = [];
                let page = 0;
                let hasMorePages = true;

                while (hasMorePages) {
                  const pagePromises = [];
                  for (let i = 0; i < MAX_CONCURRENT_RIBBON_PAGES; i++) {
                    pagePromises.push(fetchRibbonPage(ribbonId, page + i));
                  }

                  const results = await Promise.all(pagePromises);
                  let foundNewEpisodes = false;

                  for (const ribbonData of results) {
                    if (ribbonData && ribbonData.cards && ribbonData.cards.length > 0) {
                      for (const card of ribbonData.cards) {
                        if (card.cardType === 'SHOW_EPISODE' || card.cardType === 'SERIES_EPISODE' || card.cardType === 'PART_OF_LIVE_SHOW') {
                          allRibbonEpisodes.push(card);
                          foundNewEpisodes = true;
                        }
                      }
                    }
                  }

                  if (foundNewEpisodes) {
                    page += MAX_CONCURRENT_RIBBON_PAGES;
                  } else {
                    hasMorePages = false;
                  }
                }
                return allRibbonEpisodes;
              });

              const allRibbonEpisodes = await Promise.all(ribbonPromises);
              const flattenedEpisodes = allRibbonEpisodes.flat();
              
            for (const card of flattenedEpisodes) {
              videos.push({
                id: `tv2play:${card.slug}`,
                title: card.title,
                released: card.availableFrom || undefined,
                thumbnail: card.imageUrl.startsWith('http') ? card.imageUrl : `${baseUrl}${card.imageUrl}`,
                season: card.seriesInfo?.seasonNr || season || 1,
                episode: card.seriesInfo?.episodeNr || episodeNumber
              });
              episodeNumber++;
            }

            // Check if Season 1 exists among the fetched videos
            const hasSeason1 = videos.some(video => video.season === 1);
            const hasOtherSeasons = videos.some(video => video.season > 1);

            // If Season 1 is missing but other seasons exist, add a dummy Season 1
            if (!hasSeason1 && hasOtherSeasons) {
              videos.unshift({
                id: `tv2play:dummy-s1-${id}`,
                title: 'Season 1 (No episodes available, please select another season)',
                released: new Date().toISOString(),
                thumbnail: '', // Can be a placeholder image
                season: 1,
                episode: 1,
                isDummy: true // Custom flag to identify dummy entry
              });
            }
            }
          }
        }
      }
    }

    const posterUrl = showData?.imageUrl || firstPage?.backgroundImageUrl;
    const meta = {
      id,
      type,
      name: seriesName,
      poster: posterUrl?.startsWith('http') ? posterUrl : `${baseUrl}${posterUrl}`,
      background: posterUrl?.startsWith('http') ? posterUrl : `${baseUrl}${posterUrl}`,
      description: showData?.description || firstPage?.lead || data.seo?.description || '',
      genres: firstPage?.genre || [],
      releaseInfo: undefined, // Not available in this response
      videos
    };
    debugLog(serverConfig.debug, `Series meta created with ${videos.length} episodes`);

    cb(null, { meta });

  } catch (error) {
    console.error('[DEBUG] Meta error:', error);
    cb(error);
  }
}

// Stream handler
async function streamHandler(args, cb) {
  const { type, id } = args;
  debugLog(serverConfig.debug, `Stream request: ${type}, ${id}`);

  // Check if the ID belongs to this addon
  if (!id.startsWith('tv2play:')) {
    debugLog(serverConfig.debug, `ID ${id} does not belong to tv2play addon, returning empty streams.`);
    return cb(null, { streams: [] });
  }

  try {
    const slug = id.replace('tv2play:', '');
    const searchUrl = `${apiUrl}/search/${slug}`;
    debugLog(serverConfig.debug, `Fetching stream data for slug: ${slug}, URL: ${searchUrl}`);

    const data = await makeRequest(searchUrl);
    if (!data) {
      debugLog(serverConfig.debug, 'No data found for stream');
      return cb(new Error('Item not found'));
    }

    const isPremium = data.isPremium === 'true';
    const playerId = data.playerId || data.coverVideoPlayerId;
    debugLog(serverConfig.debug, `Player ID: ${playerId}`);
    if (!playerId) {
      debugLog(serverConfig.debug, 'No player ID found');
      return cb(null, { streams: [] });
    }

    const streamUrl = `${apiUrl}${isPremium ? '/premium' : ''}/streaming-url?playerId=${playerId}&stream=undefined`;
    debugLog(serverConfig.debug, `Fetching streaming URL via Tor: ${streamUrl}`);

    const streamData = await makeRequest(streamUrl);

    if (!streamData || streamData.geoBlocked) {
      debugLog(serverConfig.debug, 'Stream not available or geo-blocked');
      return cb(null, { streams: [] });
    }

    const m3u8Url = streamData.url.replace(/^\/\//, 'https://');
    debugLog(serverConfig.debug, `M3U8 URL: ${m3u8Url}`);
    const m3u8Json = await makeRequest(m3u8Url);
    if (!m3u8Json) {
      debugLog(serverConfig.debug, 'Failed to fetch M3U8 JSON');
      return cb(null, { streams: [] });
    }

    const hlsPath = m3u8Json.bitrates?.hls;
    if (!hlsPath) {
      debugLog(serverConfig.debug, 'No HLS path found in M3U8 JSON');
      return cb(null, { streams: [] });
    }

    const hlsUrl = `https:${hlsPath}`;
    debugLog(serverConfig.debug, `HLS URL: ${hlsUrl}`);
    const m3u8Content = await makeRequest(hlsUrl);
    if (!m3u8Content) {
      debugLog(serverConfig.debug, 'Failed to fetch M3U8 content');
      return cb(null, { streams: [] });
    }

    const manifest = parseM3U8(m3u8Content);
    debugLog(serverConfig.debug, `M3U8 parsed, found ${manifest.playlists?.length || 0} playlists`);
    const streams = [];

    if (manifest.playlists && manifest.playlists.length > 0) {
      // Sort by resolution (highest first)
      const sortedPlaylists = manifest.playlists.sort((a, b) => {
        const resA = a.attributes?.RESOLUTION?.height || 0;
        const resB = b.attributes?.RESOLUTION?.height || 0;
        return resB - resA;
      });

      for (const playlist of sortedPlaylists) {
        const streamUrl = playlist.uri.startsWith('http') ? playlist.uri : new URL(playlist.uri, hlsUrl).href;
        streams.push({
          url: streamUrl,
          title: playlist.attributes?.RESOLUTION ? `${playlist.attributes.RESOLUTION.width}x${playlist.attributes.RESOLUTION.height}` : 'Unknown',
          behaviorHints: {
            bingeGroup: id,
            proxyHeaders: {
              'Referer': baseUrl
            }
          }
        });
      }
    }

    debugLog(serverConfig.debug, `Stream result: ${streams.length} quality options`);
    cb(null, { streams });
  } catch (error) {
    console.error('[DEBUG] Stream error:', error);
    cb(null, { streams: [] });
  }
}

// Build the addon
const builder = new addonBuilder({
  id: 'com.tv2play.stremio',
  version: '1.0.0',
  name: 'TV2 Play',
  description: 'Watch TV2 Play content on Stremio',
  resources: ['catalog', 'meta', 'stream'],
  types: ['series', 'movie', 'tv2play'],
  catalogs: [
    {
      type: 'tv2play',
      id: 'tv2play-catalog',
      name: 'TV2 shows',
      extra: [{ name: 'search', isRequired: false }]
    }
  ],
  config: [
    {
      key: 'programOrder',
      type: 'select',
      title: 'Program Order',
      options: ['Popularity', 'Name'],
      default: 'Popularity'
    }
  ]
});

// Define handlers
builder.defineCatalogHandler(catalogHandler);
builder.defineMetaHandler(metaHandler);
builder.defineStreamHandler(streamHandler);

// Get the addon interface
const addonInterface = builder.getInterface();

// Create Express app
const app = express();
app.set('trust proxy', true);

// Add CORS headers for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/debug', (req, res) => {
  const debugInfo = cachedMetas.map(m => ({ name: m.name, url: m.id.replace('tv2play:', '') }));
  res.json(debugInfo);
});

// Clear cache endpoint
app.get('/clear-cache', (req, res) => {
  cachedMetas = [];
  lastUpdated = null;
  console.log('[DEBUG] Cache cleared');
  res.json({ message: 'Cache cleared' });
});

app.get('/', (req, res) => {
  const manifest = addonInterface.manifest;
  const landingHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${manifest.name} - Stremio Addon</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; background-color: #f0f0f0; }
        .container { max-width: 600px; margin: 50px auto; padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        p { color: #666; }
        .install-btn {
          display: inline-block;
          padding: 10px 20px;
          margin-top: 20px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${manifest.name}</h1>
        <p>${manifest.description}</p>
        <a class="install-btn" href="stremio://${req.get('host')}/manifest.json">Install Addon</a>
      </div>
    </body>
    </html>
  `;
  res.send(landingHTML);
});

// Use the addon as middleware - check if it has middleware property
if (addonInterface.middleware) {
  app.use(addonInterface.middleware);
} else if (addonInterface.router) {
  app.use(addonInterface.router);
} else {
  // Fallback: create routes manually
  app.get('/manifest.json', (req, res) => {
    res.json(addonInterface.manifest);
  });

  app.get('/catalog/:type/:id/:extra?.json', async (req, res) => {
    const { type, id } = req.params;
	const extra = req.params.extra ? querystring.parse(req.params.extra) : {};
    debugLog(serverConfig.debug, `Catalog request: ${type}, ${id}`);
    try {
      const result = await new Promise((resolve, reject) => {
        catalogHandler({ type, id, extra }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      res.json(result);
    } catch (error) {
      console.error('[DEBUG] Catalog error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/meta/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    debugLog(serverConfig.debug, `Meta request: ${type}, ${id}`);
    try {
      const result = await new Promise((resolve, reject) => {
        metaHandler({ type, id }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      res.json(result);
    } catch (error) {
      console.error('[DEBUG] Meta error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    debugLog(serverConfig.debug, `Stream request: ${type}, ${id}`);
    try {
      const result = await new Promise((resolve, reject) => {
        streamHandler({ type, id }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      res.json(result);
    } catch (error) {
      console.error('[DEBUG] Stream error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

// ---------------------
// Manual empty show scan mode
// ---------------------
async function scanForEmptyShows(exitAfter = true) {
  console.log('[SCAN] Starting scan for empty shows...');

  if (cachedMetas.length === 0) {
    console.log('[SCAN] Cache empty — fetching catalog first...');
    await new Promise((resolve) => {
      catalogHandler({ type: 'tv2play', id: 'tv2play-catalog' }, (err, result) => {
        if (err) {
          console.error('[SCAN] Failed to fetch catalog:', err);
        } else {
          cachedMetas = result.metas || [];
        }
        resolve();
      });
    });
  }

  const emptyShows = [];
  const failedShows = [];
  let processed = 0;

  const timeoutPromise = (ms) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

  const callMetaWithTimeout = async (meta, retries = 4) => {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const result = await Promise.race([
          new Promise((resolve, reject) => {
            metaHandler({ type: meta.type, id: meta.id }, (err, res) => {
              if (err) reject(err);
              else resolve(res);
            });
          }),
          timeoutPromise(30000),
        ]);
        return result;
      } catch (err) {
        console.warn(`[SCAN] [${meta.name}] attempt ${attempt} failed: ${err.message}`);
        if (attempt > retries) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  };

  for (const meta of cachedMetas) {
    processed++;
    process.stdout.write(`\r[SCAN] Checking ${processed}/${cachedMetas.length}: ${meta.name}`);

    try {
      const result = await callMetaWithTimeout(meta);
      const videos = result?.meta?.videos || [];
      if (videos.length === 0 || videos.every(v => v.isDummy || !v.title)) {
        emptyShows.push({ name: meta.name, id: meta.id });
      }
    } catch (err) {
      failedShows.push({ name: meta.name, id: meta.id, reason: err.message });
    }
  }

  console.log(`\n[SCAN] Done. Found ${emptyShows.length} empty shows.`);
  console.log(`[SCAN] ${failedShows.length} shows failed or timed out.`);

  const outputPath = path.join(__dirname, 'empty_shows.json');
  fs.writeFileSync(outputPath, JSON.stringify({ emptyShows, failedShows }, null, 2));
  console.log(`[SCAN] Results saved to ${outputPath}`);
  if (exitAfter) process.exit(0);
}

// -----------------------------------------------------
// Detect and run scan mode before starting web server
// -----------------------------------------------------
(async () => {
  const outputPath = path.join(__dirname, 'empty_shows.json');
  if (!fs.existsSync(outputPath)) {
    console.log('[AUTO SCAN] empty_shows.json not found, running automatic scan...');
    await scanForEmptyShows(false);
  }
})();

if (process.argv.includes('--search-empty-shows')) {
  (async () => {
    await scanForEmptyShows();
  })();
  return; // Prevent server from starting
}


// Start the server
const port = process.env.PORT || 7000;
app.listen(port, async () => {
  console.log(`[DEBUG] TV2 Play Stremio addon server running on port ${port}`);
  console.log(`[DEBUG] Manifest URL: http://0.0.0.0:${port}/manifest.json`);

  // Update the cache on server start
  console.log('[DEBUG] Updating cache on server start...');
  await new Promise((resolve, reject) => {
    catalogHandler({ type: 'tv2play', id: 'tv2play-catalog' }, (err, result) => {
      if (err) {
        console.error('[DEBUG] Cache update failed on server start:', err);
        reject(err);
      } else {
        console.log('[DEBUG] Cache updated on server start.');
        resolve(result);
      }
    });
  });
});

// Export for testing
module.exports = app;
