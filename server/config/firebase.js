import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const credentialPath = path.join(process.cwd(), 'serviceAccountKey.json');
const dataDir = path.join(process.cwd(), 'data');
const dbFilePath = path.join(dataDir, 'db.json');

let firestoreDb;
let isMockDb = false;

// Ensure data directory exists for local disk persistence
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err.message);
  }
}

const saveStoreToDisk = (store) => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist database to disk:', err.message);
  }
};

const loadStoreFromDisk = () => {
  if (fs.existsSync(dbFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
      if (data && typeof data === 'object') {
        return data;
      }
    } catch (err) {
      console.warn('Failed to parse db.json, initializing fresh store:', err.message);
    }
  }
  return null;
};

// High-fidelity Mock Firestore database for sandboxed/local fallback
class MockDocSnapshot {
  constructor(id, data) {
    this.id = id;
    this._data = data;
    this.exists = data !== null && data !== undefined;
  }
  data() {
    return this._data ? { ...this._data, id: this.id } : null;
  }
}

class MockQuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.empty = docs.length === 0;
    this.size = docs.length;
  }
  forEach(callback) {
    this.docs.forEach(callback);
  }
}

class MockDocRef {
  constructor(collectionName, id, storeRef) {
    this.collectionName = collectionName;
    this.id = id;
    this.storeRef = storeRef;
  }

  async get() {
    if (!this.storeRef[this.collectionName]) {
      this.storeRef[this.collectionName] = {};
    }
    const data = this.storeRef[this.collectionName][this.id];
    return new MockDocSnapshot(this.id, data);
  }

  async set(data, options = {}) {
    if (!this.storeRef[this.collectionName]) {
      this.storeRef[this.collectionName] = {};
    }
    const current = this.storeRef[this.collectionName][this.id] || {};
    if (options.merge) {
      this.storeRef[this.collectionName][this.id] = { ...current, ...data };
    } else {
      this.storeRef[this.collectionName][this.id] = data;
    }
    saveStoreToDisk(this.storeRef);
    return this;
  }

  async update(data) {
    if (!this.storeRef[this.collectionName] || !this.storeRef[this.collectionName][this.id]) {
      throw new Error(`Document ${this.id} not found in ${this.collectionName}`);
    }
    const current = this.storeRef[this.collectionName][this.id];
    this.storeRef[this.collectionName][this.id] = { ...current, ...data };
    saveStoreToDisk(this.storeRef);
    return this;
  }

  async delete() {
    if (this.storeRef[this.collectionName]) {
      delete this.storeRef[this.collectionName][this.id];
      saveStoreToDisk(this.storeRef);
    }
    return this;
  }
}

class MockQuery {
  constructor(collectionName, docs, storeRef) {
    this.collectionName = collectionName;
    this.docs = docs;
    this.storeRef = storeRef;
  }

  where(field, operator, value) {
    const filteredDocs = this.docs.filter(doc => {
      const docVal = doc[field];
      if (operator === '==') return docVal === value;
      if (operator === '!=') return docVal !== value;
      if (operator === '>') return docVal > value;
      if (operator === '<') return docVal < value;
      if (operator === '>=') return docVal >= value;
      if (operator === '<=') return docVal <= value;
      if (operator === 'array-contains') return Array.isArray(docVal) && docVal.includes(value);
      return false;
    });
    return new MockQuery(this.collectionName, filteredDocs, this.storeRef);
  }

  limit(num) {
    return new MockQuery(this.collectionName, this.docs.slice(0, num), this.storeRef);
  }

  async get() {
    const snapshots = this.docs.map(doc => new MockDocSnapshot(doc.id, doc));
    return new MockQuerySnapshot(snapshots);
  }
}

class MockCollection {
  constructor(name, storeRef) {
    this.name = name;
    this.storeRef = storeRef;
  }

  doc(id) {
    const docId = id || Math.random().toString(36).substring(2, 15);
    return new MockDocRef(this.name, docId, this.storeRef);
  }

  async add(data) {
    const docId = Math.random().toString(36).substring(2, 15);
    if (!this.storeRef[this.name]) {
      this.storeRef[this.name] = {};
    }
    this.storeRef[this.name][docId] = data;
    saveStoreToDisk(this.storeRef);
    return new MockDocRef(this.name, docId, this.storeRef);
  }

  where(field, operator, value) {
    const collDocs = Object.keys(this.storeRef[this.name] || {}).map(id => ({
      ...this.storeRef[this.name][id],
      id
    }));
    const query = new MockQuery(this.name, collDocs, this.storeRef);
    return query.where(field, operator, value);
  }

  async get() {
    const collDocs = Object.keys(this.storeRef[this.name] || {}).map(id => ({
      ...this.storeRef[this.name][id],
      id
    }));
    const snapshots = collDocs.map(doc => new MockDocSnapshot(doc.id, doc));
    return new MockQuerySnapshot(snapshots);
  }
}

class MockFirestore {
  constructor() {
    const diskStore = loadStoreFromDisk();
    if (diskStore) {
      this.store = diskStore;
    } else {
      // Seed default admin / demo user
      this.store = {
        users: {
          'default-user-id': {
            name: 'pasupathi',
            email: 'atpasupathi77@gmail.com',
            phone: '9361496790',
            password: '$2a$10$fWi3kqlAFXh0GvbeP9MT6.In42wBQzMwFG4CGABqvGlkRVA8mn6vO', // bcrypt for 'password123'
            onboarded: true,
            notificationPreferences: { email: true, sms: true, push: true, voiceCalls: false, voiceCallsCriticalOnly: true },
            googleConnected: false,
            googleDriveSimulatedQuotaUsed: 0,
            googleDriveSimulatedQuotaTotal: 16106127360,
            googleDriveForceQuotaExceeded: false,
            googleTokens: null,
            googleDriveFolderId: '',
            createdAt: new Date().toISOString()
          }
        },
        documents: {},
        obligations: {
          'default-ob-id': {
            user: 'default-user-id',
            name: 'electricity bill',
            category: 'Bills',
            amount: 1500,
            dueDate: '2026-09-01',
            status: 'Pending',
            reminderSet: true,
            createdAt: new Date().toISOString()
          }
        },
        reminders: {},
        otps: {}
      };
      saveStoreToDisk(this.store);
    }
  }

  collection(name) {
    if (!this.store[name]) {
      this.store[name] = {};
    }
    return new MockCollection(name, this.store);
  }
}

const B64_SERVICE_ACCOUNT = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiZGF0ZWx5LTMxZjVmIiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiNmM2ZTlkNjQ3ZjExM2RkNjY3ZmVkMDMzMTk4NDYyYmNiMDY1MzEyMiIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFBb0lCQVFEZ1BJcHgxYTN5RVkvNlxuWS9ERTRzQWhoOWhJVC9KWGJiNUhwTy9neGM2SmFFdUVHd04wR1VVQTQ2bjFTRnNiaDJ4am1qT0cvbEZFKzc2eVxuWlVkbktYYnViK3VvNFplR0RURHJkSXZhVWdoU0M2bndwdWcwTXplZW10VXdiSFVNd3JqRXVBc2d3VndXTlNvQ1xubGJqcGNSWlZlZHIvZG9KaFJRTGpsZWFMRkYzR0VqbzBxWDBFd1UxeTJVc2w3ZlhMaVpJaXhGcUsrYnIxanFMalxuMmhUYjZoV2FNeUhOYkV4VWQzWXFuMll1a3cxbWF6M2tFQXRRSFRuQ2hxRjRFbDlrOG1oNkc5WXkrVytWL2NmYlxuRW1zcHdUN3cxdWNCTW8wcCt5ZWdJUy9EajRyN25CZmNzd2ZuMS84amJVb25pQ0pKRkYwc3BIbk1KUGZGcTBldFxuZHhCYjlTVUJBZ01CQUFFQ2dnRUFBd2pCNGdZTUxPa3FVNVZ4QkRLYnJpVkZvU1RkWld2Y3ZIcWszNEluVG9DdVxuWWJZS1EreE96K3lySGhQQnhLVXhxM2oxZllqdmI4bUdyRUtBTFQ1aC9nREU1WkllU3l0RTdQM243bzJMTm5xWlxuSUJXMVNxa2g5WWwxTnFTSGRiMGt5aHNPb2VRSXVDa0NaMUR6Vk11NXZ0Y21FeExkY3kzbDRVOUtXdTBHYkp6aFxub1ptWnYrTERUK2VrT3FYU09pOW1MelVQcnRGNmduREUxN2QvVmdrQ0hzSjNYYWl0cyszYTZHdXB4Z2x6VTk0dVxubzRKOE55bGx4VmVCN2p1aU5wY08wUlpOc3dRV3luaUdjZ3h6NWk5eTRDMzh1VzZYZDh1QndQRlA0YzNEZnZ1NlxuZHNrOHJhWEtKaTVEUHhqWFBCczQ5V28vYmlnY2s1M0Y3WUduaDg3ZnlRS0JnUUQrL1RFZVZKMUpKT0IxYitMRVxubTlvSGFlWTFCcWF0VXgxeWRCL0d1TXJ6TVBXZFFPWnpEelpvQmJycWtQdmU4WGR0WEYxdjFIL1QvRU1oNWlKTVxuaS8rc2xObHBFREdaK280OEZWeFcwYWo2TnVDS2NSWDUxNDhFektaZTBiOVl1Y2VNRVYxUHVSMldFem5pdXVKaFxueWoxTjBTcDBTdUpVMnRjM2hHL2JhN0JPNHdLQmdRRGhJQ0xETGxHRFhIb2Z3cDJXa1h0NUhHUVJPb3lpOWwzL1xuT0l5OGpCbmtzMjgvN0R4Y3U0SkpMNVQ3aDJuQTlMQ1VWOHlOWWI3WWtneElOLzcwd3FSRTZ3NWFSNC9GWlNGMFxuS24xSVdseU5XWWFPSnYvTFZGVy8ybFRScVdaSHdBaU5ZTG5CdmdJdFFmY3Rodk1qTGxjS2plK082aUFEcFRheFxuR3JjQVVzTzl5d0tCZ1FDWnprbVJmUUordTBLMU02NzZYdlB0b3VBY1BnM040S09UaFI0aHRSZWVCM3N2eHBUNlxuOUVNaURjckljSG1zNmNQYThHcmY2TExPUUl5UjV3bnJXRXI1WTdPY1h3czhVTmo0dnYyNjFLNXpkeVNML1ZoL1xuSXBuL0VCNk9kVUJSR1lhWEkyWkFqMjJjTjY2ajU0eGo1aVNDU3RlcjIvdVhxWVZGMUpuUUphM3Nkd0tCZ0FaMFxuWEdyS0xpNGMvYWRoZGhFMkZKc3hWREVtUTVmOGhrOWwrS3NEUFU3UVVqVTcrYk1TOFRaVjllaU1SbHp3NXdzcFxueFVTY2M5TlR4S1JoYnA3bjRidlVIWEk3TVFVUTFEZTNiQ1loNlJ0b1lMSThyZ0xQWlRIOStZYVZXOGhjMmlIclxuandmZUFjUDRhelRUOUs2aWluNVQrWFZZZ3hoM3FTekV2bEIxRHdXbkFvR0JBTWwydUdNRzVibmZKWnJHTlBJL1xuMXduaXVaUFoxL05hY2RGYkZ6a3hyMXFCTGN2blA0Sm95Nmpqbm9XelFnWnpYS25wZ0lRVFJNYktPekVnMFJpd1xuUVdWd3J1NVcrYmJybTFtME1VM1g5MFRDRGVXaUZYOFAxVE45TVE3NVRsVWhiRFR4K2wrOVFOYXpNcm41RmdhL1xuZkFaUWFWYW9ZS2ZWeVpmT29uc3Q1Lys5XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAZGF0ZWx5LTMxZjVmLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjEwNjk2NTU0MzI5MTc3MzkwMTI3NCIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBkYXRlbHktMzFmNWYuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K";

try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    serviceAccount = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } else if (fs.existsSync(credentialPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
  } else {
    serviceAccount = JSON.parse(Buffer.from(B64_SERVICE_ACCOUNT, 'base64').toString('utf8'));
  }

  initializeApp({
    credential: cert(serviceAccount)
  });
  firestoreDb = getFirestore();
  console.log('🔥 FIREBASE SERVICE ACCOUNT ACTIVE: Connected to Real Cloud Firestore (dately-31f5f)');
} catch (error) {
  console.error('Failed to initialize Real Firebase Cloud Firestore, falling back to disk database:', error.message);
  firestoreDb = new MockFirestore();
  isMockDb = true;
}

export const db = firestoreDb;
export { isMockDb };
