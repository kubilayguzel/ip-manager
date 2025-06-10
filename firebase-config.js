// Firebase Configuration for IP Manager
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
    onSnapshot // Firestore değişikliklerini dinlemek için
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Config - Gerçek Proje Bilgileri
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

// Authentication Service
export const authService = {
    auth: auth, // Firebase Auth objesini dışa aktar

    async signIn(email, password) {
        console.log('🔐 Attempting sign in with:', email);
        
        if (!isFirebaseAvailable) {
            return this.localSignIn(email, password);
        }
        
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return {
                success: true,
                user: result.user,
                message: 'Giriş başarılı'
            };
        } catch (error) {
            console.error('Firebase sign in error:', error);
            // Firebase hatası durumunda yerel oturum açmayı deneme
            return this.localSignIn(email, password);
        }
    },

    async signUp(email, password, displayName) {
        console.log('📝 Attempting sign up with:', email);
        
        if (!isFirebaseAvailable) {
            return this.localSignUp(email, password, displayName);
        }
        
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            
            await updateProfile(result.user, {
                displayName: displayName
            });
            
            return {
                success: true,
                user: result.user,
                message: 'Hesap oluşturuldu'
            };
        } catch (error) {
            console.error('Firebase sign up error:', error);
            // Firebase hatası durumunda yerel kayıt olmayı deneme
            return this.localSignUp(email, password, displayName);
        }
    },

    async signOut() {
        try {
            if (isFirebaseAvailable && auth) {
                await signOut(auth);
            }
            localStorage.removeItem('currentUser'); // Yerel kullanıcıyı temizle
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            localStorage.removeItem('currentUser'); // Hata durumunda da temizle
            return { success: true };
        }
    },

    getCurrentUser() {
        if (isFirebaseAvailable && auth && auth.currentUser) {
            return auth.currentUser;
        }
        
        const localUser = localStorage.getItem('currentUser');
        return localUser ? JSON.parse(localUser) : null;
    },

    // Local authentication fallback methods (for development/demo)
    localSignIn(email, password) {
        console.log('🧪 Local sign in attempt (Firebase not available):', email, password);
        
        const demoAccounts = [
            { email: 'demo@ipmanager.com', password: 'demo123', name: 'Demo Kullanıcı', role: 'demo' },
            { email: 'admin@ipmanager.com', password: 'admin123', name: 'Admin Kullanıcı', role: 'admin' },
            { email: 'test@example.com', password: 'test123', name: 'Test Kullanıcı', role: 'user' }
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
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
            console.log('✅ Local sign in successful:', userData);
            
            return {
                success: true,
                user: userData,
                message: 'Demo hesapla giriş başarılı'
            };
        }

        console.error('❌ Local sign in failed - invalid credentials');
        return {
            success: false,
            error: 'Geçersiz e-posta veya şifre. Demo hesaplar: demo@ipmanager.com/demo123, admin@ipmanager.com/admin123, test@example.com/test123'
        };
    },

    localSignUp(email, password, displayName) {
        const userData = {
            uid: 'local_new_user_' + Date.now(),
            email: email,
            displayName: displayName,
            role: 'user',
            loginTime: new Date().toISOString()
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
            if (isFirebaseAvailable && db) {
                const user = authService.getCurrentUser();
                if (!user || !user.uid) throw new Error('Kullanıcı oturumu bulunamadı veya UID eksik.');

                const recordData = {
                    ...record,
                    userId: user.uid, // Kayıtları kullanıcıya bağlamak için
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, 'ipRecords'), recordData);
                console.log('✅ Firebase record added with ID:', docRef.id);
                return {
                    success: true,
                    id: docRef.id,
                    data: recordData
                };
            } else {
                return this.localAddRecord(record);
            }
        } catch (error) {
            console.error('Add record error:', error);
            // Firebase hatası durumunda localStorage'a geri dön
            return this.localAddRecord(record);
        }
    },

    async getRecords() {
        console.log('📋 Getting records...');
        
        try {
            if (isFirebaseAvailable && db) {
                const user = authService.getCurrentUser();
                if (!user || !user.uid) {
                    console.warn('Firebase get records: No authenticated user. Returning local records.');
                    return this.localGetRecords();
                }

                const q = query(
                    collection(db, 'ipRecords'),
                    where('userId', '==', user.uid), // Sadece mevcut kullanıcının kayıtlarını çek
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
                console.log(`✅ Firebase records found: ${records.length}`);
                return {
                    success: true,
                    data: records
                };
            } else {
                return this.localGetRecords();
            }
        } catch (error) {
            console.error('Get records error:', error);
            // Firebase hatası durumunda localStorage'dan çekme
            return this.localGetRecords();
        }
    },

    async updateRecord(recordId, updates) {
        console.log(`🔄 Updating record ${recordId}:`, updates);
        try {
            if (isFirebaseAvailable && db) {
                const recordRef = doc(db, 'ipRecords', recordId);
                const updateData = {
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                
                await updateDoc(recordRef, updateData);
                console.log(`✅ Firebase record ${recordId} updated.`);
                return { success: true };
            } else {
                return this.localUpdateRecord(recordId, updates);
            }
        } catch (error) {
            console.error('Update record error:', error);
            return this.localUpdateRecord(recordId, updates);
        }
    },

    async deleteRecord(recordId) {
        console.log(`🗑️ Deleting record: ${recordId}`);
        try {
            if (isFirebaseAvailable && db) {
                await deleteDoc(doc(db, 'ipRecords', recordId));
                console.log(`✅ Firebase record ${recordId} deleted.`);
                return { success: true };
            } else {
                return this.localDeleteRecord(recordId);
            }
        } catch (error) {
            console.error('Delete record error:', error);
            return this.localDeleteRecord(recordId);
        }
    },

    // Local storage fallback methods
    localAddRecord(record) {
        const records = this.getLocalRecords();
        const newRecord = {
            id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...record,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        records.push(newRecord);
        localStorage.setItem('ipRecords', JSON.stringify(records));
        
        console.log('✅ Local record added:', newRecord);
        
        return {
            success: true,
            id: newRecord.id,
            data: newRecord
        };
    },

    localGetRecords() {
        const records = this.getLocalRecords();
        console.log('📋 Local records found:', records.length);
        
        return {
            success: true,
            data: records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        };
    },

    localUpdateRecord(recordId, updates) {
        const records = this.getLocalRecords();
        const index = records.findIndex(r => r.id === recordId);
        
        if (index !== -1) {
            records[index] = {
                ...records[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('ipRecords', JSON.stringify(records));
            console.log(`✅ Local record ${recordId} updated.`);
            return { success: true };
        }
        
        console.warn(`Local update failed: Record ${recordId} not found.`);
        return { success: false, error: 'Kayıt bulunamadı' };
    },

    localDeleteRecord(recordId) {
        const records = this.getLocalRecords();
        const filteredRecords = records.filter(r => r.id !== recordId);
        localStorage.setItem('ipRecords', JSON.stringify(filteredRecords));
        console.log('🗑️ Local record deleted:', recordId);
        return { success: true };
    },

    getLocalRecords() {
        try {
            const records = localStorage.getItem('ipRecords');
            return records ? JSON.parse(records) : [];
        } catch (error) {
            console.error('Error reading local records:', error);
            return [];
        }
    }
};

// Create demo data (Firebase is active, so this will attempt to add to Firestore)
export async function createDemoData() {
    console.log('🎯 Creating demo data...');
    
    // Firestore'da zaten kayıt varsa tekrar oluşturmayı engelle
    if (isFirebaseAvailable && db) {
        // Oturum açan bir kullanıcı yoksa veya demo hesap kullanılmıyorsa
        // demo verisi oluşturulmayabilir. Bu kısım için login mekanizmanızın
        // onAuthStateChanged ile tetiklenip kullanıcıyı getirmesi önemli.
        const user = authService.getCurrentUser();
        if (user && user.uid && (await ipRecordsService.getRecords()).data.length > 0) {
            console.log('Skipping demo data creation: Records already exist in Firestore for this user.');
            return;
        }
    } else {
        // LocalStorage'da zaten kayıt varsa demo data oluşturmayı engelle
        if (ipRecordsService.getLocalRecords().length > 0) {
            console.log('Skipping demo data creation: Records already exist in localStorage.');
            return;
        }
    }

    const demoRecords = [
        {
            type: 'patent',
            title: 'Akıllı Enerji Yönetim Sistemi',
            description: 'IoT tabanlı enerji tasarrufu sağlayan sistem',
            status: 'pending',
            applicationDate: '2024-01-15',
            owners: [{ name: 'TechCorp A.Ş.', type: 'company' }], // Updated to match schema
            applicationNumber: 'TR2024/001234',
            trademarkImage: null
        },
        {
            type: 'trademark',
            title: 'EcoSmart',
            description: 'Çevre dostu teknoloji ürünleri markası',
            status: 'approved',
            applicationDate: '2023-11-20',
            owners: [{ name: 'Green Tech Ltd.', type: 'company' }], // Updated to match schema
            applicationNumber: 'TR2023/987654',
            trademarkImage: { // Example Base64 image
                name: 'ecosmart_logo.jpeg',
                type: 'image/jpeg',
                size: 15000,
                content: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQEBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAIBAAISBAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAwLjY2NjY2NiBwYWdlIHNwZWVkcy4gV2lraWJvb2sgSGFhcmxlbSBzYnIgU2VydmljZXMgW2NpdGU6IDVdCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t-