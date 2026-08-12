import React, { useState } from 'react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('admin@cryoflow.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleStandardLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        email,
        name: 'Dr. Elena Vance',
        role: 'Cold Operations Director',
        organization: 'Apex Life Sciences'
      });
      onClose();
    }, 800);
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
      onClose();
    }, 1000);
  };

  const handleFillDemo = (roleType = 'admin') => {
    if (roleType === 'warehouse') {
      setEmail('warehouse@cryoflow.ai');
      setPassword('ColdChain2026!');
    } else {
      setEmail('admin@cryoflow.ai');
      setPassword('ColdChain2026!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card bg-surface-container-lowest w-full max-w-[480px] rounded-2xl p-6 md:p-8 shadow-2xl relative border border-outline-variant space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <span className="material-symbols-outlined text-[28px]">lock</span>
          </div>
          <h3 className="text-headline-md font-bold text-on-surface">CryoFlow Console Login</h3>
          <p className="text-body-md text-on-surface-variant text-xs mt-1">21 CFR Part 11 Compliant Authentication Gateway</p>
        </div>

        {/* Demo Quick Fill Banner */}
        <div className="bg-primary-container/10 border border-primary/30 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
            <span className="text-xs font-label-md text-primary font-bold">Quick Demo Accounts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="text-[11px] font-bold bg-primary text-white px-2.5 py-1 rounded-md hover:bg-primary-container transition-all cursor-pointer"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('warehouse')}
              className="text-[11px] font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Warehouse Mgr
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSSO('Okta')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-high transition-colors font-label-md text-xs text-on-surface font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              Okta SSO
            </button>
            <button
              onClick={() => handleSSO('Azure')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-high transition-colors font-label-md text-xs text-on-surface font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">cloud</span>
              Azure AD
            </button>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-outline-variant/60 w-full"></div>
            <span className="bg-surface-container-lowest px-3 text-[11px] font-label-md text-on-surface-variant uppercase relative">or credentials</span>
          </div>

          <form onSubmit={handleStandardLogin} className="space-y-4">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm text-on-surface"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary text-sm text-on-surface"
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

            <div className="flex items-center justify-between text-xs font-label-md">
              <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
                <input type="checkbox" defaultChecked className="rounded border-outline-variant text-primary focus:ring-primary" />
                Remember device
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please contact your organization's CryoFlow Security Administrator for password reset."); }} className="text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-md font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  Sign In to Console
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
