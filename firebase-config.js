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
    onSnapshot
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
    auth: auth,
    isFirebaseAvailable: isFirebaseAvailable,

    async signIn(email, password) {
        console.log('🔐 Attempting sign in with:', email);
        
        if (!this.isFirebaseAvailable) {
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
            return this.localSignIn(email, password);
        }
    },

    async signUp(email, password, displayName) {
        console.log('📝 Attempting sign up with:', email);
        
        if (!this.isFirebaseAvailable) {
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
            return this.localSignUp(email, password, displayName);
        }
    },

    async signOut() {
        try {
            if (this.isFirebaseAvailable && auth) {
                await signOut(auth);
            }
            localStorage.removeItem('currentUser');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            localStorage.removeItem('currentUser');
            return { success: true };
        }
    },

    getCurrentUser() {
        if (this.isFirebaseAvailable && auth && auth.currentUser) {
            return auth.currentUser;
        }
        
        const localUser = localStorage.getItem('currentUser');
        return localUser ? JSON.parse(localUser) : null;
    },

    // Check if current user is super admin
    isSuperAdmin() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;
        
        const superAdminEmails = [
            'superadmin@ipmanager.com',
            'admin@ipmanager.com',
            'debug@ipmanager.com'
        ];
        
        return superAdminEmails.includes(currentUser.email?.toLowerCase());
    },

    // Local authentication fallback methods
    localSignIn(email, password) {
        console.log('🧪 Local sign in attempt (Firebase not available):', email, password);
        
        const demoAccounts = [
            { email: 'demo@ipmanager.com', password: 'demo123', name: 'Demo Kullanıcı', role: 'demo' },
            { email: 'admin@ipmanager.com', password: 'admin123', name: 'Admin Kullanıcı', role: 'admin' },
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
                isSuperAdmin: account.role === 'superadmin' || account.role === 'debug'
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

    localSignUp(email, password, displayName) {
        const userData = {
            uid: 'local_new_user_' + Date.now(),
            email: email,
            displayName: displayName,
            role: 'user',
            permissions: [],
            loginTime: new Date().toISOString(),
            isSuperAdmin: false
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return {
            success: true,
            user: userData,
            message: 'Yerel hesap oluşturuldu'
        };
    }
};

// IP Records Service (Firestore veya localStorage) - Super Admin desteği ile
export const ipRecordsService = {
    async addRecord(record) {
        console.log('💾 Adding record:', record);
        
        try {
            if (authService.isFirebaseAvailable && db) {
                const user = authService.getCurrentUser();
                if (!user || !user.uid) throw new Error('Kullanıcı oturumu bulunamadı');

                const recordData = {
                    ...record,
                    userId: user.uid,
                    userEmail: user.email,
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
            return this.localAddRecord(record);
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

                // 🔥 SÜPER ADMİN KONTROLÜ - TÜM VERİLERİ GETİR
                if (authService.isSuperAdmin()) {
                    console.log('🔥 SÜPER ADMİN ERİŞİMİ - Tüm kullanıcıların verileri getiriliyor...');
                    
                    const q = query(
                        collection(db, 'ipRecords'),
                        orderBy('createdAt', 'desc')
                    );

                    const querySnapshot = await getDocs(q);
                    const records = [];
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        records.push({
                            id: doc.id,
                            ...data,
                            _ownerInfo: `👤 ${data.userEmail || 'Bilinmeyen'}` // Kayıt sahibi bilgisi
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
            return this.localGetRecords();
        }
    },

    async updateRecord(recordId, updates) {
        console.log(`🔄 Updating record ${recordId}:`, updates);
        try {
            if (authService.isFirebaseAvailable && db) {
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
            if (authService.isFirebaseAvailable && db) {
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
        const user = authService.getCurrentUser();
        
        const newRecord = {
            id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...record,
            userId: user?.uid || 'anonymous',
            userEmail: user?.email || 'anonymous@localhost',
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
        const user = authService.getCurrentUser();
        
        // 🔥 SÜPER ADMİN KONTROLÜ - TÜM VERİLERİ DÖNDÜR
        if (authService.isSuperAdmin()) {
            console.log('🔥 SÜPER ADMİN (LOCAL): Tüm kayıtlar döndürülüyor');
            const allRecords = records.map(record => ({
                ...record,
                _ownerInfo: `👤 ${record.userEmail || 'Bilinmeyen'}`
            }));
            return {
                success: true,
                data: allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
                isAllUsersData: true
            };
        } else {
            // Normal kullanıcı - sadece kendi kayıtları
            const userRecords = records.filter(record => 
                record.userId === user?.uid || 
                record.userEmail === user?.email
            );
            console.log('📋 Normal kullanıcı (local):', userRecords.length, 'kayıt bulundu');
            
            return {
                success: true,
                data: userRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
                isAllUsersData: false
            };
        }
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

                // 🔥 SÜPER ADMİN KONTROLÜ
                if (authService.isSuperAdmin()) {
                    console.log('🔥 SÜPER ADMİN: Tüm kullanıcıların kişileri getiriliyor...');
                    
                    const q = query(
                        collection(db, 'persons'),
                        orderBy('createdAt', 'desc')
                    );
                    const querySnapshot = await getDocs(q);
                    const persons = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        persons.push({ 
                            id: doc.id, 
                            ...data,
                            _ownerInfo: `👤 ${data.userEmail || 'Bilinmeyen'}`
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
                ...person,
                _ownerInfo: `👤 ${person.userEmail || 'Bilinmeyen'}`
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
            userId: 'demo_user_1',
            userEmail: 'demo@ipmanager.com'
        },
        {
            type: 'trademark',
            title: 'EcoSmart',
            description: 'Çevre dostu teknoloji ürünleri markası',
            status: 'approved',
            applicationDate: '2023-11-20',
            owners: [{ name: 'Green Tech Ltd.', type: 'company' }],
            applicationNumber: 'TR2023/987654',
            userId: 'admin_user_1',
            userEmail: 'admin@ipmanager.com'
        },
        {
            type: 'copyright',
            title: 'Dijital Pazarlama Yazılımı',
            description: 'E-ticaret platformları için analitik yazılım',
            status: 'approved',
            applicationDate: '2024-02-10',
            owners: [{ name: 'Software Solutions Inc.', type: 'company' }],
            applicationNumber: 'TR2024/555666',
            userId: 'test_user_1',
            userEmail: 'test@example.com'
        },
        {
            type: 'design',
            title: 'Modern Ofis Mobilyası Serisi',
            description: 'Ergonomik tasarım prensipleriyle geliştirilmiş mobilya',
            status: 'rejected',
            applicationDate: '2023-12-05',
            owners: [{ name: 'Design Studio X', type: 'company' }],
            applicationNumber: 'TR2023/111222',
            userId: 'another_user',
            userEmail: 'designer@company.com'
        },
        {
            type: 'patent',
            title: 'Yapay Zeka Destekli Otomasyon',
            description: 'Endüstriyel süreçler için AI algoritmaları',
            status: 'pending',
            applicationDate: '2024-03-01',
            owners: [{ name: 'AI Innovations Ltd.', type: 'company' }],
            applicationNumber: 'TR2024/789012',
            userId: 'ai_company',
            userEmail: 'ai@innovations.com'
        }
    ];

    // LocalStorage'a demo veriler ekle
    const existingRecords = JSON.parse(localStorage.getItem('ipRecords') || '[]');
    const allRecords = [...existingRecords, ...demoRecords];
    localStorage.setItem('ipRecords', JSON.stringify(allRecords));
    
    console.log('✅ Demo data oluşturuldu - Süper Admin tüm verileri görebilir');
    console.log(`📊 Toplam ${allRecords.length} kayıt, ${demoRecords.length} yeni eklendi`);
}

// Export auth for direct access
export { auth };

console.log('🔥 Firebase config loaded - SÜPER ADMİN DESTEĞİ AKTİF');
console.log('🔥 Süper Admin Hesabı: superadmin@ipmanager.com / superadmin123');
console.log('🐛 Debug Hesabı: debug@ipmanager.com / debug123');
console.log('🧪 Available services: authService, ipRecordsService, personsService, createDemoData, auth');
