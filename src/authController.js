import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const AuthState = {
  Idle: 'idle',
  Loading: 'loading',
  Authed: 'authed',
  Unauthed: 'unauthed',
  Error: 'error',
}

export class AuthController {
  static #instance
  static get() { return this.#instance ??= new AuthController() }

  constructor(){
    this.state = AuthState.Idle
    this.user = null
    this.listeners = new Set()
    this._inited = false
    // Vercel などで注入された値 or 砂箱からの直書きに対応
    const url = window.SUPABASE_URL ?? (import.meta?.env?.VITE_SUPABASE_URL)
    const key = window.SUPABASE_ANON_KEY ?? (import.meta?.env?.VITE_SUPABASE_ANON_KEY)
    if(!url || !key) throw new Error('Supabase URL/Key not found')
    this.supabase = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
    this._unsubscribe = null
  }

  on(cb){ this.listeners.add(cb); return ()=>this.listeners.delete(cb) }
  #emit(){ const s = {state:this.state, user:this.user}; for(const cb of this.listeners) cb(s) }

  async init(){
    if(this._inited) return
    this._inited = true
    this.state = AuthState.Loading; this.#emit()
    try{
      const { data: { session }, error } = await this.supabase.auth.getSession()
      if(error) throw error
      this.user  = session?.user ?? null
      this.state = this.user ? AuthState.Authed : AuthState.Unauthed
      this.#emit()
      this._unsubscribe = this.supabase.auth.onAuthStateChange((event, session)=>{
        this.user = session?.user ?? null
        this.state = this.user ? AuthState.Authed : AuthState.Unauthed
        console.log('[AUTH] onAuthStateChange', event, !!this.user)
        this.#emit()
      }).data.subscription
    }catch(e){
      console.error('[AUTH] INIT_ERR', e)
      this.user = null
      this.state = AuthState.Error
      this.#emit()
      throw e
    }
  }

  async loginWithGoogle(){
    if(this.state === AuthState.Loading) return
    this.state = AuthState.Loading; this.#emit()
    try{
      // まずURLだけ受け取り→明示遷移（挙動が見えてデバッグしやすい）
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: location.origin + '/index.html',
          queryParams: { prompt: 'select_account' },
          skipBrowserRedirect: true,
        }
      })
      if(error) throw error
      if(data?.url) location.href = data.url
      else throw new Error('No OAuth URL returned')
    }catch(e){
      this.state = AuthState.Error; this.#emit()
      throw e
    }
  }

  async loginWithPassword(email, password){
    if(this.state === AuthState.Loading) return
    this.state = AuthState.Loading; this.#emit()
    try{
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password })
      if(error) throw error
      this.user = data.user
      this.state = AuthState.Authed; this.#emit()
    }catch(e){
      this.state = AuthState.Error; this.#emit()
      throw e
    }
  }

  async logout(){
    if(this.state === AuthState.Loading) return
    this.state = AuthState.Loading; this.#emit()
    try{
      const { error } = await this.supabase.auth.signOut()
      if(error) throw error
      this.user = null
      this.state = AuthState.Unauthed; this.#emit()
    }catch(e){
      this.state = AuthState.Error; this.#emit()
      throw e
    }
  }
}

