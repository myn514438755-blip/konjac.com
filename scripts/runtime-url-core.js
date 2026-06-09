(function initRuntimeUrls(root) {
  function trimSlashes(value) {
    return String(value || '').replace(/^\/+|\/+$/g, '');
  }

  function joinUrl(baseUrl, path, localRoot = '.') {
    const cleanPath = trimSlashes(path);
    if (!baseUrl) {
      return `${String(localRoot).replace(/\/+$/g, '')}/${cleanPath}`;
    }
    return `${String(baseUrl).replace(/\/+$/g, '')}/${cleanPath}`;
  }

  function createResolvers(config = {}) {
    return {
      dataUrl: (path) => joinUrl(config.dataBaseUrl, path, './data'),
      downloadUrl: (path) =>
        joinUrl(config.downloadsBaseUrl, path, './downloads'),
      jbrowseUrl: (path) =>
        joinUrl(
          config.jbrowseBaseUrl,
          path,
          './data/processed/jbrowse-app'
        )
    };
  }

  root.KonjacRuntimeUrls = { joinUrl, createResolvers };
})(typeof window === 'undefined' ? globalThis : window);
