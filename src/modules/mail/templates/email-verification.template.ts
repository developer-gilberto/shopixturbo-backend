type VerificationEmailTemplateProps = {
  verificationUrl: string;
  appName: string;
  tokenExpirationInText: string;
};

export function getVerificationEmailTemplate({
  verificationUrl,
  appName,
  tokenExpirationInText,
}: VerificationEmailTemplateProps): string {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <body style="margin:0; padding:0; background-color:#0f0f0f; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
        <tr>
          <td align="center">

            <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a; border-radius:12px; overflow:hidden;">

              <!-- Logo -->
              <tr>
                <td align="center" style="padding: 30px 20px;">
                  <img src="cid:logo" alt="${appName}" style="max-width:220px;" />
                </td>
              </tr>

              <!-- Conteúdo -->
              <tr>
                <td style="padding: 20px 30px; color:#ffffff; text-align:center;">

                  <h1 style="color:#ff7a00;">Ative sua conta 🚀</h1>

                  <p style="color:#cccccc;">
                    Clique no botão abaixo para ativar sua conta no <strong>${appName}</strong>.
                  </p>

                  <a
                    href="${verificationUrl}"
                    style="
                      display:inline-block;
                      margin-top:20px;
                      padding:14px 28px;
                      background:linear-gradient(90deg,#ff7a00,#ff3c00);
                      color:#ffffff;
                      text-decoration:none;
                      font-weight:bold;
                      border-radius:8px;
                    "
                  >
                    Ativar Conta
                  </a>

                  <p style="margin-top:20px; font-size:14px; color:#aaaaaa;">
                    Ou copie o link abaixo e abra no seu navegador:
                  </p>

                  <p style="font-size:13px; color:#ffb366;">
                    ${verificationUrl}
                  </p>

                  <p style="margin-top:15px; font-size:12px; color:#888;">
                    Este link expira em ${tokenExpirationInText}.
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
