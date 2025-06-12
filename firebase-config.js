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
    getDoc, // Belirli bir belgeyi çekmek için eklendi
    setDoc // Belge oluşturmak veya üzerine yazmak için eklendi
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
    // Kriptografik olarak güçlü UUID için window.crypto.randomUUID() tercih edilebilir
    // Ancak daha geniş uyumluluk için bu basit versiyon kullanıldı.
    // Modern tarayıcılarda `return crypto.randomUUID();` kullanılabilir.
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

    // Helper to get user role from Firestore (Şimdi authService'in bir metodu)
    async getUserRole(uid) {
        if (!this.isFirebaseAvailable) return null; // Firebase yoksa null dön
        try {
            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                return userDoc.data().role;
            }
            return null; // Belge yoksa
        } catch (error) {
            console.error("Error getting user role from Firestore:", error);
            return null;
        }
    },

    // Helper to set user role in Firestore (Şimdi authService'in bir metodu)
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
            }, { merge: true }); // Merge true ile sadece verilen alanları günceller veya ekler
            console.log(`User ${uid} role set to ${role} in Firestore.`);
            return true;
        } catch (error) {
            console.error("Error setting user role in Firestore:", error);
            return false;
        }
    },

    async signIn(email, password) {
        console.log('🔐 Attempting sign in with:', email);
        
        if (!this.isFirebaseAvailable) {
            return this.localSignIn(email, password);
        }
        
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;
            const role = await this.getUserRole(user.uid) || 'user'; // Varsayılan rol 'user'

            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: role,
                isSuperAdmin: role === 'superadmin' // isSuperAdmin özelliğini burada belirle
            };
            localStorage.setItem('currentUser', JSON.stringify(userData)); // Güncel kullanıcıyı LocalStorage'a kaydet
            
            return {
                success: true,
                user: userData,
                message: 'Giriş başarılı'
            };
        } catch (error) {
            console.error('Firebase sign in error:', error);
            return { success: false, error: error.message || 'Giriş yaparken bir hata oluştu.' };
        }
    },

    async signUp(email, password, displayName, initialRole = 'user') {
        console.log('📝 Attempting sign up with:', email, 'Role:', initialRole);
        
        if (!this.isFirebaseAvailable) {
            return this.localSignUp(email, password, displayName, initialRole);
        }
        
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;
            
            await updateProfile(user, {
                displayName: displayName
            });

            // Firestore'a kullanıcı rolünü kaydet
            await this.setUserRole(user.uid, email, displayName, initialRole);
            
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: initialRole,
                isSuperAdmin: initialRole === 'superadmin' // isSuperAdmin özelliğini belirle
            };
            localStorage.setItem('currentUser', JSON.stringify(userData)); // Yeni kullanıcıyı LocalStorage'a kaydet

            return {
                success: true,
                user: userData,
                message: 'Hesap oluşturuldu'
            };
        } catch (error) {
            console.error('Firebase sign up error:', error);
            return { success: false, error: error.message || 'Kayıt olurken bir hata oluştu.' };
        }
    },

    async signOut() {
        try {
            if (this.isFirebaseAvailable && auth) {
                await signOut(auth);
            }
            localStorage.removeItem('currentUser');
            console.log('✅ User signed out. LocalStorage cleaned.');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            localStorage.removeItem('currentUser');
            return { success: true, error: error.message || 'Çıkış yaparken bir hata oluştu.' };
        }
    },

    getCurrentUser() {
        const localUser = localStorage.getItem('currentUser');
        if (localUser) {
            return JSON.parse(localUser);
        }
        return null;
    },

    isSuperAdmin() {
        const currentUser = this.getCurrentUser();
        return currentUser?.role === 'superadmin' || currentUser?.isSuperAdmin === true;
    },

    localSignIn(email, password) {
        console.log('🧪 Local sign in attempt (Firebase not available):', email, password);
        
        const demoAccounts = [
            { email: 'demo@ipmanager.com', password: 'demo123', name: 'Demo Kullanıcı', role: 'user' },
            { email: 'admin@ipmanager.com', password: 'admin123', name: 'Admin Kullanıcı', role: 'admin' },
            { email: 'superadmin@ipmanager.com', password: 'superadmin123', name: 'Süper Admin', role: 'superadmin' },
        ];

        const account = demoAccounts.find(acc =>
            acc.email.toLowerCase().trim() === email.toLowerCase().trim() &&
            acc.password === password.trim()
        );

        if (account) {
            const userData = {
                uid: 'local_' + Date.now(),
                email: account.email,
                displayName: account.name,
                role: account.role,
                isSuperAdmin: account.role === 'superadmin'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
            console.log('✅ Local sign in successful:', userData);
            
            return { success: true, user: userData };
        }

        console.error('❌ Local sign in failed - invalid credentials');
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

// GÜNCELLEME #1: Diğer modüllerin ihtiyaç duyduğu `personsService` eklendi.
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
                return { success: true, id: newPerson.id, data: newPerson };
            } else {
                const persons = JSON.parse(localStorage.getItem('persons') || '[]');
                persons.push(newPerson);
                localStorage.setItem('persons', JSON.stringify(persons));
                return { success: true, id: newPerson.id, data: newPerson };
            }
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
                const persons = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return { success: true, data: persons };
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
                return { success: true };
            } else {
                let persons = JSON.parse(localStorage.getItem('persons') || '[]');
                const index = persons.findIndex(p => p.id === personId);
                if (index > -1) {
                    persons[index] = { ...persons[index], ...updates };
                    localStorage.setItem('persons', JSON.stringify(persons));
                    return { success: true };
                }
                return { success: false, error: 'Kişi bulunamadı' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    async deletePerson(personId) {
        try {
            if (authService.isFirebaseAvailable && db) {
                await deleteDoc(doc(db, 'persons', personId));
                return { success: true };
            } else {
                let persons = JSON.parse(localStorage.getItem('persons') || '[]');
                persons = persons.filter(p => p.id !== personId);
                localStorage.setItem('persons', JSON.stringify(persons));
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};


// IP Records Service (Firestore veya localStorage)
export const ipRecordsService = {
    // GÜNCELLEME #3: Silme işlemi için özyinelemeli (recursive) yardımcı fonksiyon
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
        console.log('💾 Adding record:', record);
        try {
            const user = authService.getCurrentUser();
            if (!user || !user.uid) throw new Error('Kullanıcı oturumu bulunamadı');

            const recordData = {
                ...record,
                userId: user.uid,
                userEmail: user.email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                transactions: record.transactions || [],
                files: (record.files || []).map(file => ({
                    ...file,
                    id: file.id || generateUUID(),
                    uploadedAt: file.uploadedAt || new Date().toISOString(),
                    documentDesignation: file.documentDesignation || null,
                    subDesignation: file.subDesignation || null
                }))
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
                return { success: true, id: docRef.id, data: recordData };
            } else {
                const records = JSON.parse(localStorage.getItem('ipRecords') || '[]');
                recordData.id = generateUUID();
                records.push(recordData);
                localStorage.setItem('ipRecords', JSON.stringify(records));
                return { success: true, id: recordData.id, data: recordData };
            }
        } catch (error) {
            console.error('Add record error:', error);
            return { success: false, error: error.message || 'Kayıt eklenirken bir hata oluştu.' };
        }
    },

    async getRecords() {
        console.log('📋 Getting records...');
        try {
            if (authService.isFirebaseAvailable && db) {
                const user = authService.getCurrentUser();
                if (!user || !user.uid) {
                    return this.localGetRecords();
                }
                let q = authService.isSuperAdmin()
                    ? query(collection(db, 'ipRecords'), orderBy('createdAt', 'desc'))
                    : query(collection(db, 'ipRecords'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return { success: true, data: records };
            } else {
                return { success: true, data: JSON.parse(localStorage.getItem('ipRecords') || '[]') };
            }
        } catch (error) {
            console.error('Get records error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async updateRecord(recordId, updates) {
        console.log(`🔄 Updating record ${recordId}:`, updates);
        try {
            const user = authService.getCurrentUser();
            if (!user || !user.uid) throw new Error('Kullanıcı oturumu bulunamadı');

            const updatedTimestamp = new Date().toISOString();
            const recordRef = doc(db, 'ipRecords', recordId);

            const docSnap = await getDoc(recordRef);
            if (!docSnap.exists()) throw new Error('Güncellenecek kayıt bulunamadı.');
            
            const currentRecord = docSnap.data();
            const newTransactions = [...(currentRecord.transactions || [])];

            const changedFields = [];
            const fieldsToCompare = ['type', 'title', 'status', 'applicationNumber', 'applicationDate', 'description', 'registrationDate', 'patentClass', 'expiryDate', 'priority', 'claims', 'trademarkType', 'niceClass', 'registrationNumber', 'renewalDate', 'goodsServices', 'bulletinDate', 'bulletinNumber', 'workType', 'creationDate', 'publicationDate', 'publisher', 'designType', 'locarnoClass', 'designDate', 'designFeatures', 'notes'];

            fieldsToCompare.forEach(key => {
                if (updates.hasOwnProperty(key) && String(currentRecord[key] || '').trim() !== String(updates[key] || '').trim()) {
                    changedFields.push(key);
                }
            });

            if (changedFields.length > 0) {
                newTransactions.unshift({
                    transactionId: generateUUID(),
                    type: "Record Updated",
                    description: `Kayıt alanları güncellendi: ${changedFields.join(', ')}`,
                    timestamp: updatedTimestamp,
                    userId: user.uid,
                    userEmail: user.email,
                    parentId: null // Alan güncellemesi her zaman bir kök işlemdir.
                });
            }

            const oldFiles = currentRecord.files || [];
            const newFiles = updates.files || [];

            // GÜNCELLEME #2: Yeni eklenen dosyaların parentID'si her zaman null olacak
            newFiles.forEach(newFile => {
                if (!oldFiles.some(oldF => oldF.id === newFile.id)) {
                    const mainTxId = generateUUID();
                    const mainTxDescription = documentDesignationTranslations[newFile.documentDesignation] || newFile.documentDesignation || "Belge indekslendi.";
                    newTransactions.unshift({
                        transactionId: mainTxId,
                        type: "Document Indexed",
                        description: mainTxDescription,
                        documentId: newFile.id,
                        documentName: newFile.name,
                        documentDesignation: newFile.documentDesignation,
                        subDesignation: newFile.subDesignation,
                        timestamp: newFile.uploadedAt || updatedTimestamp,
                        userId: user.uid,
                        userEmail: user.email,
                        parentId: null // HATA DÜZELTİLDİ: Yeni belge işlemi her zaman KÖK işlemdir.
                    });

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
                            parentId: mainTxId // YENİ OLUŞTURULAN ANA İŞLEME BAĞLANDI
                        });
                    }
                }
            });

            oldFiles.forEach(oldFile => {
                if (!newFiles.some(newF => newF.id === oldFile.id)) {
                    newTransactions.unshift({
                        transactionId: generateUUID(),
                        type: "Document Deleted",
                        description: `Belge silindi: ${oldFile.name}`,
                        documentId: oldFile.id,
                        documentName: oldFile.name,
                        documentDesignation: oldFile.documentDesignation,
                        subDesignation: oldFile.subDesignation,
                        timestamp: updatedTimestamp,
                        userId: user.uid,
                        userEmail: user.email,
                        parentId: null // Belge silme de bir KÖK işlemdir.
                    });
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
                return { success: true };
            } else {
                let records = JSON.parse(localStorage.getItem('ipRecords') || '[]');
                records = records.filter(r => r.id !== recordId);
                localStorage.setItem('ipRecords', JSON.stringify(records));
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // GÜNCELLEME #3: Fonksiyon, tüm alt ağacı silecek şekilde yenilendi
    async deleteTransaction(recordId, transactionIdToDelete) {
        console.log(`🗑️ Deleting transaction ${transactionIdToDelete} and its children from record ${recordId}`);
        try {
            if (authService.isFirebaseAvailable && db) {
                const recordRef = doc(db, 'ipRecords', recordId);
                const docSnap = await getDoc(recordRef);
                if (!docSnap.exists()) throw new Error('Kayıt bulunamadı.');
                const recordData = docSnap.data();
                const allTransactions = recordData.transactions || [];
                const descendantIds = this.findAllDescendants(transactionIdToDelete, allTransactions);
                const idsToDelete = new Set([transactionIdToDelete, ...descendantIds]);
                const newTransactions = allTransactions.filter(tx => !idsToDelete.has(tx.transactionId));
                await updateDoc(recordRef, { transactions: newTransactions });
                console.log(`✅ Firebase transaction ${transactionIdToDelete} and ${descendantIds.length} descendants deleted.`);
                return { success: true, remainingTransactions: newTransactions };
            } else {
                let records = JSON.parse(localStorage.getItem('ipRecords') || '[]');
                const recordIndex = records.findIndex(r => r.id === recordId);
                if (recordIndex !== -1) {
                    const allTransactions = records[recordIndex].transactions || [];
                    const descendantIds = this.findAllDescendants(transactionIdToDelete, allTransactions);
                    const idsToDelete = new Set([transactionIdToDelete, ...descendantIds]);
                    records[recordIndex].transactions = allTransactions.filter(tx => !idsToDelete.has(tx.transactionId));
                    localStorage.setItem('ipRecords', JSON.stringify(records));
                    return { success: true };
                }
                return { success: false, error: 'Kayıt bulunamadı' };
            }
        } catch (error) {
            console.error('Delete transaction error:', error);
            return { success: false, error: error.message };
        }
    },

    async updateTransaction(recordId, transactionId, updates) {
        console.log(`🔄 Updating transaction ${transactionId} in record ${recordId}`);
        try {
            if (authService.isFirebaseAvailable && db) {
                const recordRef = doc(db, 'ipRecords', recordId);
                const docSnap = await getDoc(recordRef);
                if (!docSnap.exists()) throw new Error('Kayıt bulunamadı.');
                const recordData = docSnap.data();
                const newTransactions = recordData.transactions.map(tx => {
                    if (tx.transactionId === transactionId) {
                        return { ...tx, ...updates, timestamp: new Date().toISOString() };
                    }
                    return tx;
                });
                await updateDoc(recordRef, { transactions: newTransactions });
                return { success: true };
            } else {
                let records = JSON.parse(localStorage.getItem('ipRecords') || '[]');
                const recordIndex = records.findIndex(r => r.id === recordId);
                if (recordIndex !== -1) {
                    records[recordIndex].transactions = (records[recordIndex].transactions || []).map(tx => {
                        if (tx.transactionId === transactionId) {
                            return { ...tx, ...updates, timestamp: new Date().toISOString() };
                        }
                        return tx;
                    });
                    localStorage.setItem('ipRecords', JSON.stringify(records));
                    return { success: true };
                }
                return { success: false, error: 'Kayıt bulunamadı' };
            }
        } catch (error) {
            console.error('Update transaction error:', error);
            return { success: false, error: error.message };
        }
    },
    
    localGetRecords() {
        return { success: true, data: JSON.parse(localStorage.getItem('ipRecords') || '[]') };
    },

    localAddRecord(recordData) {
        const records = this.localGetRecords().data;
        recordData.id = generateUUID();
        records.push(recordData);
        localStorage.setItem('ipRecords', JSON.stringify(records));
        return { success: true, id: recordData.id, data: recordData };
    },

    localUpdateRecord(recordId, updates) {
        const records = this.localGetRecords().data;
        const index = records.findIndex(r => r.id === recordId);
        if (index !== -1) {
            records[index] = { ...records[index], ...updates };
            localStorage.setItem('ipRecords', JSON.stringify(records));
            return { success: true };
        }
        return { success: false, error: 'Kayıt bulunamadı' };
    },
};

export async function createDemoData() {
    console.log('🎯 Creating demo data...');
    const demoRecords = [
        { type: 'patent', title: 'Akıllı Enerji Yönetim Sistemi', description: 'IoT tabanlı enerji tasarrufu sağlayan sistem', status: 'pending', applicationDate: '2024-01-15', owners: [{ name: 'TechCorp A.Ş.', type: 'company' }], applicationNumber: 'TR2024/001234', userId: 'demo_user_1', userEmail: 'demo@ipmanager.com', files: [], transactions: [] },
        { type: 'trademark', title: 'EcoSmart', description: 'Çevre dostu teknoloji ürünleri markası', status: 'approved', applicationDate: '2023-11-20', owners: [{ name: 'Green Tech Ltd.', type: 'company' }], applicationNumber: 'TR2023/987654', userId: 'admin_user_1', userEmail: 'admin@ipmanager.com', files: [], transactions: [] },
        { type: 'copyright', title: 'Dijital Pazarlama Yazılımı', description: 'E-ticaret platformları için analitik yazılım', status: 'approved', applicationDate: '2024-02-10', owners: [{ name: 'Software Solutions Inc.', type: 'company' }], applicationNumber: 'TR2024/555666', userId: 'test_user_1', userEmail: 'test@example.com', files: [], transactions: [] },
    ];
    const existingRecords = JSON.parse(localStorage.getItem('ipRecords') || '[]');
    const allRecords = [...existingRecords];
    demoRecords.forEach(rec => {
        if (!allRecords.some(r => r.title === rec.title)) {
            allRecords.push({ id: generateUUID(), ...rec });
        }
    });
    localStorage.setItem('ipRecords', JSON.stringify(allRecords));
    console.log('✅ Demo data created');
}

export { subDesignationTranslations, documentDesignationTranslations };
export { auth, db, generateUUID };

console.log('🔥 Firebase config loaded - SÜPER ADMİN DESTEĞİ AKTİF');
console.log('🧪 Available services: authService, ipRecordsService, personsService, createDemoData, auth, db');