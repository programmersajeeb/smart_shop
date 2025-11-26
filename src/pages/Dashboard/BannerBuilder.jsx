import { useState, useEffect } from "react";

// Generate Unique ID
const uid = () => Math.random().toString(36).substring(2, 10);

export default function BannerBuilder() {
  const [htmlCode, setHtmlCode] = useState(
    `<div class="bg-black text-white py-10 text-center">
        <h1 class="text-4xl font-bold">🔥 Mega Sale - 70% OFF</h1>
        <p class="text-lg opacity-80 mt-2">Limited Time Offer</p>
    </div>`
  );

  const [cssCode, setCssCode] = useState(
    `h1 { letter-spacing: 1px; }\np { font-style: italic; }`
  );

  const [savedBanners, setSavedBanners] = useState([]);

  // Load Saved Banners
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("banners")) || [];
    setSavedBanners(saved);
  }, []);

  // Save Banner
  const saveBanner = () => {
    const newBanner = {
      id: uid(),
      htmlCode,
      cssCode,
      date: new Date().toLocaleString(),
    };

    const updated = [...savedBanners, newBanner];
    setSavedBanners(updated);
    localStorage.setItem("banners", JSON.stringify(updated));
    alert("Banner Saved Successfully!");
  };

  // Load Banner
  const loadBanner = (banner) => {
    setHtmlCode(banner.htmlCode);
    setCssCode(banner.cssCode);
  };

  // Delete Banner
  const deleteBanner = (id) => {
    const updated = savedBanners.filter((b) => b.id !== id);
    setSavedBanners(updated);
    localStorage.setItem("banners", JSON.stringify(updated));
  };

  // Include Tailwind inside iframe
  const generatePreview = () => `
    <html>
      <head>
        <link href="https://cdn.tailwindcss.com" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; }
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode}
      </body>
    </html>
  `;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6 bg-gray-100 min-h-screen">

      {/* LEFT SIDE – Editors */}
      <div className="xl:col-span-2 space-y-6">

        {/* HTML Editor */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-2">HTML Code</h2>
          <textarea
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            className="w-full h-52 border p-3 rounded font-mono text-sm"
          />
        </div>

        {/* CSS Editor */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-2">CSS Code</h2>
          <textarea
            value={cssCode}
            onChange={(e) => setCssCode(e.target.value)}
            className="w-full h-52 border p-3 rounded font-mono text-sm"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={saveBanner}
          className="bg-blue-600 text-white px-6 py-3 rounded font-semibold shadow hover:bg-blue-700"
        >
          Save Banner
        </button>
      </div>

      {/* RIGHT SIDE – Preview + Saved */}
      <div className="space-y-6">

        {/* Live Preview */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-3">Live Preview</h2>

          <iframe
            title="preview"
            className="w-full h-[420px] border rounded"
            srcDoc={generatePreview()}
          />
        </div>

        {/* Saved Banners */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-3">Saved Banners</h2>

          {savedBanners.length === 0 && (
            <p className="text-gray-500 text-sm">No saved banners yet.</p>
          )}

          <div className="space-y-3">
            {savedBanners.map((banner) => (
              <div
                key={banner.id}
                className="border p-3 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-sm">ID: {banner.id}</p>
                  <p className="text-xs text-gray-500">{banner.date}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => loadBanner(banner)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteBanner(banner.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
