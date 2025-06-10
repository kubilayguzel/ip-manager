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

// Firebase Config - Replace with your config
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
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
    console.warn('⚠️ Firebase initialization failed, using localStorage fallback:', error);
    isFirebaseAvailable = false;
}

// Authentication Service
export const authService = {
    auth: auth,
    
    async signIn(email, password) {
        try {
            if (!isFirebaseAvailable) {
                return this.localSignIn(email, password);
            }
            
            const result = await signInWithEmailAndPassword(auth, email, password);
            return {
                success: true,
                user: result.user,
                message: 'Giriş başarılı'
            };
        } catch (error) {
            console.error('Sign in error:', error);
            
            // Fallback to local authentication
            return this.localSignIn(email, password);
        }
    },

    async signUp(email, password, displayName) {
        try {
            if (!isFirebaseAvailable) {
                return this.localSignUp(email, password, displayName);
            }
            
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
            console.error('Sign up error:', error);
            return this.localSignUp(email, password, displayName);
        }
    },

    async signOut() {
        try {
            if (isFirebaseAvailable) {
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
        if (isFirebaseAvailable && auth.currentUser) {
            return auth.currentUser;
        }
        
        // Fallback to localStorage
        const localUser = localStorage.getItem('currentUser');
        return localUser ? JSON.parse(localUser) : null;
    },

    // Local authentication fallback
    localSignIn(email, password) {
        const demoAccounts = [
            { email: 'demo@ipmanager.com', password: 'demo123', name: 'Demo Kullanıcı', role: 'demo' },
            { email: 'admin@ipmanager.com', password: 'admin123', name: 'Admin', role: 'admin' },
            { email: 'test@example.com', password: 'test123', name: 'Test Kullanıcı', role: 'user' }
        ];

        const account = demoAccounts.find(acc => 
            acc.email === email && acc.password === password
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
            return {
                success: true,
                user: userData,
                message: 'Demo hesapla giriş başarılı'
            };
        }

        return {
            success: false,
            error: 'Geçersiz e-posta veya şifre'
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
        
        return {
            success: true,
            id: newRecord.id,
            data: newRecord
        };
    },

    localGetRecords() {
        const records = this.getLocalRecords();
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
        window.location.href = 'index.html';
        return false;
    }
    return user;
}

// Export auth for direct access
export { auth };

console.log('🔥 Firebase config loaded successfully');
console.log('Available services: authService, ipRecordsService, createDemoData, requireAuth');