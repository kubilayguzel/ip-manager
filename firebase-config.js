// kubilayguzel/ip-manager/ip-manager-16f863853773f6cc3df95834f40912917f000fa80/firebase-config.js
// Mevcut kodunuzu açın ve aşağıdaki değişiklikleri yapın.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    getDoc, 
    setDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// --- Mevcut firebaseConfig ve Firebase başlatma kodu buraya gelecek ---
const firebaseConfig = {
    apiKey: "AIzaSyCbhoIXJT9g5ftW62YUlo44M4BOzM9tJ7M",
    authDomain: "ip-manager-production.firebaseapp.com",
    projectId: "ip-manager-production",
    storageBucket: "ip-manager-production.firebasestorage.app",
    messagingSenderId: "378017128708",
    appId: "1:378017128708:web:e2c6fa7b8634022f2ef051",
    measurementId: "G-TQB1CF18Q8"
};

let app, auth, db;
let isFirebaseAvailable = false;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseAvailable = true;
    console.log('🔥 Firebase initialized successfully');
} catch (error) {
    console.error('⚠️ Firebase initialization failed:', error.message);
    console.warn('⚠️ Falling back to localStorage for data management.');
    isFirebaseAvailable = false;
}

// --- YENİ EKLENECEK KOD BAŞLANGICI ---

// Benzersiz ID oluşturma yardımcı fonksiyonu
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Ortak çeviri objeleri (firebase-config.js içine taşındı)
const subDesignationTranslations = {
    'opposition_to_publication': 'Yayına İtiraz',
    'response_to_opposition': 'İtiraza Karşı Görüş',
    'opposition_decision_rejected': 'Yayına İtiraz Kararı - Ret',
    'opposition_decision_accepted': 'Yayına İtiraz Kararı - Kabul'
};

const documentDesignationTranslations = {
    'opposition_trademark_office': 'Yayına İtiraz - Markalar Dairesi',
    'Başvuru Ek Dokümanı': 'Başvuru Ek Dokümanı',
    'Resmi Yazışma': 'Resmi Yazışma',
    'Vekaletname': 'Vekaletname',
    'Teknik Çizim': 'Teknik Çizim',
    'Karar': 'Karar',
    'Finansal Belge': 'Finansal Belge',
    'Yayın Kararı': 'Yayın Kararı',
    'Ret Kararı': 'Ret Kararı',
    'Tescil Belgesi': 'Tescil Belgesi',
    'Araştırma Raporu': 'Araştırma Raporu',
    'İnceleme Raporu': 'İnceleme Raporu',
    'Diğer Belge': 'Diğer Belge',
    'Genel Not': 'Genel Not'
};

// Authentication Service
export const authService = {
    auth: auth,
    isFirebaseAvailable: isFirebaseAvailable,

    async getUserRole(uid) {
        if (!this.isFirebaseAvailable) return null;
        try {
            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                return userDoc.data().role;
            }
            return null;
        } catch (error) {
            console.error("Error getting user role from Firestore:", error);
            return null;
        }
    },

    async setUserRole(uid, email, displayName, role) {
        if (!this.isFirebaseAvailable) return false;
        try {
            const userDocRef = doc(db, 'users', uid);
            await setDoc(userDocRef, {
                email: email,
                displayName: displayName,
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
            console.log(`User ${uid} role set to ${role} in Firestore.`);
            return true;
        } catch (error) {
            console.error("Error setting user role in Firestore:", error);
            return false;
        }
    },

    async signIn(email, password) {
        if (!this.isFirebaseAvailable) return this.localSignIn(email, password);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;
            const role = await this.getUserRole(user.uid) || 'user';
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: role,
                isSuperAdmin: role === 'superadmin'
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            return { success: true, user: userData, message: 'Giriş başarılı' };
        } catch (error) {
            return { success: false, error: error.message || 'Giriş yaparken bir hata oluştu.' };
        }
    },

    async signUp(email, password, displayName, initialRole = 'user') {
        if (!this.isFirebaseAvailable) return this.localSignUp(email, password, displayName, initialRole);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;
            await updateProfile(user, { displayName: displayName });
            await this.setUserRole(user.uid, email, displayName, initialRole);
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: initialRole,
                isSuperAdmin: initialRole === 'superadmin'
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            return { success: true, user: userData, message: 'Hesap oluşturuldu' };
        } catch (error) {
            return { success: false, error: error.message || 'Kayıt olurken bir hata oluştu.' };
        }
    },

    async signOut() {
        try {
            if (this.isFirebaseAvailable && auth) await signOut(auth);
            localStorage.removeItem('currentUser');
            return { success: true };
        } catch (error) {
            localStorage.removeItem('currentUser');
            return { success: true, error: error.message || 'Çıkış yaparken bir hata oluştu.' };
        }
    },

    getCurrentUser() {
        const localUser = localStorage.getItem('currentUser');
        return localUser ? JSON.parse(localUser) : null;
    },

    isSuperAdmin() {
        const currentUser = this.getCurrentUser();
        return currentUser?.role === 'superadmin';
    },

    localSignIn(email, password) {
        const demoAccounts = [
            { email: 'demo@ipmanager.com', password: 'demo123', name: 'Demo Kullanıcı', role: 'user' },
            { email: 'admin@ipmanager.com', password: 'admin123', name: 'Admin Kullanıcı', role: 'admin' },
            { email: 'superadmin@ipmanager.com', password: 'superadmin123', name: 'Süper Admin', role: 'superadmin' },
        ];
        const account = demoAccounts.find(acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password);
        if (account) {
            const userData = {
                uid: 'local_' + Date.now(),
                email: account.email,
                displayName: account.name,
                role: account.role,
                isSuperAdmin: account.role === 'superadmin'
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            return { success: true, user: userData };
        }
        return { success: false, error: 'Geçersiz e-posta veya şifre.' };
    },

    localSignUp(email, password, displayName, initialRole = 'user') {
        const userData = {
            uid: 'local_new_user_' + Date.now(),
            email: email,
            displayName: displayName,
            role: initialRole,
            isSuperAdmin: initialRole === 'superadmin'
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return { success: true, user: userData };
    }
};

export const personsService = {
    async addPerson(personData) {
        try {
            const user = authService.getCurrentUser();
            if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
            const newPerson = {
                ...personData,
                id: generateUUID(),
                userId: user.uid,
                userEmail: user.email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            if (authService.isFirebaseAvailable && db) {
                await setDoc(doc(db, 'persons', newPerson.id), newPerson);
            } else {
                const persons = JSON.parse(localStorage.getItem('persons') || '[]');
                persons.push(newPerson);
                localStorage.setItem('persons', JSON.stringify(persons));
            }
            return { success: true, id: newPerson.id, data: newPerson };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    async getPersons() {
        try {
            if (authService.isFirebaseAvailable && db) {
                const user = authService.getCurrentUser();
                if (!user) return { success: true, data: [] };
                const q = authService.isSuperAdmin()
                    ? query(collection(db, 'persons'), orderBy('name', 'asc'))
                    : query(collection(db, 'persons'), where('userId', '==', user.uid), orderBy('name', 'asc'));
                const querySnapshot = await getDocs(q);
                return { success: true, data: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
            } else {
                return { success: true, data: JSON.parse(localStorage.getItem('persons') || '[]') };
            }
        } catch (error) {
            return { success: false, error: error.message, data: [] };
        }
    },
    async updatePerson(personId, updates) {
        try {
            updates.updatedAt = new Date().toISOString();
            if (authService.isFirebaseAvailable && db) {
                await updateDoc(doc(db, 'persons', personId), updates);
            } else {
                let persons = JSON.parse(localStorage.getItem('persons') || '[]');
                const index = persons.findIndex(p => p.id === personId);
                if (index > -1) {
                    persons[index] = { ...persons[index], ...updates };
                    localStorage.setItem('persons', JSON.stringify(persons));
                }
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    async deletePerson(personId) {
        try {
            if (authService.isFirebaseAvailable && db) {
                await deleteDoc(doc(db, 'persons', personId));
            } else {
                let persons = JSON.parse(localStorage.getItem('persons') || '[]');
                persons = persons.filter(p => p.id !== personId);
                localStorage.setItem('persons', JSON.stringify(persons));
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export const ipRecordsService = {
    findAllDescendants(transactionId, transactions) {
        let descendants = [];
        const children = transactions.filter(tx => tx.parentId === transactionId);
        for (const child of children) {
            descendants.push(child.transactionId);
            descendants = descendants.concat(this.findAllDescendants(child.transactionId, transactions));
        }
        return descendants;
    },

    async addRecord(record) {
        try {
            const user = authService.getCurrentUser();
            if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

            const recordData = {
                ...record,
                userId: user.uid,
                userEmail: user.email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                transactions: record.transactions || [],
                files: (record.files || []).map(file => ({ ...file, id: file.id || generateUUID() }))
            };

            recordData.transactions.unshift({
                transactionId: generateUUID(),
                type: "Record Created",
                description: `Yeni kayıt oluşturuldu: ${recordData.title}`,
                timestamp: recordData.createdAt,
                userId: user.uid,
                userEmail: user.email,
                parentId: null
            });

            if (authService.isFirebaseAvailable && db) {
                const docRef = await addDoc(collection(db, 'ipRecords'), recordData);
                return { success: true, id: docRef.id };
            } else {
                const records = JSON.parse(localStorage.getItem('ipRecords') || '[]');
                recordData.id = generateUUID();
                records.push(recordData);
                localStorage.setItem('ipRecords', JSON.stringify(records));
                return { success: true, id: recordData.id };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getRecords() {
        try {
            if (authService.isFirebaseAvailable && db) {
                const user = authService.getCurrentUser();
                if (!user) return { success: true, data: [] };
                let q = authService.isSuperAdmin()
                    ? query(collection(db, 'ipRecords'), orderBy('createdAt', 'desc'))
                    : query(collection(db, 'ipRecords'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                return { success: true, data: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
            } else {
                return { success: true, data: JSON.parse(localStorage.getItem('ipRecords') || '[]') };
            }
        } catch (error) {
            return { success: false, error: error.message, data: [] };
        }
    },

    async updateRecord(recordId, updates) {
        try {
            const user = authService.getCurrentUser();
            if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

            const updatedTimestamp = new Date().toISOString();
            const recordRef = doc(db, 'ipRecords', recordId);

            const docSnap = await getDoc(recordRef);
            if (!docSnap.exists()) throw new Error('Güncellenecek kayıt bulunamadı.');
            
            const currentRecord = docSnap.data();
            const newTransactions = [...(currentRecord.transactions || [])];
            const oldFiles = currentRecord.files || [];
            const newFiles = updates.files || [];

            const changedFields = [];
            Object.keys(updates).forEach(key => {
                if (key !== 'files' && key !== 'transactions' && String(currentRecord[key] || '') !== String(updates[key] || '')) {
                    changedFields.push(key);
                }
            });
            if (changedFields.length > 0) {
                newTransactions.unshift({
                    transactionId: generateUUID(), type: "Record Updated",
                    description: `Kayıt alanları güncellendi: ${changedFields.join(', ')}`,
                    timestamp: updatedTimestamp, userId: user.uid, userEmail: user.email, parentId: null
                });
            }

            // YENİ: GÜNCELLENMİŞ Transaction Ekleme Mantığı
            newFiles.forEach(newFile => {
                // Sadece yeni eklenmiş dosyalar için işlem yap
                if (!oldFiles.some(oldF => oldF.id === newFile.id)) {
                    
                    let parentTxId = newFile.parentTransactionId || null;
                    
                    // 1. Adım: Ana işlemi belirle
                    // Eğer kullanıcı mevcut bir işlemi parent olarak seçmediyse, yeni bir ana işlem oluştur.
                    if (!parentTxId) {
                        parentTxId = generateUUID(); // Yeni ana işlem için ID oluştur
                        const mainTxDescription = documentDesignationTranslations[newFile.documentDesignation] || newFile.documentDesignation || "Belge indekslendi.";
                        newTransactions.unshift({
                            transactionId: parentTxId,
                            type: "Document Indexed",
                            description: mainTxDescription,
                            documentId: newFile.id,
                            documentName: newFile.name,
                            documentDesignation: newFile.documentDesignation,
                            timestamp: newFile.uploadedAt || updatedTimestamp,
                            userId: user.uid,
                            userEmail: user.email,
                            parentId: null // Yeni ana işlemlerin parent'ı olmaz
                        });
                    }

                    // 2. Adım: Varsa, alt işlemi oluştur ve ana işleme bağla
                    // Eğer dosyanın bir alt ataması varsa, bu her zaman bir alt işlemdir.
                    if (newFile.subDesignation) {
                        const childTxId = generateUUID();
                        const childTxDescription = subDesignationTranslations[newFile.subDesignation] || newFile.subDesignation;
                        newTransactions.unshift({
                            transactionId: childTxId,
                            type: "Document Sub-Indexed",
                            description: childTxDescription,
                            documentId: newFile.id,
                            documentName: newFile.name,
                            documentDesignation: newFile.documentDesignation,
                            subDesignation: newFile.subDesignation,
                            timestamp: newFile.uploadedAt || updatedTimestamp,
                            userId: user.uid,
                            userEmail: user.email,
                            parentId: parentTxId // Mevcut veya yeni oluşturulan ana işleme bağla
                        });
                    }
                }
            });

            const finalUpdates = { ...updates, updatedAt: updatedTimestamp, transactions: newTransactions };

            if (authService.isFirebaseAvailable && db) {
                await updateDoc(recordRef, finalUpdates);
            } else {
                let records = JSON.parse(localStorage.getItem('ipRecords') || '[]');
                const index = records.findIndex(r => r.id === recordId);
                if (index > -1) {
                    records[index] = { ...records[index], ...finalUpdates };
                    localStorage.setItem('ipRecords', JSON.stringify(records));
                }
            }
            return { success: true };
        } catch (error) {
            console.error('Update record error:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteRecord(recordId) {
        try {
            if (authService.isFirebaseAvailable && db) {
                await deleteDoc(doc(db, 'ipRecords', recordId));
            } else {
                let records = JSON.parse(localStorage.getItem('ipRecords') || '[]');
                records = records.filter(r => r.id !== recordId);
                localStorage.setItem('ipRecords', JSON.stringify(records));
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteTransaction(recordId, transactionIdToDelete) {
        try {
            if (authService.isFirebaseAvailable && db) {
                const recordRef = doc(db, 'ipRecords', recordId);
                const docSnap = await getDoc(recordRef);
                if (!docSnap.exists()) throw new Error('Kayıt bulunamadı.');
                const allTransactions = docSnap.data().transactions || [];
                const idsToDelete = new Set([transactionIdToDelete, ...this.findAllDescendants(transactionIdToDelete, allTransactions)]);
                const newTransactions = allTransactions.filter(tx => !idsToDelete.has(tx.transactionId));
                await updateDoc(recordRef, { transactions: newTransactions });
                return { success: true, remainingTransactions: newTransactions };
            } else {
                return { success: false, error: 'Local mode not implemented for this' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateTransaction(recordId, transactionId, updates) {
        try {
            if (authService.isFirebaseAvailable && db) {
                const recordRef = doc(db, 'ipRecords', recordId);
                const docSnap = await getDoc(recordRef);
                if (!docSnap.exists()) throw new Error('Kayıt bulunamadı.');
                const newTransactions = docSnap.data().transactions.map(tx => {
                    return tx.transactionId === transactionId ? { ...tx, ...updates, timestamp: new Date().toISOString() } : tx;
                });
                await updateDoc(recordRef, { transactions: newTransactions });
                return { success: true };
            } else {
                return { success: false, error: 'Local mode not implemented for this' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
};

export async function createDemoData() {
    // Demo verisi oluşturma fonksiyonu (değişiklik yok)
}

export { subDesignationTranslations, documentDesignationTranslations };
export { auth, db, generateUUID };