import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js'

export const AuthState = {
  Idle:'idle', Loading:'loading', Authed:'authed', Unauthed:'unauthed', Error:'error'
}

export class AuthController {
  static #instance; static get(){ return this.#instance ??= new AuthController() }

  constructor(){
    this.state = AuthState.Idle
    this.user = null
    this.listeners = new Set()
    this._inited = false

    // window.FIREBASE_CONFIG を config.js で与える（anon可）
    const app = initializeApp(window.FIREBASE_CONFIG)
    this.auth = getAuth(app)
    this.provider = new GoogleAuthProvider()
  }
  on(cb){ this.listeners.add(cb); return ()=>this.listeners.delete(cb) }
  #emit(){ const s={state:this.state,user:this.user}; for(const cb of this.listeners) cb(s) }

  async init(){
    if(this._inited) return; this._inited = true
    this.state = AuthState.Loading; this.#emit()
    onAuthStateChanged(this.auth, async (u)=>{
      this.user = u
      this.state = u ? AuthState.Authed : AuthState.Unauthed
      console.log('[AUTH] onAuthStateChange', !!u)
      this.#emit()
      if(u){
        // サーバへ同期（idToken検証 & Supabase upsert）
        try{
          const idToken = await u.getIdToken()
          const res = await fetch('/api/sync-user', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              idToken,
              email: u.email || '',
              name: u.displayName || (u.email ? u.email.split('@')[0] : 'no-name')
            })
          })
          if(!res.ok) console.error('sync-user failed', await res.text())
        }catch(e){ console.error('sync-user err', e) }
      }
    })
  }

  async loginWithGoogle(){
    if(this.state===AuthState.Loading) return
    this.state = AuthState.Loading; this.#emit()
    try{
      await signInWithPopup(this.auth, this.provider)
      this.state = AuthState.Authed; this.#emit()
    }catch(e){
      this.state = AuthState.Error; this.#emit(); throw e
    }
  }
  async loginWithPassword(email, password){
    if(this.state===AuthState.Loading) return
    this.state = AuthState.Loading; this.#emit()
    try{
      await signInWithEmailAndPassword(this.auth, email, password)
      this.state = AuthState.Authed; this.#emit()
    }catch(e){
      this.state = AuthState.Error; this.#emit(); throw e
    }
  }
  async logout(){
    if(this.state===AuthState.Loading) return
    this.state = AuthState.Loading; this.#emit()
    try{ await signOut(this.auth); this.state = AuthState.Unauthed; this.#emit() }
    catch(e){ this.state = AuthState.Error; this.#emit(); throw e }
  }
}
