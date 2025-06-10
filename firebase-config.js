// firebase-config.js - IP Manager Production Config
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  increment,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { 
  getAnalytics, 
  logEvent 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Firebase Configuration - IP Manager Production
const firebaseConfig = {
  apiKey: "AIzaSyCbhoIXJT9g5ftW62YUlo44M4BOzM9tJ7M",
  authDomain: "ip-manager-production.firebaseapp.com",
  projectId: "ip-manager-production",
  storageBucket: "ip-manager-production.firebasestorage.app",
  messagingSenderId: "378017128708",
  appId: "1:378017128708:web:e2c6fa7b8634022f2ef051",
  measurementId: "G-TQB1CF18Q8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Auth Service Class
export class AuthService {
  constructor() {
    this.currentUser = null;
    this.initializeAuthListener();
  }

  initializeAuthListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        console.log('✅ User signed in:', user.email);
        this.updateUserInFirestore(user);
        // Analytics
        logEvent(analytics, 'login', { method: 'email' });
      } else {
        console.log('❌ User signed out');
      }
    });
  }

  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      await this.createUserDocument(user, { displayName });

      // Analytics
      logEvent(analytics, 'sign_up', { method: 'email' });

      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  async createUserDocument(user, additionalData = {}) {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const { displayName, email } = user;

      try {
        await setDoc(userRef, {
          displayName: displayName || additionalData.displayName,
          email,
          role: 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          ...additionalData
        });
        console.log('✅ User document created');
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    }
  }

  async updateUserInFirestore(user) {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.warn('Could not update last login:', error);
    }
  }

  getErrorMessage(error) {
    const errorMessages = {
      'auth/user-not-found': 'Kullanıcı bulunamadı',
      'auth/wrong-password': 'Hatalı şifre',
      'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda',
      'auth/weak-password': 'Şifre çok zayıf (en az 6 karakter)',
      'auth/invalid-email': 'Geçersiz e-posta adresi',
      'auth/too-many-requests': 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.',
      'auth/network-request-failed': 'Ağ bağlantısı hatası'
    };

    return errorMessages[error.code] || error.message;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }
}

// IP Records Service Class
export class IPRecordsService {
  constructor() {
    this.collectionName = 'ip-records';
  }

  async createRecord(recordData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const record = {
        ...recordData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        version: 1
      };

      const docRef = await addDoc(collection(db, this.collectionName), record);
      console.log('✅ Record created with ID:', docRef.id);
      
      // Analytics
      logEvent(analytics, 'ip_record_created', { 
        type: recordData.type,
        user_id: user.uid 
      });

      return { success: true, id: docRef.id, data: record };
    } catch (error) {
      console.error('Error creating record:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserRecords(limitCount = 50) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to Date objects
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        applicationDate: doc.data().applicationDate || new Date().toISOString().split('T')[0]
      }));

      return { success: true, data: records };
    } catch (error) {
      console.error('Error fetching records:', error);
      return { success: false, error: error.message };
    }
  }

  async getFilteredRecords(filters = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      let q = query(
        collection(db, this.collectionName),
        where('userId', '==', user.uid)
      );

      // Apply filters
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      // Always order by creation date
      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        applicationDate: doc.data().applicationDate || new Date().toISOString().split('T')[0]
      }));

      return { success: true, data: records };
    } catch (error) {
      console.error('Error fetching filtered records:', error);
      return { success: false, error: error.message };
    }
  }

  async updateRecord(recordId, updateData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const recordRef = doc(db, this.collectionName, recordId);
      
      // Verify ownership
      const recordDoc = await getDoc(recordRef);
      if (!recordDoc.exists() || recordDoc.data().userId !== user.uid) {
        throw new Error('Record not found or access denied');
      }

      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp(),
        version: increment(1)
      };

      await updateDoc(recordRef, updatedData);
      console.log('✅ Record updated:', recordId);

      return { success: true };
    } catch (error) {
      console.error('Error updating record:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteRecord(recordId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const recordRef = doc(db, this.collectionName, recordId);
      
      // Verify ownership
      const recordDoc = await getDoc(recordRef);
      if (!recordDoc.exists() || recordDoc.data().userId !== user.uid) {
        throw new Error('Record not found or access denied');
      }

      await deleteDoc(recordRef);
      console.log('✅ Record deleted:', recordId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting record:', error);
      return { success: false, error: error.message };
    }
  }

  async getRecordStats() {
    try {
      const records = await this.getUserRecords(1000); // Get all for stats
      
      if (!records.success) {
        throw new Error(records.error);
      }

      const stats = records.data.reduce((acc, record) => {
        acc.total++;
        acc[record.type] = (acc[record.type] || 0) + 1;
        acc.statuses[record.status] = (acc.statuses[record.status] || 0) + 1;
        return acc;
      }, { 
        total: 0, 
        patent: 0, 
        trademark: 0, 
        copyright: 0, 
        design: 0,
        statuses: {}
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscription
  subscribeToUserRecords(callback) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        applicationDate: doc.data().applicationDate || new Date().toISOString().split('T')[0]
      }));
      
      callback(records);
    }, (error) => {
      console.error('Real-time subscription error:', error);
    });
  }
}

// File Upload Service Class
export class FileUploadService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
  }

  validateFile(file) {
    const errors = [];

    if (file.size > this.maxFileSize) {
      errors.push(`Dosya çok büyük. Maksimum boyut: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (!this.allowedTypes.includes(file.type)) {
      errors.push('Desteklenmeyen dosya formatı');
    }

    return errors;
  }

  async uploadFile(file, recordId, onProgress = null) {
    try {
      // Validate file
      const validationErrors = this.validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Create storage path
      const fileName = `${Date.now()}-${file.name}`;
      const storagePath = `ip-files/${user.uid}/${recordId}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => reject(error),
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Save file metadata to Firestore
              const fileMetadata = {
                originalName: file.name,
                storagePath,
                downloadURL,
                size: file.size,
                mimeType: file.type,
                uploadedBy: user.uid,
                recordId,
                uploadedAt: serverTimestamp()
              };

              const fileDocRef = await addDoc(collection(db, 'files'), fileMetadata);
              
              // Analytics
              logEvent(analytics, 'file_uploaded', { 
                file_type: file.type,
                file_size: file.size 
              });

              resolve({
                success: true,
                fileId: fileDocRef.id,
                downloadURL,
                metadata: fileMetadata
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('File upload error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Persons Service Class
export class PersonsService {
  constructor() {
    this.collectionName = 'persons';
  }

  async createPerson(personData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const person = {
        ...personData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        isActive: true
      };

      const docRef = await addDoc(collection(db, this.collectionName), person);
      console.log('✅ Person created with ID:', docRef.id);
      
      return { success: true, id: docRef.id, data: person };
    } catch (error) {
      console.error('Error creating person:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserPersons() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const q = query(
        collection(db, this.collectionName),
        where('createdBy', '==', user.uid),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const persons = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      return { success: true, data: persons };
    } catch (error) {
      console.error('Error fetching persons:', error);
      return { success: false, error: error.message };
    }
  }
}

// Utility functions
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    // Firestore Timestamp
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('tr-TR');
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Initialize services
export const authService = new AuthService();
export const ipRecordsService = new IPRecordsService();
export const fileUploadService = new FileUploadService();
export const personsService = new PersonsService();

// Demo data creator for testing
export const createDemoData = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.warn('User not authenticated for demo data creation');
    return;
  }

  const demoRecords = [
    {
      type: 'patent',
      title: 'Yenilikçi Güneş Paneli Teknolojisi',
      description: 'Yüksek verimli güneş paneli teknolojisi',
      status: 'approved',
      applicationNumber: 'TR2024-001234',
      applicationDate: '2024-01-15',
      owners: [{ name: 'Teknoloji A.Ş.', type: 'company' }]
    },
    {
      type: 'trademark',
      title: 'EcoTech Marka Tescili',
      description: 'Çevre dostu teknoloji markası',
      status: 'pending',
      applicationNumber: 'TR2024-002345',
      applicationDate: '2024-02-20',
      owners: [{ name: 'Ahmet Yılmaz', type: 'individual' }]
    }
  ];

  for (const record of demoRecords) {
    await ipRecordsService.createRecord(record);
  }

  console.log('✅ Demo data created');
};

console.log('🔥 Firebase services initialized successfully!');"// firebase-config.js content here" 
