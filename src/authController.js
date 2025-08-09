import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseAuth } from '../firebase/firebase-init.js';

class AuthController {
  static _instance;
  static get() {
    if (!this._instance) this._instance = new AuthController();
    return this._instance;
  }

  constructor() {
    this.state = 'idle';
    this.user = null;
    this._listeners = new Set();
    this._unsub = null;
    this._initPromise = null;
  }

  on(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  _emit() {
    console.log('[AUTH]', { event: 'state', state: this.state, uid: this.user?.uid });
    for (const cb of this._listeners) cb(this.state, this.user);
  }

  async init() {
    if (this._initPromise) return this._initPromise;
    console.log('[AUTH]', { event: 'init-start', state: this.state });
    this.state = 'loading';
    this._emit();
    this._initPromise = (async () => {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      if (this._unsub) this._unsub();
      this._unsub = onAuthStateChanged(
        firebaseAuth,
        (user) => {
          this.user = user;
          this.state = user ? 'authed' : 'unauthed';
          console.log('[AUTH]', { event: 'state-changed', state: this.state, uid: user?.uid });
          this._emit();
        },
        (err) => {
          this.state = 'error';
          console.error('[AUTH]', { event: 'state-error', code: err.code, message: err.message });
          this._emit();
        }
      );
    })();
    return this._initPromise;
  }

  async loginWithGoogle() {
    console.log('[AUTH]', { event: 'login-google-start' });
    if (this.state === 'loading') return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(firebaseAuth, provider);
      console.log('[AUTH]', { event: 'login-google-success' });
    } catch (err) {
      console.error('[AUTH]', { event: 'login-google-error', code: err.code, message: err.message });
      if (err.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(firebaseAuth, provider);
        } catch (e) {
          console.error('[AUTH]', { event: 'login-google-redirect-error', code: e.code, message: e.message });
        }
      }
      throw err;
    }
  }

  async loginWithPassword(email, password) {
    console.log('[AUTH]', { event: 'login-password-start', email });
    if (this.state === 'loading') return;
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('[AUTH]', { event: 'login-password-success', email });
    } catch (err) {
      console.error('[AUTH]', { event: 'login-password-error', code: err.code, message: err.message });
      throw err;
    }
  }

  async logout() {
    console.log('[AUTH]', { event: 'logout-start' });
    try {
      await signOut(firebaseAuth);
      console.log('[AUTH]', { event: 'logout-success' });
    } catch (err) {
      console.error('[AUTH]', { event: 'logout-error', code: err.code, message: err.message });
    }
  }
}

export const authController = AuthController.get();
