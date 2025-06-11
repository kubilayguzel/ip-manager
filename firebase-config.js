// kubilayguzel/ip-manager/ip-manager-16f863853773f6ccdf95834f40912917f000fa80/firebase-config.js
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
        // Firebase Auth'tan gelen güncel kullanıcıyı tercih et
        if (this.isFirebaseAvailable && auth && auth.currentUser) {
            const user = auth.currentUser;
            // Rolü senkronize olarak Firestore'dan çekmek yerine,
            // kullanıcı oturum açtığında veya güncellendiğinde çekip localStorage'a kaydetmeliyiz.
            // Burası sadece localStorage'ı okuyor, bu yüzden doğru bilgiye sahip olması önemli.
            const localUser = localStorage.getItem('currentUser');
            if (localUser) {
                return JSON.parse(localUser);
            } else {
                // Eğer localStorage'da yoksa ve Firebase Auth'ta varsa, minimum bilgiyi döndür
                // ve arka planda rolü çekmek için bir mekanizma düşün
                return {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    role: 'user', // Varsayılan, çünkü rol henüz çekilmedi
                    isSuperAdmin: false
                };
            }
        }
        
        // Firebase bağlı değilse veya Auth'ta kullanıcı yoksa LocalStorage'dan oku
        const localUser = localStorage.getItem('currentUser');
        if (localUser) {
            const parsedUser = JSON.parse(localUser);
            return parsedUser;
        }
        return null;
    },

    // Check if current user is super admin
    isSuperAdmin() {
        const currentUser = this.getCurrentUser();
        return currentUser?.role === 'superadmin' || currentUser?.isSuperAdmin === true;
    },

    // Local authentication fallback methods
    localSignIn(email, password) {
        console.log('🧪 Local sign in attempt (Firebase not available):', email, password);
        
        const demoAccounts = [
            { email: 'demo@ipmanager.com', password: 'demo123', name: 'Demo Kullanıcı', role: 'user' }, // Rolü 'user'
            { email: 'admin@ipmanager.com', password: 'admin123', name: 'Admin Kullanıcı', role: 'admin' }, // Rolü 'admin'
            { email: 'test@example.com', password: 'test123', name: 'Test Kullanıcı', role: 'user' },
            // 🔥 SÜPER ADMİN HESABI - TÜM VERİLERE ERİŞİM
            {
                email: 'superadmin@ipmanager.com',
                password: 'superadmin123',
                name: 'Süper Admin',
                role: 'superadmin',
                permissions: ['viewAllData', 'editAllData', 'deleteAllData', 'systemAdmin']
            },
            // Debug hesabı
            {
                email: 'debug@ipmanager.com',
                password: 'debug123',
                name: 'Debug Kullanıcı',
                role: 'debug',
                permissions: ['viewAllData', 'systemDebug']
            }
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
                permissions: account.permissions || [],
                loginTime: new Date().toISOString(),
                isSuperAdmin: account.role === 'superadmin' // isSuperAdmin'i role göre belirle
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
            console.log('✅ Local sign in successful:', userData);
            
            return {
                success: true,
                user: userData,
                message: account.role === 'superadmin' ?
                    '🔥 Süper Admin olarak giriş başarılı - TÜM VERİLERE ERİŞİM' :
                    account.role === 'debug' ?
                    '🐛 Debug kullanıcısı olarak giriş başarılı' :
                    'Demo hesapla giriş başarılı'
            };
        }

        console.error('❌ Local sign in failed - invalid credentials');
        return {
            success: false,
            error: `Geçersiz e-posta veya şifre.
            
📧 Mevcut Hesaplar:
• demo@ipmanager.com / demo123 (Demo)
• admin@ipmanager.com / admin123 (Admin)
• test@example.com / test123 (Test)
🔥 superadmin@ipmanager.com / superadmin123 (SÜPER ADMİN)
🐛 debug@ipmanager.com / debug123 (Debug)`
        };
    },

    localSignUp(email, password, displayName, initialRole = 'user') {
        const userData = {
            uid: 'local_new_user_' + Date.now(),
            email: email,
            displayName: displayName,
            role: initialRole,
            permissions: [],
            loginTime: new Date().toISOString(),
            isSuperAdmin: initialRole === 'superadmin' // isSuperAdmin'i role göre belirle
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return {
            success: true,
            user: userData,
            message: 'Yerel hesap oluşturuldu'
        };
    }
};

// IP Records Service (Firestore veya localStorage)
export const ipRecordsService = {
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
                transactions: record.transactions || [], // Yeni kayıt için boş dizi
                // Her dosya için benzersiz ID ve yükleme zamanı ekle
                files: record.files.map(file => ({
                    ...file,
                    id: file.id || generateUUID(),
                    uploadedAt: file.uploadedAt || new Date().toISOString(),
                    documentDesignation: file.documentDesignation || null, // Ensure null if empty
                    subDesignation: file.subDesignation || null // Ensure null if empty
                }))
            };

            // Kayıt oluşturulduğunda ilk transaction'ı ekle
            recordData.transactions.unshift({
                transactionId: generateUUID(),
                type: "Record Created",
                description: `Yeni kayıt oluşturuldu: ${recordData.title}`,
                timestamp: recordData.createdAt,
                userId: user.uid,
                userEmail: user.email,
                parentId: null // Ana işlem
            });

            if (authService.isFirebaseAvailable && db) {
                const docRef = await addDoc(collection(db, 'ipRecords'), recordData);
                console.log('✅ Firebase record added with ID:', docRef.id);
                return {
                    success: true,
                    id: docRef.id,
                    data: recordData
                };
            } else {
                return this.localAddRecord(recordData); // LocalAddRecord'a güncel yapıyı gönder
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
                    console.warn('Firebase get records: No authenticated user. Returning local records.');
                    return this.localGetRecords();
                }

                let q;
                // 🔥 SÜPER ADMİN KONTROLÜ - TÜM VERİLERİ GETİR
                if (authService.isSuperAdmin()) {
                    console.log('🔥 SÜPER ADMİN ERİŞİM - Tüm kullanıcıların verileri getiriliyor...');
                    
                    q = query(
                        collection(db, 'ipRecords'),
                        orderBy('createdAt', 'desc')
                    );

                    const querySnapshot = await getDocs(q);
                    const records = [];
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        records.push({
                            id: doc.id,
                            ...data
                        });
                    });
                    
                    console.log(`🔥 SÜPER ADMİN: ${records.length} kayıt (tüm kullanıcılar) getirildi`);
                    return {
                        success: true,
                        data: records,
                        isAllUsersData: true
                    };
                } else {
                    // Normal kullanıcı - sadece kendi verileri
                    const q = query(
                        collection(db, 'ipRecords'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );

                    const querySnapshot = await getDocs(q);
                    const records = [];
                    
                    querySnapshot.forEach((doc) => {
                        records.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    console.log(`✅ Normal kullanıcı: ${records.length} kayıt getirildi`);
                    return {
                        success: true,
                        data: records,
                        isAllUsersData: false
                    };
                }
            } else {
                return this.localGetRecords();
            }
        } catch (error) {
            console.error('Get records error:', error);
            if (authService.isFirebaseAvailable) {
                return { success: false, error: error.message || 'Kayıtlar alınırken bir hata oluştu.' };
            }
            return this.localGetRecords();
        }
    },

    async updateRecord(recordId, updates) {
        console.log(`🔄 Updating record ${recordId}:`, updates);
        try {
            const user = authService.getCurrentUser();
            if (!user || !user.uid) throw new Error('Kullanıcı oturumu bulunamadı');

            const updatedTimestamp = new Date().toISOString();
            const recordRef = doc(db, 'ipRecords', recordId);

            // Mevcut kaydı çekip güncel transaction'ları ekleyeceğiz
            let currentRecord = {};
            if (authService.isFirebaseAvailable && db) {
                const docSnap = await getDoc(recordRef);
                if (docSnap.exists()) {
                    currentRecord = docSnap.data();
                } else {
                    throw new Error('Güncellenecek kayıt bulunamadı.');
                }
            } else {
                const localRecords = this.getLocalRecords();
                currentRecord = localRecords.find(r => r.id === recordId);
                if (!currentRecord) throw new Error('Güncellenecek kayıt yerel depoda bulunamadı.');
            }

            const newTransactions = [...(currentRecord.transactions || [])];
            let parentTxId = null; // Varsayılan parentTxId, ana işlem ID'si.

            // 1. Ana güncelleme işlemi (eğer temel alanlarda değişiklik varsa)
            const changedFields = [];
            const fieldsToCompare = ['type', 'title', 'status', 'applicationNumber', 'applicationDate', 'description', 
                                     'registrationDate', 'patentClass', 'expiryDate', 'priority', 'claims', 
                                     'trademarkType', 'niceClass', 'registrationNumber', 'renewalDate', 
                                     'goodsServices', 'bulletinDate', 'bulletinNumber', 'workType', 
                                     'creationDate', 'publicationDate', 'publisher', 'designType', 
                                     'locarnoClass', 'designDate', 'designFeatures', 'notes']; // Karşılaştırılacak alanlar

            fieldsToCompare.forEach(key => {
                // Sadece güncellenen alanlar 'updates' içinde olur.
                // Eğer key, updates içinde varsa ve değeri değişmişse
                const oldValue = currentRecord[key] === undefined || currentRecord[key] === null ? '' : String(currentRecord[key]).trim();
                const newValue = updates[key] === undefined || updates[key] === null ? '' : String(updates[key]).trim();
                
                if (updates.hasOwnProperty(key) && oldValue !== newValue) {
                    changedFields.push(`${key}: '${oldValue}' -> '${newValue}'`);
                }
            });

            if (changedFields.length > 0) {
                const recordUpdateTxId = generateUUID();
                newTransactions.unshift({
                    transactionId: recordUpdateTxId,
                    type: "Record Updated",
                    description: `Kayıt verileri güncellendi: ${changedFields.join('; ')}`,
                    timestamp: updatedTimestamp,
                    userId: user.uid,
                    userEmail: user.email,
                    parentId: null // Bu işlem ana seviyede bir işlem
                });
                parentTxId = recordUpdateTxId; // Diğer işlemler bunun altında olabilir
            } else if (currentRecord.transactions && currentRecord.transactions.length > 0) {
                 // Eğer kayıt güncelleniyor ama temel alanlarda değişiklik yoksa,
                 // son ana işlemi (Record Created veya Record Updated) parent olarak alabiliriz.
                 // Bu, transaction ağacını daha anlamlı kılar.
                 const lastRootTransaction = newTransactions.find(tx => tx.parentId === null);
                 if (lastRootTransaction) {
                     parentTxId = lastRootTransaction.transactionId;
                 }
            }

            // Dosya ekleme/güncelleme/silme mantığı (burada transaction eklemesi yapılacak)
            const oldFiles = currentRecord.files || [];
            const newFiles = updates.files || [];

            // 2. Yeni eklenen dosyalar için transaction
            newFiles.forEach(newFile => {
                const existingFile = oldFiles.find(oldF => oldF.id === newFile.id);
                if (!existingFile) {
                    // Yeni eklenen dosya
                    let description = `'${newFile.name}' belgesi eklendi.`;
                    if (newFile.documentDesignation) {
                        description += ` Atama: '${newFile.documentDesignation}'`;
                        if (newFile.subDesignation) {
                            description += ` (${newFile.subDesignation})`;
                        }
                    }

                    const fileTxId = generateUUID();
                    newTransactions.unshift({
                        transactionId: fileTxId,
                        type: "Document Indexed",
                        description: description,
                        documentId: newFile.id,
                        documentName: newFile.name,
                        documentDesignation: newFile.documentDesignation, // Yeni
                        subDesignation: newFile.subDesignation, // Yeni
                        timestamp: newFile.uploadedAt || updatedTimestamp, // Yükleme zamanı
                        userId: user.uid,
                        userEmail: user.email,
                        parentId: parentTxId // Ana işlem ID'si altında
                    });
                } else {
                    // 3. Mevcut dosyaların güncellenmesi için transaction
                    const fileChanges = [];
                    
                    // documentDesignation değişti mi?
                    if (existingFile.documentDesignation !== newFile.documentDesignation) {
                        fileChanges.push(`ataması '${existingFile.documentDesignation || '-'}' -> '${newFile.documentDesignation || '-'}'`);
                    }
                    // subDesignation değişti mi?
                    if (existingFile.subDesignation !== newFile.subDesignation) {
                        fileChanges.push(`alt ataması '${existingFile.subDesignation || '-'}' -> '${newFile.subDesignation || '-'}'`);
                    }
                    // content değişti mi? (Boyut veya içerik hash'i ile karşılaştırmak daha sağlam olur)
                    if (existingFile.content !== newFile.content) {
                        fileChanges.push(`içeriği güncellendi`);
                    }

                    if (fileChanges.length > 0) {
                         const fileTxId = generateUUID();
                         newTransactions.unshift({
                            transactionId: fileTxId,
                            type: "Document Updated",
                            description: `'${newFile.name}' belgesi güncellendi (${fileChanges.join(', ')}).`,
                            documentId: newFile.id,
                            documentName: newFile.name,
                            documentDesignation: newFile.documentDesignation, // Yeni
                            subDesignation: newFile.subDesignation, // Yeni
                            timestamp: updatedTimestamp,
                            userId: user.uid,
                            userEmail: user.email,
                            parentId: parentTxId
                        });
                    }
                }
            });

            // 4. Dosya silme için transaction
            oldFiles.forEach(oldFile => {
                const stillExists = newFiles.some(newF => newF.id === oldFile.id);
                if (!stillExists) {
                    let description = `'${oldFile.name}' belgesi silindi.`;
                     if (oldFile.documentDesignation) {
                        description += ` Atama: '${oldFile.documentDesignation}'`;
                        if (oldFile.subDesignation) {
                            description += ` (${oldFile.subDesignation})`;
                        }
                    }

                    const fileTxId = generateUUID();
                    newTransactions.unshift({
                        transactionId: fileTxId,
                        type: "Document Deleted",
                        description: description,
                        documentId: oldFile.id,
                        documentName: oldFile.name,
                        documentDesignation: oldFile.documentDesignation, // Yeni
                        subDesignation: oldFile.subDesignation, // Yeni
                        timestamp: updatedTimestamp,
                        userId: user.uid,
                        userEmail: user.email,
                        parentId: parentTxId
                    });
                }
            });

            const finalUpdates = {
                updatedAt: updatedTimestamp,
                transactions: newTransactions, // Güncel transaction dizisi
                files: newFiles.map(file => ({ // Her dosya objesinin ID'si ve uploadedAt'i olduğundan emin ol
                    ...file,
                    id: file.id || generateUUID(),
                    uploadedAt: file.uploadedAt || updatedTimestamp,
                    documentDesignation: file.documentDesignation || null, // Ensure null if empty
                    subDesignation: file.subDesignation || null // Ensure null if empty
                }))
            };

            // updates objesindeki diğer alanları da finalUpdates'e eklerken undefined kontrolü yap
            for (const key in updates) {
                // 'files', 'transactions' ve 'updatedAt' zaten yukarıda ele alındı, tekrar ekleme
                if (key === 'files' || key === 'transactions' || key === 'updatedAt') {
                    continue;
                }
                
                // Eğer değer undefined ise null olarak ayarla, aksi takdirde değeri olduğu gibi kullan
                if (updates[key] === undefined) {
                    finalUpdates[key] = null;
                } else {
                    finalUpdates[key] = updates[key];
                }
            }

            if (authService.isFirebaseAvailable && db) {
                await updateDoc(recordRef, finalUpdates);
                console.log(`✅ Firebase record ${recordId} updated.`);
                return { success: true };
            } else {
                return this.localUpdateRecord(recordId, finalUpdates);
            }
        } catch (error) {
            console.error('Update record error:', error);
            return { success: false, error: error.message || 'Kayıt güncellenirken bir hata oluştu.' };
        }
    },
    
    // localAddRecord ve localUpdateRecord metotlarını da transaction ve files yapısını destekleyecek şekilde güncelleyin
    localAddRecord(recordData) { // recordData artık yeni yapıyı içeriyor
        const records = this.getLocalRecords();
        
        // Yeni bir kayıt oluşturulduğunda, transactions dizisi zaten içinde olacaktır.
        // Files dizisindeki her objenin id ve uploadedAt içermesi gerekiyor, bu da addRecord'da halledildi.
        records.push(recordData);
        localStorage.setItem('ipRecords', JSON.stringify(records));
        
        console.log('✅ Local record added:', recordData);
        
        return {
            success: true,
            id: recordData.id,
            data: recordData
        };
    },

    localUpdateRecord(recordId, updates) { // updates artık yeni yapıyı içeriyor
        const records = this.getLocalRecords();
        const index = records.findIndex(r => r.id === recordId);
        
        if (index !== -1) {
            records[index] = {
                ...records[index],
                ...updates // updates objesi transaction ve files dizilerini doğru şekilde içerecek
            };
            localStorage.setItem('ipRecords', JSON.stringify(records));
            console.log(`✅ Local record ${recordId} updated.`);
            return { success: true };
        }
        
        console.warn(`Local update failed: Record ${recordId} not found.`);
        return { success: false, error: 'Kayıt bulunamadı' };
    },

    // ... (diğer metodlar) ...
};

// Persons Service (Super Admin desteği ile)
export const personsService = {
    async addPerson(person) {
        console.log('👥 Adding person:', person);
        try {
            if (authService.isFirebaseAvailable && db) {
                const user = authService.getCurrentUser();
                if (!user || !user.uid) throw new Error('Kullanıcı oturumu bulunamadı.');

                const personData = {
                    ...person,
                    userId: user.uid,
                    userEmail: user.email,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                const docRef = await addDoc(collection(db, 'persons'), personData);
                console.log('✅ Firebase person added with ID:', docRef.id);
                return { success: true, id: docRef.id, data: personData };
            } else {
                return this.localAddPerson(person);
            }
        } catch (error) {
            console.error('Add person error:', error);
            if (authService.isFirebaseAvailable) {
                return { success: false, error: error.message || 'Kişi eklenirken bir hata oluştu.' };
            }
            return { success: false, error: error.message || 'Kişi eklenirken bir hata oluştu.' };
        }
    },

    async getPersons() {
        console.log('👥 Getting persons...');
        try {
            if (authService.isFirebaseAvailable && db) {
                const user = authService.getCurrentUser();
                if (!user || !user.uid) {
                    console.warn('Firebase get persons: No authenticated user. Returning local persons.');
                    return this.localGetPersons();
                }

                let q;
                // 🔥 SÜPER ADMİN KONTROLÜ
                if (authService.isSuperAdmin()) {
                    console.log('🔥 SÜPER ADMİN: Tüm kullanıcıların kişileri getiriliyor...');
                    
                    q = query(
                        collection(db, 'persons'),
                        orderBy('createdAt', 'desc')
                    );
                    const querySnapshot = await getDocs(q);
                    const persons = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        persons.push({
                            id: doc.id,
                            ...data
                        });
                    });
                    console.log(`🔥 SÜPER ADMİN: ${persons.length} kişi (tüm kullanıcılar) getirildi`);
                    return { success: true, data: persons };
                } else {
                    // Normal kullanıcı
                    const q = query(
                        collection(db, 'persons'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );
                    const querySnapshot = await getDocs(q);
                    const persons = [];
                    querySnapshot.forEach((doc) => {
                        persons.push({ id: doc.id, ...doc.data() });
                    });
                    console.log(`✅ Normal kullanıcı: ${persons.length} kişi getirildi`);
                    return { success: true, data: persons };
                }
            } else {
                return this.localGetPersons();
            }
        } catch (error) {
            console.error('Get persons error:', error);
            if (authService.isFirebaseAvailable) {
                return { success: false, error: error.message || 'Kişiler alınırken bir hata oluştu.' };
            }
            return { success: false, error: error.message || 'Kişiler alınırken bir hata oluştu.' };
        }
    },

    async updatePerson(personId, updates) {
        console.log(`🔄 Updating person ${personId}:`, updates);
        try {
            if (authService.isFirebaseAvailable && db) {
                const personRef = doc(db, 'persons', personId);
                const updateData = { ...updates, updatedAt: new Date().toISOString() };
                await updateDoc(personRef, updateData);
                console.log(`✅ Firebase person ${personId} updated.`);
                return { success: true };
            } else {
                return this.localUpdatePerson(personId, updates);
            }
        } catch (error) {
            console.error('Update person error:', error);
            if (authService.isFirebaseAvailable) {
                return { success: false, error: error.message || 'Kişi güncellenirken bir hata oluştu.' };
            }
            return { success: false, error: error.message || 'Kişi güncellenirken bir hata oluştu.' };
        }
    },

    async deletePerson(personId) {
        console.log(`🗑️ Deleting person: ${personId}`);
        try {
            if (authService.isFirebaseAvailable && db) {
                await deleteDoc(doc(db, 'persons', personId));
                console.log(`✅ Firebase person ${personId} deleted.`);
                return { success: true };
            } else {
                return this.localDeletePerson(personId);
            }
        } catch (error) {
            console.error('Delete person error:', error);
            if (authService.isFirebaseAvailable) {
                return { success: false, error: error.message || 'Kişi silinirken bir hata oluştu.' };
            }
            return { success: false, error: error.message || 'Kişi silinirken bir hata oluştu.' };
        }
    },

    // Local storage fallback methods for persons
    localAddPerson(person) {
        const persons = this.getLocalPersons();
        const user = authService.getCurrentUser();
        
        const newPerson = {
            id: 'local_person_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...person,
            userId: user?.uid || 'anonymous',
            userEmail: user?.email || 'anonymous@localhost',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        persons.push(newPerson);
        localStorage.setItem('persons', JSON.stringify(persons));
        console.log('✅ Local person added:', newPerson);
        return { success: true, id: newPerson.id, data: newPerson };
    },

    localGetPersons() {
        const persons = this.getLocalPersons();
        const user = authService.getCurrentUser();
        
        // 🔥 SÜPER ADMİN KONTROLÜ
        if (authService.isSuperAdmin()) {
            console.log('🔥 SÜPER ADMİN (LOCAL): Tüm kişiler döndürülüyor');
            const allPersons = persons.map(person => ({
                ...person
            }));
            return { success: true, data: allPersons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
        } else {
            // Normal kullanıcı
            const userPersons = persons.filter(person => 
                person.userId === user?.uid || 
                person.userEmail === user?.email
            );
            console.log('📋 Normal kullanıcı (local persons):', userPersons.length);
            return { success: true, data: userPersons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
        }
    },

    localUpdatePerson(personId, updates) {
        const persons = this.getLocalPersons();
        const index = persons.findIndex(p => p.id === personId);
        if (index !== -1) {
            persons[index] = { ...persons[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('persons', JSON.stringify(persons));
            console.log(`✅ Local person ${personId} updated.`);
            return { success: true };
        }
        console.warn(`Local update failed: Person ${personId} not found.`);
        return { success: false, error: 'Kişi bulunamadı' };
    },

    localDeletePerson(personId) {
        const persons = this.getLocalPersons();
        const filteredPersons = persons.filter(p => p.id !== personId);
        localStorage.setItem('persons', JSON.stringify(filteredPersons));
        console.log('🗑️ Local person deleted:', personId);
        return { success: true };
    },

    getLocalPersons() {
        try {
            const persons = localStorage.getItem('persons');
            return persons ? JSON.parse(persons) : [];
        } catch (error) {
            console.error('Error reading local persons:', error);
            return [];
        }
    }
};

// Create demo data with multiple users (Super Admin görür)
export async function createDemoData() {
    console.log('🎯 Creating demo data...');
    
    // Demo kayıtları farklı kullanıcılar adına oluştur
    const demoRecords = [
        {
            type: 'patent',
            title: 'Akıllı Enerji Yönetim Sistemi',
            description: 'IoT tabanlı enerji tasarrufu sağlayan sistem',
            status: 'pending',
            applicationDate: '2024-01-15',
            owners: [{ name: 'TechCorp A.Ş.', type: 'company' }],
            applicationNumber: 'TR2024/001234',
            userId: 'demo_user_1', // Bu UID'ler sadece demo amaçlıdır.
            userEmail: 'demo@ipmanager.com',
            files: [], // Dosya ve transaction yapısı için boş bırakıldı
            transactions: []
        },
        {
            type: 'trademark',
            title: 'EcoSmart',
            description: 'Çevre dostu teknoloji ürünleri markası',
            status: 'approved',
            applicationDate: '2023-11-20',
            owners: [{ name: 'Green Tech Ltd.', type: 'company' }],
            applicationNumber: 'TR2023/987654',
            userId: 'admin_user_1', // Bu UID'ler sadece demo amaçlıdır.
            userEmail: 'admin@ipmanager.com',
            files: [],
            transactions: []
        },
        {
            type: 'copyright',
            title: 'Dijital Pazarlama Yazılımı',
            description: 'E-ticaret platformları için analitik yazılım',
            status: 'approved',
            applicationDate: '2024-02-10',
            owners: [{ name: 'Software Solutions Inc.', type: 'company' }],
            applicationNumber: 'TR2024/555666',
            userId: 'test_user_1', // Bu UID'ler sadece demo amaçlıdır.
            userEmail: 'test@example.com',
            files: [],
            transactions: []
        },
        {
            type: 'design',
            title: 'Modern Ofis Mobilyası Serisi',
            description: 'Ergonomik tasarım prensipleriyle geliştirilmiş mobilya',
            status: 'rejected',
            applicationDate: '2023-12-05',
            owners: [{ name: 'Design Studio X', type: 'company' }],
            applicationNumber: 'TR2023/111222',
            userId: 'another_user', // Bu UID'ler sadece demo amaçlıdır.
            userEmail: 'designer@company.com',
            files: [],
            transactions: []
        },
        {
            type: 'patent',
            title: 'Yapay Zeka Destekli Otomasyon',
            description: 'Endüstriyel süreçler için AI algoritmaları',
            status: 'pending',
            applicationDate: '2024-03-01',
            owners: [{ name: 'AI Innovations Ltd.', type: 'company' }],
            applicationNumber: 'TR2024/789012',
            userId: 'ai_company', // Bu UID'ler sadece demo amaçlıdır.
            userEmail: 'ai@innovations.com',
            files: [],
            transactions: []
        }
    ];

    // LocalStorage'a demo veriler ekle
    const existingRecords = JSON.parse(localStorage.getItem('ipRecords') || '[]');
    const allRecords = [...existingRecords, ...demoRecords];
    localStorage.setItem('ipRecords', JSON.stringify(allRecords));
    
    console.log('✅ Demo data oluşturuldu - Süper Admin tüm verileri görebilir');
    console.log(`📊 Toplam ${allRecords.length} kayıt, ${demoRecords.length} yeni eklendi`);
}

// Export auth and db for direct access (db de eklendi)
export { auth, db, generateUUID };

console.log('🔥 Firebase config loaded - SÜPER ADMİN DESTEĞİ AKTİF');
console.log('🔥 Süper Admin Hesabı: superadmin@ipmanager.com / superadmin123');
console.log('🐛 Debug Hesabı: debug@ipmanager.com / debug123');
console.log('🧪 Available services: authService, ipRecordsService, personsService, createDemoData, auth, db');