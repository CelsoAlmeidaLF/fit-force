/**
 * Adaptador de Segurança: Hashing Criptográfico e Biometria WebAuthn
 */
export class BiometricsAdapter {
  static async hashPin(pin) {
    try {
      const data = new TextEncoder().encode('fit-forca:' + pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {
      // Fallback djb2
      let h = 0;
      for (const c of 'forca:' + pin) {
        h = (h * 31 + c.charCodeAt(0)) | 0;
      }
      return 'x' + h;
    }
  }

  static async isBiometricsAvailable() {
    return !!(
      window.PublicKeyCredential &&
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  }

  static async authenticateBiometrics(credentialIdBase64) {
    if (!window.PublicKeyCredential) return false;
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required'
        }
      });
      return !!cred;
    } catch (e) {
      console.warn('[BiometricsAdapter] Falha na validação biométrica:', e);
      return false;
    }
  }
}
