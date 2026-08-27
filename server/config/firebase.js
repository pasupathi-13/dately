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

// 1. Initialize Real Firebase if serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env exists
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    let serviceAccount;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (raw.startsWith('{')) {
      serviceAccount = JSON.parse(raw);
    } else {
      // Try base64 decoding
      serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
    initializeApp({
      credential: cert(serviceAccount)
    });
    firestoreDb = getFirestore();
    console.log('🔥 FIREBASE SERVICE ACCOUNT ACTIVE: Connected to Real Cloud Firestore from Env');
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env, falling back to disk database:', error.message);
    firestoreDb = new MockFirestore();
    isMockDb = true;
  }
} else if (fs.existsSync(credentialPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
    firestoreDb = getFirestore();
    console.log('🔥 FIREBASE SERVICE ACCOUNT ACTIVE: Connected to Real Cloud Firestore from file');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK from file, falling back to disk database:', error.message);
    firestoreDb = new MockFirestore();
    isMockDb = true;
  }
} else {
  console.log('📦 Initialized Persistent Disk / Sandbox Database Engine');
  firestoreDb = new MockFirestore();
  isMockDb = true;
}

export const db = firestoreDb;
export { isMockDb };
