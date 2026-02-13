import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Radio, Building2, Landmark, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleCard } from '@/components/auth/RoleCard';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type AuthMode = 'login' | 'signup';

const roles = [{
  role: 'community' as UserRole,
  title: 'Community Member',
  description: 'Report incidents and request emergency resources in your area',
  icon: Users
}, {
  role: 'agency' as UserRole,
  title: 'Agency Personnel',
  description: 'Manage emergency resources and respond to active incidents',
  icon: Shield
}, {
  role: 'coordinator' as UserRole,
  title: 'Coordinator',
  description: 'Oversee operations, assign resources, and monitor analytics',
  icon: Radio
}];

const roleFormConfig = {
  community: {
    emailLabel: 'Email Address',
    emailPlaceholder: 'Enter your email',
    emailHint: null,
    showOrganization: false,
    formTitle: 'Community Registration',
    formSubtitle: 'Join your local crisis response network',
    accentClass: 'border-l-4 border-l-primary',
  },
  agency: {
    emailLabel: 'Organization Email',
    emailPlaceholder: 'name@agency.org',
    emailHint: 'Use your official organization email address',
    showOrganization: true,
    formTitle: 'Agency Registration',
    formSubtitle: 'Register as an official responding entity',
    accentClass: 'border-l-4 border-l-severity-high',
  },
  coordinator: {
    emailLabel: 'Government Email',
    emailPlaceholder: 'name@gov.agency',
    emailHint: 'Requires verified government credentials',
    showOrganization: false,
    formTitle: 'Coordinator Access',
    formSubtitle: 'Elevated command and oversight privileges',
    accentClass: 'border-l-4 border-l-severity-critical',
  },
};

// Password validation rules
const passwordRules = [
  { id: 'lowercase', label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
];

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [showPasswordFeedback, setShowPasswordFeedback] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Password validation state
  const passwordValidation = useMemo(() => {
    const results = passwordRules.map(rule => ({
      ...rule,
      passed: rule.test(password)
    }));
    const passedCount = results.filter(r => r.passed).length;
    const strength = (passedCount / passwordRules.length) * 100;
    const isValid = results.every(r => r.passed);
    return { results, strength, isValid };
  }, [password]);

  const passwordsMatch = password === confirmPassword;
  const showMismatchError = confirmPassword.length > 0 && !passwordsMatch;

  // Reset form fields when role changes
  useEffect(() => {
    if (mode === 'signup') {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setOrganizationName('');
      setFormKey(prev => prev + 1);
      setShowPasswordFeedback(false);
    }
  }, [selectedRole, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedRole) return;

  try {
    if (mode === "login") {
      const data = await login(email, password);

      // ✅ STRICT ROLE CHECK
      if (data.role !== selectedRole) {
        alert(
          `You are registered as "${data.role}". Please select the correct role.`
        );
        return;
      }

      // navigation already handled in AuthContext
    } else {
      if (!passwordValidation.isValid || !passwordsMatch) return;

      await signup(
        email,
        password,
        name,
        selectedRole,
        organizationName || undefined
      );

      // navigation already handled in AuthContext
    }
  } catch (err: any) {
    alert(err.message || "Authentication failed");
  }
};


  const isSignupValid = mode === 'login' || (passwordValidation.isValid && passwordsMatch);

  const config = selectedRole ? roleFormConfig[selectedRole] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground bg-card">
        <div className="container mx-auto flex items-center gap-4 px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-foreground">
            <Radio className="h-6 w-6 text-background" />
          </div>
          <div>
            <span className="font-mono text-xs tracking-wider text-muted-foreground">READY RESPONSE OPS</span>
            <h1 className="text-xl font-bold tracking-tight">COMMAND CENTER</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Title */}
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {mode === 'login' ? 'Access Command Center' : 'Join the Response Network'}
            </h2>
            <p className="mt-3 text-muted-foreground">
              Select your role to access the appropriate command interface
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-10">
            <Label className="mb-4 block font-mono text-sm tracking-wider text-muted-foreground">
              SELECT YOUR ROLE
            </Label>
            <div className="grid gap-4 sm:grid-cols-3 animate-stagger-in">
              {roles.map(role => (
                <RoleCard 
                  key={role.role} 
                  {...role} 
                  selected={selectedRole === role.role} 
                  onSelect={() => setSelectedRole(role.role)} 
                />
              ))}
            </div>
          </div>

          {/* Auth Form */}
          {selectedRole && config && (
            <div className="mx-auto max-w-md animate-fade-in" key={`${selectedRole}-${mode}`}>
              <form 
                onSubmit={handleSubmit} 
                className={cn(
                  "border-2 border-foreground bg-card p-8 shadow-md transition-all duration-300",
                  mode === 'signup' && config.accentClass
                )}
              >
                {/* Role-specific form header for signup */}
                {mode === 'signup' && (
                  <div className="mb-6 pb-6 border-b border-border animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                      {selectedRole === 'community' && <Users className="h-5 w-5 text-primary" />}
                      {selectedRole === 'agency' && <Building2 className="h-5 w-5 text-severity-high" />}
                      {selectedRole === 'coordinator' && <Landmark className="h-5 w-5 text-severity-critical" />}
                      <h3 className="font-bold tracking-tight">{config.formTitle}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{config.formSubtitle}</p>
                  </div>
                )}

                <div className="space-y-5" key={formKey}>
                  {/* Organization Name - Agency only */}
                  {mode === 'signup' && config.showOrganization && (
                    <div 
                      className="space-y-2 animate-fade-in"
                      style={{ animationDelay: '0ms' }}
                    >
                      <Label htmlFor="organization" className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-severity-high" />
                        Organization Name
                      </Label>
                      <Input 
                        id="organization" 
                        type="text" 
                        value={organizationName} 
                        onChange={e => setOrganizationName(e.target.value)} 
                        placeholder="Enter your organization name" 
                        required 
                        className="border-2 border-foreground" 
                      />
                    </div>
                  )}

                  {/* Full Name - Signup only */}
                  {mode === 'signup' && (
                    <div 
                      className="space-y-2 animate-fade-in"
                      style={{ animationDelay: config.showOrganization ? '50ms' : '0ms' }}
                    >
                      <Label htmlFor="name" className="font-medium">
                        Full Name
                      </Label>
                      <Input 
                        id="name" 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Enter your full name" 
                        required 
                        className="border-2 border-foreground" 
                      />
                    </div>
                  )}

                  {/* Email - with role-specific labeling */}
                  <div 
                    className="space-y-2 animate-fade-in"
                    style={{ animationDelay: mode === 'signup' ? (config.showOrganization ? '100ms' : '50ms') : '0ms' }}
                  >
                    <Label htmlFor="email" className="font-medium flex items-center gap-2">
                      {mode === 'signup' && selectedRole === 'coordinator' && (
                        <Landmark className="h-4 w-4 text-severity-critical" />
                      )}
                      {config.emailLabel}
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder={mode === 'signup' ? config.emailPlaceholder : 'Enter your email'} 
                      required 
                      className="border-2 border-foreground" 
                    />
                    {mode === 'signup' && config.emailHint && (
                      <p className="text-xs text-muted-foreground font-mono animate-fade-in">
                        {config.emailHint}
                      </p>
                    )}
                  </div>

                  {/* Password Section */}
                  <div 
                    className="space-y-3 animate-fade-in"
                    style={{ animationDelay: mode === 'signup' ? (config.showOrganization ? '150ms' : '100ms') : '50ms' }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="password" className="font-medium">
                        Password
                      </Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={e => {
                          setPassword(e.target.value);
                          if (mode === 'signup') setShowPasswordFeedback(true);
                        }} 
                        placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                        required 
                        className="border-2 border-foreground" 
                      />
                      
                      {/* Password Strength Feedback - Signup only */}
                      {mode === 'signup' && showPasswordFeedback && (
                        <div className="space-y-3 pt-2 animate-fade-in">
                          {/* Strength Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono text-muted-foreground">PASSWORD STRENGTH</span>
                              <span className={cn(
                                "text-xs font-medium",
                                passwordValidation.strength < 50 && "text-severity-high",
                                passwordValidation.strength >= 50 && passwordValidation.strength < 100 && "text-severity-medium",
                                passwordValidation.strength === 100 && "text-status-resolved"
                              )}>
                                {passwordValidation.strength < 50 ? 'Weak' : 
                                 passwordValidation.strength < 100 ? 'Getting there' : 'Strong'}
                              </span>
                            </div>
                            <Progress 
                              value={passwordValidation.strength} 
                              className={cn(
                                "h-1.5 border border-border",
                                passwordValidation.strength < 50 && "[&>div]:bg-severity-high",
                                passwordValidation.strength >= 50 && passwordValidation.strength < 100 && "[&>div]:bg-severity-medium",
                                passwordValidation.strength === 100 && "[&>div]:bg-status-resolved"
                              )}
                            />
                          </div>
                          
                          {/* Password Requirements Checklist */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {passwordValidation.results.map(rule => (
                              <div 
                                key={rule.id}
                                className={cn(
                                  "flex items-center gap-1.5 text-xs transition-colors duration-200",
                                  rule.passed ? "text-status-resolved" : "text-muted-foreground"
                                )}
                              >
                                {rule.passed ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3 opacity-40" />
                                )}
                                <span>{rule.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Confirm Password - Signup only */}
                    {mode === 'signup' && (
                      <div className="space-y-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
                        <Label htmlFor="confirmPassword" className="font-medium">
                          Confirm Password
                        </Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)} 
                          placeholder="Confirm your password" 
                          required 
                          className={cn(
                            "border-2 transition-colors duration-200",
                            showMismatchError 
                              ? "border-severity-high focus-visible:ring-severity-high/30" 
                              : confirmPassword.length > 0 && passwordsMatch 
                                ? "border-status-resolved focus-visible:ring-status-resolved/30"
                                : "border-foreground"
                          )}
                        />
                        {showMismatchError && (
                          <p className="text-xs text-severity-high font-medium animate-fade-in flex items-center gap-1.5">
                            <X className="h-3 w-3" />
                            Passwords do not match
                          </p>
                        )}
                        {confirmPassword.length > 0 && passwordsMatch && (
                          <p className="text-xs text-status-resolved font-medium animate-fade-in flex items-center gap-1.5">
                            <Check className="h-3 w-3" />
                            Passwords match
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div
                    className="animate-fade-in pt-2"
                    style={{ animationDelay: mode === 'signup' ? (config.showOrganization ? '200ms' : '150ms') : '100ms' }}
                  >
                    <Button 
                      type="submit" 
                      disabled={mode === 'signup' && !isSignupValid}
                      className={cn(
                        "w-full border-2 border-foreground text-base font-bold transition-all duration-200",
                        mode === 'signup' && selectedRole === 'coordinator' && "bg-severity-critical hover:bg-severity-critical/90",
                        mode === 'signup' && selectedRole === 'agency' && "bg-severity-high hover:bg-severity-high/90",
                        mode === 'signup' && !isSignupValid && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      {mode === 'login' ? 'Access System' : (
                        selectedRole === 'coordinator' ? 'Register Coordinator Account' :
                        selectedRole === 'agency' ? 'Register Agency Account' :
                        'Create Community Account'
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button 
                    type="button" 
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}