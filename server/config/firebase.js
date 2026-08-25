import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const credentialPath = path.join(process.cwd(), 'serviceAccountKey.json');
let firestoreDb;
let isMockDb = false;

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
    return this;
  }

  async update(data) {
    if (!this.storeRef[this.collectionName] || !this.storeRef[this.collectionName][this.id]) {
      throw new Error(`Document ${this.id} not found in ${this.collectionName}`);
    }
    const current = this.storeRef[this.collectionName][this.id];
    this.storeRef[this.collectionName][this.id] = { ...current, ...data };
    return this;
  }

  async delete() {
    if (this.storeRef[this.collectionName]) {
      delete this.storeRef[this.collectionName][this.id];
    }
    return this;
  }
}

class MockQuery {
  constructor(collectionName, docs, storeRef) {
    this.collectionName = collectionName;
    this.docs = docs; // array of doc data objects with .id
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
    // Seed DB in memory
    this.store = {
      users: {
        'default-user-id': {
          name: 'pasupathi',
          email: 'atpasupathi77@gmail.com',
          phone: '9361496790',
          password: '$2a$10$tM9sM3WpIekV1K9Gv1tL9exPZ7s28hZ7J5pUeA05k.Jv6/a/01H/G', // bcrypt for 'password123'
          onboarded: true,
          notificationPreferences: { email: true, sms: true, push: true, voiceCalls: false, voiceCallsCriticalOnly: true },
          googleConnected: false,
          googleDriveSimulatedQuotaUsed: 13421772800,
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
          name: 'electricity biill',
          category: 'Bills',
          amount: 1500,
          dueDate: '2026-08-20',
          status: 'Pending',
          reminderSet: true,
          createdAt: new Date().toISOString()
        }
      }
    };
  }

  collection(name) {
    if (!this.store[name]) {
      this.store[name] = {};
    }
    return new MockCollection(name, this.store);
  }
}

// 1. Initialize Real Firebase if serviceAccountKey.json exists, otherwise fall back to Simulator
if (fs.existsSync(credentialPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
    firestoreDb = getFirestore();
    console.log('🔥 FIREBASE SERVICE ACCOUNT ACTIVE: Connected to Real Cloud Firestore');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK, falling back to memory database:', error.message);
    firestoreDb = new MockFirestore();
    isMockDb = true;
  }
} else {
  console.log('⚠️ serviceAccountKey.json NOT FOUND: Initialized In-Memory Firestore Sandbox Mode');
  firestoreDb = new MockFirestore();
  isMockDb = true;
}

export const db = firestoreDb;
export { isMockDb };
