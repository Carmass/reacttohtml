import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const I18N = {
  pt: {
    back: '← Voltar ao site',
    loginWelcome: 'Bem-vindo de volta! Faça login para continuar.',
    signupWelcome: 'Crie sua conta gratuita e comece agora.',
    warnTitle: 'Supabase não configurado.',
    warnBody: 'Para usar o sistema de autenticação, configure as variáveis de ambiente:',
    warnFile: 'no arquivo',
    emailLabel: 'E-mail', emailPlaceholder: 'seu@email.com',
    passwordLabel: 'Senha', passwordPlaceholder: 'Mínimo 6 caracteres',
    loading: 'Aguarde...',
    loginBtn: '→ Entrar', signupBtn: '🚀 Criar Conta Grátis',
    noAccount: 'Não tem conta?', createAccount: 'Criar conta grátis',
    hasAccount: 'Já tem conta?', doLogin: 'Fazer login',
    badge1: '✓ Grátis para começar', badge2: '✓ Sem cartão de crédito', badge3: '✓ 3 compilações/dia',
    toastSignup: '✅ Conta criada! Verifique seu e-mail.',
    errNoSupabase: 'Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local',
    errNetwork: 'Erro de conexão. Verifique se as credenciais do Supabase no .env.local estão corretas.',
    errCredentials: 'E-mail ou senha incorretos.',
    errAlreadyRegistered: 'Este e-mail já está cadastrado. Faça login.',
    errPassword: 'A senha deve ter pelo menos 6 caracteres.',
  },
  en: {
    back: '← Back to site',
    loginWelcome: 'Welcome back! Sign in to continue.',
    signupWelcome: 'Create your free account and get started.',
    warnTitle: 'Supabase not configured.',
    warnBody: 'To use the authentication system, configure the environment variables:',
    warnFile: 'in the file',
    emailLabel: 'Email', emailPlaceholder: 'you@email.com',
    passwordLabel: 'Password', passwordPlaceholder: 'Minimum 6 characters',
    loading: 'Please wait...',
    loginBtn: '→ Sign In', signupBtn: '🚀 Create Free Account',
    noAccount: "Don't have an account?", createAccount: 'Create free account',
    hasAccount: 'Already have an account?', doLogin: 'Sign in',
    badge1: '✓ Free to start', badge2: '✓ No credit card', badge3: '✓ 3 compilations/day',
    toastSignup: '✅ Account created! Check your email.',
    errNoSupabase: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
    errNetwork: 'Connection error. Check if Supabase credentials in .env.local are correct.',
    errCredentials: 'Incorrect email or password.',
    errAlreadyRegistered: 'This email is already registered. Please sign in.',
    errPassword: 'Password must be at least 6 characters.',
  },
  es: {
    back: '← Volver al sitio',
    loginWelcome: '¡Bienvenido de nuevo! Inicia sesión para continuar.',
    signupWelcome: 'Crea tu cuenta gratuita y empieza ahora.',
    warnTitle: 'Supabase no configurado.',
    warnBody: 'Para usar el sistema de autenticación, configura las variables de entorno:',
    warnFile: 'en el archivo',
    emailLabel: 'E-mail', emailPlaceholder: 'tu@email.com',
    passwordLabel: 'Contraseña', passwordPlaceholder: 'Mínimo 6 caracteres',
    loading: 'Espera...',
    loginBtn: '→ Iniciar Sesión', signupBtn: '🚀 Crear Cuenta Gratis',
    noAccount: '¿No tienes cuenta?', createAccount: 'Crear cuenta gratis',
    hasAccount: '¿Ya tienes cuenta?', doLogin: 'Iniciar sesión',
    badge1: '✓ Gratis para empezar', badge2: '✓ Sin tarjeta de crédito', badge3: '✓ 3 compilaciones/día',
    toastSignup: '✅ ¡Cuenta creada! Revisa tu correo.',
    errNoSupabase: 'Supabase no configurado. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local',
    errNetwork: 'Error de conexión. Verifica que las credenciales de Supabase en .env.local sean correctas.',
    errCredentials: 'Email o contraseña incorrectos.',
    errAlreadyRegistered: 'Este email ya está registrado. Inicia sesión.',
    errPassword: 'La contraseña debe tener al menos 6 caracteres.',
  },
  fr: {
    back: '← Retour au site',
    loginWelcome: 'Bienvenue! Connectez-vous pour continuer.',
    signupWelcome: 'Créez votre compte gratuit et commencez maintenant.',
    warnTitle: 'Supabase non configuré.',
    warnBody: "Pour utiliser le système d'authentification, configurez les variables d'environnement:",
    warnFile: 'dans le fichier',
    emailLabel: 'E-mail', emailPlaceholder: 'vous@email.com',
    passwordLabel: 'Mot de passe', passwordPlaceholder: 'Minimum 6 caractères',
    loading: 'Veuillez patienter...',
    loginBtn: '→ Se Connecter', signupBtn: '🚀 Créer un Compte Gratuit',
    noAccount: "Pas de compte?", createAccount: 'Créer un compte gratuit',
    hasAccount: 'Déjà un compte?', doLogin: 'Se connecter',
    badge1: '✓ Gratuit pour commencer', badge2: '✓ Sans carte de crédit', badge3: '✓ 3 compilations/jour',
    toastSignup: '✅ Compte créé! Vérifiez votre e-mail.',
    errNoSupabase: 'Supabase non configuré. Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local',
    errNetwork: 'Erreur de connexion. Vérifiez les identifiants Supabase dans .env.local.',
    errCredentials: 'E-mail ou mot de passe incorrect.',
    errAlreadyRegistered: 'Cet e-mail est déjà enregistré. Connectez-vous.',
    errPassword: 'Le mot de passe doit comporter au moins 6 caractères.',
  },
  de: {
    back: '← Zurück zur Website',
    loginWelcome: 'Willkommen zurück! Melden Sie sich an, um fortzufahren.',
    signupWelcome: 'Erstellen Sie Ihr kostenloses Konto und legen Sie los.',
    warnTitle: 'Supabase nicht konfiguriert.',
    warnBody: 'Um das Authentifizierungssystem zu nutzen, konfigurieren Sie die Umgebungsvariablen:',
    warnFile: 'in der Datei',
    emailLabel: 'E-Mail', emailPlaceholder: 'sie@email.com',
    passwordLabel: 'Passwort', passwordPlaceholder: 'Mindestens 6 Zeichen',
    loading: 'Bitte warten...',
    loginBtn: '→ Anmelden', signupBtn: '🚀 Kostenloses Konto Erstellen',
    noAccount: 'Kein Konto?', createAccount: 'Kostenloses Konto erstellen',
    hasAccount: 'Bereits ein Konto?', doLogin: 'Anmelden',
    badge1: '✓ Kostenlos starten', badge2: '✓ Keine Kreditkarte', badge3: '✓ 3 Kompilierungen/Tag',
    toastSignup: '✅ Konto erstellt! Überprüfen Sie Ihre E-Mail.',
    errNoSupabase: 'Supabase nicht konfiguriert. Setzen Sie VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env.local',
    errNetwork: 'Verbindungsfehler. Überprüfen Sie die Supabase-Anmeldedaten in .env.local.',
    errCredentials: 'Falsche E-Mail oder falsches Passwort.',
    errAlreadyRegistered: 'Diese E-Mail ist bereits registriert. Bitte anmelden.',
    errPassword: 'Das Passwort muss mindestens 6 Zeichen haben.',
  },
  zh: {
    back: '← 返回网站',
    loginWelcome: '欢迎回来！请登录继续。',
    signupWelcome: '创建您的免费账户，立即开始。',
    warnTitle: 'Supabase未配置。',
    warnBody: '要使用身份验证系统，请配置环境变量：',
    warnFile: '在文件中',
    emailLabel: '电子邮件', emailPlaceholder: 'you@email.com',
    passwordLabel: '密码', passwordPlaceholder: '至少6个字符',
    loading: '请稍候...',
    loginBtn: '→ 登录', signupBtn: '🚀 创建免费账户',
    noAccount: '没有账户？', createAccount: '创建免费账户',
    hasAccount: '已有账户？', doLogin: '登录',
    badge1: '✓ 免费开始', badge2: '✓ 无需信用卡', badge3: '✓ 每天3次编译',
    toastSignup: '✅ 账户已创建！请检查您的电子邮件。',
    errNoSupabase: 'Supabase未配置。在.env.local中设置VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY',
    errNetwork: '连接错误。请检查.env.local中的Supabase凭据是否正确。',
    errCredentials: '电子邮件或密码不正确。',
    errAlreadyRegistered: '此电子邮件已注册。请登录。',
    errPassword: '密码必须至少6个字符。',
  },
  ja: {
    back: '← サイトに戻る',
    loginWelcome: 'おかえりなさい！続けるにはサインインしてください。',
    signupWelcome: '無料アカウントを作成して今すぐ始めましょう。',
    warnTitle: 'Supabaseが設定されていません。',
    warnBody: '認証システムを使用するには、環境変数を設定してください：',
    warnFile: 'ファイル内に',
    emailLabel: 'メールアドレス', emailPlaceholder: 'you@email.com',
    passwordLabel: 'パスワード', passwordPlaceholder: '最低6文字',
    loading: 'お待ちください...',
    loginBtn: '→ ログイン', signupBtn: '🚀 無料アカウントを作成',
    noAccount: 'アカウントをお持ちでない方？', createAccount: '無料アカウントを作成',
    hasAccount: 'すでにアカウントをお持ちの方？', doLogin: 'ログイン',
    badge1: '✓ 無料で始める', badge2: '✓ クレジットカード不要', badge3: '✓ 1日3回コンパイル',
    toastSignup: '✅ アカウントが作成されました！メールをご確認ください。',
    errNoSupabase: 'Supabaseが設定されていません。.env.localにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください',
    errNetwork: '接続エラー。.env.localのSupabase認証情報が正しいか確認してください。',
    errCredentials: 'メールアドレスまたはパスワードが正しくありません。',
    errAlreadyRegistered: 'このメールアドレスはすでに登録されています。ログインしてください。',
    errPassword: 'パスワードは6文字以上必要です。',
  },
};

function detectLang() {
  const saved = localStorage.getItem('rtoh_lang');
  if (saved && I18N[saved]) return saved;
  const nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
  const map = { pt: 'pt', en: 'en', es: 'es', fr: 'fr', de: 'de', zh: 'zh', ja: 'ja' };
  return map[nav] || 'pt';
}

function Logo({ size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20" fill="none">
        <path d="M6 7L3 10L6 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 7L17 10L14 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 5L9 15" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

export default function LoginPage({ go, showToast }) {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]         = useState('login');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const t = I18N[detectLang()] || I18N.pt;

  async function handleAuth(e) {
    e.preventDefault();
    if (!email || !password) return;
    if (!isSupabaseConfigured) { setError(t.errNoSupabase); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/Compiler');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast?.(t.toastSignup);
        setMode('login');
      }
    } catch (err) {
      const msg = err.message ?? '';
      setError(
        msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') ? t.errNetwork
        : msg.includes('Invalid login') ? t.errCredentials
        : msg.includes('already registered') ? t.errAlreadyRegistered
        : msg.includes('Password') ? t.errPassword
        : msg
      );
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0EFFE', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/Landing')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Logo size={36} />
          <span style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B' }}>React to HTML</span>
        </button>
        <button onClick={() => navigate('/Landing')} style={{ height: 34, padding: '0 16px', borderRadius: 8, border: '1.5px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          {t.back}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 10px 40px rgba(124,58,237,.12),0 2px 8px rgba(0,0,0,.06)', padding: '40px 36px', width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Logo size={56} /></div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', marginBottom: 6 }}>React to HTML Compiler</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              {mode === 'login' ? t.loginWelcome : t.signupWelcome}
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 10, padding: '12px 16px', fontSize: 12, marginBottom: 20, border: '1px solid #FDE68A', lineHeight: 1.6 }}>
              ⚠️ <strong>{t.warnTitle}</strong> {t.warnBody}<br />
              <code style={{ background: 'rgba(0,0,0,.07)', padding: '1px 5px', borderRadius: 3 }}>VITE_SUPABASE_URL</code>
              {' '}e{' '}
              <code style={{ background: 'rgba(0,0,0,.07)', padding: '1px 5px', borderRadius: 3 }}>VITE_SUPABASE_ANON_KEY</code>
              {' '}{t.warnFile}{' '}
              <code style={{ background: 'rgba(0,0,0,.07)', padding: '1px 5px', borderRadius: 3 }}>.env.local</code>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{t.emailLabel}</label>
              <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
                style={{ height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid #D1D5DB', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{t.passwordLabel}</label>
              <input type="password" placeholder={t.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid #D1D5DB', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ height: 48, borderRadius: 12, border: 'none', background: loading ? '#9CA3AF' : '#7C3AED', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, transition: 'background .15s' }}
            >
              {loading
                ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> {t.loading}</>
                : mode === 'login' ? t.loginBtn : t.signupBtn
              }
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B7280' }}>
            {mode === 'login' ? (
              <>{t.noAccount}{' '}
                <button style={{ background: 'none', border: 'none', color: '#7C3AED', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }} onClick={() => { setMode('signup'); setError(''); }}>
                  {t.createAccount}
                </button>
              </>
            ) : (
              <>{t.hasAccount}{' '}
                <button style={{ background: 'none', border: 'none', color: '#7C3AED', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }} onClick={() => { setMode('login'); setError(''); }}>
                  {t.doLogin}
                </button>
              </>
            )}
          </div>

          <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 24, paddingTop: 16, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: '#9CA3AF' }}>
              <span>{t.badge1}</span>
              <span>{t.badge2}</span>
              <span>{t.badge3}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
