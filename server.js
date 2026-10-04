// server.js - Offline Sync Conflict Resolution Backend Engine
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

/**
 * IN-MEMORY DATABASE STATE
 * In production, this would reside in PostgreSQL/MongoDB.
 */
let canonicalDocument = {
  id: 'doc-gdg-01',
  title: 'Project Roadmap 2026',
  content: 'Initial planning for GDG campus recruitment and workshops.',
  category: 'Planning',
  tags: ['gdg', 'srm', 'q4'],
  version: 1,
  lastModifiedBy: 'system',
  updatedAt: new Date().toISOString()
};

// Version history audit trail for rollbacks & 3-way base diffs
let versionHistory = [
  { ...canonicalDocument }
];

// Activity log for live dashboard inspection
let activityLogs = [
  {
    id: 1,
    timestamp: new Date().toLocaleTimeString(),
    type: 'INIT',
    message: 'Canonical document initialized at Version 1.',
    deviceId: 'system'
  }
];

// Replay protection / Idempotency cache (prevents duplicate network requests)
const processedSyncRequests = new Set();

/**
 * 3-WAY MERGE & CONFLICT DETECTION ENGINE
 * Compares:
 * - baseDoc: Document version the client started editing from
 * - currentDoc: Current canonical document in the database
 * - incomingChanges: Fields modified by the incoming client
 */
function evaluateSync(baseDoc, currentDoc, incomingChanges) {
  // If baseDoc doesn't exist (e.g. wiped), fallback to current
  const base = baseDoc || currentDoc;
  
  const mergedData = { ...currentDoc };
  const conflictingFields = [];
  const autoMergedFields = [];

  for (const key of Object.keys(incomingChanges)) {
    // Skip metadata fields
    if (['id', 'version', 'updatedAt', 'lastModifiedBy'].includes(key)) continue;

    const baseVal = JSON.stringify(base[key]);
    const currentVal = JSON.stringify(currentDoc[key]);
    const incomingVal = JSON.stringify(incomingChanges[key]);

    // Check if client actually changed this field from their base version
    if (baseVal !== incomingVal) {
      // Check if server current also changed from the base version
      if (baseVal === currentVal) {
        // Safe: Server was never touched in this field. Apply incoming change cleanly.
        mergedData[key] = incomingChanges[key];
        autoMergedFields.push(key);
      } else if (currentVal === incomingVal) {
        // Both sides made identical changes. No conflict!
        mergedData[key] = incomingChanges[key];
      } else {
        // TRUE CONFLICT: Both client and server changed this field differently!
        conflictingFields.push({
          field: key,
          baseValue: base[key],
          serverValue: currentDoc[key],
          incomingValue: incomingChanges[key]
        });
      }
    }
  }

  return {
    hasConflict: conflictingFields.length > 0,
    conflictingFields,
    autoMergedFields,
    mergedData
  };
}

// GET Current Canonical State
app.get('/api/document', (req, res) => {
  res.json({
    document: canonicalDocument,
    history: versionHistory,
    logs: activityLogs
  });
});

// POST /api/sync - Process Sync Request from Laptop or Phone
app.post('/api/sync', (req, res) => {
  const { requestId, deviceId, baseVersion, changes } = req.body;

  if (!requestId || !deviceId || baseVersion === undefined || !changes) {
    return res.status(400).json({ error: 'Missing required sync payload parameters.' });
  }

  // 1. Idempotency Check (Duplicate request protection)
  if (processedSyncRequests.has(requestId)) {
    return res.json({
      status: 'IGNORED_DUPLICATE',
      message: 'Request already processed (idempotency guard).',
      document: canonicalDocument
    });
  }
  processedSyncRequests.add(requestId);

  // 2. Exact Match (Clean fast-path: server hasn't changed since client fetched)
  if (baseVersion === canonicalDocument.version) {
    canonicalDocument = {
      ...canonicalDocument,
      ...changes,
      version: canonicalDocument.version + 1,
      lastModifiedBy: deviceId,
      updatedAt: new Date().toISOString()
    };
    versionHistory.push({ ...canonicalDocument });

    activityLogs.unshift({
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'ACCEPTED',
      message: `${deviceId} applied changes cleanly (v${baseVersion} ➔ v${canonicalDocument.version}).`,
      deviceId
    });

    return res.json({
      status: 'ACCEPTED',
      document: canonicalDocument,
      message: 'Changes accepted cleanly without branching.'
    });
  }

  // 3. Stale Base Version Detected -> Perform Conflict & 3-Way Merge Evaluation
  const baseDoc = versionHistory.find(v => v.version === Number(baseVersion)) || versionHistory[0];
  const evaluation = evaluateSync(baseDoc, canonicalDocument, changes);

  if (evaluation.hasConflict) {
    // Conflict requiring client or user resolution
    activityLogs.unshift({
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'CONFLICT',
      message: `Conflict detected on ${deviceId}: collided on [${evaluation.conflictingFields.map(f => f.field).join(', ')}].`,
      deviceId
    });

    return res.status(409).json({
      status: 'CONFLICT',
      baseVersion,
      serverVersion: canonicalDocument.version,
      conflicts: evaluation.conflictingFields,
      serverDocument: canonicalDocument,
      incomingChanges: changes,
      message: 'Collision detected on one or more concurrent edits.'
    });
  }

  // 4. Non-Conflicting Changes -> Auto-Merged!
  canonicalDocument = {
    ...evaluation.mergedData,
    version: canonicalDocument.version + 1,
    lastModifiedBy: `${canonicalDocument.lastModifiedBy} + ${deviceId}`,
    updatedAt: new Date().toISOString()
  };
  versionHistory.push({ ...canonicalDocument });

  activityLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    type: 'MERGED',
    message: `Auto-merged changes from ${deviceId} on fields [${evaluation.autoMergedFields.join(', ')}].`,
    deviceId
  });

  return res.json({
    status: 'MERGED',
    document: canonicalDocument,
    mergedFields: evaluation.autoMergedFields,
    message: 'Non-conflicting changes successfully merged.'
  });
});

// POST /api/resolve - Manually resolve a flagged conflict
app.post('/api/resolve', (req, res) => {
  const { deviceId, resolvedData } = req.body;

  if (!resolvedData) {
    return res.status(400).json({ error: 'Resolved document payload is required.' });
  }

  canonicalDocument = {
    ...canonicalDocument,
    ...resolvedData,
    version: canonicalDocument.version + 1,
    lastModifiedBy: `${deviceId} (Resolved)`,
    updatedAt: new Date().toISOString()
  };
  versionHistory.push({ ...canonicalDocument });

  activityLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    type: 'RESOLVED',
    message: `Conflict resolved by ${deviceId}. Bumped to v${canonicalDocument.version}.`,
    deviceId
  });

  return res.json({
    status: 'ACCEPTED',
    document: canonicalDocument
  });
});

// POST /api/reset - Reset state to initial for interview demonstrations
app.post('/api/reset', (req, res) => {
  canonicalDocument = {
    id: 'doc-gdg-01',
    title: 'Project Roadmap 2026',
    content: 'Initial planning for GDG campus recruitment and workshops.',
    category: 'Planning',
    tags: ['gdg', 'srm', 'q4'],
    version: 1,
    lastModifiedBy: 'system',
    updatedAt: new Date().toISOString()
  };
  versionHistory = [{ ...canonicalDocument }];
  activityLogs = [
    {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'INIT',
      message: 'Document reset to Initial State (v1).',
      deviceId: 'system'
    }
  ];
  processedSyncRequests.clear();

  res.json({ status: 'RESET', document: canonicalDocument });
});

app.listen(PORT, () => {
  console.log(`Offline Sync Engine running on http://localhost:${PORT}`);
});
