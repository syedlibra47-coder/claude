// Converts real-world latitude/longitude into pixel coordinates on the
// office network-diagram map (see index.html / contact.html .network-diagram
// svg, viewBox "20 230 805 480"). Calibrated by fitting a linear
// (equirectangular) transform against the geographic centers of 9 countries
// spread across every populated continent (UAE, Pakistan, India, Australia,
// Brazil, South Africa, Japan, China, Nigeria) as they appear in the landmass
// path data in assets/world-map-paths.js — accurate to within ~2% of the map
// width for the whole world.
window.projectLatLng = function (lat, lon) {
  const x = 2.30614 * lon + 407.219;
  const y = -3.11867 * lat + 533.941;
  return { x, y };
};

// The map's landmass path data comfortably covers every inhabited region
// (roughly -56..75 latitude, -170..179 longitude) — only deep Antarctica
// falls outside it. Callers should treat lat/lng outside this as
// "don't show on map" (still fine to list in office cards).
window.MAP_COVERAGE_BOUNDS = { minLat: -56, maxLat: 75, minLon: -170, maxLon: 179 };

// Shared renderer for the office network-diagram map (used on both
// index.html and contact.html — same office data, same SVG structure).
// Injects the full world landmass outline into the SVG's .map-bg group
// (once), then draws gold routes from whichever office is flagged is_hub
// out to every other office with coordinates inside MAP_COVERAGE_BOUNDS.
window.renderOfficeMap = function (offices, routeGroupId, nodeGroupId) {
  const routeGroup = document.getElementById(routeGroupId);
  const nodeGroup = document.getElementById(nodeGroupId);
  if (!routeGroup || !nodeGroup || !window.projectLatLng) return;

  const svg = routeGroup.closest('svg');
  const mapBg = svg && svg.querySelector('.map-bg');
  if (mapBg && window.WORLD_MAP_PATHS_SVG && !mapBg.dataset.populated) {
    mapBg.innerHTML = window.WORLD_MAP_PATHS_SVG;
    mapBg.dataset.populated = '1';
  }

  const bounds = window.MAP_COVERAGE_BOUNDS;
  const withCoords = offices.filter(o => o.latitude != null && o.longitude != null);
  const hub = withCoords.find(o => o.isHub) || withCoords[0];
  if (!hub) return;

  const inCoverage = (o) => o.latitude >= bounds.minLat && o.latitude <= bounds.maxLat &&
    o.longitude >= bounds.minLon && o.longitude <= bounds.maxLon;

  const hubPos = window.projectLatLng(hub.latitude, hub.longitude);
  const spokes = withCoords.filter(o => o.id !== hub.id && inCoverage(o));

  let routesHtml = '';
  let nodesHtml = '';

  // On a whole-world map, offices that are geographically close (e.g. Karachi
  // and Ahmedabad, or a spoke sitting right next to the hub) can land within
  // a label's-width of each other. Try a few label positions around each pin
  // (above / below / right / left) and pick whichever overlaps the least with
  // every label box already placed, including the hub's own -- comparing
  // actual text bounding boxes rather than single anchor points, since a
  // long label like "Dubai — Main Office" can still collide even when its
  // anchor point looks reasonably far away.
  const CHAR_W = 7.2, LABEL_H = 13;
  function labelBox(text, x, y, anchor) {
    const w = text.length * CHAR_W;
    const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    return { left, right: left + w, top: y - LABEL_H, bottom: y + 2 };
  }
  function boxOverlap(a, b) {
    const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return ox * oy;
  }
  const labelCandidates = [
    { dx: 0, dy: -22, anchor: 'middle' },
    { dx: 12, dy: 4, anchor: 'start' },
    { dx: -12, dy: 4, anchor: 'end' },
    { dx: 0, dy: 24, anchor: 'middle' }
  ];
  const placedBoxes = [labelBox('Dubai — Main Office', hubPos.x, hubPos.y + 41, 'middle')];

  function pickLabelPos(pos, text) {
    let best = labelCandidates[0], bestScore = Infinity;
    labelCandidates.forEach(c => {
      const box = labelBox(text, pos.x + c.dx, pos.y + c.dy, c.anchor);
      const totalOverlap = placedBoxes.reduce((sum, p) => sum + boxOverlap(box, p), 0);
      if (totalOverlap < bestScore) { bestScore = totalOverlap; best = c; }
    });
    placedBoxes.push(labelBox(text, pos.x + best.dx, pos.y + best.dy, best.anchor));
    return best;
  }

  spokes.forEach((o, i) => {
    const pos = window.projectLatLng(o.latitude, o.longitude);
    const midX = (hubPos.x + pos.x) / 2;
    const midY = (hubPos.y + pos.y) / 2;
    const dist = Math.hypot(pos.x - hubPos.x, pos.y - hubPos.y);
    const lift = Math.min(120, Math.max(12, dist * 0.22));
    const delay = (i * 0.3).toFixed(2);
    routesHtml += `<path class="route" pathLength="1" d="M${hubPos.x.toFixed(2)},${hubPos.y.toFixed(2)} Q${midX.toFixed(2)},${(midY - lift).toFixed(2)} ${pos.x.toFixed(2)},${pos.y.toFixed(2)}" style="animation-delay:${delay}s"/>`;
    const nodeDelay = (1.3 + i * 0.25).toFixed(2);

    const label = pickLabelPos(pos, o.mapLabel);

    nodesHtml += `
      <g class="node" style="animation-delay:${nodeDelay}s">
        <circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="5"/>
        <text x="${(pos.x + label.dx).toFixed(2)}" y="${(pos.y + label.dy).toFixed(2)}" text-anchor="${label.anchor}">${o.mapLabel}</text>
      </g>`;
  });

  nodesHtml += `
    <g class="node node--hub" style="animation-delay:.95s">
      <circle class="pulse" cx="${hubPos.x.toFixed(2)}" cy="${hubPos.y.toFixed(2)}" r="7"/>
      <circle class="hub-dot" cx="${hubPos.x.toFixed(2)}" cy="${hubPos.y.toFixed(2)}" r="7"/>
      <text x="${hubPos.x.toFixed(2)}" y="${(hubPos.y + 41).toFixed(2)}" text-anchor="middle">${hub.mapLabel}</text>
    </g>`;

  routeGroup.innerHTML = routesHtml;
  nodeGroup.innerHTML = nodesHtml;

  const style = document.createElement('style');
  style.textContent = `.network-diagram .node--hub .pulse { transform-origin: ${hubPos.x.toFixed(2)}px ${hubPos.y.toFixed(2)}px; }`;
  document.head.appendChild(style);
};
