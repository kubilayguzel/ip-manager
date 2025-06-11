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
let isFirebaseAvailable = false; // Modül kapsamında tutuluyor

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
    isFirebaseAvailable: isFirebaseAvailable, // Dışa aktarılıyor

    async signIn(email, password) {
        console.log('🔐 Attempting sign in with:', email);
        
        if (!this.isFirebaseAvailable) { // isFirebaseAvailable kontrolü
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
        
        if (!this.isFirebaseAvailable) { // isFirebaseAvailable kontrolü
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
            if (this.isFirebaseAvailable && auth) { // isFirebaseAvailable kontrolü
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
        if (this.isFirebaseAvailable && auth && auth.currentUser) { // isFirebaseAvailable kontrolü
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
            if (authService.isFirebaseAvailable && db) { // isFirebaseAvailable kontrolü
                const user = authService.getCurrentUser();
                if (!user || !user.uid) throw new Error('Kullanıcı oturumu bulunamadı');

                const recordData = {
                    ...record,
                    userId: user.uid,
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
            if (authService.isFirebaseAvailable && db) { // isFirebaseAvailable kontrolü
                const user = authService.getCurrentUser();
                if (!user || !user.uid) {
                    console.warn('Firebase get records: No authenticated user. Returning local records.');
                    return this.localGetRecords();
                }

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
            return this.localGetRecords();
        }
    },

    async updateRecord(recordId, updates) {
        console.log(`🔄 Updating record ${recordId}:`, updates);
        try {
            if (authService.isFirebaseAvailable && db) { // isFirebaseAvailable kontrolü
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
            if (authService.isFirebaseAvailable && db) { // isFirebaseAvailable kontrolü
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

// **Yeni Kişi Servisi (Firebase Firestore veya localStorage)**
export const personsService = {
    async addPerson(person) {
        console.log('👥 Adding person:', person);
        try {
            if (authService.isFirebaseAvailable && db) { // isFirebaseAvailable kontrolü
                const user = authService.getCurrentUser();
                if (!user || !user.uid) throw new Error('Kullanıcı oturumu bulunamadı.');

                const personData = {
                    ...person,
                    userId: user.uid, // Kişiyi kullanıcıya bağla
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
            if (authService.isFirebaseAvailable && db) { // isFirebaseAvailable kontrolü
                const user = authService.getCurrentUser();
                if (!user || !user.uid) {
                    console.warn('Firebase get persons: No authenticated user. Returning local persons.');
                    return this.localGetPersons();
                }
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
                console.log(`✅ Firebase persons found: ${persons.length}`);
                return { success: true, data: persons };
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
            if (authService.isFirebaseAvailable && db) { // isFirebaseAvailable kontrolü
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
            if (authService.isFirebaseAvailable && db) { // isFirebaseAvailable kontrolü
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
        const newPerson = {
            id: 'local_person_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...person,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        persons.push(newPerson);
        localStorage.setItem('persons', JSON.stringify(persons)); // 'persons' anahtarı kullanılıyor
        console.log('✅ Local person added:', newPerson);
        return { success: true, id: newPerson.id, data: newPerson };
    },

    localGetPersons() {
        const persons = this.getLocalPersons();
        console.log('📋 Local persons found:', persons.length);
        return { success: true, data: persons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
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
            const persons = localStorage.getItem('persons'); // 'persons' anahtarı kullanılıyor
            return persons ? JSON.parse(persons) : [];
        } catch (error) {
            console.error('Error reading local persons:', error);
            return [];
        }
    }
};

// Create demo data (Firebase is active, so this will attempt to add to Firestore)
export async function createDemoData() {
    console.log('🎯 Creating demo data...');
    
    // IP kayıtları için demo veri kontrolü ve oluşturma
    let ipRecordsExist = false;
    try {
        const ipRecordsResult = await ipRecordsService.getRecords();
        if (ipRecordsResult.success && ipRecordsResult.data.length > 0) {
            ipRecordsExist = true;
        }
    } catch (e) {
        console.warn('Could not check IP records for demo data, assuming none or error:', e.message);
    }

    if (ipRecordsExist) {
        console.log('Skipping IP record demo data creation: Records already exist for this user.');
    } else {
        const demoRecords = [
            {
                type: 'patent',
                title: 'Akıllı Enerji Yönetim Sistemi',
                description: 'IoT tabanlı enerji tasarrufu sağlayan sistem',
                status: 'pending',
                applicationDate: '2024-01-15',
                owners: [{ name: 'TechCorp A.Ş.', type: 'company' }],
                applicationNumber: 'TR2024/001234',
                trademarkImage: null
            },
            {
                type: 'trademark',
                title: 'EcoSmart',
                description: 'Çevre dostu teknoloji ürünleri markası',
                status: 'approved',
                applicationDate: '2023-11-20',
                owners: [{ name: 'Green Tech Ltd.', type: 'company' }],
                applicationNumber: 'TR2023/987654',
                trademarkImage: {
                    name: 'ecosmart_logo.jpeg',
                    type: 'image/jpeg',
                    size: 15000,
                    // Bu Base64 içeriği uzun olduğu için burada kısaltılmış bir örnek bırakıyorum.
                    // Gerçek uygulamada tam Base64 stringini içermelidir.
                    content: 'data:image/jpeg;base64,...(kısaltılmış Base64)' 
                }
            },
            {
                type: 'copyright',
                title: 'Dijital Pazarlama Yazılımı',
                description: 'E-ticaret platformları için analitik yazılım',
                status: 'approved',
                applicationDate: '2024-02-10',
                owners: [{ name: 'Software Solutions Inc.', type: 'company' }],
                applicationNumber: 'TR2024/555666',
                trademarkImage: null
            },
            {
                type: 'design',
                title: 'Modern Ofis Mobilyası Serisi',
                description: 'Ergonomik tasarım prensipleriyle geliştirilmiş mobilya',
                status: 'rejected',
                applicationDate: '2023-12-05',
                owners: [{ name: 'Design Studio X', type: 'company' }],
                applicationNumber: 'TR2023/111222',
                trademarkImage: null
            }
        ];

        for (const record of demoRecords) {
            await ipRecordsService.addRecord(record);
        }
        console.log('✅ IP record demo data created successfully');
    }

    // Kişi kayıtları için demo veri kontrolü ve oluşturma
    let personsExist = false;
    try {
        const personsResult = await personsService.getPersons();
        if (personsResult.success && personsResult.data.length > 0) {
            personsExist = true;
        }
    } catch (e) {
        console.warn('Could not check persons for demo data, assuming none or error:', e.message);
    }

    if (personsExist) {
        console.log('Skipping person demo data creation: Persons already exist for this user.');
    } else {
        const demoPersons = [
            { name: 'Demo Kişi 1', email: 'demoperson1@example.com', phone: '05551112233', type: 'individual', address: 'Demo Adres 1' },
            { name: 'Demo Şirket A.Ş.', email: 'info@demosirket.com', phone: '02129998877', type: 'company', address: 'Demo Merkez' },
            { name: 'Demo Kurum', email: 'contact@demokurum.org', phone: '03121234567', type: 'institution', address: 'Demo Başkent' }
        ];

        for (const person of demoPersons) {
            await personsService.addPerson(person);
        }
        console.log('✅ Demo persons created successfully');
    }

    console.log('All demo data operations finished.');
}

// Authentication check utility (removed, onAuthStateChanged handles this more robustly)

// Export auth for direct access
export { auth };

console.log('🔥 Firebase config loaded - REAL MODE ACTIVE');
console.log('🧪 Available services: authService, ipRecordsService, personsService, createDemoData, auth');