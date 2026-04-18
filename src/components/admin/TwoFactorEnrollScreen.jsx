import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Smartphone, KeyRound, Copy, CheckCircle2, Download, AlertTriangle } from 'lucide-react';

// Forced enrollment on first access.
// Step 1 — TOTP setup (QR code + verify)
// Step 2 — PIN creation (6 digits + confirmation)
// Step 3 — Backup codes (download & confirm saved)

export default function TwoFactorEnrollScreen({ userEmail, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState('');
  const [otpauthUri, setOtpauthUri] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('twoFactorEnrollStart', {});
        setSecret(res.data?.secret || '');
        setOtpauthUri(res.data?.otpauthUri || '');
      } catch {
        setError('Erro ao iniciar 2FA. Recarregue a página.');
      }
      setLoading(false);
    })();
  }, []);

  const qrImgSrc = otpauthUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUri)}`
    : '';

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleStep1 = async () => {
    if (!/^\d{6}$/.test(totpCode)) { setError('Digite o código de 6 dígitos do app autenticador'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('twoFactorEnrollVerifyTotp', { totpCode });
      if (res.data?.success) {
        setStep(2);
      } else {
        setError(res.data?.error || 'Código TOTP inválido');
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Código TOTP inválido. Tente novamente.');
    }
    setLoading(false);
  };

  const handleFinalize = async () => {
    if (!/^\d{6}$/.test(pin)) { setError('PIN deve ter 6 dígitos numéricos'); return; }
    if (pin !== pinConfirm) { setError('PINs não coincidem'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('twoFactorEnrollConfirm', { totpCode, pin });
      if (res.data?.success) {
        setBackupCodes(res.data.backupCodes || []);
        setStep(3);
      } else {
        setError(res.data?.error || 'Erro ao finalizar');
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Código TOTP inválido. Tente novamente.');
    }
    setLoading(false);
  };

  const downloadBackup = () => {
    const content = `PAGSMILE — CÓDIGOS DE BACKUP 2FA\nUsuário: ${userEmail}\nGerado: ${new Date().toLocaleString('pt-BR')}\n\n${backupCodes.join('\n')}\n\nCada código pode ser usado UMA ÚNICA VEZ caso você perca acesso ao app autenticador.\nGuarde em local seguro (cofre, gerenciador de senhas).`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pagsmile-backup-codes.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#002443] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#2bc196]/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#2bc196]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Configurar Autenticação em 3 Fatores</h1>
          <p className="text-white/50 text-sm">Passo obrigatório no primeiro acesso.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1.5 w-16 rounded-full transition-all ${step >= n ? 'bg-[#2bc196]' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          {/* ═══ Step 1: TOTP ═══ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white mb-2">
                <Smartphone className="w-5 h-5 text-[#2bc196]" />
                <h2 className="font-semibold">Passo 1 — Google Authenticator</h2>
              </div>
              <p className="text-xs text-white/60">
                Instale o app <strong>Google Authenticator</strong>, <strong>Authy</strong> ou <strong>1Password</strong> no seu celular
                e escaneie o QR code abaixo:
              </p>
              {loading && !otpauthUri ? (
                <div className="h-56 flex items-center justify-center text-white/40">Gerando QR code...</div>
              ) : (
                <>
                  <div className="bg-white p-3 rounded-xl mx-auto w-fit">
                    {qrImgSrc && <img src={qrImgSrc} alt="QR Code" className="w-52 h-52" />}
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Não consegue escanear? Use este código:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-[#2bc196] font-mono flex-1 break-all">{secret}</code>
                      <button onClick={copySecret} className="text-white/50 hover:text-white p-1">
                        {copiedSecret ? <CheckCircle2 className="w-4 h-4 text-[#2bc196]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-medium mb-1.5 block">Digite o código de 6 dígitos do app</label>
                    <Input
                      type="text" inputMode="numeric" maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="bg-white/10 border-white/10 text-white text-center text-2xl tracking-[0.5em] h-14 rounded-xl focus:border-[#2bc196] focus:ring-[#2bc196]"
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button onClick={handleStep1} disabled={loading || totpCode.length !== 6} className="w-full h-12 bg-[#2bc196] hover:bg-[#2bc196]/90">
                    {loading ? 'Verificando...' : 'Próximo →'}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ═══ Step 2: PIN ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white mb-2">
                <KeyRound className="w-5 h-5 text-[#2bc196]" />
                <h2 className="font-semibold">Passo 2 — Criar PIN Pessoal</h2>
              </div>
              <p className="text-xs text-white/60">
                Crie um <strong>PIN de 6 dígitos numéricos</strong> que você irá digitar junto com o código TOTP.
                Escolha algo memorável mas não óbvio (evite 123456, datas de nascimento, etc).
              </p>
              <div>
                <label className="text-white/60 text-xs font-medium mb-1.5 block">PIN (6 dígitos)</label>
                <Input
                  type="password" inputMode="numeric" maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="bg-white/10 border-white/10 text-white text-center text-2xl tracking-[0.5em] h-14 rounded-xl"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-white/60 text-xs font-medium mb-1.5 block">Confirme o PIN</label>
                <Input
                  type="password" inputMode="numeric" maxLength={6}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  className="bg-white/10 border-white/10 text-white text-center text-2xl tracking-[0.5em] h-14 rounded-xl"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setError(''); setStep(1); }} className="flex-1 h-12 border-white/20 text-white bg-transparent hover:bg-white/5">
                  ← Voltar
                </Button>
                <Button onClick={handleFinalize} disabled={loading || pin.length !== 6 || pinConfirm.length !== 6} className="flex-1 h-12 bg-[#2bc196] hover:bg-[#2bc196]/90">
                  {loading ? 'Salvando...' : 'Finalizar'}
                </Button>
              </div>
            </div>
          )}

          {/* ═══ Step 3: Backup Codes ═══ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white mb-2">
                <Download className="w-5 h-5 text-[#2bc196]" />
                <h2 className="font-semibold">Passo 3 — Códigos de Backup</h2>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-100">
                  Guarde estes <strong>10 códigos</strong> em local seguro. Cada um pode ser usado <strong>uma única vez</strong> para entrar caso você perca acesso ao Google Authenticator.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i} className="text-[#2bc196] bg-black/20 px-2 py-1.5 rounded text-center">{code}</div>
                ))}
              </div>
              <Button onClick={downloadBackup} variant="outline" className="w-full h-11 border-white/20 text-white bg-transparent hover:bg-white/5">
                <Download className="w-4 h-4 mr-2" /> Baixar códigos (.txt)
              </Button>
              <Button onClick={onComplete} className="w-full h-12 bg-[#2bc196] hover:bg-[#2bc196]/90">
                Concluí, guardei em local seguro →
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          &copy; {new Date().getFullYear()} Pagsmile — Acesso restrito
        </p>
      </div>
    </div>
  );
}