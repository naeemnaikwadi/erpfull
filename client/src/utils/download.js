const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export async function downloadCSV(pathOrUrl, filename = 'report.csv') {
  const token = localStorage.getItem('token');
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute ? pathOrUrl : `${API_URL}${pathOrUrl}`;
  
  console.log('Downloading from:', url);
  
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  
  if (!res.ok) {
    console.error('Download failed:', res.status, res.statusText);
    throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  }
  
  const blob = await res.blob();
  const href = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(href);
}


