// Firebase Configuration for IP Manager - DEMO MODE
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

// Firebase Config - DEMO MODE: Geçersiz config ile localStorage'u zorla
const firebaseConfig = {
    apiKey: "demo-mode-disabled",
    authDomain: "demo-mode-disabled",
    projectId: "demo-mode-disabled",
    storageBucket: "demo-mode-disabled",
    messagingSenderId: "demo-mode-disabled",
    appId: "demo-mode-disabled"
};

// Initialize Firebase - Demo modda hata ile localStorage fallback'i zorla
let app, auth, db;
let isFirebaseAvailable = false;

try {
    // Firebase'i zorla devre dışı bırak demo test için
    throw new Error('Demo mode - using localStorage only');
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseAvailable = true;
    console.log('🔥 Firebase initialized successfully');
} catch (error) {
    console.warn('⚠️ Firebase disabled - using localStorage demo mode:', error.message);
    isFirebaseAvailable = false;
}

// Authentication Service
export const authService = {
    auth: auth,
    
    async signIn(email, password) {
        console.log('🔐 Attempting sign in with:', email);
        
        // Demo modda direkt localStorage kullan
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
            // Firebase hata verirse localStorage fallback
            return this.localSignIn(email, password);
        }
    },

    async signUp(email, password, displayName) {
        console.log('📝 Attempting sign up with:', email);
        
        // Demo modda direkt localStorage kullan
        if (!isFirebaseAvailable) {
            return this.localSignUp(email, password, displayName);
        }
        
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile
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
            if (isFirebaseAvailable && auth) {
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
        if (isFirebaseAvailable && auth && auth.currentUser) {
            return auth.currentUser;
        }
        
        // Fallback to localStorage
        const localUser = localStorage.getItem('currentUser');
        return localUser ? JSON.parse(localUser) : null;
    },

    // Local authentication fallback - ENHANCED
    localSignIn(email, password) {
        console.log('🧪 Local sign in attempt:', email, password);
        
        const demoAccounts = [
            { email: 'demo@ipmanager.com', password: 'demo123', name: 'Demo Kullanıcı', role: 'demo' },
            { email: 'admin@ipmanager.com', password: 'admin123', name: 'Admin Kullanıcı', role: 'admin' },
            { email: 'test@example.com', password: 'test123', name: 'Test Kullanıcı', role: 'user' }
        ];

        console.log('Available demo accounts:', demoAccounts.map(acc => `${acc.email}/${acc.password}`));

        const account = demoAccounts.find(acc => 
            acc.email.toLowerCase().trim() === email.toLowerCase().trim() && 
            acc.password === password.trim()
        );

        console.log('Found account:', account);

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
            error: 'Geçersiz e-posta veya şifre. Demo hesaplar: demo@ipmanager.com/demo123, admin@ipmanager.com/admin123'
        };
    },

    localSignUp(email, password, displayName) {
        const userData = {
            uid: 'local_' + Date.now(),
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

// IP Records Service
export const ipRecordsService = {
    async addRecord(record) {
        console.log('💾 Adding record:', record);
        
        try {
            if (isFirebaseAvailable) {
                const user = authService.getCurrentUser();
                if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

                const recordData = {
                    ...record,
                    userId: user.uid,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, 'ipRecords'), recordData);
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
            if (isFirebaseAvailable) {
                const user = authService.getCurrentUser();
                if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

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
        try {
            if (isFirebaseAvailable) {
                const recordRef = doc(db, 'ipRecords', recordId);
                const updateData = {
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                
                await updateDoc(recordRef, updateData);
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
        try {
            if (isFirebaseAvailable) {
                await deleteDoc(doc(db, 'ipRecords', recordId));
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
            return { success: true };
        }
        
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

// Create demo data
export async function createDemoData() {
    console.log('🎯 Creating demo data...');
    
    const demoRecords = [
        {
            type: 'patent',
            title: 'Akıllı Enerji Yönetim Sistemi',
            description: 'IoT tabanlı enerji tasarrufu sağlayan sistem',
            status: 'pending',
            applicationDate: '2024-01-15',
            applicant: 'TechCorp A.Ş.',
            applicationNumber: 'TR2024/001234'
        },
        {
            type: 'trademark',
            title: 'EcoSmart',
            description: 'Çevre dostu teknoloji ürünleri markası',
            status: 'approved',
            applicationDate: '2023-11-20',
            applicant: 'Green Tech Ltd.',
            applicationNumber: 'TR2023/987654'
        },
        {
            type: 'copyright',
            title: 'Dijital Pazarlama Yazılımı',
            description: 'E-ticaret platformları için analitik yazılım',
            status: 'approved',
            applicationDate: '2024-02-10',
            applicant: 'Software Solutions Inc.',
            applicationNumber: 'TR2024/555666'
        },
        {
            type: 'design',
            title: 'Modern Ofis Mobilyası Serisi',
            description: 'Ergonomik tasarım prensipleriyle geliştirilmiş mobilya',
            status: 'rejected',
            applicationDate: '2023-12-05',
            applicant: 'Design Studio X',
            applicationNumber: 'TR2023/111222'
        }
    ];

    for (const record of demoRecords) {
        await ipRecordsService.addRecord(record);
    }
    
    console.log('✅ Demo data created successfully');
}

// Authentication check utility
export function requireAuth() {
    const user = authService.getCurrentUser();
    if (!user) {
        console.log('❌ Authentication required, redirecting to login');
        window.location.href = 'index.html';
        return false;
    }
    console.log('✅ User authenticated:', user.email);
    return user;
}

// Export auth for direct access
export { auth };

console.log('🔥 Firebase config loaded - DEMO MODE ACTIVE');
console.log('📋 Demo hesaplar:');
console.log('  demo@ipmanager.com / demo123');
console.log('  admin@ipmanager.com / admin123');
console.log('  test@example.com / test123');
console.log('🧪 Available services: authService, ipRecordsService, createDemoData, requireAuth');