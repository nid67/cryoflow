import React, { useState } from 'react';

export default function LoginPage({ onLoginSuccess, onNavigate }) {
  const [email, setEmail] = useState('admin@cryoflow.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both corporate email and password.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        email,
        name: 'Dr. Elena Vance',
        role: 'Cold Operations Director',
        organization: 'Apex Life Sciences'
      });
      onNavigate('dashboard');
    }, 1000);
  };

  const handleSSO = (provider) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        email: `sso-user@${provider.toLowerCase()}.com`,
        name: `${provider} Enterprise Admin`,
        role: 'Global Supply Chain Lead',
        organization: 'Global BioLogistics'
      });
      onNavigate('dashboard');
    }, 1200);
  };

  const handleFillDemo = () => {
    setEmail('admin@cryoflow.ai');
    setPassword('ColdChain2026!');
    setErrorMessage('');
  };

  return (
    <div className="min-h-[640px] w-full flex items-center justify-center py-12 px-4">
      <div className="glass-card bg-surface-container-lowest w-full max-w-[480px] rounded-2xl p-6 md:p-8 shadow-2xl border border-outline-variant/60 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary-container text-white flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h2 className="text-headline-md font-bold text-on-surface">CryoFlow Enterprise Gateway</h2>
          <p className="text-body-md text-on-surface-variant text-xs">
            21 CFR Part 11 & GxP Validated Single Sign-On Console
          </p>
        </div>

        {/* Demo Quick Fill Banner */}
        <div className="bg-primary-container/10 border border-primary/30 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
            <span className="text-xs font-label-md text-primary font-bold">Try Enterprise Demo</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs font-label-md bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-container transition-all shadow-sm cursor-pointer"
          >
            Auto-Fill Credentials
          </button>
        </div>

        {/* SSO Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSSO('Okta')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-high transition-colors font-label-md text-xs text-on-surface font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              Okta SSO
            </button>
            <button
              type="button"
              onClick={() => handleSSO('Azure')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-high transition-colors font-label-md text-xs text-on-surface font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">cloud</span>
              Azure AD
            </button>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-outline-variant/60 w-full"></div>
            <span className="bg-surface-container-lowest px-4 text-[11px] font-label-md text-on-surface-variant uppercase relative">or corporate email</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-label-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-label-md text-xs text-on-surface-variant mb-1">Corporate Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[18px]">mail</span>
              <input
                type="email"
                required
                placeholder="admin@cryoflow.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm text-on-surface"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-md text-xs text-on-surface-variant mb-1">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[18px]">key</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-on-surface-variant hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-label-md pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
              <input type="checkbox" defaultChecked className="rounded border-outline-variant text-primary focus:ring-primary" />
              Remember this device
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please contact your organization's CryoFlow Security Administrator for password reset."); }} className="text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white font-label-md font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Authenticating Session...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">login</span>
                Sign In to Console
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-on-surface-variant pt-2">
          Protected by AES-256 TLS 1.3 Encryption. Session activity logged for audit verification.
        </p>
      </div>
    </div>
  );
}
